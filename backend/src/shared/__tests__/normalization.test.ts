import { describe, it, expect } from 'vitest';
import { normalizeString, isAnswerCorrect, checkAnswerMatch, generateTitleCue } from '../normalization/index.js';

describe('normalizeString', () => {
  it('handles basic trimming and lowercase', () => {
    expect(normalizeString('  Hello World  ')).toBe('hello world');
  });

  it('strips accents and diacritics', () => {
    expect(normalizeString('café')).toBe('cafe');
    expect(normalizeString('naïve')).toBe('naive');
    expect(normalizeString('résumé')).toBe('resume');
  });

  it('removes apostrophes and smart quotes', () => {
    expect(normalizeString("Don't Stop Believin'")).toBe('dont stop believin');
    expect(normalizeString('Rock ‘n’ Roll')).toBe('rock n roll');
  });

  it('handles ampersand expansion and symbols', () => {
    expect(normalizeString('Simon & Garfunkel')).toBe('simon and garfunkel');
    expect(normalizeString('Song: Part 1 - Remastered')).toBe('song part 1 remastered');
  });

  it('preserves non-Latin scripts such as Devanagari', () => {
    expect(normalizeString('दिल से रे')).toBe('दिल से रे');
    expect(normalizeString('  तुझे देखा तो  ')).toBe('तुझे देखा तो');
  });
});

describe('isAnswerCorrect', () => {
  const canonical = 'Chaiyya Chaiyya';
  const aliases = ['Chaiya Chaiya', 'छैंया छैंया', 'Chaiyya Chaiyya - From Dil Se'];

  it('matches exact canonical title', () => {
    expect(isAnswerCorrect('Chaiyya Chaiyya', canonical, aliases)).toBe(true);
  });

  it('matches case-insensitively with punctuation difference', () => {
    expect(isAnswerCorrect('chaiyya chaiyya!', canonical, aliases)).toBe(true);
    expect(isAnswerCorrect('  CHAIYYA   CHAIYYA  ', canonical, aliases)).toBe(true);
  });

  it('matches accepted aliases including Devanagari transliteration', () => {
    expect(isAnswerCorrect('chaiya chaiya', canonical, aliases)).toBe(true);
    expect(isAnswerCorrect('छैंया छैंया', canonical, aliases)).toBe(true);
  });

  it('rejects incorrect or unrelated guesses', () => {
    expect(isAnswerCorrect('Chaiyya', canonical, aliases)).toBe(false);
    expect(isAnswerCorrect('Dil Se Re', canonical, aliases)).toBe(false);
    expect(isAnswerCorrect('', canonical, aliases)).toBe(false);
    expect(isAnswerCorrect('   ', canonical, aliases)).toBe(false);
  });
});

describe('checkAnswerMatch and close indicator', () => {
  const canonical = 'Tum Hi Ho';
  const aliases = ['Tum Hi Ho - Aashiqui 2', 'तुम ही हो'];

  it('marks exact match as isCorrect: true, isClose: false', () => {
    const res = checkAnswerMatch('tum hi ho', canonical, aliases);
    expect(res.isCorrect).toBe(true);
    expect(res.isClose).toBe(false);
  });

  it('matches completely case-insensitively (UPPERCASE, lowercase, mixed case)', () => {
    expect(checkAnswerMatch('TUM HI HO', canonical, aliases).isCorrect).toBe(true);
    expect(checkAnswerMatch('Tum Hi Ho', canonical, aliases).isCorrect).toBe(true);
    expect(checkAnswerMatch('tUm Hi hO', canonical, aliases).isCorrect).toBe(true);
    expect(checkAnswerMatch('tum hi ho', canonical, aliases).isCorrect).toBe(true);
  });

  it('matches titles with parentheticals / subtitles stripped', () => {
    expect(checkAnswerMatch('kalank', 'Kalank (Title Track)', []).isCorrect).toBe(true);
    expect(checkAnswerMatch('KALANK', 'Kalank (Title Track)', []).isCorrect).toBe(true);
    expect(checkAnswerMatch('ae dil hai mushkil', 'Ae Dil Hai Mushkil (Title Track)', []).isCorrect).toBe(true);
    expect(checkAnswerMatch('shape of you', 'Shape of You - Remastered', []).isCorrect).toBe(true);
  });

  it('matches space-omitted guesses (e.g. tumhiho)', () => {
    expect(checkAnswerMatch('tumhiho', canonical, aliases).isCorrect).toBe(true);
  });

  it('marks 1-typo guess as isClose: true (close enough indicator)', () => {
    const res = checkAnswerMatch('tum hi h', canonical, aliases);
    expect(res.isCorrect).toBe(false);
    expect(res.isClose).toBe(true);
  });

  it('marks unrelated guess as both false', () => {
    const res = checkAnswerMatch('Chaiyya Chaiyya', canonical, aliases);
    expect(res.isCorrect).toBe(false);
    expect(res.isClose).toBe(false);
  });
});

describe('generateTitleCue', () => {
  it('reveals last word and masks preceding words for multi-word titles', () => {
    const cue = generateTitleCue('Right Now');
    expect(cue).toBe('_____ now');
  });

  it('masks multi-word Bollywood titles like Tum Hi Ho', () => {
    const cue = generateTitleCue('Tum Hi Ho');
    expect(cue).toBe('___ __ ho');
  });

  it('reveals first and last letter for single long word', () => {
    const cue = generateTitleCue('Believer');
    expect(cue).toBe('B _ _ _ _ _ _ r');
  });
});

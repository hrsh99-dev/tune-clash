/**
 * Normalizes text for music title and answer matching:
 * - Trims leading and trailing whitespace
 * - Converts to lowercase
 * - Strips combining diacritics (e.g. café -> cafe)
 * - Normalizes quotes, apostrophes, dashes, and special characters
 * - Keeps alphanumeric characters and Devanagari/regional scripts
 * - Collapses multiple spaces into a single space
 */
export function normalizeString(text: string): string {
  if (!text) return '';

  return text
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // remove Latin decomposed diacritics
    .replace(/['’`"]/g, '') // remove quotes/apostrophes (e.g. don't -> dont)
    .replace(/[&\+]/g, ' and ') // standard ampersand expansion
    .replace(/[^\p{L}\p{M}\p{N}\s]/gu, ' ') // replace punctuation/symbols with space while preserving Unicode letters, marks & numbers
    .replace(/\s+/g, ' ') // collapse multiple spaces
    .trim();
}

/**
 * Calculates standard Levenshtein edit distance between two strings
 */
export function getLevenshteinDistance(a: string, b: string): number {
  const m = a.length;
  const n = b.length;
  if (m === 0) return n;
  if (n === 0) return m;

  const matrix: number[][] = [];
  for (let i = 0; i <= m; i++) {
    matrix[i] = [i];
  }
  for (let j = 0; j <= n; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1, // deletion
        matrix[i][j - 1] + 1, // insertion
        matrix[i - 1][j - 1] + cost // substitution
      );
    }
  }

  return matrix[m][n];
}

export interface AnswerMatchResult {
  isCorrect: boolean;
  isClose: boolean;
  normalizedGuess: string;
}

/**
 * Strips common parentheticals and soundtrack subtitles from titles:
 * E.g. "Kalank (Title Track)" -> "Kalank"
 * E.g. "Tum Hi Ho (From Aashiqui 2)" -> "Tum Hi Ho"
 * E.g. "Shape of You - Remastered" -> "Shape of You"
 */
export function stripTitleMeta(title: string): string {
  if (!title) return '';
  return title
    .replace(/\(.*?\)/g, '')
    .replace(/\[.*?\]/g, '')
    .replace(/\s*-\s*(title track|from\s.*|remastered|remix|version|audio|video|soundtrack|feat.*|ft.*).*$/i, '')
    .trim();
}

/**
 * Checks whether an answer matches canonical title or any accepted aliases,
 * completely case-insensitively, accent-insensitively, and typo-tolerantly.
 */
export function checkAnswerMatch(
  guess: string,
  canonicalTitle: string,
  acceptedAnswers: string[] = []
): AnswerMatchResult {
  const normalizedGuess = normalizeString(guess);
  if (!normalizedGuess) {
    return { isCorrect: false, isClose: false, normalizedGuess };
  }

  // Include original titles/aliases AND versions with metadata/parentheticals stripped
  const rawList = [canonicalTitle, ...acceptedAnswers];
  const strippedList = rawList.map(stripTitleMeta).filter(Boolean);

  const targets = Array.from(
    new Set([...rawList, ...strippedList].map((t) => normalizeString(t)).filter(Boolean))
  );

  // 1. Case-insensitive, accent-insensitive exact match
  for (const target of targets) {
    if (normalizedGuess === target) {
      return { isCorrect: true, isClose: false, normalizedGuess };
    }
  }

  // 2. Exact match ignoring spaces (e.g. "tumhiho" vs "tum hi ho")
  const guessNoSpace = normalizedGuess.replace(/\s+/g, '');
  if (guessNoSpace.length >= 3) {
    for (const target of targets) {
      if (guessNoSpace === target.replace(/\s+/g, '')) {
        return { isCorrect: true, isClose: false, normalizedGuess };
      }
    }
  }

  // 3. Check proximity / close enough indicator
  let isClose = false;
  for (const target of targets) {
    const dist = getLevenshteinDistance(normalizedGuess, target);
    const maxLen = Math.max(normalizedGuess.length, target.length);

    // Minor typo: distance 1 for length >= 4, or distance <= 2 for length >= 7
    if ((dist === 1 && maxLen >= 4) || (dist === 2 && maxLen >= 7)) {
      isClose = true;
      break;
    }

    // High similarity ratio (>= 80%) for longer titles
    const similarity = 1 - dist / maxLen;
    if (similarity >= 0.8 && maxLen >= 6) {
      isClose = true;
      break;
    }
  }

  return { isCorrect: false, isClose, normalizedGuess };
}

/**
 * Backward-compatible helper checking only exact match
 */
export function isAnswerCorrect(
  guess: string,
  canonicalTitle: string,
  acceptedAnswers: string[] = []
): boolean {
  return checkAnswerMatch(guess, canonicalTitle, acceptedAnswers).isCorrect;
}

/**
 * Generates an informative masked hint/cue for a title:
 * E.g. "Right Now" -> "_______ now"
 * E.g. "Tum Hi Ho" -> "___ __ ho"
 * E.g. "Believer"  -> "B _ _ _ _ _ r"
 */
export function generateTitleCue(title: string): string {
  if (!title) return '';

  // Clean trailing parentheticals (e.g., "(From Movie)" or "- Remastered")
  const cleanTitle = title.replace(/\(.*?\)/g, '').replace(/\[.*?\]/g, '').replace(/-.*$/, '').trim();
  const words = cleanTitle.split(/\s+/).filter(Boolean);

  if (words.length === 1) {
    const word = words[0];
    if (word.length <= 3) {
      return word;
    }
    // Reveal first and last letter
    const middleUnderscores = '_ '.repeat(word.length - 2).trim();
    return `${word[0]} ${middleUnderscores} ${word[word.length - 1]}`;
  }

  // Multi-word title: mask all words except the last word
  const maskedWords = words.map((w, index) => {
    // If it's the last word, reveal it in lowercase or original casing
    if (index === words.length - 1) {
      return w.toLowerCase();
    }
    // If it's a common 2-letter connector (e.g. "of", "in", "to"), we can leave it or mask it
    if (['of', 'in', 'to', 'the'].includes(w.toLowerCase()) && words.length > 2) {
      return w.toLowerCase();
    }
    // Mask word with underscores
    return '_'.repeat(w.length);
  });

  return maskedWords.join(' ');
}

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Helper to write 16-bit PCM WAV file
function createWavBuffer(samples, sampleRate = 44100) {
  const byteRate = sampleRate * 2; // 1 channel, 16-bit (2 bytes)
  const blockAlign = 2;
  const dataSize = samples.length * 2;
  const buffer = Buffer.alloc(44 + dataSize);

  // RIFF chunk descriptor
  buffer.write('RIFF', 0);
  buffer.writeUInt32LE(36 + dataSize, 4);
  buffer.write('WAVE', 8);

  // fmt sub-chunk
  buffer.write('fmt ', 12);
  buffer.writeUInt32LE(16, 16); // subchunk1size (16 for PCM)
  buffer.writeUInt16LE(1, 20); // audio format (1 = PCM)
  buffer.writeUInt16LE(1, 22); // num channels (1 = mono)
  buffer.writeUInt32LE(sampleRate, 24);
  buffer.writeUInt32LE(byteRate, 28);
  buffer.writeUInt16LE(blockAlign, 32);
  buffer.writeUInt16LE(16, 34); // bits per sample

  // data sub-chunk
  buffer.write('data', 36);
  buffer.writeUInt32LE(dataSize, 40);

  // write 16-bit signed PCM samples
  for (let i = 0; i < samples.length; i++) {
    const s = Math.max(-1, Math.min(1, samples[i]));
    const val = s < 0 ? s * 0x8000 : s * 0x7fff;
    buffer.writeInt16LE(Math.round(val), 44 + i * 2);
  }

  return buffer;
}

// Frequencies for standard musical notes
const NOTES = {
  C3: 130.81, D3: 146.83, E3: 164.81, F3: 174.61, G3: 196.0, A3: 220.0, B3: 246.94,
  C4: 261.63, D4: 293.66, E4: 329.63, F4: 349.23, G4: 392.0, A4: 440.0, B4: 493.88,
  C5: 523.25, D5: 587.33, E5: 659.25, F5: 698.46, G5: 783.99, A5: 880.0, B5: 987.77,
  C6: 1046.50
};

// Generates a melodic sequence with bass and percussion
function synthesizeTrack(pattern, tempoBpm = 120, durationSec = 9, waveform = 'sine') {
  const sampleRate = 44100;
  const totalSamples = Math.floor(sampleRate * durationSec);
  const samples = new Float32Array(totalSamples);
  const beatSec = 60 / tempoBpm;

  // Synthesize each note event in pattern
  for (const event of pattern) {
    const startSample = Math.floor(event.time * beatSec * sampleRate);
    const noteDuration = event.duration * beatSec;
    const noteSamples = Math.floor(noteDuration * sampleRate);
    const freq = NOTES[event.note] || event.freq || 440;
    const vol = event.vol || 0.4;

    for (let i = 0; i < noteSamples; i++) {
      const idx = startSample + i;
      if (idx >= totalSamples) break;

      const t = i / sampleRate;
      // ADSR envelope: 15ms attack, exp decay
      const attack = Math.min(1, i / (sampleRate * 0.015));
      const decay = Math.exp(-3 * (t / noteDuration));
      const env = attack * decay;

      let wave = 0;
      if (waveform === 'sine') {
        wave = Math.sin(2 * Math.PI * freq * t) + 0.3 * Math.sin(4 * Math.PI * freq * t);
      } else if (waveform === 'triangle') {
        wave = Math.asin(Math.sin(2 * Math.PI * freq * t)) * (2 / Math.PI);
      } else if (waveform === 'square') {
        wave = Math.sin(2 * Math.PI * freq * t) >= 0 ? 0.7 : -0.7;
      } else if (waveform === 'saw') {
        wave = 2 * ((freq * t) % 1) - 1;
      }

      samples[idx] += wave * env * vol;
    }
  }

  // Add subtle rhythmic percussion ticks on every beat
  const totalBeats = Math.floor(durationSec / beatSec);
  for (let b = 0; b < totalBeats; b++) {
    const startSample = Math.floor(b * beatSec * sampleRate);
    const isDownbeat = b % 2 === 0;
    const clickDuration = isDownbeat ? 0.04 : 0.02;
    const clickSamples = Math.floor(clickDuration * sampleRate);

    for (let i = 0; i < clickSamples; i++) {
      const idx = startSample + i;
      if (idx >= totalSamples) break;
      const decay = 1 - i / clickSamples;
      const noise = (Math.random() * 2 - 1) * decay * (isDownbeat ? 0.25 : 0.12);
      samples[idx] += noise;
    }
  }

  // Normalize samples to avoid clipping
  let maxAmp = 0.001;
  for (let i = 0; i < totalSamples; i++) {
    if (Math.abs(samples[i]) > maxAmp) maxAmp = Math.abs(samples[i]);
  }
  const gain = 0.85 / maxAmp;
  for (let i = 0; i < totalSamples; i++) {
    samples[i] *= gain;
  }

  return createWavBuffer(samples, sampleRate);
}

// 6 distinct demo tracks
export const DEMO_TRACKS = [
  {
    slug: 'neon-sunrise',
    title: 'Neon Sunrise',
    artists: ['TuneClash Synthetic Ensemble'],
    acceptedAnswers: ['Neon Sunrise', 'Neon Sunrise Demo', 'Sunrise Neon'],
    languages: ['English'],
    categories: ['Hollywood', 'Indie'],
    genres: ['Synthwave', 'Electronic'],
    era: '2020s',
    difficulty: 1,
    tags: ['synth', 'upbeat', 'demo'],
    tempo: 125,
    waveform: 'saw',
    pattern: [
      { note: 'A4', time: 0, duration: 0.5 },
      { note: 'C5', time: 0.5, duration: 0.5 },
      { note: 'E5', time: 1.0, duration: 0.5 },
      { note: 'G5', time: 1.5, duration: 0.5 },
      { note: 'A5', time: 2.0, duration: 1.0 },
      { note: 'G5', time: 3.0, duration: 0.5 },
      { note: 'E5', time: 3.5, duration: 0.5 },
      { note: 'D5', time: 4.0, duration: 0.5 },
      { note: 'E5', time: 4.5, duration: 0.5 },
      { note: 'C5', time: 5.0, duration: 1.0 },
      { note: 'A4', time: 6.0, duration: 0.5 },
      { note: 'C5', time: 6.5, duration: 0.5 },
      { note: 'D5', time: 7.0, duration: 0.5 },
      { note: 'E5', time: 7.5, duration: 0.5 },
      { note: 'A4', time: 8.0, duration: 1.5 },
    ]
  },
  {
    slug: 'midnight-groove',
    title: 'Midnight Groove',
    artists: ['The Silicon Quintet'],
    acceptedAnswers: ['Midnight Groove', 'Groove at Midnight', 'Midnight Groove Demo'],
    languages: ['English'],
    categories: ['Hollywood', 'Indie'],
    genres: ['Funk', 'Pop'],
    era: '2010s',
    difficulty: 2,
    tags: ['funk', 'bass', 'demo'],
    tempo: 112,
    waveform: 'sine',
    pattern: [
      { note: 'D3', time: 0, duration: 0.75, vol: 0.6 },
      { note: 'F3', time: 0.75, duration: 0.25, vol: 0.5 },
      { note: 'G3', time: 1.0, duration: 0.5, vol: 0.5 },
      { note: 'A3', time: 1.5, duration: 0.5, vol: 0.5 },
      { note: 'C4', time: 2.0, duration: 0.75, vol: 0.6 },
      { note: 'D4', time: 3.0, duration: 0.5, vol: 0.6 },
      { note: 'C4', time: 3.5, duration: 0.5, vol: 0.5 },
      { note: 'A3', time: 4.0, duration: 0.75, vol: 0.5 },
      { note: 'G3', time: 4.75, duration: 0.25, vol: 0.5 },
      { note: 'F3', time: 5.0, duration: 0.5, vol: 0.5 },
      { note: 'D3', time: 5.5, duration: 1.5, vol: 0.6 },
      { note: 'C3', time: 7.0, duration: 0.5, vol: 0.5 },
      { note: 'D3', time: 7.5, duration: 1.5, vol: 0.6 },
    ]
  },
  {
    slug: 'retro-breeze',
    title: 'Retro Breeze',
    artists: ['Pixel Melodies'],
    acceptedAnswers: ['Retro Breeze', 'Arcade Breeze', 'Retro Breeze Demo'],
    languages: ['English'],
    categories: ['Indie'],
    genres: ['Chiptune', 'Arcade'],
    era: '1980s',
    difficulty: 2,
    tags: ['chiptune', '8bit', 'demo'],
    tempo: 130,
    waveform: 'square',
    pattern: [
      { note: 'C5', time: 0, duration: 0.25 },
      { note: 'E5', time: 0.25, duration: 0.25 },
      { note: 'G5', time: 0.5, duration: 0.5 },
      { note: 'B4', time: 1.0, duration: 0.5 },
      { note: 'C5', time: 1.5, duration: 0.5 },
      { note: 'E5', time: 2.0, duration: 0.25 },
      { note: 'G5', time: 2.25, duration: 0.25 },
      { note: 'C6', time: 2.5, duration: 1.0 },
      { note: 'B5', time: 3.5, duration: 0.5 },
      { note: 'A5', time: 4.0, duration: 0.5 },
      { note: 'G5', time: 4.5, duration: 0.5 },
      { note: 'E5', time: 5.0, duration: 0.5 },
      { note: 'F5', time: 5.5, duration: 0.5 },
      { note: 'D5', time: 6.0, duration: 1.0 },
      { note: 'C5', time: 7.0, duration: 1.5 },
    ]
  },
  {
    slug: 'monsoon-rain',
    title: 'Monsoon Rain',
    artists: ['Sitar Waves Collective'],
    acceptedAnswers: ['Monsoon Rain', 'Barish Dhun', 'बारिश की धुन', 'Monsoon Rain Demo'],
    languages: ['Hindi', 'Regional'],
    categories: ['Bollywood', 'Regional'],
    genres: ['Folk', 'Fusion'],
    era: '2000s',
    difficulty: 3,
    tags: ['monsoon', 'classical', 'demo'],
    tempo: 105,
    waveform: 'triangle',
    pattern: [
      { note: 'D4', time: 0, duration: 0.5 },
      { note: 'E4', time: 0.5, duration: 0.5 },
      { note: 'G4', time: 1.0, duration: 1.0 },
      { note: 'A4', time: 2.0, duration: 0.5 },
      { note: 'C5', time: 2.5, duration: 0.5 },
      { note: 'D5', time: 3.0, duration: 1.25 },
      { note: 'C5', time: 4.25, duration: 0.5 },
      { note: 'A4', time: 4.75, duration: 0.5 },
      { note: 'G4', time: 5.25, duration: 0.75 },
      { note: 'E4', time: 6.0, duration: 0.5 },
      { note: 'D4', time: 6.5, duration: 1.5 },
      { note: 'C4', time: 8.0, duration: 0.5 },
      { note: 'D4', time: 8.5, duration: 1.5 },
    ]
  },
  {
    slug: 'carnival-hop',
    title: 'Carnival Hop',
    artists: ['Bhangra Brass Project'],
    acceptedAnswers: ['Carnival Hop', 'Mela Hop', 'मेला हॉप', 'Carnival Hop Demo'],
    languages: ['Hindi', 'Marathi'],
    categories: ['Bollywood', 'Regional'],
    genres: ['Bhangra', 'Dance'],
    era: '2010s',
    difficulty: 2,
    tags: ['bhangra', 'festive', 'demo'],
    tempo: 128,
    waveform: 'saw',
    pattern: [
      { note: 'G4', time: 0, duration: 0.5 },
      { note: 'G4', time: 0.5, duration: 0.5 },
      { note: 'B4', time: 1.0, duration: 0.5 },
      { note: 'D5', time: 1.5, duration: 0.5 },
      { note: 'E5', time: 2.0, duration: 0.75 },
      { note: 'D5', time: 2.75, duration: 0.25 },
      { note: 'B4', time: 3.0, duration: 0.5 },
      { note: 'G4', time: 3.5, duration: 0.5 },
      { note: 'A4', time: 4.0, duration: 0.5 },
      { note: 'B4', time: 4.5, duration: 0.5 },
      { note: 'C5', time: 5.0, duration: 0.5 },
      { note: 'B4', time: 5.5, duration: 0.5 },
      { note: 'A4', time: 6.0, duration: 0.5 },
      { note: 'G4', time: 6.5, duration: 1.5 },
    ]
  },
  {
    slug: 'starlight-waltz',
    title: 'Starlight Waltz',
    artists: ['Acoustic Horizon'],
    acceptedAnswers: ['Starlight Waltz', 'Tara Waltz', 'तारा वाल्ट्ज', 'Starlight Waltz Demo'],
    languages: ['English', 'Marathi'],
    categories: ['Indie', 'Regional'],
    genres: ['Acoustic', 'Lo-Fi'],
    era: '1990s',
    difficulty: 2,
    tags: ['waltz', 'peaceful', 'demo'],
    tempo: 96,
    waveform: 'sine',
    pattern: [
      { note: 'F4', time: 0, duration: 1.0 },
      { note: 'A4', time: 1.0, duration: 0.5 },
      { note: 'C5', time: 1.5, duration: 0.5 },
      { note: 'E5', time: 2.0, duration: 1.0 },
      { note: 'D5', time: 3.0, duration: 0.5 },
      { note: 'C5', time: 3.5, duration: 0.5 },
      { note: 'A4', time: 4.0, duration: 1.0 },
      { note: 'G4', time: 5.0, duration: 0.5 },
      { note: 'F4', time: 5.5, duration: 0.5 },
      { note: 'A4', time: 6.0, duration: 1.0 },
      { note: 'F4', time: 7.0, duration: 1.5 },
    ]
  }
];

export function generateAllDemoAudio(outputDir) {
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const generatedFiles = [];
  console.log(`Generating 6 synthetic demo audio files into: ${outputDir}`);

  for (const track of DEMO_TRACKS) {
    const filename = `${track.slug}.wav`;
    const filePath = path.join(outputDir, filename);
    const wavBuffer = synthesizeTrack(track.pattern, track.tempo, 8.5, track.waveform);
    fs.writeFileSync(filePath, wavBuffer);
    console.log(`✓ Generated ${filename} (${(wavBuffer.length / 1024).toFixed(1)} KB)`);
    generatedFiles.push({
      ...track,
      filename,
      filePath,
      fileSizeBytes: wavBuffer.length,
      durationMs: 8500
    });
  }

  return generatedFiles;
}

// If run directly from CLI
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const uploadsDir = path.resolve(__dirname, '../uploads/audio');
  generateAllDemoAudio(uploadsDir);
  console.log('Demo audio generation complete!');
}

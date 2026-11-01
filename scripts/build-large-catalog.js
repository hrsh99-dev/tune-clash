import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ARTIST_SOURCES = [
  // --- Bollywood Modern (2010s & 2020s) ---
  { term: 'Arijit Singh', category: 'Bollywood', language: 'Hindi', limit: 25 },
  { term: 'Pritam', category: 'Bollywood', language: 'Hindi', limit: 25 },
  { term: 'Neha Kakkar', category: 'Bollywood', language: 'Hindi', limit: 20 },
  { term: 'Badshah', category: 'Bollywood', language: 'Hindi', limit: 20 },
  { term: 'Atif Aslam', category: 'Bollywood', language: 'Hindi', limit: 25 },
  { term: 'Shreya Ghoshal', category: 'Bollywood', language: 'Hindi', limit: 25 },
  { term: 'Mohit Chauhan', category: 'Bollywood', language: 'Hindi', limit: 20 },
  { term: 'Amit Trivedi', category: 'Bollywood', language: 'Hindi', limit: 20 },
  { term: 'KK', category: 'Bollywood', language: 'Hindi', limit: 20 },
  { term: 'Vishal-Shekhar', category: 'Bollywood', language: 'Hindi', limit: 20 },
  { term: 'Sachin-Jigar', category: 'Bollywood', language: 'Hindi', limit: 20 },
  { term: 'Jubin Nautiyal', category: 'Bollywood', language: 'Hindi', limit: 20 },
  { term: 'B Praak', category: 'Bollywood', language: 'Hindi', limit: 15 },
  { term: 'Armaan Malik', category: 'Bollywood', language: 'Hindi', limit: 15 },
  { term: 'Diljit Dosanjh', category: 'Bollywood', language: 'Regional', limit: 20 },
  { term: 'AP Dhillon', category: 'Bollywood', language: 'Regional', limit: 15 },

  // --- Bollywood Golden Era (1990s & 2000s) ---
  { term: 'Sonu Nigam', category: 'Bollywood', language: 'Hindi', limit: 25 },
  { term: 'Udit Narayan', category: 'Bollywood', language: 'Hindi', limit: 25 },
  { term: 'Kumar Sanu', category: 'Bollywood', language: 'Hindi', limit: 25 },
  { term: 'Alka Yagnik', category: 'Bollywood', language: 'Hindi', limit: 25 },
  { term: 'A.R. Rahman', category: 'Bollywood', language: 'Hindi', limit: 30 },
  { term: 'Sunidhi Chauhan', category: 'Bollywood', language: 'Hindi', limit: 25 },
  { term: 'KK', category: 'Bollywood', language: 'Hindi', limit: 25 },
  { term: 'Shaan', category: 'Bollywood', language: 'Hindi', limit: 20 },
  { term: 'Himesh Reshammiya', category: 'Bollywood', language: 'Hindi', limit: 20 },
  { term: 'Lucky Ali', category: 'Bollywood', language: 'Hindi', limit: 15 },
  { term: 'Shankar-Ehsaan-Loy', category: 'Bollywood', language: 'Hindi', limit: 20 },
  { term: 'Jatin-Lalit', category: 'Bollywood', language: 'Hindi', limit: 20 },

  // --- Bollywood Retro Classics (1970s & 1980s) ---
  { term: 'Kishore Kumar', category: 'Bollywood', language: 'Hindi', limit: 30 },
  { term: 'Lata Mangeshkar', category: 'Bollywood', language: 'Hindi', limit: 30 },
  { term: 'Mohammed Rafi', category: 'Bollywood', language: 'Hindi', limit: 30 },
  { term: 'Asha Bhosle', category: 'Bollywood', language: 'Hindi', limit: 25 },
  { term: 'R.D. Burman', category: 'Bollywood', language: 'Hindi', limit: 25 },
  { term: 'Mukesh', category: 'Bollywood', language: 'Hindi', limit: 20 },
  { term: 'Bappi Lahiri', category: 'Bollywood', language: 'Hindi', limit: 20 },

  // --- Hollywood / Pop Top Hits (2010s & 2020s) ---
  { term: 'The Weeknd', category: 'Hollywood', language: 'English', limit: 25 },
  { term: 'Ed Sheeran', category: 'Hollywood', language: 'English', limit: 25 },
  { term: 'Dua Lipa', category: 'Hollywood', language: 'English', limit: 20 },
  { term: 'Drake', category: 'Hollywood', language: 'English', limit: 25 },
  { term: 'Ariana Grande', category: 'Hollywood', language: 'English', limit: 20 },
  { term: 'Harry Styles', category: 'Hollywood', language: 'English', limit: 20 },
  { term: 'Imagine Dragons', category: 'Hollywood', language: 'English', limit: 20 },
  { term: 'Maroon 5', category: 'Hollywood', language: 'English', limit: 20 },
  { term: 'Justin Bieber', category: 'Hollywood', language: 'English', limit: 20 },
  { term: 'Coldplay', category: 'Hollywood', language: 'English', limit: 25 },
  { term: 'Shawn Mendes', category: 'Hollywood', language: 'English', limit: 15 },
  { term: 'Eminem', category: 'Hollywood', language: 'English', limit: 20 },

  // --- Hollywood / Rock / Pop Classics (1970s, 1980s, 1990s) ---
  { term: 'Michael Jackson', category: 'Hollywood', language: 'English', limit: 30 },
  { term: 'Queen', category: 'Hollywood', language: 'English', limit: 25 },
  { term: 'The Beatles', category: 'Hollywood', language: 'English', limit: 25 },
  { term: 'Elton John', category: 'Hollywood', language: 'English', limit: 20 },
  { term: 'ABBA', category: 'Hollywood', language: 'English', limit: 20 },
  { term: 'Bee Gees', category: 'Hollywood', language: 'English', limit: 20 },
  { term: 'Eagles', category: 'Hollywood', language: 'English', limit: 15 },
  { term: 'Madonna', category: 'Hollywood', language: 'English', limit: 20 },
  { term: 'Whitney Houston', category: 'Hollywood', language: 'English', limit: 15 },
  { term: 'Backstreet Boys', category: 'Hollywood', language: 'English', limit: 15 },
  { term: 'Britney Spears', category: 'Hollywood', language: 'English', limit: 15 },
  { term: 'Linkin Park', category: 'Hollywood', language: 'English', limit: 20 },
  { term: 'Green Day', category: 'Hollywood', language: 'English', limit: 20 },
  { term: 'Nirvana', category: 'Hollywood', language: 'English', limit: 15 },
  { term: 'Bon Jovi', category: 'Hollywood', language: 'English', limit: 15 },
  { term: 'Guns N Roses', category: 'Hollywood', language: 'English', limit: 15 },
  { term: 'a-ha', category: 'Hollywood', language: 'English', limit: 10 },
];

function cleanTitle(raw) {
  if (!raw) return '';
  let str = raw;

  // Extract movie name if present like (From "Movie Name")
  let movie = null;
  const movieMatch = str.match(/\(From\s+["']([^"']+)["']\)/i) || str.match(/\[From\s+["']([^"']+)["']\]/i);
  if (movieMatch && movieMatch[1]) {
    movie = movieMatch[1].trim();
  }

  // Remove common parenthetical noise: (From "X"), [Remastered], (feat. Y), (Live), (Radio Edit)
  str = str.replace(/\s*[\(\[](from\s+["'].*?["']|feat\.?|remaster|soundtrack|version|original|motion\s+picture|live|deluxe|edit|radio|video|anniversary).*?[\)\]]/gi, '');
  // Remove suffixes like - Title Track, - Remastered 2011, - From "..."
  str = str.replace(/\s*-\s*(from\s+|soundtrack|bonus|single|radio|title\s+track|remaster).*$/gi, '');
  str = str.trim();

  // If title still has trailing punctuation or empty
  str = str.replace(/^["']|["']$/g, '').trim();

  return { title: str || raw, movie };
}

function getEra(releaseYear) {
  if (!releaseYear) return '2010s';
  const yr = Number(releaseYear);
  if (yr < 1980) return '1970s';
  if (yr < 1990) return '1980s';
  if (yr < 2000) return '1990s';
  if (yr < 2010) return '2000s';
  if (yr < 2020) return '2010s';
  return '2020s';
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchTracksForSource(source) {
  const url = `https://itunes.apple.com/search?term=${encodeURIComponent(source.term)}&media=music&limit=${source.limit || 20}`;
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(6000) });
    if (!res.ok) return [];
    const data = await res.json();
    if (!data.results) return [];

    return data.results
      .filter((r) => r.previewUrl && r.trackName && r.artistName)
      .map((r) => {
        const { title, movie } = cleanTitle(r.trackName);
        const releaseYear = r.releaseDate ? new Date(r.releaseDate).getFullYear() : 2020;
        const era = getEra(releaseYear);

        const acceptedAnswers = [title, r.trackName];
        if (movie && !acceptedAnswers.includes(movie)) {
          acceptedAnswers.push(movie);
        }

        // Add simplified version (no spaces/punctuation)
        const simplified = title.toLowerCase().replace(/[^a-z0-9]/g, ' ').replace(/\s+/g, ' ').trim();
        if (simplified && !acceptedAnswers.includes(simplified)) {
          acceptedAnswers.push(simplified);
        }

        return {
          title,
          originalTrackName: r.trackName,
          artists: [r.artistName],
          album: r.collectionName || '',
          previewUrl: r.previewUrl,
          artworkUrl: r.artworkUrl100 || r.artworkUrl60 || '',
          genre: r.primaryGenreName || 'Pop',
          releaseYear,
          era,
          languages: [source.language],
          categories: [source.category],
          acceptedAnswers,
          difficulty: 1,
          tags: [source.term.toLowerCase(), era, source.category.toLowerCase()],
        };
      });
  } catch (err) {
    console.warn(`Could not fetch for ${source.term}: ${err.message}`);
    return [];
  }
}

async function main() {
  console.log(`Starting catalog generator across ${ARTIST_SOURCES.length} artist sources...`);
  const allTracks = [];
  const seenSlugs = new Set();

  for (let i = 0; i < ARTIST_SOURCES.length; i++) {
    const source = ARTIST_SOURCES[i];
    console.log(`[${i + 1}/${ARTIST_SOURCES.length}] Searching for: ${source.term} (${source.category}/${source.language})...`);
    const tracks = await fetchTracksForSource(source);

    let addedCount = 0;
    for (const t of tracks) {
      // Slug for deduplication
      const slug = `${t.title}-${t.artists[0]}`.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
      if (!seenSlugs.has(slug) && t.title.length > 1) {
        seenSlugs.add(slug);
        allTracks.push({
          ...t,
          slug,
        });
        addedCount++;
      }
    }

    console.log(`  -> Added ${addedCount} tracks (Total Unique: ${allTracks.length})`);
    // Modest delay between calls to be polite to Apple API
    await sleep(250);
  }

  console.log(`\n========================================`);
  console.log(`Successfully collected ${allTracks.length} high-quality music tracks!`);
  console.log(`========================================\n`);

  // Target output path
  const targetDir = path.resolve(__dirname, '../backend/src/data');
  if (!fs.existsSync(targetDir)) {
    fs.mkdirSync(targetDir, { recursive: true });
  }

  const targetFile = path.join(targetDir, 'songs-catalog.json');
  fs.writeFileSync(targetFile, JSON.stringify(allTracks, null, 2), 'utf-8');
  console.log(`✓ Saved catalog to: ${targetFile}`);

  // Summary breakdown
  const bollywoodCount = allTracks.filter((t) => t.categories.includes('Bollywood')).length;
  const hollywoodCount = allTracks.filter((t) => t.categories.includes('Hollywood')).length;
  const hindiCount = allTracks.filter((t) => t.languages.includes('Hindi')).length;
  const englishCount = allTracks.filter((t) => t.languages.includes('English')).length;

  console.log(`Breakdown:`);
  console.log(`- Bollywood: ${bollywoodCount}`);
  console.log(`- Hollywood: ${hollywoodCount}`);
  console.log(`- Hindi: ${hindiCount}`);
  console.log(`- English: ${englishCount}`);
}

main().catch(console.error);

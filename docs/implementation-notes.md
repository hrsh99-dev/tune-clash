# Implementation Notes

## Key Design & Implementation Decisions

1. **Dual-Mode MongoDB Strategy**:
   - The user specified that the production MongoDB connection string and API keys will be supplied once development is complete.
   - To make the project 100% runnable, testable, and demonstrable immediately, the server checks if `MONGODB_URI` starts with `mongodb://` or `mongodb+srv://`. If unset or set to `memory`, it spins up `mongodb-memory-server` in development mode, ensuring zero setup friction. When the user sets their Atlas URI, it connects seamlessly.

2. **Synthetic Audio Generation**:
   - PRD section 10 forbids downloading or redistributing unlicensed commercial tracks.
   - We implemented a pure JavaScript PCM WAV synthesizer in `scripts/generate-demo-audio.js`. It writes clean, polyphonic 44.1kHz 16-bit stereo WAV audio with distinct catchy themes ("Neon Sunrise", "Midnight Groove", "Retro Breeze", "Monsoon Rain", "Carnival Hop", "Starlight Waltz").
   - These 6 original tracks have associated `MusicLicense` entries marked `synthetic_demo` with full gameplay clearance.

3. **Answer Matching & Normalization**:
   - Titles are normalized by lowercasing, stripping diacritics/accents, trimming whitespace, collapsing whitespace, and standardizing common punctuation (e.g. hyphens, apostrophes).
   - Accepted aliases are stored explicitly (e.g. English transliterations, Hindi/Devanagari forms).
   - Conservative exact matching on normalized tokens prevents false positives.

4. **Scoring Breakdown Pure Function**:
   - Base points: 500
   - Speed bonus: 0 to 500 points proportional to `(deadline - receivedTime) / answerWindow`
   - First correct bonus: +250 points
   - Streak bonus: +100 per consecutive round, max +300
   - Modifiers:
     - `Double Points`: 2x total round score
     - `Lightning`: 8-second window
     - `Comeback Boost`: +150 bonus points for bottom half players
     - `Sudden Death`: final round, no streak, first-correct +500

5. **Audio Storage Adapter**:
   - Files are stored with opaque UUID keys in `uploads/audio/` so that filename inspection does not leak song titles.
   - Files are served via `/api/assets/audio/:key`.

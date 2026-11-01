# Product Requirements Document (PRD)
## Multiplayer Music Guessing Party Game

**Working title:** Tune Clash (placeholder; make the name easy to change)  
**Document version:** 1.0  
**Date:** 29 October 2026  
**Status:** Implementation specification for Google Antigravity  
**Primary goal:** Build a complete, runnable, tested MVP from an empty repository without relying on unlicensed commercial music.

---

# 0. Instructions to the Antigravity coding agent

Treat this document as the source of truth. Build the application end to end, not just a mockup or a set of disconnected screens.

## Required working method

1. Inspect the repository and available runtime before changing anything. If it is empty, initialize the project using the architecture below.
2. Produce a short implementation plan and file/folder structure before coding. Then implement in small, verifiable milestones.
3. Use the exact product rules, data contracts, and acceptance criteria in this document. If a detail is unspecified, choose the simplest maintainable implementation and document the decision in `docs/implementation-notes.md`; do not stop to ask the product owner routine questions.
4. Use MongoDB as the primary database. Do not substitute PostgreSQL, Firebase/Firestore, or a browser-only mock database.
5. Make every visible button and link functional. Do not leave dead controls, fake success messages, placeholder navigation, or TODOs for core MVP functionality.
6. Do not scrape, download, embed, or redistribute commercial songs from Spotify, YouTube, or other services. Do not assume an eight-second clip is automatically lawful to use. The application must support approved user-uploaded tracks and a safe, original synthetic-demo catalog.
7. Do not store secrets in source control. Add `.env.example`, validate required environment variables at startup, and document local setup.
8. After each milestone, run the appropriate tests and fix failures before moving on. At the end, run formatting/linting, type checks, unit/integration tests, production build, and browser-level smoke tests where the environment supports them.
9. Verify the UI in a real browser at desktop and mobile viewport sizes. Inspect screenshots and correct layout, contrast, spacing, overflow, and interaction issues.
10. If an external credential or service is unavailable, complete and verify the local development path and explain the exact limitation. Do not silently skip the feature.
11. Do not claim a test passed unless you ran it and observed the result. Final response must summarize implemented features, commands run, test outcomes, and any genuine remaining limitation.

## Definition of complete

The MVP is complete only when a developer can clone/open the repository, configure environment variables, start the database and applications using the documented commands, create a private room in one browser, join it from another browser, play a game using demo tracks, submit guesses, receive server-calculated scores, see the leaderboard/results, and manage approved tracks through the admin interface. Automated tests must cover the critical rules below.

---

# 1. Product overview

## 1.1 Product vision

Create a friendly, low-friction browser party game in which friends join a room, listen to a short music clip (normally 7–8 seconds), and race to identify the song. The product should be casual and playful—not a casino, esports dashboard, or neon arcade. It should be fun in a group call or while friends are together.

The product's differentiators are:

- Fast private-room play without requiring every player to create an account.
- Music filters such as Bollywood, Hollywood, English, Hindi, Marathi, regional, genre, era, and difficulty.
- Responsive, near-synchronized multiplayer rounds.
- Friendly rivalry: streaks, comeback bonuses, chaos modifiers, and a satisfying final results screen.
- A catalog design that can grow from original/demo tracks to tracks properly licensed for gameplay.

## 1.2 Target users

- Friends looking for a quick online party game.
- Small groups of 2–12 players, typically playing on phones or laptops.
- Users with different levels of music knowledge, from casual listeners to enthusiasts.

## 1.3 Platforms

- Responsive web app for current desktop and mobile browsers.
- No native mobile application in the MVP.
- No account is required to join a private room. A host can start a room with a nickname.

## 1.4 Product principles

1. **Playable first:** a complete, small working game is better than a large incomplete feature set.
2. **Fairness:** the server is authoritative for room state, timers, answer validation, and scoring.
3. **Readable UI:** music, players, and the current round are the focus. Keep visual chrome quiet.
4. **Legal content handling:** track eligibility is explicit and auditable; no unauthorized music ingestion.
5. **Graceful failure:** show clear empty states, loading states, disconnected states, and actionable errors.
6. **Accessibility:** usable by keyboard, small screens, and common assistive technology.

---

# 2. MVP scope

## 2.1 In scope

- Landing page with concise explanation and two main actions: Create Room and Join Room.
- Nickname setup.
- Private room creation with a short shareable room code and copy-link action.
- Join room by room code.
- Waiting lobby with player list, host identity, selected filters, ready states, and host-only start control.
- Room options: languages, music categories/industries, era, difficulty, rounds, and chaos mode.
- 2–12 players per room. Host is included in the player count.
- Real-time rounds using Socket.IO.
- Eight-second track clip by default, with a configurable clip length only within allowed product bounds (6–10 seconds).
- Answer input, Enter-to-submit, submit button, attempt limits, answer feedback, timer, score, and live leaderboard.
- Server-side answer normalization and accepted aliases.
- Final results screen, rank display, playful stats, and Play Again flow.
- Built-in original synthetic demo melodies so the game works without third-party credentials or copyrighted tracks.
- Admin-only track catalog: create/edit tracks, add aliases, set filters/difficulty, upload audio, add rights/permission details, approve/unapprove, and preview audio.
- MongoDB persistence for tracks, rooms/sessions, results, and audit events as specified below.
- Local development setup, database setup, sample seed data, tests, and documentation.

## 2.2 Explicitly out of scope for MVP

Do not implement these unless the core MVP is complete and verified:

- Public matchmaking or global leaderboards.
- User accounts, social login, friends lists, and long-term player profiles.
- Voice chat, video, live streaming, or in-game text chat.
- Payments, subscriptions, ads, and prize money.
- Commercial Bollywood/Hollywood catalog licensing workflows with external licensors.
- Automatic Spotify/YouTube ingestion or song downloads.
- AI-based music identification, lyric transcription, or automatically scraped metadata.
- Native mobile apps.
- Redis or multi-server horizontal scaling. Keep architecture upgradeable, but do not make this a blocker.

---

# 3. UI/UX and visual design system

## 3.1 Design direction

Use a **normal, clean, bright-to-moderate, playful interface**. It should feel welcoming and polished, like a modern casual game—not aggressively bold or visually noisy.

Do not use neon colors, huge display typography, intense gradients, glow effects, excessive shadows, glassmorphism, parallax, excessive animation, large emoji decorations, or noisy backgrounds. Do not make every panel a card. Reserve strong color for primary actions, important status, and feedback.

## 3.2 Suggested design tokens

Implement these as central CSS variables/design tokens so they can be changed globally:

- Page background: `#F7F8FC`
- Primary surface: `#FFFFFF`
- Main text: `#20283A`
- Secondary text: `#647084`
- Primary action blue: `#4678E8`
- Secondary teal: `#2A9D8F`
- Soft playful accent yellow: `#F4C65D`
- Soft positive green: `#27845A`
- Error red: `#C94C4C`
- Border: `#E4E8F0`
- Muted surface: `#EFF3F9`

Use a neutral system sans-serif stack or a well-supported font such as Inter. Use a clear type scale: body text around 14–16 px, section headings around 20–26 px, and page headings around 28–36 px. Avoid using extra-bold fonts throughout the UI.

- Border radius: 8–14 px; use pill shapes only for tags and small status chips.
- Shadows: subtle, low-opacity, and used sparingly.
- Motion: simple transitions around 150–220 ms. Respect `prefers-reduced-motion`.
- Icons: consistent, simple line icons. Do not use emoji as the primary interface icon system.
- Layout: generous but efficient spacing; keep forms and game controls easy to use with one hand on mobile.
- Accessibility: meet WCAG AA contrast for normal text, visible keyboard focus, semantic labels, accessible dialogs, and no color-only status indicators.

## 3.3 Key pages and UI requirements

### A. Landing page

- Simple header with editable product name/logo text and a small How to Play link.
- Primary title such as “How well do you know your music?” with a short supporting sentence.
- Two clear actions: Create a Room and Join a Room.
- A small preview of the game loop or a tasteful illustration; do not use a large marketing hero that pushes actions below the fold.
- Show “No account needed” as low-emphasis supporting text.
- Footer with About, Privacy placeholder page, and Terms placeholder page. Do not invent legal claims; mark legal copy as a draft if actual text is not provided.

### B. Create/join room

- Nickname required before creating/joining; 2–20 characters after trimming.
- Room code input accepts uppercase letters/numbers and ignores whitespace/hyphens.
- Clear validation messages next to the relevant control.
- Disable submit only while the request is in progress or inputs are invalid.

### C. Room lobby

- Room code and copy/share link action.
- Player list with nickname, host marker, connection state, and Ready state.
- Host-only settings panel for filters and number of rounds.
- Ready/Not Ready toggle for players; host can start only when the minimum player count is satisfied and all connected non-host players are ready. Host is implicitly ready.
- Recommended minimum 2 players; maximum 12.
- If there are fewer than two players, explain why Start is disabled.
- A clear leave-room action with confirmation only if a game is in progress.

### D. Round/game screen

- Main focus: a subtle audio-playing indicator, countdown/progress bar, and answer field.
- Show round number (e.g. “Round 4 of 15”), current score, player standings, selected category/language tags, and the active modifier if any.
- Keep the song title, artist, movie/release metadata, and correct answer entirely hidden until the reveal event.
- The answer box should be visibly focused when the answer phase begins, unless this steals focus from a mobile keyboard unexpectedly.
- Enter submits. Provide an explicit Submit button for accessibility and mobile.
- Show feedback (“Correct!”, “Not quite”, “Already submitted”) without shaming players.
- Show other players’ submitted/correct status without exposing their answer text before reveal.
- Respect audio playback permissions: require a user gesture/unlock step before the first audio round if the browser requires it. Show an understandable audio error and allow retry.
- Do not rely only on sound to communicate round state; always show visual progress and text.

### E. Reveal and scoreboard

- Reveal title, artist, and optional movie/year only after the answer window closes or all players have correctly answered.
- Display per-round point changes and a compact leaderboard.
- Clear Continue/Next Round behavior controlled by server/host state, not by a client-only timer.

### F. Final results

- Clear winner/rank display without gaudy effects.
- Stats can include fastest correct guess, longest streak, biggest comeback, and songs guessed.
- Use modest confetti only if implemented accessibly and with reduced-motion support; static celebration is acceptable.
- Actions: Play Again (reuse settings), Change Settings (return to lobby), and Leave Room.
- Do not show made-up player stats; all stats must derive from persisted round results.

### G. Admin catalog

- Protected `/admin` routes; never expose admin credentials in browser bundles.
- Track list with search, filter by status, and sort.
- Create/edit form for title, artists, aliases, language(s), category/industry, genre(s), release year, era, difficulty, clip start/end, tags, and rights status.
- Audio upload and in-browser preview.
- Rights/permission fields are required before a track can be approved: rights holder/submitter, permission or license type, permitted use including gameplay, territory, expiry (if applicable), attribution, and notes/reference.
- Clear “Draft”, “Pending review”, “Approved”, and “Disabled” statuses.
- A track is selectable for gameplay only when approved and playable.
- Audit log for approve/unapprove, audio replacement, and metadata edits.
- Include an explicit warning that filling in license fields is an administrative record and does not independently prove ownership or legal permission.

---

# 4. Gameplay rules

## 4.1 Standard round sequence

1. Server selects one eligible track that matches the room's filters and has not appeared earlier in that game.
2. Server emits a round preparation event with public round information and an audio access URL/asset identifier. Do not include any answer metadata.
3. Clients prepare the clip. The server defines a future `startAt` timestamp (target approximately 2 seconds in the future) to reduce perceived start skew.
4. Play an 8-second clip by default. Use a configurable answer window of 12 seconds from `startAt`, including the clip duration. If the product implementation finds this too short on mobile, make the answer window a central config value rather than hard-coded in multiple places.
5. Players may submit up to 3 guesses per round. Apply a server-side cooldown of 700 ms between attempts from the same player. Reject late guesses and duplicate request IDs.
6. A round ends when the answer window ends or all connected players have guessed correctly, whichever happens first. To avoid abruptly cutting off discussion, if all active players get it right, end after a short 1-second grace period.
7. Server reveals the song data and scores, persists results, and broadcasts the updated leaderboard.
8. After a 4-second reveal, host/server advances to the next round. The host should have a Next Round control as a fallback, with a maximum reveal duration enforced by the server to prevent the room becoming stuck.
9. After the final round, server emits game completion and persists the final standings and stats.

All timers must be owned by the server. Never trust a client-provided timestamp for scoring or round progression.

## 4.2 Audio synchronization and failure handling

- Use Socket.IO and a server-provided future `startAt` timestamp.
- Use client-side buffering/preload before `startAt`; calculate a rough client/server clock offset with ping/pong or equivalent.
- Synchronization should be best-effort; browsers and networks cannot guarantee sample-accurate playback. Document that limitation.
- If a player fails to load the clip, show Retry/Continue without revealing the track title. Do not block every other player indefinitely.
- If the host disconnects, assign host to the earliest-joined connected player and broadcast the change.
- If a player disconnects mid-round, retain their score for a 30-second reconnect window. Reconnection must require a signed/random reconnect token, not only the nickname.
- If no player can load the asset or the track is corrupted, cancel the round, do not score it, mark the track as unavailable for the current game, and pick a replacement. Log the failure.

## 4.3 Answer matching

- Normalize by trimming whitespace, lowercasing, collapsing repeated spaces, standardizing common punctuation, and removing diacritics where appropriate.
- Check only canonical title and explicitly stored accepted aliases/transliterations. Support title variants in Devanagari and Latin script if those aliases are entered in catalog administration.
- Do not use broad fuzzy matching by default because similar titles can cause incorrect awards. Any future fuzzy matching must have tests and a configurable conservative threshold.
- Answers are validated on the server. The correct title and aliases must never be included in public round-preparation payloads, audio filenames, URLs, error strings, or client-side source state before reveal.
- Prevent repeated submissions with the same request ID. Do not permit guesses after the deadline.
- Trim and validate answer length (1–120 characters); reject empty, excessively long, or malformed payloads.

## 4.4 Scoring rules

Use a central pure scoring function with unit tests. Default rules:

- Correct answer base: 500 points.
- Speed bonus: 0–500 points, linearly decreasing based on server-received elapsed time within the answer window.
- First-correct bonus: 250 points to the first player who submits a correct answer for that round.
- Streak bonus: +100 for each consecutive round answered correctly, capped at +300 per round. A round with no correct answer resets the streak.
- Maximum normal round score is therefore 1,550 points (500 base + 500 speed + 250 first-correct + 300 streak).
- Wrong answers score 0 and do not reduce existing points.
- Only the first correct submission per player per round scores. Additional correct attempts from the same player score nothing.
- Stable tie-breaker: total score descending, then number of correct answers descending, then cumulative server-received time for correct answers ascending. If still tied, share the rank.
- Record the scoring breakdown in the round result so the UI can explain points.

## 4.5 Chaos modifiers

MVP should implement at least the following modifiers, all controlled by server logic:

1. **Double Points:** doubles the round's earned points after normal calculation; it does not change prior scores.
2. **Lightning:** reduces the answer window to 8 seconds for that round.
3. **Comeback Boost:** players in the bottom half receive +150 bonus points for a correct answer. Compute the bottom half using standings before the round starts.
4. **Sudden Death:** only used in the final round; no streak bonus, but first-correct bonus becomes 500.

Choose a modifier only from those available for the room. If Chaos Mode is off, do not apply modifiers. Pitch shifting, reverse playback, clipping, or other audio transformations are out of MVP scope unless the track's documented rights explicitly permit derivative transformations.

---

# 5. Room and player rules

- Room codes: 6 characters, uppercase alphanumeric, omit visually confusing characters where practical (e.g. `O/0`, `I/1`). Use a collision check and unique MongoDB index.
- 2–12 players per room.
- Nicknames 2–20 characters after trim; disallow control characters and render as text, never HTML.
- Duplicate nicknames within a room: allow only if the normalized nickname differs; otherwise ask for a different nickname.
- Host is the room creator. Only host can change settings, start game, trigger a restart, or close room.
- Settings lock when the game begins. Play Again can reuse the prior settings after final results.
- A room has explicit state: `lobby`, `in_progress`, `finished`, `closed`.
- A game session has explicit state: `created`, `in_progress`, `finished`, `cancelled`.
- A round has explicit state: `preparing`, `playing`, `revealing`, `finished`, `cancelled`.
- Reject invalid state transitions on the server. A client cannot force a room or round into a new state.
- Provide clear room-full, invalid-code, closed-room, and game-in-progress errors.

---

# 6. Recommended architecture and implementation stack

Use the current stable, non-prerelease package versions that are compatible with the runtime, and commit the lockfile.

## 6.1 Repository structure

Use a TypeScript monorepo with a structure similar to:

```text
/
  apps/
    web/                 # Next.js App Router frontend
    server/              # Express + Socket.IO API/game server
  packages/
    shared/              # Shared Zod schemas, event contracts, scoring types
  scripts/               # seed data, synthetic audio generation, utility scripts
  docs/
    architecture.md
    implementation-notes.md
    testing.md
  docker-compose.yml      # local MongoDB only, no credentials committed
  .env.example
  README.md
  package.json
  tsconfig.base.json
```

The exact folder shape can be adjusted if a clear technical limitation requires it, but keep web/server/shared code separated and document any deviation.

## 6.2 Stack

- Frontend: Next.js App Router, React, TypeScript.
- Styling: CSS variables plus Tailwind CSS or another minimal utility approach; use reusable components and the design tokens in this PRD.
- Backend: Node.js + TypeScript + Express.
- Multiplayer: Socket.IO client/server.
- Database: MongoDB, accessed through Mongoose. Use schema validation and TypeScript inference where practical.
- Shared validation/contracts: Zod schemas in `packages/shared` so client/server event payloads are consistent.
- Testing: Vitest (or Jest if already established), Supertest for HTTP tests, Socket.IO integration tests, and Playwright for browser smoke/e2e tests.
- Lint/format: ESLint and Prettier, with scripts documented in README.
- Local database: Docker Compose MongoDB container or documented local MongoDB URI. The application should also work with a MongoDB Atlas URI.
- Audio storage: a storage adapter. Local filesystem storage is acceptable for local development. Keep the interface compatible with S3-compatible object storage later. Never use the database to store large binary audio blobs.

Use Socket.IO rooms for server-side broadcast grouping; do not treat the client as authoritative for room membership or player state. See the official documentation in References.

## 6.3 Runtime services

- Web app communicates with backend HTTP APIs for initial room creation/joining, health checks, and admin operations.
- Socket.IO handles ready updates, game start, round events, answer submissions, score broadcasts, and reconnection.
- Backend service is authoritative for game state, answer validation, timers, track selection, and scoring.
- MongoDB stores durable catalog, game session, final results, and audit data. Ephemeral socket-to-player mappings may be held in memory for the single-server MVP, with durable IDs/token hashes stored where needed for reconnection.
- Ensure `NEXT_PUBLIC_*` variables contain only public configuration. Never expose MongoDB URI, admin password/hash, signing secret, or storage credentials.

---

# 7. MongoDB data model

Use Mongoose models with explicit schemas, constraints, validation, and indexes. Keep the catalog normalized enough to avoid duplicated licensing records, while embedding small bounded data such as a track's aliases and tags when that matches access patterns. Create indexes for common filter/look-up queries; do not add indexes indiscriminately.

## 7.1 `Track`

Suggested fields:

- `_id`
- `slug`: unique internal slug
- `title`: canonical title
- `normalizedTitle`: normalized title for matching/search
- `artists`: string array
- `acceptedAnswers`: string array of allowed title variants, transliterations and spelling alternatives
- `languages`: enum/string array; examples: `Hindi`, `Marathi`, `English`, `Tamil`, `Telugu`, `Other`
- `categories`: array; examples: `Bollywood`, `Hollywood`, `Regional`, `Indie`, `Other`
- `genres`: string array
- `releaseYear`: optional integer with validation
- `era`: controlled value such as `pre-1980`, `1980s`, `1990s`, `2000s`, `2010s`, `2020s`, `unknown`
- `difficulty`: integer 1–5
- `tags`: string array
- `audioAssetId`: reference/ID for audio asset
- `clipStartMs`, `clipEndMs`: non-negative integers; clip length must satisfy configured 6–10 second bounds for gameplay
- `rights`: embedded rights summary or reference to a `MusicLicense` record; must never be omitted for approval
- `status`: `draft | pending_review | approved | disabled`
- `sourceType`: `synthetic_demo | direct_upload | licensed_provider`
- `createdAt`, `updatedAt`, `createdBy`, `updatedBy`
- `lastVerifiedAt` and `licenseExpiryAt` if applicable

## 7.2 `MusicLicense`

Suggested fields:

- `_id`, `trackId`
- `rightsHolderOrSubmitter`
- `licenseType` / `permissionDescription`
- `allowedUses`: array; approval requires `gameplay`
- `territories`: array or explicit `worldwide` flag
- `commercialUseAllowed`: boolean, explicitly set (not inferred)
- `modificationAllowed`: boolean
- `attributionRequired`: boolean and attribution text
- `startsAt`, `expiresAt` (optional expiry)
- `evidenceReference`: a URL or internal note/reference; never store private documents publicly
- `reviewStatus`: `pending | approved | rejected | expired`
- `reviewedBy`, `reviewedAt`, `notes`
- `createdAt`, `updatedAt`

A track is selectable only when the track status is approved, the associated license review is approved, gameplay use is permitted, commercial-use setting matches the app's configured mode, the territory permits the current deployment/usage, and the license is not expired. For synthetic demo tracks, store an explicit `synthetic_demo` rights record.

## 7.3 `AudioAsset`

Suggested fields:

- `_id`, `trackId`
- `storageProvider`: `local | s3_compatible`
- `storageKey`: internal storage key, never a client-controlled path
- `mimeType`, `fileSizeBytes`, `durationMs`, `checksumSha256`
- `processingStatus`: `pending | ready | failed`
- `createdAt`, `createdBy`

Do not store the correct title in the asset key or URL. Limit accepted MIME types to audio formats actually supported by the implementation (prefer MP3 and/or OGG/WebM only after browser support verification), validate file size, and do not trust the file extension alone.

## 7.4 `GameSession`

Suggested fields:

- `_id`, `roomCode`, `hostPlayerId`
- `status`, `settingsSnapshot`
- `playerSnapshots`: bounded array of player IDs, nicknames, join order, final score and final stats; do not store unnecessary personal data
- `rounds`: either bounded embedded round summaries or references to `RoundResult` records; choose and document the approach based on query patterns
- `startedAt`, `finishedAt`, `createdAt`
- `winnerPlayerId`, `finalStandings`

Do not embed unbounded event logs or raw submitted guesses into a single MongoDB document. Store round results separately if required to avoid document growth and the 16 MB document limit.

## 7.5 `Room`

Suggested fields:

- `_id`, `code` unique
- `hostPlayerId`, `status`
- `settings`: `languages`, `categories`, `eras`, `genres`, `difficultyMode`, `roundCount`, `chaosMode`, `clipSeconds`
- `players`: bounded list of current players with `playerId`, nickname, join order, ready status, connection status, reconnect token hash, and score summary
- `activeGameSessionId`
- `createdAt`, `updatedAt`, `closedAt`
- `expiresAt` for abandoned lobby cleanup only

Create a TTL index only for appropriate ephemeral room documents/fields, and confirm the intended lifecycle. Do not use a TTL index on durable tracks, licenses, completed sessions, or results. MongoDB TTL removal is asynchronous, so do not use it as an exact game timer.

## 7.6 `RoundResult`

Suggested fields:

- `_id`, `gameSessionId`, `roomCode`, `roundNumber`, `trackId`
- `modifier`, `startedAt`, `endedAt`, `status`
- `playerResults`: bounded entries with player ID, wasCorrect, attempts, elapsedMs, pointsBreakdown, streakBefore, streakAfter
- `createdAt`

Only persist sanitized guess outcomes by default. Avoid storing every raw guess unless there is a specific, documented product need.

## 7.7 `AuditLog`

Record security- and catalog-relevant actions: track approval/disable, rights change, audio asset replacement, admin login failures, and sensitive settings changes. Do not write secrets, reconnect tokens, or raw credentials into logs.

## 7.8 Required indexes

At minimum, evaluate and implement indexes for:

- Unique `Room.code`.
- `Room.status` + `Room.updatedAt` for lifecycle cleanup/listing if needed.
- `Track.status` + commonly queried filter fields such as languages/categories/difficulty/era.
- Unique `Track.slug`.
- Unique or appropriately constrained `AudioAsset.storageKey`.
- `GameSession.roomCode` + `createdAt`.
- `RoundResult.gameSessionId` + `roundNumber`.
- `AuditLog.createdAt` and relevant entity/action lookup fields.
- TTL index only for abandoned lobby cleanup, after considering MongoDB TTL semantics and ensuring it cannot remove a room that is actively playing.

Document each index's query purpose in the model or migration/index initialization code.

---

# 8. HTTP API requirements

Prefix application endpoints with `/api`. Return consistent JSON and HTTP status codes. Validate all input with shared schemas. Never return stack traces, secrets, Mongoose internals, or hidden answer data.

Minimum endpoints:

- `GET /api/health` — health/readiness response; never return database credentials.
- `POST /api/rooms` — create a room and host player; validate settings and nickname.
- `POST /api/rooms/:code/join` — join an open lobby; enforce room capacity and nickname rules.
- `GET /api/rooms/:code` — return public lobby/game state only. Never include answer keys or license evidence.
- `POST /api/rooms/:code/leave` — leave room with server-side membership validation.
- `GET /api/catalog/filters` — return available filter values derived from approved, playable tracks.
- `GET /api/admin/tracks` — admin-only searchable/paginated catalog list.
- `POST /api/admin/tracks` — admin-only create track metadata.
- `PATCH /api/admin/tracks/:id` — admin-only metadata/status change with audit event.
- `POST /api/admin/tracks/:id/audio` — admin-only upload and validation of audio asset.
- `POST /api/admin/tracks/:id/approve` — admin-only approval after license checks; audit event required.
- `POST /api/admin/tracks/:id/preview-url` — admin-only short-lived/limited preview access, if the storage provider supports it.

Use consistent error format, for example:

```json
{
  "error": {
    "code": "ROOM_FULL",
    "message": "This room is full. Try joining another room."
  }
}
```

Do not expose underlying exception messages to clients. Use pagination for admin lists. Add safe request size/file upload limits and rate limiting for create/join/admin endpoints.

---

# 9. Socket.IO event contract

Put typed event names and Zod payload schemas in `packages/shared`. Every incoming event must be validated, authorized against the socket's current server-side player/room membership, and rejected safely if invalid.

## Client → server

- `room:join` — `{ roomCode, nickname, reconnectToken? }`
- `room:ready:set` — `{ ready: boolean }`
- `room:settings:update` — validated settings; host only; lobby only
- `game:start` — host only; lobby only; minimum players/ready checks enforced by server
- `round:answer:submit` — `{ requestId, answer }`; validate player, room, round state, attempt count, cooldown, deadline and max input length
- `round:audio:ready` — `{ roundId, canPlay: boolean }` (diagnostic only; never used to reveal answer)
- `round:next` — host action/fallback; server must enforce maximum reveal duration and valid state
- `game:playAgain` — host only; finished game only
- `room:leave` — explicit leave request
- `connection:ping` / `connection:pong` or equivalent for offset estimation

## Server → client

- `room:state` — public room state and player list
- `room:playerJoined`
- `room:playerLeft`
- `room:hostChanged`
- `room:error` — safe structured error
- `game:started` — public game settings snapshot and round count
- `round:prepare` — `{ roundId, roundNumber, totalRounds, trackPublicId, audioUrlOrAssetToken, clipDurationMs, startAt, answerDeadlineAt, filtersSummary, modifier }`; **no title, artists, aliases, movie, year, normalized title, license evidence, or correct answer**
- `round:play`
- `round:answer:feedback` — only to submitting player; safe correctness/points feedback according to product design, no other player's submitted answer text
- `round:playerProgress` — safe public status such as hasGuessed/correct, not answer text
- `round:ended` — revealed song metadata, sanitized answer summary, point breakdowns and round leaderboard
- `leaderboard:update`
- `game:finished` — final standings and computed stats
- `game:cancelled` — safe reason and recovery action
- `connection:rejoined`

Use Socket.IO rooms for broadcasting to the relevant room. Do not trust a client-supplied `roomCode` on every action; bind the authenticated connection to server-verified player and room state after join/reconnect.

---

# 10. Track catalog, audio, and copyright safeguards

## 10.1 Safe default catalog

The app must run immediately with at least 6 original synthetic demo melodies. Generate them locally (for example, using Web Audio API or a small script that renders original notes to simple audio files). Give each tune a distinct original demo title/alias and make the title guessable after one or more rounds. Label the catalog and admin UI clearly as **Demo tracks — not commercial songs**.

These are gameplay/demo assets only. They do not replace a real, licensed catalog.

## 10.2 Upload workflow

- Admin can upload a track that they have permission to use.
- Validate declared MIME type, detected file signature where practical, maximum file size (configurable; default 15 MB per clip), duration, and clip bounds.
- Reject invalid/corrupt audio and report a clear message.
- Store files using generated opaque keys, not the original filename or song title.
- Do not serve unapproved uploads to players.
- Do not make license evidence publicly accessible.
- Log upload, replacement, approval, and disable actions.
- Before approval, require a human review confirmation that the necessary rights and permitted uses have been checked. The app must not claim that metadata fields by themselves establish legal ownership.

## 10.3 External providers

Do not require Spotify, YouTube, Jamendo, MusicBrainz, or any other external API for the base app to start. MusicBrainz-like metadata enrichment and licensed catalog/provider integrations may be added later behind an interface, with explicit terms review and server-side credentials. Do not treat Spotify preview URLs as a valid game-music source. Never scrape or download copyrighted audio from a website.

---

# 11. Security, privacy, reliability

- Use environment variables for database URI, admin credentials, token-signing secret, allowed web origin, and storage configuration.
- Provide a development-only admin setup path and explain how to configure a secure admin credential. Never ship a known default production password.
- Prefer secure, HttpOnly, SameSite cookies for admin sessions where cookie authentication is used. In production, require HTTPS and set Secure cookies.
- Hash admin passwords with a modern password hashing function if password auth is implemented; never store plaintext passwords.
- Rate limit room creation/joining, answer submissions, and admin login/upload routes.
- Validate all HTTP, socket, query, path, and file inputs.
- Escape/render user-provided nicknames and text safely; prevent XSS and injection.
- Enforce host-only actions and player membership on the server.
- Avoid logging raw answer input, secrets, tokens, or uploaded files.
- Configure CORS with an explicit allowed origin from environment variables; do not use wildcard origin with credentials.
- Cap body size, upload size, player count, room count if configured, and answer attempts.
- Use opaque/random IDs and cryptographically random reconnect tokens. Store token hashes instead of reusable tokens where possible.
- Expire disconnected-player reconnect ability after 30 seconds.
- Use generic public error messages but structured internal logs with request/round IDs.
- Do not collect names, email addresses, precise location, or any unnecessary personal data in the MVP.
- Add a privacy notice explaining that nicknames, game results, and basic operational logs may be stored. Actual legal/privacy wording should be reviewed before public launch.
- Provide a safe cleanup job for abandoned lobbies and stale in-memory timers. Do not rely on MongoDB TTL for precise round timing.
- Add graceful shutdown: stop accepting new rooms, clear timers, close Socket.IO/server/database connections.

---

# 12. Empty states, loading, errors, edge cases

Build and test these states explicitly:

- No available tracks match selected filters: show a friendly message and let the host broaden filters; never enter an infinite selection loop.
- No approved tracks at all: explain that demo tracks are expected and provide a documented seed command.
- Invalid/expired/full/closed room code.
- Nickname already in use.
- Network reconnecting; disconnected; permanently disconnected.
- Browser audio playback blocked; retry/unlock audio flow.
- Audio file unavailable or unsupported.
- Two players submit correct answers nearly simultaneously: award first-correct bonus deterministically using server receipt ordering; preserve correctness for both.
- A player double-clicks Submit or sends duplicate socket events.
- A late answer arrives exactly at or after deadline.
- Host disconnects/rejoins or host reassignment occurs.
- Browser refresh during lobby/in-progress game; reconnect via random token if still within grace period.
- All players are not ready, only one player is in room, or room becomes empty.
- Server restarts mid-game: mark the game cancelled cleanly if exact recovery is unsupported; do not fabricate scores. Document single-server MVP restart behavior.
- Admin uploads an expired/unapproved/disallowed track and attempts to approve it.
- License expiry/disable after a track has been selected: prevent it from being selected in future rounds; the current in-progress round can finish if allowed by the configured policy, otherwise cancel safely.
- Mobile viewport, long nickname, long song title on reveal, keyboard-only navigation, screen reader labels, reduced-motion preference.

Every page needs loading, empty, success, and error states where appropriate.

---

# 13. Observability and operational requirements

- Add structured logs with timestamps, level, component, request ID, room code (not secrets), game session ID, round ID, and event name where relevant.
- Do not log the correct song answer before reveal, admin passwords, license evidence contents, or reconnect tokens.
- Expose `/api/health` and a readiness check that indicates whether MongoDB is reachable, without disclosing connection details.
- Log game cancellation reasons and audio load errors for debugging.
- Add user-friendly error boundaries in the web app.
- Ensure server errors return a safe error code and useful request ID.

---

# 14. Test plan and acceptance criteria

The agent must create automated tests and run them. Prefer tests for pure logic and server authorization rules before visual polish.

## 14.1 Unit tests

- Answer normalization: case, spaces, punctuation, diacritics, aliases, Hindi/Marathi transliteration variants.
- Wrong and correct guesses; empty and overlong answers.
- Attempt limit and cooldown enforcement.
- Score formula at the beginning, middle, and end of the answer window.
- First-correct bonus determinism when two guesses are received nearly together.
- Streak increments/resets/cap.
- Chaos modifier calculations.
- Tie-break sorting and shared-rank handling.
- Track filtering and exclusion of tracks already played in a game.
- License eligibility: pending, rejected, expired, disallowed gameplay, disabled, and approved cases.
- Room code normalization and collision retry.

## 14.2 Integration tests

- Create room, host becomes first player, join second player.
- Enforce minimum and maximum player counts.
- Enforce host-only settings/start/restart/close operations.
- Reject invalid room state transitions.
- Reject guesses from non-members, wrong rooms, wrong rounds, and after deadlines.
- Verify public `round:prepare` payload contains no title, artist, alias, or correct answer.
- Verify correct answer is only revealed in the end/reveal event.
- Verify every player receives appropriate leaderboard changes.
- Verify disconnected-player grace period/reconnect token rules.
- Verify the game persists final standings and round results to MongoDB.
- Verify an unapproved or unplayable track is never selected.
- Verify rate limits and invalid payloads fail safely.

## 14.3 Browser/e2e tests

At minimum, test a two-player game across two browser contexts:

1. Open the app and create a room.
2. Join from the second browser with a different nickname.
3. Mark ready and start.
4. Verify audio player state and timer render; if audio is blocked in test automation, verify the explicit retry/error state.
5. Submit a correct answer and a wrong answer.
6. Verify scores/leaderboard update and the answer is hidden until reveal.
7. Finish the game and verify final standings plus Play Again.
8. Verify layout at 375 px mobile width and at desktop width; no horizontal overflow.

## 14.4 Definition-of-done checklist

- [ ] `README.md` has exact prerequisite versions and commands for setup, development, tests, lint, type-check, build, seeding demo tracks, and creating an admin account/credential.
- [ ] `.env.example` lists every environment variable with safe example values and no real secrets.
- [ ] MongoDB schemas, validation and indexes are implemented and documented.
- [ ] App starts without any third-party music API key.
- [ ] At least six original synthetic demo tracks work from start to reveal.
- [ ] Two browsers can play a full game with real-time updates.
- [ ] Host controls and server-authoritative state transitions work.
- [ ] Correct answers are not exposed before reveal through HTTP, WebSocket events, public MongoDB projections, or asset naming.
- [ ] Music catalog filter combination works, and empty-filter outcomes are handled gracefully.
- [ ] Admin can upload a track and cannot approve it without required rights review fields.
- [ ] All visible primary controls work; loading/empty/error states exist.
- [ ] UI follows the moderate, bright, simple visual system; no excessive glow/gradient/neon/large bold typography.
- [ ] Accessibility basics and keyboard navigation are verified.
- [ ] Unit and integration tests pass; e2e smoke test is run or any environmental blocker is documented honestly.
- [ ] Lint, type-check and production build pass without ignored errors.
- [ ] No hard-coded secrets, copyrighted music samples, dead buttons, hidden answer leaks, or unexplained TODOs remain.
- [ ] Final agent report includes files/components created, commands run, test outcomes, and remaining limitations.

---

# 15. Suggested implementation phases

Do not try to implement every feature in one unverified pass. Complete each phase and verify it.

## Phase 1 — Foundation

- Initialize monorepo and stable TypeScript tooling.
- Implement environment validation, logger, shared schemas, health endpoint, MongoDB connection and Docker Compose.
- Add `README.md` and `.env.example`.
- Verify dev startup, health check, lint, type-check and build.

## Phase 2 — Catalog and demo audio

- Implement Track, MusicLicense, AudioAsset and AuditLog schemas.
- Generate at least six original demo audio files and seed records.
- Implement track eligibility/filter queries and answer normalization.
- Implement admin login, list/create/edit/upload/preview/approve/disable flow.
- Verify that unapproved/ineligible tracks never appear in gameplay selection.

## Phase 3 — Rooms and lobby

- Implement create/join/leave, host assignment, ready states, validated room settings, room code uniqueness and reconnect token basics.
- Build landing/create/join/lobby pages with responsive layout.
- Verify two browser contexts can join the same lobby.

## Phase 4 — Real-time game engine

- Implement state machine, server-owned timers, round selection, audio-ready path, answer events, scoring, round reveal, leaderboard, chaos modifiers and game completion.
- Persist results and enforce answer secrecy.
- Add unit/integration tests before visual enhancements.

## Phase 5 — Finish and verify

- Build result screen and rematch flow.
- Add loading, error, disconnected and empty states.
- Perform browser visual review on desktop/mobile.
- Run the full validation checklist, fix issues, and update docs.

---

# 16. Deliverables expected from the agent

1. A runnable full-stack repository containing frontend, backend, shared contracts and MongoDB schemas.
2. Responsive UI for landing, create/join, lobby, game round, scoreboard/reveal, results and admin catalog.
3. Working private multiplayer rooms and one full playable game loop.
4. Six or more original synthetic demo tracks and a documented seed process.
5. Admin track upload/catalog management with explicit rights-review requirements.
6. Automated tests covering game rules, core authorization, answer secrecy, licensing eligibility and primary user flow.
7. Docker Compose/local MongoDB setup, `.env.example`, package scripts, and a useful `README.md`.
8. `docs/architecture.md`, `docs/testing.md`, and `docs/implementation-notes.md`.
9. A final verification report with passed/failed commands and honest blockers.

---

# 17. External reference documentation

Use official documentation when implementation details are uncertain; do not blindly copy deprecated examples.

- Google Antigravity overview: https://www.antigravity.google/docs/overview?tab=ide
- Next.js App Router: https://nextjs.org/docs/app
- MongoDB schema design: https://www.mongodb.com/docs/manual/data-modeling/schema-design-process/
- MongoDB indexes: https://www.mongodb.com/docs/manual/data-modeling/schema-design-process/create-indexes/
- MongoDB TTL indexes: https://www.mongodb.com/docs/manual/core/index-ttl/
- Mongoose TypeScript schemas: https://mongoosejs.com/docs/typescript/schemas.html
- Mongoose validation: https://mongoosejs.com/docs/validation.html
- Socket.IO introduction: https://socket.io/docs/v4/
- Socket.IO rooms: https://socket.io/docs/v4/rooms/

---

## Final directive to Antigravity

Implement this specification as a complete, working MVP. Favor correctness, a clean normal UI, maintainable code, explicit validation, and verified behavior over feature count. Make sensible assumptions when minor details are unspecified, record them, and keep moving. Do not stop after generating a plan or building only the frontend. Do not claim completion until the required commands and acceptance checks have actually been run.

# Tune Clash 🎵
### Multiplayer Music Guessing Party Game

Tune Clash is an authoritative, real-time multiplayer music guessing game built with TypeScript, Next.js App Router, Express, Socket.IO, and MongoDB.

Players join private rooms with a shareable 6-character room code without creating an account, listen to 8-second music clips, and race to identify the song. The game features server-authoritative scoring with speed bonuses, streaks, first-to-guess awards, and customizable Chaos Modifiers (Double Points, Lightning 8s rounds, Comeback Boosts, and final Sudden Death showdowns).

---

## 🌟 Key Features

- **Instant Private Rooms**: 2 to 12 players per room with 6-character codes and 1-click shareable join links.
- **No Account Required**: Host and players pick a nickname and jump straight into the party.
- **Authoritative Game State Machine**: Timers, answer secrecy, cooldowns (700ms), and score computations are owned strictly by the server.
- **Smart Song Matching**: Strict normalization with support for accepted aliases, transliterations, and Devanagari script.
- **Chaos Modifiers**: Optional host toggles for Double Points, Lightning 8-second rounds, Comeback Boosts, and Sudden Death.
- **Safe Synthetic Demo Catalog**: Starts immediately with 6 original algorithmic synthetic demo tracks without relying on copyright-protected or third-party commercial music.
- **Admin Catalog & Rights Auditing**: Protected `/admin` panel with mandatory rights and permission review before any track can be approved for gameplay.
- **Zero-Friction Dual-Mode Database**: Boots automatically with an in-memory database for instant offline testing and development, or seamlessly connects to MongoDB Atlas or local MongoDB when `MONGODB_URI` is provided in `.env`.

---

## 🚀 Quick Start Guide

### Prerequisites
- **Node.js**: v20.x or v22.x or v24.x
- **npm**: v10.x or higher

### 1. Installation
Clone the repository and install all workspace dependencies:
```bash
npm install
```

### 2. Environment Configuration
The repository includes a ready `.env` file with safe defaults:
```bash
cp .env.example .env
```

| Variable | Default Value | Description |
|---|---|---|
| `PORT` | `4000` | Backend Express & Socket.IO server port |
| `ALLOWED_ORIGIN` | `http://localhost:3000` | Allowed CORS frontend origin |
| `MONGODB_URI` | `memory` | Set to your MongoDB Atlas connection string or `mongodb://localhost:27017/tune_clash`. If set to `memory` or unset, an in-memory database will start automatically! |
| `JWT_SECRET` | `dev-jwt-super-secret-key-change-in-production-12345` | Secret for signing tokens |
| `ADMIN_PASSWORD` | `TuneClashAdmin2026!` | Password to access the admin catalog |
| `NEXT_PUBLIC_API_URL` | `http://localhost:4000` | Backend API URL for frontend |
| `NEXT_PUBLIC_SOCKET_URL` | `http://localhost:4000` | Socket.IO URL for frontend |

### 3. Generate Audio & Seed Demo Tracks
Generate the 6 original synthetic demo WAV melodies and seed them into the catalog:
```bash
npm run seed
```
*(Note: When starting the server, it also automatically verifies and seeds the demo tracks if none exist!)*

### 4. Running the Development Servers
In two separate terminals:

**Terminal 1 (Backend Server):**
```bash
npm run dev:server
```
Runs Express & Socket.IO at `http://localhost:4000`.

**Terminal 2 (Frontend Web App):**
```bash
npm run dev:web
```
Runs Next.js at `http://localhost:3000`.

Open your browser at `http://localhost:3000` to play!

---

## 🛠️ Production Build

To build both packages:
```bash
npm run build
```

Or build individually:
- Backend: `npm run build:backend`
- Frontend: `npm run build:frontend`

---

## 📁 Repository Structure

```text
/
├── frontend/                # Next.js 14 App Router frontend (Deploy on Vercel)
│   ├── src/app/             # Routes: / (Landing), /room/[code] (Game), /admin (Catalog)
│   ├── src/components/      # AudioPlayer, Leaderboard, Countdown, AnswerInput, Podium
│   └── src/shared/          # Self-contained game contracts, types, and events
├── backend/                 # Node.js + Express + Socket.IO server (Deploy on Render/Railway)
│   ├── src/game/            # GameManager authoritative multiplayer state machine
│   ├── src/models/          # Mongoose schemas: Track, License, Asset, Room, Session
│   ├── src/routes/          # API routers: health, rooms, catalog, admin, assets
│   ├── src/shared/          # Server contracts, scoring engine, normalizer, and schemas
│   └── src/storage/         # Local audio storage provider with opaque UUID keys
├── scripts/                 # Audio synthesizer and verification test scripts
├── docs/
│   ├── architecture.md      # Architecture, state machines, and timing models
│   ├── implementation-notes.md # Key technical decisions and rationale
│   └── testing.md           # Verification checklists
├── DEPLOYMENT.md            # Step-by-step Vercel & Render/Railway deployment guide
├── docker-compose.yml       # Optional local MongoDB container
├── .env.example             # Example environment variables template
└── README.md
```

---

## 🛡️ License & Legal Content Safeguards
Tune Clash is designed to operate completely without unauthorized or scraped commercial music. Baseline demo tracks are procedurally generated original synth tunes licensed under full gameplay clearance. Admin catalog upload features require explicit rights documentation review prior to track activation.

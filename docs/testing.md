# Testing Strategy & Execution Guide

## Test Suites

### 1. Unit Tests (`packages/shared` & `apps/server`)
- **Answer Normalizer**:
  - Diacritic removal (`café` -> `cafe`)
  - Whitespace and case normalization
  - Punctuation stripping (`rock 'n' roll` -> `rock n roll`)
  - Canonical & alias matching (e.g. `Dil Se Re` vs `दिल से रे`)
  - Boundary rejection (empty, >120 characters)
- **Scoring Engine**:
  - Base points calculation (500)
  - Speed bonus at start, middle, and deadline
  - Streak bonus calculation (100, 200, 300 cap, reset on fail)
  - First correct award determinism
  - Modifiers: Double Points, Lightning, Comeback Boost, Sudden Death
  - Tie-breaking: score desc -> correct count desc -> cumulative response time asc
- **License Eligibility**:
  - Verified approved vs draft/disabled
  - Expired license handling
  - Missing gameplay permitted use rejection

### 2. Integration Tests (`apps/server`)
- Health check endpoint `/api/health`
- Room creation and joining via HTTP
- Socket.IO connection and room state broadcasting
- Authoritative state machine transitions
- Guarantees: secrecy of track metadata in `round:prepare` payload
- Revealing song data upon `round:ended`

### 3. Browser E2E Tests
- Multi-client simulation:
  - Host creates room
  - Player joins with code
  - Ready toggle and start game
  - Audio playback & timer progression
  - Correct and wrong guess submission
  - Leaderboard update and final podium results

# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
# Install all dependencies (root + server + client)
npm run install:all

# Run full dev environment (server + client concurrently)
npm run dev

# Run server only (port 3001)
npm run dev:server

# Run client only (Vite dev server, port 5173, proxies /socket.io to :3001)
npm run dev:client

# Tests (run from server/ or root)
cd server && npm test                    # run all tests
cd server && npm run test:watch          # watch mode
cd server && npx vitest run Room.test.js # single test file

# Production build
cd client && npm run build               # outputs to client/dist/

# Docker
docker compose up --build                # builds and runs on port 3001
```

## Architecture

Real-time multiplayer social deduction game (3-12 players). One player is secretly the imposter and doesn't know the chosen word. Players give hints and vote to find the imposter.

### Backend (server/)

Node.js with Express and Socket.IO. ES modules throughout (`"type": "module"`).

- **`index.js`** — Express server on port 3001. Serves built client from `client/dist/` in production. CORS with `origin: '*'`.
- **`game/Room.js`** — Core game state machine with 5 phases: `LOBBY → WORD_REVEAL → HINTING → VOTING → RESULTS`. Manages players, imposter selection, voting, and host delegation.
- **`game/RoomManager.js`** — Singleton managing all rooms. Generates 4-char room codes (A-Z, excluding I/O). Schedules cleanup of empty rooms after 5 minutes.
- **`game/words.js`** — Word pool with 90 words across several groups. `getRandomWord()` returns `{ word }`.
- **`socket/handlers.js`** — All Socket.IO event handlers. Key events: `create-room`, `join-room`, `start-game`, `advance-phase`, `cast-vote`, `play-again`, `return-to-lobby`, `update-settings`.

Socket callbacks use `{ ok, error, ...data }` pattern for error handling.

### Frontend (client/)

React 19 + Vite + Tailwind CSS v4 + Socket.IO client.

- **`src/context/GameContext.jsx`** — Global state via React Context (`useGame()` hook). Manages room info, game phase, voting, and all socket event listeners.
- **`src/socket.js`** — Socket.IO client singleton. Connects to same origin in production, `localhost:3001` in dev. Auto-connect disabled.
- **`src/App.jsx`** — Phase-based routing: renders different components based on current game phase (JoinScreen, Lobby, WordReveal, HintPhase, VotingPhase, Results).

Tailwind v4 with custom theme defined in `src/App.css` using `@theme` (no tailwind.config file). Custom colors: `--color-accent` (red), `--color-accent-green`. Custom animations for transitions.

### Communication Flow

Client emits socket events → server validates (host-only checks, phase checks, player limits) → server broadcasts state updates to room. Player identity is tracked by socket ID. Imposter receives `null` for word in `game-started` event; full reveal only in results.

### Voting Rules

Imposter wins on ties. Only a correct unanimous vote catches the imposter.

## CI/CD

- **`.github/workflows/ci.yml`** — Runs tests (Node 18+20) and client build on push/PR to main.
- **`.github/workflows/release.yml`** — On GitHub Release publish: runs tests, builds and pushes Docker image to GHCR with semver tags.

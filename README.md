# Imposter

A real-time multiplayer social deduction party game. One player is secretly the **imposter** and doesn't know the secret word — everyone else gives one-word hints to figure out who's bluffing.

![lobby screenshot](image.png)

## How to Play

1. One player **creates a room** and shares the 4-character room code.
2. Other players **join** using the code (3–12 players).
3. A secret word and category are revealed — except to the imposter, who only sees that they're the imposter.
4. Players take turns giving **one-word hints** out loud over two rounds. The imposter has to fake it.
5. Everyone **votes** on who they think the imposter is.
6. If the group catches the imposter, they win. If there's a tie or the wrong person is accused, the imposter wins.

### Host Settings

- **Hide category from imposter** — When enabled, the imposter won't see the word category, making it harder to blend in.

## Tech Stack

- **Frontend:** React, Vite, Tailwind CSS
- **Backend:** Node.js, Express, Socket.IO
- **Communication:** WebSockets for real-time game state sync

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v18+)

### Install

```sh
npm run install:all
```

### Run (development)

```sh
npm run dev
```

This starts the server on `http://localhost:3001` and the client on `http://localhost:5173`.

You can also run them separately:

```sh
npm run dev:server
npm run dev:client
```

### Build for Production

```sh
cd client && npx vite build
```

The built files will be in `client/dist/`. The server automatically serves these files when the `client/dist` directory exists, so you can run the full app with just the server:

```sh
cd server && node index.js
```

### Run with Docker

```sh
docker compose up --build
```

The app will be available at `http://localhost:3001`.

## Project Structure

```
imposter-game/
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/     # Game phase components
│   │   ├── context/        # Game state (React Context + Socket.IO)
│   │   └── App.jsx         # Phase router
│   └── index.html
├── server/                 # Node.js backend
│   ├── game/               # Room, word list, room manager
│   └── socket/             # Socket.IO event handlers
├── Dockerfile              # Multi-stage production build
├── docker-compose.yml      # Docker Compose config
├── package.json            # Root scripts (dev, install:all)
└── LICENSE
```

## Word Categories

Animals, Food, Places, Movies, Occupations, Sports — each with 15 words.

## Acknowledgments

This project was almost entirely coded using [Claude](https://claude.ai) by Anthropic.

## License

[MIT](LICENSE)

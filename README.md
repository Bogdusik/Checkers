<div align="center">

<img src="docs/media/game.gif" alt="Two players in two browser windows: White moves on the left board and the move appears at once on Black's board on the right, including a capture and a recapture" width="900">

# Checkers

**Online checkers for two players in real time: moves reach the other browser through Server-Sent Events, with ELO ratings, chat, draw offers and friends.**

[![CI](https://github.com/Bogdusik/Checkers/actions/workflows/ci.yml/badge.svg?branch=main)](https://github.com/Bogdusik/Checkers/actions/workflows/ci.yml)
[![Play online](https://img.shields.io/badge/play-online-a855f7?logo=vercel&logoColor=white)](https://checkers-bogdus1k.vercel.app)
![Next.js 14](https://img.shields.io/badge/Next.js-14-000000?logo=nextdotjs&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=white)
![Prisma](https://img.shields.io/badge/Prisma-PostgreSQL-2D3748?logo=prisma&logoColor=white)
![SSE](https://img.shields.io/badge/real--time-Server--Sent_Events-22c55e)

[Play online](https://checkers-bogdus1k.vercel.app) · [Features](#features) · [Run it locally](#how-to-run-locally)

</div>

## Screens

<table>
<tr>
<td colspan="2" valign="top">
<img src="docs/media/game.png" alt="Game page: the board from White's side with the last move highlighted, players, game status, draw and resign buttons, move history and chat"><br>
<b>The game.</b> Each player sees the board from their own side; the last move is highlighted, illegal moves are refused by the server, and captures are forced.
</td>
</tr>
<tr>
<td width="55%" valign="top">
<img src="docs/media/choose-opponent.png" alt="Choose an opponent dialog: play against yourself, or invite an online player with their games, wins and losses"><br>
<b>Choose an opponent.</b> Invite a player who is online, or play against yourself to practise.
</td>
<td width="45%" valign="top">
<img src="docs/media/profile.png" alt="Profile: games, wins, losses, draws, win rate, ELO rating and friends"><br>
<b>Profile.</b> Results, win rate, ELO rating and friends.
</td>
</tr>
</table>

## Features

- **Real-time multiplayer:** both players' boards update through Server-Sent Events as soon as a move is saved.
- **Full rules on the server:** Russian draughts rules (flying kings, forced and chained captures), validated by the server before a move is stored.
- **ELO rating:** every finished game updates both players' ratings.
- **In-game tools:** chat, move history, a game timer, draw offers and resigning.
- **Friends and invites:** add friends by email or username and invite online players to a game.
- **Admin panel:** players and game statistics for the administrator account.

## Tech Stack

- **Frontend**: Next.js 14 (App Router), React 18, TypeScript, Tailwind CSS, Framer Motion
- **Backend**: Next.js API Routes, JWT authentication, Server-Sent Events (SSE)
- **Database**: PostgreSQL, Prisma ORM
- **Testing**: Vitest, Testing Library
- **Validation**: Zod schemas for type-safe API validation
- **DevOps**: Docker Compose, Vercel deployment

## How to Run Locally

1. **Clone the repository:**
   ```bash
   git clone https://github.com/Bogdusik/Checkers.git
   cd Checkers
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure environment variables:**
   ```bash
   cp .env.example .env
   ```
   Update `.env` with:
   ```
   DATABASE_URL=postgresql://user:password@localhost:5432/checkers_db
   JWT_SECRET=your-secret-key-minimum-32-characters
   ```

4. **Set up the database:**
   ```bash
   npx prisma generate
   npx prisma db push
   ```

5. **Start the development server:**
   ```bash
   npm run dev
   ```
   Application will be available at `http://localhost:3000`

   **Alternative (Docker):**
   ```bash
   docker-compose up -d
   docker-compose exec app npx prisma db push
   ```

> **Important**: Never hardcode secrets. Always use `.env` file for sensitive data.

## Project Structure

```
Checkers/
├── app/                          # Next.js App Router
│   ├── api/                     # API Routes
│   │   ├── auth/                # Authentication (login, register, logout, me)
│   │   ├── game/                # Game endpoints (create, move, chat, draw, resign)
│   │   ├── friends/             # Friend system endpoints
│   │   └── admin/               # Admin panel endpoints
│   ├── admin/                   # Admin panel page
│   ├── game/                    # Game page
│   ├── login/                   # Login page
│   ├── register/                # Registration page
│   ├── profile/                 # User profile page
│   └── history/                 # Game history page
│
├── components/                   # React Components
│   ├── game/                    # Game-specific components
│   │   ├── CheckersBoard.tsx    # Main game board
│   │   ├── GameChat.tsx        # In-game chat
│   │   ├── GameTimer.tsx        # Game timer component
│   │   ├── MoveHistory.tsx      # Move history display
│   │   └── DrawOffer.tsx        # Draw offer component
│   ├── ui/                      # Reusable UI components
│   │   ├── PlayerSelector.tsx   # Player selection
│   │   ├── ThemeSettings.tsx    # Theme configuration
│   │   └── Toast.tsx            # Toast notifications
│   └── notifications/            # Notification components
│       └── GameInviteNotification.tsx
│
├── lib/                          # Core Logic & Utilities
│   ├── checkers.ts              # Complete checkers game logic
│   ├── auth.ts                  # JWT authentication
│   ├── rating.ts                # ELO rating system
│   ├── statistics.ts            # User statistics
│   ├── validation.ts            # Zod validation schemas
│   ├── rateLimit.ts             # API rate limiting
│   ├── errors.ts                # Error handling
│   ├── prisma.ts                # Prisma client
│   ├── utils.ts                 # General utilities
│   └── __tests__/               # Unit tests
│       └── checkers.test.ts     # Game logic tests
│
├── prisma/                       # Database
│   └── schema.prisma             # Prisma schema
│
├── scripts/                      # Utility Scripts
│   ├── apply-migration.js       # Database migration script
│   └── supabase-rls-*.sql       # Supabase RLS setup
│
├── public/                       # Static Assets
│   └── checkers-logo.svg        # Logo
│
└── [config files]               # Configuration files
    ├── next.config.js           # Next.js config
    ├── tsconfig.json            # TypeScript config
    ├── tailwind.config.ts       # Tailwind config
    ├── vitest.config.mjs        # Vitest config
    └── docker-compose.yml        # Docker setup
```

## What I Learned

- **Real-Time Web Applications**: Implemented Server-Sent Events (SSE) for live game updates without WebSocket complexity
- **Game Logic Development**: Built complete checkers game engine with piece movement, king promotion, forced captures, and win conditions
- **ELO Rating System**: Implemented competitive ranking algorithm that adjusts player ratings based on game outcomes
- **Next.js App Router**: Leveraged Next.js 14 App Router for API routes, server components, and modern React patterns
- **Type-Safe APIs**: Used Zod for comprehensive input validation and TypeScript for end-to-end type safety
- **Database Design**: Designed relational schema with Prisma for users, games, moves, friendships, and statistics

Fork it, use it, improve it - open to PRs!

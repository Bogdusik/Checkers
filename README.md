# Checkers

An online multiplayer checkers game with real-time gameplay, ELO rating system, and comprehensive features. Built to provide a smooth gaming experience with automatic opponent matching, in-game chat, move history, and competitive rankings.

## Demo

![Game Board](screenshots/game-board.png)
![Lobby](screenshots/lobby.png)
![Profile & Statistics](screenshots/profile.png)

## Why It's Cool

- **Real-Time Multiplayer**: Play against other registered players with Server-Sent Events (SSE) for instant game updates
- **ELO Rating System**: Competitive ranking system that tracks player skill and matches opponents of similar levels
- **Full Checkers Logic**: Complete game implementation with regular pieces, kings, forced captures, and all standard rules
- **Rich Game Features**: In-game chat, move history, game timers, draw offers, and friend system for social gaming
- **Automatic Matchmaking**: Lobby system that automatically finds opponents or allows playing against yourself for practice
- **Admin Panel**: Comprehensive admin dashboard for viewing all players, statistics, and managing the platform

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

Fork it, use it, improve it — open to PRs!

# Online Checkers Game

[![CI](https://github.com/Bogdusik/Checkers/workflows/CI/badge.svg)](https://github.com/Bogdusik/Checkers/actions)
[![Next.js](https://img.shields.io/badge/Next.js-14.0.4-black.svg)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.3.3-blue.svg)](https://www.typescriptlang.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15-blue.svg)](https://www.postgresql.org/)
[![License](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

Online checkers game with the ability to play against other registered players or against yourself.

## Features

- ✅ User registration and authentication
- ✅ Play against other registered players
- ✅ Play against yourself (for practice)
- ✅ Automatic opponent search (lobby)
- ✅ Game statistics (wins, losses, draws)
- ✅ Admin panel for viewing all players
- ✅ Real-time game updates (SSE - Server-Sent Events)
- ✅ Full checkers logic (regular pieces and kings)
- ✅ In-game chat
- ✅ Game timer with time controls
- ✅ Draw offers
- ✅ Friend system
- ✅ ELO rating system
- ✅ Move history
- ✅ Rate limiting for API protection
- ✅ Comprehensive input validation
- ✅ Centralized error handling
- ✅ Unit tests for game logic

## Technologies

- **Next.js 14** - React framework with App Router
- **TypeScript** - type safety
- **Prisma** - ORM for database operations
- **PostgreSQL** - database
- **Tailwind CSS** - styling
- **Framer Motion** - animations
- **JWT** - authentication
- **Vitest** - testing framework
- **Zod** - schema validation

## Installation

### Prerequisites
- Node.js 18.x or higher
- PostgreSQL 15 or higher
- npm or yarn

### Local Development

1. Clone the repository:
```bash
git clone https://github.com/Bogdusik/Checkers.git
cd Checkers
```

2. Install dependencies:
```bash
npm install
```

3. Configure environment variables:
```bash
cp .env.example .env
```
Then edit `.env` and set:
```
DATABASE_URL=postgresql://user:password@localhost:5432/checkers_db
JWT_SECRET=your-secret-key-minimum-32-characters
```

4. Set up the database:
```bash
npx prisma generate
npx prisma db push
```

5. Start the development server:
```bash
npm run dev
```

6. Run tests:
```bash
npm test
```

7. Run tests with UI:
```bash
npm run test:ui
```

### Docker Development

1. Copy environment file:
```bash
cp .env.example .env
```

2. Start services with Docker Compose:
```bash
docker-compose up -d
```

3. Run database migrations:
```bash
docker-compose exec app npx prisma db push
```

The application will be available at `http://localhost:3000`

## Deployment

### Docker Deployment

1. Build and run with Docker Compose:
```bash
docker-compose up -d
```

2. Run database migrations:
```bash
docker-compose exec app npx prisma db push
```

The application will be available at `http://localhost:3000`

### Vercel Deployment

1. Push code to GitHub
2. Connect repository to Vercel
3. Add environment variables:
   - `DATABASE_URL` - Your PostgreSQL database URL
   - `JWT_SECRET` - Random secret key (minimum 32 characters)
4. Deployment will automatically run migrations

## Playing Against Other Players

### How it works:

1. **Registration:** Each player registers on the site
2. **Opponent Selection:** 
   - Click "Find Game"
   - Choose "Play Against Yourself" or select a player from the list
3. **Game:** Both players see the board and can make moves
4. **Updates:** Game updates every 2 seconds

### Automatic Search:

- Use the lobby function for automatic opponent search
- The system will find a waiting player or create a new game

## Admin Panel

Email `bogdyn13@gmail.com` automatically receives administrator privileges.

Admin can:
- View all players
- See statistics for each player
- See player's last login

## Project Structure

```
├── app/                    # Next.js App Router
│   ├── api/               # API routes
│   │   ├── auth/          # Authentication endpoints
│   │   ├── game/          # Game endpoints
│   │   ├── friends/       # Friends endpoints
│   │   └── admin/         # Admin endpoints
│   ├── admin/             # Admin panel
│   ├── game/              # Game page
│   ├── login/             # Login page
│   ├── register/          # Registration page
│   ├── profile/           # User profile
│   └── history/           # Game history
├── components/            # React components
│   ├── game/              # Game components
│   │   ├── CheckersBoard.tsx
│   │   ├── GameChat.tsx
│   │   ├── GameTimer.tsx
│   │   ├── MoveHistory.tsx
│   │   └── DrawOffer.tsx
│   ├── ui/                # UI components
│   │   ├── PlayerSelector.tsx
│   │   ├── ThemeSettings.tsx
│   │   └── Toast.tsx
│   └── notifications/     # Notification components
│       └── GameInviteNotification.tsx
├── lib/                   # Utilities
│   ├── auth.ts            # JWT authentication
│   ├── checkers.ts        # Checkers game logic
│   ├── prisma.ts          # Prisma client
│   ├── rating.ts          # ELO rating system
│   ├── statistics.ts      # User statistics
│   ├── errors.ts          # Error handling
│   ├── rateLimit.ts       # Rate limiting
│   ├── validation.ts     # Zod validation schemas
│   ├── utils.ts           # General utilities
│   └── __tests__/         # Unit tests
│       └── checkers.test.ts
├── prisma/                # Prisma schema
│   └── schema.prisma      # Database schema
├── scripts/               # Utility scripts
│   ├── migrate-database.sh    # Database migration script
│   └── supabase-rls-setup.sql # Supabase RLS setup
└── [config files]         # Next.js, TypeScript, Tailwind, Vitest configs
```

## Testing

The project includes unit tests for the core game logic using Vitest:

```bash
# Run all tests
npm test

# Run tests with UI
npm run test:ui

# Run tests with coverage
npm run test:coverage
```

## Code Quality

- **Type Safety**: Full TypeScript coverage
- **Validation**: Zod schemas for all API inputs
- **Error Handling**: Centralized error handling with proper logging
- **Rate Limiting**: In-memory rate limiting for API protection
- **Database**: Optimized queries with proper indexes
- **Documentation**: JSDoc comments for complex functions
- **Testing**: Unit tests for game logic

## Security Features

- JWT-based authentication
- Password hashing with bcrypt
- Rate limiting on API endpoints
- Input validation on all endpoints
- SQL injection protection via Prisma
- XSS protection via React's built-in escaping

## License

MIT

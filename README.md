# Online Checkers Game

Online checkers game with the ability to play against other registered players or against yourself.

## Features

- ✅ User registration and authentication
- ✅ Play against other registered players
- ✅ Play against yourself (for practice)
- ✅ Automatic opponent search (lobby)
- ✅ Game statistics (wins, losses, draws)
- ✅ Admin panel for viewing all players
- ✅ Real-time game updates (polling)
- ✅ Full checkers logic (regular pieces and kings)

## Technologies

- **Next.js 14** - React framework
- **TypeScript** - type safety
- **Prisma** - ORM for database operations
- **PostgreSQL** - database
- **Tailwind CSS** - styling
- **Framer Motion** - animations
- **JWT** - authentication

## Installation

1. Clone the repository
2. Install dependencies:
```bash
npm install
```

3. Configure environment variables (create `.env`):
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

## Deployment on Vercel

Detailed instructions in [DEPLOY.md](./DEPLOY.md)

### Quick start:

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
│   ├── admin/             # Admin panel
│   ├── game/              # Game page
│   ├── login/             # Login page
│   ├── register/          # Registration page
│   └── profile/           # User profile
├── components/            # React components
│   ├── CheckersBoard.tsx  # Checkers board
│   └── PlayerSelector.tsx  # Opponent selector
├── lib/                   # Utilities
│   ├── auth.ts            # JWT authentication
│   ├── checkers.ts        # Checkers game logic
│   └── prisma.ts          # Prisma client
└── prisma/                # Prisma schema
    └── schema.prisma      # Database schema
```

## License

MIT

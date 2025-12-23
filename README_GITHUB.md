# Checkers (Online Game)

A Next.js 14 checkers game with authentication, lobby matchmaking, head-to-head games, self-play mode, real-time polling updates, and an admin dashboard for player stats.

## Stack
- Next.js 14, React 18, TypeScript
- Prisma ORM + PostgreSQL
- Tailwind CSS, Framer Motion
- JWT auth, bcrypt

## Getting Started
1) Install dependencies
```
npm install
```
2) Add `.env` (do not commit):
```
DATABASE_URL=postgresql://user:password@host:5432/db
JWT_SECRET=your-secret-key-min-32-chars
```
3) Generate client and apply schema
```
npx prisma generate
npx prisma db push
```
4) Dev server
```
npm run dev
```

## Deploy (Vercel)
- Build command (set in `vercel.json`): `prisma generate && next build`
- Env vars in Vercel project settings:
  - `DATABASE_URL`
  - `JWT_SECRET`
- After first deploy, run migrations: `npx prisma migrate deploy`

## Scripts
- `npm run dev` — start dev server
- `npm run build` — production build
- `npm run start` — start built app
- `npm run lint` — lint

## Admin
Email `bogdyn13@gmail.com` is auto-promoted to admin.


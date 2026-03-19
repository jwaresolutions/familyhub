# Organize

Family life management system — tasks, calendar, shopping lists, and transit tracking for 4 users.

## Tech Stack

- **Backend**: Node.js + TypeScript + Express + Prisma + PostgreSQL
- **Frontend**: Next.js 14 + React + Tailwind CSS + TanStack Query
- **Mobile**: PWA (installable, offline-read capable)
- **Infrastructure**: Docker Compose (NAS) + Cloudflare Pages (frontend)

## Quick Start (Local Development)

```bash
# 1. Start PostgreSQL
docker compose up -d db

# 2. Copy environment config
cp .env.example .env
# Edit .env with your values

# 3. Run database migrations
npx prisma migrate dev --schema=packages/api/prisma/schema.prisma

# 4. Seed users (password: organize123)
cd packages/api && npx tsx src/db/seed.ts && cd ../..

# 5. Start API server (port 3001)
npm run dev --workspace=@organize/api

# 6. Start frontend (port 3000) — in another terminal
npm run dev --workspace=@organize/web
```

Login with `user1`/`organize123` (users 1-4 available).

## Project Structure

```
organize/
├── packages/
│   ├── shared/     # @organize/shared — TypeScript types + Zod validation
│   ├── api/        # @organize/api — Express REST API + Prisma ORM
│   └── web/        # @organize/web — Next.js frontend + PWA
├── docker-compose.yml
├── Dockerfile
└── .env.example
```

## Features

- **Kanban Tasks** — Drag-and-drop board, categories (Family/Work/Apartment/House/Boat), assignees, priorities
- **Calendar** — Month/week views, color-coded per user, recurring events (iCal RRULE)
- **Shopping Lists** — Store tags, price tracking, price comparison charts, product autocomplete
- **Transit Tracker** — Real-time bus arrivals via OneBusAway API, saved stops with auto-refresh
- **Dashboard** — Widgets for upcoming tasks, today's events, shopping progress, next buses
- **PWA** — Installable on phones/tablets, dark mode, offline-aware
- **Extensible** — Module registry pattern, add new features without touching core code

## Production Deployment

See [DEPLOYMENT.md](DEPLOYMENT.md) for full NAS + Cloudflare setup guide.

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `DB_PASSWORD` | PostgreSQL password | `changeme` |
| `DATABASE_URL` | Full PostgreSQL connection string | — |
| `JWT_SECRET` | Secret for JWT signing | — |
| `OBA_API_KEY` | OneBusAway API key | `TEST` |
| `PORT` | API server port | `3001` |
| `CORS_ORIGIN` | Allowed CORS origins | `*` |
| `NEXT_PUBLIC_API_URL` | API URL for frontend | `http://localhost:3001` |

## Adding a New Module

1. Create `packages/api/src/modules/{name}/` with `{name}.router.ts` + `{name}.service.ts`
2. Call `registerModule()` to auto-mount at `/api/v1/{name}`
3. Add Prisma models to `schema.prisma`, run `npx prisma migrate dev`
4. Create `packages/web/src/app/{name}/page.tsx` + components
5. Module appears in sidebar automatically via `/api/v1/modules`

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

## NAS Deployment (Docker Compose)

Copy the following into your NAS Docker manager. Replace `CHANGE_ME_TUNNEL_TOKEN` with your Cloudflare tunnel token. All other secrets (DB password, JWT secret) are auto-generated on first boot.

The Cloudflare tunnel should be configured to route `api-familyhub.jware.dev` to `http://api:3001`.

The frontend is deployed separately to Cloudflare Pages at `familyhub.jware.dev`.

```yaml
services:
  init:
    image: alpine:3.19
    restart: "no"
    volumes:
      - secrets:/secrets
    command: >
      sh -c '
        if [ ! -f /secrets/db_password ]; then
          head -c 32 /dev/urandom | base64 | tr -d "/+=" | head -c 32 > /secrets/db_password
          head -c 32 /dev/urandom | base64 | tr -d "/+=" | head -c 32 > /secrets/jwt_secret
          echo "Secrets generated."
        else
          echo "Secrets already exist, skipping."
        fi
      '

  db:
    image: postgres:16-alpine
    restart: unless-stopped
    depends_on:
      init:
        condition: service_completed_successfully
    environment:
      POSTGRES_DB: organize
      POSTGRES_USER: organize
      POSTGRES_PASSWORD_FILE: /run/secrets/db_password
    volumes:
      - pgdata:/var/lib/postgresql/data
      - secrets:/run/secrets:ro
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U organize"]
      interval: 10s
      timeout: 5s
      retries: 5

  api:
    image: ghcr.io/jwaresolutions/familyhub:latest
    restart: unless-stopped
    depends_on:
      db:
        condition: service_healthy
    volumes:
      - secrets:/secrets:ro
    environment:
      OBA_API_KEY: TEST
      CORS_ORIGIN: https://familyhub.jware.dev
      NODE_ENV: production
      PORT: "3001"

  tunnel:
    image: cloudflare/cloudflared:latest
    restart: unless-stopped
    depends_on:
      - api
    command: tunnel run
    environment:
      TUNNEL_TOKEN: CHANGE_ME_TUNNEL_TOKEN

volumes:
  pgdata:
  secrets:
```

To view the auto-generated secrets:

```bash
docker compose exec api sh -c 'echo "DB_PASSWORD: $(cat /secrets/db_password)" && echo "JWT_SECRET: $(cat /secrets/jwt_secret)"'
```

For the full setup walkthrough, see [DEPLOYMENT.md](DEPLOYMENT.md).

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `DB_PASSWORD` | PostgreSQL password | `changeme` |
| `DATABASE_URL` | Full PostgreSQL connection string | — |
| `JWT_SECRET` | Secret for JWT signing | — |
| `OBA_API_KEY` | OneBusAway API key (optional, `TEST` works for Puget Sound) | `TEST` |
| `PORT` | API server port | `3001` |
| `CORS_ORIGIN` | Allowed CORS origins | `*` |
| `NEXT_PUBLIC_API_URL` | API URL for frontend | `http://localhost:3001` |

## Adding a New Module

1. Create `packages/api/src/modules/{name}/` with `{name}.router.ts` + `{name}.service.ts`
2. Call `registerModule()` to auto-mount at `/api/v1/{name}`
3. Add Prisma models to `schema.prisma`, run `npx prisma migrate dev`
4. Create `packages/web/src/app/{name}/page.tsx` + components
5. Module appears in sidebar automatically via `/api/v1/modules`

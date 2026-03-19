# Deployment Guide

## Architecture

```
[Phone/Browser] → [Cloudflare Access] → [Cloudflare Pages (frontend)]
                                              ↓ API calls
                                       [Cloudflare Tunnel]
                                              ↓
                                       [NAS: Docker]
                                         ├── API (port 3001)
                                         └── PostgreSQL (port 5432)
```

## Step 1: Deploy on NAS

### 1.1 Clone and start

```bash
git clone <your-repo-url> ~/organize
cd ~/organize

# This is all you need — secrets auto-generate on first run
docker compose up -d
```

That's it. The `init` service auto-generates `.env` with random secrets, PostgreSQL starts, the API runs migrations automatically.

### 1.2 View generated secrets

```bash
./scripts/show-secrets.sh
```

### 1.3 Seed users (first time only)

```bash
docker compose exec api node -e "
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');
const prisma = new PrismaClient();
async function main() {
  const pw = await bcrypt.hash('organize123', 10);
  const users = [
    { username: 'user1', name: 'User 1', color: '#3B82F6', password: pw },
    { username: 'user2', name: 'User 2', color: '#EF4444', password: pw },
    { username: 'user3', name: 'User 3', color: '#10B981', password: pw },
    { username: 'user4', name: 'User 4', color: '#F59E0B', password: pw },
  ];
  for (const u of users) {
    await prisma.user.upsert({ where: { username: u.username }, update: {}, create: u });
  }
  console.log('Done');
}
main().finally(() => prisma.\$disconnect());
"
```

Change usernames, names, and passwords for your family before running.

### 1.4 Configure for production

After first run, edit the auto-generated `.env` to set:

```bash
# Point to your Cloudflare Pages domain
CORS_ORIGIN=https://organize.yourdomain.com

# Set your OneBusAway API key (when you have one)
OBA_API_KEY=your-key-here
```

Then restart:
```bash
docker compose restart api
```

## Step 2: Cloudflare Tunnel

### 2.1 Install cloudflared on NAS

```bash
# Docker method (recommended)
docker run -d --name cloudflared --restart unless-stopped \
  cloudflare/cloudflared:latest tunnel --no-autoupdate run \
  --token <YOUR_TUNNEL_TOKEN>
```

### 2.2 Create tunnel in Cloudflare dashboard

1. Go to **Zero Trust** → **Networks** → **Tunnels**
2. Click **Create a tunnel**
3. Name it `organize-nas`
4. Copy the tunnel token
5. Add a **Public hostname**:
   - Subdomain: `api` (or `organize-api`)
   - Domain: `yourdomain.com`
   - Service: `http://host.docker.internal:3001`

Your API is now reachable at `https://api.yourdomain.com`.

## Step 3: Cloudflare Pages (Frontend)

### 3.1 Connect your repo

1. Go to **Cloudflare Dashboard** → **Workers & Pages** → **Create**
2. Connect your Git repository
3. Configure build settings:
   - **Framework**: Next.js
   - **Build command**: `npm run build --workspace=@organize/web`
   - **Build output directory**: `packages/web/.next`
   - **Root directory**: `/` (monorepo root)

### 3.2 Environment variables in Pages

Add in **Settings** → **Environment Variables**:
```
NEXT_PUBLIC_API_URL=https://api.yourdomain.com
```

### 3.3 Custom domain

1. Go to your Pages project → **Custom domains**
2. Add `organize.yourdomain.com`

## Step 4: Cloudflare Access

Protect both the frontend and API:

1. Go to **Zero Trust** → **Access** → **Applications**
2. **Add an application** → Self-hosted
3. Configure:
   - Name: `Organize`
   - Application domain: `organize.yourdomain.com`
   - Also add: `api.yourdomain.com`
4. Create a policy:
   - Allow: Emails matching your family's email addresses

## Step 5: OneBusAway API Key

1. Visit https://github.com/OneBusAway/onebusaway/wiki
2. Follow instructions to request an API key for Puget Sound
3. Update `.env` on NAS with the key
4. Restart: `docker compose restart api`

## Backups

```bash
# Manual backup
docker compose exec db pg_dump -U postgres organize > backup_$(date +%Y%m%d).sql

# Restore
cat backup_20260319.sql | docker compose exec -T db psql -U postgres organize
```

### Automated daily backup (add to crontab)
```bash
0 2 * * * cd ~/organize && docker compose exec -T db pg_dump -U postgres organize > ~/backups/organize_$(date +\%Y\%m\%d).sql
```

## Updating

```bash
cd ~/organize
git pull
docker compose up -d --build
```

The API container automatically runs `prisma migrate deploy` on startup.

## Troubleshooting

| Issue | Fix |
|-------|-----|
| API not reachable | `docker compose logs api` |
| DB connection error | `docker compose logs db`, verify `.env` exists |
| Frontend can't reach API | Verify `NEXT_PUBLIC_API_URL` and `CORS_ORIGIN` |
| Tunnel not connecting | `docker logs cloudflared`, verify tunnel token |
| Login fails | `docker compose exec db psql -U postgres organize -c "SELECT username FROM \"User\""` |
| View secrets | `./scripts/show-secrets.sh` |
| Regenerate secrets | Delete `.env` then `docker compose up -d` |

#!/bin/sh
# Auto-generates .env if it doesn't exist

ENV_FILE="$(dirname "$0")/../.env"

if [ -f "$ENV_FILE" ]; then
  echo ".env already exists, skipping generation"
  exit 0
fi

DB_PASSWORD=$(openssl rand -hex 16)
JWT_SECRET=$(openssl rand -hex 32)

cat > "$ENV_FILE" <<EOF
DB_PASSWORD=${DB_PASSWORD}
DATABASE_URL=postgresql://postgres:${DB_PASSWORD}@localhost:5433/organize
JWT_SECRET=${JWT_SECRET}
OBA_API_KEY=TEST
PORT=3001
CORS_ORIGIN=*
NEXT_PUBLIC_API_URL=http://localhost:3001
EOF

echo "Generated .env with random secrets"

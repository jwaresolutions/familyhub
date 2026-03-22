#!/bin/sh
set -e

# Read secrets from volume
if [ -f /secrets/db_password ] && [ -z "$DATABASE_URL" ]; then
  DB_PASS=$(cat /secrets/db_password)
  export DATABASE_URL="postgresql://organize:${DB_PASS}@db:5432/organize"
fi

if [ -f /secrets/jwt_secret ] && [ -z "$JWT_SECRET" ]; then
  export JWT_SECRET=$(cat /secrets/jwt_secret)
fi

# Run migrations
npx prisma migrate deploy --schema=packages/api/prisma/schema.prisma

# Start the server
exec node packages/api/dist/index.js

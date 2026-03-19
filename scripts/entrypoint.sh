#!/bin/sh
set -e

# Run migrations
npx prisma migrate deploy --schema=packages/api/prisma/schema.prisma

# Start the server
exec node packages/api/dist/index.js

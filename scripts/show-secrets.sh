#!/bin/sh
# Display generated secrets from .env

ENV_FILE="$(dirname "$0")/../.env"

if [ ! -f "$ENV_FILE" ]; then
  echo "No .env file found. Run: docker compose up -d"
  exit 1
fi

echo ""
echo "=== Organize Secrets ==="
echo ""
grep DB_PASSWORD "$ENV_FILE" | head -1
grep JWT_SECRET "$ENV_FILE"
echo ""
echo "=== Default Login ==="
echo ""
echo "Users: user1, user2, user3, user4"
echo "Password: organize123"
echo ""

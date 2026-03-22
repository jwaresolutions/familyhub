#!/bin/sh
# Generate secrets on first boot
if [ ! -f /secrets/db_password ]; then
  head -c 32 /dev/urandom | base64 | tr -d "/+=" | head -c 32 > /secrets/db_password
  head -c 32 /dev/urandom | base64 | tr -d "/+=" | head -c 32 > /secrets/jwt_secret
  echo "Secrets generated."
fi

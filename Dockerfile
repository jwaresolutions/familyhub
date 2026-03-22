FROM node:20-alpine AS builder

WORKDIR /app

# Copy root workspace config
COPY package.json package-lock.json ./
COPY packages/shared/package.json packages/shared/
COPY packages/api/package.json packages/api/

# Install all workspace dependencies
RUN npm ci --workspace=@organize/shared --workspace=@organize/api

# Copy source
COPY tsconfig.base.json ./
COPY packages/shared/ packages/shared/
COPY packages/api/ packages/api/

# Build shared first, then api
RUN npm run build --workspace=@organize/shared
RUN npx prisma generate --schema=packages/api/prisma/schema.prisma
RUN npm run build --workspace=@organize/api

# Production image
FROM node:20-alpine

RUN apk add --no-cache openssl

WORKDIR /app

# Copy built artifacts
COPY --from=builder /app/package.json /app/package-lock.json ./
COPY --from=builder /app/packages/shared/package.json packages/shared/
COPY --from=builder /app/packages/api/package.json packages/api/

# Install production deps only
RUN npm ci --workspace=@organize/shared --workspace=@organize/api --omit=dev

# Copy compiled output
COPY --from=builder /app/packages/shared/dist packages/shared/dist
COPY --from=builder /app/packages/api/dist packages/api/dist
COPY --from=builder /app/packages/api/prisma packages/api/prisma
COPY --from=builder /app/node_modules/.prisma node_modules/.prisma

COPY scripts/entrypoint.sh /app/entrypoint.sh
RUN chmod +x /app/entrypoint.sh

EXPOSE 3001

ENTRYPOINT ["/app/entrypoint.sh"]

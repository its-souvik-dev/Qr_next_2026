# syntax=docker/dockerfile:1

# ---- deps: install all dependencies (Prisma client is generated at build time) ----
FROM node:24-alpine AS deps
WORKDIR /app
RUN apk add --no-cache libc6-compat
COPY package.json package-lock.json ./
COPY prisma ./prisma
COPY prisma.config.ts ./
RUN npm ci --ignore-scripts

# ---- builder: generate Prisma client + Next.js standalone build ----
FROM node:24-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# NEXT_PUBLIC_* values are inlined into the client bundle at build time.
ARG NEXT_PUBLIC_APP_URL=http://localhost:3000
ENV NEXT_PUBLIC_APP_URL=$NEXT_PUBLIC_APP_URL \
    NEXT_TELEMETRY_DISABLED=1 \
    DATABASE_URL=postgresql://build:build@localhost:5432/build
RUN npx prisma generate && npx next build

# ---- migrate: one-shot container that applies migrations and seeds the login user ----
FROM deps AS migrate
COPY src/lib/auth/scrypt.ts ./src/lib/auth/scrypt.ts
COPY prisma/seed.ts ./prisma/seed.ts
RUN DATABASE_URL=postgresql://build:build@localhost:5432/build npx prisma generate
CMD ["sh", "-c", "npx prisma migrate deploy && npx prisma db seed"]

# ---- runner: minimal production image ----
FROM node:24-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production NEXT_TELEMETRY_DISABLED=1 PORT=3000 HOSTNAME=0.0.0.0
RUN addgroup -S nodejs -g 1001 && adduser -S nextjs -u 1001 -G nodejs
COPY --from=builder --chown=nextjs:nodejs /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
USER nextjs
EXPOSE 3000
HEALTHCHECK --interval=15s --timeout=5s --start-period=20s --retries=5 \
  CMD wget -qO- http://127.0.0.1:3000/api/auth/session >/dev/null || exit 1
CMD ["node", "server.js"]

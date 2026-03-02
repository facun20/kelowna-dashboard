# ── Stage 1: Install dependencies ─────────────────────────
FROM node:22-slim AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --ignore-scripts && \
    npm rebuild better-sqlite3

# ── Stage 2: Build the Next.js app ───────────────────────
FROM node:22-slim AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Next.js collects anonymous telemetry — disable in prod
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production

# Ensure public dir exists (may be empty)
RUN mkdir -p public

RUN npm run build

# ── Stage 3: Production runner ───────────────────────────
FROM node:22-slim AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Copy built app + cron scheduler
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/public ./public
COPY --from=builder /app/next.config.ts ./next.config.ts
COPY --from=builder /app/tsconfig.json ./tsconfig.json
COPY --from=builder /app/src ./src
COPY --from=builder /app/cron.mjs ./cron.mjs

# Entrypoint script: starts Next.js + cron in parallel
COPY --from=builder /app/start.sh ./start.sh
RUN sed -i 's/\r$//' start.sh && chmod +x start.sh

# SQLite data directory — mount a Railway volume at /data
RUN mkdir -p /data
ENV DB_PATH=/data/kelowna.db

# The app runs on port 3000
EXPOSE 3000

CMD ["./start.sh"]

# ─────────────────────────────────────────────────────────────
# SEARM1 API — production Dockerfile
# ─────────────────────────────────────────────────────────────
# Multi-stage build: compile TypeScript → run with node.
# Uses the production DATABASE_URL (postgres://) override from
# docker-compose.yml. (For sandbox we use better-sqlite3 + bun.)
# ─────────────────────────────────────────────────────────────

FROM node:20-slim AS builder
WORKDIR /app

# Copy workspace root + engine + api manifests for install.
COPY package.json ./
COPY packages/engine/package.json ./packages/engine/
COPY packages/api/package.json ./packages/api/
COPY tsconfig.base.json ./

RUN npm install --workspace=@searm1/api --workspace=@searm1/engine --include-workspace-root

# Copy sources and compile.
COPY packages/engine/ ./packages/engine/
COPY packages/api/ ./packages/api/

RUN npm run build --workspace=@searm1/engine
RUN npm run build --workspace=@searm1/api

# ─────────────────────────────────────────────────────────────
FROM node:20-slim AS runner
WORKDIR /app
ENV NODE_ENV=production

COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/packages/engine/dist ./packages/engine/dist
COPY --from=builder /app/packages/api/dist ./packages/api/dist

EXPOSE 3001
CMD ["node", "packages/api/dist/server.js"]

# ─────────────────────────────────────────────────────────────
# SEARM1 Simulator — production Dockerfile
# ─────────────────────────────────────────────────────────────
# Lightweight Node.js runtime for the sensor generator. Talks
# to the API container over the internal docker network.
# ─────────────────────────────────────────────────────────────

FROM node:20-slim AS builder
WORKDIR /app

COPY package.json ./
COPY packages/simulator/package.json ./packages/simulator/
COPY tsconfig.base.json ./

RUN npm install --workspace=@searm1/simulator --include-workspace-root

COPY packages/simulator/ ./packages/simulator/
RUN npm run build --workspace=@searm1/simulator

# ─────────────────────────────────────────────────────────────
FROM node:20-slim AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV API_URL=http://api:3001
ENV TICK_MS=5000

COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/packages/simulator/dist ./packages/simulator/dist

CMD ["node", "packages/simulator/dist/sensor-generator.js"]

# VVU Gateway — Ubuntu Pools / ProofBridge

Next.js 14 App Router UI for the Venture Vision Ubuntu (VVU) Gateway — Phase 1 surface focused on Ubuntu Pools, ProofBridge on-chain receipting, Village OS dashboards, and the minimal dark VVU Gateway aesthetic for authenticated tooling.

## What’s in this build

- Public marketing flow (warm Ubuntu Pools theme): `/(marketing)/`
  - `/` — ProofBridge / Ubuntu Pools landing
  - `/about` — VVU background + Phase 1 / Phase 2 toggle
  - `/faqs` — POPIA, KYC, Stitch, ProofBridge Q&A
  - `/ubuntu-pools` — pool types + how-it-works

- Authenticated platform (minimal dark VVU Gateway theme): `/(app)/`
  - `/dashboard` — Village OS dashboard (Ubuntu Score, Pool Creator, Architecture Visualizer, Lindiwe AI)
  - `/dashboard/ledger` — transaction records
  - `/dashboard/village` — village node/operations
  - `/dashboard/wallet` — financial operations
  - `/compliance` — KYC/POPIA/AML
  - `/governance` — proposals + voting
  - `/trust` — security/audit overview

- Developer portals: `/(developer)/`
  - `/docs` — API/SDK documentation hub
  - `/api` — developer token dashboard
  - `/integrations/b2b` — B2B partner portal
  - `/integrations/terminal` — POS/hardware integrations

- Admin tools: `/(admin)/`
  - `/admin/monitoring` — systems health
  - `/onboarding/whatsapp` — WhatsApp onboarding

- Backend route handlers: `app/api/` (metrics, gates, mint, verify, webhooks, admin circuit breaker)

## Tech

- Next.js 14 App Router + Route Groups
- Inline styles + CSS custom properties (no Tailwind install required)
- AntColonyLoader FX + AdvancedGlobeTelemetry on the root FX dashboard
- Supabase auth middleware for protected route groups

## Local setup

```bash
cp .env.example .env.local
npm install
npm run dev
```

Open `http://localhost:3000` for the marketing landing; `/dashboard` requires an authenticated session via middleware.

## Scripts

- `npm run dev` — local dev server
- `npm run build` — production build
- `npm start` — start compiled app
- `npm run lint` — ESLint checks
- `npm run lint:fix` — auto-fix lint issues
- `npm test` — Jest unit/integration tests
- `npm run test:e2e` — Playwright E2E

## Deployment

```bash
npm run build
vercel --prod --force
```

`.vercelignore` excludes cache, build artifacts, large fixtures, and old standalone HTML files.

## Phase roadmap

- Phase 1 (current): Ubuntu Pools + ProofBridge + Village OS + ANT Telemetry + Gate-1
- Phase 2 (Q1 2027 transition period): SAFEGRID, SAFESTAKES, Parallel Water Economy, ProofBridge-Liner upscale, automated scaling gates

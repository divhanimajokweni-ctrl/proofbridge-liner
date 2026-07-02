# INVESTIGATION — FULL STACK STABILIZATION + SPEC INFRASTRUCTURE — 2026-07-02

## Task
Summarize and execute the VVU-BRAIN OS specification: produce a production-grade dashboard with real-time telemetry, token management, JWT auth, WebSocket streaming, Tailwind optimization, and update the SDD pipeline to reflect the current committed state.

## Current State

### TypeScript — CLEAN ✅
- Commit `097d964` fixed all 15 TS errors across `lib/safestakes/`, `lib/safekrypte/`, `lib/mainframe/`
- `@types/express ^4.29.5` added to devDependencies
- `npx tsc --noEmit`: **zero errors**
- `npm run build`: **PASSES** cleanly

### Drizzle DB Layer — LANDED ✅ (commit `12c8c5d`)
- 16 schema files, 35 tables across `public`, `ubuntu_pools`, `safestake`
- Migration at `lib/db/migrations/0000_smooth_zuras.sql`
- `DATABASE_URL` not yet set in runtime `.env`
- Supabase project not yet linked

### Canonical Docs — LANDED ✅ (commit `7b8e381`)
- `ARCHITECTURE.md`, `branch-policy.md`, `CANONICAL_MANIFEST.md` all committed

### Pre-Push Critical Files — ALL PRESENT ✅
- `app/api/verify/route.ts` ✅
- `app/api/mint/route.ts` ✅
- `src/middleware.ts` ✅
- `AGENTS.md` ✅

### Dashboard — EXISTING
- `/app/dashboard/page.tsx` — operational deck with WebSocket telemetry, metric cards, project grid, Antony Queue Engine
- `/app/dashboard/layout.tsx` — dashboard layout with `DashboardNav`
- `/app/dashboard/DashboardNav.tsx` — navigation bar
- WebSocket connection to `ws://localhost:3001` with mock fallback

### Missing from Spec (to implement)
- **No `tailwind.config.js`** — the project uses CSS custom properties instead
- **No TokenManagementPanel component** — would fit under `/components/`
- **No `/app/api/auth/route.ts`** — JWT authentication endpoint
- **No `/app/api/chronicle-fetch/route.ts`** — chronicle chain data API
- **No `/app/register/page.tsx`** — tenant registration page
- **System-level infra** (`/opt/vvu/`) — does not exist on this host; not applicable to workspace

## Relevant Audit Findings
- Pre-push critical files: all present ✅
- Branch: `compliance-fabric` (canonical)
- `.vercelignore` updated in `35c93a6` to include `server/`

## Hard Failures In Scope
None. This is Tier-2 dashboard and API infrastructure.

## Current Branch
`compliance-fabric` (HEAD: `35c93a6 fix: remove server/ from .vercelignore`)

## Required Branch
`compliance-fabric` (no branch switch needed)

## Downstream Dependencies
- Token management panel depends on `/api/keys-generate` (not yet built)
- Auth route depends on `jsonwebtoken` package (check if installed)
- Chronicle fetch depends on chronicle data source

## Unknowns Before Planning
1. Whether `jsonwebtoken` and `@types/jsonwebtoken` are in `package.json`
2. Whether the chronicle_chain.log path `/opt/vvu/data/` exists or if we need a mock data source
3. Whether `@upstash/redis` is installed (for Upstash-backed data layer)

## Stale Context Risk
All active pipeline files (`INVESTIGATION.md`, `PLAN.md`, `VALIDATION.md`, `HANDOFF.md`) still reference the pre-TS-fix state from before commit `097d964`. They must be updated.

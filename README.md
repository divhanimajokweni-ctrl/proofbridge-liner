# VVU Platform

Next.js 14 App Router implementation for the Venture Vision Ubuntu platform, integrating animated UI-FX components, ProofBridge marketing flows, and the existing compliance-fabric gate infrastructure.

## Structure

- `app/(marketing)/` — Public marketing pages and the ProofBridge landing page
- `app/(app)/` — Authenticated platform surfaces: Dashboard, Ledger, Village, Wallet, Compliance, Governance, Trust
- `app/(developer)/` — Developer docs, API dashboard, and integration portals
- `app/(admin)/` — Admin-only pages: monitoring, onboarding
- `app/api/` — Backend route handlers (metrics, gates, lindiwe, verify, mint)

## Key UI Surface

- `src/app/page.tsx` — FX dashboard with AntColonyLoader overlay and AdvancedGlobeTelemetry Three.js globe
- `src/components/fx/` — Animated dashboard components from `vvv/UI-FX.md`

## Getting Started

```bash
npm install
npm run dev
```

## Environment

Configure in `.env.local`:
```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
```

## Scripts

- `npm run dev` — local dev server
- `npm run build` — production build
- `npm test` / `npm run test:e2e` — unit and Playwright tests
- `npm run lint` — ESLint checks

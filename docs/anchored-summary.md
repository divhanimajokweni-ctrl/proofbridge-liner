# Anchored Summary — VVU Gateway UI Build

## Goal
- Build the Phase-1 minimal dark VVU Gateway UI centered on Ubuntu Pools and ProofBridge, with a Phase-2 (Q1 2027) transition overview panel for SAFEGRID / SAFESTAKES / Parallel Water Economy / ProofBridge-Liner upscale.

## Constraints & Preferences
- Route groups used: (marketing) warm Ubuntu Pools theme; (app)/(developer)/(admin) dark VVU Gateway theme (#0d1117 / #c8a96e / #00E5FF / #3ecf8e).
- Marketing pages are public (no auth required); authenticated app pages are middleware-gated.
- Root body must remain scrollable (marketing pages); dashboard uses `height: calc(100dvh - 64px)` self-scroll.
- Phase 2 items must appear only as an overview, not shipped features.

## Progress
### Done
- Fixed `src/middleware.ts` PUBLIC_PATHS to include `/about`, `/faqs`, `/ubuntu-pools`.
- Removed `overflow: hidden` from root `src/app/layout.tsx` body.
- Rebuilt `src/app/globals.css` with shared design tokens for both marketing and app themes.
- Rewrote `src/app/(marketing)/layout.tsx` with sticky nav (Ubuntu Pools mark + links + CTA) and dark footer.
- Built `src/app/(marketing)/page.tsx` as the ProofBridge/Ubuntu Pools marketing landing page (ANT ticker, hero with 2-up pool card, live stats).
- Built `src/app/(marketing)/about/page.tsx` with Phase 1 / Phase 2 toggle.
- Built `src/app/(marketing)/faqs/page.tsx` with collapsible KYC/POPIA/Stitch/ProofBridge Q&A.
- Built `src/app/(marketing)/ubuntu-pools/page.tsx` with how-it-works steps and pool type cards.
- Built `src/app/(app)/dashboard/page.tsx` as Village OS dashboard: Ubuntu Score Simulator (5 sliders + ring + privilege tiers), Pool Creator (form with live ProofBridge hash output), Architecture Visualizer (6-layer click stack), Lindiwe AI Console (chat + quick actions).
- Built app skeleton pages: `/dashboard/ledger`, `/dashboard/village`, `/dashboard/wallet`, `/compliance`, `/governance`, `/trust`.
- Built developer skeleton pages: `/docs`, `/api`, `/integrations/b2b`, `/integrations/terminal`.
- Built admin skeleton pages: `/admin/monitoring`, `/onboarding/whatsapp`.
- Verified `npm run build` passes.

### In Progress
- (none)

### Blocked
- (none)

## Key Decisions
- Marketing UI surface is the warm Ubuntu Pools brand (bone/warm-white/amber/sage).
- All app UI surfaces are minimal dark VVU Gateway (#0d1117, #1c2535 borders, #c8a96e gold, #00E5FF cyan, #3ecf8e green).
- Phase 2 roadmap surfaced via toggled Overview panel (About page) only; no Phase-2 pages created.

## Next Steps
1. Run `vercel --prod --force` deploy from `compliance-fabric` branch.
2. Populate `/api/v1/ledger` and `/api/v1/auth` route handlers if/when backend connects.
3. Connect Lindiwe chat, Pool Creator anchoring, and ANT tickers to live data sources.
4. Prepare Phase 2 build board for SAFEGRID / SAFESTAKES / Water Economy / Poofbridge-Liner upscale.

## Critical Context
- Repo `proofbridge-liner` is deployed at `https://proofbridge-liner.vercel.app`.
- The `app/` dir still contains legacy stubs alongside `src/app/`; active code lives in `src/app/`.
- Middleware protection applies to `(app)`, `(developer)`, `(admin)` route groups; marketing is public.

## Relevant Files
- `src/app/(marketing)/page.tsx` — marketing landing hero
- `src/app/(marketing)/about/page.tsx` — Phase 1 + Phase 2 toggle
- `src/app/(marketing)/ubuntu-pools/page.tsx` — pool types + how-it-works
- `src/app/(app)/dashboard/page.tsx` — Village OS dashboard
- `src/app/(app)/dashboard/ledger/page.tsx` — transaction ledger
- `src/app/(app)/dashboard/village/page.tsx` — village node monitor
- `src/app/(app)/dashboard/wallet/page.tsx` — wallet/escrow cards
- `src/app/(app)/compliance/page.tsx` — KYC/POPIA portal
- `src/app/(app)/governance/page.tsx` — proposals + voting
- `src/app/(app)/trust/page.tsx` — security/audit overview
- `src/app/(developer)/docs/page.tsx` — API/SDK docs hub
- `src/app/(developer)/api/page.tsx` — dev token dashboard
- `src/app/(developer)/integrations/b2b/page.tsx` — B2B partner portal
- `src/app/(developer)/integrations/terminal/page.tsx` — POS/hardware UI
- `src/app/(admin)/admin/monitoring/page.tsx` — systems health
- `src/app/(admin)/onboarding/whatsapp/page.tsx` — WhatsApp onboarding dashboard
- `src/middleware.ts` — auth gate for (app)/(developer)/(admin)

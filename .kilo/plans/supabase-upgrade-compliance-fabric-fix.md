# Plan: Supabase Upgrade & compliance-fabric Security Fix

**Target branch:** `compliance-fabric` (fixes applied in-place)
**Strategy:** Cherry-pick/re-apply Gate D enforcement, middleware circuit checks, and on-chain anchoring from `main` into `compliance-fabric`

## Goals
1. Complete the Supabase integration (Tailwind CSS v4, shadcn, provider, layout wiring)
2. Fix critical security regressions on `compliance-fabric` branch (Gate D enforcement, middleware circuit checks, on-chain anchoring)
3. Verify the project builds cleanly

---

## Step 1 — Verify Supabase Integration Is Complete

Already done:
- `@supabase/supabase-js`, `@supabase/ssr` installed
- Tailwind CSS v4 + PostCSS + `@tailwindcss/postcss` installed
- shadcn init completed (`components.json`, `globals.css`, `src/lib/utils.ts`, `src/components/ui/button.tsx`)
- `@supabase/supabase-client-nextjs` component added → created `src/lib/supabase/client.ts`, `server.ts`, `middleware.ts`
- `.env.local` created with Supabase credentials
- Supabase agent skills installed

Remaining:
- [ ] Verify `src/lib/supabase/middleware.ts` is wired into the root `middleware.ts` (or kept as a helper)
- [ ] Add Supabase provider/wrapper to root layout if auth/context is needed
- [ ] Verify `app/globals.css` Tailwind imports work with the PostCSS pipeline

## Step 2 — Fix compliance-fabric Branch Security Regressions

The `main` → `compliance-fabric` diff shows these critical regressions:

### 2a. Restore Gate D Hard Enforcement in `app/api/verify/route.ts`
- The circuit breaker tripped check was removed — attestation proceeds even when `circuitOpen === false`
- The `BAYESIAN_TRIP` halting was removed — data with posterior below threshold is still returned
- The `updateProof` on-chain anchoring was removed — no deed hash recorded on-chain
- Fail-closed logic replaced with soft-attest fallback on RPC error

**Fix:** Restore the Gate D enforcement, Bayesian trip, updateProof anchoring, and fail-closed logic from `main`.

### 2b. Restore Circuit Breaker Middleware in `middleware.ts`
- The `isCircuitTripped()` check was removed entirely
- All routes now pass through without checking the global circuit breaker state

**Fix:** Restore the circuit breaker middleware check from `main`.

### 2c. Update `AGENTS.md` Baseline Deployment ID
- Restore `dpl_HaB2jdXuZM7H7i4wevjSnPgTFgCJ` as the baseline deployment ID (or keep the new one if it is valid — verify)

## Step 3 — Build Verification
- [ ] Run `npm run typecheck` to verify TypeScript compiles
- [ ] Run `npm run build` to verify Next.js builds
- [ ] Fix any type/build errors

## Step 4 — Deploy Preparation (if needed)
- [ ] Ensure `.vercelignore` excludes cache/.config/.git
- [ ] Validate all critical files exist: `app/api/verify/route.ts`, `app/api/mint/route.ts`, `middleware.ts`, `AGENTS.md`

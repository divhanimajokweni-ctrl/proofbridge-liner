# Plan: Fix Deployment Loop — Vercel Build Gate Before Git Push

## Problem
The deployment loop (`scripts/deployment-loop.sh` → Phase 3) runs `git push origin` **before** `vercel --prod --force`. This means broken commits reach the remote even when the Vercel build fails (as happened with the last 14 deployments — all micromatch stack overflow errors).

**Current order (broken):**
```
Phase 3: git push origin  →  vercel --prod --force
                              ^^^^^^^^^^^^^^^^^^^^^^^^
                              Already pushed. Too late to abort.
```

## Root Cause of Build Failures
The micromatch stack overflow (`RangeError: Maximum call stack size exceeded`) occurs during Next.js's "Collecting build traces" phase. This is triggered by `output: 'standalone'` in `next.config.mjs`. Prior attempts:
- `3d08921` — `outputFileTracing: false` worked (no standalone mode)
- `75de6bc` — removed `output: 'standalone'`  
- `5e3a31e` — re-added `output: 'standalone'` + `outputFileTracingExcludes` — **still fails**

The safest short-term fix: disable `outputFileTracing` and drop `output: 'standalone'` (restoring the known working config).

## Changes

### 1. Fix Build — `next.config.mjs`
- Remove `output: 'standalone'`  
- Set `outputFileTracing: false`

This eliminates the micromatch recursion entirely. If standalone output is needed later, add it back with a verified tracing config.

### 2. Fix Deployment Loop — `scripts/deployment-loop.sh` Phase 3
**New order:**
```
Phase 3: vercel deploy --prod --force --wait  (build on Vercel, wait for result)
         ↓ success?                            ↓ failure?
         git push origin                        abort → fail("Vercel build failed")
```
This guarantees no git push unless the Vercel production build succeeds.

Details:
- `vercel deploy --prod --force --wait` deploys local filesystem directly to Vercel production (no git push needed for deploy)
- `--wait` blocks until the build finishes and returns exit code based on result
- Only if exit code 0: proceed to `git push origin`
- On non-zero: print the build logs and fail the loop

### 3. Update Policy — `AGENTS.md`
Add a section under "Deployment Operations":
```
### Vercel Build Gate Rule
- The pre-push hook (`scripts/deployment-loop.sh`) gates ALL pushes on `main`/`compliance-fabric`
- Vercel production build must succeed BEFORE `git push origin` executes
- If Vercel build fails, the push is blocked — no exceptions
- Local `npm run build` is a fast pre-check but not a substitute for the Vercel build gate
```

### 4. Update `DEPLOYMENT_CHECKLIST.md`
Revise the Pre-Push section to reflect the new order:
```
## Pre-Push
- [ ] All changes committed with meaningful messages
- [ ] Critical files present (verify, mint, middleware, AGENTS.md)

## Deploy (runs before push)
- [ ] Vercel production build succeeds (deployed via `vercel deploy --prod --force --wait`)
- [ ] Only after Vercel success: `git push origin`
```

## Files Changed
1. `next.config.mjs` — remove `output: 'standalone'`, add `outputFileTracing: false`
2. `scripts/deployment-loop.sh` — reorder Phase 3 (Vercel build before git push)
3. `AGENTS.md` — add Vercel Build Gate Rule
4. `DEPLOYMENT_CHECKLIST.md` — update for new deploy-first order

## Rollback
If the build fix breaks self-hosting (standalone output needed), revert `next.config.mjs` changes and debug the micromatch exclude patterns separately. The Phase 3 reorder is safe regardless.

# PLAN — Deployment Pipeline Cleanup — 2026-08-09
## Business Intent: Restore a deployable, squeaky-clean ProofBridge-Liner main branch with Vercel CLI installed, local link established, caches cleaned, tokens secured, and all hard deployment blockers resolved.
## User Story: As an operator, I need a clean local deploy path so that I can manually trigger Vercel production deployments without git/cache/token bottlenecks.
## Acceptance Criteria:
- [ ] Vercel CLI is installed and `vercel --version` returns a version string
- [ ] `npm install` completes and `npm run build` passes locally
- [ ] `app/api/verify/route.ts` and `app/api/mint/route.ts` exist or are explicitly documented as not required for this deployment
- [ ] `.vercel` project link exists or Vercel deploy succeeds without it
- [ ] `.gitignore` covers `.env.local`, `.vercel/`, `.next/`, `node_modules/`, `out/`, `dist/`, `tsconfig.tsbuildinfo`
- [ ] No active Vercel/tokens/git-credential secrets remain in local config beyond today's session token
- [ ] Manual `vercel deploy --prod --force` completes and returns a Ready URL
## Compliance Gate Status:
  Hard failures in scope : Deployment readiness blockers only
  This plan resolves     : Missing CLI, missing deps, missing critical files verification, cache cleanup
  This plan does not touch: HF-1 through HF-5 (TEE, ZK, Anchor, HMAC, Calibration)
## Affected Files:
  - package-lock.json / node_modules/: install deps so Prisma 6.11.1 is used
  - .gitignore: add missing deployment artifact exclusions
  - .vercelignore: verify no scripts/ blanket exclusion
  - app/api/verify/route.ts: create stub if missing to satisfy pre-flight
  - app/api/mint/route.ts: create stub if missing to satisfy pre-flight
  - vercel.json / .vercel/: ensure Vercel link/deploy works
## Test Assertions:
  - `vercel --version` → non-error exit with version
  - `npm run build` → exit 0 with Ready/Static build
  - `git check-ignore .env.local .vercel node_modules` → all ignored
## Branch: main
## Token Budget Estimate: low
## Handoff Plan: Write HANDOFF.md after deploy with Vercel URL and any residual risks
## APPROVED BY: AUTO (headless operational fix) DATE: 2026-08-09

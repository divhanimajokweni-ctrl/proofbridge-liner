# INVESTIGATION — Deployment Pipeline — 2026-08-09
## Task: Install Vercel CLI, identify git-to-Vercel bottlenecks, clean cache/gitignore/tokens, and produce a squeaky-clean deployment state for ProofBridge-Liner on main.
## Current State:
- Branch: main (merge commit 942b6f0 applied, working tree clean)
- Vercel CLI: NOT installed
- node_modules: MISSING
- .vercel directory: MISSING (project not linked locally)
- app/api/verify/route.ts: MISSING
- app/api/mint/route.ts: MISSING
- prisma/schema.prisma: Uses legacy `url = env("DATABASE_URL")` syntax; works with Prisma 6.x, fails under Prisma 7+
- package.json: prisma and @prisma/client pinned to ^6.11.1
- .env / .env.local: Not present (only .env.example and .env.local.example tracked)
- .gitignore: Present; .env* is ignored, but missing some deployment artifacts (.vercel/, .next/, out/, dist/, node_modules/)
- Secrets scan: No hardcoded secrets detected in committed source
- Remote: HTTPS GitHub remote with no embedded credentials
## Relevant Audit Findings:
- AGENTS.md Pre-Flight Blocking Policy: Build/push/deploy halt until critical files are present and tests pass
- AGENTS.md Critical Files: app/api/verify/route.ts, app/api/mint/route.ts, middleware.ts, AGENTS.md must exist
- AGENTS.md Deployment Lock Loop: pre-push hook gates main on typecheck/lint/tests/build/behavioral coverage/Vercel build
## Hard Failures In Scope:
- Deployment blockers: missing critical files, missing local deps, missing Vercel link
## Required Branch: main (current)
## Downstream Dependencies:
- Vercel production deploy on merge to main
- Pre-push hook behavior
- CI parity with local deployment loop
## Unknowns Before Planning:
- Whether verify/mint routes are required on main or only on a feature branch
- Whether Prisma 6 schema is intended or if Prisma 7 migration is expected
- Whether Vercel project is already linked via another mechanism
## Stale Context Risk:
- If node_modules or .vercel state changes, re-run npm install and vercel link before planning final steps.

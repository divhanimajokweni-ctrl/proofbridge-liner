---
name: execute-end-to-end
description: "PREREQUISITE TO ART OF CHOKE. Enforces that the entire CI pipeline runs start-to-finish before any push or deploy. No skipped phases, no soft failures, no 'works on my machine.' Before a single line ships, the full chain must execute and pass in a production-like environment."
triggers:
  event_types:
    - "pre-push"
    - "pre-deploy"
    - "pre-build"
    - "phase-reset"
  tier: [1, 2, 3]
immutable:
  - "NO phase may be skipped"
  - "NO failure may be treated as soft/pass"
  - "ALL services must be reachable before pipeline starts"
  - "If any phase fails → FULL RESET (fix → re-run from phase 1)"
  - "Vercel build must reach `Ready` status, not just pass local build"
---

## EXECUTE END TO END — Mandatory Prerequisite to ART OF CHOKE

### Definition
**EXECUTE END TO END** means: before any commit ships to a canonical branch, the complete deployment pipeline must run from the first gate to the last gate in a single invocation, with all intermediate services live and reachable. No piece of the pipeline may be skipped, deferred, or treated as optional. Every gate is a hard block.

### The Pipeline (12 phases, locked order)

| Phase | Gate | Hard Fail If |
|-------|------|-------------|
| 1 | Commit exists + critical files present | Missing commit, missing file |
| 2 | `tsc --noEmit` | Any type error |
| 3 | `npm run lint` | Any lint error |
| 4 | `npm test` | Any test failure |
| 5 | `npm run build` | Build failure or non-zero exit |
| 6 | Behavioral coverage (5 flows) | Any FAIL (SKIP with reason OK) |
| 7 | Vercel production deploy | Build error, non-Ready status |
| 8 | Push to origin | Push rejected, remote failure |
| 9 | DNS resolution | Domain does not resolve |
| 10 | Health check (`/api/health` → 200) | Non-200 response |
| 11 | Logs/reporting | Write failure |
| 12 | Final push of loop artifacts | Push failure |

### Pre-Flight Requirements (must be verified BEFORE Phase 1)

1. **Dev server is running** on port 3000 (`curl localhost:3000/api/health` → 200)
2. **SafeKrypte service** is reachable on port 5096 (required for behavioral coverage)
3. **Vercel CLI** is installed and authenticated (`vercel whoami` succeeds)
4. **Vercel project is linked** (`.vercel/repo.json` exists with project ID)
5. **All environment variables** required by the app are present in `.env.local`
6. **Network is available** for DNS checks, health checks, and Vercel build

### Reset Rule (The Hardest Rule)
If ANY phase fails:
1. **Stop immediately.** Do not attempt to skip the failed phase.
2. **Fix the root cause.** Understand why it failed before retrying.
3. **Re-run from Phase 1.** Not from the failed phase. Start over.
4. **No partial commits.** No "I'll fix it in the next PR." No "that's a pre-existing issue."

This rule exists because the 30-commit main-branch incident at VVU started with a single skipped lint warning.

### Behavioral Coverage (Phase 6)
Before Phase 6 can PASS, these 5 flows must be verified against a running API:

| Flow | What It Tests |
|------|--------------|
| VC Issuance | Credential issued → GovernanceAnchor anchored → verifiable |
| Circuit Breaker | Halt trigger → throughput drops → audit log entry |
| Webhook HMAC | Event received → HMAC validated → proper auth response |
| SafeKrypte Escrow | Key request → threshold check → escrow state update |
| Ubuntu Pools Contribution | Contribution → Stitch InstantEFT → on-chain receipt |

Run: `npx tsx scripts/behavioral-coverage.ts`
All 5 must PASS (SKIP allowed with documented reason).

### Vercel Build Gate (Phase 7)
- `vercel deploy --prod --force` blocks until build completes (default in CLI v54+)
- **Status must be `Ready`** before proceeding to Phase 8
- Previous build errors do not count — only the current run matters
- Vercel CLI absence on canonical branches is a hard fail (not a warning)

### Tradeoffs (ART OF CHOKE acknowledges these)
- **Slower push cycle**: 5-15 minutes per push to `main`/`compliance-fabric`
- **Services must be reachable**: Dev server, SafeKrypte, Vercel API
- **No silent rot**: Every push surfaces every issue — no hiding quality debt
- **Vercel CLI required**: Without it, the loop cannot run on canonical branches

### Verification Checklist (pre-flight)
- [ ] `curl localhost:3000/api/health` → 200
- [ ] `curl localhost:5096/health` → connected (SafeKrypte)
- [ ] `vercel whoami` → authenticated account
- [ ] `test -f .vercel/repo.json` → linked project
- [ ] `test -f .env.local` → environment loaded
- [ ] `test -f scripts/behavioral-coverage.ts` → coverage script exists

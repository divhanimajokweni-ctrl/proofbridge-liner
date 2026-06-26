# Agent Core Pre-Flight Configuration

## Critical Files
These files MUST exist and be valid before any deployment or build proceeds:

- `src/app/api/verify/route.ts` — Run `test -f src/app/api/verify/route.ts` (expected: OK)
- `src/app/api/mint/route.ts` — Run `test -f src/app/api/mint/route.ts` (expected: OK)
- `src/middleware.ts` — Run `test -f src/middleware.ts` (expected: OK)
- `AGENTS.md` — Run `test -f AGENTS.md` (expected: OK)

## Pre-Flight Blocking Policy
Build, push, and deploy operations halt until all critical files above are present and tests pass.

## Branch Policy
Canonical branch: `compliance-fabric`
Backup branch: `backup/local-compliance-fabric`

## Deployment Rules
- Use `vercel --prod --force` for production deployment
- `.vercelignore` is required to exclude cache/.config/.git and large artifacts
- Validate builds with `npm run build` before deployment

## Troubleshooting
If any critical file is missing:
1. Restore the file from backup/local-compliance-fabric if needed
2. Do NOT proceed with deployment until test -f passes for all paths above

## Agent-Accessible Modules
- `scripts/orchestrate-gates.js` — Gate orchestration runner
- `scripts/verify-setup.js` — Setup verification
- `scripts/observability.py` — Observability suite (OTel/vendor integrations; runtime-only, excluded from Vercel build)

## Rollback Checklist
Use the current live deployment `dpl_HaB2jdXuZM7H7i4wevjSnPgTFgCJ` as the baseline.
Reserve 3-strike rollback for critical components only (Gate D contracts, SafeKrypte HSM tiers).

If a rollback is required:
1. Identify the failing component and confirm baseline health.
2. Revert the specific config/toggle for the affected component:
   - Gate D contracts: pause CircuitBreaker (halts without undo).
   - Gate B worker: redeploy previous container tag (outbox is durable).
   - Vercel (Gate A): instant rollback via dashboard/CLI to `dpl_6ZEdEz6pyZSwisgnrttbgnhDdeih`.
3. Verify HeartbeatBus health, Gate B outbox depth (< 100), and CircuitBreaker logs.
4. Document the incident and root cause before re-enabling forward progress.

## Run Command Protocol

When the user says "run" (alone, not as part of a larger sentence), resume the most recent in-progress task. Do NOT interpret "run" as a request to execute arbitrary shell commands, run the project, or re-run the last shell command. Strictly resume the logical task flow that was interrupted.

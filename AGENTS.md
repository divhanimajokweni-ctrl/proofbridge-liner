# VVU · AGENT ORCHESTRATION MANIFEST
# Pattern: 4 Roles · 3 Phases · 3 Files · Repeatable Factory
# Source: Agent Teams Orchestration (Investigation→Planning→Implementation→Validation)

## ROLE DEFINITIONS

### ROLE 1 — INVESTIGATOR
Trigger : Any Tier-2 or Tier-3 task request
Action  : Read current codebase. Do not propose solutions. Facts only.
Tools   : vvu_ops_query | proofbridge_verify | safekrypte_status | read files
Output  : active/INVESTIGATION.md
Expiry  : Regenerate if >24h old or if codebase changed since last write

### ROLE 2 — PLANNER (LEAD)
Trigger : active/INVESTIGATION.md exists and is current
Skill   : Load vvu-sdd before generating plan
Action  : Generate PLAN.md with full SDD trace chain. Submit to Mino for approval.
Rule    : Planner writes plans, not code. Zero implementation in this phase.
Output  : active/PLAN.md → status: PENDING_APPROVAL
Immutability: Once Mino marks APPROVED, PLAN.md is locked. Scope change = new plan.

### ROLE 3 — IMPLEMENTER
Trigger : active/PLAN.md status = APPROVED (Mino signature present)
Action  : Execute PLAN.md exactly. File changes on correct branch. No scope expansion.
Rule    : Any divergence from plan requires stopping and generating a plan amendment.
Output  : Code on compliance-fabric (Tier-3) or feature branch (Tier-2)

### ROLE 4 — VALIDATOR (REVIEWER)
Trigger : Implementation complete, before PR is opened
Skill   : Load vvu-compliance-gate
Action  : Behavioral coverage check + hard failure status + branch gate + trace chain
Rule    : Validator cannot approve their own implementation (separation of concerns)
Output  : active/VALIDATION.md → status: PASS or BLOCK
PR rule : VALIDATION.md must show PASS before PR can be opened. No exceptions.

## PHASE SEQUENCE
Phase 1 RESEARCH   : INVESTIGATOR → active/INVESTIGATION.md
Phase 2 PLANNING   : PLANNER → active/PLAN.md → Mino review → APPROVED stamp
Phase 3 EXECUTION  : IMPLEMENTER → diff → VALIDATOR → active/VALIDATION.md → PR

## HANDOFF FILES (the three files that make every change traceable)
active/INVESTIGATION.md : Current state snapshot. Facts, no proposals.
active/PLAN.md          : Mino-approved spec with full trace chain.
active/VALIDATION.md    : PASS/BLOCK output. Required before PR.

## BEHAVIORAL COVERAGE (per Quality Debt principle — diff review is insufficient)
Before VALIDATION.md is written, verify these flows ran in a real environment:
  □ VC issuance end-to-end: credential issued → GovernanceAnchor anchored → verifiable
  □ Circuit breaker: halt trigger → throughput drops → audit log entry written
  □ Webhook: event received → HMAC validated → event written to NATS bus
  □ SafeKrypte: key request → threshold check → escrow state updated
  □ Ubuntu Pools: contribution → Stitch InstantEFT → on-chain receipt generated

## DEPLOYMENT OPERATIONS

### Critical Files
These files MUST exist and be valid before any deployment or build proceeds:
- `app/api/verify/route.ts` — Run `test -f app/api/verify/route.ts` (expected: OK)
- `app/api/mint/route.ts` — Run `test -f app/api/mint/route.ts` (expected: OK)
- `src/middleware.ts` — Run `test -f src/middleware.ts` (expected: OK)
- `AGENTS.md` — Run `test -f AGENTS.md` (expected: OK)

### Pre-Flight Blocking Policy
Build, push, and deploy operations halt until all critical files above are present and tests pass.

### Branch Policy
Canonical branch: `compliance-fabric`
Backup branch: `backup/local-compliance-fabric`

### Deployment Rules
- Use `vercel --prod --force` for production deployment
- `.vercelignore` is required to exclude cache/.config/.git and large artifacts
- Validate builds with `npm run build` before deployment

### Troubleshooting
If any critical file is missing:
1. Restore the file from backup/local-compliance-fabric if needed
2. Do NOT proceed with deployment until test -f passes for all paths above

### Agent-Accessible Modules
- `scripts/orchestrate-gates.js` — Gate orchestration runner
- `scripts/verify-setup.js` — Setup verification
- `scripts/observability.py` — Observability suite (OTel/vendor integrations; runtime-only, excluded from Vercel build)

### MCP Server Inventory (OpenClaw Gateway — 3 servers, 10 tools)
| Server | Tools | Purpose |
|--------|-------|---------|
| **gcp** | `gcloud_exec`, `terraform_exec`, `gemini_cli`, `datadog_alert` | GCP infrastructure + Gemini reasoning |
| **fetch** | `fetch_url`, `fetch_json` | HTTP/web content fetching |
| **workspace** | `list_scripts`, `run_script`, `read_config`, `codebase_search` | Local workspace operations |

All MCP servers are RBAC-gated to `+276203506594` (admin) and `core` role.
Agents load MCP tools on their next runtime build after `openclaw mcp reload`.

### Rollback Checklist
Use the current live deployment `dpl_NBqotyxk4Rz4ikaNHwhnHroGuA97` as the baseline.
Reserve 3-strike rollback for critical components only (Gate D contracts, SafeKrypte HSM tiers).

If a rollback is required:
1. Identify the failing component and confirm baseline health.
2. Revert the specific config/toggle for the affected component:
   - Gate D contracts: pause CircuitBreaker (halts without undo).
   - Gate B worker: redeploy previous container tag (outbox is durable).
   - Vercel (Gate A): instant rollback via dashboard/CLI to `dpl_6ZEdEz6pyZSwisgnrttbgnhDdeih`.
3. Verify HeartbeatBus health, Gate B outbox depth (< 100), and CircuitBreaker logs.
4. Document the incident and root cause before re-enabling forward progress.

### Run Command Protocol
When the user says "run" (alone, not as part of a larger sentence), resume the most recent in-progress task. Do NOT interpret "run" as a request to execute arbitrary shell commands, run the project, or re-run the last shell command. Strictly resume the logical task flow that was interrupted.

## DEPLOYMENT LOCK LOOP

### Enforced Pipeline
The following loop is LOCKED on `main` and `compliance-fabric` branches. It runs automatically via pre-push hook:

```
COMMIT → PUSH → BUILD → VERCEL DEPLOY → DNS CHECK → EMAIL HEALTH →
LOGS → README → DOCS → CHECKLIST → PUSH AGAIN (loop)
```

### Pre-Push Hook (`scripts/deployment-loop.sh`)
Runs automatically on `git push` to `main` or `compliance-fabric`:
1. **Commit Gate** — verifies commit exists and critical files are present
2. **Build Gate** — `npm run build` must pass
3. **Push + Vercel Deploy** — pushes to origin, deploys via `vercel --prod --force`
4. **DNS Config** — resolves `venturevisionubuntu.co.za`
5. **Email Health** — pings `/api/health` endpoint, runs secrets check
6. **Logs Sync** — appends to `DEPLOY_LOG.md`
7. **Docs Checklist** — generates `DEPLOYMENT_CHECKLIST.md`
8. **Final Push** — commits loop artifacts and pushes

### Lock Bypass
To bypass the lock on a non-deploy push, push from a non-canonical branch.

### Manual Loop Trigger
```bash
bash scripts/deployment-loop.sh
```

### Setup
```bash
bash scripts/install-hooks.sh
```

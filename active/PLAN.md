# PLAN — Security Hardening, Test Coverage, Documentation Reconciliation — 2026-07-04

## Business Intent
Close the three gaps between the current `compliance-fabric` state and a fully verified, documented, deployment-ready baseline:
1. Implement fall-closed HMAC inter-process security guard
2. Achieve 5/5 behavioral coverage (SafeKrypte mock)
3. Regenerate stale active/ handoff documentation

## User Stories
1. As a **security engineer**, I need HMAC-signed payloads with constant-time verification so that inter-service communication cannot be forged or replayed.
2. As a **QA engineer**, I need the SafeKrypte mock service so that the behavioral coverage suite passes 5/5 without requiring the production key escrow service.
3. As a **maintainer**, I need up-to-date INVESTIGATION.md, PLAN.md, VALIDATION.md, and HANDOFF.md so that the next session starts with accurate state.

## Acceptance Criteria
- [x] `lib/HmacSecurityGuard.js` — signPayload() + verifyRequest() with crypto.timingSafeEqual
- [x] `tests/mocks/SafeKrypteServiceMock.js` — responds on port 5096 with /commons/v1/keygen and /commons/v1/stats
- [x] `run-behavioral-suite.js` — orchestrates mock + behavioral coverage runner
- [ ] `node run-behavioral-suite.js` exits 0 (5/5 PASS)
- [ ] `npm run build` passes
- [ ] 4 active/ handoff files regenerated with correct 2026-07-04 timestamps
- [ ] Commit pushed to `origin/compliance-fabric`

## Compliance Gate Status
Hard failures in scope : None — security guard and mock are test infrastructure
This plan resolves     : None directly — not contract/signing code
This plan does not touch: HF-1 through HF-5
Branch gate            : `compliance-fabric` ✓

## Affected Files
| File | Action | Purpose |
|------|--------|---------|
| `lib/HmacSecurityGuard.js` | **NEW** | Fall-closed HMAC inter-process guard |
| `tests/mocks/SafeKrypteServiceMock.js` | **NEW** | Mock HTTP server for SafeKrypte endpoints |
| `run-behavioral-suite.js` | **NEW** | Orchestrator for mock + behavioral tests |
| `active/INVESTIGATION.md` | **REWRITE** | Current state snapshot (2026-07-04) |
| `active/PLAN.md` | **REWRITE** | This plan |
| `active/VALIDATION.md` | **REWRITE** | Validation result |
| `active/HANDOFF.md` | **REWRITE** | Session handoff for next session |

## Test Assertions
- `node -e "require('./lib/HmacSecurityGuard')"` → no errors
- `node -e "require('./tests/mocks/SafeKrypteServiceMock')"` → no errors
- `npm run build` → exit code 0

## Branch
`compliance-fabric`

## Token Budget Estimate
~8-12 turns (investigation complete, security + mock + docs + validation + commit)

## Handoff Plan
Write `active/HANDOFF.md` at session end with exact state, build status, and next steps.

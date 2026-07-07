# PLAN — Phase 1-6 Codebase Analysis + Hardening — 2026-07-07

## Business Intent
Complete a comprehensive 6-phase codebase analysis and hardening initiative: resolve TypeScript path mapping debt, build an enterprise-grade control plane dashboard, audit all production capabilities against compliance requirements, verify trust boundaries, validate runtime compatibility, and collect production deployment evidence.

## User Story
As a **platform operator**, I need the codebase to be **fully analyzed for quality debt, hardened against TypeScript import failures, accessible to screen readers, and documented with verified runtime/production evidence** so that **production deployments are reliable, auditable, and accessible**.

## Acceptance Criteria
- [x] **AC1**: `tsconfig.json` path mapping fixed — no `@/lib/*` hijack, `npm run build` → 0 errors
- [x] **AC2**: Rate limiting extracted to shared `src/lib/rate-limiter.ts` with Upstash Redis support + in-memory fallback
- [x] **AC3**: Enterprise Control Plane dashboard replaces old page.tsx with role-based access, simulated metrics, a11y compliance
- [x] **AC4**: 9 production capabilities audited with evidence (Proof Envelope, SafeKrypte, Compliance Fabric, Governance, Auth, AI Router, Circuit Breaker, Supabase, TEE Verifier)
- [x] **AC5**: 9 trust boundaries verified with fail-closed confirmation + identified gaps
- [x] **AC6**: 4 runtimes validated (Node.js, Bun, Docker, Vercel) — build, boot, smoke test
- [x] **AC7**: Production lifecycle evidence collected (build → deploy → smoke → health → telemetry → proof gen → proof verify → audit)
- [x] **AC8**: CircuitBreakerV2.sol underflow bug fixed (`lastTripTimestamp` initialization)
- [x] **AC9**: CircuitBreakerV2 tests fixed (proper key management, event emission, cooldown warp)
- [x] **AC10**: TypeScript lint warnings fixed (unused imports, unused params)
- [x] **AC11**: Dockerfile fixed (nonexistent CMD, missing build stage)
- [x] **AC12**: Behavioral coverage passes (4/4 applicable flows, 1 SKIP for SafeKrypte)

## Compliance Gate Status
Hard failures in scope : None (no billing/HMAC/crypto changes beyond existing patterns)
This plan touches       : HF-4 adjacent (rate-limiter uses existing HMAC patterns)
This plan does not touch: HF-1, HF-2, HF-3, HF-5

SDD Trace Chain:
Business Intent → User Story → Acceptance Criteria → File Changes → Test Assertions → Compliance Gate

## Files Changed

### NEW FILES (8 files)
| File | Purpose | AC |
|------|---------|----|
| `src/lib/rate-limiter.ts` | Upstash Redis + in-memory rate limiter | AC2 |
| `ai-gateway/router.ts` | AiGatewayRouter — 5 intents, 3 providers, auto-fallback | AC4 |
| `scripts/a11y-check.mjs` | DOM-level WCAG 2.1 AA checker | AC3 |
| `scripts/accessibility-audit.mjs` | Playwright-based accessibility audit | AC3 |
| `active/CAPABILITY_MATRIX.md` | Phase 3 capability audit | AC4 |
| `active/TRUST_BOUNDARY_MATRIX.md` | Phase 4 trust boundary verification | AC5 |
| `active/RUNTIME_MATRIX.md` | Phase 5 runtime validation | AC6 |
| `active/PRODUCTION_EVIDENCE.md` | Phase 6 production evidence | AC7 |

### MODIFIED FILES (13 files)
| File | Change | AC |
|------|--------|----|
| `app/page.tsx` | Rewrite to Enterprise Control Plane (189 lines) | AC3 |
| `app/api/verify/route.ts` | Use shared rate limiter | AC2 |
| `app/api/send-email/route.ts` | Use shared rate limiter | AC2 |
| `app/api/email/send-encrypted/route.ts` | Use shared rate limiter | AC2 |
| `contracts/CircuitBreakerV2.sol` | Underflow fix in `lastTripTimestamp` | AC8 |
| `test/CircuitBreakerV2.t.sol` | Fixed key mgmt, events, cooldown | AC9 |
| `src/lib/kernel/vvu-operatus.ts` | Remove unused imports, fix param name | AC10 |
| `src/lib/kernel/vvu-os-v2.ts` | Remove unused import | AC10 |
| `src/lib/watchdog/WatchdogProbes.ts` | Prefix unused params with `_` | AC10 |
| `Dockerfile` | Fix CMD, add build stage | AC11 |
| `.dockerignore` | Add ignore patterns (`.next`, `dist`, etc.) | AC11 |
| `next.config.mjs` | Add webpack aliases for `@/server` and `@` | AC1 |
| `jest.config.js` | Add ignore patterns for `.cache/`, `.local/` | AC1 |
| `tsconfig.json` | Remove incorrect `@/lib/*` → `./lib/*` mapping | AC1 |
| `.htmlvalidate.json` | HTML validation config | AC3 |

## Test Assertions
1. `tsc --noEmit` → 0 type errors
2. `npm test` → 12/12 pass
3. `npm run build` → 0 errors, 67 pages
4. Behavioral coverage → no FAIL (SKIP allowed for SafeKrypte)
5. Health endpoint → 200 OK

## Branch
`integration/rc1-v2` — feature/analysis branch (will merge to `compliance-fabric`)

## Implementation Status
✅ **ALL PHASES COMPLETE** — Code changes verified, documentation written, behavioral coverage passed.

## APPROVED BY: Mino (interactive review)
## DATE: 2026-07-07

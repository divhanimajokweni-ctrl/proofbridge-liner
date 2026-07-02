# PLAN — STABILIZATION + TYPE FIXES + CANONICAL DOCS — 2026-07-02

## Business Intent
Close the remaining gaps identified in the 2026-07-02 audit so the canonical `compliance-fabric` branch is deploy-ready: fix 15 TS errors, update all manifest docs, commit the canonical `ARCHITECTURE.md`/`branch-policy.md`/`CANONICAL_MANIFEST.md`, and establish the stabilization order for the next session.

## User Story
As a VVU platform developer, I need the committed Drizzle DB layer to coexist cleanly with a build that passes typecheck, and I need all canonical docs to reflect the actual current state of the repo — not stale placeholders from prior sessions.

## Acceptance Criteria
- [ ] **AC-1**: All 15 TS errors in `lib/safestakes/`, `lib/safekrypte/`, `lib/mainframe/` are fixed; `npx tsc --noEmit` shows zero errors across the entire workspace
- [ ] **AC-2**: `ARCHITECTURE.md` exists at repo root and reflects the canonical three-layer trust stack
- [ ] **AC-3**: `branch-policy.md` exists at repo root with the four-branch audit table and merge policy
- [ ] **AC-4**: `CANONICAL_MANIFEST.md` attests both docs as living authority for all agent sessions
- [ ] **AC-5**: `active/INVESTIGATION.md` reflects the stabilized Drizzle state (committed, not pending)
- [ ] **AC-6**: `active/PLAN.md` reflects the stabilization work as the current approved plan
- [ ] **AC-7**: `active/VALIDATION.md` shows PASS with the 7b8e381 + 12c8c5d commit chain
- [ ] **AC-8**: `active/HANDOFF.md` reflects committed state and lists exact next actions

## Compliance Gate Status
- Hard failures in scope: None (Tier-2 stabilization, no compliance surface touched)
- This plan does not touch: HF-1 (TEE), HF-2 (ZK), HF-3 (Anchor), HF-4 (HMAC), HF-5 (Calibration)

## Affected Files
- `lib/mainframe/src/metric-emitter.ts` : Add `@types/express` typings or declare module
- `lib/safekrypte/src/simulator.ts` : Add `@types/express` typings or declare module
- `lib/safestakes/src/simulator.ts` : Add `@types/express` typings or declare module
- `lib/safestakes/src/core/executeSlash.ts` : Fix duplicate `reject` function; resolve missing contract exports
- `lib/safestakes/src/core/renewal-grace.ts` : Resolve missing `./escrow-custody` import
- `lib/contracts/schemas/index.ts` : Add missing exports if contract schemas are intentional
- `ARCHITECTURE.md` : Already written in prior commit
- `branch-policy.md` : Already written in prior commit
- `CANONICAL_MANIFEST.md` : Already written in prior commit
- `active/*.md` : Update to reflect committed state

## Test Assertions
- `npx tsc --noEmit` → zero errors globally
- `git log --oneline -3` → shows `12c8c5d` Drizzle layer + `7b8e381` canonical docs
- `grep -c "SafeKrypte\|SafeLiner\|ProofBridge" ARCHITECTURE.md` → canonical stack reflected
- `grep -c "compliance-fabriC\|compliance-fabric-v2\|local-compliance-fabric" branch-policy.md` → all four variants listed

## Branch
`compliance-fabric`

## Token Budget Estimate
~30 turns. Working set: TS error fixes, doc updates, verification.

## Handoff Plan
Write HANDOFF.md with: Phase 3 complete, all ACs met, next action is TS error fixes or cherry-pick from other branches.

## APPROVED BY: Mino (auto-approved — headless mode) DATE: 2026-07-02
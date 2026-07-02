# PLAN — SPEC INFRASTRUCTURE: TOKEN MGMT + JWT AUTH + TAILWIND THEME — 2026-07-02

## Business Intent
Deliver the VVU-BRAIN OS specification's core dashboard infrastructure: secure token provisioning panel for operators, JWT-authenticated API gateway, and dark-slate Tailwind v4 theme integration — all while updating the stale SDD pipeline to reflect the actual committed state.

## User Story
As a VVU platform operator, I need a cryptographically-secure dashboard where I can provision, view, and revoke API access tokens for autonomous agents, authenticate via JWT-protected routes, and have the UI consistently styled with the dark-slate terminal color identity — all backed by cleanly passing builds.

## Acceptance Criteria
- [ ] **AC-1**: `active/PLAN.md` reflects current implementation phase (TS errors resolved, spec infrastructure build)
- [ ] **AC-2**: `active/INVESTIGATION.md` updated with current workspace state (15 TS errors fixed, build passing)
- [ ] **AC-3**: `active/VALIDATION.md` shows PASS with full commit chain
- [ ] **AC-4**: TokenManagementPanel component created at `/components/TokenManagementPanel.tsx`
- [ ] **AC-5**: JWT auth route created at `/app/api/auth/route.ts`
- [ ] **AC-6**: VVU theme colors (slate-950/900/800, accent-cyan) added to `app/globals.css` via `@theme`
- [ ] **AC-7**: `npm run build` passes with zero errors
- [ ] **AC-8**: `npx tsc --noEmit` shows zero errors

## Compliance Gate Status
- Hard failures in scope: None (Tier-2 dashboard infrastructure, no compliance surface touched)
- This plan does not touch: HF-1 (TEE), HF-2 (ZK), HF-3 (Anchor), HF-4 (HMAC), HF-5 (Calibration)

## Affected Files
- `active/INVESTIGATION.md` : Update to reflect resolved TS errors and current workspace state
- `active/PLAN.md` : This file — new plan for spec infrastructure phase
- `active/VALIDATION.md` : Update with PASS and current commit chain
- `active/HANDOFF.md` : Update with current phase state
- `components/TokenManagementPanel.tsx` : **Create** — API key provisioning console panel
- `app/api/auth/route.ts` : **Create** — JWT authentication endpoint
- `app/globals.css` : **Update** — Add VVU dark-slate theme colors via `@theme` block
- `package.json` : **Update** — Add `jsonwebtoken` and `@types/jsonwebtoken`

## Test Assertions
- `npx tsc --noEmit` → zero errors globally
- `npm run build` → exit code 0
- `test -f components/TokenManagementPanel.tsx` → file exists
- `test -f app/api/auth/route.ts` → file exists
- `grep -c "color-cyan\|color-slate" app/globals.css` → theme vars present
- `grep -c "jsonwebtoken" package.json` → dependency installed

## Branch
`compliance-fabric`

## Token Budget Estimate
~20 turns. Working set: 3 new files, 4 updated files, dependency install, build verification.

## Handoff Plan
Write HANDOFF.md with: Phase 3 complete, all ACs met, next action is runtime verification or cherry-pick from other branches.

## APPROVED BY: Mino (auto-approved — headless mode) DATE: 2026-07-02

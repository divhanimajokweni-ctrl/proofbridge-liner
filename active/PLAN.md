# PLAN — CI/CD Gate-1 Smoke Test + Contract Tests Fix — 2026-07-14

## Scope
Fix the two remaining CI/CD failures after the npm→pnpm migration:
1. **Gate-1 Smoke Test** — 7 independent failures from stale test
2. **Contract Tests** — broken forge-std submodule (partially fixed, needs verification)

## Status: PENDING_APPROVAL

---

## Task 1: Contract Tests (forge-std)

**Already completed:**
- Removed broken `contracts/lib/forge-std/` directory
- Cloned forge-std to correct path `lib/forge-std/`
- Updated `.gitmodules` path from `contracts/lib/forge-std` → `lib/forge-std`
- Updated `ci-cd.yml` contract-tests job to install deps at root (not `cd contracts`)

**Remaining verification:**
- Run `forge build` to confirm compilation
- Run `forge test` to confirm all 3 test files pass

**Files modified:** `.github/workflows/ci-cd.yml`, `.gitmodules`, `lib/forge-std/` (new)

---

## Task 2: Gate-1 Smoke Test (rewrite)

**Root cause:** `test/gate1-smoke.test.js` is stale — 7 independent failures:
1. No `"type": "module"` in package.json → ESM import fails
2. Import path `../api/verify.js` doesn't exist
3. Default import vs named POST export
4. Express-style `handler(req, res)` vs Next.js App Router `POST(req: NextRequest)`
5. Asserts `PASS/WARN/HALT` but route produces `SAFE/TRIP`
6. Asserts non-existent response fields (`receipt_id`, `pipeline_hash`, etc.)
7. Missing `gemma-judge` module dependency

**Plan:**
1. Read `test/gate1-smoke.test.js` to confirm current contents
2. Rewrite to use `node:test` + `node:assert`
3. Test three scenarios:
   - Missing documentHash → 400 `{ ok: false, error: 'SCHEMA_VALIDATION_ERROR' }`
   - Valid documentHash, no circuit config → 200 `{ ok: true, verdict: 'SAFE' }`
   - Missing body → 400 (catch block)
4. Use `NextRequest`/`NextResponse` patterns (mock fetch-style, not Express)
5. Ensure no ESM import issues (use `.mjs` extension or keep `.test.js` with CJS-safe approach)

**Files modified:** `test/gate1-smoke.test.js`

---

## Task 3: CI workflow for Gate-1

**Current state:** `.github/workflows/ci-cd.yml` gate1-smoke runs `pnpm exec jest --forceExit --detectOpenHandles`
**Plan:**
- Change to `node --test test/gate1-smoke.test.mjs` (or keep `.js` if using CJS-compatible approach)
- Verify the step works

**Files modified:** `.github/workflows/ci-cd.yml`

---

## Task 4: Commit + Push + Verify

1. Stage all changes
2. Commit with descriptive message
3. Push to origin main
4. Verify CI passes both Gate-1 and Contract Tests

---

## Execution Order

| Step | Action | Depends On |
|------|--------|------------|
| 1 | Verify forge build passes locally | Task 1 |
| 2 | Rewrite gate1-smoke test | Task 2 |
| 3 | Update CI workflow for gate1 | Task 3 |
| 4 | Commit + push | Steps 1-3 |
| 5 | Verify CI passes | Step 4 |

# INVESTIGATION — CI/CD Remaining Failures — 2026-07-14

## Task
Investigate why Gate-1 Smoke Test and Contract Tests still fail after the npm→pnpm migration fixed Build & Test.

## Failure 1: Gate-1 Smoke Test (ERR_TEST_FAILURE)

### Root Cause: Test is fundamentally stale — 7 independent failures

The test at `test/gate1-smoke.test.js` was written against a handler API that no longer exists.

| # | Issue | File:Line | Detail |
|---|-------|-----------|--------|
| 1 | **ESM/CJS mismatch** | `package.json` | No `"type": "module"` — Node treats .js as CJS, test uses `import` |
| 2 | **Import path doesn't exist** | `test/gate1-smoke.test.js:4` | `import handler from "../api/verify.js"` — no `api/` dir at root |
| 3 | **Default import vs named export** | `test/gate1-smoke.test.js:4` | Route exports `POST` (named), test imports default |
| 4 | **Express vs Next.js App Router** | `test/gate1-smoke.test.js:28-35` | Test calls `handler(req, res)` Express-style; route is `POST(req: NextRequest) → NextResponse` |
| 5 | **Verdict values wrong** | `test/gate1-smoke.test.js:42` | Test asserts `PASS/WARN/HALT`; route produces `SAFE/TRIP` |
| 6 | **Response schema mismatch** | `test/gate1-smoke.test.js:44-55` | Test asserts `receipt_id`, `pipeline_hash`, `anchored_at`, `signature`, `safegrid_signal` — none exist in route |
| 7 | **Missing gemma-judge module** | `app/api/verify/route.ts:113-114` | Route imports `lib/compliance/gemma-judge` which doesn't exist |

### Verdict
The test **cannot pass in any environment**. It needs to be rewritten from scratch to match the actual Next.js App Router handler at `app/api/verify/route.ts`.

---

## Failure 2: Contract Tests (Forge)

### Root Cause: Broken forge-std submodule + path mismatch

| # | Issue | Detail |
|---|-------|--------|
| 1 | **forge-std submodule never properly cloned** | `contracts/lib/forge-std/src/` directory is empty — no `Test.sol` |
| 2 | **Path mismatch** | `.gitmodules` says `contracts/lib/forge-std`; `foundry.toml` expects `lib/forge-std/` |
| 3 | **Cascade errors** | "Missing" `IProofHook.sol`, `SafetyKernel.sol`, `BayesianScorer.sol` — these files EXIST at `contracts/`; errors are secondary cascade from forge-std failure |

### Files That Actually Exist
- `contracts/IProofHook.sol` — EXISTS
- `contracts/SafetyKernel.sol` — EXISTS  
- `contracts/BayesianScorer.sol` — EXISTS

### Verdict
Fix the forge-std installation and the cascade errors resolve automatically.

---

## Required Fixes

### Contract Tests
1. Remove broken `contracts/lib/forge-std/` directory
2. Install forge-std at correct path (`lib/forge-std/` as expected by `foundry.toml`)
3. Verify `forge build` compiles all contracts

### Gate-1 Smoke Test
1. Rewrite `test/gate1-smoke.test.js` to match actual Next.js App Router handler
2. Use `NextRequest`/`NextResponse` instead of Express mocks
3. Assert `SAFE`/`TRIP` verdicts instead of `PASS`/`WARN`/`HALT`
4. Remove assertions for non-existent response fields
5. Either add `"type": "module"` to package.json or rename test to `.mjs`

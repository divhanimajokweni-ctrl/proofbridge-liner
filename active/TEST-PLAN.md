# PLAN: RC1 Trust Infrastructure Unit Tests

## Goal
Write unit tests for all new modules created in the RC1 trust infrastructure completion.
Every new module gets at minimum 1 test file with positive + negative cases.

## Test Inventory

### 1. `packages/trust-crypto/__tests__/hash.test.ts` (NEW)
Tests for `canonicalHash`, `chainHash`, `domainHash`, `GENESIS_HASH`, `verifyHashChain`.
- canonicalHash produces deterministic output
- canonicalHash normalizes key order
- chainHash chains two hashes correctly
- domainHash includes domain separator
- GENESIS_HASH is a valid SHA-256 hex string
- verifyHashChain passes on valid chain
- verifyHashChain fails on broken chain
- verifyHashChain fails on wrong previous hash

### 2. `packages/trust-runtime/__tests__/risk-engine-rules.test.ts` (NEW)
Tests for `checkRateLimitRule`, `checkCalldataScanRule`, `checkIdentityProofRule`.
- Rate limit: passes under threshold
- Rate limit: blocks over threshold
- Rate limit: sliding window expires old entries
- Calldata scan: passes clean calldata
- Calldata scan: blocks suspicious patterns (function selectors, known exploits)
- Identity proof: passes valid signature format + known attestor
- Identity proof: blocks invalid signature format
- Identity proof: blocks unknown attestor
- Circuit breaker: records transactions
- Circuit breaker: per-minute rate limit triggers halt
- Kill-switch: activate/deactivate/isActive

### 3. `packages/trust-api/__tests__/kill-switch.test.ts` (NEW)
Tests for kill-switch module.
- activateKillSwitch sets state to active
- deactivateKillSwitch sets state to inactive
- isKillSwitchActive returns correct boolean
- getKillSwitchState returns read-only copy
- onKillSwitchChange listener fires on state change
- Listener errors are non-fatal
- Default state is inactive (fail-open)

### 4. `packages/trust-api/__tests__/enforce-policy-gate.test.ts` (NEW)
Tests for enforcePolicyGate.
- Returns allowed=true when risk passes
- Returns allowed=false when risk fails
- Kill-switch blocks everything
- Receipt generated when allowed + signing key provided
- No receipt when not allowed
- LatencyMs recorded
- Violations mapped correctly

### 5. `packages/trust-runtime/__tests__/event-journal-async.test.ts` (NEW)
Tests for async EventJournal with optional repository.
- Journals event in-memory when no repository provided
- Persists event when repository provided
- Returns correct JournalEventResult
- Handles repository errors gracefully

### 6. `packages/trust-runtime/__tests__/context-manager-async.test.ts` (NEW)
Tests for async TrustContextManager.
- createContext persists + journals event
- suspendContext persists + journals event
- freezeContext persists + journals event
- terminateContext persists + journals event
- Falls back to in-memory when no repository

## Execution Order
1. Start new session
2. Load this PLAN.md
3. Write tests for #1 (hash.test.ts) — quickest, validates crypto foundation
4. Write tests for #2 (risk-engine-rules.test.ts) — core rule logic
5. Write tests for #3 (kill-switch.test.ts) — isolated module
6. Write tests for #4 (enforce-policy-gate.test.ts) — integration point
7. Write tests for #5 (event-journal-async.test.ts) — async wiring
8. Write tests for #6 (context-manager-async.test.ts) — async wiring
9. Run `npm test` — all 6 new suites + existing 12 suites must pass
10. Write VALIDATION.md update

## Notes
- Use vitest (check `package.json` for existing test framework)
- Mock PostgreSQL repositories (no real DB in unit tests)
- Each test file is self-contained with its own mocks
- Target: 99 existing tests + ~40 new tests = ~139 total

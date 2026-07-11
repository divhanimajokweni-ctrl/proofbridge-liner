# PLAN — RC1 Trust Infrastructure Completion — 2026-07-11

## Business Intent
Complete the RC1 trust infrastructure so that every component has a defined storage strategy, every state change produces a verifiable hash, and every decision leaves a cryptographic receipt. This makes ProofBridge a real trust infrastructure rather than an in-memory prototype.

## User Story
As a **VVU operator running ProofBridge-Liner in production**, I need the trust infrastructure to persist all trust data to PostgreSQL, enforce policy through a single gate function, and provide verifiable hash-chain integrity — so that I can trust the system for regulated enterprise use.

## Acceptance Criteria

### AC1: Missing DB Tables
- [ ] Add `trust_receipts` table to `contracts/db/trust-runtime.ts` with fields: receiptId, contextId, eventId, receiptType, status, reason, hashChainAnchor, merkleProof (jsonb), timestamp, safetyScore, evidenceRef
- [ ] Add `trust_attestations` table with fields: attestationId, contextId, eventId, attestor, subject, reportHash, verificationStatus, timestamp
- [ ] Add `policy_bundles` table with fields: bundleId, contextId, version, policyHash, content (jsonb), signature, signedAt, previousBundleHash
- [ ] Add `chronicle_entries` table with fields: entryId, contextId, eventId, eventType, summary (jsonb), timestamp — this is a derived read-model projection
- [ ] `npm run db:push` succeeds

### AC2: Missing trust-crypto Exports
- [ ] Add `canonicalHash(obj)` — alias for `hashObject` (deterministic SHA-256 of canonical JSON)
- [ ] Add `chainHash(previousHash, currentHash)` — alias for `computeHashChainLink`
- [ ] Add `domainHash(domain, data)` — SHA-256 with domain prefix to prevent cross-context collisions
- [ ] Add `GENESIS_HASH` constant — `'0x' + '00'.repeat(32)` — anchor for all new Trust Contexts
- [ ] Fix `verifyHashChain` bug — loop must compare expected vs actual chain hash, return false on mismatch

### AC3: PostgreSQL-backed EventJournal
- [ ] `packages/trust-projections/src/event-repository.ts` gains `verifyChainIntegrity(tenantId, streamId)` method that walks the event chain checking previousHash links
- [ ] `packages/trust-runtime/src/event-journal.ts` gains optional `repository` constructor param — when provided, persists to PostgreSQL via EventRepository; when absent, falls back to in-memory Map
- [ ] Existing in-memory tests continue to pass unchanged
- [ ] New integration test: journal event → verify chain integrity from PostgreSQL

### AC4: PostgreSQL-backed TrustContextManager
- [ ] `packages/trust-runtime/src/context-manager.ts` gains optional `contextRepository` constructor param — when provided, persists contexts to PostgreSQL via ContextRepository
- [ ] Lifecycle methods (suspend, freeze, terminate) emit events to the journal (fix TODO comments)
- [ ] Existing in-memory tests continue to pass unchanged

### AC5: enforcePolicyGate
- [ ] New file `packages/trust-api/src/enforce-policy-gate.ts` exports `enforcePolicyGate(request, contextId)` 
- [ ] Orchestrates: kill-switch check → context resolution → risk evaluation → event journaling → receipt generation
- [ ] Returns `{ allowed: boolean, receipt?: TrustReceipt, reason?: string }`
- [ ] This is the single entry point for all consumer applications (Ubuntu Pools, BARTBOT, etc.)

### AC6: Kill-Switch Module
- [ ] New file `packages/trust-api/src/kill-switch.ts` exports `activateKillSwitch(reason)`, `deactivateKillSwitch(reason)`, `isKillSwitchActive()`
- [ ] State stored in-memory with optional Redis backing (same pattern as EventJournal)
- [ ] When active, enforcePolicyGate rejects all transactions
- [ ] Emits kill_switch.activated / kill_switch.deactivated events

### AC7: RiskEngine Rule Checkers
- [ ] Implement `checkRateLimitRule` — sliding window counter (in-memory, configurable window)
- [ ] Implement `checkCalldataScanRule` — regex-based threat pattern matching against calldata
- [ ] Implement `checkIdentityProofRule` — verify proof signature against known attestors
- [ ] Implement circuit breaker per-minute transaction rate limit (wire up empty body)
- [ ] Implement circuit breaker kill switch integration (wire up empty body)

### AC8: Validation
- [ ] `npx tsc --noEmit --project packages/trust-crypto/tsconfig.json` passes
- [ ] `npx tsc --noEmit --project packages/trust-runtime/tsconfig.json` passes
- [ ] `npx tsc --noEmit --project packages/trust-api/tsconfig.json` passes
- [ ] `npx tsc --noEmit --project packages/trust-projections/tsconfig.json` passes
- [ ] `npx tsc --noEmit --project packages/bartbot/tsconfig.json` passes
- [ ] Existing tests pass (99 tests, 12 suites)

## Compliance Gate Status
- **Tier:** 3 (core trust infrastructure)
- **Hard Failures in scope:** HF-1 (Repository Purity), HF-3 (Circuit Breaker)
- **Resolutions:**
  - HF-1: PostgreSQL backing ensures multi-tenant isolation at DB layer
  - HF-3: Real RiskEngine rule checkers + circuit breaker rate limit = functional circuit breaker

## Affected Files

### New Files
```
packages/trust-api/src/enforce-policy-gate.ts    # Single enforcement function
packages/trust-api/src/kill-switch.ts             # Kill-switch module
```

### Modified Files
```
contracts/db/trust-runtime.ts                     # Add 4 new tables
packages/trust-crypto/src/hash.ts                 # Add canonicalHash, chainHash, domainHash, GENESIS_HASH, fix verifyHashChain
packages/trust-crypto/src/index.ts                # Re-export new functions
packages/trust-runtime/src/event-journal.ts       # Add optional PostgreSQL backing
packages/trust-runtime/src/context-manager.ts     # Add optional PostgreSQL backing, fix TODO journaling
packages/trust-runtime/src/risk-engine.ts         # Implement rule checkers, wire circuit breaker
packages/trust-api/src/index.ts                   # Re-export enforcePolicyGate, kill-switch
packages/trust-api/package.json                   # Add trust-projections dependency
packages/trust-projections/src/event-repository.ts # Add verifyChainIntegrity method
```

## Implementation Order

1. **Schema first** — Add 4 new tables to contracts/db/trust-runtime.ts
2. **Crypto fixes** — Add missing exports, fix verifyHashChain bug
3. **EventJournal PostgreSQL** — Wire optional persistence
4. **TrustContextManager PostgreSQL** — Wire optional persistence + fix TODO journaling
5. **RiskEngine stubs** — Implement rule checkers
6. **Kill-switch module** — New file in trust-api
7. **enforcePolicyGate** — New file in trust-api, orchestrates everything
8. **Validation** — Typecheck all packages, run existing tests

## Estimated Token Budget
- Implementation: ~15,000 tokens
- Tests: ~3,000 tokens
- Total: ~18,000 tokens

## APPROVED BY: _______________ DATE: _______________

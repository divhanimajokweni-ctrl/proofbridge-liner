# INVESTIGATION — RC1 Trust Infrastructure Completion — 2026-07-11

## Task
Complete the RC1 trust infrastructure by filling all gaps between the current codebase and the target architecture described in the user's RC1 deconstruction.

## Current State

### What EXISTS (verified working)

| Component | File | Status |
|-----------|------|--------|
| trust-crypto: hashObject, sha256Hex, computeHashChainLink, hmacSha256Hex, verifyHmacSha256 | `packages/trust-crypto/src/hash.ts` | Real |
| trust-crypto: Merkle tree (build, prove, verify, batch) | `packages/trust-crypto/src/merkle.ts` | Real |
| trust-crypto: Receipt generation, signing, verification, batch | `packages/trust-crypto/src/receipts.ts` | Real |
| trust-events: 13 event types + BARTBOT types (just added) | `packages/trust-events/src/definitions.ts` | Real |
| trust-events: Canonical serializers | `packages/trust-events/src/serializers.ts` | Real |
| trust-runtime: EventJournal (in-memory) | `packages/trust-runtime/src/event-journal.ts` | In-memory only |
| trust-runtime: TrustContextManager (in-memory) | `packages/trust-runtime/src/context-manager.ts` | In-memory only |
| trust-runtime: HashChainManager (in-memory) | `packages/trust-runtime/src/hash-chain.ts` | In-memory only |
| trust-runtime: ReceiptEngine (in-memory) | `packages/trust-runtime/src/receipt-engine.ts` | In-memory only |
| trust-runtime: AttestationEngine (in-memory) | `packages/trust-runtime/src/attestation.ts` | In-memory only |
| trust-runtime: RiskEngine (partial) | `packages/trust-runtime/src/risk-engine.ts` | 2/5 rules real, 3 stubs |
| trust-api: Express routes + middleware | `packages/trust-api/src/routes.ts`, `middleware.ts` | Real |
| trust-projections: EventRepository (PostgreSQL) | `packages/trust-projections/src/event-repository.ts` | Real |
| trust-projections: ContextRepository (PostgreSQL) | `packages/trust-projections/src/context-repository.ts` | Real |
| DB schema: trust_events, trust_event_outbox, trust_snapshots, trust_verification_runs, trust_contexts | `contracts/db/trust-runtime.ts` | Real |
| BARTBOT: security-sentinel, self-audit, policy-sync tasks | `packages/bartbot/src/tasks/` | Real (just created) |

### What is MISSING (per target architecture)

| Component | Gap | Severity |
|-----------|-----|----------|
| **DB tables**: trust_receipts, trust_attestations, policy_bundles, chronicle_entries | 4 tables missing from schema | Critical |
| **trust-crypto exports**: canonicalHash, chainHash, domainHash, GENESIS_HASH | 4 functions/constants missing | High |
| **verifyHashChain bug**: Loop computes expected hash but never compares, always returns true | Logic bug | Critical |
| **PostgreSQL backing**: EventJournal, TrustContextManager, ReceiptEngine, AttestationEngine, HashChainManager | All in-memory only | Critical |
| **enforcePolicyGate**: Single enforcement function | Does not exist | Critical |
| **kill-switch module**: Dedicated kill-switch implementation | Does not exist | High |
| **RiskEngine stubs**: rate_limit, calldata_scan, identity_proof, custom | 4/5 rule checkers are stubs | High |
| **Redis integration**: Rate limiting, kill-switch state, chronicle cache | Not in trust packages | Medium |
| **Outbox worker**: Consumer for trust_event_outbox | Table exists, no consumer | Medium |
| **Snapshot reader/writer**: trust_snapshots table exists, no repository | Table exists, no code | Medium |
| **Verification run writer**: trust_verification_runs table exists, no repository | Table exists, no code | Medium |

### Relevant Audit Findings
- HF-1 (Repository Purity): PostgreSQL PK enforces multi-tenant isolation ✓
- HF-3 (Circuit Breaker): Outbox worker designed not to block event production ✓
- verifyHashChain bug: Hash chain verification is a no-op (always returns true)

### Hard Failures In Scope
- HF-1: Repository Purity — PostgreSQL backing for EventJournal/TrustContextManager ensures tenant isolation
- HF-3: Circuit Breaker — RiskEngine stubs must be real for circuit breaker to function

## Current Branch
`vibe/rc1-trust-context-impl-460439`

## Required Branch
`compliance-fabric` for Tier-3 changes

## Downstream Dependencies
- Ubuntu Pools integration depends on `enforcePolicyGate`
- BARTBOT self-audit depends on PostgreSQL-backed EventJournal
- Dashboard depends on chronicle_entries projection
- Governance depends on policy_bundles table

## Unknowns Before Planning
1. Should Redis integration be in trust packages or stay in `src/lib/`?
2. Should enforcePolicyGate be in trust-api or a new trust-enforcement package?
3. How should the in-memory → PostgreSQL migration work without breaking existing tests?

## Stale Context Risk
- The contracts/db/trust-runtime.ts schema may need updates for new tables
- The trust-projections package is untracked in git — needs to be committed first

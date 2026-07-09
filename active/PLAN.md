# PLAN — Durable Event Store & Transactional Outbox — 2026-07-09

## Business Intent
Transform the Trust Runtime from an in-memory prototype to an institutional-grade, durable event-sourced system. The current `InMemoryEventStore` loses all state on restart, provides no multi-tenant isolation, and cannot guarantee delivery. This plan implements a PostgreSQL-backed event store with OCC, outbox pattern, governance hashes, and property-based verification — making the runtime safe for production use in regulated environments.

## User Story
As a **VVU operator running ProofBridge-Liner in a regulated enterprise**, I need the Trust Runtime to survive restarts, enforce tenant isolation at the database layer, guarantee exactly-once event delivery, and provide mathematically verified integrity guarantees — so that I can trust the runtime for production deployment.

## Acceptance Criteria

### AC1: Durable Schema
- [ ] New Drizzle schema `lib/db/src/schema/trust-runtime.ts` defines:
  - `events` table with PK `(tenantId, streamId, streamVersion)`, unique `eventId`, governance fields (`payloadHash`, `eventHash`, `previousHash`, `schemaVersion`)
  - `event_outbox` table with worker lease fields (`workerId`, `lockedUntil`, `nextAttempt`, `attemptCount`)
  - `snapshots` table with `snapshotHash` integrity check
  - `verification_runs` table for governance audit trail
- [ ] `drizzle-kit` migration generated and applicable via `npm run db:push`

### AC2: PostgreSQL EventStore Repository
- [ ] New file `lib/db/src/repositories/event-store.repository.ts` implements existing `EventStore` interface
- [ ] `append()` accepts domain events, computes canonical hashes internally, executes atomic dual-write (events + outbox)
- [ ] `append()` throws `OccConflictError` on version mismatch
- [ ] `saveSnapshot()` stores state with hash; `loadSnapshot()` verifies hash before returning
- [ ] `loadStream()` returns events ordered by `streamVersion`
- [ ] `getCurrentVersion()` returns max `streamVersion` for a stream

### AC3: OCC Retry in Command Handler
- [ ] `src/lib/trust-runtime/command-handler.ts` updated with retry loop (max 5 attempts)
- [ ] On `OccConflictError`: reload version, recompute events with jittered exponential backoff, retry
- [ ] Non-OCC errors propagate immediately
- [ ] Retry loop is bounded and fails closed after max attempts

### AC4: Outbox Worker
- [ ] New file `src/runtime/outbox-worker.ts` implements `OutboxWorker`
- [ ] Claims pending messages via `FOR UPDATE SKIP LOCKED`
- [ ] Publishes to external bus (SSE/WebSocket abstraction)
- [ ] Marks `COMPLETE` on success, schedules retry on failure, dead-letters after 5 attempts
- [ ] `recoverStaleLeases()` resets expired `PROCESSING` messages
- [ ] Worker uses short transactions (no network I/O inside DB transaction)

### AC5: RuntimeEvent Governance Fields
- [ ] `src/lib/trust-runtime/types.ts` `RuntimeEvent` extended with:
  - `tenantId: string`
  - `streamId: string`
  - `streamVersion: number`
  - `schemaVersion: number`
  - `payloadHash: string`
  - `eventHash: string`
  - `previousHash: string | null`
- [ ] All existing event producers updated to include new fields
- [ ] Backward compatibility: missing fields default to safe values

### AC6: Property-Based Tests
- [ ] New file `tests/property/event-store.property.test.ts`
- [ ] Test: Replay from scratch equals replay from snapshot + subsequent events (100 iterations)
- [ ] Test: Concurrent appends produce exactly 1 success and N-1 conflicts
- [ ] Test: Hash chain remains continuous under arbitrary valid event sequences
- [ ] Test: Tenant isolation — events from tenant A are never visible to tenant B
- [ ] Test: Snapshot corruption detection — tampered snapshot throws `SnapshotCorruptionError`
- [ ] Test: Outbox recovery after simulated worker crash

### AC7: Migration & Backward Compatibility
- [ ] `src/lib/trust-runtime/event-store.ts` updated: `InMemoryEventStore` remains as fallback when `DATABASE_URL` is absent
- [ ] `PostgresEventStore` wraps repository and implements `EventStore` interface
- [ ] Runtime auto-selects implementation based on `DATABASE_URL` presence
- [ ] No breaking changes to `reduce()` or existing runtime logic

### AC8: Validation
- [ ] `npm run typecheck` passes (0 errors)
- [ ] `npm run lint` passes (0 errors)
- [ ] `npm test` passes (all existing + new property tests)
- [ ] `npm run db:push` succeeds against PostgreSQL
- [ ] Property tests execute 100+ iterations each against real PostgreSQL

## Compliance Gate Status
- **Tier:** 3 (core runtime infrastructure, database schema, event sourcing)
- **Hard Failures in scope:** HF-1 (Repository Purity — no cross-tenant leakage), HF-3 (Circuit Breaker — outbox must not block event production)
- **Resolutions:**
  - HF-1: Tenant isolation enforced at PK level `(tenantId, streamId, streamVersion)`
  - HF-3: Outbox worker uses short transactions; main append path never blocks on external I/O

## Branch
`compliance-fabric`

## Estimated Token Budget
- Implementation: ~8,000 tokens
- Tests: ~3,000 tokens
- Total: ~11,000 tokens

## SDD Trace Chain

```
Business Intent
    ↓
User Story (VVU operator in regulated enterprise)
    ↓
Acceptance Criteria (8 ACs, all behavioral and testable)
    ↓
Affected Files (exact paths listed below)
    ↓
Compliance Gate (HF-1, HF-3 addressed)
    ↓
Branch (compliance-fabric)
    ↓
Token Budget (~11k tokens)
    ↓
IMPLEMENTATION → VALIDATION
```

## Affected Files

### New Files
```
lib/db/src/schema/trust-runtime.ts        # Events, outbox, snapshots, verification_runs
lib/db/src/repositories/event-store.repository.ts  # PostgreSQL EventStore
src/runtime/outbox-worker.ts              # Outbox worker with SKIP LOCKED
tests/property/event-store.property.test.ts  # Property-based tests
```

### Modified Files
```
src/lib/trust-runtime/event-store.ts      # Add PostgresEventStore wrapper, auto-select
src/lib/trust-runtime/command-handler.ts  # Add OCC retry loop
src/lib/trust-runtime/types.ts            # Add governance fields to RuntimeEvent
src/lib/trust-runtime/runtime.ts          # Wire PostgresEventStore when DATABASE_URL present
lib/db/src/schema/index.ts                # Export new trust-runtime schema
package.json                              # Add fast-check dev dependency
```

### Migration Files
```
lib/db/migrations/0001_trust_runtime.sql  # Generated by drizzle-kit
```

## Implementation Order

1. **Schema First** — `lib/db/src/schema/trust-runtime.ts` with all 4 tables
2. **Repository** — `lib/db/src/repositories/event-store.repository.ts` implementing `EventStore`
3. **Types Update** — Extend `RuntimeEvent` with governance fields
4. **Command Handler** — Add OCC retry loop
5. **Outbox Worker** — `src/runtime/outbox-worker.ts` with lease recovery
6. **Wire Up** — `event-store.ts` wrapper selects implementation
7. **Property Tests** — `tests/property/event-store.property.test.ts`
8. **Validation** — Typecheck, lint, tests, db:push

## Risk Mitigations

| Risk | Mitigation |
|------|-----------|
| Breaking existing in-memory tests | `InMemoryEventStore` remains; `PostgresEventStore` is additive |
| Migration conflicts with existing drizzle schema | New tables in dedicated `trust_runtime` concern; no name collisions |
| fast-check adds bundle weight | Dev dependency only, excluded from production build |
| OCC retry masks real errors | Max retry bounded (5); non-OCC errors propagate immediately |
| Outbox worker resource exhaustion | Poll interval 1s, batch limit 100, lease timeout 60s |

## Rollback Plan
If PostgreSQL event store causes regressions:
1. Set `DATABASE_URL=` to revert to `InMemoryEventStore` automatically
2. No code changes required — runtime selects implementation at startup
3. New schema tables can be dropped via `drizzle-kit` without affecting existing tables

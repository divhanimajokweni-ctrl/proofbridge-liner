# INVESTIGATION — Durable Event Store & Transactional Outbox — 2026-07-09

## Task
Replace the in-memory `InMemoryEventStore` in `src/lib/trust-runtime/` with a PostgreSQL-backed durable event store using the existing `drizzle-orm` infrastructure in `lib/db/`. Add optimistic concurrency control (OCC), transactional outbox pattern, governance/hash-chain fields, and property-based verification.

## Current State

### Trust Runtime Event Store (In-Memory)
- **File:** `src/lib/trust-runtime/event-store.ts`
- **Implementation:** `InMemoryEventStore` — pure in-memory append-only log
- **Interface:** `EventStore` with methods: `append`, `read`, `readRange`, `readFrom`, `getCurrentSequence`, `exists`, `saveSnapshot`, `loadLatestSnapshot`, `size`
- **Limitations:** No durability across restarts, no multi-instance sharing, no OCC, no governance fields

### Command Handler
- **File:** `src/lib/trust-runtime/command-handler.ts`
- **Implementation:** `DefaultCommandHandler` — produces `RuntimeEvent[]` from commands
- **Current behavior:** Returns events; caller is responsible for appending to store
- **No retry logic:** No OCC handling, no conflict resolution

### Types
- **File:** `src/lib/trust-runtime/types.ts`
- **RuntimeEvent:** Contains `eventId`, `type`, `version`, `timestamp`, `sequence`, `correlationId`, `causationId`, `source`, `payload`
- **Missing fields:** No `tenantId`, `streamId`, `streamVersion`, `payloadHash`, `eventHash`, `previousHash`, `schemaVersion`

### Reducer
- **File:** `src/lib/trust-runtime/reducer.ts`
- **Implementation:** Pure function `reduce(state, event) → nextState`
- **Deterministic:** Yes — suitable for replay and property testing

### Tests
- **Files:** `src/lib/trust-runtime/__tests__/event-store.test.ts`, `verify-replay.test.ts`, `verify-authoritative-sse.test.ts`
- **Current coverage:** Replay determinism, snapshot loading, SSE reconnect
- **Missing:** Property-based tests, OCC tests, concurrent append tests, hash-chain tests

### Database Infrastructure
- **ORM:** `drizzle-orm` 0.45.2 (installed in root `package.json`)
- **Config:** `lib/db/drizzle.config.ts` — PostgreSQL dialect, uses `DATABASE_URL`
- **Connection:** `lib/db/src/index.ts` — exports `getDb()` (lazy singleton)
- **Existing schemas:** SafeGrid (`sites`, `cameras`, `alerts`, `events`, etc.), Ubuntu Pools, SafeStake, Gamification
- **No event store schema:** No `events` table for trust runtime, no outbox, no snapshots for runtime

## Gaps

| Gap | Severity | Evidence |
|-----|----------|----------|
| No durable persistence for runtime events | Critical | `InMemoryEventStore` resets on restart |
| No multi-tenancy / stream isolation | Critical | No `tenantId` or `streamId` in `RuntimeEvent` |
| No optimistic concurrency control | High | `append` accepts any sequence; no version check |
| No governance / integrity fields | High | No hashes, no schema version, no causal chain in storage |
| No outbox for reliable delivery | High | No mechanism to guarantee event delivery to SSE/WebSocket consumers |
| No property-based tests | Medium | Only deterministic unit tests exist |
| No snapshot verification | Medium | `saveSnapshot` stores state without hash integrity check |
| No lease-based worker recovery | Medium | No outbox worker exists |

## Existing Assets to Reuse
- `drizzle-orm` + `pg` already in `package.json`
- `lib/db/src/index.ts` `getDb()` singleton pattern
- `lib/db/drizzle.config.ts` migration infrastructure
- `InMemoryEventStore` interface as contract for `PostgresEventStore`
- Existing `reduce()` function for property-test determinism
- Existing replay tests as baseline for new property suite

## Proposed Direction
Implement the hardened event store in `lib/db/src/schema/trust-runtime.ts` and `lib/db/src/repositories/event-store.repository.ts`, keeping the existing `EventStore` interface so the runtime layer remains unchanged. Add outbox worker in `src/runtime/outbox-worker.ts`. Add property tests in `tests/property/event-store.property.test.ts`.

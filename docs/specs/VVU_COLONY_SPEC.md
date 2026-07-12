# VVU Colony — Complete Technical Specification

> **Single source of truth for the entire VVU Colony system.**
> **Every agent must read this before implementing any feature.**

---

## Overview

**VVU Colony** is a production-ready, event-sourced trust runtime that visualizes trust as a living ant colony. It combines **Event Sourcing (ES)** and **Command Query Responsibility Segregation (CQRS)** with a unique ant-colony metaphor to make trust verification intuitive and memorable.

---

## 1. Core Architecture

### Architectural Pattern

```
┌─────────────────────────────────────────────────────────────────────────────────────┐
│                              X₀ PRESERVATION LAYER                                │
│                                                                                    │
│  ┌─────────────────────────────────────────────────────────────────────────────┐   │
│  │                         COMMAND INGESTION                                   │   │
│  │                                                                             │   │
│  │  HTTP/2 → Idempotency → Validation → Auth → Tenant → Rate Limit → Lock     │   │
│  └─────────────────────────────────────────────────────────────────────────────┘   │
│                                      │                                              │
│                                      ▼                                              │
│  ┌─────────────────────────────────────────────────────────────────────────────┐   │
│  │                         EVENT SOURCING                                      │   │
│  │                                                                             │   │
│  │  Aggregate → Command → Reducer → Event → Event Store (Append-Only)         │   │
│  │                                                                             │   │
│  │  ✅ Hash Chain (prevHash → eventHash)                                      │   │
│  │  ✅ Ed25519 Signature Verification                                         │   │
│  │  ✅ Canonical JSON (RFC 8785)                                              │   │
│  │  ✅ Optimistic Concurrency (expectedVersion)                               │   │
│  │  ✅ UUIDv7 Event IDs                                                       │   │
│  │  ✅ Multi-Tenant (tenantId isolation)                                      │   │
│  └─────────────────────────────────────────────────────────────────────────────┘   │
│                                      │                                              │
│                                      ▼                                              │
│  ┌─────────────────────────────────────────────────────────────────────────────┐   │
│  │                         EVENT PUBLICATION                                   │   │
│  │                                                                             │   │
│  │  Transactional Outbox → Kafka/Redis → Dead Letter → Retry → Alert          │   │
│  └─────────────────────────────────────────────────────────────────────────────┘   │
│                                      │                                              │
│                                      ▼                                              │
│  ┌─────────────────────────────────────────────────────────────────────────────┐   │
│  │                         PROJECTION SYSTEM                                   │   │
│  │                                                                             │   │
│  │  Projection Manager → Versioned Projections → Checksum → Rebuild           │   │
│  │                                                                             │   │
│  │  ✅ Snapshotting (event seq + state hash)                                  │   │
│  │  ✅ Upcasters (schema evolution)                                           │   │
│  │  ✅ LRU Cache + TTL                                                        │   │
│  │  ✅ Thundering Herd Protection                                             │   │
│  └─────────────────────────────────────────────────────────────────────────────┘   │
│                                      │                                              │
│                                      ▼                                              │
│  ┌─────────────────────────────────────────────────────────────────────────────┐   │
│  │                         OBSERVABILITY                                       │   │
│  │                                                                             │   │
│  │  OpenTelemetry → Prometheus → Grafana → Structured Logs                    │   │
│  │                                                                             │   │
│  │  ✅ Health (Liveness + Readiness)                                          │   │
│  │  ✅ Startup Verification                                                   │   │
│  │  ✅ Audit Ledger (immutable)                                               │   │
│  └─────────────────────────────────────────────────────────────────────────────┘   │
│                                      │                                              │
│                                      ▼                                              │
│  ┌─────────────────────────────────────────────────────────────────────────────┐   │
│  │                         RECOVERY SYSTEM                                     │   │
│  │                                                                             │   │
│  │  Replay (FULL | FROM_SNAPSHOT | FROM_GLOBAL | VERIFY | DRY_RUN)           │   │
│  │                                                                             │   │
│  │  ✅ Verify Store → Repair Snapshots → Rebuild Projections                  │   │
│  │  ✅ Export Events → Import Events                                          │   │
│  │  ✅ Validate Hashes → Disaster Recovery                                    │   │
│  └─────────────────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Technology Stack

| Layer | Technology | Version |
|-------|------------|---------|
| **Runtime** | Node.js | 22.x |
| **Database** | PostgreSQL | 16+ |
| **ORM** | Drizzle | Latest |
| **Validation** | Zod | Latest |
| **API Framework** | Fastify | 5.x |
| **Encryption** | Node crypto (AES-256-GCM, RSA-OAEP) | Native |
| **Signatures** | Ed25519 (tweetnacl) | Latest |
| **Serialization** | RFC 8785 Canonical JSON | Custom |
| **Observability** | OpenTelemetry, Prometheus | Latest |
| **Testing** | Vitest, Supertest | Latest |
| **Container** | Docker, Docker Compose | Latest |
| **CI/CD** | GitHub Actions | Latest |

---

## 3. Database Schema

### Tenants

```typescript
tenants: {
  tenantId: uuid PK,
  name: text,
  createdAt: timestamp
}
```

### Commands (Idempotency)

```typescript
commands: {
  commandId: uuid PK,
  tenantId: uuid FK,
  idempotencyKey: text UNIQUE,
  streamId: uuid,
  correlationId: uuid,
  commandType: text,
  payload: jsonb,
  status: enum(pending | completed | failed),
  responseEventId: uuid,
  createdAt: timestamp,
  completedAt: timestamp
}
```

### Events (Immutable)

```typescript
events: {
  eventId: uuid PK,
  tenantId: uuid FK,
  streamId: uuid,
  sequence: bigint,
  globalSequence: bigint UNIQUE,
  eventType: text,
  schemaVersion: integer,
  eventVersion: integer,
  eventHash: text,
  previousHash: text,
  correlationId: uuid,
  causationId: uuid,
  payload: jsonb,
  producer: text,
  signature: text,
  timestamp: timestamp,
  createdAt: timestamp
}
```

### Outbox

```typescript
outbox: {
  id: bigint PK,
  tenantId: uuid FK,
  eventId: uuid FK,
  streamId: uuid,
  eventType: text,
  payload: jsonb,
  topic: text,
  delivered: boolean,
  attempts: integer,
  lastError: text,
  createdAt: timestamp,
  deliveredAt: timestamp
}
```

### Snapshots (Versioned)

```typescript
snapshots: {
  streamId: uuid PK,
  tenantId: uuid FK,
  sequence: bigint,
  state: jsonb,
  schemaVersion: integer,
  projectionVersion: integer,
  snapshotHash: text,
  lastEventHash: text,
  projectionHash: text,
  timestamp: timestamp
}
```

### Projection States (Versioned)

```typescript
projectionStates: {
  id: bigint PK,
  tenantId: uuid FK,
  streamId: uuid,
  projectionName: text,
  projectionVersion: integer,
  lastGlobalSequence: bigint,
  state: jsonb,
  checksum: text,
  createdAt: timestamp,
  updatedAt: timestamp
}
```

### Audit Ledger (Immutable)

```typescript
auditLogs: {
  id: bigint PK,
  tenantId: uuid FK,
  userId: uuid,
  action: text,
  resourceId: uuid,
  payload: jsonb,
  signature: text,
  createdAt: timestamp
}
```

### Indexes

| Table | Index | Type |
|-------|-------|------|
| events | (tenantId, streamId, sequence) | UNIQUE |
| events | (tenantId, globalSequence) | UNIQUE |
| events | (tenantId, eventType) | INDEX |
| events | (tenantId, streamId) | INDEX |
| events | (tenantId, correlationId) | INDEX |
| events | (tenantId, timestamp) | INDEX |
| snapshots | (tenantId, sequence) | INDEX |
| projectionStates | (tenantId, streamId, projectionName) | UNIQUE |
| projectionStates | (tenantId, lastGlobalSequence) | INDEX |
| outbox | (tenantId, delivered) | INDEX |
| auditLogs | (tenantId, action) | INDEX |

---

## 4. Event Types

### Discriminated Union

```typescript
type RuntimeEventUnion =
  | RuntimeEvent<'EVIDENCE_RECEIVED', EvidenceReceivedV1>
  | RuntimeEvent<'EVIDENCE_VERIFIED', EvidenceVerifiedV1>
  | RuntimeEvent<'RECEIPT_COMMITTED', ReceiptCommittedV1>
  | RuntimeEvent<'VERIFICATION_REJECTED', VerificationRejectedV1>
  | RuntimeEvent<'REPLAY_COMPLETED', ReplayCompletedV1>;
```

### Event Schemas

```typescript
EvidenceReceivedV1 = {
  claim: string,
  source: string,
  confidence: 'low' | 'medium' | 'high',
  sourceType: 'web' | 'api' | 'user' | 'sensor',
  rawData?: Record<string, any>
}

EvidenceVerifiedV1 = {
  evidenceId: string,
  verifier: string,
  trustContribution: number (0-1),
  method: 'bayesian' | 'proofbridge' | 'tee' | 'quorum',
  confidence: number (0-1),
  signature?: string
}

ReceiptCommittedV1 = {
  receiptId: string,
  receiptHash: string,
  envelopeHash: string,
  signature: string,
  trustScore: number (0-1),
  quorum: { total: number, passed: number }
}

VerificationRejectedV1 = {
  evidenceId: string,
  reason: string,
  rejectionCode: 'INVALID_SOURCE' | 'TRUST_TOO_LOW' | 'DUPLICATE' | 'MALFORMED'
}

ReplayCompletedV1 = {
  targetSequence: number,
  durationMs: number
}
```

---

## 5. Cryptographic Security

### Hash Chain

```
Event 1
├── eventId: "ev_001"
├── previousHash: null
├── eventHash: sha256(canonical(event1))
└── sequence: 1

Event 2
├── eventId: "ev_002"
├── previousHash: event1.eventHash
├── eventHash: sha256(canonical(event2))
└── sequence: 2

Event 3
├── eventId: "ev_003"
├── previousHash: event2.eventHash
├── eventHash: sha256(canonical(event3))
└── sequence: 3
```

### Verification

```typescript
function verifyChain(events: RuntimeEventUnion[]): boolean {
  let previousHash: string | null = null;
  for (const event of events) {
    if (event.previousHash && event.previousHash !== previousHash) {
      return false;
    }
    const computed = hashEvent(event);
    if (computed !== event.eventHash) {
      return false;
    }
    previousHash = event.eventHash;
  }
  return true;
}
```

### Ed25519 Signatures

- **Signing**: Every event is signed with Ed25519 before storage
- **Verification**: Signatures are verified during replay and command processing
- **Public Key**: Stored in the event payload
- **Canonicalization**: RFC 8785 ensures deterministic signatures

### Envelope Encryption

```
Plaintext Payload
       │
       ▼
Canonical JSON (RFC 8785)
       │
       ├───────────────┐
       │               │
       ▼               ▼
Ed25519 Sign      AES-256-GCM Encrypt
       │               │
       │               ▼
       │          Encrypted Payload
       │               │
       │               ▼
       │          RSA-OAEP Wrap (AES Key)
       │               │
       └───────┬───────┘
               ▼
       Encrypted Envelope
       (stored in PostgreSQL)
```

---

## 6. Governance System

### The Four Agents

| Agent | Role | Question |
|-------|------|----------|
| **Ed** | Constitution Guardian | "Is X₀ mathematically preserved?" |
| **Edd** | Production Engineer | "Can X₀ survive production?" |
| **Eddy** | Architecture Evolution | "Can X₀ support the next ten years?" |
| **Guerrierro** | Synthesis Agent | "What survives all three perspectives?" |

### X₀ Constitution

```
X₀
│
├── Core invariants
│   ├── Events are immutable
│   ├── Reducers are pure
│   └── Replay must produce identical state
├── Trust boundaries
│   ├── Ed25519 signatures
│   └── Multi-tenancy isolation
├── Event model
│   ├── Append-only
│   ├── Versioned schemas
│   └── Discriminated unions
├── Cryptographic model
│   ├── Ed25519
│   ├── RFC 8785 canonical JSON
│   └── Hash chain (prevHash → eventHash)
├── Replay guarantees
│   ├── Full deterministic replay
│   └── Snapshot + events = identical state
├── Determinism
│   ├── Pure reducers
│   ├── No side effects
│   └── No random values in state
├── Append-only storage
│   ├── Never delete
│   ├── Never update
│   └── Only append
├── Multi-tenancy
│   ├── Mandatory tenantId isolation
│   └── All queries include tenantId
└── Failure semantics
    ├── Fail closed
    ├── Health checks
    └── Startup verification
```

### Evaluation Matrix

```
SCORE = 0.40 × Invariant Preservation
      + 0.30 × Production Value
      + 0.20 × Future Flexibility
      - 0.10 × Complexity Cost
```

### Decision Rules

1. Critical Constitution violations (score < 0.8): **REJECT**
2. Constitution score < 0.6: **REJECT** regardless of other scores
3. Top 10 highest scores: **ACCEPT** as X₁ roadmap
4. Score ties: Prefer Constitution over Production over Future

---

## 7. Replay System

### Replay Modes

| Mode | Description |
|------|-------------|
| **FULL** | Replay all events from the beginning |
| **FROM_SNAPSHOT** | Replay events after the last snapshot |
| **FROM_GLOBAL** | Replay events from a specific global sequence |
| **VERIFY_ONLY** | Verify chain integrity without state changes |
| **DRY_RUN** | Simulate replay without persisting changes |

### Replay Flow

```
1. Load events (based on mode)
2. Reset projection (fresh state)
3. Apply events sequentially
4. Verify chain integrity
5. Save new snapshot
6. Invalidate cache
7. Rebuild cache
8. Emit REPLAY_COMPLETED event
```

---

## 8. Projection System

### Colony Projection

```typescript
ColonyProjection
├── getState() → ColonyState
├── getTrustScore() → number
├── getSeason() → 'spring' | 'summer' | 'autumn' | 'winter'
├── getCanopy() → { total, verified, rejected }
├── getColonyMetrics() → {
│   trustScore,
│   season,
│   canopy,
│   ants: {
│     scouts,   // pending evidence
│     carriers, // pending evidence
│     verifiers, // verified (capped at 4)
│     archivists, // verified
│     sentinels  // trust < 0.3 ? 8 : 3
│   },
│   leaves: [ { id, claim, verified, trustContribution } ]
│ }
```

### Projection Manager

- **Registration**: Projections register with name, version, initialize, apply, checksum
- **Rebuild**: Full rebuild from events when version mismatch
- **Caching**: LRU cache with TTL (1 hour)
- **Stampede Protection**: In-flight promise tracking

---

## 9. API Endpoints

### Public API

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/v1/runtime/command` | POST | Dispatch command (idempotent) |
| `/api/v1/runtime/colony/:streamId` | GET | Get colony state |
| `/api/v1/runtime/replay/:streamId` | POST | Trigger replay |
| `/api/v1/runtime/stream/:streamId` | GET | SSE stream |

### Admin API

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/v1/admin/verify` | POST | Verify store integrity |
| `/api/v1/admin/repair` | POST | Repair snapshots |
| `/api/v1/admin/rebuild` | POST | Rebuild projections |

### Recovery API

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/v1/recovery/export` | POST | Export events |
| `/api/v1/recovery/import` | POST | Import events |
| `/api/v1/recovery/validate` | POST | Validate hashes |

### Health API

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/health/liveness` | GET | Liveness probe |
| `/health/readiness` | GET | Readiness probe |
| `/metrics` | GET | Prometheus metrics |

---

## 10. Observability

### Metrics

| Metric | Type | Description |
|--------|------|-------------|
| `vvu_events_appended_total` | Counter | Total events appended (by streamId, eventType) |
| `vvu_projection_rebuilds_total` | Counter | Projection rebuilds |
| `vvu_cache_hit_ratio` | Gauge | Cache hit ratio |
| `vvu_command_latency_seconds` | Histogram | Command execution latency |

### Structured Logging

```typescript
logger.info({
  msg: 'Command dispatched',
  tenantId: 'tenant_001',
  streamId: 'stream_001',
  commandType: 'ADD_EVIDENCE',
  eventCount: 1,
  duration: 42
});
```

### Traces

```
session.started
    │
    ├── command.dispatch
    │   ├── validation
    │   ├── auth
    │   ├── rate_limit
    │   └── locking
    ├── event.append
    │   ├── sequence_allocation
    │   ├── signing
    │   ├── hashing
    │   └── storage
    ├── outbox.publish
    ├── projection.update
    │   ├── cache_check
    │   ├── apply_event
    │   └── snapshot
    └── response
```

---

## 11. Deployment Pipeline

### Pipeline Steps

```
1. Build
   └── npm run build

2. Migrations
   └── npm run db:migrate

3. X₁ Validation
   └── node scripts/validate-x1.js
       ├── Append Event with Envelope Encryption
       ├── Verify Event Chain Integrity
       ├── Snapshot Generation and Validation
       ├── Governance Check
       ├── Replay Determinism
       ├── Envelope Encryption Round Trip
       └── Multi-tenancy Isolation

4. Startup Verification
   └── node scripts/verify-startup.js
       ├── Database
       ├── Snapshots
       ├── Projections
       └── Indexes

5. Deploy
   └── npm run deploy

6. Post-deploy Smoke Test
   └── node scripts/smoke-test.js
```

### Fail-Closed Guarantee

- Any failed validation → **exit non-zero** → **deployment halted**
- Startup verification failures → **process exits**
- Smoke test failures → **rollback required**

---

## 12. Development Workflow

### Setup

```bash
git clone https://github.com/vvu/colony.git
cd colony
npm install
npm run db:generate
npm run db:migrate
npm run db:seed
npm run verify
npm run dev
```

### Testing

```bash
npm run test              # Unit tests
npm run test:integration  # Integration tests
npm run test:load         # Load tests
npm run test:chaos        # Chaos tests
npm run test:property     # Property-based tests
npm run test:replay       # Replay tests
npm run test:fuzz         # Fuzz tests
```

---

## 13. File Structure

```
vvu-colony/
├── src/
│   ├── db/
│   │   ├── schema.ts              # Database schema
│   │   ├── event-store.ts         # Event store repository
│   │   └── migrations/            # Versioned migrations
│   ├── events/
│   │   ├── types.ts               # Discriminated union
│   │   ├── upcasters.ts           # Event upcasters
│   │   └── validation.ts          # Zod schema enforcement
│   ├── domain/
│   │   ├── reducer.ts             # Pure reducer
│   │   ├── state.ts               # Versioned state
│   │   └── aggregate.ts           # Aggregate root
│   ├── projections/
│   │   ├── colony.ts              # Colony projection
│   │   ├── manager.ts             # Projection manager
│   │   └── registry.ts            # Projection registry
│   ├── runtime/
│   │   ├── engine.ts              # Runtime engine
│   │   ├── cache.ts               # LRU cache with TTL
│   │   └── locking.ts             # Aggregate locking
│   ├── crypto/
│   │   ├── verify.ts              # Ed25519 verification
│   │   ├── hash.ts                # Event hash chain
│   │   ├── canonical.ts           # RFC 8785 canonical JSON
│   │   └── envelope.ts            # Envelope encryption
│   ├── middleware/
│   │   ├── auth.ts                # JWT authentication
│   │   ├── rate-limit.ts          # Rate limiting
│   │   ├── idempotency.ts         # Idempotency layer
│   │   └── tenant.ts              # Multi-tenant isolation
│   ├── outbox/
│   │   ├── producer.ts            # Transactional outbox
│   │   └── worker.ts              # Outbox worker
│   ├── observability/
│   │   ├── metrics.ts             # Prometheus metrics
│   │   ├── tracing.ts             # OpenTelemetry
│   │   ├── logging.ts             # Structured logging
│   │   └── health.ts              # Health probes
│   ├── recovery/
│   │   ├── replay.ts              # Replay modes
│   │   ├── verify.ts              # Verification tools
│   │   └── repair.ts              # Repair tools
│   ├── security/
│   │   ├── jwt.ts                 # JWT rotation
│   │   ├── keys.ts                # Key rotation
│   │   └── audit.ts               # Audit ledger
│   ├── routes/
│   │   ├── runtime-routes.ts      # Runtime API
│   │   ├── sse-routes.ts          # SSE streaming
│   │   ├── admin-routes.ts        # Admin API
│   │   └── recovery-routes.ts     # Recovery API
│   └── server.ts                  # Fastify server
├── scripts/
│   ├── validate-x1.ts            # X₁ validation
│   ├── verify-startup.ts         # Startup verification
│   ├── smoke-test.ts             # Smoke test
│   └── deployment-pipeline.sh    # Deployment pipeline
├── tests/
│   ├── unit/                     # Unit tests
│   ├── integration/              # Integration tests
│   ├── load/                     # Load tests
│   └── chaos/                    # Chaos tests
├── package.json
├── tsconfig.json
├── docker-compose.yml
├── Dockerfile
└── .env.example
```

---

## 14. The Immortal Rule

> **The colony remembers everything. Knowledge is immortal. Trust is verified.**
>
> **X₀ is preserved. X₁ is evolved. The constitution is guarded.**
>
> **Every event is cryptographically chained. Every projection is versioned. Every failure is recoverable.**
>
> **The colony is immortal. The constitution is guarded. Deployment is fail-closed.**

---

*This specification is the single source of truth for VVU Colony. All implementation decisions must trace back to this document.*

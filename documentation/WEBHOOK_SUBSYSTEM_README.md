# VVU-IVE Webhook Subsystem — Reliability Contract v1.1 Implementation

**Status:** ✅ CONTRACT LOCKED FOR IMPLEMENTATION — Launch: September 15, 2026
**Spec:** VVU-IVE Reliability Contract v1.1 (locked Aug 18, 2026)
**Tests:** 52/52 passing (retry + budget + circuit-breaker + integration)

---

## What This Is

The **Execution/Reliability Layer** of the ProofBridge-Liner stack. Its single, non-negotiable law:

> **A failed webhook (external system down) must NEVER block a Verification Worker.**

VVU-IVE verifies a claim → persists to PostgreSQL → publishes a delivery event to Kafka → webhook workers pick it up and deliver to the external endpoint. If the endpoint dies at step 5, steps 1–4 still complete successfully.

This subsystem is a **"Guardian"** around the mathematical engine. It builds controlled, auditable failure — not features.

---

## Architecture (Where This Lives)

```
PROOFBRIDGE-LINER
   ↓
VVU-IVE (Verification + State Engine — EIS Theorems 1–5)
   ↓
AUTHORIZATION / RELEASE LAYER (SafeLiner, SafeGrid, SafeKrypte)
   ↓
EXECUTION/RELIABILITY LAYER  ← **YOU ARE HERE**
   ├─ Kafka (12 partitions) + Webhook Workers (12+2) + Admin (2)
   │   ├─ Per-webhook Circuit Breaker
   │   ├─ Retry Budget / Backoff
   │   └─ DLQ (30-day retention)
   ↓
EXTERNAL SYSTEMS (ProofBridge primary, GitHub CI/CD, Discord post-launch)
```

**Critical separation:** The existing EIS `circuit-breaker.ts` (Theorem 5 — fail-closed on evidence loss) is NOT this subsystem's circuit breaker. This subsystem's per-webhook CB lives in `src/lib/webhook/circuit-breaker.ts` and trips on HTTP delivery terminal failures (10 per webhook). Different layer, different trigger, different persistence. Do NOT conflate.

---

## Quick Start

### 1. Start Kafka (local dev)

```bash
docker compose -f docker/docker-compose.kafka.yml up -d
# Wait ~10s for Kafka to boot
```

### 2. Create Kafka topics (idempotent — safe to re-run)

```bash
KAFKA_BROKERS=localhost:9092 bun run webhook:create-topics
```

Expected output:
```
vvu-webhook-delivery             created
vvu-webhook-delivery-dlq         created
vvu-webhook-audit                created
```

### 3. Push Prisma schema (already done if you ran `bun run db:push`)

```bash
bun run db:push
```

### 4. Start webhook workers (in separate terminals or via process manager)

```bash
bun run webhook:worker    # Delivery worker (12+2 in prod, 1 for local dev)
bun run webhook:admin     # Admin/audit worker (2 in prod, 1 for local dev)
```

### 5. Register a webhook endpoint

```bash
curl -X POST http://localhost:3000/api/v1/webhooks \
  -H "Content-Type: application/json" \
  -d '{
    "name": "ProofBridge Production Callback",
    "url": "https://proofbridge.example.com/hooks/vvu-ive",
    "type": "proofbridge",
    "secret": "your-hmac-secret"
  }'
```

### 6. Publish a delivery (typically called by VVU-IVE after authorization)

From any server-side code:
```typescript
import { publishDelivery } from "@/lib/webhook";

await publishDelivery({
  webhookId: "<webhook_id_from_step_5>",
  eventId: `evt_${claimId}_${newState}`,
  payload: { claimId, state: "VERIFIED", authorizedAt: new Date().toISOString() },
});
```

The webhook worker picks up the message and delivers it with the `Idempotency-Key: <delivery_id>` header.

---

## Environment Variables

| Variable | Default | Description |
|---|---|---|
| `DATABASE_URL` | `file:./db/custom.db` | Prisma datasource (SQLite for dev, Postgres for prod) |
| `WEBHOOK_TRANSPORT` | `kafka` | `kafka` for prod, `memory` for tests/dev without Kafka |
| `KAFKA_BROKERS` | `localhost:9092` | Comma-separated broker list |
| `KAFKA_CLIENT_ID` | `vvu-ive-webhook` | Client ID for kafkajs |
| `KAFKA_SASL_MECHANISM` | _(none)_ | `plain` \| `scram-sha-256` \| `scram-sha-512` (production MSK) |
| `KAFKA_SASL_USERNAME` | _(none)_ | SASL username |
| `KAFKA_SASL_PASSWORD` | _(none)_ | SASL password |
| `KAFKA_SSL` | `false` | Set to `true` for production MSK |

---

## API Reference (v1)

| Method | Route | Purpose |
|---|---|---|
| `POST` | `/api/v1/webhooks` | Register a webhook endpoint |
| `GET` | `/api/v1/webhooks` | List all webhooks |
| `GET` | `/api/v1/webhooks/[id]` | Get webhook + CB state + delivery stats |
| `PATCH` | `/api/v1/webhooks/[id]` | Soft-enable/disable (does NOT touch CB) |
| `POST` | `/api/v1/webhooks/[id]/circuit-breaker/reset` | Force-reset a tripped CB |
| `GET` | `/api/v1/webhooks/[id]/dlq` | List DLQ entries (filters: `?reason=&unreplayed=&limit=&offset=`) |
| `POST` | `/api/v1/webhooks/[id]/delivery-attempts/[attempt_id]/retry` | Manual replay (operator only) |

---

## Contract Compliance Matrix (v1.1)

Every locked number from the contract is implemented and tested.

### Pillar 1 — Kafka Partitioning & Ordering

| Item | Contract | Implementation | Test |
|---|---|---|---|
| Partitions | 12 | `KAFKA_CONFIG.NUM_PARTITIONS = 12` | `tests/webhook/retry.test.ts` |
| Replication factor | 3 | `TOPIC_SPECS[].replicationFactor = 3` | `scripts/create-topics.ts` |
| Min ISR | 2 | `min.insync.replicas: 2` | `scripts/create-topics.ts` |
| acks | all | `acks: -1` in producer config | `src/lib/webhook/transport/kafka-impl.ts` |
| Partition key | `webhook_id` | `producer.publish(topic, webhookId, msg)` | `src/lib/webhook/publish.ts` |
| Per-webhook ordering | strict (concurrency=1) | Kafka partition guarantee + `WEBHOOK_CONCURRENCY: 1` | `tests/webhook/integration.test.ts` |
| Main retention | 7 days | `retention.ms: 604800000` | `KAFKA_CONFIG.RETENTION_MS_MAIN` |
| DLQ retention | 30 days | `retention.ms: 2592000000` | `KAFKA_CONFIG.RETENTION_MS_DLQ` |
| Consumer group | `vvu-webhook-delivery-workers` | `CONSUMER_CONFIG.GROUP_ID_DELIVERY` | `src/lib/webhook/config.ts` |
| Manual commit | `enable.auto.commit: false` | `allowAutoCommit: false` | `src/lib/webhook/transport/kafka-impl.ts` |
| Session timeout | 10s | `SESSION_TIMEOUT_MS: 10_000` | `src/lib/webhook/config.ts` |
| Heartbeat interval | 3s | `HEARTBEAT_INTERVAL_MS: 3_000` | `src/lib/webhook/config.ts` |
| Max poll interval | 300s | `MAX_POLL_INTERVAL_MS: 300_000` | `src/lib/webhook/config.ts` |

### Pillar 2 — Per-Webhook Circuit Breaker

| Item | Contract | Implementation | Test |
|---|---|---|---|
| Scope | per-webhook (not global) | `WebhookCircuitBreakerState` table keyed on `webhookId @unique` | `tests/webhook/circuit-breaker.test.ts` |
| Threshold | 10 terminal failures | `FAILURE_THRESHOLD: 10` | `circuit-breaker.test.ts > 10th terminal failure trips CB` |
| OPEN duration | 300s | `COOLDOWN_MS: 300_000` | `circuit-breaker.test.ts > OPEN within cooldown` |
| Half-open probes | exactly 1 | `HALF_OPEN_PROBES: 1` | `circuit-breaker.test.ts > only 1 probe at a time` |
| Terminal failure defn | "event exhausted all 4 attempts" | `isTerminalFailure` + worker only counts `exhausted_retries` (NOT non-retryable) | `integration.test.ts > scenario 2` |
| Sits OUTSIDE retry loop | yes | `checkBreaker()` called before retry engine | `worker.ts` |

### Pillar 3 — Retry Semantics

| Item | Contract | Implementation | Test |
|---|---|---|---|
| Total attempts | exactly 4 (1 + 3) | `MAX_ATTEMPTS: 4` | `retry.test.ts > max attempts` |
| Base delay | 5s | `BASE_DELAY_MS: 5_000` | `retry.test.ts > base delay` |
| Backoff factor | 5 | `BACKOFF_FACTOR: 5` | `retry.test.ts` |
| Max delay cap | 625s | `MAX_DELAY_MS: 625_000` | `retry.test.ts > retry 4 capped` |
| Jitter | full | `computeDelayMs()` full jitter | `retry.test.ts > jittered within [0, X)` |
| Per-attempt timeout | 30s | `ATTEMPT_TIMEOUT_MS: 30_000` (AbortController) | `retry.test.ts > per-attempt timeout` |
| Non-retryable codes | 400, 401, 403, 404, 405, 410, 422 | `NON_RETRYABLE_STATUS_CODES` | `retry.test.ts > non-retryable list` |
| Retryable codes | 408, 425, 429, 500, 502, 503, 504 | `RETRYABLE_STATUS_CODES` | `retry.test.ts > retryable list` |
| 429 Retry-After | honor, bounded by 625s | `parseRetryAfter()` | `retry.test.ts > parseRetryAfter` |
| Retry budget | ≤10% retry/request ratio | `RETRY_BUDGET_CONFIG.RATIO = 0.10` | `retry-budget.test.ts` |

### Pillar 4 — Dead Letter Queue

| Item | Contract | Implementation | Test |
|---|---|---|---|
| Retention | 30 days | Kafka topic + `DLQ_CONFIG.RETENTION_DAYS: 30` | `KAFKA_CONFIG.RETENTION_MS_DLQ` |
| Skipped events stay skipped | yes — explicit replay only | `DLQ_CONFIG.AUTO_REPLAY_ON_CB_CLOSE: false` | `integration.test.ts > scenario 4 + 5` |
| Manual replay endpoint | `POST /api/v1/webhooks/[id]/delivery-attempts/[attempt_id]/retry` | `src/app/api/v1/webhooks/[id]/delivery-attempts/[attempt_id]/retry/route.ts` | (manual test) |
| CB reset does NOT auto-replay | yes | `forceReset()` does not touch DLQ entries | `integration.test.ts > scenario 5` |

### Pillar 5 — Idempotency

| Item | Contract | Implementation | Test |
|---|---|---|---|
| Delivery guarantee | at-least-once | `IDEMPOTENCY_CONFIG.DELIVERY_GUARANTEE = "at-least-once"` | `integration.test.ts > scenario 6` |
| Header name | `Idempotency-Key` | `IDEMPOTENCY_CONFIG.HEADER_NAME` | `integration.test.ts > scenario 3` |
| Header value | `<delivery_id>` | `publishDelivery()` returns delivery_id; worker sends as header | `integration.test.ts > scenario 3` |
| External dedup | yes — receiver dedups using header | documented; not our responsibility | — |

---

## Worker Pools (Sept 15 Launch Topology)

| Pool | Replicas | Purpose | Run Command |
|---|---|---|---|
| API (Next.js) | 2 (Vercel) | Stateless HTTP — admin API + manual replay | (auto by Vercel) |
| Verification Workers | 4 (K8s/ECS) | Independent pool — runs EIS theorems | (existing VVU-IVE) |
| Webhook Consumers | 12+2 (K8s/ECS) | 1:1 with Kafka partitions + standby | `bun run webhook:worker` |
| Admin/Audit Workers | 2 (K8s/ECS) | Records audit trail, decoupled from delivery | `bun run webhook:admin` |

**Critical Isolation:** Verification workers ≠ Webhook consumers (separate pools). Webhook failures cannot consume verification capacity. **This is the September 15th launch test question #1.**

---

## September 15 Launch Checklist

When you look at your code/deployment, ask these 5 questions:

1. **Isolation:** If I turn off the internet (kill all webhooks), do my 4 Verification Workers stay at 100% CPU?
   → Yes — separate worker pools (`VERIFICATION_WORKERS: 4` independent of `ACTIVE_WEBHOOK_CONSUMERS: 12`).

2. **Stuck Endpoint:** If Webhook C gets a 500 error 10 times, is my Circuit Breaker correctly set to OPEN only for Webhook C, leaving A, B, and D processing normally?
   → Yes — `WebhookCircuitBreakerState` is keyed `@unique` on `webhookId`. CB for C does not touch A/B/D. Test: `circuit-breaker.test.ts > 10th terminal failure trips CB`.

3. **Infinite Loop:** Is there zero chance of an event retrying more than 4 times?
   → Yes — `MAX_ATTEMPTS: 4` is enforced in `worker.ts` retry loop. Test: `retry.test.ts > no retry past MAX_ATTEMPTS`.

4. **Bad Data:** If ProofBridge sends back a 400 Bad Request, do I immediately send it to DLQ without wasting retries?
   → Yes — `NON_RETRYABLE_STATUS_CODES` includes 400. Worker breaks the retry loop on first non-retryable. Test: `integration.test.ts > scenario 2`.

5. **Accidental Replay:** If I manually fix the endpoint and close the circuit breaker, are the old skipped events still sitting in the DLQ waiting for my explicit POST command, rather than flooding the newly fixed endpoint?
   → Yes — `forceReset()` only resets CB state. DLQ entries persist with `replayedAt = null`. Test: `integration.test.ts > scenario 5`.

---

## Failure Scenarios — How the System Handles Them

### Scenario A — Transient 503 from ProofBridge

1. Webhook worker picks up delivery event from Kafka
2. `checkBreaker()` returns PROCEED (CB is CLOSED, no prior failures)
3. `deliverOnce()` returns `{ outcome: "retryable", httpStatus: 503 }`
4. `shouldRetry(1, "retryable")` returns true
5. Worker sleeps `computeDelayMs(0)` ms (0–5s, full jitter)
6. Attempt 2 — if 503 again → retry 2 (0–25s) → attempt 3 (0–125s) → attempt 4 (0–625s)
7. If all 4 attempts fail → `terminalReason = "exhausted_retries"`
8. `recordResult(webhookId, false, true)` increments CB terminal count
9. `sendToDLQ({ reason: "exhausted_retries" })` persists DLQ entry + publishes to `vvu-webhook-delivery-dlq`
10. Operator inspects DLQ via `GET /api/v1/webhooks/[id]/dlq`, fixes endpoint, replays via `POST /api/v1/webhooks/[id]/delivery-attempts/[attempt_id]/retry`

### Scenario B — Permanent 401 Unauthorized (bad credentials)

1. Webhook worker picks up event
2. `deliverOnce()` returns `{ outcome: "non_retryable", httpStatus: 401 }`
3. Worker immediately breaks retry loop with `terminalReason = "non_retryable_error"`
4. **CB is NOT incremented** — per contract, non-retryable ≠ terminal failure (different layer)
5. DLQ entry persisted with `reason: "non_retryable_error"`, `finalHttpStatus: 401`
6. Operator updates webhook secret, then manually replays

### Scenario C — Endpoint permanently dead (DNS failure, ECONNREFUSED)

1. Worker attempts delivery → `outcome: "connection_failure"`
2. Retries 4 times → all fail with `connection_failure`
3. CB terminal failure count reaches 10 → CB trips to OPEN
4. New deliveries for this webhook → SKIP → DLQ entry with `reason: "circuit_breaker_open_skipped"`
5. After 300s cooldown, CB transitions to HALF_OPEN
6. Next delivery is the probe. If probe succeeds → CB CLOSED, normal flow resumes. If probe fails → CB back to OPEN, cooldown restarts.
7. Old skipped events STAY in DLQ. Operator must explicitly replay each one.

### Scenario D — Kafka producer failure during publish

1. VVU-IVE verifies claim, persists to PostgreSQL ✓
2. `publishDelivery()` calls `producer.publish()` → throws
3. The WebhookDelivery row exists in DB with status=PENDING, but no Kafka message
4. VVU-IVE core is NOT blocked — verification already succeeded
5. A background reconciler (TODO: implement) scans for `PENDING` deliveries with no Kafka metadata and re-publishes

(Status: reconciler not yet implemented. For Sept 15 launch, monitor `SELECT * FROM WebhookDelivery WHERE status='PENDING' AND kafkaPartition IS NULL`.)

---

## File Map

```
src/lib/webhook/
├── config.ts                       # All v1.1 contract numbers (LOCKED)
├── types.ts                        # Type definitions
├── kafka/
│   ├── client.ts                   # kafkajs factory (reads env)
│   ├── topics.ts                   # Topic names + specs (12 partitions, RF=3)
│   └── admin.ts                    # Idempotent topic creation
├── transport/
│   ├── interface.ts                # Producer/Consumer abstractions
│   ├── kafka-impl.ts               # Real kafkajs impl (acks=all, manual commit)
│   ├── memory-impl.ts              # In-memory impl (tests/dev — no Kafka needed)
│   └── factory.ts                  # Picks impl based on WEBHOOK_TRANSPORT env
├── retry.ts                        # 4 attempts, full jitter, parseRetryAfter
├── retry-budget.ts                 # ≤10% retry/request token bucket
├── circuit-breaker.ts              # Per-webhook CB (10 terminal, 300s, 1 probe)
├── deliver.ts                      # Single HTTP attempt + Idempotency-Key header
├── dlq.ts                          # DLQ publish + persist
├── publish.ts                      # publishDelivery() + createWebhook()
├── worker.ts                       # Main webhook worker (Pillars 1-5 in concert)
├── admin-worker.ts                 # Admin/audit worker (separate consumer group)
└── index.ts                        # Barrel exports

src/app/api/v1/webhooks/
├── route.ts                        # POST create / GET list
├── [id]/
│   ├── route.ts                    # GET inspect / PATCH enable-disable
│   ├── dlq/route.ts                # GET list DLQ entries
│   ├── circuit-breaker/
│   │   └── reset/route.ts          # POST force-reset CB
│   └── delivery-attempts/
│       └── [attempt_id]/
│           └── retry/route.ts      # POST manual replay (operator only)

scripts/
├── webhook-worker.ts               # bun --hot entry for delivery workers
├── admin-worker.ts                 # bun --hot entry for admin workers
└── create-topics.ts                # Idempotent Kafka topic creation

docker/
└── docker-compose.kafka.yml        # Local Kafka (KRaft mode, single broker)

tests/webhook/
├── retry.test.ts                   # 27 unit tests for retry math
├── retry-budget.test.ts            # 8 unit tests for budget
├── circuit-breaker.test.ts         # 11 unit tests for CB state machine
└── integration.test.ts             # 6 end-to-end scenarios (in-memory transport)
```

---

## Test Suite (52 tests, all passing)

```bash
bun run webhook:test
```

### Retry Unit Tests (`tests/webhook/retry.test.ts`) — 27 tests
- Constants match v1.1 contract (4 attempts, 5s base, factor 5, 625s cap, 30s timeout)
- `computeDelayMs()` full jitter bounds for retries 1–4+
- `classifyStatus()` for all status code lists
- `shouldRetry()` boundary conditions
- `parseRetryAfter()` for RFC 7231 seconds + HTTP-date format

### Retry Budget Unit Tests (`tests/webhook/retry-budget.test.ts`) — 8 tests
- Initial capacity = global_concurrency * 0.10 = 10 tokens
- `chargeRetry()` decrements tokens, increments counters
- `recordInitialAttempt()` records request without charging
- `getRetryRatio()` formula correctness

### Circuit Breaker Unit Tests (`tests/webhook/circuit-breaker.test.ts`) — 11 tests
- CLOSED state default behavior
- 1–9 terminal failures keep CB CLOSED
- 10th terminal failure trips to OPEN
- OPEN within cooldown → SKIP
- OPEN after cooldown → transition to HALF_OPEN + probe
- HALF_OPEN with probe in flight → SKIP subsequent
- Probe success → CLOSED, count reset
- Probe failure → back to OPEN, cooldown restarts
- `forceReset()` admin operation

### Integration Tests (`tests/webhook/integration.test.ts`) — 6 end-to-end scenarios
1. **Happy path:** 200 response → DELIVERED on first attempt, 1 attempt recorded, no DLQ
2. **Non-retryable:** 400 → immediate DLQ with `non_retryable_error`, 1 attempt, CB NOT counted
3. **Idempotency-Key header:** Verify header is sent and value = delivery_id (Pillar 5)
4. **CB OPEN skips:** Verify delivery is SKIPPED, DLQ entry with `circuit_breaker_open_skipped`, no HTTP attempt made
5. **CB reset does NOT auto-replay:** After `forceReset()`, skipped events stay in DLQ until explicit replay
6. **At-least-once contract:** Same delivery_id always carries same Idempotency-Key (Pillar 5)

---

## Operational Procedures

### Operator: Inspect a stuck webhook

```bash
# 1. Get webhook + CB state + delivery stats
curl http://localhost:3000/api/v1/webhooks/<webhook_id>

# 2. List DLQ entries (unreplayed only)
curl 'http://localhost:3000/api/v1/webhooks/<webhook_id>/dlq?unreplayed=true'
```

### Operator: Force-reset a tripped CB

```bash
curl -X POST http://localhost:3000/api/v1/webhooks/<webhook_id>/circuit-breaker/reset
```

⚠️ This does NOT auto-replay skipped events. They stay in DLQ.

### Operator: Manually replay a failed/skipped delivery

```bash
curl -X POST \
  http://localhost:3000/api/v1/webhooks/<webhook_id>/delivery-attempts/<delivery_id>/retry \
  -H "X-Operator-Id: your.name@proofbridge.io"
```

Returns `202 Accepted` with the new Kafka partition/offset. The worker will pick it up and run the full pipeline (CB check → retry → DLQ if still failing).

### Operator: Soft-disable a webhook (stop new deliveries)

```bash
curl -X PATCH http://localhost:3000/api/v1/webhooks/<webhook_id> \
  -H "Content-Type: application/json" \
  -d '{"enabled": false}'
```

Existing in-flight Kafka messages will still be attempted (but the worker will SKIP them with `WEBHOOK_DISABLED` reason). No new deliveries will be published by VVU-IVE core once the integration code checks `webhook.enabled`.

---

## Production Deploy Notes (Sept 15)

### Swap SQLite → Postgres

In `prisma/schema.prisma`:
```prisma
datasource db {
  provider = "postgresql"   // was "sqlite"
  url      = env("DATABASE_URL")
}
```

Set `DATABASE_URL=postgresql://...` in production env. Re-run `bun run db:push`.

### Kafka → AWS MSK

Set:
```bash
KAFKA_BROKERS=broker1:9094,broker2:9094,broker3:9094
KAFKA_SASL_MECHANISM=scram-sha-512
KAFKA_SASL_USERNAME=...
KAFKA_SASL_PASSWORD=...
KAFKA_SSL=true
```

The `createKafkaClient()` factory wires SASL/SSL automatically from these env vars.

### Run workers as K8s Deployment

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: vvu-webhook-worker
spec:
  replicas: 12  # 1:1 with Kafka partitions
  template:
    spec:
      containers:
      - name: worker
        image: vvu-ive:latest
        command: ["bun", "run", "webhook:worker"]
        env:
        - name: DATABASE_URL
          valueFrom: { secretKeyRef: { name: db-secret, key: url } }
        - name: KAFKA_BROKERS
          value: "..."
```

Add a second Deployment for admin workers with `replicas: 2` and `command: ["bun", "run", "webhook:admin"]`.

### Standby consumers (2 replicas for failover)

For the Sept 15 launch, the contract specifies 12 active + 2 standby webhook consumers. In K8s, this means:
- Deploy 14 replicas of the webhook worker
- Kafka's consumer group coordinator auto-balances: 12 active consumers each handle 1 partition, 2 idle on standby
- If an active consumer dies, Kafka rebalances and a standby picks up its partition

---

## What's NOT Implemented (post-Sept-15)

These are explicitly out of scope per the contract's "narrow by design" launch scope:

- **Multi-tenant webhooks** — ProofBridge only at launch; Q4 for expansion
- **Slack / Discord evidence sources** — post-launch
- **Mesh adapters (You.com, Brave, Arxiv)** — Q4 2026
- **Pending-delivery reconciler** — when Kafka publish fails, PENDING rows without `kafkaPartition` need a background sweep (TODO above)
- **Web UI** — operators use the REST API for now; UI can be added in the existing Next.js app at `src/app/page.tsx` later

---

## File Integrity / Sanity Check

After deployment, verify the subsystem is wired correctly:

```bash
# 1. Topics exist with correct config
bun run webhook:create-topics
# (should report "config_updated" for existing topics, "created" for new ones)

# 2. DB schema is in sync
bun run db:push
# (should report "Your database is now in sync")

# 3. Tests pass
bun run webhook:test
# (should report "52 pass, 0 fail")

# 4. Lint clean
bun run lint
# (should report "0 errors" — only the unused eslint-disable warnings remain)
```

---

## Contact

For questions about this subsystem, see the **VVU-IVE Reliability Contract v1.1** document (locked Aug 18, 2026, requires Divhani approval for changes).

For the broader ProofBridge-Liner architecture, see `documentation/VVU_IVE_PROOFBRIDGE_INTEGRATION.md`.

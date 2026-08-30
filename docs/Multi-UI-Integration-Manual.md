# Multi-UI Integration & Fail-Closed Failure Handlers — Engineering Handbook

> ProofBridge-Liner AIR Kernel — production reference for UI skin integration, circuit breaker operations, telemetry pipelines, and failure handler behavior.

---

## 1. Architecture Overview

### 1.1 AIR Kernel Terminal Routines → UI Skin Routing

The AIR Kernel executes terminal routines (evidence compilation, gate evaluation, trust scoring) and routes structured telemetry to downstream UI skins through a pub/sub event bus.

```
┌─────────────────────────────────────────────────────────────────┐
│                        AIR Kernel                               │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌───────────────┐  │
│  │ Evidence  │  │  Gate    │  │ Trust    │  │  Circuit      │  │
│  │ Compiler  │  │ Evaluator│  │ Scorer   │  │  Breaker      │  │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘  └───────┬───────┘  │
│       └──────────────┴──────────────┴────────────────┘          │
│                            │                                     │
│                     Event Bus (NATS/SSE)                         │
└────────────────────────────┬────────────────────────────────────┘
                             │
            ┌────────────────┼────────────────┐
            │                │                │
     ┌──────▼──────┐ ┌──────▼──────┐ ┌──────▼──────┐
     │  VVU Trust  │ │  Ubuntu     │ │  ProofBridge│
     │  Runtime    │ │  Pools UI   │ │  Dashboard  │
     │  Dashboard  │ │             │ │             │
     └─────────────┘ └─────────────┘ └─────────────┘
```

### 1.2 Event Routing Rules

| Event Type | Source | Target Skin | Transport |
|------------|--------|-------------|-----------|
| `evidence.leaf.added` | Evidence Compiler | VVU Trust Dashboard | SSE |
| `evidence.hash.computed` | Evidence Compiler | VVU Trust Dashboard | SSE |
| `gate.evaluation.complete` | Gate Evaluator | All UIs | SSE |
| `trust.score.updated` | Trust Scorer | VVU Trust Dashboard | SSE |
| `circuit_breaker.state_change` | Circuit Breaker | All UIs | SSE + WS |
| `pool.contribution.received` | Ubuntu Pools | Ubuntu Pools UI | SSE |
| `pool.validator.updated` | Ubuntu Pools | Ubuntu Pools UI | SSE |
| `policy.decision.made` | Gate Evaluator | VVU Trust Dashboard | SSE |
| `snapshot.generated` | Trust Runtime | VVU Trust Dashboard | SSE |
| `journal.entry.appended` | Trust Runtime | VVU Trust Dashboard | SSE |

### 1.3 Data Flow Constants

- Event bus latency budget: < 100ms p99
- SSE heartbeat interval: 15 seconds
- WebSocket ping interval: 30 seconds
- Event deduplication window: 5 seconds
- Maximum event payload: 64KB
- Reconnect backoff: 1s → 2s → 4s → 8s → 16s (cap)

---

## 2. VVU Trust Runtime Dashboard Integration

### 2.1 Real-Time Data Flow

The VVU Trust Dashboard consumes live data from the Trust Runtime via Server-Sent Events. The data flow is unidirectional: backend publishes, dashboard subscribes.

```
Trust Runtime (Backend)
    │
    ├── EventStore (append-only)
    │     └── on append → broadcast SSE event
    │
    ├── ProjectionManager
    │     └── on projection update → broadcast SSE snapshot
    │
    ├── BayesianScorer
    │     └── on score update → broadcast SSE trust_score
    │
    └── PolicyEngine
          └── on decision → broadcast SSE policy_decision
```

### 2.2 SSE Endpoint

```
GET /api/trust-runtime/sse
Accept: text/event-stream
```

Events emitted:

| Event | Payload Structure |
|-------|-------------------|
| `evidence_leaf` | `{ leafId, color, position, hash, timestamp }` |
| `journal_entry` | `{ seq, event, hash, timestamp }` |
| `snapshot` | `{ seq, state, trustScore, timestamp }` |
| `policy_decision` | `{ decisionId, policy, result, confidence, timestamp }` |
| `trust_score` | `{ score, confidence_interval: [low, high], timestamp }` |
| `replay_delta` | `{ fromSeq, toSeq, diff, timestamp }` |

### 2.3 Dashboard State Map

| Dashboard Component | Data Source | Refresh Trigger |
|---------------------|-------------|-----------------|
| Evidence Colony | EvidenceStore.leaves | `evidence_leaf` event |
| Trust Score Gauge | BayesianScorer.score | `trust_score` event |
| Journal Timeline | JournalStore.entries | `journal_entry` event |
| Hash Chain Visual | HashChain.computed | `evidence_leaf` event |
| Policy Decision Log | PolicyEngine.decisions | `policy_decision` event |
| Time Travel Slider | SnapshotStore.snapshots | `snapshot` event |

### 2.4 Reconnection Protocol

On SSE disconnect:
1. Client records last received `seq` number
2. Client reconnects with `?from=<last_seq>` query parameter
3. Server replays events from `last_seq` to current (replay delta)
4. Client merges replayed events into local state
5. Resume live streaming from current position

---

## 3. Ubuntu Pools UI Integration

### 3.1 Staking Data Flow

```
Ubuntu Pools Backend
    │
    ├── Contribution Listener
    │     └── on contribution → broadcast pool_contribution
    │
    ├── Validator Registry
    │     └── on state change → broadcast validator_update
    │
    ├── Pool Distributor
    │     └── on distribution → broadcast pool_distribution
    │
    └── Stitch InstantEFT Handler
          └── on receipt → broadcast on_chain_receipt
```

### 3.2 UI Component Data Bindings

| Component | Endpoint | Event |
|-----------|----------|-------|
| Pool Overview | `GET /api/pools` | On load + `pool_distribution` |
| Validator List | `GET /api/pools/validators` | `validator_update` |
| Contribution Feed | SSE `/api/pools/sse` | `pool_contribution` |
| Staking APY | `GET /api/pools/apy` | On load + `pool_distribution` |
| On-Chain Receipts | SSE `/api/pools/sse` | `on_chain_receipt` |

### 3.3 Pool Distribution Schema

```json
{
  "poolId": "string",
  "totalStaked": "string (wei)",
  "validatorCount": "number",
  "currentAPY": "number (percentage)",
  "distributions": [
    {
      "epoch": "number",
      "amount": "string (wei)",
      "timestamp": "string (ISO-8601)",
      "txHash": "string"
    }
  ]
}
```

### 3.4 Validator State Machine

```
ACTIVE ────┐
    │      │
    ▼      │
JAILING ──┘ (on missed block)
    │
    ▼
EXITING ──── UNBONDING ──── EXITED
```

State transitions broadcast as `validator_update` events with `{ validatorId, fromState, toState, reason, timestamp }`.

---

## 4. Circuit Breaker Operations

### 4.1 Operating Modes

| Mode | Behavior | Throughput | Request Handling |
|------|----------|------------|-----------------|
| **NORMAL** | Full capacity | 100% | All requests processed |
| **DEGRADED** | Reduced capacity, cached responses | 30-50% | Serve from cache, reject cache misses |
| **FAIL-CLOSED** | All requests rejected | 0% | Immediate 503 + audit log entry |
| **HALT** | Manual intervention required | 0% | All requests rejected, alerts fired |

### 4.2 DEGRADED Mode

Entered when: error rate > 15% over 60-second window, or latency p99 > 2 seconds.

Behavior:
- Route requests through response cache (TTL: 30 seconds)
- Cache miss → serve stale data with `X-Served-From: stale-cache` header
- Log degradation start event to audit trail
- Emit `circuit_breaker.state_change` with `{ from: "NORMAL", to: "DEGRADED", reason: "..." }`
- Reduce ai-model-router timeout to 5 seconds (from 30 seconds)
- Reduce baileys provider concurrency to 2 (from 10)

### 4.3 FAIL-CLOSED Mode

Entered when: error rate > 40% over 60-second window, or critical dependency unreachable for > 30 seconds.

Behavior:
- ALL incoming requests rejected with HTTP 503
- Response body: `{ "error": "SERVICE_UNAVAILABLE", "mode": "FAIL_CLOSED", "retry_after": 30 }`
- Audit log entry written: `{ timestamp, mode, trigger, request_count_rejected, duration }`
- No cached responses served
- No fallback responses attempted
- Circuit breaker state persisted to durable storage
- Alert fired to on-call via HeartbeatBus

### 4.4 Recovery Protocol

```
FAIL-CLOSED / HALT
        │
        ▼
Health Check (every 30s)
        │
   ┌────┴────┐
   │         │
  FAIL      PASS
   │         │
   ▼         ▼
Stay     HALF_OPEN
HALT            │
                ▼
        Probe Requests (5 consecutive)
                │
           ┌────┴────┐
           │         │
         FAIL      PASS
           │         │
           ▼         ▼
       FAIL-CLOSED  NORMAL
```

### 4.5 ai-model-router Downtime Handling

When ai-model-router is unreachable:
1. Circuit breaker transitions to DEGRADED after 15 seconds of failed health checks
2. Requests routed to cached model responses (if available)
3. Cache miss → return structured error: `{ "error": "MODEL_UNAVAILABLE", "fallback": "cached" }`
4. After 60 seconds of continuous failure → transition to FAIL-CLOSED
5. Recovery: health check succeeds → HALF_OPEN → 5 probe requests → NORMAL

### 4.6 Baileys Provider Downtime Handling

When baileys (WhatsApp) provider is unreachable:
1. Queue outgoing messages to NATS durable queue
2. Circuit breaker enters DEGRADED — accept incoming, queue outgoing
3. After 120 seconds → FAIL-CLOSED for baileys-specific endpoints only
4. Other endpoints continue serving normally
5. Recovery: provider reconnect → drain queue → resume NORMAL

### 4.7 Circuit Breaker State Machine

```
                    error_rate > 40%
        NORMAL ──────────────────────► FAIL-CLOSED
          │                               │
          │ error_rate > 15%              │ health_check_pass
          ▼                               ▼
       DEGRADED ◄──── recovery ────► HALF_OPEN
          │                               │
          │ error_rate > 40%              │ 5 probe requests pass
          └───────────────────────────────┘
                                              │
                                         health_check_fail
                                              │
                                              ▼
                                         FAIL-CLOSED
```

---

## 5. Telemetry Pipeline

### 5.1 JSON Telemetry Structure

Every gate evaluation produces a structured JSON telemetry event:

```json
{
  "event_id": "uuid-v4",
  "timestamp": "2026-07-17T00:00:00.000Z",
  "pipeline_phase": "string (1-13)",
  "gate_name": "string",
  "status": "PASS | FAIL | SKIP",
  "duration_ms": "number",
  "artifacts": {
    "test_count": "number",
    "pass_count": "number",
    "fail_count": "number",
    "skip_count": "number"
  },
  "environment": {
    "node_version": "string",
    "platform": "string",
    "branch": "string",
    "commit": "string"
  },
  "metadata": {}
}
```

### 5.2 HTML Telemetry Structure

Gate evaluation results rendered as HTML for dashboard consumption:

```html
<div class="gate-telemetry" data-gate="TYPECHECK" data-status="PASS">
  <span class="gate-name">TypeCheck</span>
  <span class="gate-status pass">PASS</span>
  <span class="gate-duration">2340ms</span>
  <span class="gate-timestamp">2026-07-17T00:00:00Z</span>
</div>
```

### 5.3 Gate Evaluation Output Format

Each phase in the deployment loop writes structured telemetry:

| Field | Type | Description |
|-------|------|-------------|
| `phase` | number | Pipeline phase number (1-13) |
| `gate` | string | Gate identifier |
| `status` | enum | PASS, FAIL, WARN, SKIP |
| `duration_ms` | number | Execution time |
| `details` | object | Gate-specific output data |
| `artifacts` | array | Generated file paths |

### 5.4 Campaign Telemetry

Campaign results written to `test-campaign-results/`:

```
test-campaign-results/
├── campaign-summary-YYYYMMDD-HHMMSS.md
├── c1-policy-gate.txt
├── c2-evidence-envelope.txt
├── c3-runtime-contracts.txt
├── c4-runtime.txt
├── c5-event-journal.txt
├── c6-isolation.txt
├── c7-clerk-auth.txt
├── c8-signed-registry.txt
├── c9-heartbeat-schema.txt
├── c10-validate-specs.txt
├── c11-e2e-proofbridge.txt
└── c12-stress-test-queue.txt
```

---

## 6. Real-Time Event Routing

### 6.1 SSE Connections

| Endpoint | Client | Events Streamed |
|----------|--------|-----------------|
| `GET /api/trust-runtime/sse` | VVU Trust Dashboard | evidence, journal, snapshot, policy, trust_score |
| `GET /api/pools/sse` | Ubuntu Pools UI | pool_contribution, validator_update, distribution |
| `GET /api/health/sse` | Operations Dashboard | health_check, circuit_breaker, heartbeat |

SSE connection lifecycle:
1. Client opens `EventSource` to endpoint
2. Server sends `retry: 15000` directive
3. Server sends `:heartbeat` comments every 15 seconds
4. Client receives events with `id` field for replay
5. On reconnect, client sends `Last-Event-ID` header

### 6.2 WebSocket Connections

| Path | Client | Events Streamed |
|------|--------|-----------------|
| `ws://host/ws/circuit-breaker` | All UIs | circuit_breaker.state_change |
| `ws://host/ws/pool-realtime` | Ubuntu Pools UI | real-time contribution stream |

WebSocket lifecycle:
1. Client connects with `Sec-WebSocket-Protocol: vvu-dashboard`
2. Server sends `ping` every 30 seconds
3. Client must respond with `pong` within 10 seconds
4. On pong timeout → server closes with code 4000
5. Client reconnects with exponential backoff

### 6.3 Event Deduplication

Both SSE and WebSocket transports implement event deduplication:
- Server assigns monotonically increasing `seq` to each event
- Client maintains `last_received_seq`
- On reconnect, server sends events with `seq > last_received_seq`
- Deduplication window: 5 seconds (events with duplicate `event_id` within window are suppressed)

---

## 7. Error Handling Matrix

| Failure Mode | Detection | Response | Recovery |
|-------------|-----------|----------|----------|
| TypeScript type error | `tsc --noEmit` exit non-zero | Pipeline halt at Phase 2 | Fix types, re-run from Phase 1 |
| Lint error | `npm run lint` exit non-zero | Pipeline halt at Phase 3 | Fix lint, re-run from Phase 1 |
| Test failure | `vitest run` exit non-zero | Pipeline halt at Phase 4 | Fix test, re-run from Phase 1 |
| Build failure | `next build` exit non-zero | Pipeline halt at Phase 5 | Fix build, re-run from Phase 1 |
| Behavioral flow FAIL | `behavioral-coverage.ts` exit 1 | Pipeline halt at Phase 6 | Fix flow, re-run from Phase 1 |
| All behavioral SKIP | `behavioral-coverage.ts` exit 2 | Warning (not failure) | Start services, re-run Phase 6 |
| Vercel build failure | `vercel build` exit non-zero | Pipeline halt at Phase 7 | Fix build, re-run from Phase 1 |
| Push rejection | `git push` exit non-zero | Pipeline halt at Phase 8 | Resolve conflict, re-run from Phase 1 |
| DNS resolution failure | `dig` / `nslookup` no result | Pipeline halt at Phase 9 | Check domain config |
| Health check non-200 | `curl /api/health` not 200 | Pipeline halt at Phase 10 | Check deployment, restart services |
| Secrets check failure | `check-secrets.js` exit non-zero | Pipeline halt at Phase 10 | Rotate secrets, re-deploy |
| SSE disconnect | Client `onerror` fires | Auto-reconnect with backoff | Replay missed events via `Last-Event-ID` |
| WebSocket disconnect | Server pong timeout | Client reconnects with backoff | Re-establish stream |
| Circuit breaker trip | Error rate threshold exceeded | DEGRADED or FAIL-CLOSED mode | Health check → HALF_OPEN → NORMAL |
| ai-model-router down | Health check timeout | DEGRADED (cached responses) | Provider recovery → NORMAL |
| Baileys provider down | Connection refused | Queue outgoing, DEGRADED | Provider reconnect → drain queue |
| Dev server crash | `curl localhost:3000` fails | Pre-flight warning | `npm run dev` restart |
| SafeKrypte unreachable | `curl localhost:5096` fails | Behavioral SKIP (not FAIL) | Start SafeKrypte, re-run Phase 6 |
| Vercel CLI missing | `command -v vercel` fails | Hard fail on canonical branches | Install Vercel CLI |

---

## 8. Monitoring & Alerting

### 8.1 Metrics Collection

| Metric | Source | Export |
|--------|--------|--------|
| Pipeline phase duration | deployment-loop.sh | deploy-loop.log |
| Test pass/fail counts | vitest, forge, playwright | test-archives/ |
| Campaign results | run-campaigns.sh | test-campaign-results/ |
| Circuit breaker state | CircuitBreaker.sol | HeartbeatBus |
| Trust score | BayesianScorer | SSE stream |
| Event throughput | Trust Runtime | SSE stream |
| Health check latency | /api/health | monitoring agent |

### 8.2 Traces

Distributed traces captured via OpenTelemetry (observability.py):

| Span | Service | Operation |
|------|---------|-----------|
| `pipeline.phase` | Deployment Loop | Phase execution |
| `gate.evaluate` | Gate Evaluator | Individual gate check |
| `evidence.compile` | Evidence Compiler | Envelope build + sign |
| `trust.score` | Bayesian Scorer | Score computation |
| `circuit_breaker.evaluate` | Circuit Breaker | State transition check |
| `sse.broadcast` | Event Bus | Event dispatch to subscribers |

### 8.3 Alert Configuration

| Alert | Condition | Severity | Channel |
|-------|-----------|----------|---------|
| Pipeline Failure | Any phase FAIL | Critical | HeartbeatBus + on-call |
| Circuit Breaker Trip | State → FAIL-CLOSED | Critical | HeartbeatBus + on-call |
| Health Check Degraded | Latency p99 > 2s | Warning | HeartbeatBus |
| Test Regression | Test count decrease | Warning | HeartbeatBus |
| Build Time Increase | Build duration > 2x baseline | Info | HeartbeatBus |
| DNS Propagation Delay | Resolution > 300s post-deploy | Warning | HeartbeatBus |
| Vercel Build Failure | vercel build exit non-zero | Critical | HeartbeatBus + on-call |
| Secret Expiry | Key rotation overdue | Warning | HeartbeatBus |

### 8.4 HeartbeatBus Schema

```json
{
  "heartbeat_id": "uuid",
  "source": "string (service name)",
  "timestamp": "ISO-8601",
  "status": "HEALTHY | DEGRADED | FAILING",
  "metrics": {
    "uptime_seconds": "number",
    "request_count": "number",
    "error_rate": "number",
    "latency_p99_ms": "number"
  },
  "circuit_breaker": {
    "state": "NORMAL | DEGRADED | FAIL_CLOSED | HALF_OPEN",
    "error_rate": "number",
    "last_state_change": "ISO-8601"
  }
}
```

---

## Appendix A: API Reference for Dashboard Endpoints

### Trust Runtime SSE

```
GET /api/trust-runtime/sse
Headers:
  Accept: text/event-stream
  Last-Event-ID: <seq>  (on reconnect)

Events:
  evidence_leaf, journal_entry, snapshot, policy_decision, trust_score, replay_delta
```

### Pool SSE

```
GET /api/pools/sse
Headers:
  Accept: text/event-stream
  Last-Event-ID: <seq>  (on reconnect)

Events:
  pool_contribution, validator_update, pool_distribution, on_chain_receipt
```

### Health SSE

```
GET /api/health/sse
Headers:
  Accept: text/event-stream

Events:
  health_check, circuit_breaker, heartbeat
```

### Health Check

```
GET /api/health
Response: 200 OK
{
  "status": "healthy",
  "uptime": "number",
  "version": "string",
  "circuit_breaker": "NORMAL | DEGRADED | FAIL_CLOSED"
}
```

### Trust Runtime REST

```
GET /api/trust-runtime/snapshots
GET /api/trust-runtime/snapshots/:seq
GET /api/trust-runtime/journal?from=<seq>&limit=<n>
GET /api/trust-runtime/evidence-leaves
GET /api/trust-runtime/trust-score
GET /api/trust-runtime/policy-decisions?limit=<n>
GET /api/trust-runtime/receipts
GET /api/trust-runtime/receipts/:id
GET /api/trust-runtime/attestations
POST /api/trust-runtime/evidence-leaves
POST /api/trust-runtime/events
```

### Pool REST

```
GET /api/pools
GET /api/pools/validators
GET /api/pools/apy
GET /api/pools/contributions
POST /api/pools/contribute
```

### Circuit Breaker REST

```
GET /api/circuit-breaker/status
POST /api/circuit-breaker/trip
POST /api/circuit-breaker/reset
```

---

## Appendix B: Circuit Breaker State Machine Diagram

```
                           ┌─────────────────────┐
                           │                     │
                           ▼                     │
              ┌──────────────────┐               │
              │                  │  error_rate    │
              │     NORMAL       │  > 40%         │
              │                  ├───────────────►│
              └──────────────────┘               │
                   │       ▲                    │
                   │       │                    │
   error_rate      │       │  health_check      │
   > 15%           │       │  fail              │
                   ▼       │                    │
         ┌──────────────────┐                  │
         │                  │  error_rate       │
         │    DEGRADED      │  > 40%            │
         │                  ├──────────────────►│
         └──────────────────┘                  │
                   │                           │
                   │ 5 consecutive             │
                   │ probe requests pass        │
                   ▼                           │
         ┌──────────────────┐                  │
         │                  │  health_check     │
         │    HALF_OPEN     │  fail             │
         │                  ├──────────────────►│
         └──────────────────┘                  │
                   │                           │
                   │  health_check              │
                   │  fail                      │
                   ▼                           │
         ┌──────────────────┐                  │
         │                  │                  │
         │  FAIL-CLOSED     │  health_check    │
         │                  ├──────pass────────┤
         └──────────────────┘     (to          │
                                   HALF_OPEN)  │
                                               │
         ┌──────────────────┐                  │
         │                  │                  │
         │      HALT        │◄─────────────────┘
         │ (manual only)    │
         └──────────────────┘
                   │
                   │ manual reset
                   ▼
              NORMAL
```

State transitions:

| From | To | Trigger |
|------|----|---------|
| NORMAL | DEGRADED | Error rate > 15% over 60s |
| NORMAL | FAIL-CLOSED | Error rate > 40% over 60s |
| DEGRADED | NORMAL | Error rate drops below 5% for 60s |
| DEGRADED | FAIL-CLOSED | Error rate > 40% over 60s |
| FAIL-CLOSED | HALF_OPEN | Health check passes |
| HALF_OPEN | NORMAL | 5 consecutive probe requests succeed |
| HALF_OPEN | FAIL-CLOSED | Any probe request fails |
| Any | HALT | Manual intervention / 3-strike rollback |
| HALT | NORMAL | Manual reset by operator |

# Observability Stack — VVU Earth Ledger

This document describes the observability infrastructure for the VVU Earth Ledger, including structured logging, metrics, tracing, and health checks.

---

## Table of Contents

1. [Structured JSON Logging](#structured-json-logging)
2. [Prometheus Metrics](#prometheus-metrics)
3. [OpenTelemetry Traces](#opentelemetry-traces)
4. [Health Check Endpoints](#health-check-endpoints)
5. [Correlation IDs, Trace IDs, and Replay IDs](#correlation-ids-trace-ids-and-replay-ids)
6. [Log Aggregation Recommendations](#log-aggregation-recommendations)
7. [Alerting Rules and Thresholds](#alerting-rules-and-thresholds)

---

## Structured JSON Logging

### Configuration

The VVU Earth Ledger uses Python's `logging` module with a custom JSON formatter for production environments. Configuration is managed via `configs/logging.toml`.

**Production mode** (LOG_FORMAT=json):
- All log entries are emitted as single-line JSON objects
- Each entry includes timestamp, level, message, correlation_id, trace_id, and replay_id
- No color codes or formatting characters

**Development mode** (LOG_FORMAT=console):
- Human-readable console output with color coding
- Includes timestamp, level, module, and message
- Easier to read during development and debugging

### JSON Log Schema

```json
{
  "timestamp": "2025-07-29T12:34:56.789Z",
  "level": "INFO",
  "logger": "production_ledger.ledger",
  "message": "Fact appended to ledger",
  "correlation_id": "corr-abc123",
  "trace_id": "0af7651916cd43dd8448eb211c80319c",
  "replay_id": "replay-xyz789",
  "module": "production_ledger.ledger",
  "function": "append",
  "line": 142,
  "fact_id": "fact-def456",
  "epoch": 42,
  "validator_id": "VVU-VAL-0001",
  "extra": {
    "mmr_size": 1024,
    "proof_generation_time_ms": 12.5
  }
}
```

### Log Levels

| Level | Usage |
|-------|-------|
| DEBUG | Detailed diagnostic information (only in development) |
| INFO | Normal operational messages (fact appended, proof generated, etc.) |
| WARNING | Potential issues that don't prevent operation (slow proof generation, etc.) |
| ERROR | Operation failures that should be investigated (append failure, proof invalid, etc.) |
| CRITICAL | System-level failures requiring immediate attention (storage failure, quorum lost, etc.) |

### Log Rotation

- **Max file size**: 100 MB per log file
- **Rotation count**: 10 rotated files
- **Rotation interval**: Daily (or when max size is reached)
- **Compression**: gzip for rotated files older than 1 day
- **Retention**: 30 days for production, 7 days for development

---

## Prometheus Metrics

### Endpoint Configuration

The Prometheus metrics endpoint is configured via `configs/metrics.toml`.

| Setting | Value |
|---------|-------|
| Port | 9090 (configurable via `PROMETHEUS_PORT` env var) |
| Path | `/metrics` |
| Protocol | HTTP (use TLS termination at the reverse proxy) |
| Scrape interval | 15 seconds (recommended) |

### Exposed Metrics

#### Counter Metrics

| Metric | Type | Description | Labels |
|--------|------|-------------|--------|
| `append_count` | Counter | Total facts appended to the ledger | `validator_id`, `fact_type` |
| `proof_generation_count` | Counter | Total proofs generated | `validator_id`, `proof_type` |
| `replay_count` | Counter | Total replays executed | `validator_id`, `status` |
| `consensus_vote_count` | Counter | Total consensus votes cast | `validator_id`, `vote` |
| `error_count` | Counter | Total errors encountered | `validator_id`, `error_type`, `module` |
| `tls_handshake_count` | Counter | Total TLS handshakes | `status`, `tls_version` |

#### Gauge Metrics

| Metric | Type | Description | Labels |
|--------|------|-------------|--------|
| `mmr_size` | Gauge | Current MMR tree size | `validator_id` |
| `active_validators` | Gauge | Number of active validators in quorum | `quorum_id` |
| `quorum_threshold` | Gauge | Current quorum threshold | `quorum_id` |
| `ledger_height` | Gauge | Current ledger height (number of facts) | `validator_id` |
| `pending_operations` | Gauge | Number of pending operations | `validator_id`, `operation_type` |

#### Histogram Metrics

| Metric | Type | Description | Labels | Buckets |
|--------|------|-------------|--------|---------|
| `proof_generation_time` | Histogram | Time to generate a proof (seconds) | `validator_id`, `proof_type` | 0.001, 0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1.0 |
| `replay_duration` | Histogram | Time to replay the ledger (seconds) | `validator_id` | 0.01, 0.05, 0.1, 0.5, 1.0, 5.0, 10.0, 30.0, 60.0 |
| `append_latency` | Histogram | Time to append a fact (seconds) | `validator_id`, `fact_type` | 0.001, 0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1.0 |
| `consensus_round_duration` | Histogram | Time for a consensus round (seconds) | `validator_id` | 0.01, 0.05, 0.1, 0.5, 1.0, 5.0 |
| `grpc_request_duration` | Histogram | gRPC request duration (seconds) | `method`, `status_code` | 0.001, 0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1.0 |

#### Label Cardinality Limits

To prevent metric explosion, the following label cardinality limits are enforced:

| Label | Max Cardinality | Action on Exceed |
|-------|----------------|-----------------|
| `validator_id` | 100 | Reject new validators |
| `fact_type` | 50 | Group into "other" |
| `error_type` | 50 | Group into "other" |
| `proof_type` | 10 | Reject new types |
| `operation_type` | 20 | Group into "other" |

---

## OpenTelemetry Traces

### Configuration

OpenTelemetry tracing is configured via the `OTLP_ENDPOINT` environment variable and the `production_ledger.tracing` module.

| Setting | Value |
|---------|-------|
| Exporter | OTLP gRPC |
| Endpoint | Configured via `OTLP_ENDPOINT` (default: `http://localhost:4317`) |
| Protocol | gRPC (with TLS) |
| Sampling | Parent-based, 100% for errors, 10% for successful operations |
| Resource attributes | `service.name=vvu-earth-ledger`, `service.version=<version>`, `deployment.environment=<NODE_ENV>` |

### Traced Operations

| Operation | Span Name | Key Attributes |
|-----------|-----------|----------------|
| Fact append | `ledger.append` | `fact_id`, `fact_type`, `validator_id`, `epoch` |
| Proof generation | `ledger.proof.generate` | `proof_type`, `mmr_size`, `validator_id` |
| Proof verification | `ledger.proof.verify` | `proof_type`, `result`, `validator_id` |
| Ledger replay | `ledger.replay` | `replay_id`, `from_epoch`, `to_epoch`, `validator_id` |
| Consensus vote | `ledger.consensus.vote` | `validator_id`, `vote`, `round` |
| Snapshot creation | `ledger.snapshot.create` | `snapshot_id`, `epoch`, `mmr_size` |
| Key rotation | `ledger.key.rotate` | `validator_id`, `key_type`, `rotation_reason` |
| TLS handshake | `net.tls.handshake` | `tls_version`, `cipher_suite`, `status` |

### Trace Propagation

Traces are propagated across service boundaries using:
- **W3C Trace Context** headers for HTTP requests
- **gRPC metadata** for gRPC calls
- **Baggage** for correlation IDs

---

## Health Check Endpoints

The VVU Earth Ledger exposes three health check endpoints for Kubernetes probes:

### `/health` — Overall Health

Returns the overall health status of the ledger service.

```json
{
  "status": "healthy",
  "version": "0.8.0",
  "uptime_seconds": 86400,
  "checks": {
    "database": "healthy",
    "ledger": "healthy",
    "quorum": "healthy",
    "tls": "healthy"
  }
}
```

| Status Code | Meaning |
|-------------|---------|
| 200 | All checks healthy |
| 503 | One or more checks unhealthy |

### `/ready` — Readiness

Returns whether the service is ready to accept traffic.

```json
{
  "ready": true,
  "quorum_participating": true,
  "ledger_synced": true,
  "tls_certificates_valid": true
}
```

| Status Code | Meaning |
|-------------|---------|
| 200 | Service is ready |
| 503 | Service is not ready (still syncing, not in quorum, etc.) |

### `/live` — Liveness

Returns whether the service process is alive and responsive.

```json
{
  "alive": true,
  "pid": 12345,
  "goroutines": 42
}
```

| Status Code | Meaning |
|-------------|---------|
| 200 | Process is alive |
| 503 | Process is unresponsive (should be restarted) |

---

## Correlation IDs, Trace IDs, and Replay IDs

### Correlation ID

- **Purpose**: Links related log entries across multiple operations
- **Format**: `corr-<8-char-hex>` (e.g., `corr-a1b2c3d4`)
- **Generation**: Assigned at the API gateway or client request
- **Propagation**: Passed via `X-Correlation-ID` HTTP header or gRPC metadata
- **Injection**: Automatically injected into all log entries by the logging module

### Trace ID

- **Purpose**: Links all operations within a single distributed trace
- **Format**: 32-character hex string (e.g., `0af7651916cd43dd8448eb211c80319c`)
- **Generation**: Generated by OpenTelemetry SDK
- **Propagation**: W3C Trace Context (`traceparent` header)
- **Injection**: Automatically included in all log entries and span attributes

### Replay ID

- **Purpose**: Identifies a specific replay execution of the ledger
- **Format**: `replay-<8-char-hex>` (e.g., `replay-e5f6g7h8`)
- **Generation**: Assigned when a replay is initiated
- **Propagation**: Passed as a parameter to the replay engine
- **Injection**: Included in all log entries during the replay execution

### Relationship

```
Correlation ID (business request)
├── Trace ID (distributed trace span)
│   ├── Replay ID (replay execution)
│   │   ├── Log entries (structured JSON)
│   │   └── Metrics (with labels)
│   └── Log entries (structured JSON)
└── Metrics (with labels)
```

---

## Log Aggregation Recommendations

### Recommended Stack

| Component | Tool | Purpose |
|-----------|------|---------|
| Log Shipper | Fluent Bit or Vector | Collect and ship logs from each node |
| Log Storage | Elasticsearch or Loki | Store and index structured logs |
| Log Visualization | Grafana | Search and visualize logs |
| Metrics Storage | Prometheus | Time-series metrics storage |
| Metrics Visualization | Grafana | Dashboards and charts |
| Trace Storage | Jaeger or Tempo | Distributed trace storage and visualization |
| Alerting | Alertmanager | Route alerts based on rules |

### Recommended Architecture

```
[Validator Node]
    ├── App Logs ──► Fluent Bit ──► Loki ──► Grafana
    ├── Metrics ───► Prometheus ──► Grafana
    └── Traces ────► OTLP ──────► Tempo ──► Grafana
                                         └── Alertmanager ──► PagerDuty/Slack
```

### Log Indexing

Index the following fields in the log aggregation system for efficient querying:

- `timestamp` — time-range queries
- `level` — filter by severity
- `correlation_id` — trace related operations
- `trace_id` — link logs to traces
- `replay_id` — filter replay-specific logs
- `validator_id` — per-validator queries
- `fact_id` — find logs for a specific fact
- `module` — filter by component

### Retention Policy

| Data Type | Retention | Storage Tier |
|-----------|-----------|-------------|
| Structured logs | 90 days | Hot (30 days) → Warm (60 days) → Cold |
| Metrics | 180 days | Hot (30 days) → Warm (150 days) |
| Traces | 30 days | Hot (7 days) → Warm (23 days) |
| Audit logs | 1 year (compliance) | Hot (90 days) → Cold |

---

## Alerting Rules and Thresholds

### Critical Alerts (Immediate Response)

| Alert | Condition | Action |
|-------|-----------|--------|
| `LedgerQuorumLost` | `active_validators < quorum_threshold` for 2 minutes | Page on-call; investigate validator health |
| `LedgerAppendFailures` | `rate(error_count{error_type="append"}[5m]) > 0.1` | Page on-call; check storage and validator keys |
| `TLSHandshakeFailures` | `rate(tls_handshake_count{status="failed"}[5m]) > 0.05` | Page on-call; check certificates and network |
| `CertificateExpiry` | `x509_cert_not_after - time() < 30d` | Notify security team; initiate certificate rotation |
| `StorageFailure` | `rate(error_count{error_type="storage"}[5m]) > 0` | Page on-call; check disk and storage backend |

### Warning Alerts (Investigate Within 4 Hours)

| Alert | Condition | Action |
|-------|-----------|--------|
| `HighProofGenerationTime` | `histogram_quantile(0.95, proof_generation_time) > 0.5` | Investigate MMR size and system resources |
| `SlowReplayDuration` | `histogram_quantile(0.95, replay_duration) > 30` | Investigate ledger size and replay optimization |
| `HighAppendLatency` | `histogram_quantile(0.95, append_latency) > 0.25` | Investigate system load and network latency |
| `ValidatorNotParticipating` | `rate(consensus_vote_count[10m]) == 0` | Check validator health and network connectivity |
| `MMRSizeGrowth` | `mmr_size > 1000000` | Consider snapshot creation and pruning |
| `HighErrorRate` | `rate(error_count[5m]) / rate(append_count[5m]) > 0.01` | Investigate error patterns in logs |

### Informational Alerts (Review Daily)

| Alert | Condition | Action |
|-------|-----------|--------|
| `KeyRotationDue` | Days until key expiry < 30 | Schedule key rotation (see KeyRotation.md) |
| `LogRotationStalled` | Log file size > 500 MB | Check log rotation configuration |
| `MetricsScrapeFailure` | `up{job="vvu-earth-ledger"} == 0` | Check Prometheus target configuration |
| `DiskSpaceWarning` | `node_filesystem_avail_bytes / node_filesystem_size_bytes < 0.2` | Plan disk expansion or cleanup |

### Alert Routing

| Severity | Channel | Response Time |
|----------|---------|---------------|
| Critical | PagerDuty + Slack #incidents | < 15 minutes |
| Warning | Slack #alerts | < 4 hours |
| Informational | Slack #monitoring | Next business day |

---

## References

- [configs/logging.toml](../vvu-earth-ledger/configs/logging.toml)
- [configs/metrics.toml](../vvu-earth-ledger/configs/metrics.toml)
- [configs/tls.toml](../vvu-earth-ledger/configs/tls.toml)
- [Key Rotation Guide](./KeyRotation.md)
- [Validator Bootstrap](./ValidatorBootstrap.md)

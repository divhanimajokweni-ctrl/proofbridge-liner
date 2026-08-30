const KAFKA_CONFIG = {
  // 12 partitions — 1 per webhook at launch, room for growth
  NUM_PARTITIONS: 12,
  // Fault tolerance
  REPLICATION_FACTOR: 3,
  // acks=all safety
  MIN_INSYNC_REPLICAS: 2,
  // Operational events retained 7 days
  RETENTION_MS_MAIN: 7 * 24 * 60 * 60 * 1e3,
  // 604800000
  // DLQ retained 30 days
  RETENTION_MS_DLQ: 30 * 24 * 60 * 60 * 1e3,
  // 2592000000
  SEGMENT_MS: 60 * 60 * 1e3
  // 1 hour
};
const CONSUMER_CONFIG = {
  // Webhook delivery workers (12 active + 2 standby)
  GROUP_ID_DELIVERY: "vvu-webhook-delivery-workers",
  // Admin/audit workers (separate pool, 2 pods)
  GROUP_ID_ADMIN: "vvu-admin-audit-workers",
  // Detect consumer failures fast
  SESSION_TIMEOUT_MS: 1e4,
  HEARTBEAT_INTERVAL_MS: 3e3,
  // Long enough for retry backoff + delivery (max 625s + 30s = 655s)
  MAX_POLL_INTERVAL_MS: 3e5,
  // Start from earliest on first connect
  AUTO_OFFSET_RESET: "earliest",
  // Manual commit after successful delivery (exactly-once-ish semantics)
  ENABLE_AUTO_COMMIT: false
};
const WORKER_POOL_CONFIG = {
  // Webhook consumers — 1:1 with partitions, 2 standby for failover
  ACTIVE_WEBHOOK_CONSUMERS: 12,
  STANDBY_WEBHOOK_CONSUMERS: 2,
  // Verification workers (separate pool, independent of webhook failures)
  VERIFICATION_WORKERS: 4,
  // Admin/audit workers (static, 2 pods)
  ADMIN_WORKERS: 2,
  // Strict per-webhook ordering — events for the same webhook process 1-by-1
  WEBHOOK_CONCURRENCY: 1,
  // Per-partition concurrency (Kafka guarantee — DO NOT INCREASE)
  PARTITION_CONCURRENCY: 1,
  // Global outbound HTTP connection pool limit
  GLOBAL_CONCURRENCY: 100
};
const RETRY_CONFIG = {
  // EXACTLY 4 total attempts (1 initial + 3 retries) — DO NOT EXCEED
  MAX_ATTEMPTS: 4,
  // First retry delay (exponential base)
  BASE_DELAY_MS: 5e3,
  // 5s
  // Backoff factor — each retry multiplies previous delay by this
  BACKOFF_FACTOR: 5,
  // Hard cap on a single retry delay
  MAX_DELAY_MS: 625e3,
  // 625s
  // Full jitter — randomize the delay to avoid thundering herds
  JITTER: "full",
  // Per-attempt HTTP timeout (AbortController)
  ATTEMPT_TIMEOUT_MS: 3e4
  // 30s
};
const RETRY_BUDGET_CONFIG = {
  // Global ratio: retries must not exceed 10% of total outbound requests
  RATIO: 0.1,
  // Token bucket refresh interval (used by Postgres-backed budget impl)
  REFRESH_INTERVAL_MS: 6e4
  // 1 min
  // Initial token bucket capacity = (global concurrency) * ratio
  // (computed at runtime from WORKER_POOL_CONFIG.GLOBAL_CONCURRENCY)
};
const NON_RETRYABLE_STATUS_CODES = [
  400,
  // Bad Request
  401,
  // Unauthorized
  403,
  // Forbidden
  404,
  // Not Found
  405,
  // Method Not Allowed
  410,
  // Gone
  422
  // Unprocessable Entity
];
const RETRYABLE_STATUS_CODES = [
  408,
  // Request Timeout
  425,
  // Too Early
  429,
  // Too Many Requests (honor Retry-After, bounded by MAX_DELAY_MS)
  500,
  // Internal Server Error
  502,
  // Bad Gateway
  503,
  // Service Unavailable
  504
  // Gateway Timeout
];
const CIRCUIT_BREAKER_CONFIG = {
  // Per-webhook scope (NOT global)
  SCOPE: "webhook",
  // 10 consecutive TERMINAL failures (an event that exhausted all 4 attempts)
  FAILURE_THRESHOLD: 10,
  // OPEN duration (cooldown) — 5 minutes
  COOLDOWN_MS: 3e5,
  // 300s
  // Half-open allows exactly 1 probe request
  HALF_OPEN_PROBES: 1,
  // Definition of "terminal failure" for audit logging
  TERMINAL_FAILURE_DEFINITION: "event exhausted all 4 delivery attempts"
};
const DLQ_CONFIG = {
  // DLQ events retained 30 days
  RETENTION_DAYS: 30,
  // Operational (non-DLQ) events retained 7 days
  OPERATIONAL_RETENTION_DAYS: 7,
  // Critical: skipped events DO NOT auto-retry when breaker closes.
  // They stay in DLQ until explicit manual replay.
  AUTO_REPLAY_ON_CB_CLOSE: false
};
const IDEMPOTENCY_CONFIG = {
  // At-least-once delivery — duplicates can happen.
  // External system (ProofBridge) dedups using this header.
  HEADER_NAME: "Idempotency-Key",
  // The value is the delivery_id (unique per delivery attempt)
  HEADER_VALUE_SOURCE: "delivery_id",
  // We do NOT claim exactly-once HTTP delivery.
  DELIVERY_GUARANTEE: "at-least-once"
};
function getTransportKind() {
  var _a;
  const v = ((_a = process.env.WEBHOOK_TRANSPORT) != null ? _a : "kafka").toLowerCase();
  return v === "memory" ? "memory" : "kafka";
}
function getKafkaBrokers() {
  var _a;
  const v = (_a = process.env.KAFKA_BROKERS) != null ? _a : "localhost:9092";
  return v.split(",").map((s) => s.trim()).filter(Boolean);
}
export {
  CIRCUIT_BREAKER_CONFIG,
  CONSUMER_CONFIG,
  DLQ_CONFIG,
  IDEMPOTENCY_CONFIG,
  KAFKA_CONFIG,
  NON_RETRYABLE_STATUS_CODES,
  RETRYABLE_STATUS_CODES,
  RETRY_BUDGET_CONFIG,
  RETRY_CONFIG,
  WORKER_POOL_CONFIG,
  getKafkaBrokers,
  getTransportKind
};

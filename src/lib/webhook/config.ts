/**
 * VVU-IVE Webhook Subsystem — Configuration (Reliability Contract v1.1)
 * ----------------------------------------------------------------------------
 * Every constant in this file is LOCKED by the v1.1 contract.
 * Do NOT change these numbers without Divhani approval.
 * Status: CONTRACT LOCKED FOR IMPLEMENTATION — Launch: September 15, 2026
 */

// ── Kafka topology ─────────────────────────────────────────────────────────
export const KAFKA_CONFIG = {
  // 12 partitions — 1 per webhook at launch, room for growth
  NUM_PARTITIONS: 12,
  // Fault tolerance
  REPLICATION_FACTOR: 3,
  // acks=all safety
  MIN_INSYNC_REPLICAS: 2,
  // Operational events retained 7 days
  RETENTION_MS_MAIN: 7 * 24 * 60 * 60 * 1000, // 604800000
  // DLQ retained 30 days
  RETENTION_MS_DLQ: 30 * 24 * 60 * 60 * 1000, // 2592000000
  SEGMENT_MS: 60 * 60 * 1000, // 1 hour
} as const;

// ── Consumer group ─────────────────────────────────────────────────────────
export const CONSUMER_CONFIG = {
  // Webhook delivery workers (12 active + 2 standby)
  GROUP_ID_DELIVERY: "vvu-webhook-delivery-workers",
  // Admin/audit workers (separate pool, 2 pods)
  GROUP_ID_ADMIN: "vvu-admin-audit-workers",
  // Detect consumer failures fast
  SESSION_TIMEOUT_MS: 10_000,
  HEARTBEAT_INTERVAL_MS: 3_000,
  // Long enough for retry backoff + delivery (max 625s + 30s = 655s)
  MAX_POLL_INTERVAL_MS: 300_000,
  // Start from earliest on first connect
  AUTO_OFFSET_RESET: "earliest" as const,
  // Manual commit after successful delivery (exactly-once-ish semantics)
  ENABLE_AUTO_COMMIT: false,
};

// ── Worker pools (Sept 15 launch topology) ─────────────────────────────────
export const WORKER_POOL_CONFIG = {
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
  GLOBAL_CONCURRENCY: 100,
};

// ── Retry semantics (Pillar 3) ──────────────────────────────────────────────
export const RETRY_CONFIG = {
  // EXACTLY 4 total attempts (1 initial + 3 retries) — DO NOT EXCEED
  MAX_ATTEMPTS: 4,
  // First retry delay (exponential base)
  BASE_DELAY_MS: 5_000, // 5s
  // Backoff factor — each retry multiplies previous delay by this
  BACKOFF_FACTOR: 5,
  // Hard cap on a single retry delay
  MAX_DELAY_MS: 625_000, // 625s
  // Full jitter — randomize the delay to avoid thundering herds
  JITTER: "full" as const,
  // Per-attempt HTTP timeout (AbortController)
  ATTEMPT_TIMEOUT_MS: 30_000, // 30s
} as const;

// ── Retry budget (Pillar 3, layer 3 of protection) ──────────────────────────
export const RETRY_BUDGET_CONFIG = {
  // Global ratio: retries must not exceed 10% of total outbound requests
  RATIO: 0.10,
  // Token bucket refresh interval (used by Postgres-backed budget impl)
  REFRESH_INTERVAL_MS: 60_000, // 1 min
  // Initial token bucket capacity = (global concurrency) * ratio
  // (computed at runtime from WORKER_POOL_CONFIG.GLOBAL_CONCURRENCY)
} as const;

// ── Non-retryable HTTP status codes (Pillar 3) ──────────────────────────────
// These mean: "the request is malformed or unauthorized — retrying is pointless"
export const NON_RETRYABLE_STATUS_CODES: readonly number[] = [
  400, // Bad Request
  401, // Unauthorized
  403, // Forbidden
  404, // Not Found
  405, // Method Not Allowed
  410, // Gone
  422, // Unprocessable Entity
] as const;

// ── Retryable HTTP status codes (Pillar 3) ──────────────────────────────────
// These mean: "transient server error or rate-limit — retry with backoff"
export const RETRYABLE_STATUS_CODES: readonly number[] = [
  408, // Request Timeout
  425, // Too Early
  429, // Too Many Requests (honor Retry-After, bounded by MAX_DELAY_MS)
  500, // Internal Server Error
  502, // Bad Gateway
  503, // Service Unavailable
  504, // Gateway Timeout
] as const;

// ── Circuit breaker (Pillar 2 — per-webhook, NOT global) ───────────────────
export const CIRCUIT_BREAKER_CONFIG = {
  // Per-webhook scope (NOT global)
  SCOPE: "webhook" as const,
  // 10 consecutive TERMINAL failures (an event that exhausted all 4 attempts)
  FAILURE_THRESHOLD: 10,
  // OPEN duration (cooldown) — 5 minutes
  COOLDOWN_MS: 300_000, // 300s
  // Half-open allows exactly 1 probe request
  HALF_OPEN_PROBES: 1,
  // Definition of "terminal failure" for audit logging
  TERMINAL_FAILURE_DEFINITION: "event exhausted all 4 delivery attempts",
} as const;

// ── DLQ retention (Pillar 4) ───────────────────────────────────────────────
export const DLQ_CONFIG = {
  // DLQ events retained 30 days
  RETENTION_DAYS: 30,
  // Operational (non-DLQ) events retained 7 days
  OPERATIONAL_RETENTION_DAYS: 7,
  // Critical: skipped events DO NOT auto-retry when breaker closes.
  // They stay in DLQ until explicit manual replay.
  AUTO_REPLAY_ON_CB_CLOSE: false,
} as const;

// ── Idempotency (Pillar 5 — external contract) ─────────────────────────────
export const IDEMPOTENCY_CONFIG = {
  // At-least-once delivery — duplicates can happen.
  // External system (ProofBridge) dedups using this header.
  HEADER_NAME: "Idempotency-Key" as const,
  // The value is the delivery_id (unique per delivery attempt)
  HEADER_VALUE_SOURCE: "delivery_id" as const,
  // We do NOT claim exactly-once HTTP delivery.
  DELIVERY_GUARANTEE: "at-least-once" as const,
} as const;

// ── Transport selection ─────────────────────────────────────────────────────
// Allow tests/dev to swap Kafka for an in-memory transport
export type TransportKind = "kafka" | "memory";

export function getTransportKind(): TransportKind {
  const v = (process.env.WEBHOOK_TRANSPORT ?? "kafka").toLowerCase();
  return v === "memory" ? "memory" : "kafka";
}

// ── Kafka client connection ─────────────────────────────────────────────────
export function getKafkaBrokers(): string[] {
  const v = process.env.KAFKA_BROKERS ?? "localhost:9092";
  return v.split(",").map((s) => s.trim()).filter(Boolean);
}

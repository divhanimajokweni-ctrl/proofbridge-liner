/**
 * VVU-IVE Webhook Subsystem — Type Definitions (Reliability Contract v1.1)
 * ----------------------------------------------------------------------------
 * Type contracts for: Webhook, WebhookDelivery, WebhookDeliveryAttempt,
 * WebhookCircuitBreakerState, DeadLetterQueueEntry, AuditEvent.
 */

// ── Webhook ─────────────────────────────────────────────────────────────────
export type WebhookType = "proofbridge" | "github" | "discord" | "custom";

export interface WebhookRecord {
  id: string;
  name: string;
  url: string;
  type: WebhookType;
  secret: string;
  // STAGED ROTATION: when non-empty, both `secret` and `nextSecret` are
  // accepted by external systems during dual-validation. See Section 16
  // of the dossier. Empty string when no rotation is in flight.
  nextSecret: string;
  enabled: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// ── WebhookDelivery ────────────────────────────────────────────────────────
export type DeliveryStatus =
  | "PENDING"
  | "IN_FLIGHT"
  | "DELIVERED"
  | "FAILED"
  | "DLQ"
  | "SKIPPED";

export interface WebhookDeliveryRecord {
  id: string; // = delivery_id, used as Idempotency-Key
  webhookId: string;
  eventId: string; // stable external event identifier
  payload: string; // JSON-serialized event payload
  status: DeliveryStatus;
  statusReason: string;
  kafkaPartition: number | null;
  kafkaOffset: number | null;
  createdAt: Date;
  updatedAt: Date;
}

// ── WebhookDeliveryAttempt ──────────────────────────────────────────────────
export type AttemptOutcome =
  | "success"
  | "retryable"
  | "non_retryable"
  | "timeout"
  | "connection_failure";

export interface WebhookDeliveryAttemptRecord {
  id: string;
  deliveryId: string;
  attemptNumber: number; // 1..4
  httpStatus: number; // 0 if connection/TLS/timeout failure
  outcome: AttemptOutcome;
  responseBody: string;
  delayMs: number;
  startedAt: Date;
  finishedAt: Date | null;
}

// ── Circuit breaker state ───────────────────────────────────────────────────
export type CircuitBreakerState = "CLOSED" | "OPEN" | "HALF_OPEN";
export type HalfOpenProbeResult = "success" | "failure" | null;

export interface WebhookCircuitBreakerStateRecord {
  id: string;
  webhookId: string;
  state: CircuitBreakerState;
  terminalFailureCount: number;
  openedAt: Date | null;
  halfOpenProbeAt: Date | null;
  halfOpenProbeResult: HalfOpenProbeResult;
  updatedAt: Date;
}

// ── DLQ ──────────────────────────────────────────────────────────────────────
export type DLQReason =
  | "exhausted_retries"
  | "circuit_breaker_open_skipped"
  | "non_retryable_error";

export interface DeadLetterQueueEntryRecord {
  id: string;
  deliveryId: string | null;
  webhookId: string;
  eventId: string;
  reason: DLQReason;
  finalHttpStatus: number;
  payload: string;
  replayedBy: string;
  replayedAt: Date | null;
  createdAt: Date;
}

// ── Audit ───────────────────────────────────────────────────────────────────
export type AuditEventType =
  | "delivery_attempted"
  | "delivery_succeeded"
  | "delivery_failed"
  | "delivery_dlq"
  | "delivery_skipped"
  | "cb_state_change"
  | "cb_replayed";

export interface AuditEventRecord {
  id: string;
  type: AuditEventType;
  webhookId: string;
  deliveryId: string;
  attemptId: string;
  details: string; // JSON-serialized
  createdAt: Date;
}

// ── Kafka message envelope ──────────────────────────────────────────────────
// This is what gets published to the `vvu-webhook-delivery` topic.
// Consumers deserialize this and call the delivery pipeline.
export interface KafkaDeliveryMessage {
  deliveryId: string; // = Idempotency-Key
  webhookId: string; // used as Kafka partition key
  eventId: string;
  payload: string; // JSON-serialized event payload
  // Optional: when set, this delivery is a manual replay (operator-initiated)
  replayedBy?: string;
}

// ── Transport message (abstraction over Kafka / in-memory) ─────────────────
export interface TransportMessage {
  topic: string;
  partition: number;
  // Monotonic offset within partition (Kafka) or sequential id (memory)
  offset: string;
  // The deserialized message value
  value: KafkaDeliveryMessage;
  // Original partition key (always webhook_id)
  key?: string;
}

// ── Delivery result (from the HTTP attempt) ────────────────────────────────
export interface DeliveryResult {
  outcome: AttemptOutcome;
  httpStatus: number;
  responseBody: string;
  // True if this was the half-open probe for the per-webhook CB
  isHalfOpenProbe: boolean;
}

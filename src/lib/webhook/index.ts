/**
 * VVU-IVE Webhook Subsystem — Barrel Exports
 * ----------------------------------------------------------------------------
 * Public API surface of the webhook subsystem. Import from here:
 *   import { WebhookWorker, RETRY_CONFIG } from "@/lib/webhook";
 */

// Configuration
export {
  KAFKA_CONFIG,
  CONSUMER_CONFIG,
  WORKER_POOL_CONFIG,
  RETRY_CONFIG,
  RETRY_BUDGET_CONFIG,
  NON_RETRYABLE_STATUS_CODES,
  RETRYABLE_STATUS_CODES,
  CIRCUIT_BREAKER_CONFIG,
  DLQ_CONFIG,
  IDEMPOTENCY_CONFIG,
  getTransportKind,
  getKafkaBrokers,
} from "./config";
export type { TransportKind } from "./config";

// Types
export type {
  WebhookType,
  WebhookRecord,
  DeliveryStatus,
  WebhookDeliveryRecord,
  AttemptOutcome,
  WebhookDeliveryAttemptRecord,
  CircuitBreakerState,
  HalfOpenProbeResult,
  WebhookCircuitBreakerStateRecord,
  DLQReason,
  DeadLetterQueueEntryRecord,
  AuditEventType,
  AuditEventRecord,
  KafkaDeliveryMessage,
  TransportMessage,
  DeliveryResult,
} from "./types";

// Kafka
export {
  TOPIC_DELIVERY,
  TOPIC_DLQ,
  TOPIC_AUDIT,
  ALL_TOPICS,
  TOPIC_SPECS,
} from "./kafka/topics";
export type { TopicSpec } from "./kafka/topics";
export { kafka, createKafkaClient } from "./kafka/client";
export { createTopics } from "./kafka/admin";
export type { TopicCreationResult } from "./kafka/admin";

// Transport
export type { Producer, Consumer, Transport } from "./transport/interface";
export { DEFAULT_CONSUMER_CONFIG } from "./transport/interface";
export { createInMemoryTransport, broker } from "./transport/memory-impl";
export { createKafkaTransport, createKafkaConsumer } from "./transport/kafka-impl";
export { getTransport } from "./transport/factory";

// Retry
export {
  classifyStatus,
  computeDelayMs,
  getAttemptTimeoutMs,
  parseRetryAfter,
  shouldRetry,
  getMaxAttempts,
  isTerminalFailure,
} from "./retry";
export type { RetryEngineResult } from "./retry";

// Retry budget
export {
  chargeRetry,
  recordInitialAttempt,
  getBucketState,
  getRetryRatio,
  isBudgetExhausted,
  _resetBucketForTesting,
} from "./retry-budget";

// Circuit breaker
export {
  checkBreaker,
  recordResult,
  forceReset,
  getBreakerState,
} from "./circuit-breaker";

// Delivery
export { deliverOnce } from "./deliver";
export type { DeliverParams, DeliverAttemptResult } from "./deliver";

// DLQ
export {
  sendToDLQ,
  markReplayed,
  listDLQEntries,
} from "./dlq";
export type { SendToDLQParams } from "./dlq";

// Publish (delivery + replay)
export {
  createWebhook,
  listWebhooks,
  setWebhookEnabled,
  publishDelivery,
  publishReplay,
} from "./publish";
export type {
  CreateWebhookParams,
  PublishDeliveryParams,
  PublishDeliveryResult,
  PublishReplayParams,
  PublishReplayResult,
} from "./publish";

// Workers
export { WebhookWorker } from "./worker";
export type { WorkerOptions } from "./worker";
export { AdminWorker } from "./admin-worker";
export type { AdminWorkerOptions } from "./admin-worker";

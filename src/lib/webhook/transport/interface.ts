/**
 * VVU-IVE Webhook Subsystem — Transport Interface
 * ----------------------------------------------------------------------------
 * Abstraction over Kafka producer/consumer so the system can run with
 * either a real Kafka cluster (production) OR an in-memory transport
 * (dev / tests, no infrastructure required).
 *
 * Concrete implementations:
 *   - KafkaTransport   (kafkajs-backed)         — see transport/kafka-impl.ts
 *   - InMemoryTransport (process-local)         — see transport/memory-impl.ts
 *
 * The WebhookWorker depends only on this interface, so the transport can be
 * swapped via the WEBHOOK_TRANSPORT env var without touching worker code.
 */

import type { KafkaDeliveryMessage, TransportMessage } from "../types";
import { CONSUMER_CONFIG } from "../config";

// ── Producer ───────────────────────────────────────────────────────────────
export interface Producer {
  /**
   * Publish a delivery message. Partition key is `webhookId` (per contract
   * Pillar 1 — guarantees per-webhook ordering via Kafka partitioning).
   *
   * Returns the partition and offset assigned by Kafka (or by the in-memory
   * transport).
   */
  publish(
    topic: string,
    key: string, // = webhookId
    value: KafkaDeliveryMessage,
  ): Promise<{ partition: number; offset: string }>;

  /**
   * Flush any buffered messages and disconnect cleanly. Called on shutdown.
   */
  disconnect(): Promise<void>;
}

// ── Consumer ──────────────────────────────────────────────────────────────
export interface Consumer {
  /**
   * Subscribe to a topic with the given consumer group ID. The consumer must
   * NOT auto-commit offsets — manual commit is required (per contract
   * `enable.auto.commit: false`).
   *
   * Concurrency: 1 per partition (Kafka guarantee). The v1.1 contract calls
   * for `WEBHOOK_CONCURRENCY: 1` — events for the same webhook process
   * one-by-one in strict order.
   */
  subscribe(topic: string, groupId: string): Promise<void>;

  /**
   * Run the consumer loop. Each message is handed to `handler`. If the
   * handler resolves without throwing, the offset is committed. If it
   * throws, the offset is NOT committed (message will be redelivered).
   *
   * Returns when `stop()` is called.
   */
  run(
    handler: (message: TransportMessage) => Promise<void>,
  ): Promise<void>;

  /**
   * Signal the consumer to stop after the current in-flight message.
   * Used for graceful shutdown on SIGTERM.
   */
  stop(): Promise<void>;

  /**
   * Disconnect the underlying Kafka consumer (or release the in-memory
   * queue subscription).
   */
  disconnect(): Promise<void>;
}

// ── Transport factory ──────────────────────────────────────────────────────
export interface Transport {
  producer(): Promise<Producer>;
  consumer(): Promise<Consumer>;
}

// ── Default consumer config (shared by both impls) ────────────────────────
export const DEFAULT_CONSUMER_CONFIG = CONSUMER_CONFIG;

/**
 * VVU-IVE Webhook Subsystem — Transport Factory
 * ----------------------------------------------------------------------------
 * Picks the transport implementation based on WEBHOOK_TRANSPORT env var:
 *   - "kafka"  (default)  — real kafkajs cluster (production / docker-compose)
 *   - "memory"             — in-memory broker (dev / tests, no infra required)
 */

import type { Transport } from "./interface";
import { getTransportKind } from "../config";
import { createInMemoryTransport } from "./memory-impl";
import {
  createKafkaTransport,
} from "./kafka-impl";

/**
 * Build a transport. Use this in the webhook worker (delivery path) and
 * the manual-replay API route (publish path).
 *
 * @param consumerGroupId For Kafka transport only — defines the consumer
 *   group. Defaults to the delivery workers' group. Admin/audit workers
 *   should pass their own group ("vvu-admin-audit-workers").
 */
export async function getTransport(
  consumerGroupId?: string,
): Promise<Transport> {
  const kind = getTransportKind();
  switch (kind) {
    case "memory":
      return createInMemoryTransport();
    case "kafka":
    default:
      return createKafkaTransport(consumerGroupId);
  }
}

// Re-export interface for convenience
export type { Transport, Producer, Consumer } from "./interface";

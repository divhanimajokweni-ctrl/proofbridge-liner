/**
 * VVU-IVE Webhook Subsystem — Kafka Topic Constants
 * ----------------------------------------------------------------------------
 * Locked by v1.1 contract. Do NOT rename without coordinated migration.
 *
 *   vvu-webhook-delivery        — main delivery events (12 partitions, 7d retention)
 *   vvu-webhook-delivery-dlq    — dead letter queue (12 partitions, 30d retention)
 *   vvu-webhook-audit           — audit event stream (consumed by admin workers)
 */

import { KAFKA_CONFIG } from "../config";

export const TOPIC_DELIVERY = "vvu-webhook-delivery" as const;
export const TOPIC_DLQ = "vvu-webhook-delivery-dlq" as const;
export const TOPIC_AUDIT = "vvu-webhook-audit" as const;

export const ALL_TOPICS = [TOPIC_DELIVERY, TOPIC_DLQ, TOPIC_AUDIT] as const;

export interface TopicSpec {
  name: string;
  partitions: number;
  replicationFactor: number;
  // Config entries for `kafka.admin.alterConfigs`
  config: Record<string, string>;
}

export const TOPIC_SPECS: readonly TopicSpec[] = [
  {
    name: TOPIC_DELIVERY,
    partitions: KAFKA_CONFIG.NUM_PARTITIONS,
    replicationFactor: KAFKA_CONFIG.REPLICATION_FACTOR,
    config: {
      "retention.ms": String(KAFKA_CONFIG.RETENTION_MS_MAIN),
      "cleanup.policy": "delete",
      "segment.ms": String(KAFKA_CONFIG.SEGMENT_MS),
      "min.insync.replicas": String(KAFKA_CONFIG.MIN_INSYNC_REPLICAS),
    },
  },
  {
    name: TOPIC_DLQ,
    partitions: KAFKA_CONFIG.NUM_PARTITIONS,
    replicationFactor: KAFKA_CONFIG.REPLICATION_FACTOR,
    config: {
      "retention.ms": String(KAFKA_CONFIG.RETENTION_MS_DLQ),
      "cleanup.policy": "delete",
      "segment.ms": String(KAFKA_CONFIG.SEGMENT_MS),
      "min.insync.replicas": String(KAFKA_CONFIG.MIN_INSYNC_REPLICAS),
    },
  },
  {
    name: TOPIC_AUDIT,
    partitions: KAFKA_CONFIG.NUM_PARTITIONS,
    replicationFactor: KAFKA_CONFIG.REPLICATION_FACTOR,
    config: {
      "retention.ms": String(KAFKA_CONFIG.RETENTION_MS_MAIN),
      "cleanup.policy": "delete",
      "segment.ms": String(KAFKA_CONFIG.SEGMENT_MS),
      "min.insync.replicas": String(KAFKA_CONFIG.MIN_INSYNC_REPLICAS),
    },
  },
] as const;

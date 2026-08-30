import { KAFKA_CONFIG } from "../config";
const TOPIC_DELIVERY = "vvu-webhook-delivery";
const TOPIC_DLQ = "vvu-webhook-delivery-dlq";
const TOPIC_AUDIT = "vvu-webhook-audit";
const ALL_TOPICS = [TOPIC_DELIVERY, TOPIC_DLQ, TOPIC_AUDIT];
const TOPIC_SPECS = [
  {
    name: TOPIC_DELIVERY,
    partitions: KAFKA_CONFIG.NUM_PARTITIONS,
    replicationFactor: KAFKA_CONFIG.REPLICATION_FACTOR,
    config: {
      "retention.ms": String(KAFKA_CONFIG.RETENTION_MS_MAIN),
      "cleanup.policy": "delete",
      "segment.ms": String(KAFKA_CONFIG.SEGMENT_MS),
      "min.insync.replicas": String(KAFKA_CONFIG.MIN_INSYNC_REPLICAS)
    }
  },
  {
    name: TOPIC_DLQ,
    partitions: KAFKA_CONFIG.NUM_PARTITIONS,
    replicationFactor: KAFKA_CONFIG.REPLICATION_FACTOR,
    config: {
      "retention.ms": String(KAFKA_CONFIG.RETENTION_MS_DLQ),
      "cleanup.policy": "delete",
      "segment.ms": String(KAFKA_CONFIG.SEGMENT_MS),
      "min.insync.replicas": String(KAFKA_CONFIG.MIN_INSYNC_REPLICAS)
    }
  },
  {
    name: TOPIC_AUDIT,
    partitions: KAFKA_CONFIG.NUM_PARTITIONS,
    replicationFactor: KAFKA_CONFIG.REPLICATION_FACTOR,
    config: {
      "retention.ms": String(KAFKA_CONFIG.RETENTION_MS_MAIN),
      "cleanup.policy": "delete",
      "segment.ms": String(KAFKA_CONFIG.SEGMENT_MS),
      "min.insync.replicas": String(KAFKA_CONFIG.MIN_INSYNC_REPLICAS)
    }
  }
];
export {
  ALL_TOPICS,
  TOPIC_AUDIT,
  TOPIC_DELIVERY,
  TOPIC_DLQ,
  TOPIC_SPECS
};

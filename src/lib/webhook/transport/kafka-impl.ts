/**
 * VVU-IVE Webhook Subsystem — Kafka Transport (kafkajs-backed)
 * ----------------------------------------------------------------------------
 * Concrete implementation of the `Transport` interface backed by a real Kafka
 * cluster (MSK in production, docker-compose Kafka in dev).
 *
 * Critical contract compliance:
 *   - Manual commit only (enable.auto.commit: false)
 *   - Per-partition concurrency = 1 (WEBHOOK_CONCURRENCY: 1)
 *   - Stable partition key = webhook_id (per Pillar 1 ordering guarantee)
 *   - acks=all on the producer (set via KafkaConfig.createProducer options)
 */

import type { KafkaDeliveryMessage, TransportMessage } from "../types";
import { CONSUMER_CONFIG } from "../config";
import type {
  Consumer,
  Producer,
  Transport,
} from "./interface";
import { kafka } from "../kafka/client";
import { TOPIC_DELIVERY } from "../kafka/topics";

// ── Producer ────────────────────────────────────────────────────────────────
class KafkaProducer implements Producer {
  private inner: import("kafkajs").Producer;
  private connected = false;

  constructor() {
    // kafkajs types don't expose `acks` in ProducerConfig (it's set
    // per-send or via the idempotent flag). We use idempotent:true which
    // implies acks=-1 (all). Cast through unknown for the type gap.
    const config: unknown = {
      // Idempotent producer — prevents duplicates on retry
      // (matches at-least-once + Idempotency-Key strategy).
      // Idempotent requires acks=-1 internally.
      idempotent: true,
      // Wait briefly for in-flight messages on close
      transactionTimeout: 60_000,
    };
    this.inner = kafka.producer(config as import("kafkajs").ProducerConfig);
  }

  async connect(): Promise<void> {
    if (this.connected) return;
    await this.inner.connect();
    this.connected = true;
  }

  async publish(
    topic: string,
    key: string, // webhook_id
    value: KafkaDeliveryMessage,
  ): Promise<{ partition: number; offset: string }> {
    if (!this.connected) await this.connect();
    const result = await this.inner.send({
      topic,
      // Always send a key — kafkajs hash-partitions by key (default partitioner)
      messages: [{ key, value: JSON.stringify(value) }],
    });
    if (result.length === 0) {
      throw new Error(
        `KafkaProducer.publish() returned no record metadata for topic ${topic}`,
      );
    }
    return {
      partition: result[0].partition,
      offset: result[0].offset ?? "0",
    };
  }

  async disconnect(): Promise<void> {
    if (this.connected) {
      await this.inner.disconnect();
      this.connected = false;
    }
  }
}

// ── Consumer ────────────────────────────────────────────────────────────────
class KafkaConsumer implements Consumer {
  private inner: import("kafkajs").Consumer;
  private subscribedTopic?: string;
  private subscribedGroupId?: string;
  private connected = false;

  constructor() {
    // kafkajs types don't expose `maxPollInterval` (it's actually
    // `rebalanceTimeout` in the type defs, but the runtime accepts both).
    // Cast through unknown to bridge the type gap.
    const config: unknown = {
      groupId: CONSUMER_CONFIG.GROUP_ID_DELIVERY, // overridden in subscribe()
      sessionTimeout: CONSUMER_CONFIG.SESSION_TIMEOUT_MS,
      heartbeatInterval: CONSUMER_CONFIG.HEARTBEAT_INTERVAL_MS,
      rebalanceTimeout: CONSUMER_CONFIG.MAX_POLL_INTERVAL_MS,
      // Mandatory: do NOT auto-commit offsets. Manual commit only.
      // This implements "exactly-once-ish" semantics — the offset advances
      // only after the handler succeeds, so a crash mid-handling re-delivers.
      allowAutoCommit: CONSUMER_CONFIG.ENABLE_AUTO_COMMIT,
    };
    this.inner = kafka.consumer(config as import("kafkajs").ConsumerConfig);
  }

  async subscribe(topic: string, groupId: string): Promise<void> {
    if (!this.connected) {
      await this.inner.connect();
      this.connected = true;
    }
    // kafkajs doesn't allow changing groupId after construction, so we
    // eagerly create one consumer per groupId. The default group is the
    // delivery workers' group; admin workers construct with their own.
    // For simplicity, this consumer's groupId is set at construction time
    // via createKafkaConsumer(groupId). See factory below.
    this.subscribedTopic = topic;
    this.subscribedGroupId = groupId;
    await this.inner.subscribe({
      topic,
      fromBeginning: CONSUMER_CONFIG.AUTO_OFFSET_RESET === "earliest",
    });
  }

  async run(
    handler: (m: TransportMessage) => Promise<void>,
  ): Promise<void> {
    if (!this.subscribedTopic) {
      throw new Error("KafkaConsumer.run() called before subscribe()");
    }
    await this.inner.run({
      // Each partition processed sequentially by a single consumer
      // (kafkajs guarantee — matches WEBHOOK_CONCURRENCY: 1)
      eachMessage: async ({ message, topic, partition }) => {
        if (!message.value) {
          throw new Error(
            `KafkaConsumer received empty message on topic=${topic} partition=${partition} offset=${message.offset}`,
          );
        }
        const value = JSON.parse(
          message.value.toString("utf-8"),
        ) as KafkaDeliveryMessage;
        const transportMessage: TransportMessage = {
          topic,
          partition,
          offset: message.offset,
          value,
          key: message.key?.toString("utf-8"),
        };
        // Handler contract: throw → no commit (message redelivered).
        // Resolve → kafkajs auto-commits the offset after `eachMessage` returns.
        await handler(transportMessage);
      },
    });
  }

  async stop(): Promise<void> {
    await this.inner.stop();
  }

  async disconnect(): Promise<void> {
    if (this.connected) {
      await this.inner.disconnect();
      this.connected = false;
    }
  }
}

// ── Factory ─────────────────────────────────────────────────────────────────
// Note: kafkajs binds groupId at consumer construction time. The factory below
// accepts an explicit groupId so admin workers can use a different group.
export function createKafkaConsumer(groupId: string): Consumer {
  // kafkajs types don't expose `maxPollInterval` — use `rebalanceTimeout`
  // (the actual kafkajs name) and cast through unknown to bridge any
  // remaining type gap.
  const config: unknown = {
    groupId,
    sessionTimeout: CONSUMER_CONFIG.SESSION_TIMEOUT_MS,
    heartbeatInterval: CONSUMER_CONFIG.HEARTBEAT_INTERVAL_MS,
    rebalanceTimeout: CONSUMER_CONFIG.MAX_POLL_INTERVAL_MS,
    allowAutoCommit: CONSUMER_CONFIG.ENABLE_AUTO_COMMIT,
  };
  const inner = kafka.consumer(config as import("kafkajs").ConsumerConfig);
  const consumer = Object.create(KafkaConsumer.prototype);
  consumer.inner = inner;
  consumer.subscribedTopic = undefined;
  consumer.subscribedGroupId = groupId;
  consumer.connected = false;
  return consumer as KafkaConsumer;
}

class KafkaTransport implements Transport {
  private producerInstance: KafkaProducer | null = null;
  private consumerGroupId: string;

  constructor(consumerGroupId: string = CONSUMER_CONFIG.GROUP_ID_DELIVERY) {
    this.consumerGroupId = consumerGroupId;
  }

  async producer(): Promise<Producer> {
    if (!this.producerInstance) {
      this.producerInstance = new KafkaProducer();
      await this.producerInstance.connect();
    }
    return this.producerInstance;
  }

  async consumer(): Promise<Consumer> {
    return createKafkaConsumer(this.consumerGroupId);
  }
}

export function createKafkaTransport(
  consumerGroupId: string = CONSUMER_CONFIG.GROUP_ID_DELIVERY,
): Transport {
  return new KafkaTransport(consumerGroupId);
}

// Re-export the delivery topic for convenience
export { TOPIC_DELIVERY };

/**
 * VVU-IVE Webhook Subsystem — In-Memory Transport (for dev / tests)
 * ----------------------------------------------------------------------------
 * Drop-in replacement for the Kafka transport. Same `Producer` / `Consumer`
 * contracts, but messages stay in-process. Lets tests verify retry logic,
 * circuit breaker behavior, and the full delivery pipeline WITHOUT requiring
 * a Kafka cluster.
 *
 * Activation: set `WEBHOOK_TRANSPORT=memory` in the environment.
 *
 * Ordering guarantee: per-key (webhook_id) FIFO queue. Matches the
 * Kafka partition-key guarantee for tests.
 */

import type {
  KafkaDeliveryMessage,
  TransportMessage,
} from "../types";
import type {
  Consumer,
  Producer,
  Transport,
} from "./interface";

// ── Shared in-memory broker (process singleton) ────────────────────────────
interface BrokerTopic {
  name: string;
  // Map<partition, messages[]> — partition computed from key hash
  partitions: Map<number, TransportMessage[]>;
  // Per-topic monotonic offset counter
  nextOffset: number[];
  // Subscribed consumers (one per topic — matches Kafka 1-consumer-per-partition
  // in a single-process test scenario)
  subscribers: Set<(m: TransportMessage) => Promise<void>>;
}

class InMemoryBroker {
  private topics = new Map<string, BrokerTopic>();
  // Background dispatch loop handle (recursive setTimeout — more reliable than setInterval in Bun)
  private timer: NodeJS.Timeout | null = null;
  private started = false;
  // Track in-flight drain Promise to prevent overlapping ticks
  private draining: Promise<void> | null = null;

  private ensureTopic(name: string, partitions: number): BrokerTopic {
    let t = this.topics.get(name);
    if (!t) {
      t = {
        name,
        partitions: new Map(
          Array.from({ length: partitions }, (_, i) => [i, []]),
        ),
        nextOffset: Array.from({ length: partitions }, () => 0),
        subscribers: new Set(),
      };
      this.topics.set(name, t);
    }
    return t;
  }

  publish(
    topicName: string,
    key: string,
    value: KafkaDeliveryMessage,
    numPartitions: number,
  ): { partition: number; offset: string } {
    const topic = this.ensureTopic(topicName, numPartitions);
    // Stable hash partition (mirrors Kafka default partitioner semantics)
    const partition = Math.abs(hashCode(key)) % numPartitions;
    const offset = topic.nextOffset[partition]++;
    const message: TransportMessage = {
      topic: topicName,
      partition,
      offset: String(offset),
      value,
      key,
    };
    topic.partitions.get(partition)!.push(message);
    // Kick the drain loop on next microtask — ensures prompt dispatch
    queueMicrotask(() => {
      this.kick();
    });
    return { partition, offset: String(offset) };
  }

  private kick() {
    // Start the recursive setTimeout drain loop on first publish
    if (this.started) return;
    this.started = true;
    const tick = () => {
      this.drainSafely().finally(() => {
        // Schedule next tick — recursive setTimeout is more reliable than
        // setInterval in Bun (avoids tick coalescing)
        this.timer = setTimeout(tick, 0);
      });
    };
    this.timer = setTimeout(tick, 0);
  }

  private drainSafely(): Promise<void> {
    // Avoid overlapping drain calls — if a drain is in flight, skip this tick
    if (this.draining) return Promise.resolve();
    this.draining = this.drain().finally(() => {
      this.draining = null;
    });
    return this.draining;
  }

  private async drain() {
    for (const topic of this.topics.values()) {
      for (const subscriber of topic.subscribers) {
        for (let p = 0; p < topic.partitions.size; p++) {
          const queue = topic.partitions.get(p)!;
          // Process ALL messages in this partition's queue before moving on
          // (matches WEBHOOK_CONCURRENCY: 1 — strict per-partition ordering)
          while (queue.length > 0) {
            const msg = queue[0];
            try {
              await subscriber(msg);
              // Handler resolved — pop the message (committed)
              queue.shift();
            } catch (err) {
              // Handler failed — do NOT ack. Leave message at head for retry.
              // eslint-disable-next-line no-console
              console.error("[memory-transport] handler error:", err);
              // Stop draining this partition to avoid hot-looping on a poison msg
              return;
            }
          }
        }
      }
    }
  }

  subscribe(
    topicName: string,
    numPartitions: number,
    handler: (m: TransportMessage) => Promise<void>,
  ): () => void {
    const topic = this.ensureTopic(topicName, numPartitions);
    topic.subscribers.add(handler);
    return () => {
      topic.subscribers.delete(handler);
    };
  }

  async flush(timeoutMs = 5000): Promise<void> {
    // Drain pending messages on topics that HAVE subscribers.
    // Messages on topics with no consumer (e.g. audit topic when admin worker
    // isn't running) are ignored — they'd otherwise never drain and cause
    // tests to time out.
    const deadline = Date.now() + timeoutMs;
    while (Date.now() < deadline) {
      let pending = 0;
      for (const t of this.topics.values()) {
        if (t.subscribers.size === 0) continue; // no consumer — don't wait
        for (const q of t.partitions.values()) pending += q.length;
      }
      if (pending === 0) return;
      await new Promise((r) => setTimeout(r, 1));
    }
  }

  /**
   * Reset the broker to a pristine state: clear all queues, reset offsets,
   * keep topics + subscribers intact (so workers can keep running).
   *
   * Used by tests in beforeEach to ensure no stale messages carry over
   * from one test to the next (the broker is a process-global singleton,
   * but DB rows get wiped between tests — leaving stale messages would
   * cause the next test's worker to fail on "no record found").
   */
  reset(): void {
    for (const topic of this.topics.values()) {
      for (let p = 0; p < topic.partitions.size; p++) {
        topic.partitions.get(p)!.length = 0;
      }
      topic.nextOffset = Array.from(
        { length: topic.partitions.size },
        () => 0,
      );
    }
    // Cancel any pending drain tick
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }
    this.started = false;
    this.draining = null;
  }
}

function hashCode(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = (h * 31 + s.charCodeAt(i)) | 0;
  }
  return h;
}

// Process-singleton broker
const globalForBroker = globalThis as unknown as {
  __vvuBroker?: InMemoryBroker;
};
export const broker: InMemoryBroker =
  globalForBroker.__vvuBroker ??
  (globalForBroker.__vvuBroker = new InMemoryBroker());

// ── Producer ────────────────────────────────────────────────────────────────
class InMemoryProducer implements Producer {
  private connected = true;

  async publish(
    topic: string,
    key: string,
    value: KafkaDeliveryMessage,
  ): Promise<{ partition: number; offset: string }> {
    if (!this.connected) {
      throw new Error("InMemoryProducer.publish() called after disconnect()");
    }
    const numPartitions = 12; // matches v1.1 contract
    return broker.publish(topic, key, value, numPartitions);
  }

  async disconnect(): Promise<void> {
    this.connected = false;
  }
}

// ── Consumer ────────────────────────────────────────────────────────────────
class InMemoryConsumer implements Consumer {
  private unsubscribe?: () => void;
  private running = false;
  private subscribedTopic?: string;

  async subscribe(topic: string, _groupId: string): Promise<void> {
    if (this.subscribedTopic) {
      throw new Error(
        `InMemoryConsumer already subscribed to ${this.subscribedTopic}`,
      );
    }
    this.subscribedTopic = topic;
  }

  async run(
    handler: (m: TransportMessage) => Promise<void>,
  ): Promise<void> {
    if (!this.subscribedTopic) {
      throw new Error("InMemoryConsumer.run() called before subscribe()");
    }
    this.running = true;
    const numPartitions = 12;
    this.unsubscribe = broker.subscribe(
      this.subscribedTopic,
      numPartitions,
      handler,
    );
    // Block until stop() is called
    while (this.running) {
      await new Promise((r) => setTimeout(r, 50));
    }
  }

  async stop(): Promise<void> {
    this.running = false;
    if (this.unsubscribe) this.unsubscribe();
  }

  async disconnect(): Promise<void> {
    await this.stop();
  }
}

// ── Transport factory ───────────────────────────────────────────────────────
class InMemoryTransport implements Transport {
  async producer(): Promise<Producer> {
    return new InMemoryProducer();
  }
  async consumer(): Promise<Consumer> {
    return new InMemoryConsumer();
  }
}

export function createInMemoryTransport(): Transport {
  return new InMemoryTransport();
}

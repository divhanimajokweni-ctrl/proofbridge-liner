var __defProp = Object.defineProperty;
var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __publicField = (obj, key, value) => __defNormalProp(obj, typeof key !== "symbol" ? key + "" : key, value);
var _a;
class InMemoryBroker {
  constructor() {
    __publicField(this, "topics", /* @__PURE__ */ new Map());
    // Background dispatch loop handle (recursive setTimeout — more reliable than setInterval in Bun)
    __publicField(this, "timer", null);
    __publicField(this, "started", false);
    // Track in-flight drain Promise to prevent overlapping ticks
    __publicField(this, "draining", null);
  }
  ensureTopic(name, partitions) {
    let t = this.topics.get(name);
    if (!t) {
      t = {
        name,
        partitions: new Map(
          Array.from({ length: partitions }, (_, i) => [i, []])
        ),
        nextOffset: Array.from({ length: partitions }, () => 0),
        subscribers: /* @__PURE__ */ new Set()
      };
      this.topics.set(name, t);
    }
    return t;
  }
  publish(topicName, key, value, numPartitions) {
    const topic = this.ensureTopic(topicName, numPartitions);
    const partition = Math.abs(hashCode(key)) % numPartitions;
    const offset = topic.nextOffset[partition]++;
    const message = {
      topic: topicName,
      partition,
      offset: String(offset),
      value,
      key
    };
    topic.partitions.get(partition).push(message);
    queueMicrotask(() => {
      this.kick();
    });
    return { partition, offset: String(offset) };
  }
  kick() {
    if (this.started) return;
    this.started = true;
    const tick = () => {
      this.drainSafely().finally(() => {
        this.timer = setTimeout(tick, 0);
      });
    };
    this.timer = setTimeout(tick, 0);
  }
  drainSafely() {
    if (this.draining) return Promise.resolve();
    this.draining = this.drain().finally(() => {
      this.draining = null;
    });
    return this.draining;
  }
  async drain() {
    for (const topic of this.topics.values()) {
      for (const subscriber of topic.subscribers) {
        for (let p = 0; p < topic.partitions.size; p++) {
          const queue = topic.partitions.get(p);
          while (queue.length > 0) {
            const msg = queue[0];
            try {
              await subscriber(msg);
              queue.shift();
            } catch (err) {
              console.error("[memory-transport] handler error:", err);
              return;
            }
          }
        }
      }
    }
  }
  subscribe(topicName, numPartitions, handler) {
    const topic = this.ensureTopic(topicName, numPartitions);
    topic.subscribers.add(handler);
    return () => {
      topic.subscribers.delete(handler);
    };
  }
  async flush(timeoutMs = 5e3) {
    const deadline = Date.now() + timeoutMs;
    while (Date.now() < deadline) {
      let pending = 0;
      for (const t of this.topics.values()) {
        if (t.subscribers.size === 0) continue;
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
  reset() {
    for (const topic of this.topics.values()) {
      for (let p = 0; p < topic.partitions.size; p++) {
        topic.partitions.get(p).length = 0;
      }
      topic.nextOffset = Array.from(
        { length: topic.partitions.size },
        () => 0
      );
    }
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }
    this.started = false;
    this.draining = null;
  }
}
function hashCode(s) {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = h * 31 + s.charCodeAt(i) | 0;
  }
  return h;
}
const globalForBroker = globalThis;
const broker = (_a = globalForBroker.__vvuBroker) != null ? _a : globalForBroker.__vvuBroker = new InMemoryBroker();
class InMemoryProducer {
  constructor() {
    __publicField(this, "connected", true);
  }
  async publish(topic, key, value) {
    if (!this.connected) {
      throw new Error("InMemoryProducer.publish() called after disconnect()");
    }
    const numPartitions = 12;
    return broker.publish(topic, key, value, numPartitions);
  }
  async disconnect() {
    this.connected = false;
  }
}
class InMemoryConsumer {
  constructor() {
    __publicField(this, "unsubscribe");
    __publicField(this, "running", false);
    __publicField(this, "subscribedTopic");
  }
  async subscribe(topic, _groupId) {
    if (this.subscribedTopic) {
      throw new Error(
        `InMemoryConsumer already subscribed to ${this.subscribedTopic}`
      );
    }
    this.subscribedTopic = topic;
  }
  async run(handler) {
    if (!this.subscribedTopic) {
      throw new Error("InMemoryConsumer.run() called before subscribe()");
    }
    this.running = true;
    const numPartitions = 12;
    this.unsubscribe = broker.subscribe(
      this.subscribedTopic,
      numPartitions,
      handler
    );
    while (this.running) {
      await new Promise((r) => setTimeout(r, 50));
    }
  }
  async stop() {
    this.running = false;
    if (this.unsubscribe) this.unsubscribe();
  }
  async disconnect() {
    await this.stop();
  }
}
class InMemoryTransport {
  async producer() {
    return new InMemoryProducer();
  }
  async consumer() {
    return new InMemoryConsumer();
  }
}
function createInMemoryTransport() {
  return new InMemoryTransport();
}
export {
  broker,
  createInMemoryTransport
};

var __defProp = Object.defineProperty;
var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __publicField = (obj, key, value) => __defNormalProp(obj, typeof key !== "symbol" ? key + "" : key, value);
import { CONSUMER_CONFIG } from "../config";
import { kafka } from "../kafka/client";
import { TOPIC_DELIVERY } from "../kafka/topics";
class KafkaProducer {
  constructor() {
    __publicField(this, "inner");
    __publicField(this, "connected", false);
    const config = {
      // Idempotent producer — prevents duplicates on retry
      // (matches at-least-once + Idempotency-Key strategy).
      // Idempotent requires acks=-1 internally.
      idempotent: true,
      // Wait briefly for in-flight messages on close
      transactionTimeout: 6e4
    };
    this.inner = kafka.producer(config);
  }
  async connect() {
    if (this.connected) return;
    await this.inner.connect();
    this.connected = true;
  }
  async publish(topic, key, value) {
    var _a;
    if (!this.connected) await this.connect();
    const result = await this.inner.send({
      topic,
      // Always send a key — kafkajs hash-partitions by key (default partitioner)
      messages: [{ key, value: JSON.stringify(value) }]
    });
    if (result.length === 0) {
      throw new Error(
        `KafkaProducer.publish() returned no record metadata for topic ${topic}`
      );
    }
    return {
      partition: result[0].partition,
      offset: (_a = result[0].offset) != null ? _a : "0"
    };
  }
  async disconnect() {
    if (this.connected) {
      await this.inner.disconnect();
      this.connected = false;
    }
  }
}
class KafkaConsumer {
  constructor() {
    __publicField(this, "inner");
    __publicField(this, "subscribedTopic");
    __publicField(this, "subscribedGroupId");
    __publicField(this, "connected", false);
    const config = {
      groupId: CONSUMER_CONFIG.GROUP_ID_DELIVERY,
      // overridden in subscribe()
      sessionTimeout: CONSUMER_CONFIG.SESSION_TIMEOUT_MS,
      heartbeatInterval: CONSUMER_CONFIG.HEARTBEAT_INTERVAL_MS,
      rebalanceTimeout: CONSUMER_CONFIG.MAX_POLL_INTERVAL_MS,
      // Mandatory: do NOT auto-commit offsets. Manual commit only.
      // This implements "exactly-once-ish" semantics — the offset advances
      // only after the handler succeeds, so a crash mid-handling re-delivers.
      allowAutoCommit: CONSUMER_CONFIG.ENABLE_AUTO_COMMIT
    };
    this.inner = kafka.consumer(config);
  }
  async subscribe(topic, groupId) {
    if (!this.connected) {
      await this.inner.connect();
      this.connected = true;
    }
    this.subscribedTopic = topic;
    this.subscribedGroupId = groupId;
    await this.inner.subscribe({
      topic,
      fromBeginning: CONSUMER_CONFIG.AUTO_OFFSET_RESET === "earliest"
    });
  }
  async run(handler) {
    if (!this.subscribedTopic) {
      throw new Error("KafkaConsumer.run() called before subscribe()");
    }
    await this.inner.run({
      // Each partition processed sequentially by a single consumer
      // (kafkajs guarantee — matches WEBHOOK_CONCURRENCY: 1)
      eachMessage: async ({ message, topic, partition }) => {
        var _a;
        if (!message.value) {
          throw new Error(
            `KafkaConsumer received empty message on topic=${topic} partition=${partition} offset=${message.offset}`
          );
        }
        const value = JSON.parse(
          message.value.toString("utf-8")
        );
        const transportMessage = {
          topic,
          partition,
          offset: message.offset,
          value,
          key: (_a = message.key) == null ? void 0 : _a.toString("utf-8")
        };
        await handler(transportMessage);
      }
    });
  }
  async stop() {
    await this.inner.stop();
  }
  async disconnect() {
    if (this.connected) {
      await this.inner.disconnect();
      this.connected = false;
    }
  }
}
function createKafkaConsumer(groupId) {
  const config = {
    groupId,
    sessionTimeout: CONSUMER_CONFIG.SESSION_TIMEOUT_MS,
    heartbeatInterval: CONSUMER_CONFIG.HEARTBEAT_INTERVAL_MS,
    rebalanceTimeout: CONSUMER_CONFIG.MAX_POLL_INTERVAL_MS,
    allowAutoCommit: CONSUMER_CONFIG.ENABLE_AUTO_COMMIT
  };
  const inner = kafka.consumer(config);
  const consumer = Object.create(KafkaConsumer.prototype);
  consumer.inner = inner;
  consumer.subscribedTopic = void 0;
  consumer.subscribedGroupId = groupId;
  consumer.connected = false;
  return consumer;
}
class KafkaTransport {
  constructor(consumerGroupId = CONSUMER_CONFIG.GROUP_ID_DELIVERY) {
    __publicField(this, "producerInstance", null);
    __publicField(this, "consumerGroupId");
    this.consumerGroupId = consumerGroupId;
  }
  async producer() {
    if (!this.producerInstance) {
      this.producerInstance = new KafkaProducer();
      await this.producerInstance.connect();
    }
    return this.producerInstance;
  }
  async consumer() {
    return createKafkaConsumer(this.consumerGroupId);
  }
}
function createKafkaTransport(consumerGroupId = CONSUMER_CONFIG.GROUP_ID_DELIVERY) {
  return new KafkaTransport(consumerGroupId);
}
export {
  TOPIC_DELIVERY,
  createKafkaConsumer,
  createKafkaTransport
};

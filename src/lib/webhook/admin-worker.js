var __defProp = Object.defineProperty;
var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __publicField = (obj, key, value) => __defNormalProp(obj, typeof key !== "symbol" ? key + "" : key, value);
import { db } from "@/lib/db";
import { TOPIC_AUDIT } from "./kafka/topics";
import { getTransport } from "./transport/factory";
import { CONSUMER_CONFIG } from "./config";
class AdminWorker {
  constructor(opts = {}) {
    __publicField(this, "consumer", null);
    __publicField(this, "running", false);
    __publicField(this, "opts");
    var _a, _b, _c;
    this.opts = {
      groupId: (_a = opts.groupId) != null ? _a : CONSUMER_CONFIG.GROUP_ID_ADMIN,
      topic: (_b = opts.topic) != null ? _b : TOPIC_AUDIT,
      consumerOverride: (_c = opts.consumerOverride) != null ? _c : void 0
    };
  }
  async start() {
    if (this.running) return;
    this.running = true;
    if (this.opts.consumerOverride) {
      this.consumer = this.opts.consumerOverride;
    } else {
      const transport = await getTransport(this.opts.groupId);
      this.consumer = await transport.consumer();
    }
    await this.consumer.subscribe(this.opts.topic, this.opts.groupId);
    this.consumer.run(this.handle.bind(this)).catch((err) => {
      console.error("[admin-worker] consumer run failed:", err);
      this.running = false;
    });
  }
  async stop() {
    this.running = false;
    if (this.consumer) await this.consumer.stop();
  }
  isRunning() {
    return this.running;
  }
  async handle(message) {
    var _a, _b;
    const msg = message.value;
    let details;
    try {
      details = JSON.parse(msg.payload);
    } catch (e) {
      details = { raw: msg.payload };
    }
    const type = (_a = details.type) != null ? _a : "delivery_attempted";
    const existing = await db.auditEvent.findFirst({
      where: {
        type,
        deliveryId: msg.deliveryId
      },
      orderBy: { createdAt: "desc" }
    });
    if (existing) {
      return;
    }
    await db.auditEvent.create({
      data: {
        type,
        webhookId: msg.webhookId,
        deliveryId: msg.deliveryId,
        attemptId: (_b = details.attemptId) != null ? _b : "",
        details: JSON.stringify(details)
      }
    });
  }
}
export {
  AdminWorker
};

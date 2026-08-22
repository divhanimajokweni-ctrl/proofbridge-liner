var __defProp = Object.defineProperty;
var __getOwnPropSymbols = Object.getOwnPropertySymbols;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __propIsEnum = Object.prototype.propertyIsEnumerable;
var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __spreadValues = (a, b) => {
  for (var prop in b || (b = {}))
    if (__hasOwnProp.call(b, prop))
      __defNormalProp(a, prop, b[prop]);
  if (__getOwnPropSymbols)
    for (var prop of __getOwnPropSymbols(b)) {
      if (__propIsEnum.call(b, prop))
        __defNormalProp(a, prop, b[prop]);
    }
  return a;
};
var __publicField = (obj, key, value) => __defNormalProp(obj, typeof key !== "symbol" ? key + "" : key, value);
import { db } from "@/lib/db";
import { RETRY_CONFIG } from "./config";
import { TOPIC_DELIVERY, TOPIC_AUDIT } from "./kafka/topics";
import { checkBreaker, recordResult } from "./circuit-breaker";
import {
  computeDelayMs,
  getMaxAttempts,
  shouldRetry
} from "./retry";
import { chargeRetry, recordInitialAttempt } from "./retry-budget";
import { deliverOnce } from "./deliver";
import { sendToDLQ } from "./dlq";
import { getTransport } from "./transport/factory";
import { CONSUMER_CONFIG } from "./config";
class WebhookWorker {
  constructor(opts = {}) {
    __publicField(this, "consumer", null);
    __publicField(this, "producer", null);
    __publicField(this, "running", false);
    __publicField(this, "opts");
    var _a, _b, _c, _d;
    this.opts = {
      groupId: (_a = opts.groupId) != null ? _a : CONSUMER_CONFIG.GROUP_ID_DELIVERY,
      topic: (_b = opts.topic) != null ? _b : TOPIC_DELIVERY,
      fetchImpl: (_c = opts.fetchImpl) != null ? _c : fetch,
      transport: (_d = opts.transport) != null ? _d : { consumer: void 0, producer: void 0 }
    };
  }
  async start() {
    if (this.running) return;
    this.running = true;
    if (this.opts.transport.consumer && this.opts.transport.producer) {
      this.consumer = this.opts.transport.consumer;
      this.producer = this.opts.transport.producer;
    } else {
      const transport = await getTransport(this.opts.groupId);
      this.consumer = await transport.consumer();
      this.producer = await transport.producer();
    }
    await this.consumer.subscribe(this.opts.topic, this.opts.groupId);
    this.consumer.run(this.handle.bind(this)).catch((err) => {
      console.error("[webhook-worker] consumer run failed:", err);
      this.running = false;
    });
  }
  async stop() {
    this.running = false;
    if (this.consumer) await this.consumer.stop();
    if (this.producer) await this.producer.disconnect();
  }
  /**
   * Message handler. Throws on error → offset NOT committed (message redelivered).
   * Resolves → offset committed (message acknowledged).
   *
   * Critical: This function MUST complete (success or DLQ) before resolving.
   * If it throws, the message is redelivered — which is fine for retries
   * because we use idempotency-key dedup at the receiver.
   */
  async handle(message) {
    var _a, _b, _c;
    const msg = message.value;
    const { deliveryId, webhookId, eventId, payload } = msg;
    const webhookRow = await db.webhook.findUnique({
      where: { id: webhookId }
    });
    if (!webhookRow || !webhookRow.enabled) {
      await this.audit("delivery_skipped", webhookId, deliveryId, "", {
        reason: webhookRow ? "WEBHOOK_DISABLED" : "WEBHOOK_NOT_FOUND"
      });
      return;
    }
    const webhook = {
      id: webhookRow.id,
      name: webhookRow.name,
      url: webhookRow.url,
      type: webhookRow.type,
      secret: webhookRow.secret,
      nextSecret: (_a = webhookRow.nextSecret) != null ? _a : "",
      enabled: webhookRow.enabled,
      createdAt: webhookRow.createdAt,
      updatedAt: webhookRow.updatedAt
    };
    await db.webhookDelivery.update({
      where: { id: deliveryId },
      data: {
        status: "IN_FLIGHT",
        statusReason: "",
        kafkaPartition: message.partition,
        kafkaOffset: Number(message.offset),
        updatedAt: /* @__PURE__ */ new Date()
      }
    });
    const cbCheck = await checkBreaker(webhookId);
    if (cbCheck.decision === "SKIP") {
      await sendToDLQ({
        deliveryId,
        webhookId,
        eventId,
        payload,
        reason: "circuit_breaker_open_skipped",
        finalHttpStatus: 0,
        producer: (_b = this.producer) != null ? _b : void 0
      });
      await db.webhookDelivery.update({
        where: { id: deliveryId },
        data: {
          status: "SKIPPED",
          statusReason: cbCheck.reason,
          updatedAt: /* @__PURE__ */ new Date()
        }
      });
      await this.audit("delivery_skipped", webhookId, deliveryId, "", {
        reason: cbCheck.reason,
        cbState: cbCheck.currentState
      });
      return;
    }
    const isProbe = cbCheck.isHalfOpenProbe;
    let attemptNumber = 0;
    let lastOutcome = "connection_failure";
    let lastHttpStatus = 0;
    let lastResponseBody = "";
    let terminalReason = null;
    while (attemptNumber < getMaxAttempts()) {
      attemptNumber++;
      const preDelay = attemptNumber === 1 ? 0 : computeDelayMs(attemptNumber - 2);
      if (preDelay > 0) {
        const ok = await chargeRetry();
        if (!ok) {
          terminalReason = "exhausted_retries";
          lastOutcome = "connection_failure";
          break;
        }
        await sleep(preDelay);
      } else if (attemptNumber === 1) {
        await recordInitialAttempt();
      }
      const result = await deliverOnce({
        webhook,
        deliveryId,
        payload,
        fetchImpl: this.opts.fetchImpl
      });
      lastOutcome = result.outcome;
      lastHttpStatus = result.httpStatus;
      lastResponseBody = result.responseBody;
      const attemptRow = await db.webhookDeliveryAttempt.create({
        data: {
          deliveryId,
          attemptNumber,
          httpStatus: result.httpStatus,
          outcome: result.outcome,
          responseBody: result.responseBody,
          delayMs: preDelay,
          startedAt: new Date(Date.now() - (preDelay + RETRY_CONFIG.ATTEMPT_TIMEOUT_MS)),
          finishedAt: /* @__PURE__ */ new Date()
        }
      });
      await this.audit(
        "delivery_attempted",
        webhookId,
        deliveryId,
        attemptRow.id,
        {
          attemptNumber,
          httpStatus: result.httpStatus,
          outcome: result.outcome,
          isHalfOpenProbe: isProbe
        }
      );
      if (result.outcome === "success") {
        await db.webhookDelivery.update({
          where: { id: deliveryId },
          data: {
            status: "DELIVERED",
            statusReason: "",
            updatedAt: /* @__PURE__ */ new Date()
          }
        });
        await recordResult(webhookId, isProbe, false);
        await this.audit("delivery_succeeded", webhookId, deliveryId, attemptRow.id, {
          attemptNumber
        });
        return;
      }
      if (result.outcome === "non_retryable") {
        terminalReason = "non_retryable_error";
        break;
      }
      if (!shouldRetry(attemptNumber, result.outcome)) {
        terminalReason = "exhausted_retries";
        break;
      }
      if (result.retryAfterMs && result.retryAfterMs > 0) {
        await sleep(result.retryAfterMs);
      }
    }
    if (terminalReason === "exhausted_retries") {
      await recordResult(webhookId, isProbe, true);
    } else if (isProbe) {
      await recordResult(webhookId, isProbe, true);
    }
    const dlqReason = terminalReason === "non_retryable_error" ? "non_retryable_error" : "exhausted_retries";
    await sendToDLQ({
      deliveryId,
      webhookId,
      eventId,
      payload,
      reason: dlqReason,
      finalHttpStatus: lastHttpStatus,
      producer: (_c = this.producer) != null ? _c : void 0
    });
    await db.webhookDelivery.update({
      where: { id: deliveryId },
      data: {
        status: "DLQ",
        statusReason: terminalReason != null ? terminalReason : "exhausted_retries",
        updatedAt: /* @__PURE__ */ new Date()
      }
    });
    await this.audit("delivery_dlq", webhookId, deliveryId, "", {
      reason: dlqReason,
      finalHttpStatus: lastHttpStatus,
      attempts: attemptNumber
    });
  }
  /**
   * Publish an audit event. Best-effort — failures don't block delivery.
   * Mirrors what admin workers consume from `vvu-webhook-audit`.
   */
  async audit(type, webhookId, deliveryId, attemptId, details) {
    try {
      await db.auditEvent.create({
        data: {
          type,
          webhookId,
          deliveryId,
          attemptId,
          details: JSON.stringify(details)
        }
      });
      if (this.producer) {
        await this.producer.publish(TOPIC_AUDIT, webhookId, {
          deliveryId,
          webhookId,
          eventId: deliveryId,
          // reuse for audit
          payload: JSON.stringify(__spreadValues({ type }, details))
        }).catch(() => {
        });
      }
    } catch (err) {
      console.error("[webhook-worker] audit failure (non-fatal):", err);
    }
  }
  isRunning() {
    return this.running;
  }
}
function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}
export {
  WebhookWorker
};

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
import { db } from "@/lib/db";
import { TOPIC_DELIVERY } from "./kafka/topics";
import { getTransport } from "./transport/factory";
async function createWebhook(params) {
  var _a, _b, _c;
  const existing = await db.webhook.findFirst({
    where: { name: params.name, url: params.url }
  });
  if (existing) {
    return rowToRecord(existing);
  }
  const row = await db.webhook.create({
    data: {
      name: params.name,
      url: params.url,
      type: (_a = params.type) != null ? _a : "custom",
      secret: (_b = params.secret) != null ? _b : "",
      nextSecret: "",
      enabled: (_c = params.enabled) != null ? _c : true
    }
  });
  return rowToRecord(row);
}
async function listWebhooks() {
  const rows = await db.webhook.findMany({
    orderBy: { createdAt: "asc" }
  });
  return rows.map(rowToRecord);
}
async function setWebhookEnabled(webhookId, enabled) {
  await db.webhook.update({
    where: { id: webhookId },
    data: { enabled }
  });
}
async function publishDelivery(params) {
  const { webhookId, eventId, payload, producerOverride, replayedBy } = params;
  const webhook = await db.webhook.findUnique({ where: { id: webhookId } });
  if (!webhook) {
    throw new Error(`Webhook not found: ${webhookId}`);
  }
  const payloadStr = JSON.stringify(payload);
  const delivery = await db.webhookDelivery.create({
    data: {
      webhookId,
      eventId,
      payload: payloadStr,
      status: "PENDING",
      statusReason: ""
    }
  });
  const producer = producerOverride != null ? producerOverride : await (await getTransport()).producer();
  const kafkaMessage = __spreadValues({
    deliveryId: delivery.id,
    webhookId,
    eventId,
    payload: payloadStr
  }, replayedBy ? { replayedBy } : {});
  const { partition, offset } = await producer.publish(
    TOPIC_DELIVERY,
    webhookId,
    // partition key = webhook_id (per Pillar 1)
    kafkaMessage
  );
  await db.webhookDelivery.update({
    where: { id: delivery.id },
    data: {
      kafkaPartition: partition,
      kafkaOffset: Number(offset),
      updatedAt: /* @__PURE__ */ new Date()
    }
  });
  if (!producerOverride) {
    await producer.disconnect().catch(() => {
    });
  }
  return {
    deliveryId: delivery.id,
    kafkaPartition: partition,
    kafkaOffset: offset
  };
}
async function publishReplay(params) {
  const {
    deliveryId,
    webhookId,
    eventId,
    payload,
    replayedBy,
    producerOverride
  } = params;
  const producer = producerOverride != null ? producerOverride : await (await getTransport()).producer();
  const kafkaMessage = {
    deliveryId,
    // ← THE EXISTING delivery_id, preserved for idempotency
    webhookId,
    eventId,
    payload,
    replayedBy
  };
  const { partition, offset } = await producer.publish(
    TOPIC_DELIVERY,
    webhookId,
    // partition key = webhook_id (per Pillar 1)
    kafkaMessage
  );
  await db.webhookDelivery.update({
    where: { id: deliveryId },
    data: {
      kafkaPartition: partition,
      kafkaOffset: Number(offset),
      updatedAt: /* @__PURE__ */ new Date()
    }
  });
  if (!producerOverride) {
    await producer.disconnect().catch(() => {
    });
  }
  return {
    deliveryId,
    kafkaPartition: partition,
    kafkaOffset: offset
  };
}
function rowToRecord(row) {
  var _a;
  return {
    id: row.id,
    name: row.name,
    url: row.url,
    type: row.type,
    secret: row.secret,
    nextSecret: (_a = row.nextSecret) != null ? _a : "",
    enabled: row.enabled,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt
  };
}
export {
  createWebhook,
  listWebhooks,
  publishDelivery,
  publishReplay,
  setWebhookEnabled
};

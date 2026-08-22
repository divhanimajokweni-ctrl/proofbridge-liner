var __defProp = Object.defineProperty;
var __defProps = Object.defineProperties;
var __getOwnPropDescs = Object.getOwnPropertyDescriptors;
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
var __spreadProps = (a, b) => __defProps(a, __getOwnPropDescs(b));
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { setWebhookEnabled } from "@/lib/webhook/publish";
import { getBreakerState } from "@/lib/webhook/circuit-breaker";
async function GET(_req, ctx) {
  const { id } = await ctx.params;
  const webhook = await db.webhook.findUnique({ where: { id } });
  if (!webhook) {
    return NextResponse.json({ error: "Webhook not found" }, { status: 404 });
  }
  const cbState = await getBreakerState(id);
  const stats = await db.webhookDelivery.groupBy({
    by: ["status"],
    where: { webhookId: id },
    _count: true
  });
  return NextResponse.json({
    webhook,
    circuitBreaker: cbState != null ? cbState : { state: "CLOSED", terminalFailureCount: 0 },
    deliveryStats: stats.reduce(
      (acc, s) => __spreadProps(__spreadValues({}, acc), { [s.status]: s._count }),
      {}
    )
  });
}
async function PATCH(req, ctx) {
  const { id } = await ctx.params;
  const body = await req.json().catch(() => ({}));
  if (typeof body.enabled !== "boolean") {
    return NextResponse.json(
      { error: "PATCH body must include { enabled: boolean }" },
      { status: 400 }
    );
  }
  try {
    await setWebhookEnabled(id, body.enabled);
    return NextResponse.json({ id, enabled: body.enabled });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Unknown" },
      { status: 500 }
    );
  }
}

export const runtime = "nodejs";
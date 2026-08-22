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
async function GET(_req, { params }) {
  const { id } = await params;
  const claim = await db.claim.findUnique({
    where: { id },
    include: {
      evidence: { orderBy: { collectedAt: "asc" } },
      authorizations: { orderBy: { createdAt: "desc" } },
      circuitEvents: { orderBy: { trippedAt: "desc" } },
      nIndRecords: { orderBy: { createdAt: "desc" } }
    }
  });
  if (!claim) {
    return NextResponse.json({ error: "claim not found" }, { status: 404 });
  }
  const result = __spreadProps(__spreadValues({}, claim), {
    claimType: claim.claimType,
    state: claim.state,
    evidence: claim.evidence.map((e) => __spreadProps(__spreadValues({}, e), {
      source: e.source,
      state: e.state,
      embedding: JSON.parse(e.embedding)
    })),
    nIndRecords: claim.nIndRecords.map((n) => __spreadProps(__spreadValues({}, n), {
      eigenvalues: JSON.parse(n.eigenvalues)
    }))
  });
  return NextResponse.json({ claim: result });
}
async function PATCH(req, { params }) {
  const { id } = await params;
  const body = await req.json();
  const { state, safetyCritical, intendedAction, claimType } = body;
  const claim = await db.claim.update({
    where: { id },
    data: __spreadValues(__spreadValues(__spreadValues(__spreadValues({}, state !== void 0 && { state }), safetyCritical !== void 0 && { safetyCritical: Boolean(safetyCritical) }), intendedAction !== void 0 && { intendedAction }), claimType !== void 0 && { claimType })
  });
  return NextResponse.json({ claim });
}
async function DELETE(_req, { params }) {
  const { id } = await params;
  await db.claim.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}

export const dynamic = "force-dynamic";
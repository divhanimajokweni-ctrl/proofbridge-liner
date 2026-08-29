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
async function GET() {
  const claims = await db.claim.findMany({
    include: {
      evidence: { orderBy: { collectedAt: "asc" } },
      authorizations: { orderBy: { createdAt: "desc" } },
      circuitEvents: { orderBy: { trippedAt: "desc" } },
      nIndRecords: { orderBy: { createdAt: "desc" } }
    },
    orderBy: { createdAt: "desc" }
  });
  const result = claims.map((c) => __spreadProps(__spreadValues({}, c), {
    claimType: c.claimType,
    state: c.state,
    evidence: c.evidence.map((e) => __spreadProps(__spreadValues({}, e), {
      source: e.source,
      state: e.state,
      embedding: JSON.parse(e.embedding)
    })),
    nIndRecords: c.nIndRecords.map((n) => __spreadProps(__spreadValues({}, n), {
      eigenvalues: JSON.parse(n.eigenvalues)
    }))
  }));
  return NextResponse.json({ claims: result });
}
async function POST(req) {
  const body = await req.json();
  const {
    title,
    description,
    claimType = "empirical",
    intendedAction = "deploy",
    safetyCritical = true
  } = body;
  if (!title) {
    return NextResponse.json(
      { error: "title is required" },
      { status: 400 }
    );
  }
  const claim = await db.claim.create({
    data: {
      title,
      description: description != null ? description : "",
      claimType,
      intendedAction,
      safetyCritical: Boolean(safetyCritical),
      state: "UNTESTED"
    }
  });
  return NextResponse.json({ claim });
}

export const dynamic = "force-dynamic";
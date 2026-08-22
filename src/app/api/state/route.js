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
  var _a;
  const claims = await db.claim.findMany({
    include: {
      evidence: { orderBy: { collectedAt: "asc" } },
      authorizations: { orderBy: { createdAt: "desc" }, take: 5 },
      circuitEvents: { orderBy: { trippedAt: "desc" }, take: 5 },
      nIndRecords: { orderBy: { createdAt: "desc" }, take: 3 }
    },
    orderBy: { createdAt: "desc" }
  });
  const mapped = claims.map((c) => __spreadProps(__spreadValues({}, c), {
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
  const totalClaims = claims.length;
  const authorizedClaims = claims.filter(
    (c) => c.authorizations.some((a) => a.authorized)
  ).length;
  const breakerTripped = claims.filter(
    (c) => c.circuitEvents.some((e) => e.triggered)
  ).length;
  const totalEvidence = claims.reduce((s, c) => s + c.evidence.length, 0);
  const stateCounts = {};
  for (const c of claims) {
    stateCounts[c.state] = ((_a = stateCounts[c.state]) != null ? _a : 0) + 1;
  }
  return NextResponse.json({
    claims: mapped,
    summary: {
      totalClaims,
      authorizedClaims,
      breakerTripped,
      totalEvidence,
      stateCounts,
      evidenceBound: "Claim \u2264 Evidence \u2264 Verification \u2264 Authorization \u2264 Action",
      authorizationFormula: "A = C \u2227 E \u2227 I \u2227 S \u2227 R",
      failClosed: true
    }
  });
}

export const dynamic = "force-dynamic";
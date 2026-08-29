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
import { computeParticipationRatio } from "@/lib/eis";
async function POST(req) {
  const body = await req.json();
  const { claimId, gamma } = body;
  if (!claimId) {
    return NextResponse.json({ error: "claimId is required" }, { status: 400 });
  }
  const claim = await db.claim.findUnique({
    where: { id: claimId },
    include: { evidence: true }
  });
  if (!claim) {
    return NextResponse.json({ error: "claim not found" }, { status: 404 });
  }
  const embeddings = claim.evidence.map((e) => JSON.parse(e.embedding));
  const result = computeParticipationRatio(embeddings, gamma);
  const record = await db.nIndComputation.create({
    data: {
      claimId,
      numEvidence: result.numEvidence,
      numSources: result.numSources,
      nInd: result.nInd,
      gamma: result.gamma,
      eigenvalues: JSON.stringify(result.eigenvalues)
    }
  });
  return NextResponse.json(__spreadProps(__spreadValues({}, result), {
    id: record.id,
    claimId,
    createdAt: record.createdAt
  }));
}
async function GET(req) {
  const claimId = req.nextUrl.searchParams.get("claimId");
  if (!claimId) {
    return NextResponse.json({ error: "claimId query param required" }, { status: 400 });
  }
  const records = await db.nIndComputation.findMany({
    where: { claimId },
    orderBy: { createdAt: "desc" }
  });
  const result = records.map((r) => __spreadProps(__spreadValues({}, r), {
    eigenvalues: JSON.parse(r.eigenvalues)
  }));
  return NextResponse.json({ records: result });
}

export const dynamic = "force-dynamic";
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
import {
  evaluateAuthorization,
  computeParticipationRatio,
  recomputeClaimState
} from "@/lib/eis";
async function POST(req) {
  const body = await req.json();
  const { claimId, safetyOverride, reviewSignedOff } = body;
  if (!claimId) {
    return NextResponse.json({ error: "claimId is required" }, { status: 400 });
  }
  const claim = await db.claim.findUnique({
    where: { id: claimId },
    include: { evidence: true, nIndRecords: { orderBy: { createdAt: "desc" }, take: 1 } }
  });
  if (!claim) {
    return NextResponse.json({ error: "claim not found" }, { status: 404 });
  }
  const evidence = claim.evidence.map((e) => __spreadProps(__spreadValues({}, e), {
    source: e.source,
    state: e.state,
    embedding: JSON.parse(e.embedding)
  }));
  const recomputedState = recomputeClaimState(
    claim.claimType,
    evidence
  );
  if (recomputedState !== claim.state) {
    await db.claim.update({
      where: { id: claimId },
      data: { state: recomputedState }
    });
  }
  let nIndResult = claim.nIndRecords[0];
  if (!nIndResult || evidence.length === 0) {
    const embeddings = evidence.map((e) => e.embedding);
    const computed = computeParticipationRatio(embeddings);
    nIndResult = await db.nIndComputation.create({
      data: {
        claimId,
        numEvidence: computed.numEvidence,
        numSources: computed.numSources,
        nInd: computed.nInd,
        gamma: computed.gamma,
        eigenvalues: JSON.stringify(computed.eigenvalues)
      }
    });
  }
  const nInd = {
    nInd: nIndResult.nInd,
    numEvidence: nIndResult.numEvidence,
    numSources: nIndResult.numSources,
    gamma: nIndResult.gamma,
    eigenvalues: JSON.parse(nIndResult.eigenvalues)
  };
  const auth = evaluateAuthorization({
    claimType: claim.claimType,
    claimState: recomputedState,
    evidence,
    nInd,
    safetyCritical: claim.safetyCritical,
    safetyOverride: safetyOverride != null ? safetyOverride : false,
    reviewSignedOff: reviewSignedOff != null ? reviewSignedOff : false
  });
  const record = await db.authorization.create({
    data: {
      claimId,
      claimOk: auth.claimOk,
      evidenceOk: auth.evidenceOk,
      integrityOk: auth.integrityOk,
      safetyOk: auth.safetyOk,
      reviewOk: auth.reviewOk,
      authorized: auth.authorized,
      reason: auth.reason
    }
  });
  return NextResponse.json(__spreadProps(__spreadValues({}, auth), {
    id: record.id,
    claimId,
    claimState: recomputedState,
    nInd,
    createdAt: record.createdAt
  }));
}

export const dynamic = "force-dynamic";
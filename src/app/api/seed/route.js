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
  computeClaimState,
  computeParticipationRatio,
  evaluateAuthorization,
  queryEvidenceMesh
} from "@/lib/eis";
const SEED_CLAIMS = [
  {
    title: "GPT-5 model output meets accuracy SLA",
    description: "The deployed GPT-5 model achieves \u2265 95% accuracy on the internal benchmark suite across 1000 sampled invocations. Required for production traffic authorization. Two sources carry SUPPORTED evidence (deep-scraped authoritative text + operational telemetry), so the IVE lifts the claim to SUPPORTED. With safety+review signoff, A evaluates true.",
    claimType: "empirical",
    intendedAction: "deploy to production",
    safetyCritical: true,
    sourceStates: {
      firecrawl: "SUPPORTED",
      // deep-scraped authoritative source
      watchdog: "SUPPORTED",
      // operational telemetry confirms
      brave: "OBSERVED"
      // weaker search-result evidence
    }
  },
  {
    title: "Riemann Hypothesis is decidable in ZFC",
    description: "Mathematical claim about the decidability of the Riemann Hypothesis within ZFC set theory. Demonstrates EIS claim-type cap: only mathematical claims can reach PROVEN, but evidence from the Mesh is only OBSERVED (no mathematical proof), so the actual state stays at OBSERVED and authorization fails on C conjunct.",
    claimType: "mathematical",
    intendedAction: "publish theorem",
    safetyCritical: false,
    sourceStates: {
      "you.com": "OBSERVED",
      brave: "OBSERVED"
    }
  },
  {
    title: "Edge latency under 50ms p99",
    description: "Operational claim about edge-node response latency. Demonstrates the operational claim-type cap (max state OBSERVED) and fail-closed behavior when evidence is thin: only 1 watchdog source, N_ind = 1 (below the safety-critical threshold of 2), so I + S + R all fail.",
    claimType: "operational",
    intendedAction: "expand edge footprint",
    safetyCritical: true,
    sourceStates: {
      watchdog: "OBSERVED"
    }
  }
];
async function POST() {
  var _a, _b;
  await db.heatKernelStep.deleteMany();
  await db.circuitBreaker.deleteMany();
  await db.authorization.deleteMany();
  await db.nIndComputation.deleteMany();
  await db.evidence.deleteMany();
  await db.claim.deleteMany();
  const created = [];
  for (let i = 0; i < SEED_CLAIMS.length; i++) {
    const spec = SEED_CLAIMS[i];
    const claim = await db.claim.create({
      data: {
        title: spec.title,
        description: spec.description,
        claimType: spec.claimType,
        intendedAction: spec.intendedAction,
        safetyCritical: spec.safetyCritical,
        state: "UNTESTED"
      }
    });
    const meshResults = queryEvidenceMesh(
      { claimId: claim.id, query: claim.title, sources: (_b = spec.evidenceSubset) != null ? _b : Object.keys((_a = spec.sourceStates) != null ? _a : {}) },
      100 + i * 17
    );
    const evidenceItems = await Promise.all(
      meshResults.map(async (r) => {
        var _a2, _b2;
        const stateOverride = (_b2 = (_a2 = spec.sourceStates) == null ? void 0 : _a2[r.source]) != null ? _b2 : "OBSERVED";
        return db.evidence.create({
          data: {
            claimId: claim.id,
            source: r.source,
            content: r.content,
            embedding: JSON.stringify(r.embedding),
            weight: r.weight,
            state: stateOverride
          }
        });
      })
    );
    const newState = computeClaimState(
      spec.claimType,
      evidenceItems.map((e) => e.state)
    );
    await db.claim.update({
      where: { id: claim.id },
      data: { state: newState }
    });
    const embeddings = meshResults.map((r) => r.embedding);
    const nIndResult = computeParticipationRatio(embeddings);
    const nIndRecord = await db.nIndComputation.create({
      data: {
        claimId: claim.id,
        numEvidence: nIndResult.numEvidence,
        numSources: nIndResult.numSources,
        nInd: nIndResult.nInd,
        gamma: nIndResult.gamma,
        eigenvalues: JSON.stringify(nIndResult.eigenvalues)
      }
    });
    const auth = evaluateAuthorization({
      claimType: spec.claimType,
      claimState: newState,
      evidence: evidenceItems.map((e) => __spreadProps(__spreadValues({}, e), {
        source: e.source,
        state: e.state,
        embedding: JSON.parse(e.embedding)
      })),
      nInd: nIndResult,
      safetyCritical: spec.safetyCritical,
      safetyOverride: false,
      reviewSignedOff: false
    });
    const authRecord = await db.authorization.create({
      data: {
        claimId: claim.id,
        claimOk: auth.claimOk,
        evidenceOk: auth.evidenceOk,
        integrityOk: auth.integrityOk,
        safetyOk: auth.safetyOk,
        reviewOk: auth.reviewOk,
        authorized: auth.authorized,
        reason: auth.reason
      }
    });
    created.push({
      claim: __spreadProps(__spreadValues({}, claim), { state: newState }),
      evidenceCount: evidenceItems.length,
      nInd: nIndResult,
      authorization: auth
    });
  }
  return NextResponse.json({
    seeded: true,
    count: created.length,
    items: created
  });
}

export const dynamic = "force-dynamic";
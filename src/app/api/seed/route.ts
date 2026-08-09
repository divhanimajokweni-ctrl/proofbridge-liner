/**
 * IVE API — Seed
 *
 * POST /api/seed
 *
 * Seeds the database with three demonstration claims that exercise the full
 * VVU stack:
 *
 *   1. "GPT-5 model output meets accuracy SLA" — empirical, safety-critical
 *      Starts UNTESTED, then ingests Mesh evidence, runs verify + authorize.
 *      Should reach SUPPORTED state but block authorization on safety/review.
 *
 *   2. "Riemann Hypothesis is decidable in ZFC" — mathematical
 *      Will be capped at PROVEN by claim-type, but evidence is OBSERVED so
 *      actual state is OBSERVED. Demonstrates EIS enforcement (Step 3).
 *
 *   3. "Edge latency under 50ms p99" — operational
 *      Low-confidence claim — should reach OBSERVED and fail authorization.
 *
 * The seed is idempotent: it wipes the user's claims first.
 * Requires authentication — assigns userId to all seeded claims.
 */

import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import {
  ClaimType,
  EvidenceSource,
  VerificationState,
  computeClaimState,
  computeParticipationRatio,
  evaluateAuthorization,
  queryEvidenceMesh,
  recomputeClaimState,
} from "@/lib/eis";
import { requireAuth } from "@/lib/auth-guard";

export const dynamic = "force-dynamic";

interface SeedSpec {
  title: string;
  description: string;
  claimType: ClaimType;
  intendedAction: string;
  safetyCritical: boolean;
  // Per-source evidence state override. Default: OBSERVED.
  sourceStates?: Partial<Record<EvidenceSource, VerificationState>>;
}

const SEED_CLAIMS: SeedSpec[] = [
  {
    title: "GPT-5 model output meets accuracy SLA",
    description:
      "The deployed GPT-5 model achieves ≥ 95% accuracy on the internal benchmark suite across 1000 sampled invocations. Required for production traffic authorization. Two sources carry SUPPORTED evidence (deep-scraped authoritative text + operational telemetry), so the IVE lifts the claim to SUPPORTED. With safety+review signoff, A evaluates true.",
    claimType: "empirical",
    intendedAction: "deploy to production",
    safetyCritical: true,
    sourceStates: {
      firecrawl: "SUPPORTED", // deep-scraped authoritative source
      watchdog: "SUPPORTED",   // operational telemetry confirms
      brave: "OBSERVED",       // weaker search-result evidence
    },
  },
  {
    title: "Riemann Hypothesis is decidable in ZFC",
    description:
      "Mathematical claim about the decidability of the Riemann Hypothesis within ZFC set theory. Demonstrates EIS claim-type cap: only mathematical claims can reach PROVEN, but evidence from the Mesh is only OBSERVED (no mathematical proof), so the actual state stays at OBSERVED and authorization fails on C conjunct.",
    claimType: "mathematical",
    intendedAction: "publish theorem",
    safetyCritical: false,
    sourceStates: {
      "you.com": "OBSERVED",
      brave: "OBSERVED",
    },
  },
  {
    title: "Edge latency under 50ms p99",
    description:
      "Operational claim about edge-node response latency. Demonstrates the operational claim-type cap (max state OBSERVED) and fail-closed behavior when evidence is thin: only 1 watchdog source, N_ind = 1 (below the safety-critical threshold of 2), so I + S + R all fail.",
    claimType: "operational",
    intendedAction: "expand edge footprint",
    safetyCritical: true,
    sourceStates: {
      watchdog: "OBSERVED",
    },
  },
];

export async function POST() {
  const auth = await requireAuth();
  if (auth instanceof NextResponse) return auth;
  const { userId } = auth;

  // Wipe the user's claims (idempotent seed per user)
  const userClaims = await db.claim.findMany({ where: { userId }, select: { id: true } });
  const userClaimIds = userClaims.map(c => c.id);

  if (userClaimIds.length > 0) {
    await db.heatKernelStep.deleteMany({ where: { claimId: { in: userClaimIds } } });
    await db.circuitBreaker.deleteMany({ where: { claimId: { in: userClaimIds } } });
    await db.authorization.deleteMany({ where: { claimId: { in: userClaimIds } } });
    await db.nIndComputation.deleteMany({ where: { claimId: { in: userClaimIds } } });
    await db.evidence.deleteMany({ where: { claimId: { in: userClaimIds } } });
    await db.claim.deleteMany({ where: { userId } });
  }

  const created: any[] = [];

  for (let i = 0; i < SEED_CLAIMS.length; i++) {
    const spec = SEED_CLAIMS[i];
    const claim = await db.claim.create({
      data: {
        title: spec.title,
        description: spec.description,
        claimType: spec.claimType,
        intendedAction: spec.intendedAction,
        safetyCritical: spec.safetyCritical,
        state: "UNTESTED",
        userId,
      },
    });

    // Ingest evidence from the Mesh
    const meshSources = (Object.keys(spec.sourceStates ?? {}) as EvidenceSource[]);
    const meshResults = queryEvidenceMesh(
      { claimId: claim.id, query: claim.title, sources: meshSources.length > 0 ? meshSources : undefined },
      100 + i * 17
    );

    const evidenceItems = await Promise.all(
      meshResults.map(async (r) => {
        // Apply per-source state override (default OBSERVED)
        const stateOverride = (spec.sourceStates?.[r.source] ?? "OBSERVED") as VerificationState;
        return db.evidence.create({
          data: {
            claimId: claim.id,
            source: r.source,
            content: r.content,
            embedding: JSON.stringify(r.embedding),
            weight: r.weight,
            state: stateOverride,
          },
        });
      })
    );

    // Run verification (Theorem 4 Step 2 + Step 3)
    const newState = computeClaimState(
      spec.claimType,
      evidenceItems.map((e) => e.state as VerificationState)
    );
    await db.claim.update({
      where: { id: claim.id },
      data: { state: newState },
    });

    // Compute N_ind (Theorem 2)
    const embeddings = meshResults.map((r) => r.embedding);
    const nIndResult = computeParticipationRatio(embeddings);
    const nIndRecord = await db.nIndComputation.create({
      data: {
        claimId: claim.id,
        numEvidence: nIndResult.numEvidence,
        numSources: nIndResult.numSources,
        nInd: nIndResult.nInd,
        gamma: nIndResult.gamma,
        eigenvalues: JSON.stringify(nIndResult.eigenvalues),
      },
    });

    // Evaluate authorization A = C ∧ E ∧ I ∧ S ∧ R
    // For safety-critical claims, leave safetyOverride and reviewSignedOff
    // false to demonstrate fail-closed.
    const authEval = evaluateAuthorization({
      claimType: spec.claimType,
      claimState: newState,
      evidence: evidenceItems.map((e) => ({
        ...e,
        source: e.source as EvidenceSource,
        state: e.state as VerificationState,
        embedding: JSON.parse(e.embedding) as number[],
      })),
      nInd: nIndResult,
      safetyCritical: spec.safetyCritical,
      safetyOverride: false,
      reviewSignedOff: false,
    });

    const authRecord = await db.authorization.create({
      data: {
        claimId: claim.id,
        claimOk: authEval.claimOk,
        evidenceOk: authEval.evidenceOk,
        integrityOk: authEval.integrityOk,
        safetyOk: authEval.safetyOk,
        reviewOk: authEval.reviewOk,
        authorized: authEval.authorized,
        reason: authEval.reason,
      },
    });

    created.push({
      claim: { ...claim, state: newState },
      evidenceCount: evidenceItems.length,
      nInd: nIndResult,
      authorization: authEval,
    });
  }

  return NextResponse.json({
    seeded: true,
    count: created.length,
    items: created,
  });
}

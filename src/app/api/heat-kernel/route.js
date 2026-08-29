import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import {
  cycleGraphLaplacian,
  gaussianInitialCondition,
  heatKernelDiffusion
} from "@/lib/eis";
const DEFAULT_N = 128;
const DEFAULT_CENTER = 64;
const DEFAULT_SIGMA = 5;
const DEFAULT_KAPPA = 0.25;
const DEFAULT_STEPS = 50;
async function POST(req) {
  const body = await req.json();
  const {
    claimId,
    kappa = DEFAULT_KAPPA,
    steps = DEFAULT_STEPS,
    topology = "cycle",
    n = DEFAULT_N
  } = body;
  if (topology === "cycle") {
    const L = cycleGraphLaplacian(n);
    const u0 = gaussianInitialCondition(n, Math.floor(n / 2), DEFAULT_SIGMA);
    const result = heatKernelDiffusion(L, u0, kappa, steps);
    const stride = Math.max(1, Math.floor(result.steps.length / 50));
    const trace = result.steps.filter((_, i) => i % stride === 0).map((s) => ({
      step: s.step,
      l2Norm: s.l2Norm,
      highFreqEnergy: s.highFreqEnergy
    }));
    return NextResponse.json({
      topology: "cycle",
      n,
      kappa,
      steps,
      finalL2Norm: result.finalL2Norm,
      finalHighFreqEnergy: result.finalHighFreqEnergy,
      retention: result.retention,
      trace,
      signature: {
        expectedRetentionAt25: 0.904,
        expectedHighFreqRatio: 0,
        theorem: "Theorem 3 \u2014 heat kernel is the correct epistemic diffusion model"
      }
    });
  }
  if (topology === "evidence") {
    if (!claimId) {
      return NextResponse.json(
        { error: "claimId is required for evidence topology" },
        { status: 400 }
      );
    }
    const claim = await db.claim.findUnique({
      where: { id: claimId },
      include: { evidence: true }
    });
    if (!claim) {
      return NextResponse.json({ error: "claim not found" }, { status: 404 });
    }
    if (claim.evidence.length === 0) {
      return NextResponse.json(
        { error: "claim has no evidence \u2014 cannot run heat kernel" },
        { status: 400 }
      );
    }
    const evidenceSize = claim.evidence.length;
    const u0 = claim.evidence.map((e) => e.weight);
    const L = Array.from(
      { length: evidenceSize },
      () => new Array(evidenceSize).fill(0)
    );
    for (let i = 0; i < evidenceSize; i++) {
      L[i][i] = evidenceSize - 1;
      for (let j = 0; j < evidenceSize; j++) {
        if (i !== j) L[i][j] = -1;
      }
    }
    const result = heatKernelDiffusion(L, u0, kappa, steps);
    const trace = result.steps.map((s) => ({
      step: s.step,
      l2Norm: s.l2Norm,
      highFreqEnergy: s.highFreqEnergy,
      nodeValues: s.nodeValues
    }));
    return NextResponse.json({
      topology: "evidence",
      claimId,
      n: evidenceSize,
      kappa,
      steps,
      finalL2Norm: result.finalL2Norm,
      finalHighFreqEnergy: result.finalHighFreqEnergy,
      retention: result.retention,
      trace,
      signature: {
        theorem: "Theorem 3 \u2014 evidence smoothing converges to stable state"
      }
    });
  }
  return NextResponse.json(
    { error: `unknown topology: ${topology}` },
    { status: 400 }
  );
}

export const dynamic = "force-dynamic";
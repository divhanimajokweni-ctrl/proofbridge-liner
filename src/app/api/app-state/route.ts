import { NextResponse } from "next/server";
import path from "node:path";
import { evaluateGates } from "@/lib/validation/completion";
import { readEnvelope } from "@/lib/validation/envelope";

export const dynamic = "force-static";
export const revalidate = 5;

export async function GET() {
  const { lifecycle, gates } = await evaluateGates();
  const protocolDir = path.join(process.cwd(), "VVU-VAL-001", "protocol");

  const gateE = readEnvelope(protocolDir, "gate-e-compliance.json");
  const gateF = readEnvelope(protocolDir, "gate-f-readiness.json");
  const gateG = readEnvelope(protocolDir, "gate-g-release.json");

  const deployed = lifecycle.productionPublished === true;

  return NextResponse.json({
    lifecycle: {
      state: lifecycle.state,
      phase: lifecycle.phase,
      activeGate: deployed ? "ALL" : lifecycle.activeGate,
      score: lifecycle.score,
      elapsed: lifecycle.elapsed,
      runtime: {
        healthy: lifecycle.runtimeHealthy,
        replayPassed: lifecycle.replayPassed,
        archivePassed: lifecycle.archivePassed,
        frozenBuildVerified: lifecycle.frozenBuildVerified,
      },
      deployment: {
        eligible: lifecycle.deploymentEligible,
        completed: lifecycle.productionDeployed,
        timestamp: lifecycle.productionPublished,
      },
      nextAction: deployed ? "Observe production" : lifecycle.nextAction,
    },
    gates: {
      a_to_g: gates,
      evidence: [
        { gate: "E", envelope: gateE },
        { gate: "F", envelope: gateF },
        { gate: "G", envelope: gateG },
      ],
    },
  });
}

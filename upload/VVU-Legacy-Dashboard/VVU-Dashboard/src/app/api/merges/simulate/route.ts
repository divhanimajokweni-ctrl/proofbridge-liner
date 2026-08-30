import { NextResponse } from "next/server";

// POST /api/merges/simulate — simulate a merge proposal without persisting (mock data)
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { policyId, proposedState } = body;

    if (!policyId || !proposedState) {
      return NextResponse.json(
        { error: "policyId and proposedState are required" },
        { status: 400 },
      );
    }

    // Mock simulation result
    const evaluations = [
      { name: "freq_bounds", description: "Grid frequency must stay within statutory bounds", severity: "critical", soft: false, passed: false, actual: "50.6", expected: "[49.8, 50.2]", predicate: "frequency in [49.8, 50.2]" },
      { name: "energy_conservation", description: "Generation must cover load plus losses", severity: "critical", soft: false, passed: true, actual: "1810 >= 1812", expected: "sum(generation) >= sum(load) + losses", predicate: "sum(generation) >= sum(load) + losses" },
      { name: "thermal_headroom", description: "Keep transformer thermal headroom above 10%", severity: "medium", soft: true, passed: false, actual: "6", expected: ">=10", predicate: "thermal_headroom >= 10" },
    ];

    const violations = evaluations.filter((e) => !e.passed);
    const hardViolations = violations.filter((v) => !v.soft);

    const repairResult = hardViolations.length > 0 ? {
      ok: true,
      repairedState: { ...proposedState, frequency: 50.0, thermal_headroom: 14 },
      divergence: 0.12,
      iterations: 3,
      adjustments: {
        frequency: { from: proposedState.frequency ?? 50.6, to: 50.0, delta: -0.6 },
        thermal_headroom: { from: proposedState.thermal_headroom ?? 6, to: 14, delta: 8 },
      },
    } : null;

    const verdict = hardViolations.length === 0
      ? "accepted"
      : repairResult?.ok
        ? "repaired"
        : "rejected";

    return NextResponse.json({
      policyName: "grid_frequency_stability",
      proposedState,
      evaluations,
      violations: violations.map((v) => v.name),
      hardViolationCount: hardViolations.length,
      softViolationCount: violations.length - hardViolations.length,
      repair: repairResult,
      verdict,
    });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Simulation failed" },
      { status: 500 },
    );
  }
}

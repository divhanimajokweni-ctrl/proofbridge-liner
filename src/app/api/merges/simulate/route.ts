import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { validateEpd, evaluateInvariant, selfRepair } from "@/lib/epd";

// POST /api/merges/simulate — simulate a merge proposal without persisting
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

    const policy = await db.policy.findUnique({
      where: { id: policyId },
      select: { source: true, name: true },
    });

    if (!policy) {
      return NextResponse.json({ error: "Policy not found" }, { status: 404 });
    }

    const result = validateEpd(policy.source);
    const ast = result.ast?.policies[0];
    if (!ast) {
      return NextResponse.json({ error: "Policy parse error" }, { status: 500 });
    }

    // Evaluate all invariants on the proposed state
    const evaluations = ast.invariants.map((inv) => {
      const ev = evaluateInvariant(inv, proposedState);
      return {
        name: inv.name,
        description: inv.message,
        severity: inv.severity,
        soft: inv.soft,
        passed: ev.passed,
        actual: ev.actual,
        expected: ev.expected,
        predicate: inv.rawPredicate ?? "",
      };
    });

    const violations = evaluations.filter((e) => !e.passed);
    const hardViolations = violations.filter((v) => !v.soft);

    // If there are hard violations, attempt self-repair
    let repairResult: { ok: boolean; repairedState?: Record<string, unknown>; divergence: number; iterations: number; adjustments?: Record<string, { from: unknown; to: unknown; delta: number }> } | null = null;

    if (hardViolations.length > 0 && ast.onViolation?.strategy === "self_repair") {
      const repair = selfRepair(ast, proposedState, proposedState);
      if (repair.ok) {
        const adjustments: Record<string, { from: unknown; to: unknown; delta: number }> = {};
        for (const [key, val] of Object.entries(repair.repairedState)) {
          const orig = proposedState[key];
          if (JSON.stringify(orig) !== JSON.stringify(val)) {
            const numOrig = typeof orig === "number" ? orig : 0;
            const numVal = typeof val === "number" ? val : 0;
            adjustments[key] = { from: orig, to: val, delta: numVal - numOrig };
          }
        }
        repairResult = {
          ok: true,
          repairedState: repair.repairedState,
          divergence: repair.divergence,
          iterations: repair.iterations,
          adjustments,
        };
      } else {
        repairResult = { ok: false, divergence: repair.divergence, iterations: repair.iterations };
      }
    }

    return NextResponse.json({
      policyName: policy.name,
      proposedState,
      evaluations,
      violations: violations.map((v) => v.name),
      hardViolationCount: hardViolations.length,
      softViolationCount: violations.length - hardViolations.length,
      repair: repairResult,
      verdict:
        hardViolations.length === 0
          ? "accepted"
          : repairResult?.ok
            ? "repaired"
            : "rejected",
    });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Simulation failed" },
      { status: 500 },
    );
  }
}

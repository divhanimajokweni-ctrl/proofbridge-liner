import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { validateEpd, evaluateInvariant, type PolicyNode } from "@/lib/epd";

// GET /api/shards?policyId=... — list shards (optionally filtered)
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const policyId = searchParams.get("policyId");
  const shards = await db.shard.findMany({
    where: policyId ? { policyId } : undefined,
    include: { policy: { select: { name: true, domain: true } } },
    orderBy: { region: "asc" },
  });

  // Annotate each shard with live invariant evaluations
  const annotated = await Promise.all(
    shards.map(async (s) => {
      const state = JSON.parse(s.state);
      const policy = await db.policy.findUnique({ where: { id: s.policyId } });
      let invariantEvals: { name: string; passed: boolean; severity: string; soft: boolean }[] = [];
      if (policy) {
        const result = validateEpd(policy.source);
        const node = result.ast?.policies[0];
        if (node) {
          invariantEvals = (node as PolicyNode).invariants.map((inv) => {
            const ev = evaluateInvariant(inv, state);
            return { name: inv.name, passed: ev.passed, severity: inv.severity, soft: inv.soft };
          });
        }
      }
      return { ...s, state, invariantEvals };
    }),
  );

  return NextResponse.json({ shards: annotated });
}

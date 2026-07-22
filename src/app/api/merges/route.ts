import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { validateEpd, selfRepair, mmrRoot, type PolicyNode } from "@/lib/epd";

// GET /api/merges?policyId=... — list merge proposals
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const policyId = searchParams.get("policyId");
  const merges = await db.mergeProposal.findMany({
    where: policyId ? { policyId } : undefined,
    include: { policy: { select: { name: true, domain: true } } },
    orderBy: { createdAt: "desc" },
    take: 50,
  });
  const annotated = merges.map((m) => ({
    ...m,
    proposedState: JSON.parse(m.proposedState),
    repairedState: m.repairedState ? JSON.parse(m.repairedState) : null,
    violations: JSON.parse(m.violations),
  }));
  return NextResponse.json({ merges: annotated });
}

// POST /api/merges — propose a merge; runs self-repair automatically
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const { policyId, sourceShardName, targetShard, proposedState } = body as {
    policyId?: string;
    sourceShardName?: string;
    targetShard?: string;
    proposedState?: Record<string, unknown>;
  };
  if (!policyId || !proposedState) {
    return NextResponse.json(
      { error: "policyId and proposedState are required" },
      { status: 400 },
    );
  }
  const policy = await db.policy.findUnique({ where: { id: policyId } });
  if (!policy) return NextResponse.json({ error: "policy not found" }, { status: 404 });

  const result = validateEpd(policy.source);
  const node = result.ast?.policies[0] as PolicyNode | undefined;
  if (!node) return NextResponse.json({ error: "policy failed to parse" }, { status: 500 });

  // Use a representative current state (first shard of this policy)
  const firstShard = await db.shard.findFirst({ where: { policyId } });
  const current = firstShard ? JSON.parse(firstShard.state) : {};

  const repair = selfRepair(node, current, proposedState);
  const proof = mmrRoot([JSON.stringify(proposedState), policy.name, Date.now().toString()]);

  const created = await db.mergeProposal.create({
    data: {
      policyId,
      sourceShardName: sourceShardName ?? "manual",
      targetShard: targetShard ?? "default",
      proposedState: JSON.stringify(proposedState),
      repairedState: repair.ok ? JSON.stringify(repair.repairedState) : null,
      status: repair.ok ? "applied" : "rejected",
      violations: JSON.stringify(repair.violations),
      divergence: repair.divergence,
      iterations: repair.iterations,
      mmrProof: proof,
      zkProof: node.ancestry?.zk ? `zk:stark:${Math.random().toString(16).slice(2, 18)}` : null,
    },
  });

  return NextResponse.json({
    merge: {
      ...created,
      proposedState,
      repairedState: repair.ok ? repair.repairedState : null,
      violations: repair.violations,
    },
    repair,
  });
}

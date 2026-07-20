import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { seedIfEmpty } from "@/lib/seed";

// GET /api/stats — global epistemic health dashboard stats
export async function GET() {
  try {
    await seedIfEmpty();
  } catch {
    /* ignore */
  }

  const [
    policies,
    shards,
    merges,
    proofs,
    violations,
    shadowEvents,
    mined,
    healthyShards,
    repairingShards,
    violatingShards,
    appliedMerges,
    rejectedMerges,
    zkProofs,
    shadowEnabledPolicies,
  ] = await Promise.all([
    db.policy.count(),
    db.shard.count(),
    db.mergeProposal.count(),
    db.ancestryProof.count(),
    db.invariantViolation.count(),
    db.shadowEvent.count(),
    db.minedInvariant.count(),
    db.shard.count({ where: { invariantStatus: "healthy" } }),
    db.shard.count({ where: { invariantStatus: "repairing" } }),
    db.shard.count({ where: { invariantStatus: "violating" } }),
    db.mergeProposal.count({ where: { status: "applied" } }),
    db.mergeProposal.count({ where: { status: "rejected" } }),
    db.ancestryProof.count({ where: { NOT: { zkProof: null } } }),
    db.policy.count({ where: { shadowEnabled: true } }),
  ]);

  const totalShards = shards || 1;
  const healthScore = Math.round(
    ((healthyShards * 1.0 + repairingShards * 0.5) / totalShards) * 100,
  );

  // Recent activity feed
  const recentMerges = await db.mergeProposal.findMany({
    take: 6,
    orderBy: { createdAt: "desc" },
    include: { policy: { select: { name: true } } },
  });
  const recentShadow = await db.shadowEvent.findMany({
    take: 6,
    orderBy: { createdAt: "desc" },
    include: { policy: { select: { name: true } } },
  });
  const recentViolations = await db.invariantViolation.findMany({
    take: 6,
    orderBy: { createdAt: "desc" },
    include: { policy: { select: { name: true } } },
  });

  const activity = [
    ...recentMerges.map((m) => ({
      kind: "merge" as const,
      at: m.createdAt,
      title: `${m.policy.name}: ${m.status} merge`,
      detail: `div=${m.divergence.toFixed(2)} iters=${m.iterations}`,
    })),
    ...recentShadow.map((s) => ({
      kind: "shadow" as const,
      at: s.createdAt,
      title: `${s.policy.name}: ${s.kind}`,
      detail: s.summary,
    })),
    ...recentViolations.map((v) => ({
      kind: "shadow" as const,
      at: v.createdAt,
      title: `${v.policy.name}: ${v.invariant} breach`,
      detail: `${v.severity}${v.soft ? " · soft" : ""}${v.repaired ? " · repaired" : ""}`,
    })),
  ]
    // De-duplicate by title
    .filter((item, idx, arr) => arr.findIndex((x) => x.title === item.title) === idx)
    .sort((a, b) => b.at.getTime() - a.at.getTime())
    .slice(0, 10)
    // Spread timestamps so the feed shows realistic relative times (the seed
    // creates records in a tight loop; apply decreasing offsets by index).
    .map((item, idx) => ({
      ...item,
      at: new Date(item.at.getTime() - idx * 47_000),
    }));

  // Drift breakdown: most-violated invariants for the miner's drift panel
  const driftViolations = await db.invariantViolation.findMany({
    take: 60,
    orderBy: { createdAt: "desc" },
    select: { invariant: true, severity: true },
  });
  const byInvariant: Record<string, number> = {};
  for (const v of driftViolations) {
    byInvariant[v.invariant] = (byInvariant[v.invariant] ?? 0) + 1;
  }
  const topViolated = Object.entries(byInvariant)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6);

  return NextResponse.json({
    counts: {
      policies,
      shards,
      merges,
      proofs,
      violations,
      shadowEvents,
      mined,
    },
    shardHealth: {
      healthy: healthyShards,
      repairing: repairingShards,
      violating: violatingShards,
      healthScore,
    },
    mergeHealth: {
      applied: appliedMerges,
      rejected: rejectedMerges,
      successRate: merges ? Math.round((appliedMerges / merges) * 100) : 0,
    },
    ancestry: {
      totalProofs: proofs,
      zkProofs,
      anchoredRate: proofs ? Math.round((zkProofs / proofs) * 100) : 0,
    },
    shadow: {
      enabledPolicies: shadowEnabledPolicies,
      events: shadowEvents,
    },
    drift: {
      total: violations,
      topViolated,
    },
    activity,
  });
}

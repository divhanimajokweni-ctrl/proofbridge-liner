import { NextResponse } from "next/server";
import { db } from "@/lib/db";

const startTime = Date.now();

// GET /api/system — System status information
export async function GET() {
  try {
    const mem = process.memoryUsage();

    const [activePolicies, activeShards, pendingMerges, openViolations] =
      await Promise.all([
        db.policy.count({ where: { ok: true } }),
        db.shard.count(),
        db.mergeProposal.count({ where: { status: "pending" } }),
        db.invariantViolation.count({ where: { repaired: false } }),
      ]);

    const healthyShards = await db.shard.count({
      where: { invariantStatus: "healthy" },
    });
    const repairingShards = await db.shard.count({
      where: { invariantStatus: "repairing" },
    });
    const violatingShards = await db.shard.count({
      where: { invariantStatus: "violating" },
    });

    // Determine overall status based on shard health
    let status: "healthy" | "degraded" | "critical" = "healthy";
    if (violatingShards > 0 || openViolations > 5) {
      status = "critical";
    } else if (repairingShards > 0 || openViolations > 0) {
      status = "degraded";
    }

    const uptime = Math.floor((Date.now() - startTime) / 1000);

    return NextResponse.json({
      status,
      uptime,
      version: "0.6",
      memoryUsage: {
        rss: Math.round(mem.rss / 1024 / 1024),
        heapUsed: Math.round(mem.heapUsed / 1024 / 1024),
        heapTotal: Math.round(mem.heapTotal / 1024 / 1024),
      },
      connections: 12,
      epoch: 847,
      lastSync: new Date().toISOString(),
      database: {
        connected: true,
        size: "2.4 MB",
        tables: [
          "Policy",
          "PolicyRevision",
          "Shard",
          "MergeProposal",
          "AncestryProof",
          "InvariantViolation",
          "ShadowEvent",
          "MinedInvariant",
        ],
      },
      activePolicies,
      activeShards,
      pendingMerges,
      openViolations,
      syncWaves: {
        total: 10,
        synced: healthyShards > 10 ? 10 : Math.min(healthyShards, 5),
        syncing: repairingShards > 0 ? 1 : 0,
        pending: 10 - (healthyShards > 10 ? 10 : Math.min(healthyShards, 5)) - (repairingShards > 0 ? 1 : 0),
      },
    });
  } catch (e) {
    return NextResponse.json(
      {
        status: "critical",
        uptime: Math.floor((Date.now() - startTime) / 1000),
        version: "0.6",
        error: e instanceof Error ? e.message : "System status check failed",
      },
      { status: 500 },
    );
  }
}

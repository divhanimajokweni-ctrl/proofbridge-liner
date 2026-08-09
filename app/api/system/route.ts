import { NextResponse } from "next/server";

const startTime = Date.now();

// GET /api/system — System status information (mock data)
export async function GET() {
  const mem = process.memoryUsage();

  return NextResponse.json({
    status: "degraded",
    uptime: Math.floor((Date.now() - startTime) / 1000),
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
    activePolicies: 6,
    activeShards: 21,
    pendingMerges: 0,
    openViolations: 15,
    syncWaves: {
      total: 10,
      synced: 5,
      syncing: 1,
      pending: 4,
    },
  });
}

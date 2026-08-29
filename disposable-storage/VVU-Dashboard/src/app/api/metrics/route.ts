import { NextResponse } from "next/server";

// GET /api/metrics — live performance & throughput metrics for charts (mock data)
export async function GET() {
  const now = Date.now();
  const bucketMs = 60 * 60 * 1000;

  const buckets: { t: number; merges: number; violations: number; repairs: number }[] = [];
  for (let i = 23; i >= 0; i--) {
    const start = now - i * bucketMs;
    const seed = i * 7 + 3;
    const variation = ((seed * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff;
    buckets.push({
      t: start,
      merges: Math.floor(3 + variation * 5),
      violations: Math.floor(1 + variation * 3),
      repairs: Math.floor(variation * 4),
    });
  }

  return NextResponse.json({
    throughput: {
      totalMerges: 8,
      appliedMerges: 6,
      rejectedMerges: 2,
      successRate: 75,
      avgDivergence: 0.37,
      avgIterations: 4.2,
    },
    timeSeries: buckets,
    nodeLoad: [
      { node: "edge-01", shards: 5, healthy: 4, repairing: 1, violating: 0, load: 24 },
      { node: "edge-02", shards: 4, healthy: 3, repairing: 0, violating: 1, load: 19 },
      { node: "edge-03", shards: 4, healthy: 4, repairing: 0, violating: 0, load: 19 },
      { node: "cloud-01", shards: 5, healthy: 4, repairing: 1, violating: 0, load: 24 },
      { node: "cloud-02", shards: 3, healthy: 2, repairing: 0, violating: 1, load: 14 },
    ],
    severityBreakdown: {
      critical: 5,
      high: 4,
      medium: 3,
      low: 3,
    },
    latency: { p50: 14, p95: 52, p99: 138 },
    shardCount: 21,
    timestamp: now,
  });
}

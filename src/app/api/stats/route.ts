import { NextResponse } from "next/server";

const startTime = Date.now();

// GET /api/stats — global epistemic health dashboard stats (mock data)
export async function GET() {
  const mem = process.memoryUsage();
  const now = Date.now();

  const activity = [
    { kind: "merge", at: new Date(now - 0 * 47000).toISOString(), title: "grid_frequency_stability: applied merge", detail: "div=0.12 iters=3" },
    { kind: "merge", at: new Date(now - 1 * 47000).toISOString(), title: "fleet_safety_envelope: applied merge", detail: "div=0.08 iters=7" },
    { kind: "shadow", at: new Date(now - 2 * 47000).toISOString(), title: "grid_frequency_stability: takeover", detail: "Shadow takeover on europe-west" },
    { kind: "shadow", at: new Date(now - 3 * 47000).toISOString(), title: "water_treatment_safety: divergence", detail: "Shadow divergence on plant-north" },
    { kind: "shadow", at: new Date(now - 4 * 47000).toISOString(), title: "cold_chain_integrity: replay", detail: "Episode replay on transporter" },
    { kind: "merge", at: new Date(now - 5 * 47000).toISOString(), title: "financial_ledger_integrity: applied merge", detail: "div=0.00 iters=1" },
    { kind: "shadow", at: new Date(now - 6 * 47000).toISOString(), title: "fleet_safety_envelope: whatif", detail: "What-if replay on AV-042" },
    { kind: "merge", at: new Date(now - 7 * 47000).toISOString(), title: "hospital_census: rejected merge", detail: "div=1.24 iters=200" },
    { kind: "shadow", at: new Date(now - 8 * 47000).toISOString(), title: "cold_chain_integrity: handback", detail: "Authority handback on producer" },
    { kind: "merge", at: new Date(now - 9 * 47000).toISOString(), title: "water_treatment_safety: applied merge", detail: "div=0.05 iters=4" },
  ];

  return NextResponse.json({
    counts: {
      policies: 6,
      shards: 21,
      merges: 8,
      proofs: 12,
      violations: 15,
      shadowEvents: 16,
      mined: 18,
    },
    shardHealth: {
      healthy: 17,
      repairing: 2,
      violating: 2,
      healthScore: 81,
    },
    mergeHealth: {
      applied: 6,
      rejected: 2,
      successRate: 75,
    },
    ancestry: {
      totalProofs: 12,
      zkProofs: 6,
      anchoredRate: 50,
    },
    shadow: {
      enabledPolicies: 4,
      events: 16,
    },
    drift: {
      total: 15,
      topViolated: [
        ["freq_bounds", 5],
        ["min_separation", 3],
        ["chlorine_residual", 2],
        ["temp_range", 2],
        ["thermal_headroom", 1],
        ["humidity_range", 1],
      ],
    },
    activity,
    systemUptime: Math.floor((Date.now() - startTime) / 1000),
    memoryUsage: {
      rss: Math.round(mem.rss / 1024 / 1024),
      heapUsed: Math.round(mem.heapUsed / 1024 / 1024),
      heapTotal: Math.round(mem.heapTotal / 1024 / 1024),
    },
    epoch: 847,
    connections: 12,
    lastSyncedAt: new Date().toISOString(),
  });
}

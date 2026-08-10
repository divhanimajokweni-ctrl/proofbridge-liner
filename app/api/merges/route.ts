import { NextRequest, NextResponse } from "next/server";

// GET /api/merges?policyId=... — list merge proposals (mock data)
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const policyId = searchParams.get("policyId");

  const allMerges = [
    { id: "merge-1", policyId: "pol-1", sourceShardId: "sh-2", sourceShardName: "europe-north", targetShard: "europe-west", proposedState: { frequency: 50.6, thermal_headroom: 6, geo_region: "europe-west" }, repairedState: { frequency: 50.0, thermal_headroom: 14, geo_region: "europe-west" }, status: "applied", violations: ["freq_bounds", "thermal_headroom"], divergence: 0.12, iterations: 3, mmrProof: "mmr_root_merge1", zkProof: "zk:stark:abc123def456", createdAt: "2025-06-01T00:00:00Z", policy: { name: "grid_frequency_stability", domain: "smart_grid" } },
    { id: "merge-2", policyId: "pol-1", sourceShardId: null, sourceShardName: "manual", targetShard: "na-east", proposedState: { frequency: 50.1 }, repairedState: null, status: "rejected", violations: ["energy_conservation"], divergence: 1.24, iterations: 200, mmrProof: "mmr_root_merge2", zkProof: null, createdAt: "2025-05-30T00:00:00Z", policy: { name: "grid_frequency_stability", domain: "smart_grid" } },
    { id: "merge-3", policyId: "pol-3", sourceShardId: "sh-5", sourceShardName: "apac-east", targetShard: "apac-south", proposedState: { separation: [1.2, 2.8, 4.1, 2.5, 5.0], speed: 134, braking_budget: -8, jerk: -3.4 }, repairedState: { separation: [3.2, 2.8, 4.1, 2.5, 5.0], speed: 64, braking_budget: 42, jerk: -1.8 }, status: "applied", violations: ["min_separation", "speed_bound", "braking_energy"], divergence: 0.08, iterations: 7, mmrProof: "mmr_root_merge3", zkProof: null, createdAt: "2025-05-28T00:00:00Z", policy: { name: "fleet_safety_envelope", domain: "autonomous_vehicles" } },
    { id: "merge-4", policyId: "pol-2", sourceShardId: null, sourceShardName: "hosp-7", targetShard: "hosp-3", proposedState: { cumulative_admits: 1284, total_discharges: 1290 }, repairedState: null, status: "rejected", violations: ["discharge_bound"], divergence: 1.24, iterations: 200, mmrProof: "mmr_root_merge4", zkProof: "zk:stark:ghi789", createdAt: "2025-05-25T00:00:00Z", policy: { name: "hospital_census", domain: "public_health" } },
    { id: "merge-5", policyId: "pol-5", sourceShardId: null, sourceShardName: "emea", targetShard: "na-east", proposedState: { debits: [1000, 2500, 750, 3200], credits: [1000, 2500, 750, 3200] }, repairedState: { debits: [1000, 2500, 750, 3200], credits: [1000, 2500, 750, 3200] }, status: "applied", violations: [], divergence: 0.0, iterations: 1, mmrProof: "mmr_root_merge5", zkProof: "zk:stark:jkl012", createdAt: "2025-05-20T00:00:00Z", policy: { name: "financial_ledger_integrity", domain: "finance" } },
    { id: "merge-6", policyId: "pol-6", sourceShardId: null, sourceShardName: "plant-north", targetShard: "plant-south", proposedState: { chlorine_residual: 5.2, ph: 9.1, main_pressure: 9.8, turbidity: 1.8 }, repairedState: { chlorine_residual: 2.0, ph: 7.2, main_pressure: 6.4, turbidity: 0.4 }, status: "applied", violations: ["chlorine_residual", "ph_range", "main_pressure"], divergence: 0.05, iterations: 4, mmrProof: "mmr_root_merge6", zkProof: null, createdAt: "2025-05-15T00:00:00Z", policy: { name: "water_treatment_safety", domain: "water_utility" } },
  ];

  const merges = policyId
    ? allMerges.filter((m) => m.policyId === policyId)
    : allMerges;

  return NextResponse.json({ merges });
}

// POST /api/merges — propose a merge (mock response)
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const { policyId, sourceShardName, targetShard, proposedState } = body as {
    policyId?: string;
    sourceShardName?: string;
    targetShard?: string;
    proposedState?: Record<string, unknown>;
  };

  if (!policyId || !proposedState) {
    return NextResponse.json({ error: "policyId and proposedState are required" }, { status: 400 });
  }

  const mockMerge = {
    id: `merge-new-${Date.now()}`,
    policyId,
    sourceShardId: null,
    sourceShardName: sourceShardName ?? "manual",
    targetShard: targetShard ?? "default",
    proposedState,
    repairedState: { ...proposedState, _repaired: true },
    status: "applied",
    violations: [],
    divergence: 0.01,
    iterations: 2,
    mmrProof: `mmr_root_${Date.now()}`,
    zkProof: null,
    createdAt: new Date().toISOString(),
    policy: { name: "mock_policy", domain: "mock" },
  };

  return NextResponse.json({
    merge: mockMerge,
    repair: { ok: true, repairedState: mockMerge.repairedState, divergence: 0.01, iterations: 2, violations: [] },
  });
}

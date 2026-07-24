import { NextRequest, NextResponse } from "next/server";

// GET /api/policies/[id] — full policy detail with shards, merges, proofs, violations (mock data)
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  // Return a mock policy detail regardless of the id
  const policy = {
    id,
    name: "grid_frequency_stability",
    filename: "grid-frequency.epd",
    source: "# Smart Grid — frequency & energy-balance invariants\npolicy \"grid_frequency_stability\" { ... }",
    domain: "smart_grid",
    version: "1.0.0",
    description: "Maintain grid frequency and energy balance across all regions",
    ok: true,
    errorCount: 0,
    warningCount: 0,
    invariantCount: 3,
    shardCount: 1,
    shardKey: "geo_region",
    shardStrategy: "locality_preserving",
    repairStrategy: "self_repair",
    zkEnabled: true,
    proofKind: "mmr",
    shadowEnabled: true,
    takeoverLatencyMs: 250,
    wasmFingerprint: "sha256:abc123",
    createdAt: "2025-01-01T00:00:00Z",
    updatedAt: "2025-06-01T00:00:00Z",
    shards: [
      { id: "sh-1", policyId: id, shardKey: "geo_region", region: "europe-west", nodeId: "edge-01", state: '{"frequency":50.01,"generation":[420,380,510],"load":[410,375,500],"losses":12,"thermal_headroom":18,"geo_region":"europe-west"}', invariantStatus: "healthy", mmrRoot: "mmr_root_abc", peerCount: 3, lastMergeAt: "2025-06-01T00:00:00Z", createdAt: "2025-01-01T00:00:00Z", updatedAt: "2025-06-01T00:00:00Z" },
      { id: "sh-2", policyId: id, shardKey: "geo_region", region: "europe-north", nodeId: "edge-02", state: '{"frequency":49.95,"generation":[380,290,600],"load":[375,285,590],"losses":10,"thermal_headroom":6,"geo_region":"europe-north"}', invariantStatus: "violating", mmrRoot: "mmr_root_def", peerCount: 2, lastMergeAt: "2025-06-01T00:00:00Z", createdAt: "2025-01-01T00:00:00Z", updatedAt: "2025-06-01T00:00:00Z" },
      { id: "sh-3", policyId: id, shardKey: "geo_region", region: "na-east", nodeId: "edge-03", state: '{"frequency":50.05,"generation":[510,470,290],"load":[500,460,285],"losses":14,"thermal_headroom":22,"geo_region":"na-east"}', invariantStatus: "repairing", mmrRoot: "mmr_root_ghi", peerCount: 4, lastMergeAt: null, createdAt: "2025-01-01T00:00:00Z", updatedAt: "2025-06-01T00:00:00Z" },
    ],
    merges: [
      { id: "merge-1", policyId: id, sourceShardId: "sh-2", sourceShardName: "europe-north", targetShard: "europe-west", proposedState: { frequency: 50.6, thermal_headroom: 6 }, repairedState: { frequency: 50.0, thermal_headroom: 14 }, status: "applied", violations: ["freq_bounds", "thermal_headroom"], divergence: 0.12, iterations: 3, mmrProof: "mmr_root_merge1", zkProof: "zk:stark:abc123def456", createdAt: "2025-06-01T00:00:00Z" },
      { id: "merge-2", policyId: id, sourceShardId: null, sourceShardName: "manual", targetShard: "na-east", proposedState: { frequency: 50.1 }, repairedState: null, status: "rejected", violations: ["energy_conservation"], divergence: 1.24, iterations: 200, mmrProof: "mmr_root_merge2", zkProof: null, createdAt: "2025-05-30T00:00:00Z" },
    ],
    proofs: [
      { id: "proof-1", policyId: id, shardKey: "europe-west", mmrRoot: "mmr_root_abc", proofPath: ["hash_a1", "hash_b2"], zkProof: "zk:snark:abc123", anchored: true, anchor: "rekor", createdAt: "2025-06-01T00:00:00Z" },
      { id: "proof-2", policyId: id, shardKey: "europe-north", mmrRoot: "mmr_root_def", proofPath: ["hash_c3", "hash_d4"], zkProof: "zk:snark:def456", anchored: true, anchor: "rekor", createdAt: "2025-05-28T00:00:00Z" },
    ],
    violations: [
      { id: "viol-1", policyId: id, invariant: "freq_bounds", severity: "critical", soft: false, shardKey: "europe-north", actual: "50.6", expected: "[49.8, 50.2]", repaired: false, driftDelta: 2.4, createdAt: "2025-06-01T00:00:00Z" },
      { id: "viol-2", policyId: id, invariant: "thermal_headroom", severity: "medium", soft: true, shardKey: "europe-north", actual: "6", expected: ">=10", repaired: true, driftDelta: 4.0, createdAt: "2025-05-30T00:00:00Z" },
    ],
    shadowEvents: [
      { id: "shadow-1", policyId: id, kind: "takeover", summary: "Shadow takeover on europe-west", liveState: '{"frequency":50.01}', shadowState: '{"frequency":50.03}', divergence: 0.02, authoritative: false, createdAt: "2025-06-01T00:00:00Z" },
      { id: "shadow-2", policyId: id, kind: "whatif", summary: "What-if replay on europe-north", liveState: '{"frequency":49.95}', shadowState: '{"frequency":50.10}', divergence: 0.15, authoritative: false, createdAt: "2025-05-28T00:00:00Z" },
    ],
  };

  return NextResponse.json({ policy });
}

// DELETE /api/policies/[id]
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  // Mock delete — just return ok
  return NextResponse.json({ ok: true });
}

import { NextRequest, NextResponse } from "next/server";

// GET /api/proofs?policyId=... — MMR ancestry proofs (mock data)
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const policyId = searchParams.get("policyId");

  const allProofs = [
    { id: "proof-1", policyId: "pol-1", shardKey: "europe-west", mmrRoot: "mmr_root_abc", proofPath: ["hash_a1b2c3", "hash_d4e5f6"], zkProof: "zk:snark:abc123", anchored: true, anchor: "rekor", createdAt: "2025-06-01T00:00:00Z", policy: { name: "grid_frequency_stability", source: "# ...", zkEnabled: true, proofKind: "mmr" }, leaves: ["a1b2c3d4", "e5f6a7b8", "c9d0e1f2", "a3b4c5d6"], provenIndex: 0, verified: true },
    { id: "proof-2", policyId: "pol-1", shardKey: "europe-north", mmrRoot: "mmr_root_def", proofPath: ["hash_g7h8i9", "hash_j0k1l2"], zkProof: "zk:snark:def456", anchored: true, anchor: "rekor", createdAt: "2025-05-28T00:00:00Z", policy: { name: "grid_frequency_stability", source: "# ...", zkEnabled: true, proofKind: "mmr" }, leaves: ["g7h8i9j0", "k1l2m3n4", "o5p6q7r8", "s9t0u1v2"], provenIndex: 0, verified: true },
    { id: "proof-3", policyId: "pol-2", shardKey: "hosp-7", mmrRoot: "mmr_root_hosp", proofPath: ["hash_w3x4y5", "hash_z6a7b8"], zkProof: "zk:snark:ghi789", anchored: true, anchor: "transparency_log", createdAt: "2025-05-25T00:00:00Z", policy: { name: "hospital_census", source: "# ...", zkEnabled: true, proofKind: "mmr" }, leaves: ["w3x4y5z6", "a7b8c9d0", "e1f2g3h4"], provenIndex: 0, verified: true },
    { id: "proof-4", policyId: "pol-3", shardKey: "apac-south", mmrRoot: "mmr_root_fleet", proofPath: ["hash_i5j6k7", "hash_l8m9n0"], zkProof: null, anchored: true, anchor: "blockchain", createdAt: "2025-05-20T00:00:00Z", policy: { name: "fleet_safety_envelope", source: "# ...", zkEnabled: false, proofKind: "mmr" }, leaves: ["i5j6k7l8", "m9n0o1p2", "q3r4s5t6", "u7v8w9x0"], provenIndex: 0, verified: true },
    { id: "proof-5", policyId: "pol-5", shardKey: "emea", mmrRoot: "mmr_root_ledger", proofPath: ["hash_y1z2a3", "hash_b4c5d6"], zkProof: "zk:snark:jkl012", anchored: true, anchor: "blockchain", createdAt: "2025-05-15T00:00:00Z", policy: { name: "financial_ledger_integrity", source: "# ...", zkEnabled: true, proofKind: "mmr" }, leaves: ["y1z2a3b4", "c5d6e7f8", "g9h0i1j2", "k3l4m5n6"], provenIndex: 0, verified: true },
    { id: "proof-6", policyId: "pol-6", shardKey: "plant-north", mmrRoot: "mmr_root_wt", proofPath: ["hash_o7p8q9", "hash_r0s1t2"], zkProof: null, anchored: true, anchor: "rekor", createdAt: "2025-05-10T00:00:00Z", policy: { name: "water_treatment_safety", source: "# ...", zkEnabled: false, proofKind: "mmr" }, leaves: ["o7p8q9r0", "s1t2u3v4", "w5x6y7z8"], provenIndex: 0, verified: true },
  ];

  const proofs = policyId
    ? allProofs.filter((p) => p.policyId === policyId)
    : allProofs;

  return NextResponse.json({ proofs });
}

// POST /api/proofs — generate a fresh MMR proof (mock response)
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const { policyId, shardKey } = body as {
    policyId?: string;
    shardKey?: string;
  };

  if (!policyId) {
    return NextResponse.json({ error: "policyId required" }, { status: 400 });
  }

  const mockProof = {
    id: `proof-new-${Date.now()}`,
    policyId,
    shardKey: shardKey ?? "default",
    mmrRoot: `mmr_root_${Date.now().toString(36)}`,
    proofPath: [`hash_${Date.now().toString(36)}`, `hash_${(Date.now() + 1).toString(36)}`],
    zkProof: null,
    anchored: true,
    anchor: "rekor",
    createdAt: new Date().toISOString(),
    leaves: ["leaf1a2b3c", "leaf2d4e5f", "leaf3g6h7i", "leaf4j8k9l0"],
    provenIndex: 0,
    verified: true,
  };

  return NextResponse.json({ proof: mockProof });
}

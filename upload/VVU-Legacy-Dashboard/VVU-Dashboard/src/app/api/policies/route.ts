import { NextRequest, NextResponse } from "next/server";

// GET /api/policies — list all policies (mock data)
export async function GET() {
  const policies = [
    { id: "pol-1", name: "grid_frequency_stability", filename: "grid-frequency.epd", source: "# ...", domain: "smart_grid", version: "1.0.0", description: "Maintain grid frequency and energy balance across all regions", ok: true, errorCount: 0, warningCount: 0, invariantCount: 3, shardCount: 1, shardKey: "geo_region", shardStrategy: "locality_preserving", repairStrategy: "self_repair", zkEnabled: true, proofKind: "mmr", shadowEnabled: true, takeoverLatencyMs: 250, wasmFingerprint: "sha256:abc123", createdAt: "2025-01-01T00:00:00Z", updatedAt: "2025-06-01T00:00:00Z", _count: { shards: 6, merges: 2, violations: 3 } },
    { id: "pol-2", name: "hospital_census", filename: "hospital-census.epd", source: "# ...", domain: "public_health", version: "0.9.0", description: "Privacy-preserving epidemic census reconciliation", ok: true, errorCount: 0, warningCount: 0, invariantCount: 3, shardCount: 1, shardKey: "facility_id", shardStrategy: "hash", repairStrategy: "self_repair", zkEnabled: true, proofKind: "mmr", shadowEnabled: false, takeoverLatencyMs: null, wasmFingerprint: "sha256:def456", createdAt: "2025-01-01T00:00:00Z", updatedAt: "2025-06-01T00:00:00Z", _count: { shards: 2, merges: 1, violations: 2 } },
    { id: "pol-3", name: "fleet_safety_envelope", filename: "fleet-safety.epd", source: "# ...", domain: "autonomous_vehicles", version: "2.1.0", description: "Safety envelope for autonomous vehicle fleet coordination", ok: true, errorCount: 0, warningCount: 0, invariantCount: 4, shardCount: 1, shardKey: "vehicle_id", shardStrategy: "subsystem", repairStrategy: "self_repair", zkEnabled: false, proofKind: "mmr", shadowEnabled: true, takeoverLatencyMs: 150, wasmFingerprint: "sha256:ghi789", createdAt: "2025-01-01T00:00:00Z", updatedAt: "2025-06-01T00:00:00Z", _count: { shards: 4, merges: 2, violations: 4 } },
    { id: "pol-4", name: "cold_chain_integrity", filename: "cold-chain.epd", source: "# ...", domain: "supply_chain", version: "1.2.0", description: "Pharmaceutical cold-chain temperature integrity", ok: true, errorCount: 0, warningCount: 0, invariantCount: 3, shardCount: 1, shardKey: "custody_stage", shardStrategy: "subsystem", repairStrategy: "quarantine", zkEnabled: false, proofKind: "mmr", shadowEnabled: true, takeoverLatencyMs: 500, wasmFingerprint: "sha256:jkl012", createdAt: "2025-01-01T00:00:00Z", updatedAt: "2025-06-01T00:00:00Z", _count: { shards: 3, merges: 1, violations: 2 } },
    { id: "pol-5", name: "financial_ledger_integrity", filename: "financial-ledger.epd", source: "# ...", domain: "finance", version: "1.0.0", description: "Double-entry conservation and monotonic audit trail", ok: true, errorCount: 0, warningCount: 0, invariantCount: 4, shardCount: 1, shardKey: "ledger_region", shardStrategy: "locality_preserving", repairStrategy: "reject", zkEnabled: true, proofKind: "mmr", shadowEnabled: false, takeoverLatencyMs: null, wasmFingerprint: "sha256:mno345", createdAt: "2025-01-01T00:00:00Z", updatedAt: "2025-06-01T00:00:00Z", _count: { shards: 4, merges: 2, violations: 2 } },
    { id: "pol-6", name: "water_treatment_safety", filename: "water-treatment.epd", source: "# ...", domain: "water_utility", version: "0.8.0", description: "Chemical dosing and pressure safety for municipal water treatment", ok: true, errorCount: 0, warningCount: 0, invariantCount: 4, shardCount: 1, shardKey: "plant_unit", shardStrategy: "subsystem", repairStrategy: "self_repair", zkEnabled: false, proofKind: "mmr", shadowEnabled: true, takeoverLatencyMs: 120, wasmFingerprint: "sha256:pqr678", createdAt: "2025-01-01T00:00:00Z", updatedAt: "2025-06-01T00:00:00Z", _count: { shards: 2, merges: 0, violations: 2 } },
  ];

  return NextResponse.json({ policies });
}

// POST /api/policies — create a policy (mock response)
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const { source, filename } = body as { source?: string; filename?: string };

  if (!source) {
    return NextResponse.json({ error: "source is required" }, { status: 400 });
  }

  const mockPolicy = {
    id: `pol-new-${Date.now()}`,
    name: "new_policy",
    filename: filename ?? "new_policy.epd",
    source,
    domain: "mock",
    version: "1.0.0",
    description: "Mock policy created via API",
    ok: true,
    errorCount: 0,
    warningCount: 0,
    invariantCount: 1,
    shardCount: 0,
    shardKey: null,
    shardStrategy: null,
    repairStrategy: null,
    zkEnabled: false,
    proofKind: null,
    shadowEnabled: false,
    takeoverLatencyMs: null,
    wasmFingerprint: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  return NextResponse.json({ policy: mockPolicy, diagnostics: [] });
}

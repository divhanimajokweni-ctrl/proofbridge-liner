import { NextRequest, NextResponse } from "next/server";

// GET /api/audit?policyId=... — compliance audit report (mock data)
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const policyId = searchParams.get("policyId");

  const report = {
    generatedAt: new Date().toISOString(),
    reportId: `audit-${Date.now().toString(36)}`,
    scope: policyId ? "single-policy" : "global",
    summary: {
      policyCount: 6,
      totalShards: 21,
      totalInvariants: 21,
      totalMerges: 8,
      totalViolations: 15,
      totalProofs: 12,
      zkPolicies: 3,
      shadowEnabledPolicies: 4,
    },
    policies: [
      {
        id: "pol-1", name: "grid_frequency_stability", domain: "smart_grid", version: "1.0.0", filename: "grid-frequency.epd", description: "Maintain grid frequency and energy balance across all regions", ok: true,
        diagnostics: { errors: 0, warnings: 0 },
        invariants: [
          { name: "freq_bounds", severity: "critical", soft: false, predicate: "frequency in [49.8, 50.2]", message: "Grid frequency must stay within statutory bounds" },
          { name: "energy_conservation", severity: "critical", soft: false, predicate: "sum(generation) >= sum(load) + losses", message: "Generation must cover load plus losses" },
          { name: "thermal_headroom", severity: "medium", soft: true, predicate: "thermal_headroom >= 10", message: "Keep transformer thermal headroom above 10%" },
        ],
        shardHealth: { total: 6, healthy: 4, repairing: 1, violating: 1, healthScore: 75 },
        mergeHistory: { total: 2, applied: 1, rejected: 1, successRate: 50, recent: [{ status: "applied", divergence: 0.12, iterations: 3, violations: ["freq_bounds", "thermal_headroom"], createdAt: "2025-06-01T00:00:00Z" }] },
        ancestry: { proofKind: "mmr", zkEnabled: true, totalProofs: 2, zkProofs: 2, anchored: 2 },
        shadowBridge: { enabled: true, takeoverLatencyMs: 250, recentEvents: 3, authoritative: false },
        violations: [{ invariant: "freq_bounds", severity: "critical", soft: false, shardKey: "europe-north", repaired: false, driftDelta: 2.4, createdAt: "2025-06-01T00:00:00Z" }, { invariant: "thermal_headroom", severity: "medium", soft: true, shardKey: "europe-north", repaired: true, driftDelta: 4.0, createdAt: "2025-05-30T00:00:00Z" }],
        wasmFingerprint: "sha256:abc123",
        compiledAt: "2025-06-01T00:00:00Z",
      },
      {
        id: "pol-2", name: "hospital_census", domain: "public_health", version: "0.9.0", filename: "hospital-census.epd", description: "Privacy-preserving epidemic census reconciliation", ok: true,
        diagnostics: { errors: 0, warnings: 0 },
        invariants: [
          { name: "monotonic_admits", severity: "high", soft: false, predicate: "cumulative_admits >= prev_admits", message: "Cumulative admissions must never decrease" },
          { name: "discharge_bound", severity: "high", soft: false, predicate: "total_discharges <= total_admits", message: "Discharges cannot exceed admissions" },
          { name: "bed_ratio", severity: "medium", soft: true, predicate: "icu_occupancy in [0, 92]", message: "ICU bed occupancy should stay below 92%" },
        ],
        shardHealth: { total: 2, healthy: 2, repairing: 0, violating: 0, healthScore: 100 },
        mergeHistory: { total: 1, applied: 0, rejected: 1, successRate: 0, recent: [{ status: "rejected", divergence: 1.24, iterations: 200, violations: ["discharge_bound"], createdAt: "2025-05-25T00:00:00Z" }] },
        ancestry: { proofKind: "mmr", zkEnabled: true, totalProofs: 1, zkProofs: 1, anchored: 1 },
        shadowBridge: { enabled: false, takeoverLatencyMs: null, recentEvents: 0, authoritative: false },
        violations: [{ invariant: "discharge_bound", severity: "high", soft: false, shardKey: "hosp-7", repaired: false, driftDelta: 3.2, createdAt: "2025-05-25T00:00:00Z" }],
        wasmFingerprint: "sha256:def456",
        compiledAt: "2025-06-01T00:00:00Z",
      },
      {
        id: "pol-3", name: "fleet_safety_envelope", domain: "autonomous_vehicles", version: "2.1.0", filename: "fleet-safety.epd", description: "Safety envelope for autonomous vehicle fleet coordination", ok: true,
        diagnostics: { errors: 0, warnings: 0 },
        invariants: [
          { name: "min_separation", severity: "critical", soft: false, predicate: "min(separation) >= 2.0", message: "Vehicles must maintain minimum separation" },
          { name: "speed_bound", severity: "critical", soft: false, predicate: "speed in [0, 120]", message: "Speed must stay within operational envelope" },
          { name: "braking_energy", severity: "high", soft: false, predicate: "braking_budget >= 0", message: "Braking energy budget must be non-negative" },
          { name: "comfort_jerk", severity: "low", soft: true, predicate: "abs(jerk) <= 2.5", message: "Jerk should stay within comfort bounds" },
        ],
        shardHealth: { total: 4, healthy: 3, repairing: 0, violating: 1, healthScore: 75 },
        mergeHistory: { total: 2, applied: 1, rejected: 0, successRate: 50, recent: [{ status: "applied", divergence: 0.08, iterations: 7, violations: ["min_separation", "speed_bound", "braking_energy"], createdAt: "2025-05-28T00:00:00Z" }] },
        ancestry: { proofKind: "mmr", zkEnabled: false, totalProofs: 1, zkProofs: 0, anchored: 1 },
        shadowBridge: { enabled: true, takeoverLatencyMs: 150, recentEvents: 2, authoritative: true },
        violations: [{ invariant: "min_separation", severity: "critical", soft: false, shardKey: "apac-east", repaired: true, driftDelta: 1.8, createdAt: "2025-05-28T00:00:00Z" }, { invariant: "speed_bound", severity: "critical", soft: false, shardKey: "apac-east", repaired: true, driftDelta: 14, createdAt: "2025-05-28T00:00:00Z" }],
        wasmFingerprint: "sha256:ghi789",
        compiledAt: "2025-06-01T00:00:00Z",
      },
      {
        id: "pol-4", name: "cold_chain_integrity", domain: "supply_chain", version: "1.2.0", filename: "cold-chain.epd", description: "Pharmaceutical cold-chain temperature integrity", ok: true,
        diagnostics: { errors: 0, warnings: 0 },
        invariants: [
          { name: "temp_range", severity: "critical", soft: false, predicate: "temperature in [2, 8]", message: "Temperature must stay within pharmacopeia range" },
          { name: "excursion_dose", severity: "high", soft: false, predicate: "excursion_minutes <= 30", message: "Cumulative excursion minutes must stay bounded" },
          { name: "humidity_range", severity: "low", soft: true, predicate: "humidity in [35, 65]", message: "Humidity should stay within recommended range" },
        ],
        shardHealth: { total: 3, healthy: 3, repairing: 0, violating: 0, healthScore: 100 },
        mergeHistory: { total: 1, applied: 0, rejected: 0, successRate: 100, recent: [] },
        ancestry: { proofKind: "mmr", zkEnabled: false, totalProofs: 2, zkProofs: 0, anchored: 2 },
        shadowBridge: { enabled: true, takeoverLatencyMs: 500, recentEvents: 2, authoritative: false },
        violations: [{ invariant: "humidity_range", severity: "low", soft: true, shardKey: "producer", repaired: false, driftDelta: 5.0, createdAt: "2025-05-20T00:00:00Z" }],
        wasmFingerprint: "sha256:jkl012",
        compiledAt: "2025-06-01T00:00:00Z",
      },
      {
        id: "pol-5", name: "financial_ledger_integrity", domain: "finance", version: "1.0.0", filename: "financial-ledger.epd", description: "Double-entry conservation and monotonic audit trail", ok: true,
        diagnostics: { errors: 0, warnings: 0 },
        invariants: [
          { name: "double_entry_conservation", severity: "critical", soft: false, predicate: "sum(debits) == sum(credits)", message: "Debits must equal credits" },
          { name: "non_negative_balances", severity: "critical", soft: false, predicate: "min(balances) >= 0", message: "No account may go negative" },
          { name: "monotonic_height", severity: "high", soft: false, predicate: "ledger_height >= prev_height", message: "Ledger height must never decrease" },
          { name: "settlement_lag", severity: "medium", soft: true, predicate: "settlement_lag <= 2", message: "Settlement lag should stay under 2 blocks" },
        ],
        shardHealth: { total: 4, healthy: 4, repairing: 0, violating: 0, healthScore: 100 },
        mergeHistory: { total: 2, applied: 2, rejected: 0, successRate: 100, recent: [{ status: "applied", divergence: 0.0, iterations: 1, violations: [], createdAt: "2025-05-20T00:00:00Z" }] },
        ancestry: { proofKind: "mmr", zkEnabled: true, totalProofs: 2, zkProofs: 2, anchored: 2 },
        shadowBridge: { enabled: false, takeoverLatencyMs: null, recentEvents: 0, authoritative: false },
        violations: [{ invariant: "settlement_lag", severity: "medium", soft: true, shardKey: "emea", repaired: true, driftDelta: 1.0, createdAt: "2025-05-10T00:00:00Z" }],
        wasmFingerprint: "sha256:mno345",
        compiledAt: "2025-06-01T00:00:00Z",
      },
      {
        id: "pol-6", name: "water_treatment_safety", domain: "water_utility", version: "0.8.0", filename: "water-treatment.epd", description: "Chemical dosing and pressure safety for municipal water treatment", ok: true,
        diagnostics: { errors: 0, warnings: 0 },
        invariants: [
          { name: "chlorine_residual", severity: "critical", soft: false, predicate: "chlorine_residual in [0.2, 4.0]", message: "Free chlorine residual must stay within potable bounds" },
          { name: "ph_range", severity: "critical", soft: false, predicate: "ph in [6.5, 8.5]", message: "pH must stay within regulatory range" },
          { name: "main_pressure", severity: "critical", soft: false, predicate: "main_pressure <= 8.5", message: "Main pressure must stay below pipe burst threshold" },
          { name: "turbidity", severity: "medium", soft: true, predicate: "turbidity <= 1.0", message: "Turbidity should stay below 1.0 NTU" },
        ],
        shardHealth: { total: 2, healthy: 1, repairing: 0, violating: 1, healthScore: 50 },
        mergeHistory: { total: 0, applied: 0, rejected: 0, successRate: 100, recent: [] },
        ancestry: { proofKind: "mmr", zkEnabled: false, totalProofs: 2, zkProofs: 0, anchored: 2 },
        shadowBridge: { enabled: true, takeoverLatencyMs: 120, recentEvents: 2, authoritative: true },
        violations: [{ invariant: "chlorine_residual", severity: "critical", soft: false, shardKey: "plant-north", repaired: true, driftDelta: 3.4, createdAt: "2025-06-01T00:00:00Z" }, { invariant: "ph_range", severity: "critical", soft: false, shardKey: "plant-north", repaired: true, driftDelta: 1.9, createdAt: "2025-06-01T00:00:00Z" }],
        wasmFingerprint: "sha256:pqr678",
        compiledAt: "2025-06-01T00:00:00Z",
      },
    ],
    compliance: {
      formalVerification: true,
      zkAnchored: 3,
      shadowReady: 4,
      zeroUnrepairedCriticalViolations: true,
      allShardsHealthy: false,
    },
  };

  return NextResponse.json(report);
}

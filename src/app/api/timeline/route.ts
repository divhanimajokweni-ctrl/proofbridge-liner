import { NextRequest, NextResponse } from "next/server";

// GET /api/timeline?policyId=...&limit=... — unified chronological event feed (mock data)
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const policyId = searchParams.get("policyId");
  const limit = Math.min(parseInt(searchParams.get("limit") ?? "80", 10), 200);
  const now = Date.now();

  const events = [
    // Merge events
    { id: "merge-t1", kind: "merge", at: new Date(now - 0 * 47000).toISOString(), policyName: "grid_frequency_stability", domain: "smart_grid", title: "Merge applied", detail: "europe-north → europe-west · div 0.12 · 3 iters", severity: "info", mergeStatus: "applied", divergence: 0.12, iterations: 3 },
    { id: "merge-t2", kind: "merge", at: new Date(now - 1 * 47000).toISOString(), policyName: "fleet_safety_envelope", domain: "autonomous_vehicles", title: "Merge applied", detail: "apac-east → apac-south · div 0.08 · 7 iters", severity: "info", mergeStatus: "applied", divergence: 0.08, iterations: 7 },
    { id: "merge-t3", kind: "merge", at: new Date(now - 2 * 47000).toISOString(), policyName: "hospital_census", domain: "public_health", title: "Merge rejected", detail: "hosp-7 → hosp-3 · div 1.24 · 200 iters", severity: "critical", mergeStatus: "rejected", divergence: 1.24, iterations: 200 },
    { id: "merge-t4", kind: "merge", at: new Date(now - 3 * 47000).toISOString(), policyName: "financial_ledger_integrity", domain: "finance", title: "Merge applied", detail: "emea → na-east · div 0.00 · 1 iters", severity: "info", mergeStatus: "applied", divergence: 0.0, iterations: 1 },
    { id: "merge-t5", kind: "merge", at: new Date(now - 4 * 47000).toISOString(), policyName: "water_treatment_safety", domain: "water_utility", title: "Merge applied", detail: "plant-north → plant-south · div 0.05 · 4 iters", severity: "info", mergeStatus: "applied", divergence: 0.05, iterations: 4 },
    { id: "merge-t6", kind: "merge", at: new Date(now - 5 * 47000).toISOString(), policyName: "grid_frequency_stability", domain: "smart_grid", title: "Merge rejected", detail: "manual → na-east · div 1.24 · 200 iters", severity: "critical", mergeStatus: "rejected", divergence: 1.24, iterations: 200 },
    // Shadow events
    { id: "shadow-t1", kind: "shadow", at: new Date(now - 6 * 47000).toISOString(), policyName: "grid_frequency_stability", domain: "smart_grid", title: "Shadow takeover", detail: "Shadow takeover on europe-west", severity: "critical", shadowKind: "takeover", divergence: 0.02 },
    { id: "shadow-t2", kind: "shadow", at: new Date(now - 7 * 47000).toISOString(), policyName: "water_treatment_safety", domain: "water_utility", title: "Twin divergence", detail: "Shadow divergence on plant-north", severity: "critical", shadowKind: "divergence", divergence: 0.04 },
    { id: "shadow-t3", kind: "shadow", at: new Date(now - 8 * 47000).toISOString(), policyName: "cold_chain_integrity", domain: "supply_chain", title: "Episode replay", detail: "Episode replay on transporter", severity: "info", shadowKind: "replay", divergence: 0.05 },
    { id: "shadow-t4", kind: "shadow", at: new Date(now - 9 * 47000).toISOString(), policyName: "fleet_safety_envelope", domain: "autonomous_vehicles", title: "What-if replay", detail: "What-if replay on AV-042", severity: "info", shadowKind: "whatif", divergence: 0.03 },
    { id: "shadow-t5", kind: "shadow", at: new Date(now - 10 * 47000).toISOString(), policyName: "cold_chain_integrity", domain: "supply_chain", title: "Authority handback", detail: "Authority handback on producer", severity: "info", shadowKind: "handback", divergence: 0.02 },
    // Violation events
    { id: "viol-t1", kind: "violation", at: new Date(now - 11 * 47000).toISOString(), policyName: "grid_frequency_stability", domain: "smart_grid", title: "Invariant breached: freq_bounds", detail: "europe-north · critical", severity: "critical", invariant: "freq_bounds", soft: false, repaired: false, actual: "50.6", expected: "[49.8, 50.2]" },
    { id: "viol-t2", kind: "violation", at: new Date(now - 12 * 47000).toISOString(), policyName: "fleet_safety_envelope", domain: "autonomous_vehicles", title: "Invariant breached: min_separation", detail: "apac-east · critical", severity: "critical", invariant: "min_separation", soft: false, repaired: true, actual: "1.2", expected: ">=2.0" },
    { id: "viol-t3", kind: "violation", at: new Date(now - 13 * 47000).toISOString(), policyName: "water_treatment_safety", domain: "water_utility", title: "Invariant breached: chlorine_residual", detail: "plant-north · critical", severity: "critical", invariant: "chlorine_residual", soft: false, repaired: true, actual: "5.2", expected: "[0.2, 4.0]" },
    { id: "viol-t4", kind: "violation", at: new Date(now - 14 * 47000).toISOString(), policyName: "grid_frequency_stability", domain: "smart_grid", title: "Invariant breached: thermal_headroom", detail: "europe-north · medium · soft · repaired", severity: "info", invariant: "thermal_headroom", soft: true, repaired: true, actual: "6", expected: ">=10" },
    { id: "viol-t5", kind: "violation", at: new Date(now - 15 * 47000).toISOString(), policyName: "cold_chain_integrity", domain: "supply_chain", title: "Invariant breached: humidity_range", detail: "producer · low · soft", severity: "info", invariant: "humidity_range", soft: true, repaired: false, actual: "30", expected: "[35, 65]" },
  ];

  const filtered = policyId
    ? events.filter((e) => e.policyName === policyId)
    : events;

  // Build histogram
  const buckets: { t: number; count: number; byKind: Record<string, number> }[] = [];
  for (let i = 23; i >= 0; i--) {
    const t = now - i * 3600_000;
    buckets.push({ t, count: 0, byKind: { merge: 0, shadow: 0, violation: 0 } });
  }

  return NextResponse.json({
    events: filtered.slice(0, limit),
    total: filtered.length,
    buckets,
    policyId,
  });
}

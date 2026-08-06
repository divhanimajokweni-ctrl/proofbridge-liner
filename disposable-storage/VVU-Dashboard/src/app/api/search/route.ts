import { NextRequest, NextResponse } from "next/server";

// GET /api/search?q=<query>&limit=... — global search across the runtime (mock data)
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const q = (searchParams.get("q") ?? "").trim().toLowerCase();
  const limit = Math.min(parseInt(searchParams.get("limit") ?? "30", 10), 60);

  if (!q || q.length < 1) {
    return NextResponse.json({ results: [], total: 0, q: "" });
  }

  // Pre-built mock search results — return matches based on query
  const allResults = [
    { type: "policy", id: "pol-1", title: "grid_frequency_stability", subtitle: "smart_grid · policy", detail: "Maintain grid frequency and energy balance across all regions", section: "studio" },
    { type: "policy", id: "pol-2", title: "hospital_census", subtitle: "public_health · policy", detail: "Privacy-preserving epidemic census reconciliation", section: "studio" },
    { type: "policy", id: "pol-3", title: "fleet_safety_envelope", subtitle: "autonomous_vehicles · policy", detail: "Safety envelope for autonomous vehicle fleet coordination", section: "studio" },
    { type: "policy", id: "pol-4", title: "cold_chain_integrity", subtitle: "supply_chain · policy", detail: "Pharmaceutical cold-chain temperature integrity", section: "studio" },
    { type: "policy", id: "pol-5", title: "financial_ledger_integrity", subtitle: "finance · policy", detail: "Double-entry conservation and monotonic audit trail", section: "studio" },
    { type: "policy", id: "pol-6", title: "water_treatment_safety", subtitle: "water_utility · policy", detail: "Chemical dosing and pressure safety for municipal water treatment", section: "studio" },
    { type: "invariant", id: "pol-1:freq_bounds", title: "freq_bounds", subtitle: "invariant · grid_frequency_stability", detail: "frequency in [49.8, 50.2]", section: "studio", severity: "critical" },
    { type: "invariant", id: "pol-1:energy_conservation", title: "energy_conservation", subtitle: "invariant · grid_frequency_stability", detail: "sum(generation) >= sum(load) + losses", section: "studio", severity: "critical" },
    { type: "invariant", id: "pol-3:min_separation", title: "min_separation", subtitle: "invariant · fleet_safety_envelope", detail: "min(separation) >= 2.0", section: "studio", severity: "critical" },
    { type: "invariant", id: "pol-4:temp_range", title: "temp_range", subtitle: "invariant · cold_chain_integrity", detail: "temperature in [2, 8]", section: "studio", severity: "critical" },
    { type: "invariant", id: "pol-6:chlorine_residual", title: "chlorine_residual", subtitle: "invariant · water_treatment_safety", detail: "chlorine_residual in [0.2, 4.0]", section: "studio", severity: "critical" },
    { type: "shard", id: "sh-1", title: "europe-west", subtitle: "shard · grid_frequency_stability", detail: "edge-01 · healthy · 3 peers", section: "topology" },
    { type: "shard", id: "sh-2", title: "europe-north", subtitle: "shard · grid_frequency_stability", detail: "edge-02 · violating · 2 peers", section: "topology" },
    { type: "shard", id: "sh-4", title: "apac-south", subtitle: "shard · fleet_safety_envelope", detail: "cloud-01 · healthy · 3 peers", section: "topology" },
    { type: "merge", id: "merge-1", title: "applied merge", subtitle: "merge · grid_frequency_stability", detail: "europe-north → europe-west · div 0.12", section: "merges" },
    { type: "merge", id: "merge-3", title: "applied merge", subtitle: "merge · fleet_safety_envelope", detail: "apac-east → apac-south · div 0.08", section: "merges" },
    { type: "merge", id: "merge-4", title: "rejected merge", subtitle: "merge · hospital_census", detail: "hosp-7 → hosp-3 · div 1.24", section: "merges" },
    { type: "proof", id: "proof-1", title: "mmr_root_abc", subtitle: "proof · grid_frequency_stability", detail: "europe-west · ZK · anchored", section: "proofs" },
    { type: "proof", id: "proof-5", title: "mmr_root_ledger", subtitle: "proof · financial_ledger_integrity", detail: "emea · ZK · anchored", section: "proofs" },
    { type: "shadow", id: "shadow-1", title: "takeover", subtitle: "shadow · grid_frequency_stability", detail: "Shadow takeover on europe-west", section: "shadow" },
    { type: "shadow", id: "shadow-4", title: "handback", subtitle: "shadow · fleet_safety_envelope", detail: "Authority handback on AV-042", section: "shadow" },
    { type: "mined", id: "mined-1", title: "ramp_rate <= 5", subtitle: "mined · grid_frequency_stability", detail: "Detected frequency instability correlates with ramp rates > 5 MW/min", section: "miner", severity: "medium" },
    { type: "mined", id: "mined-2", title: "phase_imbalance <= 3", subtitle: "mined · grid_frequency_stability", detail: "Historical drift shows phase imbalance precedes grid splits", section: "miner", severity: "high" },
  ];

  const results = allResults.filter((r) => {
    const hay = `${r.title} ${r.subtitle} ${r.detail} ${r.type}`.toLowerCase();
    return hay.includes(q);
  });

  // Rank by relevance
  const scored = results
    .map((r) => {
      let score = 0;
      if (r.title.toLowerCase() === q) score += 100;
      else if (r.title.toLowerCase().includes(q)) score += 50;
      if (r.subtitle.toLowerCase().includes(q)) score += 20;
      if (r.detail.toLowerCase().includes(q)) score += 10;
      return { r, score };
    })
    .sort((a, b) => b.score - a.score);

  const finalResults = scored.slice(0, limit).map((s) => s.r);

  return NextResponse.json({
    results: finalResults,
    total: results.length,
    q,
  });
}

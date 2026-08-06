import { NextResponse } from "next/server";

// GET /api/export — Export dashboard data as CSV or JSON (mock data)
export async function GET(req: Request) {
  const url = new URL(req.url);
  const format = url.searchParams.get("format") ?? "csv";
  const scope = url.searchParams.get("scope") ?? "all";

  // --- JSON export ---
  if (format === "json") {
    const policies = [
      { id: "pol-1", name: "grid_frequency_stability", domain: "smart_grid", version: "1.0.0", ok: true, errorCount: 0, warningCount: 0, invariantCount: 3, shardCount: 1, shardStrategy: "locality_preserving", repairStrategy: "self_repair", zkEnabled: true, shadowEnabled: true, createdAt: "2025-01-01T00:00:00Z", updatedAt: "2025-06-01T00:00:00Z", shards: [{ id: "sh-1", shardKey: "geo_region", region: "europe-west", invariantStatus: "healthy", peerCount: 3 }] },
      { id: "pol-2", name: "hospital_census", domain: "public_health", version: "0.9.0", ok: true, errorCount: 0, warningCount: 0, invariantCount: 3, shardCount: 1, shardStrategy: "hash", repairStrategy: "self_repair", zkEnabled: true, shadowEnabled: false, createdAt: "2025-01-01T00:00:00Z", updatedAt: "2025-06-01T00:00:00Z", shards: [{ id: "sh-4", shardKey: "facility_id", region: "europe-west", invariantStatus: "healthy", peerCount: 2 }] },
      { id: "pol-3", name: "fleet_safety_envelope", domain: "autonomous_vehicles", version: "2.1.0", ok: true, errorCount: 0, warningCount: 0, invariantCount: 4, shardCount: 1, shardStrategy: "subsystem", repairStrategy: "self_repair", zkEnabled: false, shadowEnabled: true, createdAt: "2025-01-01T00:00:00Z", updatedAt: "2025-06-01T00:00:00Z", shards: [{ id: "sh-5", shardKey: "vehicle_id", region: "apac-south", invariantStatus: "healthy", peerCount: 3 }] },
      { id: "pol-4", name: "cold_chain_integrity", domain: "supply_chain", version: "1.2.0", ok: true, errorCount: 0, warningCount: 0, invariantCount: 3, shardCount: 1, shardStrategy: "subsystem", repairStrategy: "quarantine", zkEnabled: false, shadowEnabled: true, createdAt: "2025-01-01T00:00:00Z", updatedAt: "2025-06-01T00:00:00Z", shards: [{ id: "sh-6", shardKey: "custody_stage", region: "europe-west", invariantStatus: "healthy", peerCount: 2 }] },
      { id: "pol-5", name: "financial_ledger_integrity", domain: "finance", version: "1.0.0", ok: true, errorCount: 0, warningCount: 0, invariantCount: 4, shardCount: 1, shardStrategy: "locality_preserving", repairStrategy: "reject", zkEnabled: true, shadowEnabled: false, createdAt: "2025-01-01T00:00:00Z", updatedAt: "2025-06-01T00:00:00Z", shards: [{ id: "sh-7", shardKey: "ledger_region", region: "emea", invariantStatus: "healthy", peerCount: 3 }] },
      { id: "pol-6", name: "water_treatment_safety", domain: "water_utility", version: "0.8.0", ok: true, errorCount: 0, warningCount: 0, invariantCount: 4, shardCount: 1, shardStrategy: "subsystem", repairStrategy: "self_repair", zkEnabled: false, shadowEnabled: true, createdAt: "2025-01-01T00:00:00Z", updatedAt: "2025-06-01T00:00:00Z", shards: [{ id: "sh-8", shardKey: "plant_unit", region: "europe-west", invariantStatus: "healthy", peerCount: 3 }] },
    ];
    const shards = [
      { id: "sh-1", shardKey: "geo_region", region: "europe-west", nodeId: "edge-01", invariantStatus: "healthy", peerCount: 3, lastMergeAt: "2025-06-01T00:00:00Z", createdAt: "2025-01-01T00:00:00Z", updatedAt: "2025-06-01T00:00:00Z" },
      { id: "sh-2", shardKey: "geo_region", region: "europe-north", nodeId: "edge-02", invariantStatus: "violating", peerCount: 2, lastMergeAt: "2025-06-01T00:00:00Z", createdAt: "2025-01-01T00:00:00Z", updatedAt: "2025-06-01T00:00:00Z" },
      { id: "sh-3", shardKey: "geo_region", region: "na-east", nodeId: "edge-03", invariantStatus: "repairing", peerCount: 4, lastMergeAt: null, createdAt: "2025-01-01T00:00:00Z", updatedAt: "2025-06-01T00:00:00Z" },
      { id: "sh-4", shardKey: "vehicle_id", region: "apac-south", nodeId: "cloud-01", invariantStatus: "healthy", peerCount: 3, lastMergeAt: "2025-06-01T00:00:00Z", createdAt: "2025-01-01T00:00:00Z", updatedAt: "2025-06-01T00:00:00Z" },
      { id: "sh-5", shardKey: "vehicle_id", region: "apac-east", nodeId: "cloud-02", invariantStatus: "violating", peerCount: 2, lastMergeAt: null, createdAt: "2025-01-01T00:00:00Z", updatedAt: "2025-06-01T00:00:00Z" },
    ];
    const violations = [
      { id: "viol-1", invariant: "freq_bounds", severity: "critical", soft: false, shardKey: "europe-north", actual: "50.6", expected: "[49.8, 50.2]", repaired: false, driftDelta: 2.4, createdAt: "2025-06-01T00:00:00Z" },
      { id: "viol-2", invariant: "thermal_headroom", severity: "medium", soft: true, shardKey: "europe-north", actual: "6", expected: ">=10", repaired: true, driftDelta: 4.0, createdAt: "2025-05-30T00:00:00Z" },
      { id: "viol-3", invariant: "min_separation", severity: "critical", soft: false, shardKey: "apac-east", actual: "1.2", expected: ">=2.0", repaired: true, driftDelta: 1.8, createdAt: "2025-05-28T00:00:00Z" },
      { id: "viol-4", invariant: "chlorine_residual", severity: "critical", soft: false, shardKey: "plant-north", actual: "5.2", expected: "[0.2, 4.0]", repaired: true, driftDelta: 3.4, createdAt: "2025-06-01T00:00:00Z" },
    ];
    const merges = [
      { id: "merge-1", sourceShardName: "europe-north", targetShard: "europe-west", status: "applied", divergence: 0.12, iterations: 3, createdAt: "2025-06-01T00:00:00Z" },
      { id: "merge-2", sourceShardName: "manual", targetShard: "na-east", status: "rejected", divergence: 1.24, iterations: 200, createdAt: "2025-05-30T00:00:00Z" },
      { id: "merge-3", sourceShardName: "apac-east", targetShard: "apac-south", status: "applied", divergence: 0.08, iterations: 7, createdAt: "2025-05-28T00:00:00Z" },
      { id: "merge-5", sourceShardName: "emea", targetShard: "na-east", status: "applied", divergence: 0.0, iterations: 1, createdAt: "2025-05-20T00:00:00Z" },
    ];

    return NextResponse.json({
      policies,
      shards,
      violations,
      merges,
      exportedAt: new Date().toISOString(),
      version: "0.6",
    });
  }

  // --- CSV export ---
  const csvParts: string[] = [];

  if (scope === "all" || scope === "policies") {
    csvParts.push("# Policies");
    csvParts.push("id,name,domain,version,ok,errorCount,warningCount,invariantCount,shardCount,shardStrategy,repairStrategy,zkEnabled,shadowEnabled,createdAt");
    csvParts.push('pol-1,"grid_frequency_stability","smart_grid","1.0.0",true,0,0,3,1,locality_preserving,self_repair,true,true,2025-01-01T00:00:00Z');
    csvParts.push('pol-2,"hospital_census","public_health","0.9.0",true,0,0,3,1,hash,self_repair,true,false,2025-01-01T00:00:00Z');
    csvParts.push('pol-3,"fleet_safety_envelope","autonomous_vehicles","2.1.0",true,0,0,4,1,subsystem,self_repair,false,true,2025-01-01T00:00:00Z');
    csvParts.push('pol-4,"cold_chain_integrity","supply_chain","1.2.0",true,0,0,3,1,subsystem,quarantine,false,true,2025-01-01T00:00:00Z');
    csvParts.push('pol-5,"financial_ledger_integrity","finance","1.0.0",true,0,0,4,1,locality_preserving,reject,true,false,2025-01-01T00:00:00Z');
    csvParts.push('pol-6,"water_treatment_safety","water_utility","0.8.0",true,0,0,4,1,subsystem,self_repair,false,true,2025-01-01T00:00:00Z');
    csvParts.push("");
  }

  if (scope === "all" || scope === "shards") {
    csvParts.push("# Shards");
    csvParts.push("id,shardKey,region,nodeId,invariantStatus,peerCount,lastMergeAt");
    csvParts.push('sh-1,"geo_region","europe-west","edge-01",healthy,3,2025-06-01T00:00:00Z');
    csvParts.push('sh-2,"geo_region","europe-north","edge-02",violating,2,2025-06-01T00:00:00Z');
    csvParts.push('sh-3,"geo_region","na-east","edge-03",repairing,4,');
    csvParts.push('sh-4,"vehicle_id","apac-south","cloud-01",healthy,3,2025-06-01T00:00:00Z');
    csvParts.push('sh-5,"vehicle_id","apac-east","cloud-02",violating,2,');
    csvParts.push("");
  }

  if (scope === "all" || scope === "violations") {
    csvParts.push("# Invariant Violations (last 100)");
    csvParts.push("id,invariant,severity,soft,shardKey,actual,expected,repaired,driftDelta,createdAt");
    csvParts.push('viol-1,"freq_bounds",critical,false,"europe-north","50.6","[49.8, 50.2]",false,2.4,2025-06-01T00:00:00Z');
    csvParts.push('viol-2,"thermal_headroom",medium,true,"europe-north","6",">=10",true,4.0,2025-05-30T00:00:00Z');
    csvParts.push('viol-3,"min_separation",critical,false,"apac-east","1.2",">=2.0",true,1.8,2025-05-28T00:00:00Z');
    csvParts.push('viol-4,"chlorine_residual",critical,false,"plant-north","5.2","[0.2, 4.0]",true,3.4,2025-06-01T00:00:00Z');
    csvParts.push("");
  }

  if (scope === "all" || scope === "merges") {
    csvParts.push("# Merge Proposals (last 50)");
    csvParts.push("id,sourceShardName,targetShard,status,divergence,iterations,createdAt");
    csvParts.push('merge-1,"europe-north","europe-west",applied,0.12,3,2025-06-01T00:00:00Z');
    csvParts.push('merge-2,"manual","na-east",rejected,1.24,200,2025-05-30T00:00:00Z');
    csvParts.push('merge-3,"apac-east","apac-south",applied,0.08,7,2025-05-28T00:00:00Z');
    csvParts.push('merge-5,"emea","na-east",applied,0.0,1,2025-05-20T00:00:00Z');
    csvParts.push("");
  }

  const csvContent = csvParts.join("\n");

  return new NextResponse(csvContent, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="epistemic-export-${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  });
}

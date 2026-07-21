import { NextResponse } from "next/server";
import { db } from "@/lib/db";

// GET /api/export — Export dashboard data as CSV
export async function GET(req: Request) {
  const url = new URL(req.url);
  const format = url.searchParams.get("format") ?? "csv";
  const scope = url.searchParams.get("scope") ?? "all";

  try {
    const csvParts: string[] = [];

    if (scope === "all" || scope === "policies") {
      const policies = await db.policy.findMany({ select: { id: true, name: true, domain: true, version: true, ok: true, errorCount: true, warningCount: true, invariantCount: true, shardCount: true, shardStrategy: true, repairStrategy: true, zkEnabled: true, shadowEnabled: true, createdAt: true } });
      csvParts.push("# Policies");
      csvParts.push("id,name,domain,version,ok,errorCount,warningCount,invariantCount,shardCount,shardStrategy,repairStrategy,zkEnabled,shadowEnabled,createdAt");
      for (const p of policies) {
        csvParts.push(`${p.id},"${p.name}","${p.domain}",${p.version},${p.ok},${p.errorCount},${p.warningCount},${p.invariantCount},${p.shardCount},${p.shardStrategy},${p.repairStrategy},${p.zkEnabled},${p.shadowEnabled},${p.createdAt.toISOString()}`);
      }
      csvParts.push("");
    }

    if (scope === "all" || scope === "shards") {
      const shards = await db.shard.findMany({ select: { id: true, shardKey: true, region: true, nodeId: true, invariantStatus: true, peerCount: true, lastMergeAt: true } });
      csvParts.push("# Shards");
      csvParts.push("id,shardKey,region,nodeId,invariantStatus,peerCount,lastMergeAt");
      for (const s of shards) {
        csvParts.push(`${s.id},"${s.shardKey}","${s.region}","${s.nodeId}",${s.invariantStatus},${s.peerCount},${s.lastMergeAt?.toISOString() ?? ""}`);
      }
      csvParts.push("");
    }

    if (scope === "all" || scope === "violations") {
      const violations = await db.invariantViolation.findMany({ select: { id: true, invariant: true, severity: true, soft: true, shardKey: true, actual: true, expected: true, repaired: true, driftDelta: true, createdAt: true }, orderBy: { createdAt: "desc" }, take: 100 });
      csvParts.push("# Invariant Violations (last 100)");
      csvParts.push("id,invariant,severity,soft,shardKey,actual,expected,repaired,driftDelta,createdAt");
      for (const v of violations) {
        const esc = (s: string | null) => s ? `"${s.replace(/"/g, '""')}"` : '""';
        csvParts.push(`${v.id},${esc(v.invariant)},${v.severity},${v.soft},${esc(v.shardKey)},${esc(v.actual)},${esc(v.expected)},${v.repaired},${v.driftDelta ?? ""},${v.createdAt.toISOString()}`);
      }
      csvParts.push("");
    }

    if (scope === "all" || scope === "merges") {
      const merges = await db.mergeProposal.findMany({ select: { id: true, sourceShardName: true, targetShard: true, status: true, divergence: true, iterations: true, createdAt: true }, orderBy: { createdAt: "desc" }, take: 50 });
      csvParts.push("# Merge Proposals (last 50)");
      csvParts.push("id,sourceShardName,targetShard,status,divergence,iterations,createdAt");
      for (const m of merges) {
        csvParts.push(`${m.id},"${m.sourceShardName}","${m.targetShard}",${m.status},${m.divergence},${m.iterations},${m.createdAt.toISOString()}`);
      }
      csvParts.push("");
    }

    const csvContent = csvParts.join("\n");

    if (format === "json") {
      return NextResponse.json({
        exportedAt: new Date().toISOString(),
        scope,
        data: csvContent,
      });
    }

    return new NextResponse(csvContent, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="epistemic-export-${new Date().toISOString().slice(0, 10)}.csv"`,
      },
    });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Export failed" },
      { status: 500 },
    );
  }
}

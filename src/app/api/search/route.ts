import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { validateEpd, type PolicyNode } from "@/lib/epd";

// GET /api/search?q=<query>&limit=... — global search across the runtime.
// Aggregates results from policies, shards, invariants, merge proposals,
// ancestry proofs, shadow events, and mined invariants.
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const q = (searchParams.get("q") ?? "").trim().toLowerCase();
  const limit = Math.min(parseInt(searchParams.get("limit") ?? "30", 10), 60);

  if (!q || q.length < 1) {
    return NextResponse.json({ results: [], total: 0, q: "" });
  }

  type SearchResult = {
    type: "policy" | "shard" | "invariant" | "merge" | "proof" | "shadow" | "mined";
    id: string;
    title: string;
    subtitle: string;
    detail: string;
    section: string;
    href?: string;
    severity?: string;
  };

  const results: SearchResult[] = [];

  // Policies
  const policies = await db.policy.findMany({ take: 100 });
  for (const p of policies) {
    const hay = `${p.name} ${p.domain ?? ""} ${p.filename} ${p.description ?? ""}`.toLowerCase();
    if (hay.includes(q)) {
      results.push({
        type: "policy",
        id: p.id,
        title: p.name,
        subtitle: p.domain ?? "policy",
        detail: p.description ?? `${p.invariantCount} invariants · ${p.shardCount} shards`,
        section: "studio",
      });
    }
    // Search invariants within the policy source
    const result = validateEpd(p.source);
    const node = result.ast?.policies[0] as PolicyNode | undefined;
    if (node) {
      for (const inv of node.invariants) {
        const invHay = `${inv.name} ${inv.rawPredicate} ${inv.message ?? ""}`.toLowerCase();
        if (invHay.includes(q)) {
          results.push({
            type: "invariant",
            id: `${p.id}:${inv.name}`,
            title: inv.name,
            subtitle: `invariant · ${p.name}`,
            detail: inv.rawPredicate,
            section: "studio",
            severity: inv.severity,
          });
        }
      }
    }
  }

  // Shards
  const shards = await db.shard.findMany({
    take: 100,
    include: { policy: { select: { name: true } } },
  });
  for (const s of shards) {
    const hay = `${s.region} ${s.nodeId} ${s.shardKey} ${s.invariantStatus} ${s.policy.name}`.toLowerCase();
    if (hay.includes(q)) {
      results.push({
        type: "shard",
        id: s.id,
        title: s.region,
        subtitle: `shard · ${s.policy.name}`,
        detail: `${s.nodeId} · ${s.invariantStatus} · ${s.peerCount} peers`,
        section: "topology",
      });
    }
  }

  // Merges
  const merges = await db.mergeProposal.findMany({
    take: 50,
    orderBy: { createdAt: "desc" },
    include: { policy: { select: { name: true } } },
  });
  for (const m of merges) {
    const hay = `${m.status} ${m.sourceShardName} ${m.targetShard} ${m.policy.name} merge`.toLowerCase();
    if (hay.includes(q)) {
      results.push({
        type: "merge",
        id: m.id,
        title: `${m.status} merge`,
        subtitle: `merge · ${m.policy.name}`,
        detail: `${m.sourceShardName} → ${m.targetShard} · div ${m.divergence.toFixed(2)}`,
        section: "merges",
      });
    }
  }

  // Proofs
  const proofs = await db.ancestryProof.findMany({
    take: 50,
    orderBy: { createdAt: "desc" },
    include: { policy: { select: { name: true } } },
  });
  for (const pr of proofs) {
    const hay = `${pr.mmrRoot} ${pr.shardKey} ${pr.anchor ?? ""} ${pr.policy.name} proof ancestry mmr zk`.toLowerCase();
    if (hay.includes(q)) {
      results.push({
        type: "proof",
        id: pr.id,
        title: pr.mmrRoot,
        subtitle: `proof · ${pr.policy.name}`,
        detail: `${pr.shardKey} · ${pr.zkProof ? "ZK" : "MMR"}${pr.anchored ? " · anchored" : ""}`,
        section: "proofs",
      });
    }
  }

  // Shadow events
  const shadows = await db.shadowEvent.findMany({
    take: 50,
    orderBy: { createdAt: "desc" },
    include: { policy: { select: { name: true } } },
  });
  for (const s of shadows) {
    const hay = `${s.kind} ${s.summary} ${s.policy.name} shadow takeover whatif replay`.toLowerCase();
    if (hay.includes(q)) {
      results.push({
        type: "shadow",
        id: s.id,
        title: s.kind,
        subtitle: `shadow · ${s.policy.name}`,
        detail: s.summary,
        section: "shadow",
      });
    }
  }

  // Mined invariants
  const mined = await db.minedInvariant.findMany({
    take: 50,
    orderBy: { confidence: "desc" },
    include: { policy: { select: { name: true } } },
  });
  for (const m of mined) {
    const hay = `${m.predicate} ${m.rationale} ${(m.policy?.name ?? "")} mined`.toLowerCase();
    if (hay.includes(q)) {
      results.push({
        type: "mined",
        id: m.id,
        title: m.predicate,
        subtitle: `mined · ${m.policy?.name ?? "global"}`,
        detail: m.rationale,
        section: "miner",
        severity: m.severity,
      });
    }
  }

  // Rank: exact title matches first, then subtitle matches, then detail
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

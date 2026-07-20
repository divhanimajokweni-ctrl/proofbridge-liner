import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// GET /api/timeline?policyId=...&limit=... — unified chronological event feed
// Aggregates merge proposals, shadow events, and invariant violations into a
// single scrubable timeline for the Historical Replay view.
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const policyId = searchParams.get("policyId");
  const limit = Math.min(parseInt(searchParams.get("limit") ?? "80", 10), 200);

  const where = policyId ? { policyId } : undefined;

  const [merges, shadows, violations] = await Promise.all([
    db.mergeProposal.findMany({
      where,
      take: limit,
      orderBy: { createdAt: "desc" },
      include: { policy: { select: { name: true, domain: true } } },
    }),
    db.shadowEvent.findMany({
      where,
      take: limit,
      orderBy: { createdAt: "desc" },
      include: { policy: { select: { name: true, domain: true } } },
    }),
    db.invariantViolation.findMany({
      where,
      take: limit,
      orderBy: { createdAt: "desc" },
      include: { policy: { select: { name: true, domain: true } } },
    }),
  ]);

  type EventKind = "merge" | "shadow" | "violation";
  interface TimelineEvent {
    id: string;
    kind: EventKind;
    at: string;
    policyName: string;
    domain: string | null;
    title: string;
    detail: string;
    severity: "info" | "warning" | "critical";
    // kind-specific payload
    mergeStatus?: string;
    divergence?: number;
    iterations?: number;
    shadowKind?: string;
    invariant?: string;
    soft?: boolean;
    repaired?: boolean;
    actual?: string | null;
    expected?: string | null;
  }

  const events: TimelineEvent[] = [];

  for (const m of merges) {
    events.push({
      id: `merge-${m.id}`,
      kind: "merge",
      at: m.createdAt.toISOString(),
      policyName: m.policy.name,
      domain: m.policy.domain,
      title: `${m.status === "applied" ? "Merge applied" : m.status === "rejected" ? "Merge rejected" : "Merge proposed"}`,
      detail: `${m.sourceShardName} → ${m.targetShard} · div ${m.divergence.toFixed(2)} · ${m.iterations} iters`,
      severity: m.status === "rejected" ? "critical" : m.status === "applied" ? "info" : "warning",
      mergeStatus: m.status,
      divergence: m.divergence,
      iterations: m.iterations,
    });
  }

  for (const s of shadows) {
    const kindLabel: Record<string, string> = {
      takeover: "Shadow takeover",
      whatif: "What-if replay",
      replay: "Episode replay",
      divergence: "Twin divergence",
      handback: "Authority handback",
    };
    events.push({
      id: `shadow-${s.id}`,
      kind: "shadow",
      at: s.createdAt.toISOString(),
      policyName: s.policy.name,
      domain: s.policy.domain,
      title: kindLabel[s.kind] ?? s.kind,
      detail: s.summary,
      severity: s.kind === "takeover" || s.kind === "divergence" ? "critical" : "info",
      shadowKind: s.kind,
      divergence: s.divergence,
    });
  }

  for (const v of violations) {
    events.push({
      id: `violation-${v.id}`,
      kind: "violation",
      at: v.createdAt.toISOString(),
      policyName: v.policy.name,
      domain: v.policy.domain,
      title: `Invariant breached: ${v.invariant}`,
      detail: `${v.shardKey} · ${v.severity}${v.soft ? " · soft" : ""}${v.repaired ? " · repaired" : ""}`,
      severity: v.severity === "critical" ? "critical" : v.severity === "high" ? "warning" : "info",
      invariant: v.invariant,
      soft: v.soft,
      repaired: v.repaired,
      actual: v.actual,
      expected: v.expected,
    });
  }

  // Sort newest first
  events.sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime());

  // Build a histogram (events per hour, last 24h) for the timeline scrubber
  const now = Date.now();
  const buckets: { t: number; count: number; byKind: Record<string, number> }[] = [];
  for (let i = 23; i >= 0; i--) {
    const t = now - i * 3600_000;
    buckets.push({ t, count: 0, byKind: { merge: 0, shadow: 0, violation: 0 } });
  }
  for (const e of events) {
    const eTime = new Date(e.at).getTime();
    const idx = 23 - Math.floor((now - eTime) / 3600_000);
    if (idx >= 0 && idx < 24) {
      buckets[idx].count++;
      buckets[idx].byKind[e.kind]++;
    }
  }

  return NextResponse.json({
    events: events.slice(0, limit),
    total: events.length,
    buckets,
    policyId,
  });
}

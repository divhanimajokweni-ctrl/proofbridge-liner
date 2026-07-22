import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { validateEpd, evaluateInvariant, type PolicyNode } from "@/lib/epd";

// GET /api/shadow-bridge?policyId=... — shadow bridge overview
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const policyId = searchParams.get("policyId");
  const policies = await db.policy.findMany({
    where: policyId ? { id: policyId } : { shadowEnabled: true },
    include: {
      shadowEvents: { orderBy: { createdAt: "desc" }, take: 12 },
      shards: { take: 8 },
    },
  });

  // Build a live-vs-shadow comparison for each shadow-enabled policy
  const bridges = await Promise.all(
    policies.map(async (p) => {
      const result = validateEpd(p.source);
      const node = result.ast?.policies[0] as PolicyNode | undefined;
      const shard = p.shards[0];
      const liveState = shard ? JSON.parse(shard.state) : {};
      // The "shadow" state is a perturbed copy (simulated twin divergence)
      const shadowState = perturb(liveState);
      const liveInvariants = node
        ? node.invariants.map((inv) => evaluateInvariant(inv, liveState))
        : [];
      const shadowInvariants = node
        ? node.invariants.map((inv) => evaluateInvariant(inv, shadowState))
        : [];
      const divergence = liveInvariants.reduce((sum, ev, i) => {
        const sev = shadowInvariants[i];
        return sum + (ev.passed !== sev.passed ? 1 : 0);
      }, 0);
      return {
        policy: {
          id: p.id,
          name: p.name,
          domain: p.domain,
          shadowEnabled: p.shadowEnabled,
          takeoverLatencyMs: p.takeoverLatencyMs,
          authoritative: result.ast?.policies[0]?.shadowBridge?.authoritative ?? false,
        },
        liveState,
        shadowState,
        liveInvariants,
        shadowInvariants,
        divergence,
        events: p.shadowEvents,
      };
    }),
  );

  return NextResponse.json({ bridges });
}

// Simple perturbation: nudge numeric fields to simulate twin divergence
function perturb(state: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = { ...state };
  for (const [k, v] of Object.entries(out)) {
    if (typeof v === "number") {
      out[k] = v + (Math.random() - 0.5) * Math.max(2, Math.abs(v) * 0.04);
    }
    if (Array.isArray(v) && v.every((x) => typeof x === "number")) {
      out[k] = v.map((x) => x + (Math.random() - 0.5) * Math.max(2, Math.abs(x) * 0.05));
    }
  }
  return out;
}

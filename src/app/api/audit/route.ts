import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { validateEpd, type PolicyNode } from "@/lib/epd";

// GET /api/audit?policyId=... — generate a compliance audit report
// Aggregates policy state, shard health, merge history, violations, proofs,
// and shadow events into a structured, exportable report.
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const policyId = searchParams.get("policyId");

  const policies = await db.policy.findMany({
    where: policyId ? { id: policyId } : undefined,
    include: {
      shards: true,
      merges: { orderBy: { createdAt: "desc" }, take: 20 },
      proofs: { orderBy: { createdAt: "desc" }, take: 10 },
      violations: { orderBy: { createdAt: "desc" }, take: 20 },
      shadowEvents: { orderBy: { createdAt: "desc" }, take: 10 },
    },
  });

  const report = {
    generatedAt: new Date().toISOString(),
    reportId: `audit-${Date.now().toString(36)}`,
    scope: policyId ? "single-policy" : "global",
    summary: {
      policyCount: policies.length,
      totalShards: policies.reduce((n, p) => n + p.shards.length, 0),
      totalInvariants: policies.reduce((n, p) => n + p.invariantCount, 0),
      totalMerges: policies.reduce((n, p) => n + p.merges.length, 0),
      totalViolations: policies.reduce((n, p) => n + p.violations.length, 0),
      totalProofs: policies.reduce((n, p) => n + p.proofs.length, 0),
      zkPolicies: policies.filter((p) => p.zkEnabled).length,
      shadowEnabledPolicies: policies.filter((p) => p.shadowEnabled).length,
    },
    policies: policies.map((p) => {
      const result = validateEpd(p.source);
      const node = result.ast?.policies[0] as PolicyNode | undefined;
      const healthyShards = p.shards.filter((s) => s.invariantStatus === "healthy").length;
      const repairingShards = p.shards.filter((s) => s.invariantStatus === "repairing").length;
      const violatingShards = p.shards.filter((s) => s.invariantStatus === "violating").length;
      const appliedMerges = p.merges.filter((m) => m.status === "applied").length;
      const rejectedMerges = p.merges.filter((m) => m.status === "rejected").length;
      const zkProofs = p.proofs.filter((pr) => pr.zkProof).length;
      return {
        id: p.id,
        name: p.name,
        domain: p.domain,
        version: p.version,
        filename: p.filename,
        description: p.description,
        ok: p.ok,
        diagnostics: {
          errors: p.errorCount,
          warnings: p.warningCount,
        },
        invariants: node?.invariants.map((inv) => ({
          name: inv.name,
          severity: inv.severity,
          soft: inv.soft,
          predicate: inv.rawPredicate,
          message: inv.message,
        })) ?? [],
        shardHealth: {
          total: p.shards.length,
          healthy: healthyShards,
          repairing: repairingShards,
          violating: violatingShards,
          healthScore: p.shards.length
            ? Math.round(((healthyShards + repairingShards * 0.5) / p.shards.length) * 100)
            : 100,
        },
        mergeHistory: {
          total: p.merges.length,
          applied: appliedMerges,
          rejected: rejectedMerges,
          successRate: p.merges.length
            ? Math.round((appliedMerges / p.merges.length) * 100)
            : 100,
          recent: p.merges.slice(0, 5).map((m) => ({
            status: m.status,
            divergence: m.divergence,
            iterations: m.iterations,
            violations: JSON.parse(m.violations),
            createdAt: m.createdAt.toISOString(),
          })),
        },
        ancestry: {
          proofKind: p.proofKind,
          zkEnabled: p.zkEnabled,
          totalProofs: p.proofs.length,
          zkProofs,
          anchored: p.proofs.filter((pr) => pr.anchored).length,
        },
        shadowBridge: {
          enabled: p.shadowEnabled,
          takeoverLatencyMs: p.takeoverLatencyMs,
          recentEvents: p.shadowEvents.length,
          authoritative: node?.shadowBridge?.authoritative ?? false,
        },
        violations: p.violations.map((v) => ({
          invariant: v.invariant,
          severity: v.severity,
          soft: v.soft,
          shardKey: v.shardKey,
          repaired: v.repaired,
          driftDelta: v.driftDelta,
          createdAt: v.createdAt.toISOString(),
        })),
        wasmFingerprint: p.wasmFingerprint,
        compiledAt: p.updatedAt.toISOString(),
      };
    }),
    compliance: {
      // High-level compliance signals a regulator could check
      formalVerification: policies.every((p) => p.ok),
      zkAnchored: policies.filter((p) => p.zkEnabled).length,
      shadowReady: policies.filter((p) => p.shadowEnabled).length,
      zeroUnrepairedCriticalViolations: policies.every(
        (p) =>
          p.violations.filter((v) => v.severity === "critical" && !v.repaired).length === 0,
      ),
      allShardsHealthy: policies.every(
        (p) => p.shards.every((s) => s.invariantStatus === "healthy"),
      ),
    },
  };

  return NextResponse.json(report);
}

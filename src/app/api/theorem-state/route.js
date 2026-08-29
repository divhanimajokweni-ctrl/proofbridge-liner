import { NextResponse } from "next/server";
import { db } from "@/lib/db";
function studiVerdictFromGates(gates) {
  if (gates.length === 0) return "UNKNOWN";
  const allMet = gates.every(
    (g) => g.status === "GO" || g.status === "FILED" || g.status === "RESOLVED"
  );
  if (allMet) return "PROVEN";
  const anyBlocked = gates.some(
    (g) => g.status === "PENDING" || g.status === "NOT-FILED" || g.status === "BLOCKED"
  );
  if (anyBlocked) return "UNKNOWN";
  return "INCONCLUSIVE";
}
async function loadStudiGates() {
  try {
    const rows = await db.studiGate.findMany({ orderBy: { order: "asc" } });
    return rows.map((r) => ({
      id: r.id,
      slug: r.slug,
      label: r.label,
      description: r.description,
      status: r.status,
      note: r.note,
      order: r.order,
      updatedAt: r.updatedAt.toISOString()
    }));
  } catch (e) {
    return [];
  }
}
async function computeIveVerdict() {
  try {
    const claims = await db.claim.findMany({
      include: {
        authorizations: { orderBy: { createdAt: "desc" }, take: 1 },
        circuitEvents: { orderBy: { trippedAt: "desc" }, take: 1 }
      },
      orderBy: { createdAt: "asc" }
    });
    const iveClaims = claims.map((c) => {
      var _a, _b, _c, _d;
      const latestAuth = c.authorizations[0];
      const latestCb = c.circuitEvents[0];
      const authorized = latestAuth ? latestAuth.authorized : false;
      const breakerTripped2 = latestCb ? latestCb.triggered : false;
      return {
        id: c.id,
        title: c.title,
        description: c.description,
        claimType: c.claimType,
        state: c.state,
        intendedAction: c.intendedAction,
        safetyCritical: c.safetyCritical,
        authorized,
        breakerTripped: breakerTripped2,
        authorizationReason: (_a = latestAuth == null ? void 0 : latestAuth.reason) != null ? _a : "",
        authorizationUpdatedAt: (_b = latestAuth == null ? void 0 : latestAuth.createdAt.toISOString()) != null ? _b : null,
        breakerReason: (_c = latestCb == null ? void 0 : latestCb.reason) != null ? _c : "",
        breakerUpdatedAt: (_d = latestCb == null ? void 0 : latestCb.trippedAt.toISOString()) != null ? _d : null
      };
    });
    const totalClaims = claims.length;
    const authorizedClaims = iveClaims.filter((c) => c.authorized).length;
    const breakerTripped = iveClaims.some((c) => c.breakerTripped);
    const confidence = totalClaims > 0 ? authorizedClaims / totalClaims : 0;
    if (breakerTripped) {
      return {
        verdict: "INCONCLUSIVE",
        breaker: "TRIPPED",
        confidence,
        totalClaims,
        authorizedClaims,
        iveClaims
      };
    }
    if (totalClaims === 0 || authorizedClaims === 0) {
      return {
        verdict: "UNKNOWN",
        breaker: "NORMAL",
        confidence: 0,
        totalClaims,
        authorizedClaims,
        iveClaims
      };
    }
    if (confidence >= 0.5) {
      return {
        verdict: "PROVEN",
        breaker: "NORMAL",
        confidence,
        totalClaims,
        authorizedClaims,
        iveClaims
      };
    }
    return {
      verdict: "INCONCLUSIVE",
      breaker: "NORMAL",
      confidence,
      totalClaims,
      authorizedClaims,
      iveClaims
    };
  } catch (e) {
    return {
      verdict: "UNKNOWN",
      breaker: "NORMAL",
      confidence: 0,
      totalClaims: 0,
      authorizedClaims: 0,
      iveClaims: []
    };
  }
}
async function GET() {
  const studiGates = await loadStudiGates();
  const studiVerdict = studiVerdictFromGates(studiGates);
  const ive = await computeIveVerdict();
  return NextResponse.json({
    studiVerdict,
    iveVerdict: ive.verdict,
    breaker: ive.breaker,
    confidence: ive.confidence,
    studiGates,
    iveClaims: ive.iveClaims,
    iveSummary: {
      totalClaims: ive.totalClaims,
      authorizedClaims: ive.authorizedClaims,
      breaker: ive.breaker
    },
    evidenceBound: "Claim \u2264 Evidence \u2264 Verification \u2264 Authorization \u2264 Action",
    theorem: "EIS Theorem 5 \u2014 loss of evidence \u21D2 loss of verification \u21D2 loss of authorization \u21D2 breaker trips \u21D2 action blocked",
    lastUpdatedAt: (/* @__PURE__ */ new Date()).toISOString()
  });
}

export const dynamic = "force-dynamic";
export const revalidate = 0;
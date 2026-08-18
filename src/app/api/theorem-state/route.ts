/**
 * GET /api/theorem-state
 *
 * Derives the live theorem state that drives the Evolution Matrix and
 * any other status surface in the dashboard.
 *
 * Returns:
 *   studiVerdict: "UNKNOWN" | "INCONCLUSIVE" | "PROVEN"
 *   iveVerdict:  "UNKNOWN" | "INCONCLUSIVE" | "PROVEN"
 *   breaker:     "NORMAL" | "TRIPPED"
 *   confidence:  0..1   (authorized claims / total claims)
 *   studiGates:  per-gate status detail (for audit)
 *   iveClaims:   per-claim live state (id, title, claimType, state,
 *                authorized, breakerTripped, safetyCritical)
 *   iveSummary: claim + breaker summary (for audit)
 *   evidenceBound: static reminder of the trust chain
 *
 * STUDI verdict rules (the valve upstream of IVE):
 *   - Any gate PENDING / NOT-FILED / BLOCKED → UNKNOWN
 *   - All gates GO                       → PROVEN
 *   - Mixed DRAFT/READY                   → INCONCLUSIVE
 *
 * IVE verdict rules (Theorem 5 fail-closed bound):
 *   - breaker TRIPPED                         → INCONCLUSIVE (pulsing red)
 *   - breaker NORMAL && authorizedClaims == 0 → UNKNOWN
 *   - breaker NORMAL && authRatio >= 0.5     → PROVEN
 *   - breaker NORMAL && 0 < authRatio < 0.5  → INCONCLUSIVE
 *
 * "Latest record wins" semantics:
 *   - A claim is "authorised" iff its most recent Authorization record
 *     (by createdAt desc) has authorized=true.
 *   - A claim's breaker is "tripped" iff its most recent
 *     CircuitBreaker record (by trippedAt desc) has triggered=true.
 *   This is what makes the operator's AUTHORIZE/REVOKE and
 *   TRIP/RESET actions idempotent at the verdict level.
 *
 * The endpoint never throws — it always returns 200 with a valid
 * verdict. On any internal error it falls back to UNKNOWN/UNKNOWN/NORMAL
 * so the matrix renders a safe "warning hold" rather than a blank canvas.
 */

import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";
export const revalidate = 0;

// STUDI gate list — now persisted in the StudiGate table (seeded by
// `scripts/seed-studi-gates.ts`). This file is just the derivator.
//
// Status lattices:  PENDING / NOT-FILED / BLOCKED → UNKNOWN
//                   DRAFT / READY-MIXED           → INCONCLUSIVE
//                   GO / FILED / RESOLVED          → PROVEN
type GateStatus =
  | "GO"
  | "FILED"
  | "RESOLVED"
  | "DRAFT"
  | "PENDING"
  | "NOT-FILED"
  | "BLOCKED"
  | "READY";

interface Gate {
  id: string;
  slug: string;
  label: string;
  description: string;
  status: GateStatus;
  note: string;
  order: number;
  updatedAt: string;
}

function studiVerdictFromGates(
  gates: { status: GateStatus }[]
): "UNKNOWN" | "INCONCLUSIVE" | "PROVEN" {
  if (gates.length === 0) return "UNKNOWN";
  const allMet = gates.every((g) =>
    g.status === "GO" || g.status === "FILED" || g.status === "RESOLVED"
  );
  if (allMet) return "PROVEN";
  const anyBlocked = gates.some(
    (g) =>
      g.status === "PENDING" ||
      g.status === "NOT-FILED" ||
      g.status === "BLOCKED"
  );
  if (anyBlocked) return "UNKNOWN";
  return "INCONCLUSIVE";
}

async function loadStudiGates(): Promise<Gate[]> {
  try {
    const rows = await db.studiGate.findMany({ orderBy: { order: "asc" } });
    return rows.map((r) => ({
      id: r.id,
      slug: r.slug,
      label: r.label,
      description: r.description,
      status: r.status as GateStatus,
      note: r.note,
      order: r.order,
      updatedAt: r.updatedAt.toISOString(),
    }));
  } catch {
    // DB unavailable — return empty list; studiVerdictFromGates([]) → UNKNOWN
    return [];
  }
}

/**
 * Compute the IVE verdict from the live Claim + Authorization +
 * CircuitBreaker state. Uses "latest record wins" semantics —
 * see file header.
 *
 * Returns the verdict plus a flat per-claim array that the IVE Claim
 * Verification Injector component renders directly.
 */
async function computeIveVerdict(): Promise<{
  verdict: "UNKNOWN" | "INCONCLUSIVE" | "PROVEN";
  breaker: "NORMAL" | "TRIPPED";
  confidence: number;
  totalClaims: number;
  authorizedClaims: number;
  iveClaims: IveClaimRow[];
}> {
  try {
    const claims = await db.claim.findMany({
      include: {
        authorizations: { orderBy: { createdAt: "desc" }, take: 1 },
        circuitEvents: { orderBy: { trippedAt: "desc" }, take: 1 },
      },
      orderBy: { createdAt: "asc" },
    });

    const iveClaims: IveClaimRow[] = claims.map((c) => {
      const latestAuth = c.authorizations[0];
      const latestCb = c.circuitEvents[0];
      const authorized = latestAuth ? latestAuth.authorized : false;
      const breakerTripped = latestCb ? latestCb.triggered : false;
      return {
        id: c.id,
        title: c.title,
        description: c.description,
        claimType: c.claimType,
        state: c.state,
        intendedAction: c.intendedAction,
        safetyCritical: c.safetyCritical,
        authorized,
        breakerTripped,
        authorizationReason: latestAuth?.reason ?? "",
        authorizationUpdatedAt: latestAuth?.createdAt.toISOString() ?? null,
        breakerReason: latestCb?.reason ?? "",
        breakerUpdatedAt: latestCb?.trippedAt.toISOString() ?? null,
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
        iveClaims,
      };
    }
    if (totalClaims === 0 || authorizedClaims === 0) {
      return {
        verdict: "UNKNOWN",
        breaker: "NORMAL",
        confidence: 0,
        totalClaims,
        authorizedClaims,
        iveClaims,
      };
    }
    if (confidence >= 0.5) {
      return {
        verdict: "PROVEN",
        breaker: "NORMAL",
        confidence,
        totalClaims,
        authorizedClaims,
        iveClaims,
      };
    }
    return {
      verdict: "INCONCLUSIVE",
      breaker: "NORMAL",
      confidence,
      totalClaims,
      authorizedClaims,
      iveClaims,
    };
  } catch {
    // DB unavailable — fail safe: UNKNOWN + NORMAL breaker, no claims.
    return {
      verdict: "UNKNOWN",
      breaker: "NORMAL",
      confidence: 0,
      totalClaims: 0,
      authorizedClaims: 0,
      iveClaims: [],
    };
  }
}

export async function GET() {
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
      breaker: ive.breaker,
    },
    evidenceBound: "Claim ≤ Evidence ≤ Verification ≤ Authorization ≤ Action",
    theorem:
      "EIS Theorem 5 — loss of evidence ⇒ loss of verification ⇒ loss of authorization ⇒ breaker trips ⇒ action blocked",
    lastUpdatedAt: new Date().toISOString(),
  });
}

// ─── Types (exported for the client store) ──────────────────────────────────

export interface IveClaimRow {
  id: string;
  title: string;
  description: string;
  claimType: string;
  state: string;
  intendedAction: string;
  safetyCritical: boolean;
  authorized: boolean;
  breakerTripped: boolean;
  authorizationReason: string;
  authorizationUpdatedAt: string | null;
  breakerReason: string;
  breakerUpdatedAt: string | null;
}

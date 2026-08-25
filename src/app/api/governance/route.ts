import { NextResponse } from "next/server";
import { GOVERNANCE_ARTIFACTS } from "@/lib/ive/data";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /api/governance
 * Returns minted governance artifacts and CDE-bound regulator coverage.
 */
export async function GET() {
  const regulatorCoverage = [
    "SOC2",
    "FIC/FICA",
    "HPCSA",
    "SAICA",
    "NSC",
    "Constitution",
  ].map((r) => ({
    regulator: r,
    artifacts: GOVERNANCE_ARTIFACTS.filter((a) => a.regulator === r).length,
  }));

  return NextResponse.json({
    cde: "Common Data Environment · lifecycle-bound",
    pipeline: "zipenc · AES-256 · Fernet-KDF",
    artifacts: GOVERNANCE_ARTIFACTS,
    regulatorCoverage,
  });
}

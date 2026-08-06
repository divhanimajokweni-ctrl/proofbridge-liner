import { NextResponse } from "next/server";
import {
  buildFrozenContract,
  buildLedger,
  buildMetricsBundle,
  buildProvenanceChain,
} from "@/lib/ive/contract";
import { ARTIFACTS } from "@/lib/ive/evidence";

/**
 * GET /api/ive/artifacts
 * ----------------------
 * Returns the IVE evidence-package manifest plus the generated artifact
 * bodies (results, metrics, ledger, provenance). These mirror the
 * ive-output/ and outputs/ directories of the frozen submission.
 */
export async function GET() {
  const contract = buildFrozenContract();
  return NextResponse.json(
    {
      manifest: ARTIFACTS,
      generated_at: new Date().toISOString(),
      bodies: {
        "results.json": contract,
        "metrics.json": buildMetricsBundle(),
        "ledger.json": buildLedger(),
        "provenance.json": buildProvenanceChain(),
      },
    },
    { headers: { "Cache-Control": "no-store" } },
  );
}

import { NextResponse } from "next/server";
import { HBK_RUNS } from "@/lib/ive/data";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /api/hbk
 * Returns the latest HBK Mk-II kernel run table with computed speedup
 * statistics. Used by the dashboard and any external AIR consumers.
 */
export async function GET() {
  const withSpeedup = HBK_RUNS.map((r) => ({
    ...r,
    speedup: +(r.mcmcMs / r.hbkMs).toFixed(2),
    reductionPct: +((1 - r.hbkMs / r.mcmcMs) * 100).toFixed(1),
  }));

  const avgSpeedup =
    withSpeedup.reduce((s, r) => s + r.speedup, 0) / withSpeedup.length;
  const avgReduction =
    withSpeedup.reduce((s, r) => s + r.reductionPct, 0) / withSpeedup.length;

  return NextResponse.json({
    kernel: "HBK Mk-II",
    method: "Supervised Random Fourier Basis + GP-inferred mechanistic priors",
    runs: withSpeedup,
    stats: {
      avgSpeedup: +avgSpeedup.toFixed(2),
      avgReductionPct: +avgReduction.toFixed(1),
      activeConcurrent: withSpeedup.length,
    },
  });
}

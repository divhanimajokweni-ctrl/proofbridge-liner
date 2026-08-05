import { NextResponse } from "next/server";
import { buildFrozenContract } from "@/lib/ive/contract";

/**
 * GET /api/ive
 * ------------
 * Returns the frozen IVE result contract.
 *
 * This is the normalized contract consumed by the frontend Zustand store.
 * It mirrors /ive-output/results.json and enforces the zero-fabrication
 * rule: missing values are explicit.
 */
export async function GET() {
  const contract = buildFrozenContract();
  return NextResponse.json(contract, {
    headers: {
      "Cache-Control": "no-store",
      "X-IVE-Contract": "frozen",
    },
  });
}

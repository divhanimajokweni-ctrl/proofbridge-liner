import { NextResponse } from "next/server";
import { generateTrustRuntimeState } from "@/lib/dashboard/data-mappings";
import { seedIfEmpty } from "@/lib/seed";

// GET /api/trust-runtime — Trust Runtime Dashboard state
export async function GET() {
  try {
    // Ensure the database is seeded before querying
    await seedIfEmpty();
    const state = await generateTrustRuntimeState();
    return NextResponse.json(state);
  } catch (error) {
    console.error("Failed to generate trust runtime state:", error);
    return NextResponse.json(
      { error: "Failed to generate trust runtime state" },
      { status: 500 },
    );
  }
}

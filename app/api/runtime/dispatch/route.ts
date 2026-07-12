// ============================================================================
// VVU Trust Runtime — Command Dispatch Endpoint
// ============================================================================

import { NextRequest, NextResponse } from "next/server";
import { getRuntime } from "@/lib/trust-runtime/runtime";
import { Command } from "@/lib/trust-runtime/types";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body = await request.json();

    // Validate that the body looks like a command
    if (!body || !body.type) {
      return NextResponse.json(
        { error: "Invalid command: must include 'type'" },
        { status: 400 },
      );
    }

    const command = body as Command;
    const runtime = getRuntime();
    const events = await runtime.dispatch(command);

    return NextResponse.json({
      success: true,
      eventsProcessed: events.length,
      projections: runtime.getProjections(),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { error: message, success: false },
      { status: 500 },
    );
  }
}

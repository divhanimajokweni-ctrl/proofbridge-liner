// ============================================================================
// VVU Trust Runtime — SSE Endpoint
// ============================================================================
// Connects to the event stream. Clients reconnect with Last-Event-ID header.
// ============================================================================

import { NextRequest } from "next/server";
import { getRuntime } from "@/lib/trust-runtime/runtime";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(request: NextRequest): Promise<Response> {
  const runtime = getRuntime();

  // Support Last-Event-ID reconnection
  const lastEventId = request.headers.get("last-event-id");
  const lastSequence = lastEventId ? parseInt(lastEventId, 10) : 0;

  return runtime.sseTransport.connect(lastSequence);
}

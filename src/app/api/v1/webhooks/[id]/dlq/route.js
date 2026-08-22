import { NextResponse } from "next/server";
import { listDLQEntries } from "@/lib/webhook/dlq";
async function GET(req, ctx) {
  var _a, _b;
  const { id: webhookId } = await ctx.params;
  const url = new URL(req.url);
  const reasonParam = url.searchParams.get("reason");
  const unreplayedOnly = url.searchParams.get("unreplayed") === "true";
  const limit = Number((_a = url.searchParams.get("limit")) != null ? _a : "100");
  const offset = Number((_b = url.searchParams.get("offset")) != null ? _b : "0");
  const entries = await listDLQEntries({
    webhookId,
    reason: reasonParam != null ? reasonParam : void 0,
    unreplayedOnly,
    limit,
    offset
  });
  return NextResponse.json({ entries, count: entries.length });
}

export const runtime = "nodejs";
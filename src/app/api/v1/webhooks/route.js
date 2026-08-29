import { NextResponse } from "next/server";
import { createWebhook, listWebhooks } from "@/lib/webhook/publish";
async function POST(req) {
  var _a, _b;
  let body;
  try {
    body = await req.json();
  } catch (e) {
    return NextResponse.json(
      { error: "Invalid JSON body" },
      { status: 400 }
    );
  }
  if (!body.name || !body.url) {
    return NextResponse.json(
      { error: "Missing required fields: name, url" },
      { status: 400 }
    );
  }
  try {
    const u = new URL(body.url);
    if (u.protocol !== "https:" && u.protocol !== "http:") {
      throw new Error("Must be http(s)");
    }
  } catch (e) {
    return NextResponse.json(
      { error: "Invalid URL \u2014 must be a valid http(s) URL" },
      { status: 400 }
    );
  }
  try {
    const webhook = await createWebhook({
      name: body.name,
      url: body.url,
      type: (_a = body.type) != null ? _a : "custom",
      secret: body.secret,
      enabled: (_b = body.enabled) != null ? _b : true
    });
    return NextResponse.json(webhook, { status: 201 });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Unknown" },
      { status: 500 }
    );
  }
}
async function GET() {
  const webhooks = await listWebhooks();
  return NextResponse.json({ webhooks });
}

export const runtime = "nodejs";
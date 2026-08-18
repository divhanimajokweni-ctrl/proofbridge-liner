/**
 * VVU-IVE Webhook Subsystem — Webhook CRUD API
 * ----------------------------------------------------------------------------
 * POST /api/v1/webhooks          — Register a new webhook endpoint
 * GET  /api/v1/webhooks          — List all registered webhooks
 *
 * Per the v1.1 contract, this is the ONLY way to register a webhook endpoint.
 * Once registered, the webhook_id is used as the Kafka partition key for all
 * its deliveries (Pillar 1 ordering guarantee).
 */

import { NextRequest, NextResponse } from "next/server";
import { createWebhook, listWebhooks } from "@/lib/webhook/publish";
import type { WebhookType } from "@/lib/webhook";

export const runtime = "nodejs";

export async function POST(req: NextRequest): Promise<NextResponse> {
  let body: {
    name?: string;
    url?: string;
    type?: WebhookType;
    secret?: string;
    enabled?: boolean;
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON body" },
      { status: 400 },
    );
  }

  if (!body.name || !body.url) {
    return NextResponse.json(
      { error: "Missing required fields: name, url" },
      { status: 400 },
    );
  }

  // Validate URL
  try {
    const u = new URL(body.url);
    if (u.protocol !== "https:" && u.protocol !== "http:") {
      throw new Error("Must be http(s)");
    }
  } catch {
    return NextResponse.json(
      { error: "Invalid URL — must be a valid http(s) URL" },
      { status: 400 },
    );
  }

  try {
    const webhook = await createWebhook({
      name: body.name,
      url: body.url,
      type: body.type ?? "custom",
      secret: body.secret,
      enabled: body.enabled ?? true,
    });
    return NextResponse.json(webhook, { status: 201 });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Unknown" },
      { status: 500 },
    );
  }
}

export async function GET(): Promise<NextResponse> {
  const webhooks = await listWebhooks();
  return NextResponse.json({ webhooks });
}

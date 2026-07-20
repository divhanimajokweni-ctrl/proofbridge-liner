import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { seedIfEmpty } from "@/lib/seed";
import { validateEpd } from "@/lib/epd";

// Ensure the DB is seeded on first request (cold start safety).
async function ensureSeeded() {
  try {
    await seedIfEmpty();
  } catch {
    /* ignore race */
  }
}

// GET /api/policies — list all policies
export async function GET() {
  await ensureSeeded();
  const policies = await db.policy.findMany({
    orderBy: { createdAt: "asc" },
    include: { _count: { select: { shards: true, merges: true, violations: true } } },
  });
  return NextResponse.json({ policies });
}

// POST /api/policies — create a policy from .epd source
export async function POST(req: NextRequest) {
  await ensureSeeded();
  const body = await req.json().catch(() => ({}));
  const { source, filename } = body as { source?: string; filename?: string };
  if (!source) {
    return NextResponse.json(
      { error: "source is required" },
      { status: 400 },
    );
  }
  const result = validateEpd(source);
  if (!result.ok || !result.ast || result.ast.policies.length === 0) {
    return NextResponse.json(
      { error: "invalid .epd source", diagnostics: result.diagnostics },
      { status: 400 },
    );
  }
  const policy = result.ast.policies[0];
  const existing = await db.policy.findUnique({ where: { name: policy.name } });
  const data = {
    name: policy.name,
    filename: filename ?? `${policy.name}.epd`,
    source,
    domain: policy.domain ?? null,
    version: policy.version ?? null,
    description: policy.description ?? null,
    ok: result.ok,
    errorCount: result.diagnostics.filter((d) => d.level === "error").length,
    warningCount: result.diagnostics.filter((d) => d.level === "warning").length,
    invariantCount: policy.invariants.length,
    shardCount: policy.shard ? 1 : 0,
    shardKey: policy.shard?.key ?? null,
    shardStrategy: policy.shard?.strategy ?? null,
    repairStrategy: policy.onViolation?.strategy ?? null,
    zkEnabled: policy.ancestry?.zk ?? false,
    proofKind: policy.ancestry?.proof ?? null,
    shadowEnabled: policy.shadowBridge?.enabled ?? false,
    takeoverLatencyMs: policy.shadowBridge?.takeoverLatencyMs ?? null,
    wasmFingerprint: result.compiledEnforcer?.invariantFingerprints[0]?.hash ?? null,
  };
  let record;
  if (existing) {
    record = await db.policy.update({ where: { id: existing.id }, data });
  } else {
    record = await db.policy.create({ data });
  }
  return NextResponse.json({ policy: record, diagnostics: result.diagnostics });
}

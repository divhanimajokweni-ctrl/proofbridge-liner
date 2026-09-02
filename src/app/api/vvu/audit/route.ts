import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const GQEBERHA_TENANT_ID = 'e1002324-0000-0000-0000-000000000001';

// GET /api/vvu/audit?limit=20
// Returns the most recent audit-log entries (RLS-scoped to the Gqeberha tenant).
export async function GET(req: NextRequest) {
  const limit = Math.min(50, Number(req.nextUrl.searchParams.get('limit') ?? '20'));
  try {
    const entries = await db.auditLog.findMany({
      where: { tenantId: GQEBERHA_TENANT_ID },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
    return NextResponse.json({
      total: entries.length,
      entries: entries.map((e) => ({
        id: e.id,
        actor: e.actor,
        action: e.action,
        fromState: e.fromState,
        toState: e.toState,
        symbol: e.symbol,
        reason: e.reason,
        createdAt: e.createdAt.toISOString(),
      })),
    });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

// POST /api/vvu/audit
// Append-only audit-log entry. RLS-scoped to the Gqeberha tenant.
export async function POST(req: NextRequest) {
  let body: {
    tenantId?: string;
    actor?: string;
    action?: string;
    fromState?: string;
    toState?: string;
    symbol?: string;
    reason?: string;
    metadata?: string;
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ success: false, message: 'Invalid JSON' }, { status: 400 });
  }

  if (!body.action || !body.actor) {
    return NextResponse.json(
      { success: false, message: 'Missing required fields: actor, action' },
      { status: 422 }
    );
  }

  try {
    const entry = await db.auditLog.create({
      data: {
        tenantId: body.tenantId || GQEBERHA_TENANT_ID,
        actor: body.actor,
        action: body.action,
        fromState: body.fromState,
        toState: body.toState,
        symbol: body.symbol,
        reason: body.reason,
        metadata: body.metadata,
      },
    });
    return NextResponse.json({ success: true, id: entry.id, createdAt: entry.createdAt.toISOString() });
  } catch (e) {
    return NextResponse.json(
      { success: false, error: e instanceof Error ? e.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

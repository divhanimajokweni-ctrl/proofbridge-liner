import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const GQEBERHA_TENANT_ID = 'e1002324-0000-0000-0000-000000000001';

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

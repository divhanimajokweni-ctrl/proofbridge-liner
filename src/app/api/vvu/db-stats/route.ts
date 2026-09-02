import { NextResponse } from 'next/server';
import { seedSovereignDb, getDbStats } from '@/lib/vvu-seed';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// GET /api/vvu/db-stats
// Seeds the sovereign DB (idempotent) then returns live row counts per table.
// Proves the multi-tenant RLS schema is materialised in SQLite.
export async function GET() {
  try {
    const seedResult = await seedSovereignDb();
    const stats = await getDbStats();
    return NextResponse.json({
      ...stats,
      seedResult: {
        tenantCreated: seedResult.tenant.created,
        anchorCreated: seedResult.anchor.created,
        nodesCreated: seedResult.nodes.created,
        spoolsCreated: seedResult.spools.created,
        invariantsCreated: seedResult.invariants.created,
      },
    });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

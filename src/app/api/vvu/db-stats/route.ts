import { NextResponse } from 'next/server';
import { seedSovereignDb, getDbStats } from '@/lib/vvu-seed';
import { seedLedger } from '@/lib/vvu-ledger';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// GET /api/vvu/db-stats
// Seeds the sovereign DB + WORM ledger (idempotent) then returns live row
// counts per table. Proves the multi-tenant RLS schema is materialised in SQLite.
export async function GET() {
  try {
    const seedResult = await seedSovereignDb();
    const ledgerResult = await seedLedger();
    const stats = await getDbStats();
    return NextResponse.json({
      ...stats,
      seedResult: {
        tenantCreated: seedResult.tenant.created,
        anchorCreated: seedResult.anchor.created,
        nodesCreated: seedResult.nodes.created,
        spoolsCreated: seedResult.spools.created,
        invariantsCreated: seedResult.invariants.created,
        ledgerCreated: ledgerResult.created,
        ledgerTotal: ledgerResult.total,
      },
    });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

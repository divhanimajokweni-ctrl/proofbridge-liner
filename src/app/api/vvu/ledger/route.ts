import { NextResponse } from 'next/server';
import { seedLedger, getLedgerEntries } from '@/lib/vvu-ledger';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// GET /api/vvu/ledger
// Seeds the WORM ledger with the 15 manifest file hashes (idempotent) and
// returns all entries. Proves the ledger count > 0 after first call.
export async function GET() {
  try {
    const seedResult = await seedLedger();
    const entries = await getLedgerEntries();
    return NextResponse.json({
      ...seedResult,
      entries: entries.map((e) => ({
        id: e.id,
        fileId: e.fileId,
        filename: e.filename,
        sha256: e.sha256,
        sizeBytes: e.sizeBytes,
        verified: e.verified,
        tampered: e.tampered,
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

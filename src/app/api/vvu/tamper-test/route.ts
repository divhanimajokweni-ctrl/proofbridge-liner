import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const GQEBERHA_TENANT_ID = 'e1002324-0000-0000-0000-000000000001';

// POST /api/vvu/tamper-test
// Artificially flags one ledger entry as tampered (hash drift) to demo the
// active tamper alert. Clears the flag after 10s so the demo is repeatable.
// Body: { fileId?: string } (defaults to F01).
export async function POST(req: Request) {
  let body: { fileId?: string };
  try {
    body = await req.json();
  } catch {
    body = {};
  }

  const fileId = body.fileId ?? 'F01';

  try {
    const entry = await db.ledgerEntry.findUnique({
      where: {
        tenantId_fileId: {
          tenantId: GQEBERHA_TENANT_ID,
          fileId,
        },
      },
    });

    if (!entry) {
      return NextResponse.json(
        { success: false, message: `Ledger entry ${fileId} not found` },
        { status: 404 }
      );
    }

    // Flag as tampered with a bogus hash.
    await db.ledgerEntry.update({
      where: { id: entry.id },
      data: {
        tampered: true,
        sha256: 'TAMPERED_' + entry.sha256.slice(8),
      },
    });

    // Auto-clear after 10s so the demo is repeatable.
    setTimeout(async () => {
      try {
        const current = await db.ledgerEntry.findUnique({
          where: { tenantId_fileId: { tenantId: GQEBERHA_TENANT_ID, fileId } },
        });
        if (current && current.tampered) {
          // Restore the original hash from the manifest.
          const { RELEASE_MANIFEST } = await import('@/lib/vvu-release-manifest');
          const manifest = RELEASE_MANIFEST.find((f) => f.id === fileId);
          if (manifest) {
            await db.ledgerEntry.update({
              where: { id: current.id },
              data: { tampered: false, sha256: manifest.sha256 },
            });
          }
        }
      } catch {
        /* auto-clear failure is non-fatal */
      }
    }, 10000);

    return NextResponse.json({
      success: true,
      fileId,
      message: `Ledger entry ${fileId} flagged as tampered — alert should fire within 30s. Auto-clears in 10s.`,
    });
  } catch (e) {
    return NextResponse.json(
      { success: false, error: e instanceof Error ? e.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

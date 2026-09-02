import { db } from '@/lib/db';
import { RELEASE_MANIFEST } from './vvu-release-manifest';

const GQEBERHA_TENANT_ID = 'e1002324-0000-0000-0000-000000000001';

// Seed the WORM ledger with the 15 release-manifest file hashes.
// Idempotent: upserts by (tenantId, fileId). Returns the count of entries
// now in the ledger.

export async function seedLedger(): Promise<{ total: number; created: number; updated: number }> {
  let created = 0;
  let updated = 0;

  for (const f of RELEASE_MANIFEST) {
    const existing = await db.ledgerEntry.findUnique({
      where: {
        tenantId_fileId: {
          tenantId: GQEBERHA_TENANT_ID,
          fileId: f.id,
        },
      },
    });

    if (!existing) {
      await db.ledgerEntry.create({
        data: {
          tenantId: GQEBERHA_TENANT_ID,
          fileId: f.id,
          filename: f.filename,
          sha256: f.sha256,
          sizeBytes: f.sizeBytes,
          verified: true,
          tampered: false,
        },
      });
      created++;
    } else if (existing.sha256 !== f.sha256 || existing.filename !== f.filename) {
      // Update if the manifest changed (hash drift detection)
      await db.ledgerEntry.update({
        where: { id: existing.id },
        data: {
          filename: f.filename,
          sha256: f.sha256,
          sizeBytes: f.sizeBytes,
          verified: true,
          tampered: existing.sha256 !== f.sha256,
        },
      });
      updated++;
    }
  }

  const total = await db.ledgerEntry.count({ where: { tenantId: GQEBERHA_TENANT_ID } });
  return { total, created, updated };
}

export async function getLedgerEntries() {
  return db.ledgerEntry.findMany({
    where: { tenantId: GQEBERHA_TENANT_ID },
    orderBy: { fileId: 'asc' },
  });
}

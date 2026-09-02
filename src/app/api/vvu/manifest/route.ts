import { NextRequest, NextResponse } from 'next/server';
import { RELEASE_MANIFEST, RELEASE_STAMP, RELEASE_VERSION } from '@/lib/vvu-release-manifest';

export const dynamic = 'force-static';

export async function GET() {
  return NextResponse.json({
    stamp: RELEASE_STAMP,
    version: RELEASE_VERSION,
    total: RELEASE_MANIFEST.length,
    files: RELEASE_MANIFEST.map((f) => ({
      id: f.id,
      filename: f.filename,
      category: f.category,
      role: f.role,
      sizeBytes: f.sizeBytes,
      sha256: f.sha256,
    })),
  });
}

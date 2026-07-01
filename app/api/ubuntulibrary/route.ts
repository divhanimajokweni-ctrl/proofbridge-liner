/**
 * app/api/ubuntulibrary/route.ts
 *
 * Public UbuntuLibrary catalog API.
 * All assets are free and open-source. No auth required.
 */
import { NextRequest, NextResponse } from 'next/server';
import { listAssets, getCatalogStats, publishAsset } from '@/server/audio/library';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const category = searchParams.get('category') || undefined;
  const source = searchParams.get('source') || undefined;
  const search = searchParams.get('q') || undefined;
  const limit = parseInt(searchParams.get('limit') || '50', 10);
  const offset = parseInt(searchParams.get('offset') || '0', 10);
  const stats = searchParams.get('stats') === 'true';

  if (stats) {
    return NextResponse.json({
      ok: true,
      stats: getCatalogStats(),
    });
  }

  const assets = listAssets({ category, source, search, limit, offset });

  return NextResponse.json({
    ok: true,
    count: assets.length,
    assets,
  });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, description, category, tags, creator, source, archiveFile, version } = body;

    if (!name || !category || !creator) {
      return NextResponse.json(
        { ok: false, error: 'name, category, and creator required' },
        { status: 400 },
      );
    }

    const asset = publishAsset({
      name,
      description: description || '',
      category: category || 'tool',
      tags: tags || [],
      creator,
      source: source || 'safespace',
      archiveFile: archiveFile || `${source || 'safespace'}-${name.toLowerCase().replace(/\s+/g, '-')}.tar.gz`,
      version,
    });

    return NextResponse.json({ ok: true, asset });
  } catch (err: any) {
    return NextResponse.json(
      { ok: false, error: err.message || 'Publish failed' },
      { status: 500 },
    );
  }
}

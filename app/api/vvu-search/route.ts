import { NextRequest, NextResponse } from 'next/server';
import { getSampleInitialization, runVvuCrawler } from '@/src/lib/vvu-crawler/index.js';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function clampMaxResults(value: unknown): number {
  const numeric = Number(value);

  if (!Number.isFinite(numeric)) {
    return 24;
  }

  return Math.max(1, Math.min(100, Math.trunc(numeric)));
}

export async function GET() {
  const sample = await getSampleInitialization();
  return NextResponse.json(sample, {
    status: 200,
    headers: { 'Cache-Control': 'no-store' },
  });
}

export async function POST(request: NextRequest) {
  let body: { keyword?: string; maxResults?: number } = {};

  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { ok: false, error: 'INVALID_JSON', message: 'Request body must be valid JSON.' },
      { status: 400 },
    );
  }

  const keyword = String(body.keyword ?? '').trim();

  if (!keyword) {
    return NextResponse.json(
      { ok: false, error: 'VALIDATION_ERROR', message: 'keyword is required.' },
      { status: 400 },
    );
  }

  const result = await runVvuCrawler({
    keyword,
    maxResults: clampMaxResults(body.maxResults),
  });

  return NextResponse.json(
    { ok: true, result },
    {
      status: 200,
      headers: { 'Cache-Control': 'no-store' },
    },
  );
}

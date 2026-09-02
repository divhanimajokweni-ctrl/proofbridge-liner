import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';

// POST /api/vvu/verify-hash
// Server-side SHA-256 verification of a canonical byte stream.
// Demonstrates the zero-fabrication verification contract: the hash is
// computed, never typed. Returns the hex digest + duration.
export async function POST(req: NextRequest) {
  let body: { content?: string; filename?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ success: false, message: 'Invalid JSON' }, { status: 400 });
  }

  const content = body.content ?? '';
  if (!content) {
    return NextResponse.json(
      { success: false, message: 'Missing "content" field' },
      { status: 422 }
    );
  }

  const start = performance.now();
  const bytes = new TextEncoder().encode(content);
  const digest = await crypto.subtle.digest('SHA-256', bytes);
  const hex = Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
  const durationMs = performance.now() - start;

  return NextResponse.json({
    success: true,
    filename: body.filename ?? 'inline',
    sha256: hex,
    durationMs: Math.round(durationMs * 1000) / 1000,
    bytes: bytes.length,
    algorithm: 'SHA-256',
    verifiedAt: new Date().toISOString(),
  });
}

export async function GET() {
  return NextResponse.json({
    endpoint: '/api/vvu/verify-hash',
    method: 'POST',
    algorithm: 'SHA-256',
    note: 'Send { content: string, filename?: string } to receive the canonical SHA-256 digest.',
  });
}

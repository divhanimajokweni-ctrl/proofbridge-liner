import { NextRequest, NextResponse } from 'next/server';

const SAFEKRIPTE_LITE_URL = process.env.SAFEKRIPTE_LITE_URL ?? 'http://127.0.0.1:5096';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ email: string }> },
) {
  const { email } = await params;
  const normalizedEmail = decodeURIComponent(email).trim().toLowerCase();

  if (!normalizedEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
    return NextResponse.json({ error: 'Valid email required' }, { status: 400 });
  }

  try {
    const skRes = await fetch(`${SAFEKRIPTE_LITE_URL}/commons/v1/pubkey?email=${encodeURIComponent(normalizedEmail)}`, {
      signal: AbortSignal.timeout(3000),
    });

    if (!skRes.ok) {
      if (skRes.status === 404) {
        return NextResponse.json({ error: `No public key registered for ${normalizedEmail}` }, { status: 404 });
      }
      const errText = await skRes.text();
      return NextResponse.json({ error: `SafeKrypte lookup failed: ${errText}` }, { status: 502 });
    }

    const skData = await skRes.json();
    return NextResponse.json({ ok: true, data: skData?.data ?? skData }, { status: 200 });
  } catch (err) {
    return NextResponse.json({
      error: err instanceof Error ? err.message : 'Internal error',
    }, { status: 500 });
  }
}

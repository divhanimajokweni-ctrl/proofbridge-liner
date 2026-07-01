import { NextRequest, NextResponse } from 'next/server';

const SAFEKRIPTE_LITE_URL = process.env.SAFEKRIPTE_LITE_URL ?? 'http://127.0.0.1:5096';
const SAFELINER_LITE_URL = process.env.SAFELINER_LITE_URL ?? 'http://127.0.0.1:5097';

export async function POST(req: NextRequest) {
  const authHeader = req.headers.get('Authorization');
  if (!authHeader || authHeader !== `Bearer ${process.env.KERNEL_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { email } = body;

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: 'Valid email required' }, { status: 400 });
    }

    const normalizedEmail = email.trim().toLowerCase();

    // 1. Generate ED25519 key pair via SafeKrypte Lite
    const skRes = await fetch(`${SAFEKRIPTE_LITE_URL}/commons/v1/keygen`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: normalizedEmail }),
    });

    if (!skRes.ok) {
      const errText = await skRes.text();
      return NextResponse.json({ error: `SafeKrypte keygen failed: ${errText}` }, { status: 502 });
    }

    const skData = await skRes.json();

    // 2. Issue SafeLiner email identity credential
    const slRes = await fetch(`${SAFELINER_LITE_URL}/commons/v1/email-credential`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: normalizedEmail,
        display_name: body.display_name || normalizedEmail,
        public_key: skData?.data?.publicKey ?? '',
      }),
    });

    let credential = null;
    if (slRes.ok) {
      const slData = await slRes.json();
      credential = slData?.data?.credential ?? null;
    }

    return NextResponse.json({
      ok: true,
      data: {
        email: normalizedEmail,
        publicKey: skData?.data?.publicKey ?? null,
        keyId: skData?.data?.keyId ?? null,
        algorithm: skData?.data?.algorithm ?? 'ED25519',
        credential,
        verifyUrl: credential ? `/api/email/directory/${normalizedEmail}` : null,
      },
    }, { status: 200 });
  } catch (err) {
    return NextResponse.json({
      error: err instanceof Error ? err.message : 'Internal error',
    }, { status: 500 });
  }
}

/**
 * POST /api/vvu/paystack/initiate
 * ================================
 * Initializes a Paystack transaction server-side. This keeps the
 * PAYSTACK_SECRET_KEY off the client — the frontend only gets back the
 * authorization_url + access_code to redirect/open the Paystack inline modal.
 *
 * Request body:
 *   { tier: "pro" | "max" | "enterprise" }
 *
 * Response (LIVE mode — Paystack configured):
 *   { source: "live", authorization_url, reference, access_code }
 *
 * Response (DEMO mode — Paystack not configured):
 *   { source: "demo", reference, message: "Paystack not configured — DEMO upgrade" }
 *   The frontend treats this as a successful upgrade for testing.
 */
import { NextResponse } from 'next/server';

const TIER_PRICES: Record<string, number> = {
  pro: 35000,        // R350.00 (in kobo)
  max: 80000,        // R800.00
  enterprise: 150000 // R1,500.00
};

const TIER_NAMES: Record<string, string> = {
  pro: 'VVU Pro',
  max: 'VVU Max',
  enterprise: 'VVU Enterprise',
};

export async function POST(req: Request) {
  let body: { tier?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const tier = body.tier;
  if (!tier || !TIER_PRICES[tier]) {
    return NextResponse.json({ error: 'Invalid tier. Must be pro, max, or enterprise.' }, { status: 400 });
  }

  const amount = TIER_PRICES[tier];
  const paystackSecret = process.env.PAYSTACK_SECRET_KEY;

  // ── DEMO MODE: Paystack not configured ──────────────────────────────
  if (!paystackSecret || paystackSecret === 'pk_live_YOUR_PAYSTACK_PUBLIC_KEY') {
    const reference = `VVU-DEMO-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    return NextResponse.json({
      source: 'demo',
      reference,
      tier,
      amount,
      message: `DEMO upgrade to ${TIER_NAMES[tier]} — no real charge. Set PAYSTACK_SECRET_KEY in .env to go live.`,
    });
  }

  // ── LIVE MODE: call Paystack /transaction/initialize ───────────────
  try {
    // The user's email + id would come from Supabase Auth in a real session.
    // For this demo, we use a placeholder — the frontend should pass the
    // logged-in user's email via the request body in production.
    const email = body.email || 'demo@vvu.example';
    const userId = body.userId || 'demo-user';

    const reference = `VVU-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

    const resp = await fetch('https://api.paystack.co/transaction/initialize', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${paystackSecret}`,
      },
      body: JSON.stringify({
        email,
        amount,
        currency: 'ZAR',
        reference,
        metadata: {
          userId,
          tier,
          email,
          custom_fields: [
            { display_name: 'User ID', variable_name: 'userId', value: userId },
            { display_name: 'Tier', variable_name: 'tier', value: tier },
          ],
        },
      }),
    });

    if (!resp.ok) {
      const errText = await resp.text();
      console.error('[/api/vvu/paystack/initiate] Paystack error:', errText);
      return NextResponse.json(
        { source: 'error', error: `Paystack error: ${resp.status}`, details: errText },
        { status: 502 }
      );
    }

    const data = await resp.json();
    return NextResponse.json({
      source: 'live',
      reference,
      tier,
      amount,
      authorization_url: data.data.authorization_url,
      access_code: data.data.access_code,
    });
  } catch (err) {
    console.error('[/api/vvu/paystack/initiate] Failed:', err);
    return NextResponse.json(
      { source: 'error', error: err instanceof Error ? err.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

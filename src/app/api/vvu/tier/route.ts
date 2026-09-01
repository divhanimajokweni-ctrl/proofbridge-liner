/**
 * GET /api/vvu/tier
 * =================
 * Returns the current user's tier. In DEMO mode (no Supabase configured),
 * returns 'open'. In LIVE mode, calls the Supabase `get_user_tier()` RPC.
 */
import { NextResponse } from 'next/server';

export async function GET() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey  = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceKey) {
    return NextResponse.json({ source: 'demo', tier: 'open' });
  }

  try {
    const resp = await fetch(`${supabaseUrl}/rest/v1/rpc/get_user_tier`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        apikey: serviceKey,
        Authorization: `Bearer ${serviceKey}`,
      },
      body: '{}',
    });

    if (!resp.ok) throw new Error(`Supabase RPC failed: ${resp.status}`);
    const tier = await resp.json();
    return NextResponse.json({ source: 'rls-live', tier: tier || 'open' });
  } catch (err) {
    console.error('[/api/vvu/tier] Supabase call failed:', err);
    return NextResponse.json({ source: 'demo-fallback', tier: 'open' });
  }
}

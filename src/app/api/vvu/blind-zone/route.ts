/**
 * GET /api/vvu/blind-zone
 * =======================
 * Returns Blind Zone geospatial data for the Gqeberha area.
 *
 * In DEMO mode (no Supabase): returns an empty array with a `locked: true`
 * flag, signalling the frontend to show the "Upgrade to Max/Enterprise"
 * message. This matches the RLS policy that blocks open/pro users.
 *
 * In LIVE mode: calls the `get_blind_zone(lat_min, lat_max, lng_min, lng_max)`
 * Supabase RPC function. The RLS policy inside that function enforces that
 * only max/enterprise tiers get any rows back.
 */
import { NextResponse } from 'next/server';

// Default bounding box: Gqeberha city center ±0.02°
const DEFAULT_BBOX = { lat_min: -33.97, lat_max: -33.95, lng_min: 25.59, lng_max: 25.61 };

export async function GET() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey  = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceKey) {
    // DEMO mode — Blind Zone is locked (open tier can't see it)
    return NextResponse.json({
      source: 'demo',
      tier: 'open',
      locked: true,
      message: 'Blind Zone data requires Max or Enterprise tier. Upgrade to access Mbilini geospatial intelligence.',
      entries: [],
    });
  }

  try {
    const resp = await fetch(`${supabaseUrl}/rest/v1/rpc/get_blind_zone`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        apikey: serviceKey,
        Authorization: `Bearer ${serviceKey}`,
      },
      body: JSON.stringify(DEFAULT_BBOX),
    });

    if (!resp.ok) throw new Error(`Supabase RPC failed: ${resp.status}`);
    const entries = await resp.json();
    return NextResponse.json({
      source: 'rls-live',
      tier: 'max-or-enterprise', // if we got rows back, the RLS policy let us through
      locked: false,
      entries: entries || [],
    });
  } catch (err) {
    console.error('[/api/vvu/blind-zone] Supabase call failed:', err);
    return NextResponse.json({
      source: 'demo-fallback',
      tier: 'open',
      locked: true,
      message: 'Blind Zone data requires Max or Enterprise tier.',
      entries: [],
    });
  }
}

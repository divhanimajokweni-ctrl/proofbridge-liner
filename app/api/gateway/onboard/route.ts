/**
 * app/api/gateway/onboard/route.ts
 *
 * Account creation endpoint.
 * Provisions new user with tier-appropriate services via Supabase Auth + database.
 * FILESYSTEM-FREE: compatible with Vercel serverless (read-only /var/task/).
 *
 * Flow:
 *   1. Validate input (email, displayName)
 *   2. Check for existing participant in DB
 *   3. Create Supabase Auth user (with admin API)
 *   4. Create participant record in gateway_participants table
 *   5. Generate PIN for gateway verification
 *   6. Return session cookie + participant data
 */
import * as crypto from 'node:crypto';
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createAccount } from '@/server/gateway/onboarding';
import { createSession, buildSetCookieHeader } from '@/server/gateway/session';

// ── Supabase client (server-side, service role) ─────────────────────────
function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    return null; // Fall through to DB-only mode if Supabase Auth not configured
  }
  return createClient(url, key, { auth: { persistSession: false } });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, displayName, password } = body;

    // ── Input validation ─────────────────────────────────────────
    if (!email || !displayName) {
      return NextResponse.json(
        { ok: false, error: 'Email and display name are required' },
        { status: 400 },
      );
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { ok: false, error: 'Invalid email format' },
        { status: 400 },
      );
    }

    // ── Try Supabase Auth if configured ──────────────────────────
    let participantId: string | undefined;
    const supabase = getSupabaseAdmin();

    if (supabase) {
      // Check for existing participant
      const { data: existing } = await supabase
        .from('gateway_participants')
        .select('id')
        .eq('email', email.toLowerCase().trim())
        .maybeSingle();

      if (existing) {
        return NextResponse.json(
          { ok: false, error: 'Account already exists for this email' },
          { status: 409 },
        );
      }

      // Create Supabase Auth user
      const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
        email: email.toLowerCase().trim(),
        password: password || crypto.randomUUID(),
        email_confirm: true,
        user_metadata: {
          display_name: displayName,
          onboarded_via: 'vvu-gateway-v2',
          onboarded_at: new Date().toISOString(),
        },
      });

      if (authError) {
        console.error('[onboard] Supabase Auth error:', authError.message);
        return NextResponse.json(
          { ok: false, error: 'Account creation failed', detail: authError.message },
          { status: 500 },
        );
      }

      participantId = authUser.user.id;

      // Write participant record via Supabase (replaces fs.mkdirSync / data/gateway)
      const { error: dbError } = await supabase
        .from('gateway_participants')
        .insert({
          id: authUser.user.id,
          email: email.toLowerCase().trim(),
          display_name: displayName,
          onboarding_status: 'pending_verification',
          gateway_version: '2.0-STABLE',
          ip_hash: hashIp(req.headers.get('x-forwarded-for') ?? 'unknown'),
        });

      if (dbError) {
        // Rollback: delete the auth user we just created
        await supabase.auth.admin.deleteUser(authUser.user.id).catch(() => {});
        console.error('[onboard] DB insert error:', dbError.message);
        return NextResponse.json(
          { ok: false, error: 'Onboarding failed — database write error' },
          { status: 500 },
        );
      }
    } else {
      // ── Fallback: DB-only mode (no Supabase Auth) ──────────────
      // Use createAccount from onboarding.ts which uses Drizzle ORM directly
      const result = await createAccount({
        email,
        displayName,
        password: password || '',
      });

      if (!result.ok) {
        return NextResponse.json(
          { ok: false, error: result.error },
          { status: 409 },
        );
      }

      participantId = String(result.manifest!.tenantId);

      // Return PIN (shown once — user must save it)
      const sessionCookie = createSession(
        result.manifest!.email,
        result.manifest!.tierLevel,
      );
      const response = NextResponse.json({
        ok: true,
        tenantId: result.manifest!.tenantId,
        tier: result.manifest!.tierLevel,
        domain: result.manifest!.assignedDomain,
        services: result.manifest!.provisionedServices,
        pin: result.pin,
        message: 'Account created. Save your PIN — it will not be shown again.',
      });
      response.headers.set('Set-Cookie', buildSetCookieHeader(sessionCookie));
      return response;
    }

    // ── Create session and return success (Supabase Auth path) ───
    const sessionCookie = createSession(email.toLowerCase().trim(), 'FREE_FIRST_1K');
    return NextResponse.json(
      {
        ok: true,
        participant_id: participantId,
        display_name: displayName,
        onboarding_status: 'pending_verification',
        message: 'Account created. Check your email to verify.',
      },
      { status: 201, headers: { 'Set-Cookie': buildSetCookieHeader(sessionCookie) } },
    );

  } catch (err: any) {
    console.error('[onboard] Unhandled error:', err);
    return NextResponse.json(
      { ok: false, error: 'Onboarding failed', detail: err.message },
      { status: 500 },
    );
  }
}

// ── Helpers ─────────────────────────────────────────────────────────────

function hashIp(ip: string): string {
  // One-way hash for POPIA compliance — never store raw IP
  return crypto.createHash('sha256').update(ip).digest('hex').slice(0, 16);
}

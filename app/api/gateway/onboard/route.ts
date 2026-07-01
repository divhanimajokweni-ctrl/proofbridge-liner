/**
 * app/api/gateway/onboard/route.ts
 *
 * Account creation endpoint.
 * Provisions new user with tier-appropriate services.
 * First 1000 users get SafeLiner + SafeKrypte free.
 */
import { NextRequest, NextResponse } from 'next/server';
import { createAccount } from '@/server/gateway/onboarding';
import { createSession, buildSetCookieHeader } from '@/server/gateway/session';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, displayName, password } = body;

    if (!email || !email.includes('@')) {
      return NextResponse.json(
        { ok: false, error: 'Valid email required' },
        { status: 400 },
      );
    }

    if (!displayName) {
      return NextResponse.json(
        { ok: false, error: 'Display name required' },
        { status: 400 },
      );
    }

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

    // Create session and set cookie
    const sessionCookie = createSession(email, result.manifest!.tierLevel);
    const response = NextResponse.json({
      ok: true,
      tenantId: result.manifest?.tenantId,
      tier: result.manifest?.tierLevel,
      domain: result.manifest?.assignedDomain,
      services: result.manifest?.provisionedServices,
      pin: result.pin, // Shown once — user must save this
    });

    response.headers.set('Set-Cookie', buildSetCookieHeader(sessionCookie));
    return response;

  } catch (err: any) {
    console.error('[ONBOARD ERROR]', err);
    return NextResponse.json(
      { ok: false, error: 'Onboarding failed' },
      { status: 500 },
    );
  }
}

/**
 * app/api/gateway/verify/route.ts
 *
 * PIN verification endpoint with Fail2Ban rate limiting.
 * Accepts client-side Argon2id hash, verifies against stored hash.
 * Returns HTTP-only secure session cookie on success.
 */
import { NextRequest, NextResponse } from 'next/server';
import { verifyPin } from '@/server/gateway/auth';
import { createSession, buildSetCookieHeader } from '@/server/gateway/session';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { userId, pinHash } = body;

    if (!userId || !pinHash) {
      return NextResponse.json(
        { ok: false, error: 'userId and pinHash required' },
        { status: 400 },
      );
    }

    // Get client IP for rate limiting
    const clientIp = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
      || req.headers.get('x-real-ip')
      || '127.0.0.1';

    // Verify PIN
    const result = await verifyPin(userId, pinHash, clientIp);

    if (!result.ok) {
      const status = result.error?.includes('jailed') ? 429 : 401;
      return NextResponse.json(
        { ok: false, error: result.error },
        { status },
      );
    }

    // Create session cookie
    const { getTenantByEmail } = await import('@/server/gateway/onboarding');
    const tenant = getTenantByEmail(userId);
    const tier = tenant?.tierLevel || 'FREE_STANDARD';

    const sessionCookie = createSession(userId, tier);
    const response = NextResponse.json({
      ok: true,
      sessionId: result.sessionId,
      userId,
      tier,
    });

    response.headers.set('Set-Cookie', buildSetCookieHeader(sessionCookie));
    return response;

  } catch (err: any) {
    console.error('[GATEWAY VERIFY ERROR]', err);
    return NextResponse.json(
      { ok: false, error: 'Internal verification error' },
      { status: 500 },
    );
  }
}

/**
 * app/api/gateway/session/route.ts
 *
 * Session validation endpoint.
 * Checks HTTP-only cookie, returns session data if valid.
 */
import { NextRequest, NextResponse } from 'next/server';
import { parseCookies, validateSession, invalidateSession, buildSetCookieHeader } from '@/server/gateway/session';

export async function GET(req: NextRequest) {
  const cookieHeader = req.headers.get('cookie') || '';
  const cookies = parseCookies(cookieHeader);
  const session = validateSession(cookies['vvu_session'] || '');

  if (!session) {
    return NextResponse.json(
      { ok: false, error: 'No valid session' },
      { status: 401 },
    );
  }

  return NextResponse.json({
    ok: true,
    userId: session.userId,
    tier: session.tier,
    createdAt: session.createdAt,
    expiresAt: session.expiresAt,
  });
}

export async function DELETE() {
  // Logout — invalidate session cookie
  const response = NextResponse.json({ ok: true, message: 'Logged out' });
  response.headers.set('Set-Cookie', buildSetCookieHeader(invalidateSession()));
  return response;
}

/**
 * File: src/middleware.ts
 * Description: Loop protection middleware with isolated routes and internal header tracing.
 */
import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Gate A Remediation: Explicit isolation of routing endpoints to prevent loops
const PUBLIC_PATHS = [
  '/',
  '/login',
  '/api/health',
  '/api/webhooks',
  '/api/receipts/verify',
  '/favicon.ico',
  '/_next/static',
  '/_next/image',
  '/auth/callback'
];
const MAX_REDIRECTS = 5;
export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (PUBLIC_PATHS.some(p => pathname === p || pathname.startsWith(p + '/'))) {
    return NextResponse.next();
  }

  const res = NextResponse.next();
  const supabase = createMiddlewareClient({ req, res });
  const { data } = await supabase.auth.getSession();
  const session = data?.session;

  if (!session) {
    // Read the tracking header to calculate redirect iterations
    const redirectCount = parseInt(req.headers.get('x-vvu-redirect-count') || '0', 10);

    if (redirectCount >= MAX_REDIRECTS) {
      // Return custom status mapping instead of locking the runtime browser environment
      return new NextResponse('Watchdog Intercept: Shielding against authentication loop.', { status: 508 });
    }

    const redirectUrl = new URL('/login', req.url);
    redirectUrl.searchParams.set('redirect', pathname);

    const loopedResponse = NextResponse.redirect(redirectUrl);
    loopedResponse.headers.set('x-vvu-redirect-count', (redirectCount + 1).toString());
    return loopedResponse;
  }

  return res;
}
export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)']
};

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';

const MAX_REDIRECTS = 5;

const PROTECTED_PREFIXES = ['/dashboard', '/safekrypte', '/pools', '/api/pools'];
const PUBLIC_PREFIXES = ['/login', '/api/health', '/api/verify', '/api/hbk', '/api/auth'];

export default async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Allow public routes
  if (PUBLIC_PREFIXES.some(p => pathname.startsWith(p))) {
    return NextResponse.next();
  }

  // Allow static assets and API routes that don't need auth
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/favicon') ||
    pathname.match(/\.(svg|png|jpg|jpeg|gif|webp|ico|css|js|woff2?|ttf)$/)
  ) {
    return NextResponse.next();
  }

  // Check if route requires authentication
  const isProtected = PROTECTED_PREFIXES.some(
    (p) => pathname === p || pathname.startsWith(p + '/'),
  );

  if (isProtected) {
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });

    if (!token) {
      // API routes get 401
      if (pathname.startsWith('/api/')) {
        return NextResponse.json(
          { error: 'Unauthorized', detail: 'Authentication required for this endpoint.' },
          { status: 401 },
        );
      }

      // Page routes redirect to sign-in
      const redirectCount = parseInt(req.headers.get('x-vvu-redirect-count') || '0', 10);
      if (redirectCount >= MAX_REDIRECTS) {
        return new NextResponse('Watchdog Intercept: Shielding against authentication loop.', {
          status: 508,
        });
      }

      const url = req.nextUrl.clone();
      url.pathname = '/api/auth/signin';
      url.searchParams.set('callbackUrl', pathname);
      const loopedResponse = NextResponse.redirect(url);
      loopedResponse.headers.set('x-vvu-redirect-count', (redirectCount + 1).toString());
      return loopedResponse;
    }

    // Inject tenant headers for authenticated users
    const res = NextResponse.next();
    res.headers.set('x-vvu-tenant-id', 'default');
    res.headers.set('x-vvu-tenant-tier', 'starter');
    res.headers.set('x-vvu-tenant-jurisdiction', 'ZA');
    return res;
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js|woff2?|ttf)$).*)',
  ],
};

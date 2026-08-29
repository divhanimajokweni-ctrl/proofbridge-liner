import { clerkMiddleware } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const PROTECTED = ['/dashboard', '/safekrypte', '/pools', '/api/pools', '/workspace'];
const PUBLIC = ['/', '/login', '/sign-in', '/sign-up', '/session', '/api/health', '/api/verify', '/api/hbk', '/api/auth'];

export default clerkMiddleware(async (auth, req) => {
  const { pathname } = req.nextUrl;
  if (PUBLIC.some(p => pathname === p || pathname.startsWith(p + '/'))) return NextResponse.next();
  const { userId } = await auth();
  if (userId) { const r = NextResponse.next(); r.headers.set('x-vvu-auth', 'clerk'); return r; }
  if (req.cookies.has('next-auth.session-token') || req.cookies.has('__Secure-next-auth.session-token')) { const r = NextResponse.next(); r.headers.set('x-vvu-auth', 'nextauth'); return r; }
  if (PROTECTED.some(p => pathname === p || pathname.startsWith(p + '/'))) {
    if (pathname.startsWith('/api/')) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const url = req.nextUrl.clone(); url.pathname = '/sign-in'; url.searchParams.set('redirect', pathname); return NextResponse.redirect(url);
  }
  return NextResponse.next();
});

export const config = { matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js|woff2?|ttf)$).*)'] };

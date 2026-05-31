import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const publicRoutes = ['/auth', '/auth/callback', '/vvv', '/demo', '/gate-1', '/proofbridge', '/pools', '/submission'];

const adminRoutes = ['/admin'];

export async function middleware(req: NextRequest) {
  const res = NextResponse.next();
  const supabase = createMiddlewareClient({ req, res });
  const { data: { session } } = await supabase.auth.getSession();
  const { pathname } = req.nextUrl;

  // Allow public routes without session
  if (publicRoutes.some((r) => pathname === r || pathname.startsWith(r + '/'))) {
    return res;
  }

  // Protect admin routes — require facilitator role
  if (adminRoutes.some((r) => pathname.startsWith(r))) {
    if (!session) {
      return NextResponse.redirect(new URL('/auth', req.url));
    }
    const role = session.user.user_metadata?.role;
    if (role !== 'facilitator') {
      return NextResponse.redirect(new URL('/pools?error=unauthorized', req.url));
    }
    return res;
  }

  return res;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|img/|.*\\.(?:js|css|svg|ico|png|woff2?|json|map|mp4|srt|md)$).*)'],
};

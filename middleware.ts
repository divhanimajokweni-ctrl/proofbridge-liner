import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const publicRoutes = ['/auth', '/auth/callback', '/vvv', '/demo', '/gate-1', '/proofbridge', '/pools', '/submission'];
const adminRoutes = ['/admin'];

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
      return supabaseResponse;
    }

    const { createServerClient } = await import('@supabase/ssr');

    const supabase = createServerClient(
      supabaseUrl,
      supabaseKey,
      {
        cookies: {
          getAll() { return request.cookies.getAll(); },
          setAll(cookiesToSet: { name: string; value: string; options: Record<string, unknown> }[]) {
            cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
            supabaseResponse = NextResponse.next({ request });
            cookiesToSet.forEach(({ name, value, options }) =>
              supabaseResponse.cookies.set(name, value, options)
            );
          },
        },
      }
    );

    const { data: { user } } = await supabase.auth.getUser();
    const { pathname } = request.nextUrl;

    if (adminRoutes.some((r) => pathname.startsWith(r))) {
      if (!user) {
        return NextResponse.redirect(new URL('/auth', request.url));
      }
      const role = user.user_metadata?.role;
      if (role !== 'facilitator') {
        return NextResponse.redirect(new URL('/pools?error=unauthorized', request.url));
      }
    }
  } catch {
    // Supabase unavailable in Edge Runtime — pass through without auth
  }

  return supabaseResponse;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|img/|.*\\.(?:js|css|svg|ico|png|woff2?|json|map|mp4|srt|md)$).*)'],
};

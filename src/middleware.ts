/**
 * File: src/middleware.ts
 * Description: Loop protection middleware with isolated routes and internal header tracing.
 */
import { createServerClient } from '@supabase/ssr';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const CIRCUIT_BREAKER_ADDRESS = process.env.CIRCUIT_BREAKER_ADDRESS;
const POLYGON_AMOY_RPC_URL = process.env.POLYGON_AMOY_RPC_URL;

async function isCircuitTripped(): Promise<boolean> {
  if (!CIRCUIT_BREAKER_ADDRESS || !POLYGON_AMOY_RPC_URL) return false;
  try {
    const { ethers } = await import('ethers');
    const provider = new ethers.JsonRpcProvider(POLYGON_AMOY_RPC_URL);
    const { CIRCUIT_BREAKER_ABI } = await import('@/lib/contracts/circuitBreakerAbi');
    const contract = new ethers.Contract(CIRCUIT_BREAKER_ADDRESS, CIRCUIT_BREAKER_ABI, provider);
    const open = await contract.circuitOpen();
    return !open;
  } catch {
    return false; // fail open on RPC error to avoid self-inflicted outage
  }
}

// Gate A Remediation: Explicit isolation of routing endpoints to prevent loops
const PUBLIC_PATHS = [
  '/',
  '/login',
  '/about',
  '/faqs',
  '/ubuntu-pools',
  '/gateway',
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
  const tripped = await isCircuitTripped();
  if (tripped) {
    return NextResponse.json(
      { error: 'GATE_D_TRIPPED', detail: 'Global circuit breaker is active. Service halted.' },
      { status: 423 }
    );
  }

  const { pathname } = req.nextUrl;

  if (PUBLIC_PATHS.some(p => pathname === p || pathname.startsWith(p + '/'))) {
    return NextResponse.next();
  }

  let supabaseResponse = NextResponse.next({ request: req });
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return req.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => req.cookies.set(name, value))
          supabaseResponse = NextResponse.next({ request: req })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

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

  return supabaseResponse;
}
export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)']
};
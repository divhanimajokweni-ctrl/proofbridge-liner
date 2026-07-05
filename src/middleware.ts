/**
 * File: src/middleware.ts
 * Description: Loop protection middleware with isolated routes and internal header tracing.
 */
import { createServerClient } from '@supabase/ssr';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import jwt from 'jsonwebtoken';

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
  '/api/gateway',
  '/favicon.ico',
  '/_next/static',
  '/_next/image',
  '/auth/callback'
];

// Routes protected by VVU Gateway session (not Supabase)
const VVU_GUARDED_PATHS = [
  '/dashboard',
  '/gateway-deck',
  '/agent-terminal',
];

const MAX_REDIRECTS = 5;

/**
 * Validate VVU session cookie (HMAC-signed, HttpOnly).
 * Returns session data if valid, null otherwise.
 */
function validateVVUSession(cookieHeader: string): { userId: string; tier: string } | null {
  try {
    const cookies: Record<string, string> = {};
    cookieHeader.split(';').forEach(pair => {
      const [key, ...rest] = pair.split('=');
      if (key) cookies[key.trim()] = decodeURIComponent(rest.join('=').trim());
    });

    const sessionValue = cookies['vvu_session'];
    if (!sessionValue) return null;

    const parts = sessionValue.split('.');
    if (parts.length !== 2) return null;

    const [payload, signature] = parts;
    const crypto = require('crypto');
    const secret = process.env.VVU_SESSION_SECRET;
    if (!secret) return null; // fail closed — no fallback

    const expectedSig = crypto
      .createHmac('sha256', secret)
      .update(payload)
      .digest('base64url');

    const sigBuf = Buffer.from(signature, 'base64url');
    const expBuf = Buffer.from(expectedSig, 'base64url');

    if (sigBuf.length !== expBuf.length) return null;
    if (!crypto.timingSafeEqual(sigBuf, expBuf)) return null;

    const data = JSON.parse(Buffer.from(payload, 'base64url').toString());
    if (Date.now() > data.expiresAt) return null;

    return { userId: data.userId, tier: data.tier };
  } catch {
    return null;
  }
}

function validateJwtSession(cookieHeader: string): { userId: string; tier: string } | null {
  try {
    const cookies: Record<string, string> = {};
    cookieHeader.split(';').forEach(pair => {
      const [key, ...rest] = pair.split('=');
      if (key) cookies[key.trim()] = decodeURIComponent(rest.join('=').trim());
    });

    const sessionToken = cookies['vvu_session_token'];
    if (!sessionToken) return null;

    const secret = process.env.VVU_JWT_SECRET;
    if (!secret) return null; // fail closed — no fallback
    const decoded = jwt.verify(sessionToken, secret) as { identity: string; permissions: string[] };

    if (!decoded || decoded.identity !== 'WAR_ROOM_OPERATOR') return null;

    return { userId: decoded.identity, tier: 'operator' };
  } catch {
    return null;
  }
}

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

  // VVU Gateway session guard for /dashboard, /gateway-deck, /agent-terminal
  if (VVU_GUARDED_PATHS.some(p => pathname === p || pathname.startsWith(p + '/'))) {
    const session =
      validateVVUSession(req.headers.get('cookie') || '') ||
      validateJwtSession(req.headers.get('cookie') || '');
    if (!session) {
      const redirectUrl = new URL('/gateway', req.url);
      redirectUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(redirectUrl);
    }
    // Attach session info to headers for downstream use
    const response = NextResponse.next();
    response.headers.set('x-vvu-user-id', session.userId);
    response.headers.set('x-vvu-tier', session.tier);
    return response;
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
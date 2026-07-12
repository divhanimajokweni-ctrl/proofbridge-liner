import { createServerClient } from '@supabase/ssr';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const CIRCUIT_BREAKER_ADDRESS = process.env.CIRCUIT_BREAKER_ADDRESS;
const POLYGON_AMOY_RPC_URL = process.env.POLYGON_AMOY_RPC_URL;
const MAX_REDIRECTS = 5;

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
    return false;
  }
}

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
    if (!secret) return null;

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

const PROTECTED_PREFIXES = ['/dashboard', '/safekrypte'];
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

export async function middleware(req: NextRequest) {
  const tripped = await isCircuitTripped();
  if (tripped) {
    return NextResponse.json(
      { error: 'GATE_D_TRIPPED', detail: 'Global circuit breaker is active. Service halted.' },
      { status: 423 }
    );
  }

  const { pathname } = req.nextUrl;

  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    return NextResponse.next();
  }

  let res = NextResponse.next({ request: req });

  const supabase = createServerClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    cookies: {
      getAll() {
        return req.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => req.cookies.set(name, value));
        res = NextResponse.next({ request: req });
        cookiesToSet.forEach(({ name, value, options }) =>
          res.cookies.set(name, value, options),
        );
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const isProtected = PROTECTED_PREFIXES.some(
    (p) => pathname === p || pathname.startsWith(p + '/'),
  );

  if (!user && isProtected) {
    const redirectCount = parseInt(req.headers.get('x-vvu-redirect-count') || '0', 10);
    if (redirectCount >= MAX_REDIRECTS) {
      return new NextResponse('Watchdog Intercept: Shielding against authentication loop.', { status: 508 });
    }

    const url = req.nextUrl.clone();
    url.pathname = '/login';
    url.searchParams.set('redirect', pathname);
    const loopedResponse = NextResponse.redirect(url);
    loopedResponse.headers.set('x-vvu-redirect-count', (redirectCount + 1).toString());
    return loopedResponse;
  }

  return res;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js|woff2?|ttf)$).*)',
  ],
};

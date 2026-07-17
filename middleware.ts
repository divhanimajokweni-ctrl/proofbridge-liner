import { createServerClient } from '@supabase/ssr';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { isClerkConfigured, getClerkSession } from '@/lib/session/clerk';

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

const PROTECTED_PREFIXES = ['/dashboard', '/safekrypte', '/pools', '/api/pools'];
const PUBLIC_PREFIXES = ['/login', '/session', '/clerk', '/api/health', '/api/verify'];
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

type AuthUser = { id: string; metadata: Record<string, unknown> };

async function trySupabaseAuth(req: NextRequest): Promise<{
  res: NextResponse;
  user: AuthUser | null;
}> {
  let res = NextResponse.next({ request: req });

  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    return { res, user: null };
  }

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

  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user) {
      return { res, user: { id: user.id, metadata: { ...user.user_metadata, ...user.app_metadata } } };
    }
    return { res, user: null };
  } catch {
    return { res, user: null };
  }
}

async function tryClerkAuth(): Promise<AuthUser | null> {
  if (!isClerkConfigured()) return null;
  const session = await getClerkSession();
  if (!session) return null;
  return { id: session.userId, metadata: { provider: 'clerk' } };
}

function redirectUnauthorized(
  req: NextRequest,
  pathname: string,
): NextResponse {
  if (pathname.startsWith('/api/')) {
    return NextResponse.json(
      { error: 'Unauthorized', detail: 'Authentication required for this endpoint.' },
      { status: 401 },
    );
  }

  const redirectCount = parseInt(req.headers.get('x-vvu-redirect-count') || '0', 10);
  if (redirectCount >= MAX_REDIRECTS) {
    return new NextResponse('Watchdog Intercept: Shielding against authentication loop.', { status: 508 });
  }

  const url = req.nextUrl.clone();

  if (isClerkConfigured()) {
    url.pathname = '/clerk/sign-in';
  } else {
    url.pathname = '/login';
  }
  url.searchParams.set('redirect', pathname);
  const loopedResponse = NextResponse.redirect(url);
  loopedResponse.headers.set('x-vvu-redirect-count', (redirectCount + 1).toString());
  return loopedResponse;
}

function injectTenantHeaders(res: NextResponse, metadata: Record<string, unknown>): NextResponse {
  const tenantId = (metadata.tenant_id as string) ?? 'default';
  const tenantTier = (metadata.tier as string) ?? 'starter';
  const tenantJurisdiction = (metadata.jurisdiction as string) ?? 'ZA';
  res.headers.set('x-vvu-tenant-id', tenantId);
  res.headers.set('x-vvu-tenant-tier', tenantTier);
  res.headers.set('x-vvu-tenant-jurisdiction', tenantJurisdiction);
  return res;
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

  if (PUBLIC_PREFIXES.some(p => pathname.startsWith(p))) {
    return NextResponse.next();
  }

  const isProtected = PROTECTED_PREFIXES.some(
    (p) => pathname === p || pathname.startsWith(p + '/'),
  );

  const { res: supabaseRes, user: supabaseUser } = await trySupabaseAuth(req);

  if (supabaseUser) {
    return injectTenantHeaders(supabaseRes, supabaseUser.metadata);
  }

  const clerkUser = await tryClerkAuth();
  if (clerkUser) {
    return injectTenantHeaders(supabaseRes, clerkUser.metadata);
  }

  if (isProtected) {
    return redirectUnauthorized(req, pathname);
  }

  return supabaseRes;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js|woff2?|ttf)$).*)',
  ],
};

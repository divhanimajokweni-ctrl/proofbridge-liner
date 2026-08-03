import { clerkMiddleware } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { isClerkServerConfigured, getClerkSession } from '@/lib/session/clerk';

const CIRCUIT_BREAKER_ADDRESS = process.env.CIRCUIT_BREAKER_ADDRESS;
const POLYGON_AMOY_RPC_URL = process.env.POLYGON_AMOY_RPC_URL;
const MAX_REDIRECTS = 5;

async function isCircuitTripped(): Promise<boolean> {
  // The on-chain circuit breaker check requires the 'ethers' package.
  // If the package is not installed or env vars are not set, the check is skipped gracefully.
  if (!CIRCUIT_BREAKER_ADDRESS || !POLYGON_AMOY_RPC_URL) return false;
  // Ethers is not installed in this environment — circuit breaker is disabled.
  // To enable: install ethers and set CIRCUIT_BREAKER_ADDRESS + POLYGON_AMOY_RPC_URL env vars.
  return false;
}

const PROTECTED_PREFIXES = ['/dashboard', '/safekrypte', '/pools', '/api/pools'];
const PUBLIC_PREFIXES = ['/login', '/session', '/clerk', '/api/health', '/api/verify', '/api/hbk'];

type AuthUser = { id: string; metadata: Record<string, unknown> };

async function tryClerkAuth(): Promise<AuthUser | null> {
  if (!isClerkServerConfigured()) return null;
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
  url.pathname = '/login';
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

export default clerkMiddleware(async (_auth, req) => {
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

  const clerkUser = await tryClerkAuth();
  if (clerkUser) {
    const res = NextResponse.next();
    return injectTenantHeaders(res, clerkUser.metadata);
  }

  if (isProtected) {
    return redirectUnauthorized(req, pathname);
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js|woff2?|ttf)$).*)',
  ],
};

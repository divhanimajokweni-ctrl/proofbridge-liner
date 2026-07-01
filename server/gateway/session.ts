/**
 * server/gateway/session.ts
 *
 * HTTP-only secure cookie session manager.
 * Sessions are signed with HMAC-SHA256 and stored in HttpOnly, SameSite=Strict, Secure cookies.
 * Session data lives only in the cookie (stateless server).
 */
import * as crypto from 'node:crypto';

// ─── Configuration ──────────────────────────────────────────────────────

const SESSION_SECRET = process.env.VVU_SESSION_SECRET || crypto.randomBytes(32).toString('hex');
const SESSION_MAX_AGE_MS = 24 * 60 * 60 * 1000; // 24 hours
const COOKIE_NAME = 'vvu_session';
const COOKIE_DOMAIN = process.env.COOKIE_DOMAIN || 'venturevisionubuntu.co.za';

// ─── Types ──────────────────────────────────────────────────────────────

export interface SessionData {
  userId: string;
  tier: 'FREE_FIRST_1K' | 'FREE_STANDARD' | 'COMMERCIAL_PRO' | 'INDUSTRY_MONOLITH';
  createdAt: number;
  expiresAt: number;
}

export interface SessionCookie {
  value: string;
  options: {
    httpOnly: boolean;
    secure: boolean;
    sameSite: 'strict' | 'lax' | 'none';
    path: string;
    maxAge: number;
    domain?: string;
  };
}

// ─── Session Creation ───────────────────────────────────────────────────

export function createSession(userId: string, tier: string): SessionCookie {
  const now = Date.now();
  const data: SessionData = {
    userId,
    tier: tier as SessionData['tier'],
    createdAt: now,
    expiresAt: now + SESSION_MAX_AGE_MS,
  };

  const payload = Buffer.from(JSON.stringify(data)).toString('base64url');
  const signature = crypto
    .createHmac('sha256', SESSION_SECRET)
    .update(payload)
    .digest('base64url');

  const value = `${payload}.${signature}`;

  return {
    value,
    options: {
      httpOnly: true,
      secure: true,
      sameSite: 'strict',
      path: '/',
      maxAge: Math.floor(SESSION_MAX_AGE_MS / 1000),
      domain: COOKIE_DOMAIN,
    },
  };
}

// ─── Session Validation ─────────────────────────────────────────────────

export function validateSession(cookieValue: string): SessionData | null {
  if (!cookieValue) return null;

  const parts = cookieValue.split('.');
  if (parts.length !== 2) return null;

  const [payload, signature] = parts;

  // Verify HMAC signature
  const expectedSig = crypto
    .createHmac('sha256', SESSION_SECRET)
    .update(payload)
    .digest('base64url');

  // Constant-time comparison to prevent timing attacks
  const sigBuffer = Buffer.from(signature, 'base64url');
  const expectedBuffer = Buffer.from(expectedSig, 'base64url');

  if (sigBuffer.length !== expectedBuffer.length) return null;
  if (!crypto.timingSafeEqual(new Uint8Array(sigBuffer.buffer, sigBuffer.byteOffset, sigBuffer.byteLength), new Uint8Array(expectedBuffer.buffer, expectedBuffer.byteOffset, expectedBuffer.byteLength))) return null;

  // Parse payload
  try {
    const data: SessionData = JSON.parse(Buffer.from(payload, 'base64url').toString());

    // Check expiry
    if (Date.now() > data.expiresAt) return null;

    return data;
  } catch {
    return null;
  }
}

// ─── Cookie Parsing ─────────────────────────────────────────────────────

export function parseCookies(cookieHeader: string): Record<string, string> {
  const cookies: Record<string, string> = {};
  if (!cookieHeader) return cookies;

  cookieHeader.split(';').forEach((pair) => {
    const [key, ...rest] = pair.split('=');
    const value = rest.join('=').trim();
    if (key) cookies[key.trim()] = decodeURIComponent(value);
  });

  return cookies;
}

// ─── Session Invalidation ───────────────────────────────────────────────

export function invalidateSession(): SessionCookie {
  return {
    value: '',
    options: {
      httpOnly: true,
      secure: true,
      sameSite: 'strict',
      path: '/',
      maxAge: 0, // Immediately expires the cookie
      domain: COOKIE_DOMAIN,
    },
  };
}

// ─── Set-Cookie Header Builder ──────────────────────────────────────────

export function buildSetCookieHeader(cookie: SessionCookie): string {
  const { value, options } = cookie;
  const parts = [`${COOKIE_NAME}=${value}`];

  if (options.httpOnly) parts.push('HttpOnly');
  if (options.secure) parts.push('Secure');
  if (options.sameSite) parts.push(`SameSite=${options.sameSite}`);
  if (options.path) parts.push(`Path=${options.path}`);
  if (options.maxAge) parts.push(`Max-Age=${options.maxAge}`);
  if (options.domain) parts.push(`Domain=${options.domain}`);

  return parts.join('; ');
}

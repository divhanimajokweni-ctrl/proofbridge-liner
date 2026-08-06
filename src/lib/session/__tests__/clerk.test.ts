// @ts-nocheck
import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockAuth = vi.fn();
vi.mock('@clerk/nextjs/server', () => ({
  auth: mockAuth,
  clerkClient: vi.fn(),
}));

describe('session/clerk-config', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
    vi.clearAllMocks();
    vi.resetModules();
  });

  describe('isClerkConfigured', () => {
    it('returns false when both keys are missing', async () => {
      delete process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;
      delete process.env.CLERK_SECRET_KEY;
      const { isClerkConfigured } = await import('@/lib/session/clerk-config');
      expect(isClerkConfigured()).toBe(false);
    });

    it('returns true when only publishable key is set (client-side check)', async () => {
      process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY = 'pk_test_123';
      delete process.env.CLERK_SECRET_KEY;
      const { isClerkConfigured } = await import('@/lib/session/clerk-config');
      expect(isClerkConfigured()).toBe(true);
    });

    it('returns false when only secret key is set', async () => {
      delete process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;
      process.env.CLERK_SECRET_KEY = 'sk_test_123';
      const { isClerkConfigured } = await import('@/lib/session/clerk-config');
      expect(isClerkConfigured()).toBe(false);
    });

    it('returns true when both keys are set', async () => {
      process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY = 'pk_test_123';
      process.env.CLERK_SECRET_KEY = 'sk_test_123';
      const { isClerkConfigured } = await import('@/lib/session/clerk-config');
      expect(isClerkConfigured()).toBe(true);
    });
  });
});

describe('session/clerk', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
    vi.clearAllMocks();
    vi.resetModules();
  });

  describe('getClerkSession', () => {
    it('returns null when Clerk is not configured', async () => {
      delete process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;
      delete process.env.CLERK_SECRET_KEY;
      const { getClerkSession } = await import('@/lib/session/clerk');
      const result = await getClerkSession();
      expect(result).toBeNull();
    });

    it('returns null when auth throws', async () => {
      process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY = 'pk_test_123';
      process.env.CLERK_SECRET_KEY = 'sk_test_123';
      mockAuth.mockRejectedValueOnce(new Error('connection refused'));
      const { getClerkSession } = await import('@/lib/session/clerk');
      const result = await getClerkSession();
      expect(result).toBeNull();
    });

    it('returns null when no userId', async () => {
      process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY = 'pk_test_123';
      process.env.CLERK_SECRET_KEY = 'sk_test_123';
      mockAuth.mockResolvedValueOnce({ userId: null, sessionId: null });
      const { getClerkSession } = await import('@/lib/session/clerk');
      const result = await getClerkSession();
      expect(result).toBeNull();
    });

    it('returns session data when auth succeeds', async () => {
      process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY = 'pk_test_123';
      process.env.CLERK_SECRET_KEY = 'sk_test_123';
      mockAuth.mockResolvedValueOnce({
        userId: 'user_abc123',
        sessionId: 'sess_xyz789',
      });
      const { getClerkSession } = await import('@/lib/session/clerk');
      const result = await getClerkSession();
      expect(result).toEqual({
        userId: 'user_abc123',
        sessionId: 'sess_xyz789',
      });
    });
  });

  describe('clerkFallbackRedirect', () => {
    it('redirects to /clerk/sign-in without redirect param', async () => {
      const { clerkFallbackRedirect } = await import('@/lib/session/clerk');
      const reqUrl = new URL('https://example.com/dashboard');
      const res = clerkFallbackRedirect(reqUrl);
      expect(res.status).toBe(307);
      const location = res.headers.get('location');
      expect(location).toContain('/clerk/sign-in');
      expect(location).not.toContain('redirect=');
    });

    it('includes redirect param when provided', async () => {
      const { clerkFallbackRedirect } = await import('@/lib/session/clerk');
      const reqUrl = new URL('https://example.com/dashboard');
      const res = clerkFallbackRedirect(reqUrl, '/settings');
      const location = res.headers.get('location');
      expect(location).toContain('redirect=%2Fsettings');
    });
  });
});

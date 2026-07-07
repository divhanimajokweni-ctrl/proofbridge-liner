/**
 * Upstash Redis-based rate limiter.
 * Replaces in-memory Map-based rate limiting that resets on cold start in serverless.
 * Uses Redis sorted sets (ZREMRANGEBYSCORE + ZCARD) for sliding window rate limiting.
 * Falls back to in-memory if Upstash is not configured.
 */
import { Redis } from '@upstash/redis';
import crypto from 'node:crypto';

const UPSTASH_URL = process.env.UPSTASH_REDIS_REST_URL;
const UPSTASH_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN;

let redisClient: Redis | null = null;
if (UPSTASH_URL && UPSTASH_TOKEN) {
  try {
    redisClient = new Redis({ url: UPSTASH_URL, token: UPSTASH_TOKEN });
  } catch {
    redisClient = null;
  }
}

// Fallback in-memory store (used when Upstash is not configured)
const fallbackCache = new Map<string, number[]>();

export interface RateLimitConfig {
  /** Time window in milliseconds (default: 60000 = 1 minute) */
  windowMs: number;
  /** Maximum requests allowed within the window (default: 30) */
  maxRequests: number;
}

const DEFAULT_CONFIG: RateLimitConfig = {
  windowMs: 60_000,
  maxRequests: 30,
};

/**
 * Check if a client (identified by IP or other key) is rate-limited.
 * Uses Upstash Redis when available, falls back to in-memory.
 *
 * @param key - Unique identifier for the client (IP, user ID, etc.)
 * @param config - Optional rate limit configuration
 * @returns true if the request should be blocked (rate limited)
 */
export async function isRateLimited(
  key: string,
  config: Partial<RateLimitConfig> = {},
): Promise<boolean> {
  const { windowMs, maxRequests } = { ...DEFAULT_CONFIG, ...config };
  const now = Date.now();
  const windowStart = now - windowMs;

  if (redisClient) {
    // Use Redis sorted set for sliding window
    const redisKey = `ratelimit:${key}`;
    try {
      // Remove entries outside the window
      await redisClient.zremrangebyscore(redisKey, 0, windowStart);
      // Count entries in the window
      const count = await redisClient.zcard(redisKey);
      if (count >= maxRequests) {
        return true;
      }
      // Add current request
      await redisClient.zadd(redisKey, { score: now, member: `${now}:${crypto.randomUUID()}` });
      // Set TTL to auto-cleanup
      await redisClient.expire(redisKey, Math.ceil(windowMs / 1000) + 10);
      return false;
    } catch {
      // Fallback to in-memory on Redis error
      return fallbackIsRateLimited(key, windowMs, maxRequests, now);
    }
  }

  // In-memory fallback
  return fallbackIsRateLimited(key, windowMs, maxRequests, now);
}

function fallbackIsRateLimited(
  key: string,
  windowMs: number,
  maxRequests: number,
  now: number,
): boolean {
  if (!fallbackCache.has(key)) {
    fallbackCache.set(key, [now]);
    return false;
  }
  const timestamps = fallbackCache.get(key)!.filter(t => now - t < windowMs);
  if (timestamps.length >= maxRequests) return true;
  timestamps.push(now);
  fallbackCache.set(key, timestamps);
  return false;
}

/**
 * Create a Next.js-compatible rate limit check that returns
 * a 429 response if rate limited, or null if allowed.
 */
export async function checkRateLimit(
  req: Request,
  config: Partial<RateLimitConfig> & { key?: string } = {},
): Promise<Response | null> {
  const ip =
    (req as any).ip ||
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    req.headers.get('x-real-ip') ||
    'unknown-client';

  const key = config.key || `ip:${ip}`;
  const limited = await isRateLimited(key, config);

  if (limited) {
    return new Response(
      JSON.stringify({
        error: 'Too Many Requests',
        detail: 'Rate limit exceeded. Try again later.',
        retryAfter: Math.ceil((config.windowMs || DEFAULT_CONFIG.windowMs) / 1000),
      }),
      {
        status: 429,
        headers: {
          'Content-Type': 'application/json',
          'Retry-After': String(Math.ceil((config.windowMs || DEFAULT_CONFIG.windowMs) / 1000)),
        },
      },
    );
  }

  return null;
}

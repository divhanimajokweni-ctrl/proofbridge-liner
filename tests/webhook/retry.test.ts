/**
 * VVU-IVE Webhook Subsystem — Retry Engine Unit Tests
 * ----------------------------------------------------------------------------
 * Pure-function tests for the retry math (Pillar 3).
 */

import { describe, expect, test } from "bun:test";
import {
  classifyStatus,
  computeDelayMs,
  getMaxAttempts,
  parseRetryAfter,
  shouldRetry,
} from "@/lib/webhook/retry";
import { RETRY_CONFIG } from "@/lib/webhook/config";

describe("retry: constants (Pillar 3 contract)", () => {
  test("max attempts is exactly 4 (1 initial + 3 retries)", () => {
    expect(getMaxAttempts()).toBe(4);
    expect(RETRY_CONFIG.MAX_ATTEMPTS).toBe(4);
  });

  test("base delay is 5s, factor is 5, cap is 625s", () => {
    expect(RETRY_CONFIG.BASE_DELAY_MS).toBe(5_000);
    expect(RETRY_CONFIG.BACKOFF_FACTOR).toBe(5);
    expect(RETRY_CONFIG.MAX_DELAY_MS).toBe(625_000);
  });

  test("per-attempt timeout is 30s", () => {
    expect(RETRY_CONFIG.ATTEMPT_TIMEOUT_MS).toBe(30_000);
  });
});

describe("retry: computeDelayMs (full jitter)", () => {
  test("delay before attempt 1 is 0 (no delay on initial)", () => {
    expect(computeDelayMs(-1)).toBe(0);
  });

  test("retry 1 jittered within [0, 5000)", () => {
    // Try 100 samples — all should be within the range
    for (let i = 0; i < 100; i++) {
      const d = computeDelayMs(0);
      expect(d).toBeGreaterThanOrEqual(0);
      expect(d).toBeLessThan(5_000);
    }
  });

  test("retry 2 jittered within [0, 25000)", () => {
    for (let i = 0; i < 100; i++) {
      const d = computeDelayMs(1);
      expect(d).toBeGreaterThanOrEqual(0);
      expect(d).toBeLessThan(25_000);
    }
  });

  test("retry 3 jittered within [0, 125000)", () => {
    for (let i = 0; i < 100; i++) {
      const d = computeDelayMs(2);
      expect(d).toBeGreaterThanOrEqual(0);
      expect(d).toBeLessThan(125_000);
    }
  });

  test("retry 4 jittered within [0, 625000) — capped at MAX_DELAY_MS", () => {
    for (let i = 0; i < 100; i++) {
      const d = computeDelayMs(3);
      expect(d).toBeGreaterThanOrEqual(0);
      expect(d).toBeLessThanOrEqual(625_000);
    }
  });

  test("retry 5+ capped at MAX_DELAY_MS — no growth past retry 4", () => {
    const d5 = computeDelayMs(4, () => 0.99); // near max
    const d6 = computeDelayMs(5, () => 0.99);
    expect(d5).toBeLessThanOrEqual(625_000);
    expect(d6).toBeLessThanOrEqual(625_000);
  });

  test("deterministic with seeded RNG", () => {
    let seed = 0.5;
    const rng = () => seed;
    const d = computeDelayMs(0, rng);
    expect(d).toBe(Math.floor(0.5 * 5_000));
  });
});

describe("retry: classifyStatus", () => {
  test("2xx = success", () => {
    expect(classifyStatus(200, "success")).toBe("success");
    expect(classifyStatus(204, "success")).toBe("success");
    expect(classifyStatus(299, "success")).toBe("success");
  });

  test("non-retryable list (400, 401, 403, 404, 405, 410, 422)", () => {
    for (const code of [400, 401, 403, 404, 405, 410, 422]) {
      expect(classifyStatus(code)).toBe("non_retryable");
    }
  });

  test("retryable list (408, 425, 429, 500, 502, 503, 504)", () => {
    for (const code of [408, 425, 429, 500, 502, 503, 504]) {
      expect(classifyStatus(code)).toBe("retryable");
    }
  });

  test("timeout", () => {
    expect(classifyStatus(0, "timeout")).toBe("timeout");
  });

  test("connection_failure", () => {
    expect(classifyStatus(0, "connection_failure")).toBe("connection_failure");
  });

  test("unknown status defaults to retryable (conservative)", () => {
    expect(classifyStatus(418, "success")).toBe("retryable"); // I'm a teapot
    expect(classifyStatus(599, "success")).toBe("retryable");
  });
});

describe("retry: shouldRetry", () => {
  test("no retry after success", () => {
    expect(shouldRetry(1, "success")).toBe(false);
    expect(shouldRetry(2, "success")).toBe(false);
  });

  test("no retry after non_retryable", () => {
    expect(shouldRetry(1, "non_retryable")).toBe(false);
  });

  test("retry retryable outcomes if attempts remain", () => {
    expect(shouldRetry(1, "retryable")).toBe(true);
    expect(shouldRetry(2, "retryable")).toBe(true);
    expect(shouldRetry(3, "retryable")).toBe(true);
    expect(shouldRetry(4, "retryable")).toBe(false); // out of attempts
  });

  test("retry timeout and connection_failure", () => {
    expect(shouldRetry(1, "timeout")).toBe(true);
    expect(shouldRetry(1, "connection_failure")).toBe(true);
  });

  test("no retry past MAX_ATTEMPTS regardless of outcome", () => {
    expect(shouldRetry(4, "retryable")).toBe(false);
    expect(shouldRetry(4, "timeout")).toBe(false);
    expect(shouldRetry(5, "retryable")).toBe(false);
  });
});

describe("retry: parseRetryAfter (429 Retry-After header)", () => {
  test("seconds format (RFC 7231)", () => {
    expect(parseRetryAfter("120")).toBe(120_000);
    expect(parseRetryAfter("0")).toBe(0);
  });

  test("HTTP-date format (RFC 7231)", () => {
    const future = new Date(Date.now() + 60_000).toUTCString();
    const ms = parseRetryAfter(future);
    expect(ms).not.toBeNull();
    expect(ms!).toBeGreaterThan(50_000);
    expect(ms!).toBeLessThanOrEqual(625_000); // capped
  });

  test("past date returns 0 (retry immediately)", () => {
    const past = new Date(Date.now() - 60_000).toUTCString();
    expect(parseRetryAfter(past)).toBe(0);
  });

  test("capped at MAX_DELAY_MS (625s)", () => {
    expect(parseRetryAfter("999999")).toBe(625_000);
  });

  test("null/empty returns null", () => {
    expect(parseRetryAfter(null)).toBeNull();
    expect(parseRetryAfter(undefined)).toBeNull();
    expect(parseRetryAfter("")).toBeNull();
    expect(parseRetryAfter("   ")).toBeNull();
  });

  test("garbage returns null", () => {
    expect(parseRetryAfter("never")).toBeNull();
  });
});

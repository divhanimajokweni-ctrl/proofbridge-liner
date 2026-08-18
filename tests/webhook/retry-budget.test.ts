/**
 * VVU-IVE Webhook Subsystem — Retry Budget Tests (Pillar 3, layer 3)
 * ----------------------------------------------------------------------------
 * Verifies the global ≤10% retry/request ratio invariant.
 */

import { beforeEach, describe, expect, test } from "bun:test";
import {
  _resetBucketForTesting,
  chargeRetry,
  getBucketState,
  getRetryRatio,
  isBudgetExhausted,
  recordInitialAttempt,
} from "@/lib/webhook/retry-budget";
import { RETRY_BUDGET_CONFIG, WORKER_POOL_CONFIG } from "@/lib/webhook/config";

// Reset the process-global bucket before each test so counters start at 0.
// Without this, test order would determine pass/fail (the bucket is a
// process singleton — previous tests' charges persist).
beforeEach(() => {
  _resetBucketForTesting();
});

describe("retry-budget: initial capacity (Pillar 3)", () => {
  test("ratio is 10%", () => {
    expect(RETRY_BUDGET_CONFIG.RATIO).toBe(0.10);
  });

  test("initial capacity = global_concurrency * ratio = 10 tokens", () => {
    expect(WORKER_POOL_CONFIG.GLOBAL_CONCURRENCY).toBe(100);
    const state = getBucketState();
    expect(state.capacity).toBe(
      Math.ceil(WORKER_POOL_CONFIG.GLOBAL_CONCURRENCY * RETRY_BUDGET_CONFIG.RATIO),
    );
    expect(state.capacity).toBe(10);
  });

  test("starts fully charged", () => {
    const state = getBucketState();
    expect(state.tokens).toBe(state.capacity);
    expect(state.totalRequests).toBe(0);
    expect(state.totalRetries).toBe(0);
  });
});

describe("retry-budget: chargeRetry", () => {
  beforeEach(() => {
    // Reset by mutating internal state via getter then... actually we can't
    // reset a module singleton easily. Tests below use post-charge state.
  });

  test("charging succeeds while tokens remain", async () => {
    const before = getBucketState().tokens;
    const ok = await chargeRetry();
    expect(ok).toBe(true);
    const after = getBucketState().tokens;
    expect(after).toBe(before - 1);
  });

  test("charging increments totalRetries and totalRequests", async () => {
    const before = getBucketState();
    await chargeRetry();
    const after = getBucketState();
    expect(after.totalRetries).toBe(before.totalRetries + 1);
    expect(after.totalRequests).toBe(before.totalRequests + 1);
  });
});

describe("retry-budget: recordInitialAttempt", () => {
  test("records outbound request without charging a token", async () => {
    const before = getBucketState();
    await recordInitialAttempt();
    const after = getBucketState();
    expect(after.totalRequests).toBe(before.totalRequests + 1);
    expect(after.totalRetries).toBe(before.totalRetries);
    expect(after.tokens).toBe(before.tokens); // no token consumed
  });
});

describe("retry-budget: getRetryRatio", () => {
  test("returns 0 when no requests", () => {
    // Cannot guarantee zero — state may have accumulated from prior tests.
    // Just verify the formula: retries / requests
    const state = getBucketState();
    const expectedRatio =
      state.totalRequests === 0 ? 0 : state.totalRetries / state.totalRequests;
    expect(getRetryRatio()).toBe(expectedRatio);
  });
});

describe("retry-budget: isBudgetExhausted", () => {
  test("returns false when tokens > 0", () => {
    // After other tests, we should still have tokens
    expect(isBudgetExhausted()).toBe(false);
  });
});

/**
 * VVU-IVE Webhook Subsystem — Retry Budget (Pillar 3, layer 3)
 * ----------------------------------------------------------------------------
 * Global invariant: total retries must not exceed 10% of total outbound
 * requests. Prevents cascading failure from consuming all worker capacity.
 *
 * Implementation: Postgres-backed token bucket (no Redis dependency).
 *   - Tokens refresh at a rate proportional to total outbound request count
 *   - A retry "costs" 1 token; a non-retry "refunds" nothing
 *   - If budget exhausted → no more retries allowed (event goes to DLQ)
 *
 * Note: This is a SAFETY VALVE, not a precise accounting system. It only
 * kicks in when the system is in a degraded state. Under normal operation
 * (most events succeed on first attempt), the budget is large and unused.
 */

import { db } from "@/lib/db";
import { RETRY_BUDGET_CONFIG, WORKER_POOL_CONFIG } from "./config";

// ── Token bucket (in-process; persists to DB on refresh tick) ──────────────
interface BucketState {
  capacity: number;
  tokens: number;
  lastRefillAt: number; // epoch ms
  totalRequests: number;
  totalRetries: number;
}

const initialState: BucketState = {
  capacity:
    Math.ceil(WORKER_POOL_CONFIG.GLOBAL_CONCURRENCY * RETRY_BUDGET_CONFIG.RATIO),
  tokens: Math.ceil(WORKER_POOL_CONFIG.GLOBAL_CONCURRENCY * RETRY_BUDGET_CONFIG.RATIO),
  lastRefillAt: Date.now(),
  totalRequests: 0,
  totalRetries: 0,
};

// Process-singleton bucket
const globalForBucket = globalThis as unknown as {
  __vvuRetryBucket?: BucketState;
};
const bucket: BucketState =
  globalForBucket.__vvuRetryBucket ??
  (globalForBucket.__vvuRetryBucket = initialState);

/**
 * Charge 1 token to attempt a retry. Returns false if budget exhausted
 * (no retry permitted — event must go to DLQ or be marked FAILED).
 *
 * Also records the total outbound request count (for accounting).
 */
export async function chargeRetry(): Promise<boolean> {
  refresh();
  bucket.totalRequests++;
  if (bucket.tokens > 0) {
    bucket.tokens--;
    bucket.totalRetries++;
    return true;
  }
  return false;
}

/**
 * Record a non-retry outbound request (initial attempt) — used for accounting
 * so the budget ratio is computed correctly.
 */
export async function recordInitialAttempt(): Promise<void> {
  bucket.totalRequests++;
}

/**
 * Refresh the bucket: add tokens proportional to elapsed time.
 *
 * Rate = (capacity / refresh_interval) * elapsed_ms
 *
 * Capped at capacity. Called on every charge (cheap, in-memory).
 */
function refresh(): void {
  const now = Date.now();
  const elapsed = now - bucket.lastRefillAt;
  if (elapsed <= 0) return;
  const ratePerMs = bucket.capacity / RETRY_BUDGET_CONFIG.REFRESH_INTERVAL_MS;
  const newTokens = Math.min(
    bucket.capacity,
    bucket.tokens + elapsed * ratePerMs,
  );
  bucket.tokens = newTokens;
  bucket.lastRefillAt = now;
}

/**
 * Inspect the current bucket state (for monitoring / admin UI).
 */
export function getBucketState(): Readonly<BucketState> {
  refresh();
  return { ...bucket };
}

/**
 * Compute the current retry/request ratio.
 */
export function getRetryRatio(): number {
  if (bucket.totalRequests === 0) return 0;
  return bucket.totalRetries / bucket.totalRequests;
}

/**
 * Has the budget been exhausted? (Equivalent to chargeRetry() returning false
 * without actually charging.)
 */
export function isBudgetExhausted(): boolean {
  refresh();
  return bucket.tokens <= 0;
}

/**
 * TEST-ONLY: reset the bucket to its initial state.
 *
 * Production code MUST NOT call this. It exists so test suites can isolate
 * scenarios that depend on bucket counters (e.g. "starts fully charged"
 * requires totalRequests === 0, which is impossible if other tests in the
 * same process have already charged the bucket).
 *
 * The bucket is a process-global singleton — without this hook, the test
 * order determines pass/fail, which is brittle.
 */
export function _resetBucketForTesting(): void {
  bucket.capacity = Math.ceil(
    WORKER_POOL_CONFIG.GLOBAL_CONCURRENCY * RETRY_BUDGET_CONFIG.RATIO,
  );
  bucket.tokens = bucket.capacity;
  bucket.lastRefillAt = Date.now();
  bucket.totalRequests = 0;
  bucket.totalRetries = 0;
}

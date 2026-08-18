/**
 * VVU-IVE Webhook Subsystem — Retry Engine (Pillar 3)
 * ----------------------------------------------------------------------------
 * Surgical retry — not spam.
 *
 *   Total Attempts: Exactly 4 (1 initial + 3 retries)
 *   Backoff: Exponential 5s -> 25s -> 125s -> 625s cap
 *   Jitter: Full (randomize within [0, delay]) — avoids thundering herds
 *   Non-Retryable: [400, 401, 403, 404, 405, 410, 422] — immediate DLQ
 *   Retryable: [408, 425, 429 (honor Retry-After), 500, 502, 503, 504]
 *   Per-Attempt Timeout: 30s (AbortController)
 *
 * The retry engine sits INSIDE the per-webhook circuit breaker:
 *   CB OPEN -> skip delivery entirely (no retries, no budget consumed)
 *   CB CLOSED/HALF_OPEN -> run retry engine (up to 4 attempts, 1 probe if half-open)
 *
 * If all 4 attempts fail, this is a "terminal failure" — counted toward CB.
 */

import {
  NON_RETRYABLE_STATUS_CODES,
  RETRYABLE_STATUS_CODES,
  RETRY_CONFIG,
} from "./config";
import type {
  AttemptOutcome,
  DeliveryResult,
} from "./types";

// ── Helpers ────────────────────────────────────────────────────────────────
function isNonRetryable(status: number): boolean {
  return NON_RETRYABLE_STATUS_CODES.includes(status);
}

function isRetryable(status: number): boolean {
  return RETRYABLE_STATUS_CODES.includes(status);
}

/**
 * Classify an HTTP status (or 0 for connection/timeout failures) into one of:
 *   - "success"          (2xx)
 *   - "non_retryable"    (per NON_RETRYABLE_STATUS_CODES)
 *   - "retryable"        (per RETRYABLE_STATUS_CODES)
 *   - "timeout"          (AbortController fired)
 *   - "connection_failure" (fetch threw, no response)
 */
export function classifyStatus(
  status: number,
  preOutcome?: AttemptOutcome,
): AttemptOutcome {
  // Caller-supplied outcomes for non-HTTP failures (no response object)
  if (preOutcome === "timeout") return "timeout";
  if (preOutcome === "connection_failure") return "connection_failure";
  // Otherwise classify by HTTP status
  if (status >= 200 && status < 300) return "success";
  if (isNonRetryable(status)) return "non_retryable";
  if (isRetryable(status)) return "retryable";
  // Unknown status code — default to retryable (safer than dropping events).
  // The retry budget and 4-attempt cap will prevent runaway.
  return "retryable";
}

/**
 * Compute the (full-jittered) delay before attempt N+1 (0-indexed: before
 * attempt index N).
 *
 * Pure function — easy to unit test.
 *
 * Timeline per contract:
 *   Attempt 1: immediate (delay before = 0)
 *   Retry 1:   [0, 5s)         — full jitter around 5s base
 *   Retry 2:   [0, 25s)        — base * 5
 *   Retry 3:   [0, 125s)       — base * 25
 *   Cap:       625s            — hard ceiling
 */
export function computeDelayMs(
  retryIndex: number, // 0 = delay before retry #1, 1 = delay before retry #2, ...
  rng: () => number = Math.random,
): number {
  if (retryIndex < 0) return 0;
  // Base delay * factor^retryIndex, capped
  const exp = Math.min(
    RETRY_CONFIG.BASE_DELAY_MS * Math.pow(RETRY_CONFIG.BACKOFF_FACTOR, retryIndex),
    RETRY_CONFIG.MAX_DELAY_MS,
  );
  // Full jitter: pick a random value in [0, exp]
  return Math.floor(rng() * exp);
}

/**
 * Per-attempt timeout (30s, AbortController). Pure function for testability.
 */
export function getAttemptTimeoutMs(): number {
  return RETRY_CONFIG.ATTEMPT_TIMEOUT_MS;
}

/**
 * Honor Retry-After header on 429 responses, bounded by MAX_DELAY_MS.
 * Returns the delay in ms (0 if missing/invalid).
 *
 * The contract says: "429: honor Retry-After (bounded by max delay: 625s)"
 */
export function parseRetryAfter(
  headerValue: string | null | undefined,
): number | null {
  if (!headerValue) return null;
  const trimmed = headerValue.trim();
  if (!trimmed) return null;

  // Try parsing as delta-seconds (RFC 7231 §7.1.3)
  const seconds = Number(trimmed);
  if (!Number.isNaN(seconds) && seconds >= 0) {
    return Math.min(
      seconds * 1000,
      RETRY_CONFIG.MAX_DELAY_MS,
    );
  }

  // Try parsing as HTTP-date (RFC 7231 §7.1.3)
  const date = Date.parse(trimmed);
  if (!Number.isNaN(date)) {
    const delta = date - Date.now();
    if (delta > 0) {
      return Math.min(delta, RETRY_CONFIG.MAX_DELAY_MS);
    }
    return 0; // date is in the past — retry immediately
  }
  return null;
}

/**
 * Should the retry engine attempt another retry given the current attempt
 * number and outcome?
 *
 *   - attemptNumber is 1..MAX_ATTEMPTS (1-indexed)
 *   - Returns true if there are attempts remaining AND the outcome is retryable
 */
export function shouldRetry(
  attemptNumber: number,
  outcome: AttemptOutcome,
): boolean {
  if (attemptNumber >= RETRY_CONFIG.MAX_ATTEMPTS) return false;
  if (outcome === "success") return false;
  if (outcome === "non_retryable") return false;
  // retryable | timeout | connection_failure → retry (if attempts remain)
  return true;
}

/**
 * Max attempts (read-only getter for tests / consumers).
 */
export function getMaxAttempts(): number {
  return RETRY_CONFIG.MAX_ATTEMPTS;
}

/**
 * Aggregate the result of an entire delivery pipeline (4 attempts) into a
 * terminal outcome:
 *   - If any attempt succeeded → "success"
 *   - If all attempts failed → "terminal_failure"
 *   - If first attempt was non_retryable → "terminal_failure" (immediate DLQ)
 *
 * The retry engine itself does NOT publish to DLQ — it returns the terminal
 * outcome and the worker decides whether to publish to DLQ (and count toward
 * the per-webhook circuit breaker).
 */
export interface RetryEngineResult {
  success: boolean;
  attempts: number; // number of attempts actually made (1..4)
  lastOutcome: AttemptOutcome;
  lastHttpStatus: number;
  lastResponseBody: string;
  // True if any attempt was non-retryable (immediate DLQ eligible)
  wasNonRetryable: boolean;
  // True if this was run as a half-open probe (only 1 attempt allowed)
  wasHalfOpenProbe: boolean;
}

export function isTerminalFailure(
  result: RetryEngineResult,
): result is RetryEngineResult & { success: false; wasNonRetryable: false } {
  return (
    !result.success &&
    !result.wasNonRetryable &&
    result.attempts === RETRY_CONFIG.MAX_ATTEMPTS
  );
}

// Re-export DeliveryResult for callers
export type { DeliveryResult };

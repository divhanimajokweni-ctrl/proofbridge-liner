import {
  NON_RETRYABLE_STATUS_CODES,
  RETRYABLE_STATUS_CODES,
  RETRY_CONFIG
} from "./config";
function isNonRetryable(status) {
  return NON_RETRYABLE_STATUS_CODES.includes(status);
}
function isRetryable(status) {
  return RETRYABLE_STATUS_CODES.includes(status);
}
function classifyStatus(status, preOutcome) {
  if (preOutcome === "timeout") return "timeout";
  if (preOutcome === "connection_failure") return "connection_failure";
  if (status >= 200 && status < 300) return "success";
  if (isNonRetryable(status)) return "non_retryable";
  if (isRetryable(status)) return "retryable";
  return "retryable";
}
function computeDelayMs(retryIndex, rng = Math.random) {
  if (retryIndex < 0) return 0;
  const exp = Math.min(
    RETRY_CONFIG.BASE_DELAY_MS * Math.pow(RETRY_CONFIG.BACKOFF_FACTOR, retryIndex),
    RETRY_CONFIG.MAX_DELAY_MS
  );
  return Math.floor(rng() * exp);
}
function getAttemptTimeoutMs() {
  return RETRY_CONFIG.ATTEMPT_TIMEOUT_MS;
}
function parseRetryAfter(headerValue) {
  if (!headerValue) return null;
  const trimmed = headerValue.trim();
  if (!trimmed) return null;
  const seconds = Number(trimmed);
  if (!Number.isNaN(seconds) && seconds >= 0) {
    return Math.min(
      seconds * 1e3,
      RETRY_CONFIG.MAX_DELAY_MS
    );
  }
  const date = Date.parse(trimmed);
  if (!Number.isNaN(date)) {
    const delta = date - Date.now();
    if (delta > 0) {
      return Math.min(delta, RETRY_CONFIG.MAX_DELAY_MS);
    }
    return 0;
  }
  return null;
}
function shouldRetry(attemptNumber, outcome) {
  if (attemptNumber >= RETRY_CONFIG.MAX_ATTEMPTS) return false;
  if (outcome === "success") return false;
  if (outcome === "non_retryable") return false;
  return true;
}
function getMaxAttempts() {
  return RETRY_CONFIG.MAX_ATTEMPTS;
}
function isTerminalFailure(result) {
  return !result.success && !result.wasNonRetryable && result.attempts === RETRY_CONFIG.MAX_ATTEMPTS;
}
export {
  classifyStatus,
  computeDelayMs,
  getAttemptTimeoutMs,
  getMaxAttempts,
  isTerminalFailure,
  parseRetryAfter,
  shouldRetry
};

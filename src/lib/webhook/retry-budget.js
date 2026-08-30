var __defProp = Object.defineProperty;
var __getOwnPropSymbols = Object.getOwnPropertySymbols;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __propIsEnum = Object.prototype.propertyIsEnumerable;
var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __spreadValues = (a, b) => {
  for (var prop in b || (b = {}))
    if (__hasOwnProp.call(b, prop))
      __defNormalProp(a, prop, b[prop]);
  if (__getOwnPropSymbols)
    for (var prop of __getOwnPropSymbols(b)) {
      if (__propIsEnum.call(b, prop))
        __defNormalProp(a, prop, b[prop]);
    }
  return a;
};
var _a;
import { RETRY_BUDGET_CONFIG, WORKER_POOL_CONFIG } from "./config";
const initialState = {
  capacity: Math.ceil(WORKER_POOL_CONFIG.GLOBAL_CONCURRENCY * RETRY_BUDGET_CONFIG.RATIO),
  tokens: Math.ceil(WORKER_POOL_CONFIG.GLOBAL_CONCURRENCY * RETRY_BUDGET_CONFIG.RATIO),
  lastRefillAt: Date.now(),
  totalRequests: 0,
  totalRetries: 0
};
const globalForBucket = globalThis;
const bucket = (_a = globalForBucket.__vvuRetryBucket) != null ? _a : globalForBucket.__vvuRetryBucket = initialState;
async function chargeRetry() {
  refresh();
  bucket.totalRequests++;
  if (bucket.tokens > 0) {
    bucket.tokens--;
    bucket.totalRetries++;
    return true;
  }
  return false;
}
async function recordInitialAttempt() {
  bucket.totalRequests++;
}
function refresh() {
  const now = Date.now();
  const elapsed = now - bucket.lastRefillAt;
  if (elapsed <= 0) return;
  const ratePerMs = bucket.capacity / RETRY_BUDGET_CONFIG.REFRESH_INTERVAL_MS;
  const newTokens = Math.min(
    bucket.capacity,
    bucket.tokens + elapsed * ratePerMs
  );
  bucket.tokens = newTokens;
  bucket.lastRefillAt = now;
}
function getBucketState() {
  refresh();
  return __spreadValues({}, bucket);
}
function getRetryRatio() {
  if (bucket.totalRequests === 0) return 0;
  return bucket.totalRetries / bucket.totalRequests;
}
function isBudgetExhausted() {
  refresh();
  return bucket.tokens <= 0;
}
function _resetBucketForTesting() {
  bucket.capacity = Math.ceil(
    WORKER_POOL_CONFIG.GLOBAL_CONCURRENCY * RETRY_BUDGET_CONFIG.RATIO
  );
  bucket.tokens = bucket.capacity;
  bucket.lastRefillAt = Date.now();
  bucket.totalRequests = 0;
  bucket.totalRetries = 0;
}
export {
  _resetBucketForTesting,
  chargeRetry,
  getBucketState,
  getRetryRatio,
  isBudgetExhausted,
  recordInitialAttempt
};

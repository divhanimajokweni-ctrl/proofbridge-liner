import { IDEMPOTENCY_CONFIG, RETRY_CONFIG } from "./config";
import { parseRetryAfter } from "./retry";
async function deliverOnce(params) {
  const {
    webhook,
    deliveryId,
    payload,
    fetchImpl = fetch
  } = params;
  const headers = {
    "Content-Type": "application/json",
    [IDEMPOTENCY_CONFIG.HEADER_NAME]: deliveryId,
    // = Idempotency-Key
    "User-Agent": "VVU-IVE-Webhook/1.0 (+https://proofbridge-liner/vvu-ive)"
  };
  if (webhook.secret) {
    const sig = await hmacSha256(webhook.secret, payload);
    headers["X-VVU-Signature"] = `sha256=${sig}`;
  }
  if (webhook.nextSecret) {
    const sigNext = await hmacSha256(webhook.nextSecret, payload);
    headers["X-VVU-Signature-Next"] = `sha256=${sigNext}`;
  }
  const controller = new AbortController();
  const timeoutId = setTimeout(
    () => controller.abort(),
    RETRY_CONFIG.ATTEMPT_TIMEOUT_MS
  );
  try {
    const response = await fetchImpl(webhook.url, {
      method: "POST",
      headers,
      body: payload,
      signal: controller.signal
    });
    const body = await response.text().catch(() => "");
    const truncated = body.length > 2048 ? body.slice(0, 2048) : body;
    let outcome;
    if (response.status >= 200 && response.status < 300) {
      outcome = "success";
    } else if (isNonRetryable(response.status)) {
      outcome = "non_retryable";
    } else if (isRetryable(response.status)) {
      outcome = "retryable";
    } else {
      outcome = "retryable";
    }
    let retryAfterMs = null;
    if (response.status === 429) {
      const retryAfterRaw = response.headers.get("retry-after");
      retryAfterMs = parseRetryAfter(retryAfterRaw);
    }
    return {
      outcome,
      httpStatus: response.status,
      responseBody: truncated,
      retryAfterMs
    };
  } catch (err) {
    if (err instanceof Error && err.name === "AbortError") {
      return {
        outcome: "timeout",
        httpStatus: 0,
        responseBody: "",
        retryAfterMs: null
      };
    }
    return {
      outcome: "connection_failure",
      httpStatus: 0,
      responseBody: err instanceof Error ? err.message.slice(0, 2048) : "",
      retryAfterMs: null
    };
  } finally {
    clearTimeout(timeoutId);
  }
}
function isNonRetryable(status) {
  return [400, 401, 403, 404, 405, 410, 422].includes(status);
}
function isRetryable(status) {
  return [408, 425, 429, 500, 502, 503, 504].includes(status);
}
async function hmacSha256(secret, payload) {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    enc.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const sig = await crypto.subtle.sign("HMAC", key, enc.encode(payload));
  return Array.from(new Uint8Array(sig)).map((b) => b.toString(16).padStart(2, "0")).join("");
}
export {
  deliverOnce
};

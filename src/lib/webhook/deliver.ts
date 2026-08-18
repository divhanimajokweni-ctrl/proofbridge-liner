/**
 * VVU-IVE Webhook Subsystem — HTTP Delivery (Pillar 5 — Idempotency)
 * ----------------------------------------------------------------------------
 * Single HTTP attempt to deliver a webhook event. Includes:
 *   - Idempotency-Key: <delivery_id> header (external system dedupes)
 *   - X-VVU-Signature header (HMAC-SHA256 of body using webhook.secret, if set)
 *   - 30s per-attempt timeout (AbortController)
 *   - Honor Retry-After on 429 (passed back up to retry engine)
 *
 * This module does NOT do retry — it performs exactly one HTTP request.
 * The retry engine (retry.ts) calls this function per attempt.
 */

import { IDEMPOTENCY_CONFIG, RETRY_CONFIG } from "./config";
import type {
  AttemptOutcome,
  WebhookRecord,
} from "./types";
import { parseRetryAfter } from "./retry";

export interface DeliverParams {
  webhook: WebhookRecord;
  deliveryId: string; // used as Idempotency-Key
  payload: string; // JSON-serialized event payload
  // Override the fetch implementation (for tests). Defaults to global fetch.
  fetchImpl?: typeof fetch;
}

export interface DeliverAttemptResult {
  outcome: AttemptOutcome;
  httpStatus: number;
  responseBody: string;
  // Parsed Retry-After header value in ms (null if missing). Used by retry engine.
  retryAfterMs: number | null;
}

/**
 * Perform a single HTTP POST to the webhook endpoint.
 *
 * Throws NEVER — returns a result object so the retry engine can branch
 * cleanly on outcome types.
 */
export async function deliverOnce(
  params: DeliverParams,
): Promise<DeliverAttemptResult> {
  const {
    webhook,
    deliveryId,
    payload,
    fetchImpl = fetch,
  } = params;

  // Build headers
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    [IDEMPOTENCY_CONFIG.HEADER_NAME]: deliveryId, // = Idempotency-Key
    "User-Agent": "VVU-IVE-Webhook/1.0 (+https://proofbridge-liner/vvu-ive)",
  };

  // Optional HMAC signature — sent on EVERY outbound delivery.
  //
  // SECRET ROTATION (Section 16 of dossier):
  //   When `webhook.nextSecret` is set (non-empty), we are mid-rotation.
  //   We send TWO signatures so receivers can validate with EITHER secret:
  //     - X-VVU-Signature        = HMAC-SHA256(payload, secret)       (current)
  //     - X-VVU-Signature-Next   = HMAC-SHA256(payload, nextSecret)   (incoming)
  //   Receivers should accept if EITHER signature matches the secret they hold.
  //
  //   Once all receivers have migrated to `nextSecret`, an admin promotes
  //   it (secret = nextSecret; nextSecret = null) and the next-secret
  //   header disappears automatically.
  if (webhook.secret) {
    const sig = await hmacSha256(webhook.secret, payload);
    headers["X-VVU-Signature"] = `sha256=${sig}`;
  }
  if (webhook.nextSecret) {
    const sigNext = await hmacSha256(webhook.nextSecret, payload);
    headers["X-VVU-Signature-Next"] = `sha256=${sigNext}`;
  }

  // AbortController for 30s timeout
  const controller = new AbortController();
  const timeoutId = setTimeout(
    () => controller.abort(),
    RETRY_CONFIG.ATTEMPT_TIMEOUT_MS,
  );

  try {
    const response = await fetchImpl(webhook.url, {
      method: "POST",
      headers,
      body: payload,
      signal: controller.signal,
    });

    const body = await response.text().catch(() => "");
    const truncated = body.length > 2048 ? body.slice(0, 2048) : body;

    // Classify outcome (also exposed via retry.ts classifyStatus for callers)
    let outcome: AttemptOutcome;
    if (response.status >= 200 && response.status < 300) {
      outcome = "success";
    } else if (isNonRetryable(response.status)) {
      outcome = "non_retryable";
    } else if (isRetryable(response.status)) {
      outcome = "retryable";
    } else {
      // Unknown status — be conservative: treat as retryable (the retry budget
      // and 4-attempt cap will prevent runaway)
      outcome = "retryable";
    }

    // Honor Retry-After on 429
    let retryAfterMs: number | null = null;
    if (response.status === 429) {
      const retryAfterRaw = response.headers.get("retry-after");
      retryAfterMs = parseRetryAfter(retryAfterRaw);
    }

    return {
      outcome,
      httpStatus: response.status,
      responseBody: truncated,
      retryAfterMs,
    };
  } catch (err) {
    // Distinguish AbortController timeout from connection failure
    if (err instanceof Error && err.name === "AbortError") {
      return {
        outcome: "timeout",
        httpStatus: 0,
        responseBody: "",
        retryAfterMs: null,
      };
    }
    // Otherwise: connection_failure (DNS, TLS, ECONNREFUSED, etc.)
    return {
      outcome: "connection_failure",
      httpStatus: 0,
      responseBody: err instanceof Error ? err.message.slice(0, 2048) : "",
      retryAfterMs: null,
    };
  } finally {
    clearTimeout(timeoutId);
  }
}

// ── Status-code classification (mirrors retry.ts but localized for one-shot
// delivery results) ──────────────────────────────────────────────────────────
function isNonRetryable(status: number): boolean {
  return [400, 401, 403, 404, 405, 410, 422].includes(status);
}

function isRetryable(status: number): boolean {
  return [408, 425, 429, 500, 502, 503, 504].includes(status);
}

// ── HMAC-SHA256 using WebCrypto (Bun + Node compatible) ─────────────────────
async function hmacSha256(secret: string, payload: string): Promise<string> {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    enc.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sig = await crypto.subtle.sign("HMAC", key, enc.encode(payload));
  return Array.from(new Uint8Array(sig))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

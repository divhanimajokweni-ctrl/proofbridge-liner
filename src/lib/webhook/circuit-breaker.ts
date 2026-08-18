/**
 * VVU-IVE Webhook Subsystem — Per-Webhook Circuit Breaker (Pillar 2)
 * ----------------------------------------------------------------------------
 * Failure isolation — a broken endpoint must be contained to itself.
 *
 * Scope: PER-WEBHOOK (NOT global).
 * Threshold: 10 terminal failures (an event that exhausted all 4 attempts).
 * Behavior: After 10 terminal failures, breaker OPENS for 300s. It skips all
 *   deliveries to that webhook (sends them straight to the DLQ as "skipped").
 * Half-Open: After 300s cooldown, allows exactly 1 probe request to test.
 *
 * Critical: The CB sits OUTSIDE the retry loop. The flow is:
 *
 *   Webhook delivery request
 *        │
 *        ▼
 *   Check CB State? ──── OPEN ──────► SKIP delivery → DLQ (skipped)
 *        │                                          (NOT auto-replayed)
 *        └─ CLOSED / HALF_OPEN
 *            │
 *            ▼
 *       Retry Engine (≤4 attempts)
 *            │
 *       success│failure
 *       │           │
 *       ▼           ▼
 *    reset CB    count++ terminal
 *                    │
 *              10 terminal? ── YES ──► OPEN CB (300s cooldown)
 *
 * Skipped events DO NOT auto-retry when CB closes. Operator must explicitly
 * replay via POST /api/v1/webhooks/{id}/delivery-attempts/{attempt_id}/retry.
 */

import { db } from "@/lib/db";
import { CIRCUIT_BREAKER_CONFIG } from "./config";
import type {
  CircuitBreakerState,
  DeliveryResult,
} from "./types";

// ── State machine ──────────────────────────────────────────────────────────
export interface CheckResult {
  decision: "PROCEED" | "SKIP";
  // When decision=PROCEED and state=HALF_OPEN, this delivery is the probe.
  isHalfOpenProbe: boolean;
  // When decision=SKIP, the reason (for DLQ entry).
  reason: string;
  // Current CB state (post-check)
  currentState: CircuitBreakerState;
}

/**
 * Check whether the next delivery to `webhookId` should proceed.
 *
 * Side effects:
 *   - If state=OPEN and cooldown elapsed → transition to HALF_OPEN (probe allowed)
 *
 * Concurrency: Per-webhook Kafka partition = single in-flight delivery, so no
 * locks are needed. The DB transaction provides ACID across processes.
 */
export async function checkBreaker(webhookId: string): Promise<CheckResult> {
  return await db.$transaction(async (tx) => {
    const row = await tx.webhookCircuitBreakerState.findUnique({
      where: { webhookId },
    });

    // No state row = CLOSED (default)
    if (!row) {
      return {
        decision: "PROCEED",
        isHalfOpenProbe: false,
        reason: "",
        currentState: "CLOSED",
      };
    }

    const state = row.state as CircuitBreakerState;

    if (state === "CLOSED") {
      return {
        decision: "PROCEED",
        isHalfOpenProbe: false,
        reason: "",
        currentState: "CLOSED",
      };
    }

    if (state === "OPEN") {
      // Check cooldown
      const openedAt = row.openedAt ?? new Date(0);
      const elapsed = Date.now() - openedAt.getTime();
      const cooldownMs = CIRCUIT_BREAKER_CONFIG.COOLDOWN_MS;

      if (elapsed < cooldownMs) {
        // Still OPEN — skip this delivery
        return {
          decision: "SKIP",
          isHalfOpenProbe: false,
          reason: "CIRCUIT_BREAKER_OPEN",
          currentState: "OPEN",
        };
      }

      // Cooldown elapsed — transition to HALF_OPEN, mark probe in flight
      await tx.webhookCircuitBreakerState.update({
        where: { webhookId },
        data: {
          state: "HALF_OPEN",
          halfOpenProbeAt: new Date(),
          halfOpenProbeResult: null,
          updatedAt: new Date(),
        },
      });
      return {
        decision: "PROCEED",
        isHalfOpenProbe: true,
        reason: "",
        currentState: "HALF_OPEN",
      };
    }

    // state === "HALF_OPEN"
    // Per contract: only 1 probe at a time. If a probe is already in flight
    // (halfOpenProbeAt set, no result yet), skip subsequent deliveries.
    if (row.halfOpenProbeAt && row.halfOpenProbeResult === null) {
      // Probe already in flight — skip
      return {
        decision: "SKIP",
        isHalfOpenProbe: false,
        reason: "CIRCUIT_BREAKER_HALF_OPEN_PROBE_IN_FLIGHT",
        currentState: "HALF_OPEN",
      };
    }

    // No probe in flight — issue a new one
    await tx.webhookCircuitBreakerState.update({
      where: { webhookId },
      data: {
        halfOpenProbeAt: new Date(),
        halfOpenProbeResult: null,
        updatedAt: new Date(),
      },
    });
    return {
      decision: "PROCEED",
      isHalfOpenProbe: true,
      reason: "",
      currentState: "HALF_OPEN",
    };
  });
}

/**
 * Record the result of a delivery attempt.
 *
 *   success → reset CB state:
 *     - If HALF_OPEN (this was the probe) → CLOSED, reset counters
 *     - If CLOSED → no change
 *
 *   terminal failure → count toward threshold:
 *     - If HALF_OPEN (probe failed) → transition back to OPEN, restart cooldown
 *     - If CLOSED → terminalFailureCount++; if >= 10 → OPEN
 *
 * @param wasHalfOpenProbe — true if this delivery was issued as the CB probe
 * @param isTerminalFailure — true if retry engine exhausted all 4 attempts
 *   with retryable failures. Non-retryable failures (400/401/403/404/etc)
 *   are NOT counted toward the CB threshold (per contract — different layer).
 */
export async function recordResult(
  webhookId: string,
  wasHalfOpenProbe: boolean,
  isTerminalFailure: boolean,
): Promise<void> {
  await db.$transaction(async (tx) => {
    const row = await tx.webhookCircuitBreakerState.findUnique({
      where: { webhookId },
    });
    if (!row) {
      // No state row — create one if this was a failure (start counting)
      if (isTerminalFailure && !wasHalfOpenProbe) {
        await tx.webhookCircuitBreakerState.create({
          data: {
            webhookId,
            state: "CLOSED",
            terminalFailureCount: 1,
            updatedAt: new Date(),
          },
        });
      }
      return;
    }

    const state = row.state as CircuitBreakerState;

    if (!isTerminalFailure) {
      // Success — reset
      if (wasHalfOpenProbe || state === "HALF_OPEN") {
        // Probe succeeded — close the breaker, reset counters
        await tx.webhookCircuitBreakerState.update({
          where: { webhookId },
          data: {
            state: "CLOSED",
            terminalFailureCount: 0,
            openedAt: null,
            halfOpenProbeAt: null,
            halfOpenProbeResult: "success",
            updatedAt: new Date(),
          },
        });
      }
      // If CLOSED and we got a success — no state change needed
      return;
    }

    // Terminal failure
    if (wasHalfOpenProbe || state === "HALF_OPEN") {
      // Probe failed → back to OPEN, restart cooldown
      await tx.webhookCircuitBreakerState.update({
        where: { webhookId },
        data: {
          state: "OPEN",
          openedAt: new Date(),
          halfOpenProbeAt: null,
          halfOpenProbeResult: "failure",
          updatedAt: new Date(),
        },
      });
      return;
    }

    // CLOSED with terminal failure → count
    const newCount = row.terminalFailureCount + 1;
    if (newCount >= CIRCUIT_BREAKER_CONFIG.FAILURE_THRESHOLD) {
      // Trip the breaker
      await tx.webhookCircuitBreakerState.update({
        where: { webhookId },
        data: {
          state: "OPEN",
          terminalFailureCount: newCount,
          openedAt: new Date(),
          halfOpenProbeAt: null,
          halfOpenProbeResult: null,
          updatedAt: new Date(),
        },
      });
    } else {
      // Just count
      await tx.webhookCircuitBreakerState.update({
        where: { webhookId },
        data: {
          terminalFailureCount: newCount,
          updatedAt: new Date(),
        },
      });
    }
  });
}

/**
 * Force-reset a breaker (admin operation). Used after manual endpoint fix.
 *
 * CRITICAL: Resetting the breaker does NOT auto-replay skipped events.
 * Skipped events stay in the DLQ until explicitly replayed via
 * POST /api/v1/webhooks/{id}/delivery-attempts/{attempt_id}/retry.
 */
export async function forceReset(webhookId: string): Promise<void> {
  await db.webhookCircuitBreakerState.upsert({
    where: { webhookId },
    create: {
      webhookId,
      state: "CLOSED",
      terminalFailureCount: 0,
      openedAt: null,
      halfOpenProbeAt: null,
      halfOpenProbeResult: null,
      updatedAt: new Date(),
    },
    update: {
      state: "CLOSED",
      terminalFailureCount: 0,
      openedAt: null,
      halfOpenProbeAt: null,
      halfOpenProbeResult: null,
      updatedAt: new Date(),
    },
  });
}

/**
 * Inspect the current CB state for a webhook (admin UI).
 */
export async function getBreakerState(
  webhookId: string,
): Promise<{
  state: CircuitBreakerState;
  terminalFailureCount: number;
  openedAt: Date | null;
  halfOpenProbeAt: Date | null;
  halfOpenProbeResult: string | null;
} | null> {
  const row = await db.webhookCircuitBreakerState.findUnique({
    where: { webhookId },
  });
  if (!row) return null;
  return {
    state: row.state as CircuitBreakerState,
    terminalFailureCount: row.terminalFailureCount,
    openedAt: row.openedAt,
    halfOpenProbeAt: row.halfOpenProbeAt,
    halfOpenProbeResult: row.halfOpenProbeResult,
  };
}

// Re-export DeliveryResult type for callers
export type { DeliveryResult };

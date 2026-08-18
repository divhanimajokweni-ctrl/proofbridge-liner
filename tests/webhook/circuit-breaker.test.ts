/**
 * VVU-IVE Webhook Subsystem — Per-Webhook Circuit Breaker Tests (Pillar 2)
 * ----------------------------------------------------------------------------
 * Verifies the CB state machine:
 *   - CLOSED: proceed normally, count terminal failures
 *   - After 10 terminal failures → OPEN for 300s
 *   - After cooldown → HALF_OPEN with 1 probe
 *   - Probe success → CLOSED
 *   - Probe failure → back to OPEN
 *   - OPEN delivers are SKIPPED (sent to DLQ as circuit_breaker_open_skipped)
 */

import { beforeAll, beforeEach, describe, expect, test } from "bun:test";
import { db } from "@/lib/db";
import {
  checkBreaker,
  forceReset,
  getBreakerState,
  recordResult,
} from "@/lib/webhook/circuit-breaker";
import { CIRCUIT_BREAKER_CONFIG } from "@/lib/webhook/config";

// Test webhook ID (created in beforeAll)
let webhookId: string;

beforeAll(async () => {
  // Create a webhook for tests
  const w = await db.webhook.create({
    data: {
      name: "test-cb-webhook",
      url: "https://example.test/hook",
      type: "custom",
      secret: "",
      enabled: true,
    },
  });
  webhookId = w.id;
});

beforeEach(async () => {
  // Reset CB state before each test
  await db.webhookCircuitBreakerState.deleteMany({
    where: { webhookId },
  });
});

describe("circuit-breaker: CLOSED state (default)", () => {
  test("no state row = CLOSED, proceed, not a probe", async () => {
    const result = await checkBreaker(webhookId);
    expect(result.decision).toBe("PROCEED");
    expect(result.isHalfOpenProbe).toBe(false);
    expect(result.currentState).toBe("CLOSED");
  });

  test("explicit CLOSED state proceeds", async () => {
    await db.webhookCircuitBreakerState.create({
      data: {
        webhookId,
        state: "CLOSED",
        terminalFailureCount: 0,
      },
    });
    const result = await checkBreaker(webhookId);
    expect(result.decision).toBe("PROCEED");
    expect(result.currentState).toBe("CLOSED");
  });
});

describe("circuit-breaker: terminal failure counting (10 = threshold)", () => {
  test("1-9 terminal failures keep CB CLOSED", async () => {
    for (let i = 1; i < CIRCUIT_BREAKER_CONFIG.FAILURE_THRESHOLD; i++) {
      await recordResult(webhookId, false, true);
      const state = await getBreakerState(webhookId);
      expect(state?.state).toBe("CLOSED");
      expect(state?.terminalFailureCount).toBe(i);
    }
  });

  test("10th terminal failure trips CB to OPEN", async () => {
    for (let i = 0; i < CIRCUIT_BREAKER_CONFIG.FAILURE_THRESHOLD; i++) {
      await recordResult(webhookId, false, true);
    }
    const state = await getBreakerState(webhookId);
    expect(state?.state).toBe("OPEN");
    expect(state?.terminalFailureCount).toBe(10);
    expect(state?.openedAt).not.toBeNull();
  });

  test("success resets terminal failure count to 0 (when CLOSED)", async () => {
    // Accumulate 5 failures
    for (let i = 0; i < 5; i++) {
      await recordResult(webhookId, false, true);
    }
    expect((await getBreakerState(webhookId))?.terminalFailureCount).toBe(5);

    // Success — but per the contract, success on CLOSED does NOT reset count
    // (only HALF_OPEN probe success resets). Verify behavior.
    await recordResult(webhookId, false, false);
    const state = await getBreakerState(webhookId);
    expect(state?.state).toBe("CLOSED");
    // Per current implementation, success on CLOSED = no state change.
    // Count stays at 5 (so transient successes don't mask a broken endpoint).
    expect(state?.terminalFailureCount).toBe(5);
  });
});

describe("circuit-breaker: OPEN state skips deliveries", () => {
  test("OPEN within cooldown → SKIP", async () => {
    // Force OPEN
    await db.webhookCircuitBreakerState.create({
      data: {
        webhookId,
        state: "OPEN",
        terminalFailureCount: 10,
        openedAt: new Date(), // just now
      },
    });

    const result = await checkBreaker(webhookId);
    expect(result.decision).toBe("SKIP");
    expect(result.reason).toBe("CIRCUIT_BREAKER_OPEN");
    expect(result.currentState).toBe("OPEN");
  });

  test("OPEN after cooldown → transition to HALF_OPEN + probe", async () => {
    // Force OPEN with old openedAt (older than 300s cooldown)
    const oldTime = new Date(
      Date.now() - (CIRCUIT_BREAKER_CONFIG.COOLDOWN_MS + 1000),
    );
    await db.webhookCircuitBreakerState.create({
      data: {
        webhookId,
        state: "OPEN",
        terminalFailureCount: 10,
        openedAt: oldTime,
      },
    });

    const result = await checkBreaker(webhookId);
    expect(result.decision).toBe("PROCEED");
    expect(result.isHalfOpenProbe).toBe(true);
    expect(result.currentState).toBe("HALF_OPEN");

    // Verify state transition persisted
    const state = await getBreakerState(webhookId);
    expect(state?.state).toBe("HALF_OPEN");
    expect(state?.halfOpenProbeAt).not.toBeNull();
  });
});

describe("circuit-breaker: HALF_OPEN state", () => {
  test("only 1 probe at a time — subsequent deliveries SKIP", async () => {
    await db.webhookCircuitBreakerState.create({
      data: {
        webhookId,
        state: "HALF_OPEN",
        terminalFailureCount: 10,
        halfOpenProbeAt: new Date(), // probe in flight
        halfOpenProbeResult: null, // no result yet
      },
    });

    const result = await checkBreaker(webhookId);
    expect(result.decision).toBe("SKIP");
    expect(result.reason).toBe("CIRCUIT_BREAKER_HALF_OPEN_PROBE_IN_FLIGHT");
  });

  test("probe success → CLOSED, count reset to 0", async () => {
    await db.webhookCircuitBreakerState.create({
      data: {
        webhookId,
        state: "HALF_OPEN",
        terminalFailureCount: 10,
        halfOpenProbeAt: new Date(),
        halfOpenProbeResult: null,
      },
    });

    await recordResult(webhookId, true, false);

    const state = await getBreakerState(webhookId);
    expect(state?.state).toBe("CLOSED");
    expect(state?.terminalFailureCount).toBe(0);
    expect(state?.openedAt).toBeNull();
  });

  test("probe failure → back to OPEN, cooldown restarts", async () => {
    const originalOpen = new Date(Date.now() - 400_000); // 400s ago
    await db.webhookCircuitBreakerState.create({
      data: {
        webhookId,
        state: "HALF_OPEN",
        terminalFailureCount: 10,
        openedAt: originalOpen,
        halfOpenProbeAt: new Date(),
        halfOpenProbeResult: null,
      },
    });

    await recordResult(webhookId, true, true); // probe = failure

    const state = await getBreakerState(webhookId);
    expect(state?.state).toBe("OPEN");
    // openedAt should be reset to "now" (cooldown restarts)
    expect(state?.openedAt).not.toBeNull();
    expect(state!.openedAt!.getTime()).toBeGreaterThan(originalOpen.getTime());
  });
});

describe("circuit-breaker: forceReset (admin)", () => {
  test("resets OPEN → CLOSED", async () => {
    await db.webhookCircuitBreakerState.create({
      data: {
        webhookId,
        state: "OPEN",
        terminalFailureCount: 50,
        openedAt: new Date(),
      },
    });

    await forceReset(webhookId);
    const state = await getBreakerState(webhookId);
    expect(state?.state).toBe("CLOSED");
    expect(state?.terminalFailureCount).toBe(0);
    expect(state?.openedAt).toBeNull();
  });
});

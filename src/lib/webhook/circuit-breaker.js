import { db } from "@/lib/db";
import { CIRCUIT_BREAKER_CONFIG } from "./config";
async function checkBreaker(webhookId) {
  return await db.$transaction(async (tx) => {
    var _a;
    const row = await tx.webhookCircuitBreakerState.findUnique({
      where: { webhookId }
    });
    if (!row) {
      return {
        decision: "PROCEED",
        isHalfOpenProbe: false,
        reason: "",
        currentState: "CLOSED"
      };
    }
    const state = row.state;
    if (state === "CLOSED") {
      return {
        decision: "PROCEED",
        isHalfOpenProbe: false,
        reason: "",
        currentState: "CLOSED"
      };
    }
    if (state === "OPEN") {
      const openedAt = (_a = row.openedAt) != null ? _a : /* @__PURE__ */ new Date(0);
      const elapsed = Date.now() - openedAt.getTime();
      const cooldownMs = CIRCUIT_BREAKER_CONFIG.COOLDOWN_MS;
      if (elapsed < cooldownMs) {
        return {
          decision: "SKIP",
          isHalfOpenProbe: false,
          reason: "CIRCUIT_BREAKER_OPEN",
          currentState: "OPEN"
        };
      }
      await tx.webhookCircuitBreakerState.update({
        where: { webhookId },
        data: {
          state: "HALF_OPEN",
          halfOpenProbeAt: /* @__PURE__ */ new Date(),
          halfOpenProbeResult: null,
          updatedAt: /* @__PURE__ */ new Date()
        }
      });
      return {
        decision: "PROCEED",
        isHalfOpenProbe: true,
        reason: "",
        currentState: "HALF_OPEN"
      };
    }
    if (row.halfOpenProbeAt && row.halfOpenProbeResult === null) {
      return {
        decision: "SKIP",
        isHalfOpenProbe: false,
        reason: "CIRCUIT_BREAKER_HALF_OPEN_PROBE_IN_FLIGHT",
        currentState: "HALF_OPEN"
      };
    }
    await tx.webhookCircuitBreakerState.update({
      where: { webhookId },
      data: {
        halfOpenProbeAt: /* @__PURE__ */ new Date(),
        halfOpenProbeResult: null,
        updatedAt: /* @__PURE__ */ new Date()
      }
    });
    return {
      decision: "PROCEED",
      isHalfOpenProbe: true,
      reason: "",
      currentState: "HALF_OPEN"
    };
  });
}
async function recordResult(webhookId, wasHalfOpenProbe, isTerminalFailure) {
  await db.$transaction(async (tx) => {
    const row = await tx.webhookCircuitBreakerState.findUnique({
      where: { webhookId }
    });
    if (!row) {
      if (isTerminalFailure && !wasHalfOpenProbe) {
        await tx.webhookCircuitBreakerState.create({
          data: {
            webhookId,
            state: "CLOSED",
            terminalFailureCount: 1,
            updatedAt: /* @__PURE__ */ new Date()
          }
        });
      }
      return;
    }
    const state = row.state;
    if (!isTerminalFailure) {
      if (wasHalfOpenProbe || state === "HALF_OPEN") {
        await tx.webhookCircuitBreakerState.update({
          where: { webhookId },
          data: {
            state: "CLOSED",
            terminalFailureCount: 0,
            openedAt: null,
            halfOpenProbeAt: null,
            halfOpenProbeResult: "success",
            updatedAt: /* @__PURE__ */ new Date()
          }
        });
      }
      return;
    }
    if (wasHalfOpenProbe || state === "HALF_OPEN") {
      await tx.webhookCircuitBreakerState.update({
        where: { webhookId },
        data: {
          state: "OPEN",
          openedAt: /* @__PURE__ */ new Date(),
          halfOpenProbeAt: null,
          halfOpenProbeResult: "failure",
          updatedAt: /* @__PURE__ */ new Date()
        }
      });
      return;
    }
    const newCount = row.terminalFailureCount + 1;
    if (newCount >= CIRCUIT_BREAKER_CONFIG.FAILURE_THRESHOLD) {
      await tx.webhookCircuitBreakerState.update({
        where: { webhookId },
        data: {
          state: "OPEN",
          terminalFailureCount: newCount,
          openedAt: /* @__PURE__ */ new Date(),
          halfOpenProbeAt: null,
          halfOpenProbeResult: null,
          updatedAt: /* @__PURE__ */ new Date()
        }
      });
    } else {
      await tx.webhookCircuitBreakerState.update({
        where: { webhookId },
        data: {
          terminalFailureCount: newCount,
          updatedAt: /* @__PURE__ */ new Date()
        }
      });
    }
  });
}
async function forceReset(webhookId) {
  await db.webhookCircuitBreakerState.upsert({
    where: { webhookId },
    create: {
      webhookId,
      state: "CLOSED",
      terminalFailureCount: 0,
      openedAt: null,
      halfOpenProbeAt: null,
      halfOpenProbeResult: null,
      updatedAt: /* @__PURE__ */ new Date()
    },
    update: {
      state: "CLOSED",
      terminalFailureCount: 0,
      openedAt: null,
      halfOpenProbeAt: null,
      halfOpenProbeResult: null,
      updatedAt: /* @__PURE__ */ new Date()
    }
  });
}
async function getBreakerState(webhookId) {
  const row = await db.webhookCircuitBreakerState.findUnique({
    where: { webhookId }
  });
  if (!row) return null;
  return {
    state: row.state,
    terminalFailureCount: row.terminalFailureCount,
    openedAt: row.openedAt,
    halfOpenProbeAt: row.halfOpenProbeAt,
    halfOpenProbeResult: row.halfOpenProbeResult
  };
}
export {
  checkBreaker,
  forceReset,
  getBreakerState,
  recordResult
};

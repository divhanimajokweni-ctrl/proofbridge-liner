import {
  buildColonyProjection,
  buildUIProjection,
  buildMetricsProjection,
  buildNotificationProjection,
  buildAllProjections,
} from "../projection-manager";
import { createInitialState } from "../reducer";
import type { RuntimeState, RuntimeEvent } from "../types";

function sampleState(overrides: Partial<RuntimeState> = {}): RuntimeState {
  return {
    ...createInitialState(),
    kernelState: "VERIFYING",
    trust: 0.85,
    sigma: 0.04,
    confidence: 72,
    sequence: 14,
    epoch: 3,
    quorum: { pass: 8, total: 10 },
    evidenceLeaves: [
      { id: "leaf-1", claim: "c1", source: "s1", confidence: "high", tags: [], verified: true, addedAt: 1000 },
      { id: "leaf-2", claim: "c2", source: "s2", confidence: "medium", tags: [], verified: false, addedAt: 2000 },
    ],
    receipts: [
      { receiptId: "rcpt-1", receiptHash: "h1", envelopeHash: "h2", signature: "sig", chainHash: "0x1", committedAt: 3000 },
    ],
    startedAt: 0,
    lastEventAt: 4000,
    ...overrides,
  };
}

describe("Projection Manager", () => {
  describe("ColonyProjection", () => {
    it("derives activeCarriers from kernel state", () => {
      expect(buildColonyProjection(sampleState({ kernelState: "VERIFYING" })).activeCarriers).toBe(4);
      expect(buildColonyProjection(sampleState({ kernelState: "INGESTING" })).activeCarriers).toBe(2);
      expect(buildColonyProjection(sampleState({ kernelState: "IDLE" })).activeCarriers).toBe(0);
      expect(buildColonyProjection(sampleState({ kernelState: "HAZARD" })).activeCarriers).toBe(0);
    });

    it("computes verificationQueueDepth from unverified leaves", () => {
      const col = buildColonyProjection(sampleState());
      expect(col.verificationQueueDepth).toBe(1); // leaf-2 is unverified
    });

    it("reports canopyLeafCount as total evidence", () => {
      const col = buildColonyProjection(sampleState());
      expect(col.canopyLeafCount).toBe(2);
    });

    it("sets sentinel patrol intensity based on state", () => {
      expect(buildColonyProjection(sampleState({ kernelState: "SETTLED" })).sentinelPatrolIntensity).toBe(0.3);
      expect(buildColonyProjection(sampleState({ kernelState: "HAZARD" })).sentinelPatrolIntensity).toBe(0.9);
      expect(buildColonyProjection(sampleState({ circuitBreakerOpen: true })).sentinelPatrolIntensity).toBe(1.0);
    });

    it("reports hazardMode when kernel is in HAZARD", () => {
      expect(buildColonyProjection(sampleState({ kernelState: "HAZARD" })).hazardMode).toBe(true);
      expect(buildColonyProjection(sampleState({ kernelState: "IDLE" })).hazardMode).toBe(false);
    });

    it("exposes trustScore from runtime state", () => {
      expect(buildColonyProjection(sampleState({ trust: 0.92 })).trustScore).toBe(0.92);
    });

    it("computes canopyGrowthRate from leaves and uptime", () => {
      const state = sampleState({ startedAt: 0, lastEventAt: 120000, evidenceLeaves: [
        { id: "l1", claim: "c1", source: "s1", confidence: "high", tags: [], verified: true, addedAt: 1000 },
      ]});
      // 2 minutes uptime, 1 leaf → 0.5 leaves/min
      expect(buildColonyProjection(state).canopyGrowthRate).toBeCloseTo(0.5, 1);
    });
  });

  describe("UIProjection", () => {
    it("passes through kernelState", () => {
      const ui = buildUIProjection(sampleState({ kernelState: "COMMITTING" }));
      expect(ui.kernelState).toBe("COMMITTING");
    });

    it("passes through trust, sigma, confidence, epoch", () => {
      const ui = buildUIProjection(sampleState({ trust: 0.75, sigma: 0.05, confidence: 88, epoch: 5 }));
      expect(ui.trust).toBe(0.75);
      expect(ui.sigma).toBe(0.05);
      expect(ui.confidence).toBe(88);
      expect(ui.epoch).toBe(5);
    });

    it("passes through quorum counts", () => {
      const ui = buildUIProjection(sampleState({ quorum: { pass: 3, total: 5 } }));
      expect(ui.quorum).toEqual({ pass: 3, total: 5 });
    });

    it("passes through sequence and hash chain", () => {
      const ui = buildUIProjection(sampleState({ sequence: 20, hashChainIntact: false }));
      expect(ui.sequence).toBe(20);
      expect(ui.hashChainIntact).toBe(false);
    });

    it("exposes circuitBreakerOpen and hazardReason", () => {
      const ui = buildUIProjection(sampleState({ circuitBreakerOpen: true, hazardReason: "breach" }));
      expect(ui.circuitBreakerOpen).toBe(true);
      expect(ui.hazardReason).toBe("breach");
    });

    it("transforms lastError with only code/message", () => {
      const ui = buildUIProjection(sampleState({ lastError: { code: "E001", message: "fail", recoverable: true } }));
      expect(ui.lastError).toEqual({ code: "E001", message: "fail" });
    });

    it("copies evidenceLeaves and receipts", () => {
      const state = sampleState();
      const ui = buildUIProjection(state);
      expect(ui.evidenceLeaves).toHaveLength(state.evidenceLeaves.length);
      expect(ui.receipts).toHaveLength(state.receipts.length);
    });
  });

  describe("MetricsProjection", () => {
    it("counts events from sequence number", () => {
      const metrics = buildMetricsProjection(sampleState({ sequence: 14 }));
      expect(metrics.eventCount).toBe(14);
    });

    it("computes eventRate from events / uptime minutes", () => {
      const state = sampleState({ sequence: 30, startedAt: 0, lastEventAt: 600000 });
      // 30 events over 10 minutes = 3/min
      expect(buildMetricsProjection(state).eventRate).toBe(3);
    });

    it("counts verification failures", () => {
      const metrics = buildMetricsProjection(sampleState({ quorum: { pass: 8, total: 10 } }));
      expect(metrics.verificationCount).toBe(10);
      expect(metrics.verificationFailures).toBe(2);
    });

    it("computes average confidence from evidence leaves", () => {
      const state = sampleState();
      // high=0.9, medium=0.6 → avg=0.75 → *100=75
      expect(buildMetricsProjection(state).averageConfidence).toBe(75);
    });

    it("preserves previous metrics on circuitBreakerTriggers", () => {
      const prev = { circuitBreakerTriggers: 2, hazardEventCount: 1, renderLatency: 16, droppedFrames: 3, fps: 55 };
      const metrics = buildMetricsProjection(sampleState(), prev);
      expect(metrics.circuitBreakerTriggers).toBe(2);
      expect(metrics.hazardEventCount).toBe(1);
      expect(metrics.renderLatency).toBe(16);
    });
  });

  describe("NotificationProjection", () => {
    it("reports hazardMode and circuitBreakerOpen", () => {
      const state = sampleState({ kernelState: "HAZARD", circuitBreakerOpen: true });
      const notif = buildNotificationProjection(state, []);
      expect(notif.hazardMode).toBe(true);
      expect(notif.circuitBreakerOpen).toBe(true);
    });

    it("counts unverified evidence", () => {
      const state = sampleState();
      const notif = buildNotificationProjection(state, []);
      expect(notif.unverifiedCount).toBe(1);
    });

    it("generates alerts from recent events", () => {
      const state = createInitialState();
      const events: RuntimeEvent[] = [
        { eventId: "e1", type: "CircuitBreakerOpened", version: 1, timestamp: 1000, sequence: 1, correlationId: "c1", causationId: null, source: "test", payload: { action: "open", reason: "threshold breach" } },
        { eventId: "e2", type: "SystemError", version: 1, timestamp: 2000, sequence: 2, correlationId: "c2", causationId: null, source: "test", payload: { code: "E001", message: "disk full", subsystem: "store", recoverable: false } },
        { eventId: "e3", type: "AttestationFailed", version: 1, timestamp: 3000, sequence: 3, correlationId: "c3", causationId: null, source: "test", payload: { receiptId: "r1", error: "timeout" } },
      ];
      const notif = buildNotificationProjection(state, events);
      expect(notif.activeAlerts).toHaveLength(3);
      expect(notif.activeAlerts[0].severity).toBe("critical");
      expect(notif.activeAlerts[0].message).toContain("threshold breach");
      expect(notif.activeAlerts[1].severity).toBe("critical");
      expect(notif.activeAlerts[2].severity).toBe("warning");
    });

    it("limits alerts to last 10 events", () => {
      const state = createInitialState();
      const events: RuntimeEvent[] = Array.from({ length: 15 }, (_, i) => ({
        eventId: `e${i}`,
        type: "CircuitBreakerOpened" as const,
        version: 1,
        timestamp: i * 1000,
        sequence: i + 1,
        correlationId: `c${i}`,
        causationId: null,
        source: "test",
        payload: { action: "open" as const, reason: `r${i}` },
      }));
      const notif = buildNotificationProjection(state, events);
      expect(notif.activeAlerts.length).toBeLessThanOrEqual(10);
    });
  });

  describe("buildAllProjections", () => {
    it("returns all four projections from a single call", () => {
      const all = buildAllProjections(sampleState());
      expect(all).toHaveProperty("colony");
      expect(all).toHaveProperty("ui");
      expect(all).toHaveProperty("metrics");
      expect(all).toHaveProperty("notifications");
    });
  });
});

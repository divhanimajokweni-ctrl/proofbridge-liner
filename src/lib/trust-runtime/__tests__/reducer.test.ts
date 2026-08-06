// @ts-nocheck
import { createInitialState, reduce, reduceBatch } from "../reducer";
import type { RuntimeEvent, RuntimeState } from "../types";

function makeEvent(
  type: RuntimeEvent["type"],
  overrides: Partial<RuntimeEvent> = {},
): RuntimeEvent {
  return {
    eventId: `evt-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    type,
    version: 1,
    timestamp: Date.now(),
    sequence: 1,
    correlationId: "test",
    causationId: null,
    source: "test",
    payload: {},
    ...overrides,
  };
}

describe("reducer (pure function)", () => {
  it("starts in IDLE state with default values", () => {
    const state = createInitialState();
    expect(state.kernelState).toBe("IDLE");
    expect(state.sequence).toBe(0);
    expect(state.trust).toBe(0.5);
    expect(state.sigma).toBe(0.1);
    expect(state.confidence).toBe(50);
    expect(state.epoch).toBe(1);
    expect(state.evidenceLeaves).toEqual([]);
    expect(state.receipts).toEqual([]);
    expect(state.circuitBreakerOpen).toBe(false);
    expect(state.hazardReason).toBeNull();
    expect(state.lastError).toBeNull();
  });

  it("rejects illegal transitions silently (stays in current state)", () => {
    // Attempt SETTLED → VERIFYING (illegal)
    const state: RuntimeState = {
      ...createInitialState(),
      kernelState: "SETTLED" as const,
    };
    const event = makeEvent("AttestationStarted", { sequence: 1 });
    const next = reduce(state, event);
    // Should stay in SETTLED since SETTLED → ATTESTING is illegal
    expect(next.kernelState).toBe("SETTLED");
  });

  it("transitions IDLE → INGESTING on EvidenceReceived", () => {
    const state = createInitialState();
    const event = makeEvent("EvidenceReceived", {
      sequence: 1,
      correlationId: "corr-ev",
      payload: { claim: "test claim", source: "oracle", confidence: "high" },
    });
    const next = reduce(state, event);
    expect(next.kernelState).toBe("INGESTING");
    expect(next.evidenceLeaves).toHaveLength(1);
    expect(next.evidenceLeaves[0].claim).toBe("test claim");
    expect(next.evidenceLeaves[0].verified).toBe(false);
  });

  it("adds evidence leaf with correct structure", () => {
    const state = createInitialState();
    const event = makeEvent("EvidenceReceived", {
      eventId: "evt-abc123",
      sequence: 1,
      correlationId: "corr-ev",
      payload: { claim: "claim-1", source: "user", confidence: "medium", tags: ["urgent"] },
    });
    const next = reduce(state, event);
    expect(next.evidenceLeaves[0]).toMatchObject({
      id: expect.stringContaining("leaf-"),
      claim: "claim-1",
      source: "user",
      confidence: "medium",
      tags: ["urgent"],
      verified: false,
    });
  });

  it("transitions INGESTING → ATTESTING on AttestationStarted", () => {
    const state: RuntimeState = {
      ...createInitialState(),
      kernelState: "INGESTING",
    };
    const event = makeEvent("AttestationStarted", {
      sequence: 2,
      payload: { receiptId: "r1", platform: "AMD SEV-SNP" },
    });
    const next = reduce(state, event);
    expect(next.kernelState).toBe("ATTESTING");
  });

  it("transitions ATTESTING → VERIFYING on AttestationVerified and updates quorum", () => {
    const state: RuntimeState = {
      ...createInitialState(),
      kernelState: "ATTESTING",
      evidenceLeaves: [{ id: "leaf-1", claim: "c1", source: "s1", confidence: "high", tags: [], verified: false, addedAt: Date.now() }],
    };
    const event = makeEvent("AttestationVerified", {
      sequence: 3,
      payload: { receiptId: "r1", platform: "AMD SEV-SNP", measurement: "m1" },
    });
    const next = reduce(state, event);
    expect(next.kernelState).toBe("VERIFYING");
    expect(next.evidenceLeaves[0].verified).toBe(true);
    expect(next.quorum).toEqual({ pass: 1, total: 1 });
    expect(next.trust).toBeGreaterThan(0.5);
    // Beta(2,1) posterior: sigma = sqrt(2/36) ≈ 0.236
    expect(next.sigma).toBeCloseTo(0.236, 2);
    // Confidence = max(0, (1 - sigma*8) * 100) = max(0, -88.8) = 0 for single data point
    expect(next.confidence).toBe(0);
  });

  it("transitions COMMITTING on ReceiptCommitted and adds receipt entry", () => {
    const state: RuntimeState = {
      ...createInitialState(),
      kernelState: "VERIFYING",
    };
    const event = makeEvent("ReceiptCommitted", {
      sequence: 4,
      payload: {
        receiptId: "rcpt-1",
        receiptHash: "sha256:abc",
        envelopeHash: "sha256:def",
        signature: "ed25519:sig",
        chainHash: "0x123",
      },
    });
    const next = reduce(state, event);
    expect(next.kernelState).toBe("COMMITTING");
    expect(next.receipts).toHaveLength(1);
    expect(next.receipts[0].receiptId).toBe("rcpt-1");
  });

  it("transitions SETTLED on LedgerConfirmed and increments epoch", () => {
    const state: RuntimeState = {
      ...createInitialState(),
      kernelState: "COMMITTING",
      epoch: 3,
    };
    const event = makeEvent("LedgerConfirmed", {
      sequence: 5,
      payload: { seq: 1, blockHeight: "#5000", txHash: "0xabc" },
    });
    const next = reduce(state, event);
    expect(next.kernelState).toBe("SETTLED");
    expect(next.epoch).toBe(4);
    expect(next.hashChainIntact).toBe(true);
  });

  it("transitions to HAZARD on CircuitBreakerOpened", () => {
    const state: RuntimeState = {
      ...createInitialState(),
      kernelState: "VERIFYING",
    };
    const event = makeEvent("CircuitBreakerOpened", {
      sequence: 6,
      payload: { action: "open", reason: "threshold breach" },
    });
    const next = reduce(state, event);
    expect(next.kernelState).toBe("HAZARD");
    expect(next.circuitBreakerOpen).toBe(true);
    expect(next.hazardReason).toBe("threshold breach");
  });

  it("recovers from HAZARD to IDLE on CircuitBreakerClosed", () => {
    const state: RuntimeState = {
      ...createInitialState(),
      kernelState: "HAZARD",
      circuitBreakerOpen: true,
      hazardReason: "some reason",
    };
    const event = makeEvent("CircuitBreakerClosed", {
      sequence: 7,
      payload: { action: "close", reason: "recovered" },
    });
    const next = reduce(state, event);
    expect(next.kernelState).toBe("IDLE");
    expect(next.circuitBreakerOpen).toBe(false);
    expect(next.hazardReason).toBeNull();
  });

  it("returns to IDLE on RuntimeIdle", () => {
    const state: RuntimeState = {
      ...createInitialState(),
      kernelState: "SETTLED",
    };
    const event = makeEvent("RuntimeIdle", {
      sequence: 8,
      payload: { idleDuration: 5000 },
    });
    const next = reduce(state, event);
    expect(next.kernelState).toBe("IDLE");
  });

  it("sets lastError on SystemError and transitions to HAZARD if unrecoverable", () => {
    // SystemError can only enter HAZARD from a state that allows HAZARD transition
    const state: RuntimeState = {
      ...createInitialState(),
      kernelState: "VERIFYING",
    };
    const event = makeEvent("SystemError", {
      sequence: 9,
      payload: { code: "ERR_01", message: "disk full", subsystem: "store", recoverable: false },
    });
    const next = reduce(state, event);
    expect(next.lastError).toEqual({ code: "ERR_01", message: "disk full", recoverable: false });
    expect(next.kernelState).toBe("HAZARD");
    expect(next.hazardReason).toBe("disk full");
  });

  it("does not transition to HAZARD for recoverable errors", () => {
    const state = createInitialState();
    const event = makeEvent("SystemError", {
      sequence: 10,
      payload: { code: "ERR_02", message: "timeout", subsystem: "net", recoverable: true },
    });
    const next = reduce(state, event);
    expect(next.lastError).not.toBeNull();
    expect(next.kernelState).toBe("IDLE"); // Stayed in IDLE
  });

  it("applies multiple events via reduceBatch", () => {
    const events = [
      makeEvent("EvidenceReceived", { sequence: 1, correlationId: "batch", payload: { claim: "c1", source: "s1", confidence: "high" } }),
      makeEvent("AttestationStarted", { sequence: 2, correlationId: "batch", payload: { receiptId: "r1", platform: "AMD SEV-SNP" } }),
      makeEvent("AttestationVerified", { sequence: 3, correlationId: "batch", payload: { receiptId: "r1", platform: "AMD SEV-SNP", measurement: "m1" } }),
      makeEvent("ReceiptCommitted", { sequence: 4, correlationId: "batch", payload: { receiptId: "rcpt-1", receiptHash: "h1", envelopeHash: "h2", signature: "sig", chainHash: "0x" } }),
      makeEvent("LedgerConfirmed", { sequence: 5, correlationId: "batch", payload: { seq: 1, blockHeight: "#100", txHash: "0x" } }),
    ];

    const final = reduceBatch(createInitialState(), events);
    expect(final.kernelState).toBe("SETTLED");
    expect(final.evidenceLeaves).toHaveLength(1);
    expect(final.receipts).toHaveLength(1);
    expect(final.quorum).toEqual({ pass: 1, total: 1 });
    expect(final.epoch).toBe(2);
    expect(final.sequence).toBe(5);
  });

  it("is a pure function (multiple calls same result)", () => {
    const state = createInitialState();
    const event = makeEvent("EvidenceReceived", {
      sequence: 1,
      payload: { claim: "c", source: "s", confidence: "high" },
    });

    const r1 = reduce(state, event);
    const r2 = reduce(state, event);
    expect(r1.kernelState).toBe(r2.kernelState);
    expect(r1.evidenceLeaves[0].claim).toBe(r2.evidenceLeaves[0].claim);
  });
});

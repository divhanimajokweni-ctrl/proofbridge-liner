import { resetRuntime, getRuntime } from "../runtime";
import { reduceBatch, createInitialState } from "../reducer";
import type { Command } from "../types";

function createRuntime() {
  resetRuntime();
  return getRuntime();
}

describe("TrustRuntime (orchestrator integration)", () => {
  beforeEach(() => {
    resetRuntime();
  });

  afterEach(() => {
    resetRuntime();
  });

  it("is a singleton accessible via getRuntime", () => {
    const a = getRuntime();
    const b = getRuntime();
    expect(a).toBe(b);
  });

  it("starts with sequence 0 and IDLE kernel state", () => {
    const rt = getRuntime();
    const p = rt.getProjections();
    expect(p.ui.sequence).toBe(0);
    expect(p.ui.kernelState).toBe("IDLE");
  });

  it("begins ingest on first SubmitEvidence", async () => {
    const rt = createRuntime();
    const cmd: Command = {
      type: "SubmitEvidence",
      idempotencyKey: "key-1",
      evidence: { claim: "claim-1", source: "source-1", confidence: "high", tags: [] },
    };
    const events = await rt.dispatch(cmd);
    expect(events).toHaveLength(1);
    const p = rt.getProjections();
    expect(p.ui.kernelState).toBe("INGESTING");
    expect(p.ui.sequence).toBe(1);
    expect(p.ui.evidenceLeaves).toHaveLength(1);
  });

  it("processes SubmitEvidence → VerifyAttestation sequentially", async () => {
    const rt = createRuntime();

    await rt.dispatch({
      type: "SubmitEvidence",
      idempotencyKey: "key-1",
      evidence: { claim: "c1", source: "s1", confidence: "high", tags: [] },
    });
    expect(rt.getProjections().ui.kernelState).toBe("INGESTING");

    await rt.dispatch({
      type: "VerifyAttestation",
      receiptId: "r1",
      platform: "AMD SEV-SNP",
    });

    const p = rt.getProjections();
    expect(p.ui.kernelState).toBe("VERIFYING");
    expect(p.ui.sequence).toBe(3); // SubmitEvidence(1) + AttestationStarted(2) + AttestationVerified(3)
    expect(p.colony.activeCarriers).toBe(4);
  });

  it("ignores duplicate idempotencyKey", async () => {
    const rt = createRuntime();

    await rt.dispatch({
      type: "SubmitEvidence",
      idempotencyKey: "key-1",
      evidence: { claim: "c1", source: "s1", confidence: "high", tags: [] },
    });

    const events = await rt.dispatch({
      type: "SubmitEvidence",
      idempotencyKey: "key-1",
      evidence: { claim: "c2", source: "s2", confidence: "medium", tags: [] },
    });

    expect(events).toHaveLength(0);
    expect(rt.getProjections().ui.sequence).toBe(1);
    expect(rt.getProjections().ui.evidenceLeaves).toHaveLength(1);
  });

  it("rejects illegal transitions from IDLE — command emits event but reducer filters", async () => {
    const rt = createRuntime();
    const events = await rt.dispatch({
      type: "TriggerCircuitBreaker",
      action: "open",
      reason: "test",
    });

    // Command handler emits CircuitBreakerOpened (it always produces events)
    // But the reducer checks transitions: IDLE → HAZARD is illegal
    // So the circuit breaker shouldn't actually open
    expect(events).toHaveLength(1);
    expect(events[0].type).toBe("CircuitBreakerOpened");
    const p = rt.getProjections();
    expect(p.ui.circuitBreakerOpen).toBe(false);
    expect(p.ui.kernelState).toBe("IDLE");
  });

  it("provides all four projections after dispatch", async () => {
    const rt = createRuntime();
    await rt.dispatch({
      type: "SubmitEvidence",
      idempotencyKey: "key-1",
      evidence: { claim: "c1", source: "s1", confidence: "high", tags: [] },
    });

    const p = rt.getProjections();
    expect(p).toHaveProperty("colony");
    expect(p).toHaveProperty("ui");
    expect(p).toHaveProperty("metrics");
    expect(p).toHaveProperty("notifications");
  });

  it("events are persisted in the store", async () => {
    const rt = createRuntime();
    await rt.dispatch({
      type: "SubmitEvidence",
      idempotencyKey: "key-1",
      evidence: { claim: "c1", source: "s1", confidence: "high", tags: [] },
    });
    await rt.dispatch({
      type: "VerifyAttestation",
      receiptId: "r1",
      platform: "AMD SEV-SNP",
    });

    const storeEvents = await rt.store.readFrom(1);
    expect(storeEvents).toHaveLength(3); // EvidenceAccepted + AttestationStarted + AttestationVerified
    expect(storeEvents[0].type).toBe("EvidenceReceived");
    expect(storeEvents[1].type).toBe("AttestationStarted");
    expect(storeEvents[2].type).toBe("AttestationVerified");
  });

  it("maintains monotonic event sequence", async () => {
    const rt = createRuntime();

    for (let i = 1; i <= 5; i++) {
      await rt.dispatch({
        type: "SubmitEvidence",
        idempotencyKey: `key-${i}`,
        evidence: { claim: `c${i}`, source: "s1", confidence: "high", tags: [] },
      });
    }

    expect(rt.getProjections().ui.sequence).toBe(5);
    expect(rt.getProjections().ui.evidenceLeaves).toHaveLength(5);
  });

  it("metrics projection is populated", async () => {
    const rt = createRuntime();

    await rt.dispatch({
      type: "SubmitEvidence",
      idempotencyKey: "key-1",
      evidence: { claim: "c1", source: "s1", confidence: "high", tags: [] },
    });

    const m1 = rt.getProjections().metrics;
    expect(m1.eventCount).toBe(1);

    await rt.dispatch({
      type: "VerifyAttestation",
      receiptId: "r1",
      platform: "AMD SEV-SNP",
    });

    const m2 = rt.getProjections().metrics;
    expect(m2.eventCount).toBe(3); // 1 evidence + 2 attestation events
  });

  it("can replay from event store to reconstruct state", async () => {
    const rt = createRuntime();

    await rt.dispatch({
      type: "SubmitEvidence",
      idempotencyKey: "key-1",
      evidence: { claim: "c1", source: "s1", confidence: "high", tags: [] },
    });
    await rt.dispatch({
      type: "SubmitEvidence",
      idempotencyKey: "key-2",
      evidence: { claim: "c2", source: "s2", confidence: "medium", tags: [] },
    });

    const events = await rt.store.readFrom(1);
    expect(events).toHaveLength(2);

    // Replay into a fresh runtime
    resetRuntime();
    const rt2 = createRuntime();
    for (const event of events) {
      await rt2.store.append(event);
    }

    // Manually reduce
    let state = createInitialState();
    for (const event of events) {
      state = reduceBatch(state, [event]);
    }

    expect(state.sequence).toBe(2);
    expect(state.evidenceLeaves).toHaveLength(2);
    expect(state.kernelState).toBe("INGESTING");
  });

  it("handles full flow: evidence → verify → commit", async () => {
    const rt = createRuntime();

    await rt.dispatch({
      type: "SubmitEvidence",
      idempotencyKey: "key-1",
      evidence: { claim: "c1", source: "s1", confidence: "high", tags: [] },
    });

    await rt.dispatch({
      type: "VerifyAttestation",
      receiptId: "r1",
      platform: "AMD SEV-SNP",
    });

    const events = await rt.dispatch({
      type: "CommitReceipt",
      receipt: { receiptId: "r1", receiptHash: "0xabc", envelopeHash: "0xdef", signature: "sig123", chainHash: "0xchain" },
    });

    expect(events).toHaveLength(1);
    expect(events[0].type).toBe("ReceiptCommitted");
    const p = rt.getProjections();
    expect(p.ui.kernelState).toBe("COMMITTING");
    expect(p.ui.receipts).toHaveLength(1);
  });
});

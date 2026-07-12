/**
 * VERIFICATION 2: Replay determinism
 *
 * Proves that replaying the same event sequence produces identical state,
 * even across a fresh runtime instance.
 */

import { resetRuntime, getRuntime } from "../runtime";
import { reduceBatch, createInitialState } from "../reducer";
import { InMemoryEventStore } from "../event-store";
import type { Command, RuntimeEvent } from "../types";

afterEach(() => {
  resetRuntime();
});

test("replay produces identical state after 100 events", async () => {
  resetRuntime();
  const rt = getRuntime();

  // Dispatch 100 events
  for (let i = 1; i <= 100; i++) {
    await rt.dispatch({
      type: "SubmitEvidence",
      idempotencyKey: `replay-key-${i}`,
      evidence: {
        claim: `claim-${i}`,
        source: `source-${i % 5}`,
        confidence: i % 3 === 0 ? "low" : i % 3 === 1 ? "medium" : "high",
        tags: i % 10 === 0 ? ["urgent"] : [],
      },
    });
  }

  // Capture state and events before reset
  const stateBefore = rt.getState();
  const events = await rt.store.readFrom(1);
  expect(events).toHaveLength(100);

  // Reset and replay into a fresh store
  resetRuntime();
  const freshStore = new InMemoryEventStore();
  for (const event of events) {
    await freshStore.append(event);
  }
  const freshEvents = await freshStore.readFrom(1);
  expect(freshEvents).toHaveLength(100);

  // Replay through reducer
  let replayed = createInitialState();
  for (const event of freshEvents) {
    replayed = reduceBatch(replayed, [event]);
  }

  // Verify: stateBefore matches replayed state
  expect(replayed.sequence).toBe(stateBefore.sequence);
  expect(replayed.sequence).toBe(100);
  expect(replayed.kernelState).toBe(stateBefore.kernelState);
  expect(replayed.kernelState).toBe("INGESTING");
  expect(replayed.trust).toBe(stateBefore.trust);
  expect(replayed.sigma).toBe(stateBefore.sigma);
  expect(replayed.confidence).toBe(stateBefore.confidence);
  expect(replayed.epoch).toBe(stateBefore.epoch);
  expect(replayed.quorum.pass).toBe(stateBefore.quorum.pass);
  expect(replayed.quorum.total).toBe(stateBefore.quorum.total);
  expect(replayed.evidenceLeaves.length).toBe(stateBefore.evidenceLeaves.length);
  expect(replayed.circuitBreakerOpen).toBe(stateBefore.circuitBreakerOpen);
});

test("replay produces identical state for mixed event types", async () => {
  resetRuntime();
  const rt = getRuntime();

  // Submit evidence
  await rt.dispatch({
    type: "SubmitEvidence",
    idempotencyKey: "mix-e1",
    evidence: { claim: "c1", source: "s1", confidence: "high", tags: [] },
  });

  // Verify attestation (produces 2 events: AttestationStarted, AttestationVerified)
  await rt.dispatch({
    type: "VerifyAttestation",
    receiptId: "r1",
    platform: "AMD SEV-SNP",
  });

  // Commit receipt
  await rt.dispatch({
    type: "CommitReceipt",
    receipt: { receiptId: "r1", receiptHash: "0xh1", envelopeHash: "0xh2", signature: "sig1", chainHash: "0xchain" },
  });

  const stateBefore = rt.getState();
  const events = await rt.store.readFrom(1);

  // Expect: EvidenceReceived(1) + AttestationStarted(2) + AttestationVerified(3) + ReceiptCommitted(4)
  expect(events).toHaveLength(4);
  expect(stateBefore.sequence).toBe(4);
  expect(stateBefore.kernelState).toBe("COMMITTING");
  expect(stateBefore.evidenceLeaves).toHaveLength(1);
  expect(stateBefore.receipts).toHaveLength(1);

  // Replay into fresh reducer
  const replayed = reduceBatch(createInitialState(), events);
  expect(replayed.sequence).toBe(stateBefore.sequence);
  expect(replayed.kernelState).toBe(stateBefore.kernelState);
  expect(replayed.evidenceLeaves.length).toBe(stateBefore.evidenceLeaves.length);
  expect(replayed.receipts.length).toBe(stateBefore.receipts.length);
  expect(replayed.evidenceLeaves[0].verified).toBe(true);
  expect(replayed.quorum.pass).toBe(1);
  expect(replayed.quorum.total).toBe(1);
});

test("replay handles circuit breaker open/close cycle", async () => {
  resetRuntime();
  const rt = getRuntime();

  // Get into VERIFYING state first (which permits HAZARD)
  await rt.dispatch({
    type: "SubmitEvidence",
    idempotencyKey: "cb-e1",
    evidence: { claim: "c1", source: "s1", confidence: "high", tags: [] },
  });
  await rt.dispatch({
    type: "VerifyAttestation",
    receiptId: "r1",
    platform: "AMD SEV-SNP",
  });

  // Now in VERIFYING — trigger circuit breaker
  await rt.dispatch({
    type: "TriggerCircuitBreaker",
    action: "open",
    reason: "threshold breach",
  });

  const stateBefore = rt.getState();
  expect(stateBefore.circuitBreakerOpen).toBe(true);
  expect(stateBefore.kernelState).toBe("HAZARD");
  expect(stateBefore.hazardReason).toBe("threshold breach");

  // Close circuit breaker
  await rt.dispatch({
    type: "TriggerCircuitBreaker",
    action: "close",
    reason: "recovered",
  });

  const stateAfterClose = rt.getState();
  expect(stateAfterClose.circuitBreakerOpen).toBe(false);
  expect(stateAfterClose.kernelState).toBe("IDLE");

  // Replay all events
  const events = await rt.store.readFrom(1);
  const replayed = reduceBatch(createInitialState(), events);

  // Final state after replay should match current state
  expect(replayed.circuitBreakerOpen).toBe(stateAfterClose.circuitBreakerOpen);
  expect(replayed.kernelState).toBe(stateAfterClose.kernelState);
  expect(replayed.hazardReason).toBe(stateAfterClose.hazardReason);
  expect(replayed.sequence).toBe(stateAfterClose.sequence);
});

test("determinism: same events always produce same state", () => {
  const events: RuntimeEvent[] = [
    {
      eventId: "det-e1", type: "EvidenceReceived", version: 1, timestamp: 1000,
      sequence: 1, correlationId: "c1", causationId: null, source: "test",
      payload: { claim: "c1", source: "s1", confidence: "high" as const, tags: [] },
    },
    {
      eventId: "det-e2", type: "AttestationStarted", version: 1, timestamp: 2000,
      sequence: 2, correlationId: "c2", causationId: null, source: "test",
      payload: { receiptId: "r1", platform: "AMD SEV-SNP" },
    },
    {
      eventId: "det-e3", type: "AttestationVerified", version: 1, timestamp: 3000,
      sequence: 3, correlationId: "c2", causationId: "det-e2", source: "test",
      payload: { receiptId: "r1", platform: "AMD SEV-SNP" as const, measurement: "m1" },
    },
  ];

  // Run replay 5 times — must produce identical results
  const results: any[] = [];
  for (let i = 0; i < 5; i++) {
    results.push(reduceBatch(createInitialState(), events));
  }

  for (let i = 1; i < 5; i++) {
    expect(results[i].kernelState).toBe(results[0].kernelState);
    expect(results[i].trust).toBe(results[0].trust);
    expect(results[i].sigma).toBe(results[0].sigma);
    expect(results[i].confidence).toBe(results[0].confidence);
    expect(results[i].sequence).toBe(results[0].sequence);
    expect(results[i].evidenceLeaves.length).toBe(results[0].evidenceLeaves.length);
  }
});

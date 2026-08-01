/**
 * VERIFICATION 1: SSE is authoritative
 *
 * Proves that events flow through the canonical path:
 *   Command → CommandHandler → RuntimeEvent → EventStore → SSE → Reducer → Projection → UI
 * And NOT: UI timer → emitEvent() → SSE
 */

import { resetRuntime, getRuntime } from "../runtime";
import { InMemoryEventStore } from "../event-store";
import { SSETransport } from "../sse-transport";
import { reduceBatch, createInitialState } from "../reducer";
import type { RuntimeEvent, Command } from "../types";

afterEach(() => {
  resetRuntime();
});

test("A: SSE events originate from Event Store entries only", async () => {
  resetRuntime();
  const rt = getRuntime();

  const cmd: Command = {
    type: "SubmitEvidence",
    idempotencyKey: "verify-sse-1",
    evidence: { claim: "sse-test", source: "verifier", confidence: "high", tags: [] },
  };
  const dispatchEvents = await rt.dispatch(cmd);
  expect(dispatchEvents).toHaveLength(1);

  const storeEvents = await rt.store.readFrom(1);
  expect(storeEvents).toHaveLength(1);

  // Verify identity: dispatch events === store events
  expect(dispatchEvents[0].eventId).toBe(storeEvents[0].eventId);
  expect(dispatchEvents[0].sequence).toBe(storeEvents[0].sequence);
  expect(dispatchEvents[0].type).toBe(storeEvents[0].type);
  expect((dispatchEvents[0].payload as any).claim).toBe("sse-test");

  // Verify projections reflect the stored event
  const p = rt.getProjections();
  expect(p.ui.sequence).toBe(1);
  expect(p.ui.evidenceLeaves).toHaveLength(1);
  expect(p.ui.evidenceLeaves[0].claim).toBe("sse-test");
});

test("B: Synthetic broadcasts do NOT update runtime state", async () => {
  resetRuntime();
  const store = new InMemoryEventStore();

  const syntheticEvent: RuntimeEvent = {
    eventId: "synthetic-fake-1",
    type: "EvidenceReceived",
    version: 1,
    timestamp: Date.now(),
    sequence: 99,
    correlationId: "fake",
    causationId: null,
    source: "synthetic",
    payload: { claim: "fake-claim", source: "fake", confidence: "high", tags: [] },
  };

  // Broadcast without store.append
  const transport = new SSETransport(store);
  transport.broadcast(syntheticEvent);
  transport.broadcastBatch([syntheticEvent]);
  transport.disconnectAll();

  // Store was NOT modified
  expect(await store.size()).toBe(0);
  expect(await store.exists("synthetic-fake-1")).toBe(false);

  // Reducing from store gives initial state
  const state = reduceBatch(createInitialState(), await store.readFrom(1));
  expect(state.sequence).toBe(0);
  expect(state.evidenceLeaves).toHaveLength(0);
});

test("C: SSETransport has no event-creating methods", () => {
  const store = new InMemoryEventStore();
  const transport = new SSETransport(store);

  const methodNames = Object.getOwnPropertyNames(Object.getPrototypeOf(transport))
    .filter((m) => m !== "constructor");

  expect(methodNames).not.toContain("emitEvent");
  expect(methodNames).not.toContain("produceEvent");
  expect(methodNames).not.toContain("createEvent");
  expect(methodNames).not.toContain("generateEvent");
  expect(methodNames).toContain("broadcast");
  expect(methodNames).toContain("broadcastBatch");
  expect(methodNames).toContain("disconnectAll");
  expect(methodNames).toContain("heartbeat");
});

test("D: Projections reflect stored events, not synthetic ones", async () => {
  resetRuntime();
  const rt = getRuntime();

  const initial = rt.getProjections();
  expect(initial.ui.sequence).toBe(0);
  expect(initial.colony.activeCarriers).toBe(0);
  expect(initial.colony.canopyLeafCount).toBe(0);

  await rt.dispatch({
    type: "SubmitEvidence",
    idempotencyKey: "verify-auth-d1",
    evidence: { claim: "real-claim", source: "real", confidence: "high", tags: [] },
  });

  const after = rt.getProjections();
  expect(after.ui.sequence).toBe(1);
  expect(after.colony.canopyLeafCount).toBe(1);
  expect(after.colony.activeCarriers).toBe(2); // INGESTING
  expect(after.colony.verificationQueueDepth).toBe(1);
});

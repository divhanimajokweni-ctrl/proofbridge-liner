import { InMemoryEventStore } from "../event-store";
import type { RuntimeEvent } from "../types";

function makeEvent(overrides: Partial<RuntimeEvent> = {}): RuntimeEvent {
  return {
    eventId: `evt-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    type: "EvidenceReceived",
    version: 1,
    timestamp: Date.now(),
    sequence: 0,
    correlationId: "test-corr",
    causationId: null,
    source: "test",
    payload: { claim: "test", source: "test", confidence: "high" },
    ...overrides,
  };
}

describe("InMemoryEventStore", () => {
  let store: InMemoryEventStore;

  beforeEach(() => {
    store = new InMemoryEventStore();
  });

  it("appends events and assigns monotonic sequence numbers", async () => {
    const e1 = makeEvent({ eventId: "e1" });
    const e2 = makeEvent({ eventId: "e2" });

    const s1 = await store.append(e1);
    const s2 = await store.append(e2);

    expect(s1).toBe(1);
    expect(s2).toBe(2);
  });

  it("rejects duplicate eventIds (idempotency guard)", async () => {
    const e1 = makeEvent({ eventId: "dup" });
    await store.append(e1);

    await expect(store.append(makeEvent({ eventId: "dup" }))).rejects.toThrow(
      "Duplicate eventId",
    );
  });

  it("reads a single event by sequence number", async () => {
    const e1 = makeEvent({ eventId: "read-test" });
    await store.append(e1);

    const retrieved = await store.read(1);
    expect(retrieved).not.toBeNull();
    expect(retrieved!.eventId).toBe("read-test");
    expect(retrieved!.sequence).toBe(1);
  });

  it("returns null for out-of-range sequence", async () => {
    const r = await store.read(999);
    expect(r).toBeNull();
  });

  it("reads a range of events in order", async () => {
    const e1 = makeEvent({ eventId: "a" });
    const e2 = makeEvent({ eventId: "b" });
    const e3 = makeEvent({ eventId: "c" });
    await store.append(e1);
    await store.append(e2);
    await store.append(e3);

    const range = await store.readRange(2, 3);
    expect(range).toHaveLength(2);
    expect(range[0].eventId).toBe("b");
    expect(range[1].eventId).toBe("c");
  });

  it("reads all events from a sequence (replay)", async () => {
    const e1 = makeEvent({ eventId: "x" });
    const e2 = makeEvent({ eventId: "y" });
    const e3 = makeEvent({ eventId: "z" });
    await store.append(e1);
    await store.append(e2);
    await store.append(e3);

    const from = await store.readFrom(2);
    expect(from).toHaveLength(2);
    expect(from[0].eventId).toBe("y");
  });

  it("checks event existence (exists)", async () => {
    expect(await store.exists("present")).toBe(false);
    await store.append(makeEvent({ eventId: "present" }));
    expect(await store.exists("present")).toBe(true);
  });

  it("tracks size and current sequence", async () => {
    expect(await store.size()).toBe(0);
    expect(await store.getCurrentSequence()).toBe(0);

    await store.append(makeEvent({ eventId: "s1" }));
    expect(await store.size()).toBe(1);
    expect(await store.getCurrentSequence()).toBe(1);
  });

  it("saves and loads snapshots", async () => {
    await store.append(makeEvent({ eventId: "snap1" }));
    await store.saveSnapshot(1, { trust: 0.8, epoch: 2 });

    const snapshot = await store.loadLatestSnapshot<{ trust: number; epoch: number }>();
    expect(snapshot).not.toBeNull();
    expect(snapshot!.sequence).toBe(1);
    expect(snapshot!.state.trust).toBe(0.8);
  });

  it("loads the latest snapshot at or before a given sequence", async () => {
    await store.append(makeEvent({ eventId: "a" }));
    await store.append(makeEvent({ eventId: "b" }));
    await store.saveSnapshot(2, { version: "v2" });

    const atSeq1 = await store.loadLatestSnapshot(1);
    // No snapshot at seq 1, so should find the seq 2 one if <= 1? 
    // Actually the implementation filters `<= atSequence`, so at seq 1 it should return null
    expect(atSeq1).toBeNull();
  });

  it("resets cleanly", async () => {
    await store.append(makeEvent({ eventId: "r1" }));
    expect(await store.size()).toBe(1);

    store.reset();
    expect(await store.size()).toBe(0);
    expect(await store.getCurrentSequence()).toBe(0);
    expect(await store.exists("r1")).toBe(false);
  });
});

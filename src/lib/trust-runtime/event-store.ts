// ============================================================================
// VVU Trust Runtime — Event Store (Append-Only Log)
// ============================================================================
// Layer:        Event Store
// Responsibility: Append-only log with replay, snapshot/checkpoint,
//                 duplicate detection, and ordering guarantees.
// ============================================================================

import { RuntimeEvent } from "./types";

// ---------------------------------------------------------------------------
// Event Store Interface
// ---------------------------------------------------------------------------

export interface EventStore {
  /** Append an event to the log. Returns the assigned global sequence number.
   *  Throws if `eventId` already exists (duplicate detection). */
  append(event: RuntimeEvent): Promise<number>;

  /** Read a single event by sequence number. Returns null if not found. */
  read(sequence: number): Promise<RuntimeEvent | null>;

  /** Stream events from `fromSequence` (inclusive) to `toSequence` (inclusive).
   *  Returns events in sequence order. */
  readRange(fromSequence: number, toSequence: number): Promise<RuntimeEvent[]>;

  /** Stream all events from `fromSequence` onward. Used for replay. */
  readFrom(fromSequence: number): Promise<RuntimeEvent[]>;

  /** Get the highest sequence number stored. 0 if empty. */
  getCurrentSequence(): Promise<number>;

  /** Check if an eventId already exists (idempotency guard). */
  exists(eventId: string): Promise<boolean>;

  /** Save a snapshot at the given sequence number for fast replay. */
  saveSnapshot<T>(sequence: number, state: T): Promise<void>;

  /** Load the latest snapshot at or before `atSequence`. Returns null if none. */
  loadLatestSnapshot<T>(atSequence?: number): Promise<{ sequence: number; state: T } | null>;

  /** Get total event count. */
  size(): Promise<number>;
}

// ---------------------------------------------------------------------------
// In-Memory Event Store (primary implementation)
// ---------------------------------------------------------------------------

interface SnapshotEntry<T = unknown> {
  sequence: number;
  state: T;
  savedAt: number;
}

export class InMemoryEventStore implements EventStore {
  private events: RuntimeEvent[] = [];
  private eventIds = new Set<string>();
  private snapshots: SnapshotEntry[] = [];
  private seqCounter = 0;

  async append(event: RuntimeEvent): Promise<number> {
    // Duplicate detection
    if (this.eventIds.has(event.eventId)) {
      throw new Error(
        `Duplicate eventId: ${event.eventId}. Event already appended.`,
      );
    }

    this.seqCounter++;
    const seq = this.seqCounter;
    const stored: RuntimeEvent = { ...event, sequence: seq };
    this.events.push(stored);
    this.eventIds.add(event.eventId);
    return seq;
  }

  async read(sequence: number): Promise<RuntimeEvent | null> {
    // sequence is 1-indexed
    const idx = sequence - 1;
    if (idx < 0 || idx >= this.events.length) return null;
    return this.events[idx];
  }

  async readRange(
    fromSequence: number,
    toSequence: number,
  ): Promise<RuntimeEvent[]> {
    const from = Math.max(0, fromSequence - 1);
    const to = Math.min(this.events.length, toSequence);
    return this.events.slice(from, to);
  }

  async readFrom(fromSequence: number): Promise<RuntimeEvent[]> {
    const from = Math.max(0, fromSequence - 1);
    return this.events.slice(from);
  }

  async getCurrentSequence(): Promise<number> {
    return this.seqCounter;
  }

  async exists(eventId: string): Promise<boolean> {
    return this.eventIds.has(eventId);
  }

  async saveSnapshot<T>(sequence: number, state: T): Promise<void> {
    // Remove any existing snapshot at or after this sequence
    this.snapshots = this.snapshots.filter((s) => s.sequence < sequence);
    this.snapshots.push({
      sequence,
      state,
      savedAt: Date.now(),
    });
  }

  async loadLatestSnapshot<T>(
    atSequence?: number,
  ): Promise<{ sequence: number; state: T } | null> {
    const candidates = atSequence
      ? this.snapshots.filter((s) => s.sequence <= atSequence)
      : [...this.snapshots];

    if (candidates.length === 0) return null;

    // Return the snapshot with the highest sequence (most recent)
    const latest = candidates.reduce((a, b) =>
      a.sequence > b.sequence ? a : b,
    );
    return { sequence: latest.sequence, state: latest.state as T };
  }

  async size(): Promise<number> {
    return this.events.length;
  }

  /** Reset the store (for testing). */
  reset(): void {
    this.events = [];
    this.eventIds.clear();
    this.snapshots = [];
    this.seqCounter = 0;
  }
}

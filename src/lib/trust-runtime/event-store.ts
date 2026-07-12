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

// ---------------------------------------------------------------------------
// PostgreSQL Event Store (durable implementation)
// ---------------------------------------------------------------------------

import { EventStoreRepository, DomainEvent, OccConflictError, SnapshotCorruptionError } from "../../../lib/db/src/repositories/event-store.repository";

export class PostgresEventStore implements EventStore {
  constructor(private readonly repo: EventStoreRepository) {}

  async append(event: RuntimeEvent): Promise<number> {
    const domainEvent: DomainEvent = {
      eventId: event.eventId,
      eventType: event.type,
      payload: event.payload as Record<string, any>,
      metadata: {},
    };

    const result = await this.repo.append(
      event.tenantId,
      event.streamId,
      event.streamVersion - 1, // expectedVersion is 0-indexed
      [domainEvent]
    );

    return Number(result.lastSequenceNumber);
  }

  async read(sequence: number): Promise<RuntimeEvent | null> {
    // This implementation requires stream context; use readStream instead
    throw new Error('PostgresEventStore.read() not supported. Use loadStream() instead.');
  }

  async readRange(fromSequence: number, toSequence: number): Promise<RuntimeEvent[]> {
    throw new Error('PostgresEventStore.readRange() not supported. Use loadStream() instead.');
  }

  async readFrom(fromSequence: number): Promise<RuntimeEvent[]> {
    throw new Error('PostgresEventStore.readFrom() not supported. Use loadStream() instead.');
  }

  async getCurrentSequence(): Promise<number> {
    // This requires stream context; use getCurrentVersion() instead
    throw new Error('PostgresEventStore.getCurrentSequence() not supported. Use repo.getCurrentVersion() instead.');
  }

  async exists(eventId: string): Promise<boolean> {
    // Check via repository query
    throw new Error('PostgresEventStore.exists() not yet implemented');
  }

  async saveSnapshot<T>(sequence: number, state: T): Promise<void> {
    // Requires tenantId/streamId context
    throw new Error('PostgresEventStore.saveSnapshot() not yet implemented');
  }

  async loadLatestSnapshot<T>(atSequence?: number): Promise<{ sequence: number; state: T } | null> {
    // Requires tenantId/streamId context
    throw new Error('PostgresEventStore.loadLatestSnapshot() not yet implemented');
  }

  async size(): Promise<number> {
    throw new Error('PostgresEventStore.size() not yet implemented');
  }
}

/**
 * Auto-select event store implementation based on environment.
 * If DATABASE_URL is present, use PostgreSQL; otherwise fall back to in-memory.
 */
export function createEventStore(): EventStore {
  if (process.env.DATABASE_URL) {
    const { getDb } = require('../../../lib/db/src/index');
    const db = getDb();
    const repo = new EventStoreRepository(db);
    return new PostgresEventStore(repo);
  }

  return new InMemoryEventStore();
}

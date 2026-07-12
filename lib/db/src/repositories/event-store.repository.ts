import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { trustEvents, trustEventOutbox, trustSnapshots } from '../schema/trust-runtime';
import { eq, and, gt, desc, sql } from 'drizzle-orm';
import { createHash } from 'node:crypto';

export class OccConflictError extends Error {
  constructor(public readonly streamId: string, public readonly attemptedVersion: number) {
    super(`OCC Conflict: Stream ${streamId} rejected version ${attemptedVersion}`);
    this.name = 'OccConflictError';
  }
}

export class SnapshotCorruptionError extends Error {
  constructor(public readonly streamId: string, public readonly version: number) {
    super(`Snapshot corruption: Stream ${streamId} at version ${version} failed hash verification`);
    this.name = 'SnapshotCorruptionError';
  }
}

export interface DomainEvent {
  eventId: string;
  eventType: string;
  payload: Record<string, any>;
  metadata?: Record<string, any>;
}

export class EventStoreRepository {
  constructor(private readonly db: NodePgDatabase) {}

  /**
   * Pure Append: No retries. Batch insert. Atomic outbox staging.
   * Computes canonical hashes internally.
   */
  async append(
    tenantId: string,
    streamId: string,
    expectedVersion: number,
    domainEvents: DomainEvent[]
  ): Promise<{ lastSequenceNumber: bigint }> {
    // Pre-flight Batch Validation (Internal Chain Continuity)
    let prevHash: string | null = null;
    const unsavedEvents: any[] = [];

    for (let i = 0; i < domainEvents.length; i++) {
      const event = domainEvents[i];
      const nextVersion = expectedVersion + 1 + i;

      const canonicalPayload = JSON.stringify(event.payload);
      const payloadHash = createHash('sha256').update(canonicalPayload).digest('hex');
      const eventHash: string = createHash('sha256').update(`${prevHash ?? 'GENESIS'}:${event.eventId}:${payloadHash}`).digest('hex');

      unsavedEvents.push({
        tenantId,
        streamId,
        streamVersion: nextVersion,
        eventId: event.eventId,
        eventType: event.eventType,
        schemaVersion: 1,
        payload: event.payload,
        metadata: event.metadata ?? {},
        payloadHash,
        eventHash,
        previousHash: prevHash,
      });

      prevHash = eventHash;
    }

    try {
      const result = await this.db.transaction(async (tx) => {
        let lastSeq: bigint = 0n;

        for (let i = 0; i < unsavedEvents.length; i++) {
          const evt = unsavedEvents[i];

          const [inserted] = await tx.insert(trustEvents).values({
            tenantId: evt.tenantId,
            streamId: evt.streamId,
            streamVersion: evt.streamVersion,
            eventId: evt.eventId,
            eventType: evt.eventType,
            schemaVersion: evt.schemaVersion,
            payload: evt.payload,
            metadata: evt.metadata,
            payloadHash: evt.payloadHash,
            eventHash: evt.eventHash,
            previousHash: evt.previousHash,
          }).returning({ sequenceNumber: trustEvents.sequenceNumber });

          lastSeq = inserted.sequenceNumber;

          // Atomic Outbox Staging
          await tx.insert(trustEventOutbox).values({
            sequenceNumber: inserted.sequenceNumber,
            tenantId: evt.tenantId,
            streamId: evt.streamId,
            eventType: evt.eventType,
            payload: evt.payload,
          });
        }

        return { lastSequenceNumber: lastSeq };
      });

      return result;
    } catch (error: any) {
      // PostgreSQL unique violation (PK on tenantId, streamId, streamVersion)
      const pgCode = error?.code ?? error?.cause?.code;
      if (pgCode === '23505') {
        throw new OccConflictError(streamId, expectedVersion + 1);
      }
      throw error;
    }
  }

  /**
   * Read APIs for Replay and Projections
   */
  async loadStream(tenantId: string, streamId: string, fromVersion: number = 0) {
    return this.db.select()
      .from(trustEvents)
      .where(and(
        eq(trustEvents.tenantId, tenantId),
        eq(trustEvents.streamId, streamId),
        gt(trustEvents.streamVersion, fromVersion)
      ))
      .orderBy(trustEvents.streamVersion);
  }

  async getCurrentVersion(tenantId: string, streamId: string): Promise<number> {
    const result = await this.db.select({ maxVersion: trustEvents.streamVersion })
      .from(trustEvents)
      .where(and(eq(trustEvents.tenantId, tenantId), eq(trustEvents.streamId, streamId)))
      .orderBy(desc(trustEvents.streamVersion))
      .limit(1);

    return result[0]?.maxVersion ?? 0;
  }

  async saveSnapshot(tenantId: string, streamId: string, streamVersion: number, state: Record<string, any>): Promise<void> {
    const canonicalState = JSON.stringify(state);
    const snapshotHash = createHash('sha256').update(canonicalState).digest('hex');

    await this.db.insert(trustSnapshots).values({
      tenantId,
      streamId,
      streamVersion,
      state,
      snapshotHash,
    });
  }

  async loadSnapshot(tenantId: string, streamId: string) {
    const [snapshot] = await this.db.select()
      .from(trustSnapshots)
      .where(and(eq(trustSnapshots.tenantId, tenantId), eq(trustSnapshots.streamId, streamId)))
      .orderBy(desc(trustSnapshots.streamVersion))
      .limit(1);

    if (!snapshot) return null;

    // Verify snapshot integrity before returning
    const computedHash = createHash('sha256').update(JSON.stringify(snapshot.state)).digest('hex');
    if (computedHash !== snapshot.snapshotHash) {
      throw new SnapshotCorruptionError(streamId, snapshot.streamVersion);
    }

    return snapshot;
  }
}

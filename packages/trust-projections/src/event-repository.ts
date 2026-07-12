// packages/trust-projections/src/event-repository.ts
// ───────────────────────────────────────────────────────────────
// Trust Event Repository
// Durable storage for Trust Events in PostgreSQL
// ───────────────────────────────────────────────────────────────

import { 
  trustEvents, 
  trustEventOutbox 
} from '@proofbridge/contracts/db/schema'; 
import type { TrustEvent, JournalEventRequest } from '@proofbridge/trust-types';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { eq, and, desc } from 'drizzle-orm';

export class EventRepository {
  constructor(private db: any) {} // Using any to avoid complex generic for now

  /**
   * Append a new event to the durable store
   */
  async appendEvent(
    event: TrustEvent,
    tenantId: string,
    streamId: string,
    streamVersion: number
  ): Promise<void> {
    await this.db.transaction(async (tx: any) => {
      // 1. Insert into events table
      await tx.insert(trustEvents).values({
        tenantId,
        streamId,
        streamVersion,
        eventId: event.eventId,
        eventType: event.eventType,
        schemaVersion: 1, // Default
        payload: event.payload,
        payloadHash: event.eventHash, // Assuming eventHash is payload hash for now
        eventHash: event.eventHash,
        previousHash: event.previousEventHash,
      });

      // 2. Insert into transactional outbox
      await tx.insert(trustEventOutbox).values({
        tenantId,
        streamId,
        eventType: event.eventType,
        payload: event.payload,
        status: 'PENDING',
      });
    });
  }

  /**
   * Get all events for a stream (context)
   */
  async getEvents(tenantId: string, streamId: string): Promise<any[]> {
    return await this.db
      .select()
      .from(trustEvents)
      .where(
        and(
          eq(trustEvents.tenantId, tenantId),
          eq(trustEvents.streamId, streamId)
        )
      )
      .orderBy(trustEvents.streamVersion);
  }

  /**
   * Get the latest event for a stream
   */
  async getLatestEvent(tenantId: string, streamId: string): Promise<any> {
    const results = await this.db
      .select()
      .from(trustEvents)
      .where(
        and(
          eq(trustEvents.tenantId, tenantId),
          eq(trustEvents.streamId, streamId)
        )
      )
      .orderBy(desc(trustEvents.streamVersion))
      .limit(1);
    
    return results[0];
  }

  /**
   * Verify hash chain integrity for a stream.
   * Walks all events in order and checks that each event's previousHash
   * matches the previous event's eventHash. Any break = tampering.
   */
  async verifyChainIntegrity(
    tenantId: string,
    streamId: string
  ): Promise<{ valid: boolean; breaks: string[] }> {
    const events = await this.getEvents(tenantId, streamId);
    const breaks: string[] = [];

    if (events.length === 0) {
      return { valid: true, breaks };
    }

    for (let i = 1; i < events.length; i++) {
      const current = events[i];
      const previous = events[i - 1];

      if (current.previousHash !== previous.eventHash) {
        breaks.push(
          `Chain break at streamVersion ${current.streamVersion}: ` +
          `previousHash=${current.previousHash} does not match ` +
          `previous eventHash=${previous.eventHash}`
        );
      }
    }

    return { valid: breaks.length === 0, breaks };
  }
}

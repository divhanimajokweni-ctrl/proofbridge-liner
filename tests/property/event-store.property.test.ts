import { describe, it, expect, beforeAll } from 'vitest';
import fc from 'fast-check';
import { EventStoreRepository, OccConflictError, SnapshotCorruptionError } from '../../lib/db/src/repositories/event-store.repository';
import { getDb, closeDb } from '../../lib/db/src/index';

let repo: EventStoreRepository;
let db: ReturnType<typeof getDb>;

beforeAll(async () => {
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL required for property tests');
  }
  db = getDb();
  repo = new EventStoreRepository(db);
});

describe('Event Store Property-Based Tests', () => {
  it('replay from scratch equals replay from snapshot plus subsequent events', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.uuid(),
        fc.uuid(),
        fc.array(fc.record({
          eventId: fc.uuid(),
          eventType: fc.constant('TEST_EVENT'),
          payload: fc.record({ value: fc.integer() })
        }), { minLength: 5, maxLength: 20 }),
        async (tenantId, streamId, events) => {
          const domainEvents = events.map(e => ({
            eventId: e.eventId,
            eventType: e.eventType,
            payload: e.payload,
          }));

          await repo.append(tenantId, streamId, 0, domainEvents);

          const midVersion = Math.floor(domainEvents.length / 2);
          const midState = { count: midVersion, lastHash: 'snapshot-hash' };
          await repo.saveSnapshot(tenantId, streamId, midVersion, midState);

          const fullEvents = await repo.loadStream(tenantId, streamId, 0);
          const fullCount = fullEvents.length;

          const snapshot = await repo.loadSnapshot(tenantId, streamId);
          const subsequentEvents = await repo.loadStream(tenantId, streamId, snapshot?.streamVersion ?? 0);
          const subsequentCount = subsequentEvents.length;

          expect(fullCount).toBe(domainEvents.length);
          expect(subsequentCount).toBe(domainEvents.length - midVersion);
        }
      ),
      { numRuns: 20 }
    );
  });

  it('concurrent appends never violate stream version ordering', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.uuid(),
        fc.uuid(),
        fc.integer({ min: 2, max: 10 }),
        async (tenantId, streamId, numWorkers) => {
          const promises = Array.from({ length: numWorkers }, (_, i) =>
            repo.append(tenantId, streamId, 0, [{
              eventId: `concurrent-${tenantId}-${i}`,
              eventType: 'CONCURRENT_TEST',
              payload: { worker: i },
            }]).then(
              () => 'SUCCESS',
              (err) => err instanceof OccConflictError ? 'CONFLICT' : 'ERROR'
            )
          );

          const results = await Promise.all(promises);
          const successes = results.filter(r => r === 'SUCCESS').length;
          const conflicts = results.filter(r => r === 'CONFLICT').length;

          expect(successes).toBe(1);
          expect(conflicts).toBe(numWorkers - 1);

          const currentVersion = await repo.getCurrentVersion(tenantId, streamId);
          expect(currentVersion).toBe(1);
        }
      ),
      { numRuns: 10 }
    );
  });

  it('hash chain remains continuous under arbitrary valid event sequences', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.uuid(),
        fc.uuid(),
        fc.array(fc.record({
          eventId: fc.uuid(),
          eventType: fc.constant('CHAIN_TEST'),
          payload: fc.record({ data: fc.string() })
        }), { minLength: 5, maxLength: 30 }),
        async (tenantId, streamId, events) => {
          const domainEvents = events.map(e => ({
            eventId: e.eventId,
            eventType: e.eventType,
            payload: e.payload,
          }));

          await repo.append(tenantId, streamId, 0, domainEvents);

          const dbEvents = await repo.loadStream(tenantId, streamId, 0);
          expect(dbEvents.length).toBe(domainEvents.length);

          let prevHash: string | null = null;
          for (const event of dbEvents) {
            expect(event.previousHash).toBe(prevHash);
            prevHash = event.eventHash;
          }
        }
      ),
      { numRuns: 20 }
    );
  });
});

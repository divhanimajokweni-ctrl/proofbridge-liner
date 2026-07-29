import { describe, it, expect, vi, beforeEach } from 'vitest';
import { EventJournal, createEventJournal, type EventRepository } from '../src/event-journal';
import type { TrustEvent, JournalEventRequest } from '@proofbridge/trust-types';

function makeJournalRequest(overrides: Partial<JournalEventRequest> = {}): JournalEventRequest {
  return {
    contextId: 'ctx-1',
    eventType: 'event.journaled',
    eventVersion: '1',
    payload: {
      type: 'event.journaled',
      agentId: 'test-agent',
      eventType: 'test',
      payload: { data: 'test' },
    },
    agentId: 'test-agent',
    ...overrides,
  };
}

function createMockRepository(): EventRepository {
  const events: TrustEvent[] = [];
  return {
    appendEvent: vi.fn(async (event: TrustEvent, _tenantId: string, _streamId: string, _streamVersion: number) => {
      events.push(event);
    }),
    getEvents: vi.fn(async (_tenantId: string, _streamId: string) => events),
    getLatestEvent: vi.fn(async (_tenantId: string, _streamId: string) => events[events.length - 1]),
    verifyChainIntegrity: vi.fn(async () => ({ valid: true, breaks: [] })),
  };
}

describe('EventJournal', () => {
  describe('in-memory (no repository)', () => {
    it('journals event in-memory', async () => {
      const journal = createEventJournal({ contextId: 'ctx-1' });
      const result = await journal.journalEvent(makeJournalRequest());

      expect(result.event).toBeDefined();
      expect(result.event.eventType).toBe('event.journaled');
      expect(result.validation.valid).toBe(true);
    });

    it('returns correct JournalEventResult', async () => {
      const journal = createEventJournal({ contextId: 'ctx-1' });
      const result = await journal.journalEvent(makeJournalRequest());

      expect(result).toHaveProperty('event');
      expect(result).toHaveProperty('chainLink');
      expect(result).toHaveProperty('validation');
      expect(result.event.eventId).toBeTruthy();
      expect(result.event.eventHash).toMatch(/^[0-9a-f]{64}$/);
    });

    it('maintains chain integrity across multiple events', async () => {
      const journal = createEventJournal({ contextId: 'ctx-1' });

      await journal.journalEvent(makeJournalRequest({ payload: { type: 'event.journaled', agentId: 'a', eventType: 't', payload: { n: 1 } } }));
      await journal.journalEvent(makeJournalRequest({ payload: { type: 'event.journaled', agentId: 'b', eventType: 't', payload: { n: 2 } } }));
      await journal.journalEvent(makeJournalRequest({ payload: { type: 'event.journaled', agentId: 'c', eventType: 't', payload: { n: 3 } } }));

      expect(journal.verifyIntegrity()).toBe(true);
      expect(journal.getState().length).toBe(3);
    });

    it('getEvent retrieves by ID', async () => {
      const journal = createEventJournal({ contextId: 'ctx-1' });
      const { event } = await journal.journalEvent(makeJournalRequest());
      expect(journal.getEvent(event.eventId)).toBe(event);
    });

    it('getAllEvents returns all', async () => {
      const journal = createEventJournal({ contextId: 'ctx-1' });
      await journal.journalEvent(makeJournalRequest());
      await journal.journalEvent(makeJournalRequest());
      expect(journal.getAllEvents()).toHaveLength(2);
    });
  });

  describe('with repository', () => {
    it('persists event when repository provided', async () => {
      const repo = createMockRepository();
      const journal = createEventJournal({
        contextId: 'ctx-1',
        repository: repo,
        tenantId: 'tenant-1',
      });

      await journal.journalEvent(makeJournalRequest());
      expect(repo.appendEvent).toHaveBeenCalledTimes(1);
    });

    it('handles repository errors gracefully', async () => {
      const repo: EventRepository = {
        appendEvent: vi.fn(async () => {
          throw new Error('DB connection failed');
        }),
        getEvents: vi.fn(async () => []),
        getLatestEvent: vi.fn(async () => undefined),
        verifyChainIntegrity: vi.fn(async () => ({ valid: true, breaks: [] })),
      };

      const journal = createEventJournal({
        contextId: 'ctx-1',
        repository: repo,
        tenantId: 'tenant-1',
      });

      await expect(journal.journalEvent(makeJournalRequest())).rejects.toThrow('DB connection failed');
    });

    it('still stores event in memory even with repository', async () => {
      const repo = createMockRepository();
      const journal = createEventJournal({
        contextId: 'ctx-1',
        repository: repo,
        tenantId: 'tenant-1',
      });

      const { event } = await journal.journalEvent(makeJournalRequest());
      expect(journal.getEvent(event.eventId)).toBeDefined();
    });
  });
});

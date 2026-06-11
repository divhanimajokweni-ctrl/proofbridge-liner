import { EventStore, ReceiptEvent } from '../../src/types/events';
import {
  projectCircuitBreakers,
  projectIntegrationHealth,
  projectReceipt,
} from '../../src/selectors/index';

function createMockStore(eventsList: ReceiptEvent[]): EventStore {
  const store: EventStore = {
    events: {
      byId: Object.fromEntries(eventsList.map((event) => [event.eventId, event])),
      allIds: eventsList.map((event) => event.eventId),
    },
    indexes: {
      byReceiptId: {},
      byTraceId: {},
      byType: {},
    },
    transport: {
      type: 'websocket',
      connected: true,
      lastStreamOffset: null,
      lastEventTimestamp: null,
      reconnectAttempts: 0,
      systemStatus: null,
    },
    ui: {
      selectedReceiptId: 'rcpt_01',
      focusedTraceId: null,
      selectedEventId: null,
      view: 'terminal',
      dataState: 'READY',
    },
    loading: false,
    error: null,
  };

  for (const event of eventsList) {
    if (event.receiptId) {
      store.indexes.byReceiptId[event.receiptId] = [
        ...(store.indexes.byReceiptId[event.receiptId] ?? []),
        event.eventId,
      ];
    }

    const traceId = event.traceContext.traceId;
    store.indexes.byTraceId[traceId] = [...(store.indexes.byTraceId[traceId] ?? []), event.eventId];
    store.indexes.byType[event.eventType] = [...(store.indexes.byType[event.eventType] ?? []), event.eventId];
  }

  return store;
}

describe('Gate C/D: Pure Selector Trust Projections', () => {
  const traceTemplate = { traceId: 'trc_991', spanId: 'spn_01' };

  test('projects the unverified baseline state for a fresh proposal', () => {
    const events: ReceiptEvent[] = [
      {
        eventId: 'evt_01',
        streamOffset: 1n,
        eventType: 'ProposalCreated',
        timestamp: '2026-06-11T12:00:00Z',
        payloadHash: 'hash_01',
        receiptId: 'rcpt_01',
        traceContext: traceTemplate,
      },
    ];

    const store = createMockStore(events);
    const receipt = projectReceipt(
      store.events.allIds
        .map((id) => store.events.byId[id])
        .filter((event) => event.receiptId === 'rcpt_01'),
    );

    expect(receipt).toBeDefined();
    expect(receipt?.currentState).toBe('PROPOSED');
    expect(receipt?.attestation).toBeUndefined();
  });

  test('toggles attestation indicators deterministically after verification', () => {
    const events: ReceiptEvent[] = [
      {
        eventId: 'evt_01',
        streamOffset: 1n,
        eventType: 'ProposalCreated',
        timestamp: '2026-06-11T12:00:00Z',
        payloadHash: 'hash_01',
        receiptId: 'rcpt_01',
        traceContext: traceTemplate,
      },
      {
        eventId: 'evt_02',
        streamOffset: 2n,
        eventType: 'AttestationVerified',
        timestamp: '2026-06-11T12:05:00Z',
        payloadHash: 'hash_02',
        receiptId: 'rcpt_01',
        traceContext: traceTemplate,
        actor: 'validator_node_01',
      },
    ];

    const store = createMockStore(events);
    const receipt = projectReceipt(
      store.events.allIds
        .map((id) => store.events.byId[id])
        .filter((event) => event.receiptId === 'rcpt_01'),
    );

    expect(receipt?.currentState).toBe('ATTESTED');
    expect(receipt?.attestation?.status).toBe('VERIFIED');
    expect(receipt?.attestation?.verifier).toBe('validator_node_01');
  });

  test('asserts circuit breaker conditions when a breaker is activated', () => {
    const events: ReceiptEvent[] = [
      {
        eventId: 'evt_01',
        streamOffset: 1n,
        eventType: 'ProposalCreated',
        timestamp: '2026-06-11T12:00:00Z',
        payloadHash: 'hash_01',
        receiptId: 'rcpt_01',
        traceContext: traceTemplate,
      },
      {
        eventId: 'evt_02',
        streamOffset: 2n,
        eventType: 'SettlementConfirmed',
        timestamp: '2026-06-11T12:10:00Z',
        payloadHash: 'hash_02',
        receiptId: 'rcpt_01',
        traceContext: traceTemplate,
      },
      {
        eventId: 'evt_03',
        streamOffset: 3n,
        eventType: 'CircuitBreakerActivated',
        timestamp: '2026-06-11T12:11:00Z',
        payloadHash: 'hash_03',
        receiptId: 'rcpt_01',
        traceContext: traceTemplate,
        metadata: {
          breakerId: 'brk_stitch_rail',
          scope: 'PIPELINE',
          reason: 'High API latency anomalies detected',
        },
      },
    ];

    const store = createMockStore(events);
    const breakers = projectCircuitBreakers(store);

    expect(breakers.brk_stitch_rail).toBeDefined();
    expect(breakers.brk_stitch_rail.active).toBe(true);
    expect(breakers.brk_stitch_rail.reason).toBe('High API latency anomalies detected');
  });

  test('projects integration health from event-stream updates without browser state', () => {
    const events: ReceiptEvent[] = [
      {
        eventId: 'evt_10',
        streamOffset: 10n,
        eventType: 'IntegrationHealthUpdated',
        timestamp: '2026-06-11T12:20:00Z',
        payloadHash: 'hash_10',
        traceContext: traceTemplate,
        metadata: {
          integration: 'stitch',
          status: 'DEGRADED',
          message: 'Intermittent upstream timeouts',
        },
      },
    ];

    const store = createMockStore(events);
    const integrations = projectIntegrationHealth(store);

    expect(integrations.stitch).toEqual({
      name: 'stitch',
      status: 'DEGRADED',
      message: 'Intermittent upstream timeouts',
      updatedAt: '2026-06-11T12:20:00Z',
    });
  });
});

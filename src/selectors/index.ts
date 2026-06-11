import {
  EventStore,
  IntegrationHealthSnapshot,
  IntegrationHealthState,
  ReceiptEvent,
} from '../types/events';

export interface ProjectedAttestation {
  status: 'VERIFIED';
  verifier?: string;
  verifiedAt: string;
}

export interface ProjectedReceipt {
  receiptId: string;
  currentState: 'PROPOSED' | 'ATTESTED' | 'SETTLED';
  attestation?: ProjectedAttestation;
  settledAt?: string;
  lastEventId: string;
  lastUpdatedAt: string;
}

export interface ProjectedCircuitBreaker {
  breakerId: string;
  active: boolean;
  scope?: string;
  reason?: string;
  lastChangedAt: string;
  receiptId?: string;
}

function compareEvents(left: ReceiptEvent, right: ReceiptEvent): number {
  if (left.streamOffset < right.streamOffset) {
    return -1;
  }
  if (left.streamOffset > right.streamOffset) {
    return 1;
  }
  if (left.timestamp < right.timestamp) {
    return -1;
  }
  if (left.timestamp > right.timestamp) {
    return 1;
  }
  return left.eventId.localeCompare(right.eventId);
}

function sortEvents(events: readonly ReceiptEvent[]): ReceiptEvent[] {
  return [...events].sort(compareEvents);
}

export function projectReceipt(events: readonly ReceiptEvent[]): ProjectedReceipt | undefined {
  if (events.length === 0) {
    return undefined;
  }

  const ordered = sortEvents(events);
  const firstReceiptId = ordered.find((event) => event.receiptId)?.receiptId;
  if (!firstReceiptId) {
    return undefined;
  }

  const projection: ProjectedReceipt = {
    receiptId: firstReceiptId,
    currentState: 'PROPOSED',
    lastEventId: ordered[ordered.length - 1].eventId,
    lastUpdatedAt: ordered[ordered.length - 1].timestamp,
  };

  for (const event of ordered) {
    switch (event.eventType) {
      case 'ProposalCreated':
        projection.currentState = 'PROPOSED';
        break;
      case 'AttestationVerified':
        projection.currentState = 'ATTESTED';
        projection.attestation = {
          status: 'VERIFIED',
          verifier: event.actor,
          verifiedAt: event.timestamp,
        };
        break;
      case 'SettlementConfirmed':
        projection.currentState = 'SETTLED';
        projection.settledAt = event.timestamp;
        break;
      default:
        break;
    }
  }

  return projection;
}

export function projectCircuitBreakers(store: EventStore): Record<string, ProjectedCircuitBreaker> {
  const breakers: Record<string, ProjectedCircuitBreaker> = {};
  const ordered = sortEvents(store.events.allIds.map((id) => store.events.byId[id]));

  for (const event of ordered) {
    const breakerId = event.metadata?.breakerId;
    if (!breakerId) {
      continue;
    }

    if (event.eventType === 'CircuitBreakerActivated') {
      breakers[breakerId] = {
        breakerId,
        active: true,
        scope: typeof event.metadata?.scope === 'string' ? event.metadata.scope : undefined,
        reason: typeof event.metadata?.reason === 'string' ? event.metadata.reason : undefined,
        lastChangedAt: event.timestamp,
        receiptId: event.receiptId,
      };
    }

    if (event.eventType === 'CircuitBreakerReleased') {
      breakers[breakerId] = {
        breakerId,
        active: false,
        scope: typeof event.metadata?.scope === 'string' ? event.metadata.scope : undefined,
        reason: typeof event.metadata?.reason === 'string' ? event.metadata.reason : undefined,
        lastChangedAt: event.timestamp,
        receiptId: event.receiptId,
      };
    }
  }

  return breakers;
}

function normalizeIntegrationStatus(status: string | undefined): IntegrationHealthState {
  if (status === 'HEALTHY' || status === 'DEGRADED' || status === 'DOWN') {
    return status;
  }
  return 'UNKNOWN';
}

export function projectIntegrationHealth(
  store: EventStore,
): Record<string, IntegrationHealthSnapshot> {
  const projected: Record<string, IntegrationHealthSnapshot> = {
    ...(store.transport.systemStatus?.integrations ?? {}),
  };
  const ordered = sortEvents(store.events.allIds.map((id) => store.events.byId[id]));

  for (const event of ordered) {
    if (event.eventType !== 'IntegrationHealthUpdated') {
      continue;
    }

    const integration = typeof event.metadata?.integration === 'string'
      ? event.metadata.integration
      : undefined;
    if (!integration) {
      continue;
    }

    projected[integration] = {
      name: integration,
      status: normalizeIntegrationStatus(
        typeof event.metadata?.status === 'string' ? event.metadata.status : undefined,
      ),
      message: typeof event.metadata?.message === 'string' ? event.metadata.message : undefined,
      updatedAt: event.timestamp,
    };
  }

  return projected;
}

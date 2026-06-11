export type ReceiptEventType =
  | 'ProposalCreated'
  | 'AttestationVerified'
  | 'SettlementConfirmed'
  | 'CircuitBreakerActivated'
  | 'CircuitBreakerReleased'
  | 'IntegrationHealthUpdated'
  | string;

export interface TraceContext {
  traceId: string;
  spanId: string;
  parentSpanId?: string;
}

export interface ReceiptEventMetadata {
  breakerId?: string;
  scope?: string;
  reason?: string;
  integration?: string;
  status?: IntegrationHealthState;
  message?: string;
  [key: string]: unknown;
}

export interface ReceiptEvent {
  eventId: string;
  streamOffset: bigint;
  eventType: ReceiptEventType;
  timestamp: string;
  payloadHash: string;
  receiptId?: string;
  actor?: string;
  metadata?: ReceiptEventMetadata;
  traceContext: TraceContext;
}

export type IntegrationHealthState = 'HEALTHY' | 'DEGRADED' | 'DOWN' | 'UNKNOWN';

export interface IntegrationHealthSnapshot {
  name: string;
  status: IntegrationHealthState;
  message?: string;
  updatedAt: string;
}

export interface SystemStatus {
  overall: IntegrationHealthState;
  integrations?: Record<string, IntegrationHealthSnapshot>;
  updatedAt?: string;
}

export type TransportType = 'websocket' | 'sse';

export interface TransportState {
  type: TransportType;
  connected: boolean;
  lastStreamOffset: string | null;
  lastEventTimestamp: string | null;
  reconnectAttempts: number;
  systemStatus: SystemStatus | null;
}

export interface UIState {
  selectedReceiptId: string | null;
  focusedTraceId: string | null;
  selectedEventId: string | null;
  view: 'terminal' | 'timeline' | 'details';
  dataState: 'IDLE' | 'LOADING' | 'READY' | 'ERROR';
}

export interface EventStore {
  events: {
    byId: Record<string, ReceiptEvent>;
    allIds: string[];
  };
  indexes: {
    byReceiptId: Record<string, string[]>;
    byTraceId: Record<string, string[]>;
    byType: Record<string, string[]>;
  };
  transport: TransportState;
  ui: UIState;
  loading: boolean;
  error: string | null;
}

import { ReceiptEvent, SystemStatus } from '../types/events';

type EventHandler = (event: ReceiptEvent) => void;
type StatusHandler = (connected: boolean) => void;
type Snapshot = { events: ReceiptEvent[]; systemStatus: SystemStatus | null };
type SnapshotHandler = (snapshot: Snapshot) => void;

interface WebSocketLike {
  onopen: ((event: Event) => void) | null;
  onmessage: ((event: MessageEvent<string>) => void) | null;
  onclose: ((event: CloseEvent) => void) | null;
  onerror: ((event: Event) => void) | null;
  close(): void;
}

interface WebSocketConstructorLike {
  new (url: string): WebSocketLike;
}

interface EventSourceLike {
  onopen: ((event: Event) => void) | null;
  onmessage: ((event: MessageEvent<string>) => void) | null;
  onerror: ((event: Event) => void) | null;
  close(): void;
}

interface EventSourceConstructorLike {
  new (url: string, init?: EventSourceInit): EventSourceLike;
}

interface TransportFrame {
  type: 'snapshot' | 'event' | 'system-status';
  payload: unknown;
}

export interface TransportAdapter {
  connect(): Promise<void>;
  disconnect(): void;
  onEvent(handler: EventHandler): void;
  onStatusChange(handler: StatusHandler): void;
  onSnapshot(handler: SnapshotHandler): void;
}

export interface CreateTransportOptions {
  webSocketUrl?: string;
  sseUrl?: string;
  maxReconnectAttempts?: number;
  reconnectBaseMs?: number;
  webSocketImpl?: WebSocketConstructorLike;
  eventSourceImpl?: EventSourceConstructorLike;
  eventSourceInit?: EventSourceInit;
}

abstract class BaseTransportAdapter implements TransportAdapter {
  private readonly eventHandlers = new Set<EventHandler>();
  private readonly statusHandlers = new Set<StatusHandler>();
  private readonly snapshotHandlers = new Set<SnapshotHandler>();

  public abstract connect(): Promise<void>;
  public abstract disconnect(): void;

  public onEvent(handler: EventHandler): void {
    this.eventHandlers.add(handler);
  }

  public onStatusChange(handler: StatusHandler): void {
    this.statusHandlers.add(handler);
  }

  public onSnapshot(handler: SnapshotHandler): void {
    this.snapshotHandlers.add(handler);
  }

  protected emitEvent(event: ReceiptEvent): void {
    this.eventHandlers.forEach((handler) => handler(event));
  }

  protected emitStatus(connected: boolean): void {
    this.statusHandlers.forEach((handler) => handler(connected));
  }

  protected emitSnapshot(snapshot: Snapshot): void {
    this.snapshotHandlers.forEach((handler) => handler(snapshot));
  }
}

function toBigInt(value: unknown): bigint | null {
  if (typeof value === 'bigint') {
    return value;
  }
  if (typeof value === 'number' && Number.isInteger(value)) {
    return BigInt(value);
  }
  if (typeof value === 'string' && /^-?\d+$/.test(value)) {
    return BigInt(value);
  }
  return null;
}

function coerceReceiptEvent(value: unknown): ReceiptEvent | null {
  if (!value || typeof value !== 'object') {
    return null;
  }

  const candidate = value as Record<string, unknown>;
  const streamOffset = toBigInt(candidate.streamOffset);
  const traceContext = candidate.traceContext;

  if (
    typeof candidate.eventId !== 'string' ||
    streamOffset === null ||
    typeof candidate.eventType !== 'string' ||
    typeof candidate.timestamp !== 'string' ||
    typeof candidate.payloadHash !== 'string' ||
    !traceContext ||
    typeof traceContext !== 'object' ||
    typeof (traceContext as Record<string, unknown>).traceId !== 'string' ||
    typeof (traceContext as Record<string, unknown>).spanId !== 'string'
  ) {
    return null;
  }

  return {
    eventId: candidate.eventId,
    streamOffset,
    eventType: candidate.eventType,
    timestamp: candidate.timestamp,
    payloadHash: candidate.payloadHash,
    receiptId: typeof candidate.receiptId === 'string' ? candidate.receiptId : undefined,
    actor: typeof candidate.actor === 'string' ? candidate.actor : undefined,
    metadata:
      candidate.metadata && typeof candidate.metadata === 'object'
        ? (candidate.metadata as Record<string, unknown>)
        : undefined,
    traceContext: {
      traceId: (traceContext as Record<string, unknown>).traceId as string,
      spanId: (traceContext as Record<string, unknown>).spanId as string,
      parentSpanId:
        typeof (traceContext as Record<string, unknown>).parentSpanId === 'string'
          ? ((traceContext as Record<string, unknown>).parentSpanId as string)
          : undefined,
    },
  };
}

function coerceSnapshot(value: unknown): Snapshot | null {
  if (!value || typeof value !== 'object') {
    return null;
  }

  const candidate = value as Record<string, unknown>;
  if (!Array.isArray(candidate.events)) {
    return null;
  }

  const events = candidate.events
    .map((event) => coerceReceiptEvent(event))
    .filter((event): event is ReceiptEvent => event !== null);

  return {
    events,
    systemStatus:
      candidate.systemStatus && typeof candidate.systemStatus === 'object'
        ? (candidate.systemStatus as SystemStatus)
        : null,
  };
}

function parseFrame(rawData: string): TransportFrame | null {
  try {
    const parsed = JSON.parse(rawData) as Record<string, unknown>;
    if (
      parsed &&
      typeof parsed.type === 'string' &&
      (parsed.type === 'snapshot' || parsed.type === 'event' || parsed.type === 'system-status')
    ) {
      return {
        type: parsed.type,
        payload: parsed.payload,
      };
    }
  } catch (error) {
    console.warn('Ignoring malformed transport frame', error);
  }

  return null;
}

function defaultWebSocketImpl(): WebSocketConstructorLike | undefined {
  if (typeof globalThis !== 'undefined' && 'WebSocket' in globalThis) {
    return globalThis.WebSocket as unknown as WebSocketConstructorLike;
  }
  return undefined;
}

function defaultEventSourceImpl(): EventSourceConstructorLike | undefined {
  if (typeof globalThis !== 'undefined' && 'EventSource' in globalThis) {
    return globalThis.EventSource as unknown as EventSourceConstructorLike;
  }
  return undefined;
}

export class WebSocketAdapter extends BaseTransportAdapter {
  private ws: WebSocketLike | null = null;
  private reconnectAttempts = 0;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private manuallyDisconnected = false;

  public constructor(
    private readonly options: {
      url: string;
      maxReconnectAttempts: number;
      reconnectBaseMs: number;
      webSocketImpl?: WebSocketConstructorLike;
      onReconnectExhausted?: () => void;
    },
  ) {
    super();
  }

  public async connect(): Promise<void> {
    this.manuallyDisconnected = false;
    const WebSocketImpl = this.options.webSocketImpl ?? defaultWebSocketImpl();
    if (!WebSocketImpl) {
      throw new Error('WebSocket is not available in this runtime');
    }

    await new Promise<void>((resolve, reject) => {
      let settled = false;
      let opened = false;

      try {
        this.ws = new WebSocketImpl(this.options.url);

        this.ws.onopen = () => {
          opened = true;
          this.reconnectAttempts = 0;
          this.emitStatus(true);
          if (!settled) {
            settled = true;
            resolve();
          }
        };

        this.ws.onmessage = (event) => {
          if (typeof event.data !== 'string') {
            return;
          }
          this.handleFrame(event.data);
        };

        this.ws.onclose = () => {
          this.emitStatus(false);

          if (!opened && !settled) {
            settled = true;
            reject(new Error('WebSocket closed before opening'));
            return;
          }

          if (!this.manuallyDisconnected) {
            this.scheduleReconnect();
          }
        };

        this.ws.onerror = (event) => {
          if (!settled) {
            settled = true;
            reject(new Error('WebSocket connection failed'));
          } else {
            console.warn('WebSocket transport error', event);
          }
        };
      } catch (error) {
        if (!settled) {
          settled = true;
          reject(error instanceof Error ? error : new Error('WebSocket connection failed'));
        }
      }
    });
  }

  public disconnect(): void {
    this.manuallyDisconnected = true;
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    if (this.ws) {
      this.ws.close();
      this.ws = null;
      return;
    }
    this.emitStatus(false);
  }

  private handleFrame(rawData: string): void {
    const frame = parseFrame(rawData);
    if (!frame) {
      return;
    }

    if (frame.type === 'event') {
      const event = coerceReceiptEvent(frame.payload);
      if (event) {
        this.emitEvent(event);
      }
      return;
    }

    if (frame.type === 'snapshot') {
      const snapshot = coerceSnapshot(frame.payload);
      if (snapshot) {
        this.emitSnapshot(snapshot);
      }
      return;
    }

    if (frame.type === 'system-status' && frame.payload && typeof frame.payload === 'object') {
      this.emitSnapshot({
        events: [],
        systemStatus: frame.payload as SystemStatus,
      });
    }
  }

  private scheduleReconnect(): void {
    if (this.reconnectAttempts >= this.options.maxReconnectAttempts) {
      this.options.onReconnectExhausted?.();
      return;
    }

    this.reconnectAttempts += 1;
    const delay = this.options.reconnectBaseMs * this.reconnectAttempts;
    this.reconnectTimer = setTimeout(() => {
      this.connect().catch((error) => {
        console.warn('WebSocket reconnect failed', error);
        if (!this.manuallyDisconnected) {
          this.scheduleReconnect();
        }
      });
    }, delay);
  }
}

export class SseAdapter extends BaseTransportAdapter {
  private source: EventSourceLike | null = null;

  public constructor(
    private readonly options: {
      url: string;
      eventSourceImpl?: EventSourceConstructorLike;
      eventSourceInit?: EventSourceInit;
    },
  ) {
    super();
  }

  public async connect(): Promise<void> {
    const EventSourceImpl = this.options.eventSourceImpl ?? defaultEventSourceImpl();
    if (!EventSourceImpl) {
      throw new Error('EventSource is not available in this runtime');
    }

    await new Promise<void>((resolve, reject) => {
      let settled = false;
      try {
        this.source = new EventSourceImpl(this.options.url, this.options.eventSourceInit);

        this.source.onopen = () => {
          this.emitStatus(true);
          if (!settled) {
            settled = true;
            resolve();
          }
        };

        this.source.onmessage = (event) => {
          if (typeof event.data !== 'string') {
            return;
          }

          const frame = parseFrame(event.data);
          if (!frame) {
            return;
          }

          if (frame.type === 'event') {
            const receiptEvent = coerceReceiptEvent(frame.payload);
            if (receiptEvent) {
              this.emitEvent(receiptEvent);
            }
            return;
          }

          if (frame.type === 'snapshot') {
            const snapshot = coerceSnapshot(frame.payload);
            if (snapshot) {
              this.emitSnapshot(snapshot);
            }
            return;
          }

          if (frame.type === 'system-status' && frame.payload && typeof frame.payload === 'object') {
            this.emitSnapshot({
              events: [],
              systemStatus: frame.payload as SystemStatus,
            });
          }
        };

        this.source.onerror = () => {
          this.emitStatus(false);
          if (!settled) {
            settled = true;
            reject(new Error('SSE connection failed'));
          }
        };
      } catch (error) {
        if (!settled) {
          settled = true;
          reject(error instanceof Error ? error : new Error('SSE connection failed'));
        }
      }
    });
  }

  public disconnect(): void {
    if (this.source) {
      this.source.close();
      this.source = null;
      return;
    }
    this.emitStatus(false);
  }
}

export class HybridTransportAdapter extends BaseTransportAdapter {
  private activeAdapter: TransportAdapter | null = null;
  private usingFallback = false;

  public constructor(private readonly options: CreateTransportOptions = {}) {
    super();
  }

  public async connect(): Promise<void> {
    if (this.activeAdapter) {
      this.activeAdapter.disconnect();
    }

    const primary = this.createWebSocketAdapter();
    if (primary) {
      try {
        this.bindAdapter(primary);
        this.activeAdapter = primary;
        await primary.connect();
        return;
      } catch (error) {
        primary.disconnect();
        console.warn('Falling back to SSE transport', error);
      }
    }

    const fallback = this.createSseAdapter();
    this.bindAdapter(fallback);
    this.activeAdapter = fallback;
    this.usingFallback = true;
    await fallback.connect();
  }

  public disconnect(): void {
    if (this.activeAdapter) {
      this.activeAdapter.disconnect();
      this.activeAdapter = null;
    }
    this.usingFallback = false;
  }

  private createWebSocketAdapter(): WebSocketAdapter | null {
    const webSocketImpl = this.options.webSocketImpl ?? defaultWebSocketImpl();
    if (!webSocketImpl) {
      return null;
    }

    return new WebSocketAdapter({
      url: this.options.webSocketUrl ?? 'ws://localhost:3000/events',
      maxReconnectAttempts: this.options.maxReconnectAttempts ?? 5,
      reconnectBaseMs: this.options.reconnectBaseMs ?? 1000,
      webSocketImpl,
      onReconnectExhausted: () => {
        if (!this.usingFallback) {
          this.activateFallback().catch((error) => {
            console.warn('SSE fallback activation failed', error);
          });
        }
      },
    });
  }

  private createSseAdapter(): SseAdapter {
    return new SseAdapter({
      url: this.options.sseUrl ?? '/api/events/stream',
      eventSourceImpl: this.options.eventSourceImpl ?? defaultEventSourceImpl(),
      eventSourceInit: this.options.eventSourceInit,
    });
  }

  private bindAdapter(adapter: TransportAdapter): void {
    adapter.onEvent((event) => this.emitEvent(event));
    adapter.onStatusChange((connected) => this.emitStatus(connected));
    adapter.onSnapshot((snapshot) => this.emitSnapshot(snapshot));
  }

  private async activateFallback(): Promise<void> {
    if (this.usingFallback) {
      return;
    }

    this.usingFallback = true;
    if (this.activeAdapter) {
      this.activeAdapter.disconnect();
    }

    const fallback = this.createSseAdapter();
    this.bindAdapter(fallback);
    this.activeAdapter = fallback;
    await fallback.connect();
  }
}

export function createTransport(options: CreateTransportOptions = {}): TransportAdapter {
  return new HybridTransportAdapter(options);
}

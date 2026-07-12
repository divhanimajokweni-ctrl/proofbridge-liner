// ============================================================================
// VVU Trust Runtime — SSE Transport
// ============================================================================
// Layer:        Transport
// Responsibility: Deliver RuntimeEvents to consumers via Server-Sent Events.
//                 This is a **consumer** of the event store — not the owner.
//                 Reconnection, backfill, and last-event-ID are supported.
// ============================================================================

import { RuntimeEvent } from "./types";
import { EventStore } from "./event-store";

export type SSEClient = {
  id: string;
  lastSequence: number;
  controller: ReadableStreamDefaultController;
};

export class SSETransport {
  private clients = new Map<string, SSEClient>();
  private clientIdCounter = 0;
  private store: EventStore;

  constructor(store: EventStore) {
    this.store = store;
  }

  /**
   * Register a new SSE client and return its ReadableStream.
   * The client receives all events from `lastSequence+1` onward.
   * On first connection, if lastSequence is 0, only future events are sent.
   */
  connect(lastSequence = 0): Response {
    const clientId = `sse-${++this.clientIdCounter}`;

    let cancelled = false;
    const stream = new ReadableStream({
      start: async (controller) => {
        const client: SSEClient = {
          id: clientId,
          lastSequence,
          controller: controller as ReadableStreamDefaultController,
        };
        this.clients.set(clientId, client);

        // Backfill: send missed events since last known sequence
        if (lastSequence > 0) {
          const backfillEvents = await this.store.readFrom(lastSequence + 1);
          for (const event of backfillEvents) {
            if (cancelled) break;
            this.sendEvent(client, event);
          }
        }

        // Send initial keepalive
        this.sendComment(client, "connected");
      },
      cancel: () => {
        cancelled = true;
        this.clients.delete(clientId);
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache, no-transform",
        Connection: "keep-alive",
        "X-Accel-Buffering": "no",
      },
    });
  }

  /**
   * Broadcast a single event to all connected clients.
   * Called by the event pipeline after an event is stored.
   */
  broadcast(event: RuntimeEvent): void {
    for (const client of this.clients.values()) {
      try {
        this.sendEvent(client, event);
        client.lastSequence = event.sequence;
      } catch {
        // Client stream closed; remove it
        this.clients.delete(client.id);
      }
    }
  }

  /** Broadcast multiple events (e.g., during replay catch-up). */
  broadcastBatch(events: RuntimeEvent[]): void {
    for (const event of events) {
      this.broadcast(event);
    }
  }

  /** Get connected client count. */
  get clientCount(): number {
    return this.clients.size;
  }

  /** Disconnect all clients (e.g., on shutdown). */
  disconnectAll(): void {
    for (const client of this.clients.values()) {
      try {
        client.controller.close();
      } catch {
        // already closed
      }
    }
    this.clients.clear();
  }

  // -----------------------------------------------------------------------
  // Private helpers
  // -----------------------------------------------------------------------

  private sendEvent(client: SSEClient, event: RuntimeEvent): void {
    const data = JSON.stringify(event);
    const message = [
      `id: ${event.sequence}`,
      `event: ${event.type}`,
      `data: ${data}`,
      "",
    ].join("\n");

    const encoder = new TextEncoder();
    client.controller.enqueue(encoder.encode(message));
  }

  private sendComment(client: SSEClient, comment: string): void {
    const encoder = new TextEncoder();
    client.controller.enqueue(encoder.encode(`: ${comment}\n\n`));
  }

  /** Send a keepalive heartbeat to keep connections alive. */
  heartbeat(): void {
    for (const client of this.clients.values()) {
      try {
        this.sendComment(client, "heartbeat");
      } catch {
        this.clients.delete(client.id);
      }
    }
  }
}

// ---------------------------------------------------------------------------
// SSE Client Hook (for React)
// ---------------------------------------------------------------------------

export interface SSEConnectionState {
  connected: boolean;
  lastEvent: RuntimeEvent | null;
  reconnects: number;
  error: string | null;
}

export function createSSEConnectionState(): SSEConnectionState {
  return {
    connected: false,
    lastEvent: null,
    reconnects: 0,
    error: null,
  };
}

/**
 * Open an EventSource connection to the runtime SSE endpoint.
 * Returns a cleanup function for use in React useEffect.
 */
export function connectSSE(
  url: string,
  onEvent: (event: RuntimeEvent) => void,
  onStateChange: (state: SSEConnectionState) => void,
): () => void {
  let eventSource: EventSource | null = null;
  let reconnectAttempts = 0;
  let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  let aborted = false;

  function connect() {
    if (aborted) return;

    eventSource = new EventSource(url);

    onStateChange({
      connected: true,
      lastEvent: null,
      reconnects: reconnectAttempts,
      error: null,
    });

    eventSource.onmessage = (msg: MessageEvent) => {
      try {
        const event = JSON.parse(msg.data) as RuntimeEvent;
        onEvent(event);
        onStateChange({
          connected: true,
          lastEvent: event,
          reconnects: reconnectAttempts,
          error: null,
        });
      } catch {
        // Ignore malformed events
      }
    };

    eventSource.onerror = () => {
      eventSource?.close();
      onStateChange({
        connected: false,
        lastEvent: null,
        reconnects: reconnectAttempts,
        error: "Connection lost",
      });

      // Exponential backoff reconnect
      if (!aborted) {
        reconnectAttempts++;
        const delay = Math.min(1000 * 2 ** reconnectAttempts, 30000);
        reconnectTimer = setTimeout(connect, delay);
      }
    };
  }

  connect();

  return () => {
    aborted = true;
    eventSource?.close();
    if (reconnectTimer) clearTimeout(reconnectTimer);
  };
}

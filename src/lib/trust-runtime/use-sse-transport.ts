// ============================================================================
// Epistemic Runtime — Trust Runtime SSE Client Hook (Next.js)
// ============================================================================
// Client-side hook for connecting to the SSE transport endpoint.
// This file is safe to import in 'use client' components.
// Separated from server-side sse-transport.ts to avoid importing
// server-only modules in client code.
// ============================================================================

import type { RuntimeEvent } from './types';
import type { SSEConnectionState } from './sse-transport';

/**
 * Open an EventSource connection to the runtime SSE endpoint.
 * Returns a cleanup function for use in React useEffect.
 *
 * Usage:
 * ```tsx
 * useEffect(() => {
 *   const cleanup = connectSSE('/api/trust-runtime/events', (event) => { ... }, (state) => { ... });
 *   return cleanup;
 * }, []);
 * ```
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
        error: 'Connection lost',
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

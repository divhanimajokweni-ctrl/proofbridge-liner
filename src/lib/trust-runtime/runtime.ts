// ============================================================================
// VVU Trust Runtime — Runtime Orchestrator
// ============================================================================
// Layer:        Orchestration
// Responsibility: Tie all layers together — command → event → store → reducer → transport.
//                 Also provides a convenience hook for the React UI.
// ============================================================================

import {
  RuntimeEvent,
  RuntimeState,
  Command,
} from "./types";
import { InMemoryEventStore, EventStore } from "./event-store";
import { DefaultCommandHandler, CommandHandler } from "./command-handler";
import { createInitialState, reduce, reduceBatch } from "./reducer";
import {
  AllProjections,
  buildAllProjections,
} from "./projection-manager";
import { SSETransport, connectSSE, SSEConnectionState } from "./sse-transport";

// ---------------------------------------------------------------------------
// Runtime Orchestrator
// ---------------------------------------------------------------------------

export class TrustRuntime {
  readonly store: EventStore;
  readonly commandHandler: CommandHandler;
  readonly sseTransport: SSETransport;

  private state: RuntimeState;
  private listeners: Array<(projections: AllProjections) => void> = [];
  private eventListeners: Array<(event: RuntimeEvent) => void> = [];
  private heartbeatInterval: ReturnType<typeof setInterval> | null = null;
  private recentEvents: RuntimeEvent[] = [];

  constructor(store?: EventStore) {
    this.store = store ?? new InMemoryEventStore();
    this.commandHandler = new DefaultCommandHandler(this.store);
    this.sseTransport = new SSETransport(this.store);
    this.state = createInitialState();
  }

  /** Get the current derived projections. */
  getProjections(): AllProjections {
    return buildAllProjections(this.state, this.recentEvents);
  }

  /** Get the raw runtime state. */
  getState(): RuntimeState {
    return { ...this.state };
  }

  /** Rebuild state from the event store (replay). */
  async replay(): Promise<void> {
    const events = await this.store.readFrom(1);
    this.state = reduceBatch(createInitialState(), events);
    this.recentEvents = events.slice(-50); // keep last 50 in memory
  }

  /**
   * Submit a command and process the resulting events.
   * This is the main entry point for the runtime.
   * Optionally accepts a tenantId to scope the command.
   */
  async dispatch(command: Command, tenantId?: string): Promise<RuntimeEvent[]> {
    // Inject tenant context into command if provided
    const scopedCommand = tenantId
      ? { ...command, tenantId, streamId: (command as Record<string, unknown>).streamId ?? `tenant:${tenantId}` }
      : command;

    // 1. Command → Event(s)
    const result = await this.commandHandler.handle(scopedCommand, {
      kernelState: this.state.kernelState,
      sequence: this.state.sequence,
    });

    if (result.events.length === 0) {
      return []; // Idempotent duplicate; nothing to do
    }

    // 2. Append to event store (in order)
    const storedEvents: RuntimeEvent[] = [];
    for (const event of result.events) {
      const seq = await this.store.append(event);
      // Re-read to get the assigned sequence
      const stored = await this.store.read(seq);
      if (stored) {
        storedEvents.push(stored);
      }
    }

    // 3. Reduce into runtime state
    this.state = reduceBatch(this.state, storedEvents);

    // 4. Keep recent events for notification projection
    this.recentEvents = [...this.recentEvents, ...storedEvents].slice(-50);

    // 5. Build projections
    const projections = buildAllProjections(this.state, this.recentEvents);

    // 6. Notify listeners
    for (const listener of this.listeners) {
      try {
        listener(projections);
      } catch {
        // Swallow listener errors to keep runtime alive
      }
    }

    // 7. Notify event listeners
    for (const event of storedEvents) {
      for (const listener of this.eventListeners) {
        try {
          listener(event);
        } catch {
          // Swallow
        }
      }
    }

    // 8. Broadcast via SSE
    this.sseTransport.broadcastBatch(storedEvents);

    return storedEvents;
  }

  // -----------------------------------------------------------------------
  // Subscription API
  // -----------------------------------------------------------------------

  /** Subscribe to projection updates. Returns unsubscribe function. */
  onProjectionsUpdate(
    listener: (projections: AllProjections) => void,
  ): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  /** Subscribe to raw runtime events. Returns unsubscribe function. */
  onEvent(listener: (event: RuntimeEvent) => void): () => void {
    this.eventListeners.push(listener);
    return () => {
      this.eventListeners = this.eventListeners.filter((l) => l !== listener);
    };
  }

  // -----------------------------------------------------------------------
  // Heartbeat — periodic SSE keepalive
  // -----------------------------------------------------------------------

  startHeartbeat(intervalMs = 15000): void {
    this.stopHeartbeat();
    this.heartbeatInterval = setInterval(() => {
      this.sseTransport.heartbeat();
    }, intervalMs);
  }

  stopHeartbeat(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }

  /** Dispose the runtime cleanly. */
  dispose(): void {
    this.stopHeartbeat();
    this.sseTransport.disconnectAll();
    this.listeners = [];
    this.eventListeners = [];
  }
}

// ---------------------------------------------------------------------------
// Singleton (global runtime instance)
// ---------------------------------------------------------------------------

let globalRuntime: TrustRuntime | null = null;

/** Get or create the global TrustRuntime singleton. */
export function getRuntime(): TrustRuntime {
  if (!globalRuntime) {
    globalRuntime = new TrustRuntime();
    globalRuntime.startHeartbeat();
  }
  return globalRuntime;
}

/** Reset the global runtime (for testing). */
export function resetRuntime(): void {
  if (globalRuntime) {
    globalRuntime.dispose();
    globalRuntime = null;
  }
}

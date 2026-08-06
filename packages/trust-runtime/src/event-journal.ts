// packages/trust-runtime/src/event-journal.ts
// ───────────────────────────────────────────────────────────────
// Event Journal Implementation
// Append-only event store with hash chain integrity
// ───────────────────────────────────────────────────────────────

import type {
  TrustEvent,
  JournalEventRequest,
} from '@proofbridge/trust-types';
import {
  createTrustEvent,
  validateTrustEvent,
  type ValidationResult,
  type TrustEventType,
  type TrustEventPayload,
} from '@proofbridge/trust-events';
import {
  HashChainManager,
  createHashChainManager,
} from './hash-chain';

// ───────────────────────────────────────────────────────────────
// Event Journal Types
// ───────────────────────────────────────────────────────────────

export interface EventJournalConfig {
  contextId: string;
  genesisHash?: string;
  /** Optional PostgreSQL repository for durable persistence */
  repository?: EventRepository;
  /** Tenant ID for multi-tenant isolation (required when repository is provided) */
  tenantId?: string;
}

/**
 * Interface for PostgreSQL-backed event persistence.
 * Implemented by EventRepository in trust-projections.
 */
export interface EventRepository {
  appendEvent(
    event: TrustEvent,
    tenantId: string,
    streamId: string,
    streamVersion: number
  ): Promise<void>;
  getEvents(tenantId: string, streamId: string): Promise<TrustEvent[]>;
  getLatestEvent(tenantId: string, streamId: string): Promise<TrustEvent | undefined>;
  verifyChainIntegrity(
    tenantId: string,
    streamId: string
  ): Promise<{ valid: boolean; breaks: string[] }>;
}

export interface EventJournalState {
  contextId: string;
  events: TrustEvent[];
  currentHash: string;
  length: number;
}

export interface JournalEventResult {
  event: TrustEvent;
  chainLink: any;
  validation: ValidationResult;
}

// ───────────────────────────────────────────────────────────────
// Event Journal Class
// ───────────────────────────────────────────────────────────────

export class EventJournal {
  private contextId: string;
  private chainManager: HashChainManager;
  private events: Map<string, TrustEvent>;
  private repository?: EventRepository;
  private tenantId?: string;
  private streamVersion: number;

  constructor(config: EventJournalConfig) {
    this.contextId = config.contextId;
    this.chainManager = createHashChainManager({
      contextId: config.contextId,
      genesisHash: config.genesisHash,
    });
    this.events = new Map();
    this.repository = config.repository;
    this.tenantId = config.tenantId;
    this.streamVersion = 0;
  }

  /**
   * Journal a new event
   */
  async journalEvent(request: JournalEventRequest): Promise<JournalEventResult> {
    // Create the event
    const event = createTrustEvent({
      contextId: this.contextId,
      eventType: request.eventType as TrustEventType,
      payload: request.payload as TrustEventPayload,
      previousEventHash: this.chainManager.getCurrentHash(),
      metadata: {
        agentId: request.agentId,
        targetContract: request.targetContract,
        calldata: request.calldata,
        valueETH: request.valueETH,
        signatureProof: request.signatureProof,
      },
    });

    // Validate the event
    const validation = validateTrustEvent(event);

    // Append to hash chain
    const chainLink = this.chainManager.appendEvent(event);

    // Store the event in memory
    this.events.set(event.eventId, event);

    // Persist to PostgreSQL if repository is provided
    if (this.repository && this.tenantId) {
      this.streamVersion++;
      await this.repository.appendEvent(
        event,
        this.tenantId,
        this.contextId,
        this.streamVersion
      );
    }

    return {
      event,
      chainLink,
      validation,
    };
  }

  /**
   * Get event by ID
   */
  getEvent(eventId: string): TrustEvent | undefined {
    return this.events.get(eventId);
  }

  /**
   * Get all events
   */
  getAllEvents(): TrustEvent[] {
    return Array.from(this.events.values());
  }

  /**
   * Get events by type
   */
  getEventsByType(eventType: string): TrustEvent[] {
    return Array.from(this.events.values())
      .filter((e) => e.eventType === eventType);
  }

  /**
   * Verify event chain integrity
   */
  verifyIntegrity(): boolean {
    return this.chainManager.verifyChainIntegrity();
  }

  /**
   * Get current state
   */
  getState(): EventJournalState {
    return {
      contextId: this.contextId,
      events: this.getAllEvents(),
      currentHash: this.chainManager.getCurrentHash(),
      length: this.chainManager.getLength(),
    };
  }

  /**
   * Get chain manager
   */
  getChainManager(): HashChainManager {
    return this.chainManager;
  }
}

// ───────────────────────────────────────────────────────────────
// Factory Function
// ───────────────────────────────────────────────────────────────

export function createEventJournal(config: EventJournalConfig): EventJournal {
  return new EventJournal(config);
}

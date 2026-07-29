import type {
  TrustContext,
  TrustContextStatus,
  TrustConfiguration,
  VerificationPolicy,
  CreateTrustContextRequest,
  CreateTrustContextResponse,
} from '@proofbridge/trust-types';
import { EventJournal, createEventJournal, type EventRepository } from './event-journal';
import { createHashChainManager } from './hash-chain';
import { v4 as uuidv4 } from 'uuid';
import { sha256Hex, hashObject } from '@proofbridge/trust-crypto';

export interface TrustContextManagerConfig {
  signingKey: string;
  /** Optional PostgreSQL context repository for durable persistence */
  contextRepository?: ContextRepository;
  /** Optional PostgreSQL event repository (passed to journals) */
  eventRepository?: EventRepository;
  /** Tenant ID for multi-tenant isolation (required when repositories are provided) */
  tenantId?: string;
}

/**
 * Interface for PostgreSQL-backed context persistence.
 * Implemented by ContextRepository in trust-projections.
 */
export interface ContextRepository {
  saveContext(context: TrustContext): Promise<void>;
  getContext(contextId: string): Promise<TrustContext | undefined>;
  updateStatus(contextId: string, status: TrustContextStatus): Promise<void>;
  getAllContexts(): Promise<TrustContext[]>;
}

export interface ContextCreationResult {
  context: TrustContext;
  response: CreateTrustContextResponse;
  journal: EventJournal;
}

export class TrustContextManager {
  private signingKey: string;
  private contexts: Map<string, TrustContext>;
  private journals: Map<string, EventJournal>;
  private contextRepository?: ContextRepository;
  private eventRepository?: EventRepository;
  private tenantId?: string;

  constructor(config: TrustContextManagerConfig) {
    this.signingKey = config.signingKey;
    this.contexts = new Map();
    this.journals = new Map();
    this.contextRepository = config.contextRepository;
    this.eventRepository = config.eventRepository;
    this.tenantId = config.tenantId;
  }

  async createContext(request: CreateTrustContextRequest): Promise<ContextCreationResult> {
    const contextId = uuidv4();
    const timestamp = Date.now();

    const trustAnchor = this.computeTrustAnchor(request.configuration);

    const configurationReceipt = this.computeConfigurationReceipt(
      request.configuration,
      request.verificationPolicy
    );

    const receiptRoot = sha256Hex(
      hashObject({
        configurationReceipt,
        trustAnchor,
        timestamp,
      })
    );

    const context: TrustContext = {
      contextId,
      trustAnchor,
      configurationReceipt,
      verificationPolicy: request.verificationPolicy,
      receiptRoot,
      status: 'initializing',
      createdAt: timestamp,
      updatedAt: timestamp,
    };

    const response: CreateTrustContextResponse = {
      contextId,
      trustAnchor,
      configurationReceipt,
      verificationPolicy: request.verificationPolicy,
      receiptRoot,
    };

    const journal = createEventJournal({
      contextId,
      genesisHash: receiptRoot,
      repository: this.eventRepository,
      tenantId: this.tenantId,
    });

    this.contexts.set(contextId, context);
    this.journals.set(contextId, journal);

    // Persist to PostgreSQL if repository is provided
    if (this.contextRepository) {
      await this.contextRepository.saveContext(context);
    }

    // Activate the context
    context.status = 'active';
    context.updatedAt = Date.now();

    // Journal the context.created event
    await journal.journalEvent({
      contextId,
      eventType: 'context.created',
      eventVersion: '1',
      payload: {
        type: 'context.created',
        configuration: request.configuration,
        verificationPolicy: request.verificationPolicy,
        trustAnchor,
        configurationReceipt,
        receiptRoot,
      },
      agentId: 'context-manager',
    });

    // Journal the context.activated event
    await journal.journalEvent({
      contextId,
      eventType: 'context.activated',
      eventVersion: '1',
      payload: {
        type: 'context.activated',
        activatedBy: 'context-manager',
        reason: 'Context created and activated',
      },
      agentId: 'context-manager',
    });

    return {
      context,
      response,
      journal,
    };
  }

  private computeTrustAnchor(configuration: TrustConfiguration): string {
    return sha256Hex(
      hashObject({
        configurationId: configuration.configurationId,
        configurationVersion: configuration.configurationVersion,
        consumerApplication: configuration.consumerApplication,
        createdAt: configuration.createdAt,
      })
    );
  }

  private computeConfigurationReceipt(
    configuration: TrustConfiguration,
    verificationPolicy: VerificationPolicy
  ): string {
    return sha256Hex(
      hashObject({
        configuration,
        verificationPolicy,
        timestamp: Date.now(),
      })
    );
  }

  getContext(contextId: string): TrustContext | undefined {
    return this.contexts.get(contextId);
  }

  getJournal(contextId: string): EventJournal | undefined {
    return this.journals.get(contextId);
  }

  updateContextStatus(
    contextId: string,
    status: TrustContextStatus
  ): TrustContext | undefined {
    const context = this.contexts.get(contextId);
    if (!context) return undefined;

    context.status = status;
    context.updatedAt = Date.now();

    return context;
  }

  async suspendContext(contextId: string, reason: string): Promise<TrustContext | undefined> {
    const context = this.contexts.get(contextId);
    if (!context) return undefined;

    context.status = 'suspended';
    context.updatedAt = Date.now();

    // Persist status change
    if (this.contextRepository) {
      await this.contextRepository.updateStatus(contextId, 'suspended');
    }

    // Journal the suspension event
    const journal = this.journals.get(contextId);
    if (journal) {
      await journal.journalEvent({
        contextId,
        eventType: 'context.suspended',
        eventVersion: '1',
        payload: {
          type: 'context.suspended',
          suspendedBy: 'context-manager',
          reason,
        },
        agentId: 'context-manager',
      });
    }

    return context;
  }

  async freezeContext(contextId: string, reason: string): Promise<TrustContext | undefined> {
    const context = this.contexts.get(contextId);
    if (!context) return undefined;

    context.status = 'frozen';
    context.updatedAt = Date.now();

    if (this.contextRepository) {
      await this.contextRepository.updateStatus(contextId, 'frozen');
    }

    const journal = this.journals.get(contextId);
    if (journal) {
      await journal.journalEvent({
        contextId,
        eventType: 'context.frozen',
        eventVersion: '1',
        payload: {
          type: 'context.frozen',
          frozenBy: 'context-manager',
          reason,
        },
        agentId: 'context-manager',
      });
    }

    return context;
  }

  async terminateContext(contextId: string, reason: string): Promise<TrustContext | undefined> {
    const context = this.contexts.get(contextId);
    if (!context) return undefined;

    context.status = 'terminated';
    context.updatedAt = Date.now();

    if (this.contextRepository) {
      await this.contextRepository.updateStatus(contextId, 'terminated');
    }

    const journal = this.journals.get(contextId);
    if (journal) {
      await journal.journalEvent({
        contextId,
        eventType: 'context.terminated',
        eventVersion: '1',
        payload: {
          type: 'context.terminated',
          terminatedBy: 'context-manager',
          reason,
        },
        agentId: 'context-manager',
      });
    }

    return context;
  }

  getAllContexts(): TrustContext[] {
    return Array.from(this.contexts.values());
  }

  getContextsByStatus(status: TrustContextStatus): TrustContext[] {
    return Array.from(this.contexts.values())
      .filter((c) => c.status === status);
  }

  verifyContextConfiguration(
    contextId: string,
    configuration: TrustConfiguration
  ): boolean {
    const context = this.contexts.get(contextId);
    if (!context) return false;

    const expectedReceipt = this.computeConfigurationReceipt(
      configuration,
      context.verificationPolicy
    );

    return context.configurationReceipt === expectedReceipt;
  }
}

export function createTrustContextManager(
  config: TrustContextManagerConfig
): TrustContextManager {
  return new TrustContextManager(config);
}

// packages/trust-runtime/src/context-manager.ts
// ───────────────────────────────────────────────────────────────
// Trust Context Manager
// Manages Trust Context lifecycle and configuration
// ───────────────────────────────────────────────────────────────

import type {
  TrustContext,
  TrustContextStatus,
  TrustConfiguration,
  VerificationPolicy,
  CreateTrustContextRequest,
  CreateTrustContextResponse,
} from '@proofbridge/trust-types';
import { EventJournal, createEventJournal } from './event-journal';
import { createHashChainManager } from './hash-chain';
import { v4 as uuidv4 } from 'uuid';
import { sha256Hex, hashObject } from '@proofbridge/trust-crypto';

// ───────────────────────────────────────────────────────────────
// Context Manager Types
// ───────────────────────────────────────────────────────────────

export interface TrustContextManagerConfig {
  signingKey: string;
}

export interface ContextCreationResult {
  context: TrustContext;
  response: CreateTrustContextResponse;
  journal: EventJournal;
}

// ───────────────────────────────────────────────────────────────
// Trust Context Manager Class
// ───────────────────────────────────────────────────────────────

export class TrustContextManager {
  private signingKey: string;
  private contexts: Map<string, TrustContext>;
  private journals: Map<string, EventJournal>;

  constructor(config: TrustContextManagerConfig) {
    this.signingKey = config.signingKey;
    this.contexts = new Map();
    this.journals = new Map();
  }

  /**
   * Create a new Trust Context
   */
  createContext(request: CreateTrustContextRequest): ContextCreationResult {
    const contextId = uuidv4();
    const timestamp = Date.now();

    // Compute trust anchor from configuration
    const trustAnchor = this.computeTrustAnchor(request.configuration);

    // Compute configuration receipt
    const configurationReceipt = this.computeConfigurationReceipt(
      request.configuration,
      request.verificationPolicy
    );

    // Compute receipt root
    const receiptRoot = sha256Hex(
      hashObject({
        configurationReceipt,
        trustAnchor,
        timestamp,
      })
    );

    // Create the context
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

    // Create the response
    const response: CreateTrustContextResponse = {
      contextId,
      trustAnchor,
      configurationReceipt,
      verificationPolicy: request.verificationPolicy,
      receiptRoot,
    };

    // Create the event journal
    const journal = createEventJournal({
      contextId,
      genesisHash: receiptRoot,
    });

    // Store the context and journal
    this.contexts.set(contextId, context);
    this.journals.set(contextId, journal);

    // Activate the context
    context.status = 'active';
    context.updatedAt = Date.now();

    return {
      context,
      response,
      journal,
    };
  }

  /**
   * Compute trust anchor from configuration
   */
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

  /**
   * Compute configuration receipt
   */
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

  /**
   * Get Trust Context by ID
   */
  getContext(contextId: string): TrustContext | undefined {
    return this.contexts.get(contextId);
  }

  /**
   * Get Event Journal for a context
   */
  getJournal(contextId: string): EventJournal | undefined {
    return this.journals.get(contextId);
  }

  /**
   * Update context status
   */
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

  /**
   * Suspend a Trust Context
   */
  suspendContext(contextId: string, reason: string): TrustContext | undefined {
    const context = this.contexts.get(contextId);
    if (!context) return undefined;

    context.status = 'suspended';
    context.updatedAt = Date.now();

    // TODO: Journal the suspension event

    return context;
  }

  /**
   * Freeze a Trust Context
   */
  freezeContext(contextId: string, reason: string): TrustContext | undefined {
    const context = this.contexts.get(contextId);
    if (!context) return undefined;

    context.status = 'frozen';
    context.updatedAt = Date.now();

    // TODO: Journal the freeze event

    return context;
  }

  /**
   * Terminate a Trust Context
   */
  terminateContext(contextId: string, reason: string): TrustContext | undefined {
    const context = this.contexts.get(contextId);
    if (!context) return undefined;

    context.status = 'terminated';
    context.updatedAt = Date.now();

    // TODO: Journal the termination event

    return context;
  }

  /**
   * Get all contexts
   */
  getAllContexts(): TrustContext[] {
    return Array.from(this.contexts.values());
  }

  /**
   * Get contexts by status
   */
  getContextsByStatus(status: TrustContextStatus): TrustContext[] {
    return Array.from(this.contexts.values())
      .filter((c) => c.status === status);
  }

  /**
   * Verify context configuration
   */
  verifyContextConfiguration(
    contextId: string,
    configuration: TrustConfiguration
  ): boolean {
    const context = this.contexts.get(contextId);
    if (!context) return false;

    // Verify the configuration receipt matches
    const expectedReceipt = this.computeConfigurationReceipt(
      configuration,
      context.verificationPolicy
    );

    return context.configurationReceipt === expectedReceipt;
  }
}

// ───────────────────────────────────────────────────────────────
// Factory Function
// ───────────────────────────────────────────────────────────────

export function createTrustContextManager(
  config: TrustContextManagerConfig
): TrustContextManager {
  return new TrustContextManager(config);
}

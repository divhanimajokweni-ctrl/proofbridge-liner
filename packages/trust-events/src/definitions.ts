// packages/trust-events/src/definitions.ts
// ───────────────────────────────────────────────────────────────
// Trust Event Definitions
// Core event types and schemas for the Trust Context hash chain
// ───────────────────────────────────────────────────────────────

import type {
  TrustContext,
  TrustConfiguration,
  VerificationPolicy,
  VerificationResult,
  TrustContextReceipt,
  AgentTransactionRequest,
  KillSwitchState,
} from '@proofbridge/trust-types';

// ───────────────────────────────────────────────────────────────
// Event Types
// ───────────────────────────────────────────────────────────────

/**
 * Trust Event Types
 * These are the immutable event types that form the hash chain
 */
export type TrustEventType =
  // Context lifecycle events
  | 'context.created'
  | 'context.activated'
  | 'context.suspended'
  | 'context.frozen'
  | 'context.terminated'
  
  // Event journaling
  | 'event.journaled'
  
  // Transaction verification
  | 'transaction.verified'
  | 'transaction.approved'
  | 'transaction.rejected'
  
  // Kill switch
  | 'kill_switch.activated'
  | 'kill_switch.deactivated'
  
  // Attestation
  | 'attestation.issued'
  
  // Receipts
  | 'receipt.issued';

// ───────────────────────────────────────────────────────────────
// Event Payload Types
// ───────────────────────────────────────────────────────────────

/**
 * Base Trust Event
 * This is the immutable event that gets hashed into the chain
 */
export interface TrustEvent {
  eventId: string;
  contextId: string;
  eventType: TrustEventType;
  eventVersion: string;
  payload: TrustEventPayload;
  previousEventHash: string;
  eventHash: string;
  timestamp: number;
  metadata?: Record<string, unknown>;
}

/**
 * Union type for all possible event payloads
 */
export type TrustEventPayload =
  | ContextCreatedPayload
  | ContextActivatedPayload
  | ContextSuspendedPayload
  | ContextFrozenPayload
  | ContextTerminatedPayload
  | EventJournaledPayload
  | TransactionVerifiedPayload
  | TransactionApprovedPayload
  | TransactionRejectedPayload
  | KillSwitchActivatedPayload
  | KillSwitchDeactivatedPayload
  | AttestationIssuedPayload
  | ReceiptIssuedPayload;

// Context Lifecycle Payloads

export interface ContextCreatedPayload {
  type: 'context.created';
  configuration: TrustConfiguration;
  verificationPolicy: VerificationPolicy;
  trustAnchor: string;
  configurationReceipt: string;
  receiptRoot: string;
}

export interface ContextActivatedPayload {
  type: 'context.activated';
  activatedBy: string;
  activationReason?: string;
}

export interface ContextSuspendedPayload {
  type: 'context.suspended';
  suspendedBy: string;
  suspensionReason: string;
  suspendedAt: number;
}

export interface ContextFrozenPayload {
  type: 'context.frozen';
  frozenBy: string;
  freezeReason: string;
  frozenAt: number;
}

export interface ContextTerminatedPayload {
  type: 'context.terminated';
  terminatedBy: string;
  terminationReason: string;
  terminatedAt: number;
}

// Event Journaling Payloads

export interface EventJournaledPayload {
  type: 'event.journaled';
  agentId: string;
  eventType: string;
  payload: unknown;
  targetContract?: string;
  calldata?: string;
  valueETH?: number;
  signatureProof?: string;
}

// Transaction Verification Payloads

export interface TransactionVerifiedPayload {
  type: 'transaction.verified';
  request: AgentTransactionRequest;
  result: VerificationResult;
  riskScore: number;
}

export interface TransactionApprovedPayload {
  type: 'transaction.approved';
  request: AgentTransactionRequest;
  result: VerificationResult;
  receipt: TrustContextReceipt;
}

export interface TransactionRejectedPayload {
  type: 'transaction.rejected';
  request: AgentTransactionRequest;
  result: VerificationResult;
  rejectionReason: string;
}

// Kill Switch Payloads

export interface KillSwitchActivatedPayload {
  type: 'kill_switch.activated';
  state: KillSwitchState;
  activatedBy: string;
  reason: string;
}

export interface KillSwitchDeactivatedPayload {
  type: 'kill_switch.deactivated';
  state: KillSwitchState;
  deactivatedBy: string;
  reason: string;
}

// Attestation Payloads

export interface AttestationIssuedPayload {
  type: 'attestation.issued';
  attestationId: string;
  attestor: string;
  subject: string;
  claim: Record<string, unknown>;
  signature: string;
  timestamp: number;
}

// Receipt Payloads

export interface ReceiptIssuedPayload {
  type: 'receipt.issued';
  receipt: TrustContextReceipt;
}

// ───────────────────────────────────────────────────────────────
// Event Creation Helpers
// ───────────────────────────────────────────────────────────────

import { hashObject, sha256Hex, computeHashChainLink } from '@proofbridge/trust-crypto';
import { v4 as uuidv4 } from 'uuid';

/**
 * Create a new Trust Event
 * Computes the event hash and chain link automatically
 */
export function createTrustEvent(
  params: {
    contextId: string;
    eventType: TrustEventType;
    payload: TrustEventPayload;
    previousEventHash: string;
    eventVersion?: string;
    metadata?: Record<string, unknown>;
  }
): TrustEvent {
  const eventId = uuidv4();
  const timestamp = Date.now();
  const eventVersion = params.eventVersion || '1';
  
  // Create the base event object for hashing
  const baseEvent = {
    eventId,
    contextId: params.contextId,
    eventType: params.eventType,
    eventVersion,
    payload: params.payload,
    previousEventHash: params.previousEventHash,
    timestamp,
    metadata: params.metadata,
  };
  
  // Compute event hash (hash of the canonical representation)
  const eventHash = sha256Hex(hashObject(baseEvent));
  
  // Compute chain hash: SHA-256(previousEventHash + eventHash)
  const chainHash = computeHashChainLink(params.previousEventHash, eventHash);
  
  return {
    eventId,
    contextId: params.contextId,
    eventType: params.eventType,
    eventVersion,
    payload: params.payload,
    previousEventHash: params.previousEventHash,
    eventHash,
    timestamp,
    metadata: params.metadata,
  };
}

/**
 * Create context created event
 */
export function createContextCreatedEvent(
  params: {
    contextId: string;
    configuration: TrustConfiguration;
    verificationPolicy: VerificationPolicy;
    trustAnchor: string;
    configurationReceipt: string;
    receiptRoot: string;
    previousEventHash: string;
  }
): TrustEvent {
  const payload: ContextCreatedPayload = {
    type: 'context.created',
    configuration: params.configuration,
    verificationPolicy: params.verificationPolicy,
    trustAnchor: params.trustAnchor,
    configurationReceipt: params.configurationReceipt,
    receiptRoot: params.receiptRoot,
  };
  
  return createTrustEvent({
    contextId: params.contextId,
    eventType: 'context.created',
    payload,
    previousEventHash: params.previousEventHash,
  });
}

/**
 * Create event journaled event
 */
export function createEventJournaledEvent(
  params: {
    contextId: string;
    agentId: string;
    eventType: string;
    payload: unknown;
    targetContract?: string;
    calldata?: string;
    valueETH?: number;
    signatureProof?: string;
    previousEventHash: string;
  }
): TrustEvent {
  const payload: EventJournaledPayload = {
    type: 'event.journaled',
    agentId: params.agentId,
    eventType: params.eventType,
    payload: params.payload,
    targetContract: params.targetContract,
    calldata: params.calldata,
    valueETH: params.valueETH,
    signatureProof: params.signatureProof,
  };
  
  return createTrustEvent({
    contextId: params.contextId,
    eventType: 'event.journaled',
    payload,
    previousEventHash: params.previousEventHash,
  });
}

/**
 * Create transaction verified event
 */
export function createTransactionVerifiedEvent(
  params: {
    contextId: string;
    request: AgentTransactionRequest;
    result: VerificationResult;
    riskScore: number;
    previousEventHash: string;
  }
): TrustEvent {
  const payload: TransactionVerifiedPayload = {
    type: 'transaction.verified',
    request: params.request,
    result: params.result,
    riskScore: params.riskScore,
  };
  
  return createTrustEvent({
    contextId: params.contextId,
    eventType: 'transaction.verified',
    payload,
    previousEventHash: params.previousEventHash,
  });
}

/**
 * Create transaction approved event
 */
export function createTransactionApprovedEvent(
  params: {
    contextId: string;
    request: AgentTransactionRequest;
    result: VerificationResult;
    receipt: TrustContextReceipt;
    previousEventHash: string;
  }
): TrustEvent {
  const payload: TransactionApprovedPayload = {
    type: 'transaction.approved',
    request: params.request,
    result: params.result,
    receipt: params.receipt,
  };
  
  return createTrustEvent({
    contextId: params.contextId,
    eventType: 'transaction.approved',
    payload,
    previousEventHash: params.previousEventHash,
  });
}

/**
 * Create transaction rejected event
 */
export function createTransactionRejectedEvent(
  params: {
    contextId: string;
    request: AgentTransactionRequest;
    result: VerificationResult;
    rejectionReason: string;
    previousEventHash: string;
  }
): TrustEvent {
  const payload: TransactionRejectedPayload = {
    type: 'transaction.rejected',
    request: params.request,
    result: params.result,
    rejectionReason: params.rejectionReason,
  };
  
  return createTrustEvent({
    contextId: params.contextId,
    eventType: 'transaction.rejected',
    payload,
    previousEventHash: params.previousEventHash,
  });
}

// ───────────────────────────────────────────────────────────────
// Event Validation
// ───────────────────────────────────────────────────────────────

/**
 * Validate a Trust Event
 */
export function validateTrustEvent(event: TrustEvent): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  
  // Check required fields
  if (!event.eventId) {
    errors.push('Missing eventId');
  }
  
  if (!event.contextId) {
    errors.push('Missing contextId');
  }
  
  if (!event.eventType) {
    errors.push('Missing eventType');
  }
  
  if (!event.eventVersion) {
    errors.push('Missing eventVersion');
  }
  
  if (!event.payload) {
    errors.push('Missing payload');
  }
  
  if (!event.eventHash) {
    errors.push('Missing eventHash');
  }
  
  if (!event.timestamp) {
    errors.push('Missing timestamp');
  }
  
  // Validate event type
  const validTypes: TrustEventType[] = [
    'context.created', 'context.activated', 'context.suspended', 'context.frozen', 'context.terminated',
    'event.journaled',
    'transaction.verified', 'transaction.approved', 'transaction.rejected',
    'kill_switch.activated', 'kill_switch.deactivated',
    'attestation.issued',
    'receipt.issued',
  ];
  
  if (!validTypes.includes(event.eventType as TrustEventType)) {
    errors.push(`Invalid eventType: ${event.eventType}`);
  }
  
  // Validate payload type matches event type
  if (event.payload && typeof event.payload === 'object') {
    const payload = event.payload as Record<string, unknown>;
    if (payload.type && payload.type !== event.eventType) {
      errors.push(`Payload type mismatch: payload.type=${payload.type}, event.eventType=${event.eventType}`);
    }
  }
  
  // Verify event hash
  const computedHash = sha256Hex(hashObject({
    eventId: event.eventId,
    contextId: event.contextId,
    eventType: event.eventType,
    eventVersion: event.eventVersion,
    payload: event.payload,
    previousEventHash: event.previousEventHash,
    timestamp: event.timestamp,
    metadata: event.metadata,
  }));
  
  if (computedHash !== event.eventHash) {
    errors.push('Event hash mismatch: computed hash does not match stored hash');
  }
  
  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

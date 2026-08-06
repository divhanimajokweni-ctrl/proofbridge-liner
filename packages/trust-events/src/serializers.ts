// packages/trust-events/src/serializers.ts
// ───────────────────────────────────────────────────────────────
// Trust Event Serializers
// Canonical serialization for deterministic hashing and storage
// ───────────────────────────────────────────────────────────────

import { canonicalJson } from '@proofbridge/trust-crypto';
import type {
  TrustEvent,
  TrustEventPayload,
  ContextCreatedPayload,
  ContextActivatedPayload,
  ContextSuspendedPayload,
  ContextFrozenPayload,
  ContextTerminatedPayload,
  EventJournaledPayload,
  TransactionVerifiedPayload,
  TransactionApprovedPayload,
  TransactionRejectedPayload,
  KillSwitchActivatedPayload,
  KillSwitchDeactivatedPayload,
  AttestationIssuedPayload,
  ReceiptIssuedPayload,
} from './definitions';

// ───────────────────────────────────────────────────────────────
// Serialization Functions
// ───────────────────────────────────────────────────────────────

/**
 * Serialize a Trust Event to canonical JSON
 * This ensures deterministic hashing across all systems
 */
export function serializeTrustEvent(event: TrustEvent): string {
  return canonicalJson({
    eventId: event.eventId,
    contextId: event.contextId,
    eventType: event.eventType,
    eventVersion: event.eventVersion,
    payload: event.payload,
    previousEventHash: event.previousEventHash,
    eventHash: event.eventHash,
    timestamp: event.timestamp,
    metadata: event.metadata,
  });
}

/**
 * Deserialize a Trust Event from JSON
 */
export function deserializeTrustEvent(serialized: string): TrustEvent {
  const parsed = JSON.parse(serialized);
  return {
    eventId: parsed.eventId,
    contextId: parsed.contextId,
    eventType: parsed.eventType,
    eventVersion: parsed.eventVersion,
    payload: parsed.payload,
    previousEventHash: parsed.previousEventHash,
    eventHash: parsed.eventHash,
    timestamp: parsed.timestamp,
    metadata: parsed.metadata,
  };
}

/**
 * Serialize event payload to canonical JSON
 */
export function serializeEventPayload(payload: TrustEventPayload): string {
  return canonicalJson(payload);
}

/**
 * Deserialize event payload from JSON
 */
export function deserializeEventPayload(
  serialized: string,
  eventType: string
): TrustEventPayload {
  const parsed = JSON.parse(serialized);
  
  // Add type field to match the payload interface
  return {
    ...parsed,
    type: eventType as any, // Cast to satisfy type system
  };
}

// ───────────────────────────────────────────────────────────────
// Payload-Specific Serializers
// ───────────────────────────────────────────────────────────────

/**
 * Serialize Context Created payload
 */
export function serializeContextCreatedPayload(
  payload: ContextCreatedPayload
): string {
  return canonicalJson({
    type: payload.type,
    configuration: payload.configuration,
    verificationPolicy: payload.verificationPolicy,
    trustAnchor: payload.trustAnchor,
    configurationReceipt: payload.configurationReceipt,
    receiptRoot: payload.receiptRoot,
  });
}

/**
 * Serialize Event Journaled payload
 */
export function serializeEventJournaledPayload(
  payload: EventJournaledPayload
): string {
  return canonicalJson({
    type: payload.type,
    agentId: payload.agentId,
    eventType: payload.eventType,
    payload: payload.payload,
    targetContract: payload.targetContract,
    calldata: payload.calldata,
    valueETH: payload.valueETH,
    signatureProof: payload.signatureProof,
  });
}

/**
 * Serialize Transaction Verified payload
 */
export function serializeTransactionVerifiedPayload(
  payload: TransactionVerifiedPayload
): string {
  return canonicalJson({
    type: payload.type,
    request: payload.request,
    result: payload.result,
    riskScore: payload.riskScore,
  });
}

/**
 * Serialize Transaction Approved payload
 */
export function serializeTransactionApprovedPayload(
  payload: TransactionApprovedPayload
): string {
  return canonicalJson({
    type: payload.type,
    request: payload.request,
    result: payload.result,
    receipt: payload.receipt,
  });
}

/**
 * Serialize Transaction Rejected payload
 */
export function serializeTransactionRejectedPayload(
  payload: TransactionRejectedPayload
): string {
  return canonicalJson({
    type: payload.type,
    request: payload.request,
    result: payload.result,
    rejectionReason: payload.rejectionReason,
  });
}

/**
 * Serialize Kill Switch Activated payload
 */
export function serializeKillSwitchActivatedPayload(
  payload: KillSwitchActivatedPayload
): string {
  return canonicalJson({
    type: payload.type,
    state: payload.state,
    activatedBy: payload.activatedBy,
    reason: payload.reason,
  });
}

/**
 * Serialize Kill Switch Deactivated payload
 */
export function serializeKillSwitchDeactivatedPayload(
  payload: KillSwitchDeactivatedPayload
): string {
  return canonicalJson({
    type: payload.type,
    state: payload.state,
    deactivatedBy: payload.deactivatedBy,
    reason: payload.reason,
  });
}

/**
 * Serialize Attestation Issued payload
 */
export function serializeAttestationIssuedPayload(
  payload: AttestationIssuedPayload
): string {
  return canonicalJson({
    type: payload.type,
    attestationId: payload.attestationId,
    attestor: payload.attestor,
    subject: payload.subject,
    claim: payload.claim,
    signature: payload.signature,
    timestamp: payload.timestamp,
  });
}

/**
 * Serialize Receipt Issued payload
 */
export function serializeReceiptIssuedPayload(
  payload: ReceiptIssuedPayload
): string {
  return canonicalJson({
    type: payload.type,
    receipt: payload.receipt,
  });
}

// ───────────────────────────────────────────────────────────────
// Batch Serialization
// ───────────────────────────────────────────────────────────────

/**
 * Serialize multiple events
 */
export function serializeTrustEvents(events: TrustEvent[]): string {
  return canonicalJson(events.map(serializeTrustEvent));
}

/**
 * Deserialize multiple events
 */
export function deserializeTrustEvents(serialized: string): TrustEvent[] {
  const parsed = JSON.parse(serialized);
  return parsed.map(deserializeTrustEvent);
}

// ───────────────────────────────────────────────────────────────
// Database Storage Serializers
// ───────────────────────────────────────────────────────────────

/**
 * Serialize event for database storage
 * Uses a more compact format suitable for PostgreSQL JSONB
 */
export function serializeForDatabase(event: TrustEvent): Record<string, unknown> {
  return {
    event_id: event.eventId,
    context_id: event.contextId,
    event_type: event.eventType,
    event_version: event.eventVersion,
    payload: event.payload,
    previous_event_hash: event.previousEventHash,
    event_hash: event.eventHash,
    timestamp: event.timestamp,
    metadata: event.metadata || {},
  };
}

/**
 * Deserialize event from database format
 */
export function deserializeFromDatabase(
  row: Record<string, unknown>
): TrustEvent {
  return {
    eventId: row.event_id as string,
    contextId: row.context_id as string,
    eventType: row.event_type as any,
    eventVersion: row.event_version as string,
    payload: row.payload as TrustEventPayload,
    previousEventHash: row.previous_event_hash as string,
    eventHash: row.event_hash as string,
    timestamp: row.timestamp as number,
    metadata: row.metadata as Record<string, unknown> | undefined,
  };
}

// ───────────────────────────────────────────────────────────────
// Hash Computation
// ───────────────────────────────────────────────────────────────

import { sha256Hex } from '@proofbridge/trust-crypto';

/**
 * Compute event hash from serialized form
 */
export function computeEventHashFromSerialized(serialized: string): string {
  return sha256Hex(serialized);
}

/**
 * Compute event hash directly from event object
 */
export function computeEventHash(event: TrustEvent): string {
  return sha256Hex(serializeTrustEvent(event));
}

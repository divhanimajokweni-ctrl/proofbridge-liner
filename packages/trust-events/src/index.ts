// packages/trust-events/src/index.ts
// ───────────────────────────────────────────────────────────────
// Trust Events Package
// Core event types, definitions, and serializers
// ───────────────────────────────────────────────────────────────

// Event definitions
export * from './definitions';

// Serializers
export * from './serializers';

// Re-export key types
export type {
  TrustEventType,
  TrustEvent,
  TrustEventPayload,
  ContextCreatedPayload,
  ContextActivatedPayload,
  ContextSuspendedPayload,
  ContextFrozenPayload,
  ContextTerminatedPayload,
  ContextUpdatedPayload,
  EventJournaledPayload,
  TransactionVerifiedPayload,
  TransactionApprovedPayload,
  TransactionRejectedPayload,
  KillSwitchActivatedPayload,
  KillSwitchDeactivatedPayload,
  AttestationIssuedPayload,
  ReceiptIssuedPayload,
  BartbotEnforcementPayload,
  BartbotSelfAuditPayload,
  BartbotSelfAuditFailurePayload,
  ValidationResult,
} from './definitions';

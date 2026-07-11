// packages/trust-types/src/index.ts
// ───────────────────────────────────────────────────────────────
// Trust Types Package
// Re-exports all frozen contract types from contracts/api/types.ts
// ───────────────────────────────────────────────────────────────

export * from '@proofbridge/contracts/api/types';

// Re-export specific types for convenience
export type {
  TrustConfiguration,
  TrustContext,
  TrustContextStatus,
  CreateTrustContextRequest,
  CreateTrustContextResponse,
  VerificationPolicy,
  VerificationRule,
  VerificationRuleType,
  CircuitBreakerConfig,
  TrustEvent,
  JournalEventRequest,
  TrustContextReceipt,
  ReceiptType,
  VerificationResult,
  AgentTransactionRequest,
  KillSwitchState,
  ChronicleEntry,
} from '@proofbridge/contracts/api/types';

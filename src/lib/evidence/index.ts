// src/lib/evidence/index.ts
// ───────────────────────────────────────────────────────────────
// Evidence Envelope Pipeline — Barrel Export
// ───────────────────────────────────────────────────────────────

export type {
  RequestStage,
  PolicyDecisionStage,
  ModelStage,
  ToolCallStage,
  OutputStage,
  ValidationStage,
  UnsignedEnvelope,
  ExecutionEnvelope,
  EvidenceLedgerEntry,
} from "./envelope";

export { buildUnsignedEnvelope } from "./envelope";

export { hashExecutionEnvelope, verifyEnvelopeHash } from "./hashing";

export type { EvidenceSigner } from "./signer";
export { NodeCryptoEvidenceSigner, signEnvelope } from "./signer";

export type { EvidenceLedgerStorage } from "./ledger";
export { InMemoryEvidenceLedger, buildLedgerEntry } from "./ledger";
export type { EvidenceLedgerEntry as LedgerEntry } from "./ledger";

// src/lib/evidence/index.ts
// ───────────────────────────────────────────────────────────────
// Epistemic Runtime — Evidence Envelope Pipeline — Barrel Export
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
  EnvelopeProviders,
} from './envelope';

export { buildUnsignedEnvelope } from './envelope';

export { hashExecutionEnvelope, verifyEnvelopeHash } from './hashing';

export type { EvidenceSigner } from './signer';
export { KernelEvidenceSigner, signEnvelope } from './signer';

export type { EvidenceLedgerStorage } from './ledger';
export { InMemoryEvidenceLedger, buildLedgerEntry } from './ledger';
export type { EvidenceLedgerEntry as LedgerEntry } from './envelope';

export type {
  PolicyGateResult,
  ExecutionGateResult,
} from './gate-envelope';
export { EnvelopeEmittingGate } from './gate-envelope';

export type {
  TeeAttestationStage,
  ZkProofStage,
  BayesianSafetyStage,
  ProofBridgeAirEnvelope,
  AirEvidenceSigner,
  AirLedgerEntry,
  AirEvidenceLedgerStorage,
  AirEngineConfig,
  AirEngineProviders,
} from './airEngine';
export {
  KernelAirEvidenceSigner,
  InMemoryAirEvidenceLedger,
  computeEnvelopeHash,
  ProofBridgeAirEngine,
} from './airEngine';

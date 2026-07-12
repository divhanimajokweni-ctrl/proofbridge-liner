// packages/trust-crypto/src/index.ts
// ───────────────────────────────────────────────────────────────
// Trust Crypto Package
// Core cryptographic primitives for ProofBridge-Liner
// ───────────────────────────────────────────────────────────────

// Hash utilities
export * from './hash';

// Merkle tree utilities
export * from './merkle';

// Receipt utilities
export * from './receipts';

// Export types explicitly to avoid duplicates and ensure they come from the correct source
export type {
  HashChain,
  HashChainLink,
} from './hash';

export type {
  MerkleNode,
  MerkleProof,
  MerkleProofStep,
  BatchMerkleProof,
} from './merkle';

export type {
  TrustReceipt,
  ReceiptType,
  ReceiptHeader,
  ReceiptPayload,
  ReceiptGeneratorConfig,
  ReceiptVerificationResult,
  ReceiptBatch,
} from './receipts';

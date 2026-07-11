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

// Re-export key types
export type {
  HashChain,
  HashChainLink,
  MerkleNode,
  MerkleProof,
  MerkleProofStep,
  BatchMerkleProof,
  ReceiptType,
  ReceiptHeader,
  ReceiptPayload,
  TrustReceipt,
  ReceiptGeneratorConfig,
  ReceiptVerificationResult,
  ReceiptBatch,
} from './hash';
export type {
  MerkleNode,
  MerkleProof,
  MerkleProofStep,
  BatchMerkleProof,
} from './merkle';
export type {
  ReceiptType,
  ReceiptHeader,
  ReceiptPayload,
  TrustReceipt,
  ReceiptGeneratorConfig,
  ReceiptVerificationResult,
  ReceiptBatch,
} from './receipts';

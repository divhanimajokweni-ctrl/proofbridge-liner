// src/lib/crypto/index.ts
// ───────────────────────────────────────────────────────────────
// Epistemic Runtime — Crypto Module Barrel Export
// ───────────────────────────────────────────────────────────────

// Hash utilities
export {
  sha256Hex,
  sha256Bytes,
  sha256,
  canonicalJson,
  hashObject,
  hashConcatenated,
  computeHashChainLink,
  verifyHashChain,
  hmacSha256Hex,
  verifyHmacSha256,
  createHashChain,
  appendToHashChain,
  canonicalHash,
  chainHash,
  domainHash,
  GENESIS_HASH,
} from './hash';

export type {
  HashChainLink,
  HashChain,
} from './hash';

// Merkle tree
export type {
  MerkleNode,
  MerkleProof,
  MerkleProofStep,
  BatchMerkleProof,
} from './merkle';

export {
  buildMerkleTree,
  getMerkleRoot,
  generateMerkleProof,
  verifyMerkleProof,
  buildMerkleTreeFromObjects,
  generateMerkleProofForObject,
  verifyObjectInMerkleTree,
  generateBatchMerkleProof,
  verifyBatchMerkleProof,
} from './merkle';

// Receipts
export type {
  ReceiptType,
  ReceiptHeader,
  ReceiptPayload,
  TrustReceipt,
  ReceiptProviders,
  ReceiptGeneratorConfig,
  ReceiptVerificationResult,
  ReceiptBatch,
} from './receipts';

export {
  createReceiptGenerator,
  verifyReceiptSignature,
  verifyReceipt,
  createReceiptBatch,
  verifyReceiptInBatch,
  serializeReceipt,
  deserializeReceipt,
  serializeReceiptBatch,
  deserializeReceiptBatch,
} from './receipts';

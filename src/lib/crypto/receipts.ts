// src/lib/crypto/receipts.ts
// ───────────────────────────────────────────────────────────────
// Epistemic Runtime — Trust Receipt Engine
// Generates and verifies cryptographic receipts for Trust Context events.
// Adapted from proofbridge-liner trust-crypto: uses kernel SHA-256
// and canonical JSON instead of node:crypto. Uses injected providers
// for timestamps and IDs instead of Date.now()/Math.random().
// ───────────────────────────────────────────────────────────────

import { canonicalJson, hmacSha256Hex, verifyHmacSha256, hashObject } from './hash';
import {
  type MerkleNode,
  buildMerkleTree,
  generateMerkleProof,
  verifyMerkleProof,
} from './merkle';
import type { ClockProvider, UuidProvider, EntropyProvider } from '@/lib/kernel/types';

// ───────────────────────────────────────────────────────────────
// Receipt Types
// ───────────────────────────────────────────────────────────────

export type ReceiptType =
  | 'configuration'
  | 'event_journal'
  | 'verification'
  | 'attestation'
  | 'kill_switch'
  | 'execution';

export interface ReceiptHeader {
  receiptId: string;
  receiptType: ReceiptType;
  contextId: string;
  eventId: string;
  /** Numeric timestamp from injected clock */
  timestamp: number;
  version: string;
}

export interface ReceiptPayload {
  status: 'approved' | 'rejected' | 'halted';
  reason?: string;
  hashChainAnchor: string;
  merkleProof: string[];
  latencyMs: number;
  metadata?: Record<string, unknown>;
}

export interface TrustReceipt {
  header: ReceiptHeader;
  payload: ReceiptPayload;
  signature: string;
}

// ───────────────────────────────────────────────────────────────
// Receipt Providers
// ───────────────────────────────────────────────────────────────

export interface ReceiptProviders {
  clock: ClockProvider;
  uuid: UuidProvider;
  entropy: EntropyProvider;
}

// ───────────────────────────────────────────────────────────────
// Receipt Generation
// ───────────────────────────────────────────────────────────────

/**
 * Receipt Generator Configuration
 */
export interface ReceiptGeneratorConfig {
  signingKey: string;
  issuer: string;
  version: string;
}

/**
 * Create receipt generator.
 * Uses injected providers for timestamps and IDs — no Date.now() or Math.random().
 */
export function createReceiptGenerator(config: ReceiptGeneratorConfig, providers: ReceiptProviders) {
  const { signingKey, issuer, version } = config;

  return {
    generate: (params: {
      contextId: string;
      eventId: string;
      receiptType: ReceiptType;
      status: 'approved' | 'rejected' | 'halted';
      reason?: string;
      hashChainAnchor: string;
      merkleProof: string[];
      latencyMs: number;
      metadata?: Record<string, unknown>;
    }): TrustReceipt => {
      const receiptId = generateReceiptId(providers);
      const timestamp = providers.clock.now();

      const header: ReceiptHeader = {
        receiptId,
        receiptType: params.receiptType,
        contextId: params.contextId,
        eventId: params.eventId,
        timestamp,
        version,
      };

      const payload: ReceiptPayload = {
        status: params.status,
        reason: params.reason,
        hashChainAnchor: params.hashChainAnchor,
        merkleProof: params.merkleProof,
        latencyMs: params.latencyMs,
        metadata: params.metadata,
      };

      // Sign the canonical representation using HMAC-SHA256
      const signature = signReceipt({ header, payload }, signingKey);

      return {
        header,
        payload,
        signature,
      };
    },

    verify: (receipt: TrustReceipt): boolean => {
      return verifyReceiptSignature(receipt, signingKey);
    },

    getSigningKey: () => signingKey,
    getIssuer: () => issuer,
    getVersion: () => version,
  };
}

/**
 * Generate unique receipt ID using injected providers.
 * No Date.now() or Math.random().
 */
function generateReceiptId(providers: ReceiptProviders): string {
  const uuid = providers.uuid.generate();
  return `rcpt_${uuid}`;
}

/**
 * Sign receipt using HMAC-SHA256.
 * Uses kernel-backed HMAC instead of node:crypto.
 */
function signReceipt(receipt: { header: ReceiptHeader; payload: ReceiptPayload }, secret: string): string {
  const canonical = canonicalJson(receipt);
  return hmacSha256Hex(secret, canonical);
}

/**
 * Verify receipt signature.
 * Uses timing-safe comparison via kernel-backed HMAC.
 */
export function verifyReceiptSignature(receipt: TrustReceipt, secret: string): boolean {
  const canonical = canonicalJson({
    header: receipt.header,
    payload: receipt.payload,
  });

  return verifyHmacSha256(secret, canonical, receipt.signature);
}

// ───────────────────────────────────────────────────────────────
// Receipt Verification
// ───────────────────────────────────────────────────────────────

export interface ReceiptVerificationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

export function verifyReceipt(
  receipt: TrustReceipt,
  options: {
    signingKey?: string;
    expectedContextId?: string;
    expectedEventId?: string;
    expectedType?: ReceiptType;
    maxAgeMs?: number;
    currentTimestamp?: number; // Injected clock value for age check
  } = {},
): ReceiptVerificationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Check required fields
  if (!receipt.header?.receiptId) {
    errors.push('Missing receipt header or receiptId');
  }

  if (!receipt.header?.contextId) {
    errors.push('Missing contextId in header');
  }

  if (!receipt.header?.eventId) {
    errors.push('Missing eventId in header');
  }

  if (!receipt.header?.timestamp) {
    errors.push('Missing timestamp in header');
  }

  if (!receipt.payload) {
    errors.push('Missing payload');
  }

  if (!receipt.signature) {
    errors.push('Missing signature');
  }

  // Check context ID
  if (options.expectedContextId && receipt.header.contextId !== options.expectedContextId) {
    errors.push(`Context ID mismatch: expected ${options.expectedContextId}, got ${receipt.header.contextId}`);
  }

  // Check event ID
  if (options.expectedEventId && receipt.header.eventId !== options.expectedEventId) {
    errors.push(`Event ID mismatch: expected ${options.expectedEventId}, got ${receipt.header.eventId}`);
  }

  // Check receipt type
  if (options.expectedType && receipt.header.receiptType !== options.expectedType) {
    errors.push(`Receipt type mismatch: expected ${options.expectedType}, got ${receipt.header.receiptType}`);
  }

  // Check age using injected timestamp
  if (options.maxAgeMs && receipt.header.timestamp && options.currentTimestamp !== undefined) {
    const age = options.currentTimestamp - receipt.header.timestamp;
    if (age > options.maxAgeMs) {
      errors.push(`Receipt too old: ${age}ms > ${options.maxAgeMs}ms`);
    }
  }

  // Verify signature if key provided
  if (options.signingKey && receipt.signature) {
    if (!verifyReceiptSignature(receipt, options.signingKey)) {
      errors.push('Invalid signature');
    }
  } else if (options.signingKey) {
    warnings.push('Cannot verify signature: no signature provided');
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

// ───────────────────────────────────────────────────────────────
// Receipt Batch Processing
// ───────────────────────────────────────────────────────────────

export interface ReceiptBatch {
  batchId: string;
  contextId: string;
  receipts: TrustReceipt[];
  merkleRoot: string;
  /** Numeric timestamp from injected clock */
  timestamp: number;
}

/**
 * Create a receipt batch with Merkle root.
 * Uses injected providers — no Date.now() or Math.random().
 */
export function createReceiptBatch(
  receipts: TrustReceipt[],
  contextId: string,
  providers: ReceiptProviders,
): ReceiptBatch {
  const batchId = `batch_${providers.uuid.generate()}`;
  const timestamp = providers.clock.now();

  // Build Merkle tree from receipt hashes
  const receiptHashes = receipts.map((r) => hashObject({
    header: r.header,
    payload: r.payload,
  }));

  const merkleTree = buildMerkleTree(receiptHashes);
  const merkleRoot = merkleTree.hash;

  return {
    batchId,
    contextId,
    receipts,
    merkleRoot,
    timestamp,
  };
}

export function verifyReceiptInBatch(
  receipt: TrustReceipt,
  batch: ReceiptBatch,
): boolean {
  const receiptHash = hashObject({
    header: receipt.header,
    payload: receipt.payload,
  });

  // Rebuild Merkle tree and verify
  const receiptHashes = batch.receipts.map((r) => hashObject({
    header: r.header,
    payload: r.payload,
  }));

  const merkleTree = buildMerkleTree(receiptHashes);
  const proof = generateMerkleProof(merkleTree, receiptHash);

  if (!proof) {
    return false;
  }

  return verifyMerkleProof(
    receiptHash,
    proof.leafIndex,
    proof.path,
    batch.merkleRoot,
  );
}

// ───────────────────────────────────────────────────────────────
// Receipt Serialization
// ───────────────────────────────────────────────────────────────

export function serializeReceipt(receipt: TrustReceipt): string {
  return JSON.stringify(receipt);
}

export function deserializeReceipt(serialized: string): TrustReceipt {
  return JSON.parse(serialized) as TrustReceipt;
}

export function serializeReceiptBatch(batch: ReceiptBatch): string {
  return JSON.stringify(batch);
}

export function deserializeReceiptBatch(serialized: string): ReceiptBatch {
  return JSON.parse(serialized) as ReceiptBatch;
}

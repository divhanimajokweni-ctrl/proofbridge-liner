// Epistemic Runtime v0.8 — SHA-256 Hash Engine
// Rule 6: Never use FNV, CRC, or ad-hoc hashing for identities. Only SHA-256.

import { sha256 } from '@noble/hashes/sha2.js';
import { bytesToHex } from '@noble/hashes/utils.js';

/**
 * Compute SHA-256 hash of input string.
 * Returns lowercase hex string.
 */
export function computeSHA256(input: string): string {
  const bytes = new TextEncoder().encode(input);
  const hash = sha256(bytes);
  return bytesToHex(hash);
}

/**
 * Compute SHA-256 hash of raw bytes.
 * Returns lowercase hex string.
 */
export function computeSHA256Bytes(input: Uint8Array): string {
  const hash = sha256(input);
  return bytesToHex(hash);
}

/**
 * Compute deterministic fact ID from canonical bytes.
 * This is THE identity function for facts.
 */
export function computeFactId(canonicalBytes: string): string {
  return computeSHA256(canonicalBytes);
}

/**
 * Verify that a hash matches the expected value.
 */
export function verifyHash(input: string, expectedHash: string): boolean {
  return computeSHA256(input) === expectedHash;
}

/**
 * Hash two values together (for Merkle tree node computation).
 * Deterministic: always hash in sorted order.
 */
export function hashPair(a: string, b: string): string {
  // Deterministic ordering: lexicographic sort
  const [first, second] = a < b ? [a, b] : [b, a];
  return computeSHA256(first + second);
}

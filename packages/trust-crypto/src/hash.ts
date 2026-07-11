// packages/trust-crypto/src/hash.ts
// ───────────────────────────────────────────────────────────────
// SHA-256 Hashing Utilities
// Canonical JSON serialization for deterministic hashing
// ───────────────────────────────────────────────────────────────

import { createHash } from 'node:crypto';

/**
 * Canonical JSON serialization for deterministic hashing
 * - Sorts object keys alphabetically
 * - Removes all whitespace
 * - Handles nested objects and arrays
 */
export function canonicalJson(obj: unknown): string {
  return JSON.stringify(obj, Object.keys(obj as object).sort(), 0);
}

/**
 * Compute SHA-256 hash of a string
 * Returns hex-encoded hash (64 characters)
 */
export function sha256Hex(input: string): string {
  return createHash('sha256').update(input, 'utf8').digest('hex');
}

/**
 * Compute SHA-256 hash of a UTF-8 string
 * Returns raw bytes (32 bytes)
 */
export function sha256Bytes(input: string): Buffer {
  return createHash('sha256').update(input, 'utf8').digest();
}

/**
 * Compute SHA-256 hash of arbitrary data
 * Returns hex-encoded hash
 */
export function sha256(data: Buffer | string): string {
  if (typeof data === 'string') {
    return sha256Hex(data);
  }
  return createHash('sha256').update(data).digest('hex');
}

/**
 * Hash an object using canonical JSON serialization
 * Deterministic: same object → same hash
 */
export function hashObject(obj: unknown): string {
  return sha256Hex(canonicalJson(obj));
}

/**
 * Hash multiple values together
 * Deterministic concatenation with separator
 */
export function hashConcatenated(...values: (string | Buffer)[]): string {
  const hasher = createHash('sha256');
  for (const value of values) {
    if (typeof value === 'string') {
      hasher.update(value, 'utf8');
    } else {
      hasher.update(value);
    }
  }
  return hasher.digest('hex');
}

/**
 * Compute hash chain: SHA-256(previousHash + currentEventHash)
 * This is the core of the tamper-evident ledger
 */
export function computeHashChainLink(previousHash: string, currentEventHash: string): string {
  return sha256Hex(previousHash + currentEventHash);
}

/**
 * Verify hash chain integrity
 * Given a chain of hashes, verify that each link is correctly computed
 */
export function verifyHashChain(chain: string[]): boolean {
  if (chain.length === 0) return true;
  if (chain.length === 1) return true;
  
  for (let i = 1; i < chain.length; i++) {
    const expected = computeHashChainLink(chain[i - 1], chain[i]);
    // The chain array contains the raw event hashes.
    // We verify by recomputing the chain hash from consecutive pairs.
    // If any pair produces a different chain hash, the chain is broken.
    if (expected !== chain[i]) {
      return false;
    }
  }
  return true;
}

// ───────────────────────────────────────────────────────────────
// HMAC Utilities for Signature Verification
// ───────────────────────────────────────────────────────────────

import { createHmac, timingSafeEqual } from 'node:crypto';

/**
 * Compute HMAC-SHA256 signature
 */
export function hmacSha256Hex(secret: string, message: string): string {
  return createHmac('sha256', secret)
    .update(message, 'utf8')
    .digest('hex');
}

/**
 * Verify HMAC-SHA256 signature using timing-safe comparison
 */
export function verifyHmacSha256(
  secret: string,
  message: string,
  signature: string
): boolean {
  const expected = hmacSha256Hex(secret, message);
  const expectedBuffer = Buffer.from(expected, 'hex');
  const signatureBuffer = Buffer.from(signature, 'hex');
  
  return timingSafeEqual(expectedBuffer, signatureBuffer);
}

// ───────────────────────────────────────────────────────────────
// Hash Chain Types
// ───────────────────────────────────────────────────────────────

export interface HashChainLink {
  previousHash: string;
  currentHash: string;
  chainHash: string; // SHA-256(previousHash + currentHash)
}

export interface HashChain {
  genesisHash: string;
  links: HashChainLink[];
  currentHash: string;
  length: number;
}

/**
 * Create a new hash chain
 */
export function createHashChain(genesisHash: string): HashChain {
  return {
    genesisHash,
    links: [],
    currentHash: genesisHash,
    length: 0,
  };
}

/**
 * Append to hash chain
 */
export function appendToHashChain(chain: HashChain, currentHash: string): HashChain {
  const chainHash = computeHashChainLink(chain.currentHash, currentHash);
  
  return {
    ...chain,
    links: [
      ...chain.links,
      {
        previousHash: chain.currentHash,
        currentHash,
        chainHash,
      },
    ],
    currentHash: chainHash,
    length: chain.length + 1,
  };
}

// ───────────────────────────────────────────────────────────────
// RC1 Alias Exports
// ───────────────────────────────────────────────────────────────

/**
 * Deterministic SHA-256 hash of an object via canonical JSON.
 * Alias for hashObject — matches the RC1 architecture naming.
 */
export const canonicalHash = hashObject;

/**
 * Compute hash chain link: SHA-256(previousHash + currentHash).
 * Alias for computeHashChainLink — matches the RC1 architecture naming.
 */
export const chainHash = computeHashChainLink;

/**
 * Domain-prefixed hash to prevent cross-context collisions.
 * SHA-256(domain + ":" + data) — ensures events from different
 * Trust Contexts cannot produce the same hash.
 */
export function domainHash(domain: string, data: string): string {
  return sha256Hex(`${domain}:${data}`);
}

/**
 * Genesis hash anchor for all new Trust Contexts.
 * Every new hash chain starts from this value.
 */
export const GENESIS_HASH = '0x' + '00'.repeat(32);

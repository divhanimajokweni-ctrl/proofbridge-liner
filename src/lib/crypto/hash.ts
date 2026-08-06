// @ts-nocheck
// src/lib/crypto/hash.ts
// ───────────────────────────────────────────────────────────────
// Epistemic Runtime — SHA-256 Hashing Utilities
// Canonical JSON serialization, HMAC, hash chains, domain hashing.
// Adapted from proofbridge-liner trust-crypto: uses kernel SHA-256
// and RFC 8785 canonicalization instead of node:crypto.
// No Date.now(), Math.random(), or crypto.randomUUID().
// ───────────────────────────────────────────────────────────────

import { computeSHA256, computeSHA256Bytes } from '@/lib/kernel/hashing';
import { canonicalize } from '@/lib/kernel/canonicalization';

// ───────────────────────────────────────────────────────────────
// Core Hash Functions
// ───────────────────────────────────────────────────────────────

/**
 * Compute SHA-256 hash of a string.
 * Returns hex-encoded hash (64 characters).
 * Alias for kernel's computeSHA256 — provided for API compatibility.
 */
export const sha256Hex = computeSHA256;

/**
 * Compute SHA-256 hash of a UTF-8 string.
 * Returns raw bytes as Uint8Array.
 */
export function sha256Bytes(input: string): Uint8Array {
  const encoded = new TextEncoder().encode(input);
  // computeSHA256Bytes returns hex, so we convert back to bytes
  const hex = computeSHA256Bytes(encoded);
  const bytes = new Uint8Array(32);
  for (let i = 0; i < 32; i++) {
    bytes[i] = parseInt(hex.substring(i * 2, i * 2 + 2), 16);
  }
  return bytes;
}

/**
 * Compute SHA-256 hash of arbitrary data (string or Uint8Array).
 * Returns hex-encoded hash.
 */
export function sha256(data: string | Uint8Array): string {
  if (typeof data === 'string') {
    return sha256Hex(data);
  }
  return computeSHA256Bytes(data);
}

// ───────────────────────────────────────────────────────────────
// Object Hashing
// ───────────────────────────────────────────────────────────────

/**
 * Canonical JSON serialization using RFC 8785 (JCS).
 * Replaces the ad-hoc canonicalJson from proofbridge-liner with
 * the kernel's RFC 8785 implementation.
 */
export const canonicalJson = canonicalize;

/**
 * Hash an object using canonical JSON serialization.
 * Deterministic: same object → same hash.
 */
export function hashObject(obj: unknown): string {
  return sha256Hex(canonicalize(obj));
}

/**
 * Hash multiple values together.
 * Deterministic concatenation with separator.
 */
export function hashConcatenated(...values: (string | Uint8Array)[]): string {
  const parts = values.map((v) => typeof v === 'string' ? v : Array.from(v).map((b) => b.toString(16).padStart(2, '0')).join(''));
  return computeSHA256(parts.join(''));
}

// ───────────────────────────────────────────────────────────────
// Hash Chain
// ───────────────────────────────────────────────────────────────

/**
 * Compute hash chain link: SHA-256(previousHash + currentEventHash).
 * This is the core of the tamper-evident ledger.
 */
export function computeHashChainLink(previousHash: string, currentEventHash: string): string {
  return sha256Hex(previousHash + currentEventHash);
}

/**
 * Verify hash chain integrity.
 * Given a chain of raw event hashes (including genesis), recompute the
 * rolling chain hash and optionally compare against an expected final value.
 *
 * chain[0] = genesis hash
 * chain[1..n] = raw event hashes in order
 *
 * The rolling hash is: h = chain[0]; h = sha256(h + chain[i]) for i = 1..n
 */
export function verifyHashChain(
  chain: string[],
  expectedChainHash?: string,
): boolean {
  if (chain.length === 0) return true;
  if (chain.length === 1) {
    return expectedChainHash === undefined || chain[0] === expectedChainHash;
  }

  let rollingHash = chain[0];
  for (let i = 1; i < chain.length; i++) {
    rollingHash = computeHashChainLink(rollingHash, chain[i]);
  }

  if (expectedChainHash !== undefined) {
    return rollingHash === expectedChainHash;
  }

  return true;
}

// ───────────────────────────────────────────────────────────────
// HMAC Utilities for Signature Verification
// ───────────────────────────────────────────────────────────────

/**
 * Compute HMAC-SHA256 signature.
 * Uses kernel's SHA-256 in an HMAC construction.
 * NOTE: This is a simplified HMAC implementation using the kernel's
 * SHA-256. For production, consider using a full HMAC from @noble/hashes.
 */
import { hmac } from '@noble/hashes/hmac.js';
import { sha256 as nobleSha256 } from '@noble/hashes/sha2.js';
import { bytesToHex } from '@noble/hashes/utils.js';

/**
 * Compute HMAC-SHA256 signature and return hex-encoded result.
 */
export function hmacSha256Hex(secret: string, message: string): string {
  const key = new TextEncoder().encode(secret);
  const msg = new TextEncoder().encode(message);
  const result = hmac(nobleSha256, key, msg);
  return bytesToHex(result);
}

/**
 * Verify HMAC-SHA256 signature using timing-safe comparison.
 */
export function verifyHmacSha256(
  secret: string,
  message: string,
  signature: string,
): boolean {
  const expected = hmacSha256Hex(secret, message);
  // Constant-time comparison
  if (expected.length !== signature.length) return false;
  let result = 0;
  for (let i = 0; i < expected.length; i++) {
    result |= expected.charCodeAt(i) ^ signature.charCodeAt(i);
  }
  return result === 0;
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
 * Create a new hash chain.
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
 * Append to hash chain.
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

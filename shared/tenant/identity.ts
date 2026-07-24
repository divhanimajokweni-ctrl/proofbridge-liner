/**
 * @license
 * VVU EARTH TECH - AIR Kernel
 * Copyright (c) 2026 Venture Vision Ubuntu
 *
 * LICENSE: Apache-2.0 (Open Source) OR Commercial (Enterprise)
 * See LICENSE and COMMERCIAL_LICENSE.md for details.
 *
 * This file is part of the VVU EARTH TECH horizontal infrastructure.
 * It contains no product-specific logic (Golden Rule).
 */

// ============================================================================
// VVU EARTH TECH — Tenant Identity (Shared)
// ============================================================================
//
// Decision 5 (Master Implementation Blueprint): Tenant Isolation.
//
// Tenant identity derivation provides deterministic, collision-resistant
// namespace generation from tenant public keys. This ensures:
//
//   1. Globally unique namespaces: SHA-256(tenant_public_key)
//   2. Cryptographically verifiable: namespace can be verified against
//      the public key at any time
//   3. Deterministic: same public key → same namespace, always
//   4. Replay-safe: no side effects, no randomness
//
// Tenant isolation guarantees:
//   - Facts from different tenants are namespace-separated
//   - DPI proxy verifies namespace matches on all signed packets (HF-007)
//   - Cross-tenant evidence requires explicit federation configuration
// ============================================================================

import { computeSHA256 } from '../../src/lib/kernel/hashing';

// ---------------------------------------------------------------------------
// §1 — Tenant Identity Interface
// ---------------------------------------------------------------------------

/**
 * TenantIdentity — the full identity record for a tenant.
 *
 * Contains:
 *   - namespace: SHA-256 of tenant public key (globally unique)
 *   - publicKey: Ed25519 public key (hex-encoded, 64 characters)
 *   - verifiedAt: Timestamp when identity was verified (from injected clock)
 *
 * The namespace is the primary isolation boundary. All facts, evidence,
 * and projections are namespace-scoped.
 */
export interface TenantIdentity {
  /** Deterministic namespace: SHA-256(tenant_public_key) */
  namespace: string;
  /** Ed25519 public key (hex-encoded) */
  publicKey: string;
  /** Timestamp when identity was verified (from injected clock) */
  verifiedAt: number;
}

// ---------------------------------------------------------------------------
// §2 — Namespace Derivation
// ---------------------------------------------------------------------------

/**
 * Derive a deterministic, collision-resistant namespace from tenant public key.
 *
 * namespace = SHA-256(tenant_public_key)
 *
 * This guarantees globally unique, cryptographically verifiable namespaces.
 * The namespace is used as the primary isolation boundary for all tenant
 * data: facts, evidence, projections, and policy rules.
 *
 * Properties:
 *   - Deterministic: same public key → same namespace, always
 *   - Collision-resistant: SHA-256 provides 128-bit collision resistance
 *   - Verifiable: anyone can verify namespace = SHA-256(publicKey)
 *   - Replay-safe: pure function, no side effects
 *
 * @param tenantPublicKey - Ed25519 public key (hex-encoded)
 * @returns SHA-256 namespace (64-character hex string)
 */
export function deriveNamespace(tenantPublicKey: string): string {
  return computeSHA256(tenantPublicKey);
}

// ---------------------------------------------------------------------------
// §3 — Identity Verification
// ---------------------------------------------------------------------------

/**
 * Verify that a namespace matches the expected derivation from a public key.
 *
 * Used by the DPI proxy (safe-liner-basic) to verify that signed evidence
 * packets belong to the claimed namespace. If namespace doesn't match,
 * the proxy emits FailureFact with HF-007.
 *
 * Deterministic: same namespace + publicKey → same result, always.
 *
 * @param namespace - Claimed namespace
 * @param tenantPublicKey - Public key to derive expected namespace from
 * @returns Whether the namespace matches the derivation
 */
export function verifyNamespace(namespace: string, tenantPublicKey: string): boolean {
  const expectedNamespace = deriveNamespace(tenantPublicKey);
  return namespace === expectedNamespace;
}

// ---------------------------------------------------------------------------
// §4 — Identity Derivation (Full Record)
// ---------------------------------------------------------------------------

/**
 * Derive a full TenantIdentity from a public key and verification timestamp.
 *
 * This creates the complete identity record including:
 *   - namespace (SHA-256 of public key)
 *   - publicKey (as provided)
 *   - verifiedAt (timestamp from injected clock)
 *
 * @param tenantPublicKey - Ed25519 public key (hex-encoded)
 * @param verifiedAt - Timestamp from injected clock (NOT Date.now())
 * @returns Complete TenantIdentity record
 */
export function deriveIdentity(tenantPublicKey: string, verifiedAt: number): TenantIdentity {
  return {
    namespace: deriveNamespace(tenantPublicKey),
    publicKey: tenantPublicKey,
    verifiedAt,
  };
}

// ---------------------------------------------------------------------------
// §5 — Signed Evidence Packet Interface
// ---------------------------------------------------------------------------

/**
 * SignedEvidencePacket — the container for tenant-scoped, signed evidence.
 *
 * This is the format that the DPI proxy (safe-liner-basic) inspects.
 * The packet includes:
 *   - payload: The evidence content (opaque to the DPI proxy)
 *   - namespace: Tenant namespace for isolation verification
 *   - publicKey: Signer's public key for signature verification
 *   - signature: Ed25519 signature over canonical payload
 *   - timestamp: Numeric timestamp from injected clock
 *
 * DPI proxy verification steps:
 *   1. Verify namespace matches deriveNamespace(publicKey) → HF-007 if mismatch
 *   2. Verify Ed25519 signature of payload → HF-007 if invalid
 *   3. Check timestamp freshness (optional, policy-dependent)
 */
export interface SignedEvidencePacket {
  /** Evidence payload (canonical bytes for signature verification) */
  payload: string;
  /** Tenant namespace (must match SHA-256 of publicKey) */
  namespace: string;
  /** Ed25519 public key of the signer (hex-encoded) */
  publicKey: string;
  /** Ed25519 signature over canonical payload (hex-encoded) */
  signature: string;
  /** Numeric timestamp from injected clock */
  timestamp: number;
}

// ---------------------------------------------------------------------------
// §6 — FailureFact Interface
// ---------------------------------------------------------------------------

/**
 * FailureFact — emitted by DPI proxy when violations are detected.
 *
 * Each FailureFact records the specific violation (HF-007 for namespace
 * or signature mismatch), the claimed namespace, and the expected namespace.
 */
export interface FailureFact {
  /** Hard failure code (HF-007 for tenant boundary violation) */
  failureCode: string;
  /** Type of violation detected */
  violationType: 'namespace_mismatch' | 'signature_invalid' | 'timestamp_invalid';
  /** Namespace claimed in the evidence packet */
  claimedNamespace: string;
  /** Namespace derived from the provided public key */
  expectedNamespace: string;
  /** Public key from the evidence packet */
  publicKey: string;
  /** Timestamp from the evidence packet */
  packetTimestamp: number;
  /** Timestamp when this FailureFact was created */
  detectedAt: number;
  /** Deterministic fact ID: SHA-256 of canonical FailureFact */
  id: string;
}

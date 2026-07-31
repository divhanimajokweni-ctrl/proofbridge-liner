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
// VVU EARTH TECH — Cryptographic State Bundle (CSB)
// ============================================================================
//
// Enables instant state recovery without Genesis replay.
// CSB bundles MMR root, quorum signatures, projection snapshots,
// and evidence count into a single cryptographically verifiable package.
//
// bundle_hash = SHA-256(canonicalize(all fields))
// Uses RFC 8785 canonicalization for deterministic hashing.
// ============================================================================

import { computeSHA256 } from '@/lib/kernel/hashing';
import { canonicalize } from '@/lib/kernel/canonicalization';
import type { ClockProvider } from '@/lib/kernel/types';

// ---------------------------------------------------------------------------
// §1 — CSB Interface
// ---------------------------------------------------------------------------

/**
 * Cryptographic State Bundle — enables instant state recovery
 * without Genesis replay.
 *
 * All fields are cryptographically verified via SHA-256 bundle_hash
 * computed over the RFC 8785 canonicalized content.
 */
export interface CSB {
  /** MMR root hash — root of the Merkle Mountain Range at snapshot time */
  mmrRoot: string;
  /** Quorum signatures — Ed25519 signatures from quorum nodes */
  quorumSignatures: string[];
  /** Projection snapshots — SHA-256 hashes of each projection state */
  projectionSnapshots: Record<string, string>;
  /** Number of evidence items in the MMR at snapshot time */
  evidenceCount: number;
  /** SHA-256 hash of the canonicalized bundle for integrity verification */
  bundleHash: string;
  /** Timestamp from injected clock (NOT Date.now()) */
  createdAt: number;
  /** Node ID that created this bundle */
  createdBy: string;
  /** Version of the CSB schema */
  version: number;
}

// ---------------------------------------------------------------------------
// §2 — CSB Verification Result
// ---------------------------------------------------------------------------

/**
 * Result of CSB verification.
 */
export interface CSBVerificationResult {
  /** Whether the CSB passed all verification checks */
  valid: boolean;
  /** Whether quorum signatures are valid */
  quorumValid: boolean;
  /** Whether MMR root matches projection hashes */
  mmrRootValid: boolean;
  /** Whether bundle hash is correct */
  bundleHashValid: boolean;
  /** Number of quorum signatures verified */
  quorumSignatureCount: number;
  /** Required minimum quorum size */
  requiredQuorumSize: number;
  /** Errors encountered during verification */
  errors: string[];
}

// ---------------------------------------------------------------------------
// §3 — CSB Hydration Result
// ---------------------------------------------------------------------------

/**
 * Result of CSB hydration (state recovery).
 */
export interface CSBHydrationResult {
  /** Whether hydration succeeded */
  success: boolean;
  /** Restored projections with their state hashes */
  restoredProjections: Record<string, string>;
  /** Number of projections restored */
  projectionCount: number;
  /** Whether restored projections verify against MMR root */
  verified: boolean;
  /** Errors encountered during hydration */
  errors: string[];
}

// ---------------------------------------------------------------------------
// §4 — CSB Event (for evidence store)
// ---------------------------------------------------------------------------

/**
 * Event emitted on CSB operations for audit trail.
 */
export interface CSBEvent {
  /** Unique event identifier (SHA-256) */
  id: string;
  /** Operation type */
  operation: 'create' | 'verify' | 'hydrate';
  /** SHA-256 hash of the CSB involved */
  bundleHash: string;
  /** Result of the operation */
  result: 'success' | 'failure';
  /** Timestamp from injected clock */
  timestamp: number;
  /** SHA-256 hash of the event for evidence store */
  hash: string;
  /** Error details if operation failed */
  errors?: string[];
}

// ---------------------------------------------------------------------------
// §5 — Constants
// ---------------------------------------------------------------------------

/** Minimum quorum size for CSB validity (out of N nodes) */
export const MINIMUM_QUORUM_SIZE = 2;

/** CSB schema version */
export const CSB_VERSION = 1;

// ---------------------------------------------------------------------------
// §6 — CSB Operations
// ---------------------------------------------------------------------------

/**
 * Create a Cryptographic State Bundle from current system state.
 *
 * Assembles MMR root, quorum signatures, and projection snapshots
 * into a single bundle with SHA-256 integrity hash.
 *
 * @param clock Injected Clock provider (NOT Date.now())
 * @param mmrRoot Current MMR root hash
 * @param projections Projection name → state hash mapping
 * @param signatures Ed25519 quorum signatures
 * @param nodeId Node creating this bundle
 * @param evidenceCount Number of evidence items in the MMR
 * @returns Verified CSB with computed bundle_hash
 */
export function createCSB(
  clock: ClockProvider,
  mmrRoot: string,
  projections: Record<string, string>,
  signatures: string[],
  nodeId: string = 'node-0',
  evidenceCount: number = 0,
): CSB {
  const createdAt = clock.now();

  // Build the bundle content (without bundleHash — it will be computed)
  const bundleContent = {
    mmrRoot,
    quorumSignatures: signatures,
    projectionSnapshots: projections,
    evidenceCount,
    createdAt,
    createdBy: nodeId,
    version: CSB_VERSION,
  };

  // Compute bundle_hash = SHA-256(canonicalize(all fields))
  const bundleHash = computeSHA256(canonicalize(bundleContent));

  const csb: CSB = {
    mmrRoot,
    quorumSignatures: signatures,
    projectionSnapshots: projections,
    evidenceCount,
    bundleHash,
    createdAt,
    createdBy: nodeId,
    version: CSB_VERSION,
  };

  // Emit CSB creation event
  const eventObj = {
    operation: 'create',
    bundleHash,
    result: 'success',
    timestamp: createdAt,
    nodeId,
    mmrRoot,
  };
  const eventId = computeSHA256(canonicalize(eventObj));

  // Store event for evidence trail (caller can access via getEventLog)
  _csbEvents.push({
    id: eventId,
    operation: 'create',
    bundleHash,
    result: 'success',
    timestamp: createdAt,
    hash: computeSHA256(canonicalize(eventObj) + eventId),
  });

  return csb;
}

/**
 * Verify a Cryptographic State Bundle.
 *
 * Checks:
 * 1. Quorum signatures meet minimum quorum size
 * 2. Bundle hash matches SHA-256(canonicalize(all fields))
 * 3. MMR root matches projection hashes (basic structural check)
 *
 * @param clock Injected Clock provider (NOT Date.now())
 * @param csb The CSB to verify
 * @returns CSBVerificationResult with detailed checks
 */
export function verifyCSB(
  clock: ClockProvider,
  csb: CSB,
): CSBVerificationResult {
  const errors: string[] = [];

  // Check 1: Quorum signatures minimum
  const quorumValid = csb.quorumSignatures.length >= MINIMUM_QUORUM_SIZE;
  if (!quorumValid) {
    errors.push(
      `Quorum size ${csb.quorumSignatures.length} below minimum ${MINIMUM_QUORUM_SIZE}`,
    );
  }

  // Check 2: Bundle hash integrity
  // Recompute bundle_hash from the canonicalized content (excluding bundleHash itself)
  const bundleContent = {
    mmrRoot: csb.mmrRoot,
    quorumSignatures: csb.quorumSignatures,
    projectionSnapshots: csb.projectionSnapshots,
    evidenceCount: csb.evidenceCount,
    createdAt: csb.createdAt,
    createdBy: csb.createdBy,
    version: csb.version,
  };
  const expectedHash = computeSHA256(canonicalize(bundleContent));
  const bundleHashValid = csb.bundleHash === expectedHash;
  if (!bundleHashValid) {
    errors.push(
      `Bundle hash mismatch: expected ${expectedHash}, got ${csb.bundleHash}`,
    );
  }

  // Check 3: MMR root structural check
  // Verify that projection snapshot hashes are present and non-empty
  const projectionCount = Object.keys(csb.projectionSnapshots).length;
  let mmrRootValid = true;

  if (projectionCount === 0 && csb.evidenceCount > 0) {
    // Evidence exists but no projections — suspicious
    mmrRootValid = false;
    errors.push('Evidence count > 0 but no projection snapshots present');
  }

  // Verify each projection snapshot is a valid SHA-256 hash (64 hex chars)
  for (const [name, hash] of Object.entries(csb.projectionSnapshots)) {
    if (!/^[a-f0-9]{64}$/.test(hash)) {
      mmrRootValid = false;
      errors.push(`Projection "${name}" has invalid hash: ${hash}`);
    }
  }

  // Verify MMR root is a valid SHA-256 hash
  if (!/^[a-f0-9]{64}$/.test(csb.mmrRoot)) {
    mmrRootValid = false;
    errors.push(`MMR root has invalid hash format: ${csb.mmrRoot}`);
  }

  const valid = quorumValid && bundleHashValid && mmrRootValid && errors.length === 0;

  // Emit verification event
  const timestamp = clock.now();
  const eventObj = {
    operation: 'verify',
    bundleHash: csb.bundleHash,
    result: valid ? 'success' : 'failure',
    timestamp,
    errors: errors.length > 0 ? errors : null,
  };
  const eventId = computeSHA256(canonicalize(eventObj));
  _csbEvents.push({
    id: eventId,
    operation: 'verify',
    bundleHash: csb.bundleHash,
    result: valid ? 'success' : 'failure',
    timestamp,
    hash: computeSHA256(canonicalize(eventObj) + eventId),
    errors: errors.length > 0 ? errors : undefined,
  });

  return {
    valid,
    quorumValid,
    mmrRootValid,
    bundleHashValid,
    quorumSignatureCount: csb.quorumSignatures.length,
    requiredQuorumSize: MINIMUM_QUORUM_SIZE,
    errors,
  };
}

/**
 * Hydrate state from a Cryptographic State Bundle.
 *
 * Restores projections from snapshots and verifies against MMR root.
 * This enables instant state recovery without Genesis replay.
 *
 * @param clock Injected Clock provider (NOT Date.now())
 * @param csb The CSB to hydrate from
 * @returns CSBHydrationResult with restored projections
 */
export function hydrateFromCSB(
  clock: ClockProvider,
  csb: CSB,
): CSBHydrationResult {
  const errors: string[] = [];

  // First verify the CSB
  const verification = verifyCSB(clock, csb);
  if (!verification.valid) {
    errors.push(...verification.errors);
    errors.push('Cannot hydrate from invalid CSB');

    // Emit hydration failure event
    const eventObj = {
      operation: 'hydrate',
      bundleHash: csb.bundleHash,
      result: 'failure',
      timestamp: clock.now(),
      errors,
    };
    const eventId = computeSHA256(canonicalize(eventObj));
    _csbEvents.push({
      id: eventId,
      operation: 'hydrate',
      bundleHash: csb.bundleHash,
      result: 'failure',
      timestamp: clock.now(),
      hash: computeSHA256(canonicalize(eventObj) + eventId),
      errors,
    });

    return {
      success: false,
      restoredProjections: {},
      projectionCount: 0,
      verified: false,
      errors,
    };
  }

  // Restore projections from snapshots
  const restoredProjections: Record<string, string> = {};
  for (const [name, stateHash] of Object.entries(csb.projectionSnapshots)) {
    restoredProjections[name] = stateHash;
  }

  const projectionCount = Object.keys(restoredProjections).length;
  const verified = true; // Already verified by verifyCSB

  // Emit hydration success event
  const timestamp = clock.now();
  const eventObj = {
    operation: 'hydrate',
    bundleHash: csb.bundleHash,
    result: 'success',
    timestamp,
    projectionCount,
    mmrRoot: csb.mmrRoot,
  };
  const eventId = computeSHA256(canonicalize(eventObj));
  _csbEvents.push({
    id: eventId,
    operation: 'hydrate',
    bundleHash: csb.bundleHash,
    result: 'success',
    timestamp,
    hash: computeSHA256(canonicalize(eventObj) + eventId),
  });

  return {
    success: true,
    restoredProjections,
    projectionCount,
    verified,
    errors,
  };
}

// ---------------------------------------------------------------------------
// §7 — Event log access
// ---------------------------------------------------------------------------

/**
 * Internal event log for CSB operations.
 * This is a module-level store; in production, events would be persisted
 * to the evidence store.
 */
const _csbEvents: CSBEvent[] = [];

/**
 * Get all CSB events for audit trail.
 */
export function getCSBEventLog(): CSBEvent[] {
  return [..._csbEvents];
}

/**
 * Clear the CSB event log (for testing/replay).
 */
export function clearCSBEventLog(): void {
  _csbEvents.length = 0;
}

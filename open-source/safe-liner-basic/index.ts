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
// VVU EARTH TECH — Safe Liner Basic (Open Source, Apache 2.0)
// ============================================================================
//
// Decision 5 (Master Implementation Blueprint): DPI Proxy.
//
// Safe Liner Basic: DPI (Data Protection Infrastructure) Proxy.
//
// The DPI proxy provides tenant-isolation verification for all signed
// evidence packets flowing through the Epistemic Runtime. It enforces:
//
//   1. Namespace verification: deriveNamespace(publicKey) must match
//      the claimed namespace in the packet → HF-007 if mismatch
//   2. Ed25519 signature verification: signature must be valid over
//      the canonical payload bytes → HF-007 if invalid
//   3. FailureFact emission: all violations produce FailureFact records
//      with HF-007 code for downstream processing
//
// All operations are deterministic and replay-safe:
//   - No Date.now(), Math.random(), or non-deterministic APIs
//   - Signature verification is synchronous via @noble/curves
//   - Namespace derivation is deterministic via SHA-256
// ============================================================================

import {
  deriveNamespace,
  verifyNamespace,
  SignedEvidencePacket,
  FailureFact,
} from '../../shared/tenant/identity';
import { computeSHA256 } from '../../src/lib/kernel/hashing';
import { canonicalize } from '../../src/lib/kernel/canonicalization';
import { HARD_FAILURE_CODES } from '../../shared/license/license-schema';
import { ed25519 } from '@noble/curves/ed25519.js';

// ---------------------------------------------------------------------------
// §1 — DPI Proxy Module
// ---------------------------------------------------------------------------

/**
 * SafeLinerBasic — the DPI (Data Protection Infrastructure) Proxy module.
 *
 * Provides tenant-isolation verification for all signed evidence packets.
 * The proxy inspects each packet and verifies:
 *   - Namespace matches deriveNamespace(publicKey)
 *   - Ed25519 signature is valid over canonical payload
 *
 * On violation, emits FailureFact with HF-007 code.
 */
export const SafeLinerBasic = {
  name: 'safe-liner-basic',
  version: '1.0.0',
  status: 'IMPLEMENTED',
};

// ---------------------------------------------------------------------------
// §2 — DPI Inspection Result
// ---------------------------------------------------------------------------

/**
 * DPIInspectionResult — result of packet inspection.
 *
 * Contains:
 *   - Whether the packet passed all checks
 *   - Any FailureFacts emitted during inspection
 *   - The verified namespace (if namespace check passed)
 *   - Detailed check results for audit logging
 */
export interface DPIInspectionResult {
  /** Whether the packet passed all DPI checks */
  passed: boolean;
  /** FailureFacts emitted for any violations */
  failureFacts: FailureFact[];
  /** Verified namespace (null if namespace check failed) */
  verifiedNamespace: string | null;
  /** Detailed check results */
  checks: {
    namespaceValid: boolean;
    signatureValid: boolean;
    namespaceMatch: boolean;
  };
  /** Timestamp of inspection (from injected clock) */
  inspectedAt: number;
}

// ---------------------------------------------------------------------------
// §3 — Packet Inspection
// ---------------------------------------------------------------------------

/**
 * Inspect a SignedEvidencePacket through the DPI proxy.
 *
 * Verification steps:
 *   1. Derive true namespace from the provided public key using deriveNamespace()
 *   2. Verify namespace matches the claimed namespace → HF-007 if mismatch
 *   3. Verify Ed25519 signature of the payload → HF-007 if invalid
 *   4. Emit FailureFact for any violations
 *
 * Deterministic: same packet → same result, always. No side effects.
 * Replay-safe: uses injected timestamp, no Date.now() or randomness.
 *
 * @param packet - SignedEvidencePacket to inspect
 * @param injectedTimestamp - Timestamp from injected clock (NOT Date.now())
 * @param verificationPublicKey - Optional override public key for signature
 *   verification. If not provided, uses packet.publicKey.
 * @returns DPIInspectionResult with check results and any FailureFacts
 */
export function inspectPacket(
  packet: SignedEvidencePacket,
  injectedTimestamp: number,
  verificationPublicKey?: string,
): DPIInspectionResult {
  const failureFacts: FailureFact[] = [];
  const checks = {
    namespaceValid: true,
    signatureValid: true,
    namespaceMatch: true,
  };

  // Step 1: Derive true namespace from the provided public key
  const derivedNamespace = deriveNamespace(packet.publicKey);

  // Step 2: Verify namespace matches the claimed namespace
  checks.namespaceMatch = packet.namespace === derivedNamespace;
  checks.namespaceValid = verifyNamespace(packet.namespace, packet.publicKey);

  if (!checks.namespaceMatch || !checks.namespaceValid) {
    // Namespace mismatch → HF-007 (Tenant Boundary Violation)
    const failureFact: FailureFact = {
      failureCode: HARD_FAILURE_CODES.HF_007,
      violationType: 'namespace_mismatch',
      claimedNamespace: packet.namespace,
      expectedNamespace: derivedNamespace,
      publicKey: packet.publicKey,
      packetTimestamp: packet.timestamp,
      detectedAt: injectedTimestamp,
      id: computeSHA256(canonicalize({
        failureCode: HARD_FAILURE_CODES.HF_007,
        violationType: 'namespace_mismatch',
        claimedNamespace: packet.namespace,
        expectedNamespace: derivedNamespace,
        publicKey: packet.publicKey,
        packetTimestamp: packet.timestamp,
        detectedAt: injectedTimestamp,
      })),
    };
    failureFacts.push(failureFact);
  }

  // Step 3: Verify Ed25519 signature of the payload
  const signerPublicKey = verificationPublicKey ?? packet.publicKey;

  try {
    // Use ed25519.verify from @noble/curves for signature verification.
    // This is the same library used by Ed25519SignerModule, imported directly
    // to avoid needing a private key for instantiation (we only verify).
    const messageBytes = new TextEncoder().encode(packet.payload);
    const signatureBytes = hexToBytes(packet.signature);
    const publicKeyBytes = hexToBytes(signerPublicKey);

    checks.signatureValid = ed25519.verify(signatureBytes, messageBytes, publicKeyBytes);
  } catch {
    checks.signatureValid = false;
  }

  if (!checks.signatureValid) {
    // Signature invalid → HF-007 (Tenant Boundary Violation)
    const failureFact: FailureFact = {
      failureCode: HARD_FAILURE_CODES.HF_007,
      violationType: 'signature_invalid',
      claimedNamespace: packet.namespace,
      expectedNamespace: derivedNamespace,
      publicKey: packet.publicKey,
      packetTimestamp: packet.timestamp,
      detectedAt: injectedTimestamp,
      id: computeSHA256(canonicalize({
        failureCode: HARD_FAILURE_CODES.HF_007,
        violationType: 'signature_invalid',
        claimedNamespace: packet.namespace,
        expectedNamespace: derivedNamespace,
        publicKey: packet.publicKey,
        packetTimestamp: packet.timestamp,
        detectedAt: injectedTimestamp,
      })),
    };
    failureFacts.push(failureFact);
  }

  // Determine overall pass/fail
  const passed = checks.namespaceValid && checks.signatureValid && checks.namespaceMatch;
  const verifiedNamespace = passed ? derivedNamespace : null;

  return {
    passed,
    failureFacts,
    verifiedNamespace,
    checks,
    inspectedAt: injectedTimestamp,
  };
}

// ---------------------------------------------------------------------------
// §4 — DPI Proxy Factory
// ---------------------------------------------------------------------------

/**
 * Create a configured DPI proxy instance.
 * Returns the proxy functions for use in the evidence compilation pipeline.
 */
export function createDPIProxy() {
  return {
    inspectPacket,
    name: SafeLinerBasic.name,
    version: SafeLinerBasic.version,
  };
}

// ---------------------------------------------------------------------------
// §5 — Utility: Hex to Bytes
// ---------------------------------------------------------------------------

/**
 * Convert hex string to Uint8Array.
 * Used for Ed25519 signature and public key byte conversion.
 */
function hexToBytes(hex: string): Uint8Array {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.slice(i, i + 2), 16);
  }
  return bytes;
}

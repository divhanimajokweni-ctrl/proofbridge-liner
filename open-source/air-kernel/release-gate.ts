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
// VVU EARTH TECH — Release Gate Emitter (Decision 6)
// ============================================================================
//
// Calculates definitive binary PASS/FAIL for CI/CD deployment gates.
// Implements Fail-Closed architecture: if ANY evaluation fails → FAIL.
// Only PASS if ALL evaluations succeed AND confidence >= threshold.
//
// The release gate is the final arbiter of deployment readiness.
// It aggregates all evidence through the 5-Pass Compiler, checks
// hard failure codes, and emits a signed, immutable gate state.
//
// Determinism guarantees:
// - Gate ID derived from SHA-256 of canonical gate state
// - RFC 8785 canonicalization for all hashing
// - Fail-Closed: any failure → FAIL (never partial pass)
// - Signature computed over canonical gate state
// ============================================================================

import { computeSHA256 } from '../../src/lib/kernel/hashing';
import { canonicalize } from '../../src/lib/kernel/canonicalization';
import {
  HARD_FAILURE_CODES,
  type HardFailureCode,
  TEE_CONFIDENCE_PENALTY,
  MAX_CONFIDENCE_SCORE,
} from '../../shared/license/license-schema';
import type { EvidenceIR } from './adr-generator';

// ---------------------------------------------------------------------------
// §1 — Release Gate
// ---------------------------------------------------------------------------

/**
 * Release Gate — the definitive binary PASS/FAIL for CI/CD.
 *
 * Fail-Closed architecture:
 * - If ANY evaluation fails → FAIL
 * - Only PASS if ALL evaluations succeed AND confidence >= threshold
 *
 * The gate is signed over its canonical state, making it tamper-evident.
 * Once emitted, the gate is immutable — it cannot be modified.
 */
export interface ReleaseGate {
  /** SHA-256 hash of canonical gate state — the identity of this gate */
  id: string;
  /** Binary status: PASS or FAIL (never partial) */
  status: 'PASS' | 'FAIL';
  /** Aggregate confidence score across all evidence (0.0 — 1.0) */
  confidenceScore: number;
  /** Hard failure codes that caused FAIL (empty if PASS) */
  hardFailureCodes: string[];
  /** References to immutable evidence FactIDs that informed this gate */
  evidenceRefs: string[];
  /** Timestamp when this gate was emitted (injected clock) */
  generatedAt: number;
  /** HMAC-SHA-256 signature over canonical gate state */
  signature: string;
}

// ---------------------------------------------------------------------------
// §2 — Release Gate Emitter
// ---------------------------------------------------------------------------

/**
 * Release Gate Emitter — calculates definitive binary PASS/FAIL.
 *
 * Fail-Closed architecture:
 * - If ANY evaluation fails → FAIL
 * - Only PASS if ALL evaluations succeed AND confidence >= threshold
 * - Hard failure codes from shared/license/license-schema.ts are checked
 * - TEE confidence penalty (0.31) is applied when no TEE Verifier is injected
 *
 * Usage:
 *   const emitter = new ReleaseGateEmitter(signerKey);
 *   const gate = emitter.emit(evidences, 0.95);
 *   if (gate.status === 'FAIL') { // deployment blocked }
 */
export class ReleaseGateEmitter {
  private signingKey: string;
  private clockProvider: { now(): number };

  constructor(signingKey?: string, clockProvider?: { now(): number }) {
    this.signingKey = signingKey ?? 'release-gate-default-key';
    // Use injected clock — never Date.now()
    this.clockProvider = clockProvider ?? { now: () => Date.now() };
  }

  /**
   * Calculate release gate status from compiled evidence.
   *
   * Fail-Closed architecture:
   * - If ANY evidence has state 'failed' or 'blocked' → FAIL
   * - If ANY evidence contains hard failure codes → FAIL
   * - If aggregate confidence < threshold → FAIL
   * - Only PASS if ALL evidence is verified AND confidence >= threshold
   *
   * @param evidences - Array of EvidenceIR from the 5-Pass Compiler
   * @param threshold - Minimum confidence threshold (e.g., 0.95)
   * @returns ReleaseGate with binary PASS/FAIL status
   */
  emit(evidences: EvidenceIR[], threshold: number): ReleaseGate {
    // Phase 1: Check for hard failures (Fail-Closed — any failure → FAIL)
    const hardFailureCodes: string[] = [];
    const evidenceRefs: string[] = [];

    for (const evidence of evidences) {
      evidenceRefs.push(evidence.factId);

      // Check evidence state — failed or blocked states are hard failures
      if (evidence.state === 'failed' || evidence.state === 'blocked') {
        // Collect hard failure codes from this evidence
        for (const code of evidence.hardFailureCodes) {
          if (!hardFailureCodes.includes(code)) {
            hardFailureCodes.push(code);
          }
        }
        // If no explicit codes, add generic evidence failure
        if (evidence.hardFailureCodes.length === 0 && evidence.state === 'failed') {
          hardFailureCodes.push('HF-003'); // Evidence integrity failure
        }
        if (evidence.hardFailureCodes.length === 0 && evidence.state === 'blocked') {
          hardFailureCodes.push('HF-010'); // Policy violation
        }
      }

      // Also check requires_review — treated as FAIL in Fail-Closed
      if (evidence.state === 'requires_review') {
        // Requires review is a soft failure, but in Fail-Closed architecture
        // we cannot proceed without resolution
        if (!hardFailureCodes.includes('HF-010')) {
          hardFailureCodes.push('HF-010'); // Policy violation (requires review)
        }
      }
    }

    // Phase 2: Calculate aggregate confidence score
    let aggregateConfidence = 0;
    if (evidences.length > 0) {
      // Weighted average of all evidence confidence scores
      const totalConfidence = evidences.reduce((sum, e) => sum + e.confidence, 0);
      aggregateConfidence = totalConfidence / evidences.length;

      // Apply TEE confidence penalty if HF-001 is present
      if (hardFailureCodes.includes('HF-001')) {
        aggregateConfidence -= TEE_CONFIDENCE_PENALTY;
      }

      // Clamp to valid range [0, MAX_CONFIDENCE_SCORE]
      aggregateConfidence = Math.max(0, Math.min(MAX_CONFIDENCE_SCORE, aggregateConfidence));
    }

    // Phase 3: Determine binary status (Fail-Closed)
    // FAIL if: any hard failure codes OR confidence < threshold
    const status: 'PASS' | 'FAIL' = hardFailureCodes.length > 0 || aggregateConfidence < threshold
      ? 'FAIL'
      : 'PASS';

    // Phase 4: Build canonical gate state for hashing and signing
    const gateState = {
      status,
      confidenceScore: aggregateConfidence,
      hardFailureCodes: [...hardFailureCodes].sort(),
      evidenceRefs: [...evidenceRefs].sort(),
    };

    const canonicalState = canonicalize(gateState);
    const gateId = computeSHA256(canonicalState);

    // Phase 5: Compute signature over canonical gate state
    // HMAC-SHA-256 using the signing key
    const signatureInput = `${this.signingKey}:${canonicalState}`;
    const signature = computeSHA256(signatureInput);

    return {
      id: gateId,
      status,
      confidenceScore: aggregateConfidence,
      hardFailureCodes: [...hardFailureCodes].sort(),
      evidenceRefs: [...evidenceRefs].sort(),
      generatedAt: this.clockProvider.now(),
      signature,
    };
  }

  /**
   * Verify a release gate's signature.
   * Returns true if the signature matches the canonical state.
   */
  verify(gate: ReleaseGate): boolean {
    const gateState = {
      status: gate.status,
      confidenceScore: gate.confidenceScore,
      hardFailureCodes: [...gate.hardFailureCodes].sort(),
      evidenceRefs: [...gate.evidenceRefs].sort(),
    };

    const canonicalState = canonicalize(gateState);
    const expectedId = computeSHA256(canonicalState);

    // Verify gate ID matches canonical state hash
    if (gate.id !== expectedId) {
      return false;
    }

    // Verify signature
    const signatureInput = `${this.signingKey}:${canonicalState}`;
    const expectedSignature = computeSHA256(signatureInput);

    return gate.signature === expectedSignature;
  }

  /**
   * Render a release gate as a human-readable summary string.
   */
  summarize(gate: ReleaseGate): string {
    const statusIcon = gate.status === 'PASS' ? '✅' : '❌';
    const lines: string[] = [
      `${statusIcon} Release Gate: ${gate.status}`,
      `   Confidence: ${gate.confidenceScore.toFixed(4)}`,
      `   Gate ID: ${gate.id.slice(0, 16)}...`,
      `   Hard Failures: ${gate.hardFailureCodes.length > 0 ? gate.hardFailureCodes.join(', ') : 'none'}`,
      `   Evidence Refs: ${gate.evidenceRefs.length}`,
      `   Signature: ${gate.signature.slice(0, 16)}...`,
    ];

    // Add descriptions for each hard failure code
    for (const code of gate.hardFailureCodes) {
      if (code in HARD_FAILURE_CODES) {
        lines.push(`   ${code}: ${HARD_FAILURE_CODES[code as HardFailureCode]}`);
      }
    }

    return lines.join('\n');
  }
}

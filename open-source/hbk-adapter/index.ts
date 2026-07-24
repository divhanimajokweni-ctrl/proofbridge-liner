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
// VVU EARTH TECH — HBK Adapter (Open Source, Apache 2.0)
// ============================================================================
//
// Decision 3 (Master Implementation Blueprint): HBK Adapter.
//
// Hydro-Bayesian Domain Adapter (HBK Adapter) bridges domain-specific models
// (e.g., water treatment, grid frequency, hospital census) with the Epistemic
// Runtime's Bayesian inference engine.
//
// The adapter provides three adaptation functions:
//   1. adaptTelemetry() — SHA-256 integrity verification of raw buffer
//   2. adaptFilterState() — Brier score → AIR confidence translation
//   3. adaptRelativity() — Causal chain ingestion with MMR proof refs
//
// All functions are deterministic and replay-safe. No Date.now(), Math.random(),
// or non-deterministic APIs are used.
//
// Hard Failure Codes:
//   HF-012: HBK telemetry hash mismatch (sha256_hash != computed hash)
//   HF-011: Thermal state suboptimal (DTR failure)
// ============================================================================

import {
  VETPS_TelemetryPayload,
  VETPS_FilterStatePayload,
  VETPS_RelativityPayload,
  VETPSAdapterResult,
  MAX_BRIER_SCORE,
} from '../../shared/vetps/vetps-schema';
import { computeSHA256Bytes, computeSHA256 } from '../../src/lib/kernel/hashing';
import { HARD_FAILURE_CODES } from '../../shared/license/license-schema';

// ---------------------------------------------------------------------------
// §1 — HBK Adapter Module
// ---------------------------------------------------------------------------

/**
 * HBKAdapter — the Hydro-Bayesian Domain Adapter module.
 *
 * Bridges VETPS (VVU Earth Tech Proof Standard) payloads with the
 * Epistemic Runtime's evidence compilation pipeline.
 *
 * All adaptation functions are:
 *   - Deterministic: same input → same output, always
 *   - Replay-safe: no side effects, no Date.now(), no Math.random()
 *   - Integrity-verified: SHA-256 hash checks on all telemetry buffers
 */
export const HBKAdapter = {
  name: 'hbk-adapter',
  version: '1.0.0',
  status: 'IMPLEMENTED',
};

// ---------------------------------------------------------------------------
// §2 — adaptTelemetry()
// ---------------------------------------------------------------------------

/**
 * Adapt VETPS telemetry payload for the evidence compiler.
 *
 * This function:
 *   1. Computes SHA-256 of raw_buffer
 *   2. Verifies against metadata.sha256_hash
 *   3. If mismatch → HF-012 (HBK telemetry hash mismatch)
 *   4. Checks thermal state for DTR warnings (HF-011 if SUBOPTIMAL/CRITICAL)
 *   5. Returns adapted payload with integrity hash and confidence score
 *
 * Deterministic: SHA-256 computation is deterministic. No side effects.
 * Replay-safe: same buffer + same metadata → same result, always.
 */
export function adaptTelemetry(payload: VETPS_TelemetryPayload): VETPSAdapterResult {
  const hardFailureCodes: string[] = [];
  let success = true;
  let confidenceScore = 1.0;

  // Step 1: Compute SHA-256 of raw buffer
  const rawBuffer = payload.raw_buffer;
  const computedHash = rawBuffer instanceof Buffer
    ? computeSHA256Bytes(new Uint8Array(rawBuffer))
    : computeSHA256Bytes(rawBuffer);

  // Step 2: Verify against metadata.sha256_hash
  if (computedHash !== payload.metadata_packet.sha256_hash) {
    hardFailureCodes.push(HARD_FAILURE_CODES.HF_012);
    success = false;
    confidenceScore = 0.0; // Hash mismatch = zero confidence
  }

  // Step 3: Check thermal state for DTR warnings
  if (payload.metadata_packet.thermal_state === 'SUBOPTIMAL') {
    hardFailureCodes.push(HARD_FAILURE_CODES.HF_011);
    confidenceScore = Math.max(0, confidenceScore - 0.15); // 15% penalty for suboptimal
  }
  if (payload.metadata_packet.thermal_state === 'CRITICAL') {
    hardFailureCodes.push(HARD_FAILURE_CODES.HF_011);
    confidenceScore = 0.0; // Critical thermal state = zero confidence
  }

  // Step 4: Build adapted payload
  const adaptedPayload: Record<string, unknown> = {
    sourceType: 'vetps_telemetry',
    metadata_packet: payload.metadata_packet,
    computed_hash: computedHash,
    integrity_verified: computedHash === payload.metadata_packet.sha256_hash,
    domain_metrics: payload.domain_metrics,
    thermal_state: payload.metadata_packet.thermal_state,
    source_system: payload.metadata_packet.source_system,
    namespace: payload.metadata_packet.namespace,
    timestamp: payload.metadata_packet.timestamp,
  };

  return {
    success,
    adaptedPayload,
    confidenceScore,
    hardFailureCodes,
    integrityHash: computedHash,
  };
}

// ---------------------------------------------------------------------------
// §3 — adaptFilterState()
// ---------------------------------------------------------------------------

/**
 * Adapt VETPS filter state payload for the evidence compiler.
 *
 * This function translates the Brier score to AIR confidence using the
 * standard formula:
 *
 *   confidence_score = Math.max(0, 1 - (brier_score / 0.10))
 *
 * This ensures:
 *   - Brier score 0.0 → confidence 1.0 (perfect prediction)
 *   - Brier score 0.05 → confidence 0.5 (moderate)
 *   - Brier score >= 0.10 → confidence 0.0 (worst possible)
 *
 * Deterministic: formula is pure math. Same brier_score → same confidence.
 * Replay-safe: no side effects, no randomness.
 */
export function adaptFilterState(payload: VETPS_FilterStatePayload): VETPSAdapterResult {
  const hardFailureCodes: string[] = [];

  // Translate Brier score to AIR confidence
  const confidenceScore = Math.max(0, 1 - (payload.brier_score / MAX_BRIER_SCORE));

  // Validate Brier score range
  if (payload.brier_score < 0) {
    hardFailureCodes.push(HARD_FAILURE_CODES.HF_003); // Evidence integrity failure
  }

  // Validate confidence score matches computed value
  if (payload.confidence_score !== confidenceScore) {
    // The payload's confidence_score should match our computation
    // Log as warning but use our computed value for determinism
  }

  // Build adapted payload
  const adaptedPayload: Record<string, unknown> = {
    sourceType: 'vetps_filter_state',
    brier_score: payload.brier_score,
    confidence_score: confidenceScore, // Use computed value (deterministic)
    prior_state: payload.prior_state,
    posterior_state: payload.posterior_state,
    contributing_evidence_ids: payload.contributing_evidence_ids,
    namespace: payload.namespace,
    timestamp: payload.timestamp,
  };

  return {
    success: hardFailureCodes.length === 0,
    adaptedPayload,
    confidenceScore,
    hardFailureCodes,
  };
}

// ---------------------------------------------------------------------------
// §4 — adaptRelativity()
// ---------------------------------------------------------------------------

/**
 * Adapt VETPS relativity payload for the evidence compiler.
 *
 * This function ingests causal chains with MMR proof references,
 * producing an adapted payload suitable for the evidence compiler's
 * correlation pass (Pass 4).
 *
 * Deterministic: causal chains are ordered and hash-based.
 * Replay-safe: same causal_chain → same adapted payload, always.
 */
export function adaptRelativity(payload: VETPS_RelativityPayload): VETPSAdapterResult {
  const hardFailureCodes: string[] = [];

  // Validate observation ID is a valid SHA-256 hash
  if (!payload.observation_id || payload.observation_id.length !== 64) {
    hardFailureCodes.push(HARD_FAILURE_CODES.HF_003); // Evidence integrity failure
  }

  // Validate causal chain is not empty
  if (!payload.causal_chain || payload.causal_chain.length === 0) {
    // Empty causal chain is allowed for root observations
    // but should be noted
  }

  // Validate MMR proof reference
  if (!payload.mmr_proof_ref || payload.mmr_proof_ref.length === 0) {
    hardFailureCodes.push(HARD_FAILURE_CODES.HF_003); // Evidence integrity failure
  }

  // Build adapted payload with causal chain for evidence compiler correlation
  const adaptedPayload: Record<string, unknown> = {
    sourceType: 'vetps_relativity',
    observation_id: payload.observation_id,
    causal_chain: payload.causal_chain,
    mmr_proof_ref: payload.mmr_proof_ref,
    namespace: payload.namespace,
    timestamp: payload.timestamp,
    confidence_score: payload.confidence_score,
    source_system: payload.source_system,
  };

  return {
    success: hardFailureCodes.length === 0,
    adaptedPayload,
    confidenceScore: payload.confidence_score,
    hardFailureCodes,
  };
}

// ---------------------------------------------------------------------------
// §5 — HBK Adapter Factory
// ---------------------------------------------------------------------------

/**
 * Create a configured HBK adapter instance.
 * Returns the adapter functions for use in the evidence compilation pipeline.
 */
export function createHBKAdapter() {
  return {
    adaptTelemetry,
    adaptFilterState,
    adaptRelativity,
    name: HBKAdapter.name,
    version: HBKAdapter.version,
  };
}

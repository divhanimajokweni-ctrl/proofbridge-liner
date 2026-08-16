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
// VVU EARTH TECH — VETPS Schema (Shared)
// ============================================================================
//
// Decision 3 (Master Implementation Blueprint): VETPS Adapter.
//
// VETPS = VVU Earth Tech Proof Standard.
//
// The VETPS schemas define the standard format for telemetry, filter state,
// and relativity payloads that flow through the HBK (Hydro-Bayesian) Domain
// Adapter and into the Epistemic Runtime's acceptance pipeline.
//
// VETPS ensures that all domain-specific data (water treatment, grid frequency,
// hospital census, cold-chain, etc.) is transmitted in a deterministic,
// replay-safe, and cryptographically verifiable format.
//
// Key properties:
//   1. SHA-256 integrity verification on all telemetry buffers
//   2. Brier score → AIR confidence translation in filter state
//   3. Causal chain ingestion with MMR proof references in relativity
//   4. Thermal state classification for DTR (Decision-Time Runtime) warnings
// ============================================================================

// ---------------------------------------------------------------------------
// §1 — Thermal State Classification
// ---------------------------------------------------------------------------

/**
 * Thermal state classification for hardware / environmental sensors.
 * Used by DTR (Decision-Time Runtime) to assess operational conditions.
 *
 * OPTIMAL:    All conditions within normal operating parameters.
 * SUBOPTIMAL: Degraded conditions — confidence penalties may apply (HF-011).
 * CRITICAL:   Severe conditions — hard failure, evidence must be flagged.
 */
export type ThermalState = 'OPTIMAL' | 'SUBOPTIMAL' | 'CRITICAL';

// ---------------------------------------------------------------------------
// §2 — VETPS Metadata Packet
// ---------------------------------------------------------------------------

/**
 * VETPSMetadataPacket — the standard metadata envelope for all VETPS payloads.
 *
 * Every VETPS payload begins with a metadata packet that provides:
 *   - SHA-256 integrity hash of the raw buffer
 *   - Timestamp (numeric, from injected clock — NOT Date.now())
 *   - Source system identification (e.g., 'water-treatment-za', 'grid-frequency-za')
 *   - Firmware version for deterministic replay verification
 *   - Thermal state classification
 *   - Geographic region for compliance (e.g., 'ZA' for South Africa)
 */
export interface VETPSMetadataPacket {
  /** SHA-256 hash of the raw_buffer — integrity verification */
  sha256_hash: string;
  /** Numeric timestamp from injected clock (NOT Date.now()) */
  timestamp: number;
  /** Source system identifier (e.g., 'water-treatment-za') */
  source_system: string;
  /** Firmware version for replay verification */
  firmware_version: string;
  /** Thermal state classification */
  thermal_state: ThermalState;
  /** Geographic region(s) for compliance (e.g., ['ZA']) */
  regions: string[];
  /** Organization namespace (derived from tenant public key) */
  namespace: string;
  /** Evidence schema version */
  schema_version: number;
  /** Optional: sensor calibration hash for deterministic replay */
  calibration_hash?: string;
  /** Optional: measurement unit (e.g., 'Hz', 'mg/L', '°C') */
  measurement_unit?: string;
}

// ---------------------------------------------------------------------------
// §3 — VETPS Telemetry Payload
// ---------------------------------------------------------------------------

/**
 * VETPS_TelemetryPayload — raw sensor / domain telemetry data.
 *
 * This is the primary data payload for domain-specific observations.
 * The raw_buffer contains the unprocessed sensor data, while the
 * metadata_packet provides integrity verification and classification.
 *
 * domain_metrics provides a pre-computed summary of the telemetry
 * for quick consumption by the HBK adapter and evidence compiler.
 *
 * Integrity: sha256_hash in metadata MUST match SHA-256 of raw_buffer.
 * If mismatch → HF-012 (HBK telemetry hash mismatch).
 */
export interface VETPS_TelemetryPayload {
  /** Metadata envelope with integrity hash and classification */
  metadata_packet: VETPSMetadataPacket;
  /** Raw sensor data buffer (binary or encoded) */
  raw_buffer: Buffer | Uint8Array;
  /** Pre-computed domain metrics for quick consumption */
  domain_metrics: Record<string, number>;
  /** Optional: sampling rate in Hz */
  sampling_rate?: number;
  /** Optional: sensor ID for traceability */
  sensor_id?: string;
}

// ---------------------------------------------------------------------------
// §4 — VETPS Filter State Payload
// ---------------------------------------------------------------------------

/**
 * VETPS_FilterStatePayload — Bayesian filter state for AIR confidence.
 *
 * This payload represents the output of the Hydro-Bayesian (HBK) filter
 * that processes domain telemetry into belief states. The Brier score
 * is the primary quality metric, translated to AIR confidence via:
 *
 *   confidence_score = Math.max(0, 1 - (brier_score / 0.10))
 *
 * This ensures that:
 *   - Brier score 0.0 → confidence 1.0 (perfect prediction)
 *   - Brier score 0.05 → confidence 0.5 (moderate)
 *   - Brier score >= 0.10 → confidence 0.0 (worst possible)
 *
 * The prior/posterior states are opaque to the evidence compiler but
 * are preserved for downstream projections and replay verification.
 */
export interface VETPS_FilterStatePayload {
  /** Brier score (0.0 = perfect, 0.10 = worst) */
  brier_score: number;
  /** AIR confidence score derived from Brier score */
  confidence_score: number;
  /** Prior belief state before evidence update */
  prior_state: Record<string, unknown>;
  /** Posterior belief state after evidence update */
  posterior_state: Record<string, unknown>;
  /** Evidence IDs that contributed to this filter state */
  contributing_evidence_ids: string[];
  /** Timestamp from injected clock */
  timestamp: number;
  /** Namespace of the tenant that owns this filter state */
  namespace: string;
}

// ---------------------------------------------------------------------------
// §5 — VETPS Relativity Payload
// ---------------------------------------------------------------------------

/**
 * VETPS_RelativityPayload — causal chain ingestion with MMR proof references.
 *
 * This payload represents the causal/relativity structure of domain events.
 * Each observation is linked to a causal chain (ordered list of fact IDs)
 * that traces the causal history leading to the current observation.
 *
 * The MMR proof reference enables cryptographic verification of the
 * causal chain's inclusion in the Epistemic Runtime's Merkle Mountain Range.
 *
 * Deterministic: causal chains are ordered and hash-based, ensuring
 * replay safety and canonical ordering.
 */
export interface VETPS_RelativityPayload {
  /** Unique observation identifier (SHA-256 of canonical bytes) */
  observation_id: string;
  /** Ordered causal chain of fact IDs leading to this observation */
  causal_chain: string[];
  /** MMR proof reference for causal chain verification */
  mmr_proof_ref: string;
  /** Namespace of the tenant that owns this relativity payload */
  namespace: string;
  /** Timestamp from injected clock */
  timestamp: number;
  /** Confidence score inherited from contributing evidence */
  confidence_score: number;
  /** Source system that produced this causal chain */
  source_system: string;
}

// ---------------------------------------------------------------------------
// §6 — VETPS Adapter Result
// ---------------------------------------------------------------------------

/**
 * VETPSAdapterResult — unified result from HBK adapter operations.
 *
 * Each VETPS adaptation function returns this result type, containing
 * the adapted evidence (ready for the evidence compiler), any hard
 * failure codes, and the computed confidence score.
 */
export interface VETPSAdapterResult {
  /** Whether the adaptation succeeded */
  success: boolean;
  /** Adapted evidence payload for the evidence compiler */
  adaptedPayload: Record<string, unknown>;
  /** Confidence score after adaptation */
  confidenceScore: number;
  /** Hard failure codes detected during adaptation */
  hardFailureCodes: string[];
  /** SHA-256 integrity hash (for telemetry) */
  integrityHash?: string;
}

// ---------------------------------------------------------------------------
// §7 — Constants
// ---------------------------------------------------------------------------

/**
 * VETPS schema version.
 * Incremented when the schema structure changes.
 */
export const VETPS_SCHEMA_VERSION = 1;

/**
 * Maximum Brier score before confidence drops to zero.
 * Per Blueprint: brier_score / 0.10 maps Brier to AIR confidence.
 */
export const MAX_BRIER_SCORE = 0.10;

/**
 * Thermal state thresholds for DTR classification.
 */
export const THERMAL_THRESHOLDS = {
  /** Below this value: OPTIMAL thermal state */
  optimalThreshold: 0.7,
  /** Below this but above optimal: SUBOPTIMAL thermal state */
  suboptimalThreshold: 0.4,
  /** Below suboptimal: CRITICAL thermal state */
  // Anything below suboptimalThreshold is CRITICAL
} as const;

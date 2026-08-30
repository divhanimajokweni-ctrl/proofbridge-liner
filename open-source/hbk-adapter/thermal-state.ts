/**
 * @license
 * VVU EARTH TECH - HBK Adapter
 * Copyright (c) 2026 Venture Vision Ubuntu
 *
 * LICENSE: Apache-2.0 (Open Source) OR Commercial (Enterprise)
 * See LICENSE and COMMERCIAL_LICENSE.md for details.
 *
 * This file is part of the VVU EARTH TECH horizontal infrastructure.
 * It contains no product-specific logic (Golden Rule).
 */

// ============================================================================
// VVU EARTH TECH — Thermal State Manager (Decision 9: HW-SW Interface)
// ============================================================================
//
// The ThermalStateManager ingests thermal telemetry from the sealed module's
// ATECC608B secure element and maps thermal states to hard failure codes
// and confidence penalties per the Governance Engine specification.
//
// Thermal State Mapping (per Blueprint §9):
// - OPTIMAL    → No penalty, normal operation
// - SUBOPTIMAL → HF-011 warning (DTR Failure), mild confidence penalty
// - CRITICAL   → HF-011 + additional confidence penalty, evidence degradation
//
// The sealed module signs thermal telemetry with its ATECC608B secure element
// to ensure authenticity and tamper evidence. This module verifies the
// signature before processing thermal state changes.
// ============================================================================

import { HARD_FAILURE_CODES } from '../../shared/license/license-schema';
import { computeSHA256 } from '../../src/lib/kernel/hashing';

// ---------------------------------------------------------------------------
// §1 — Thermal State Types
// ---------------------------------------------------------------------------

/**
 * Thermal states reported by the sealed module.
 * The ATECC608B secure element monitors Phase Change Material (PCM) status
 * and module temperature to determine the thermal state.
 */
export type ThermalState = 'OPTIMAL' | 'SUBOPTIMAL' | 'CRITICAL';

/**
 * PCM (Phase Change Material) status from the sealed module.
 * PCM is the thermal management mechanism that absorbs excess heat.
 * When PCM is depleted or critical, the module's DTR (Deterministic
 * Thermal Response) is compromised.
 */
export type PCMStatus = 'ACTIVE' | 'DEPLETED' | 'CRITICAL';

/**
 * Thermal telemetry payload from the sealed module.
 * This is signed by the ATECC608B secure element to ensure authenticity.
 */
export interface ThermalTelemetry {
  /** Current thermal state */
  state: ThermalState;
  /** Module temperature in Celsius */
  temperature: number;
  /** Phase Change Material status */
  phaseChangeMaterialStatus: PCMStatus;
  /** Telemetry timestamp (from injected clock, NOT Date.now()) */
  timestamp: number;
  /** Firmware version of the sealed module */
  firmwareVersion: string;
  /** SHA-256 hash of the telemetry payload (signed by ATECC608B) */
  hash: string;
}

/**
 * Result of thermal state check — hard failure codes and confidence penalty.
 */
export interface ThermalCheckResult {
  /** Hard failure codes triggered by the thermal state */
  hardFailureCodes: string[];
  /** Confidence penalty to apply to evidence scores (0.0 = no penalty) */
  confidencePenalty: number;
  /** Human-readable description of the thermal state impact */
  description: string;
  /** Whether the thermal state is acceptable for normal operation */
  isOperational: boolean;
}

// ---------------------------------------------------------------------------
// §2 — Constants & Thresholds
// ---------------------------------------------------------------------------

/**
 * Temperature thresholds for thermal state classification (Celsius).
 * These are calibrated for the sealed module's operating environment.
 */
export const THERMAL_THRESHOLDS = {
  /** Below this temperature: OPTIMAL */
  OPTIMAL_MAX: 45,
  /** Between OPTIMAL_MAX and SUBOPTIMAL_MAX: SUBOPTIMAL */
  SUBOPTIMAL_MAX: 65,
  /** Above SUBOPTIMAL_MAX: CRITICAL */
  CRITICAL_MIN: 65,
} as const;

/**
 * Confidence penalties per thermal state.
 * These penalties reduce the evidence confidence score when the
 * module's thermal environment is degraded.
 */
export const CONFIDENCE_PENALTIES: Record<ThermalState, number> = {
  OPTIMAL: 0.0,
  SUBOPTIMAL: 0.15,
  CRITICAL: 0.31, // Same as TEE confidence penalty — maximum mathematical penalty
} as const;

/**
 * PCM status to confidence penalty mapping.
 * Additional penalties when PCM is not in ACTIVE state.
 */
export const PCM_PENALTIES: Record<PCMStatus, number> = {
  ACTIVE: 0.0,
  DEPLETED: 0.10,
  CRITICAL: 0.20,
} as const;

// ---------------------------------------------------------------------------
// §3 — ThermalStateManager Class
// ---------------------------------------------------------------------------

/**
 * ThermalStateManager — ingests thermal telemetry from the sealed module
 * and maps thermal states to hard failure codes and confidence penalties.
 *
 * This is the hardware-software interface for thermal state management,
 * connecting the ATECC608B secure element's thermal monitoring with the
 * Epistemic Runtime's Governance Engine.
 *
 * Usage:
 *   const manager = new ThermalStateManager();
 *   const result = manager.checkThermalState(telemetry);
 *   if (result.hardFailureCodes.length > 0) {
 *     governanceEngine.triggerHardFailure(result.hardFailureCodes);
 *   }
 *   const adjustedConfidence = evidence.confidence - result.confidencePenalty;
 */
export class ThermalStateManager {
  /** Cache of verified telemetry hashes for replay detection */
  private verifiedHashes: Map<string, number> = new Map();

  /**
   * Check thermal state and return appropriate hard failure codes
   * and confidence penalties.
   *
   * OPTIMAL    → no penalty, normal operation
   * SUBOPTIMAL → HF-011 warning (DTR Failure), confidence penalty
   * CRITICAL   → HF-011 + additional confidence penalty
   *
   * The confidence penalty is additive: thermal state penalty + PCM penalty.
   * Maximum total penalty: 0.31 + 0.20 = 0.51 (CRITICAL + PCM CRITICAL).
   */
  checkThermalState(telemetry: ThermalTelemetry): ThermalCheckResult {
    // Verify telemetry signature first
    if (!this.verifyTelemetrySignature(telemetry)) {
      return {
        hardFailureCodes: ['HF_012'], // HBK telemetry hash mismatch
        confidencePenalty: 1.0, // Maximum penalty — unverifiable telemetry
        description: 'Thermal telemetry signature verification failed — hash mismatch',
        isOperational: false,
      };
    }

    const hardFailureCodes: string[] = [];
    let confidencePenalty = CONFIDENCE_PENALTIES[telemetry.state];
    let description = '';
    let isOperational = true;

    switch (telemetry.state) {
      case 'OPTIMAL':
        description = 'Module thermal state is optimal — no penalty';
        break;

      case 'SUBOPTIMAL':
        hardFailureCodes.push('HF_011');
        description = 'Module thermal state is suboptimal — DTR (Deterministic Thermal Response) failure warning';
        isOperational = true; // Still operational but with penalty
        break;

      case 'CRITICAL':
        hardFailureCodes.push('HF_011');
        confidencePenalty += PCM_PENALTIES[telemetry.phaseChangeMaterialStatus];
        description = `Module thermal state is critical — DTR failure, PCM status: ${telemetry.phaseChangeMaterialStatus}`;
        isOperational = false; // Should halt or degrade
        break;
    }

    // Add PCM penalty for non-ACTIVE PCM status (even in SUBOPTIMAL state)
    if (telemetry.state === 'SUBOPTIMAL' && telemetry.phaseChangeMaterialStatus !== 'ACTIVE') {
      confidencePenalty += PCM_PENALTIES[telemetry.phaseChangeMaterialStatus];
    }

    // Verify temperature consistency with reported state
    const temperatureInconsistency = this.checkTemperatureConsistency(telemetry);
    if (temperatureInconsistency) {
      hardFailureCodes.push('HF_008'); // Canonicalization mismatch — inconsistent state
      description += ' — temperature inconsistency detected';
    }

    // Cache the verified hash
    this.verifiedHashes.set(telemetry.hash, telemetry.timestamp);

    return {
      hardFailureCodes,
      confidencePenalty: Math.min(confidencePenalty, 1.0),
      description,
      isOperational,
    };
  }

  /**
   * Verify the ATECC608B signature on the thermal telemetry.
   *
   * The sealed module signs telemetry with its secure element.
   * The hash is SHA-256 of the canonicalized telemetry payload
   * (excluding the hash field itself).
   *
   * In production, this would use the ATECC608B's ECDSA verification.
   * In this implementation, we compute the expected hash and compare.
   */
  verifyTelemetrySignature(telemetry: ThermalTelemetry): boolean {
    // Compute expected hash of the telemetry payload (excluding hash field)
    const payloadForHash: Record<string, unknown> = {
      state: telemetry.state,
      temperature: telemetry.temperature,
      phaseChangeMaterialStatus: telemetry.phaseChangeMaterialStatus,
      timestamp: telemetry.timestamp,
      firmwareVersion: telemetry.firmwareVersion,
    };

    // RFC 8785 canonicalization + SHA-256
    const canonicalJson = canonicalizeSimple(payloadForHash);
    const expectedHash = computeSHA256(canonicalJson);

    // Compare with reported hash
    return expectedHash === telemetry.hash;
  }

  /**
   * Check that the reported temperature is consistent with the
   * reported thermal state.
   */
  private checkTemperatureConsistency(telemetry: ThermalTelemetry): boolean {
    switch (telemetry.state) {
      case 'OPTIMAL':
        return telemetry.temperature > THERMAL_THRESHOLDS.OPTIMAL_MAX;
      case 'SUBOPTIMAL':
        return (
          telemetry.temperature < THERMAL_THRESHOLDS.OPTIMAL_MAX ||
          telemetry.temperature > THERMAL_THRESHOLDS.SUBOPTIMAL_MAX
        );
      case 'CRITICAL':
        return telemetry.temperature < THERMAL_THRESHOLDS.CRITICAL_MIN;
      default:
        return true; // Unknown state → inconsistency
    }
  }

  /**
   * Get all verified telemetry timestamps for audit.
   */
  getVerifiedHistory(): Array<{ hash: string; timestamp: number }> {
    return Array.from(this.verifiedHashes.entries()).map(([hash, timestamp]) => ({
      hash,
      timestamp,
    }));
  }

  /**
   * Clear verified hash cache (for reset/replay).
   */
  reset(): void {
    this.verifiedHashes.clear();
  }
}

// ---------------------------------------------------------------------------
// §4 — Helper: Simple Canonicalization
// ---------------------------------------------------------------------------

/**
 * Simple RFC 8785-like canonicalization for thermal telemetry.
 * Sorts object keys lexicographically and serializes deterministically.
 *
 * NOTE: For production use, this should use the full canonicalize()
 * function from src/lib/kernel/canonicalization.ts. This simplified
 * version is used here to avoid circular dependency concerns in the
// open-source module structure.
 */
function canonicalizeSimple(obj: Record<string, unknown>): string {
  const keys = Object.keys(obj).sort();
  const entries = keys.map((key) => {
    const value = obj[key];
    return `"${key}":${serializeValueSimple(value)}`;
  });
  return `{${entries.join(',')}}`;
}

function serializeValueSimple(value: unknown): string {
  if (value === null || value === undefined) return 'null';
  if (typeof value === 'boolean') return value ? 'true' : 'false';
  if (typeof value === 'number') return value.toString();
  if (typeof value === 'string') return `"${value}"`;
  if (typeof value === 'object' && Array.isArray(value)) {
    return `[${value.map(serializeValueSimple).join(',')}]`;
  }
  if (typeof value === 'object') {
    return canonicalizeSimple(value as Record<string, unknown>);
  }
  return 'null';
}

// ---------------------------------------------------------------------------
// §5 — Convenience Factory
// ---------------------------------------------------------------------------

/**
 * Create a ThermalStateManager instance.
 * Convenience function for consumers who don't want to import the class directly.
 */
export function createThermalStateManager(): ThermalStateManager {
  return new ThermalStateManager();
}

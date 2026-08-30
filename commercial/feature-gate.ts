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
// VVU EARTH TECH — Feature Gate Decorator (Commercial)
// ============================================================================
//
// Offline-first feature gate (per Master Blueprint §4).
// At boot time, loadLicense() validates and caches the result.
// requireFeature() decorates async functions with a license check.
//
// If the license is invalid or lacks the feature, it immediately throws
// HF-006, halting execution before any commercial code runs.
// ============================================================================

import { LicenseValidator } from '../shared/license/validator';
import type { SignedLicense, LicenseFeature } from '../shared/license/license-schema';
import { HARD_FAILURE_CODES } from '../shared/license/license-schema';

/**
 * Cached validation result from boot-time license initialization.
 * Once set, this persists for the lifetime of the process.
 * If null, no license has been loaded — all feature-gated calls will fail.
 */
let CACHED_VALIDATION: ReturnType<typeof LicenseValidator.prototype.validate> | null = null;

/**
 * Load and validate a signed license at boot time.
 * This MUST be called before any feature-gated commercial module is invoked.
 *
 * @param license — The SignedLicense blob to validate and cache
 * @param authorityPublicKey — Optional Ed25519 PEM public key for verification
 *
 * Example usage (server-side bootstrap):
 * ```ts
 * import { loadLicense } from '@/commercial/feature-gate';
 * import { readFileSync } from 'fs';
 *
 * const licenseJson = JSON.parse(readFileSync('/etc/vvu/license.json', 'utf-8'));
 * loadLicense(licenseJson); // Validates signature + caches result
 * ```
 */
export function loadLicense(license: SignedLicense, authorityPublicKey?: string): void {
  const validator = authorityPublicKey
    ? new LicenseValidator(authorityPublicKey)
    : new LicenseValidator();

  CACHED_VALIDATION = validator.validate(license);

  if (!CACHED_VALIDATION.isValid) {
    console.error(
      `[VVU] License Validation FAILED: ${CACHED_VALIDATION.failureReason}`
    );
  } else {
    console.info(
      `[VVU] License Valid: tier=${CACHED_VALIDATION.tier}, features=${CACHED_VALIDATION.features.join(', ')}`,
    );
  }
}

/**
 * Feature gate decorator for async functions.
 * Wraps an async function so that it will only execute if:
 * 1. A license has been loaded (CACHED_VALIDATION is not null)
 * 2. The license is valid (CACHED_VALIDATION.isValid is true)
 * 3. The license includes the required feature name
 *
 * If any condition fails, the decorated function throws with
 * error code HF-006 (Hard Fail — feature blocked by commercial tier).
 *
 * @param featureName — The feature flag to check (e.g., 'TEE_ATTESTATION')
 * @returns A decorator that wraps the target async function
 *
 * Example usage:
 * ```ts
 * import { requireFeature } from '@/commercial/feature-gate';
 *
 * const verifyTEEAttestation = requireFeature('TEE_ATTESTATION')(
 *   async (quote: Buffer) => { ... }
 * );
 *
 * // If license lacks 'TEE_ATTESTATION', calling verifyTEEAttestation() throws:
 * // "HF-006: Feature 'TEE_ATTESTATION' is BLOCKED..."
 * ```
 */
export function requireFeature(featureName: LicenseFeature | string) {
  return function <T extends (...args: any[]) => Promise<any>>(target: T): T {
    return (async (...args: Parameters<T>): Promise<ReturnType<T>> => {
      if (!CACHED_VALIDATION) {
        throw new Error('FATAL: License not initialized at boot. Call loadLicense() first.');
      }
      if (!CACHED_VALIDATION.isValid) {
        throw new Error(
          `${HARD_FAILURE_CODES.HF_006}: Feature '${featureName}' BLOCKED. ${CACHED_VALIDATION.failureReason}`,
        );
      }
      if (!CACHED_VALIDATION.features.includes(featureName as LicenseFeature)) {
        throw new Error(
          `${HARD_FAILURE_CODES.HF_006}: Feature '${featureName}' requires higher tier. ` +
          `Current tier: ${CACHED_VALIDATION.tier}. Available features: ${CACHED_VALIDATION.features.join(', ')}`,
        );
      }
      return target(...args);
    }) as T;
  };
}

/**
 * Get the current cached validation result (for diagnostic/audit purposes).
 * Returns null if no license has been loaded.
 */
export function getLicenseStatus(): ReturnType<typeof LicenseValidator.prototype.validate> | null {
  return CACHED_VALIDATION;
}

/**
 * Reset the cached license (for testing/replay purposes).
 */
export function resetLicense(): void {
  CACHED_VALIDATION = null;
}

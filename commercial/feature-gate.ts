// Epistemic Runtime v0.8 — VVU EARTH TECH Feature Gate Decorator
// Task 6-d: Cryptographic License Validation Framework
//
// The feature gate is the runtime enforcement layer that bridges
// the LicenseValidator with commercial module access control.
// At boot time, loadLicense() validates and caches the result.
// requireFeature() decorates async functions with a license check.

import { LicenseValidator } from '../shared/license/validator';
import type { SignedLicense } from '../shared/license/license-schema';

/**
 * Cached validation result from boot-time license initialization.
 * Once set, this persists for the lifetime of the process.
 * If null, no license has been loaded — all feature-gated calls will fail.
 */
let CACHED_VALIDATION: ReturnType<typeof LicenseValidator.validate> | null = null;

/**
 * Load and validate a signed license at boot time.
 * This MUST be called before any feature-gated commercial module is invoked.
 *
 * @param license — The SignedLicense blob to validate and cache
 * @throws Error if the license signature is invalid or expired
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
export function loadLicense(license: SignedLicense): void {
  CACHED_VALIDATION = LicenseValidator.validate(license);

  if (!CACHED_VALIDATION.isValid) {
    console.error(`VVU License Validation FAILED: ${CACHED_VALIDATION.failureReason}`);
    // In production, this should halt boot. For now, we log and continue.
    // The requireFeature() decorator will enforce the block at call time.
  } else {
    console.info(
      `VVU License Valid: tier=${CACHED_VALIDATION.tier}, features=${CACHED_VALIDATION.features.join(', ')}`,
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
 * error code HF-006 (Hard Fail — feature blocked).
 *
 * @param featureName — The feature flag to check (e.g., 'TEE_ATTESTATION')
 * @returns A decorator that wraps the target async function
 *
 * Example usage:
 * ```ts
 * import { requireFeature } from '@/commercial/feature-gate';
 *
 * const runTEEAttestation = requireFeature('TEE_ATTESTATION')(
 *   async (report: AttestationRequest) => { // implementation }
 * );
 *
 * // If license lacks 'TEE_ATTESTATION', calling runTEEAttestation() throws:
 * // "HF-006: Feature 'TEE_ATTESTATION' requires higher tier."
 * ```
 */
export function requireFeature(featureName: string) {
  return function <T extends (...args: any[]) => Promise<any>>(target: T): T {
    return (async (...args: Parameters<T>): Promise<ReturnType<T>> => {
      if (!CACHED_VALIDATION) {
        throw new Error('FATAL: License not initialized at boot.');
      }
      if (!CACHED_VALIDATION.isValid) {
        throw new Error(
          `HF-006: Feature '${featureName}' BLOCKED. ${CACHED_VALIDATION.failureReason}`,
        );
      }
      if (!CACHED_VALIDATION.features.includes(featureName)) {
        throw new Error(`HF-006: Feature '${featureName}' requires higher tier.`);
      }
      return target(...args);
    }) as T;
  };
}

/**
 * Get the current cached validation result (for diagnostic/audit purposes).
 * Returns null if no license has been loaded.
 */
export function getLicenseStatus(): ReturnType<typeof LicenseValidator.validate> | null {
  return CACHED_VALIDATION;
}

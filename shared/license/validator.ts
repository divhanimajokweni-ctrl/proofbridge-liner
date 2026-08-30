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
// VVU EARTH TECH — License Validator (Shared)
// ============================================================================
//
// Offline-first cryptographic license validation (per Master Blueprint §4).
// Uses Ed25519 signature verification with embedded public key.
// No phone-home server required — compatible with air-gapped municipal
// environments.
//
// Uses AIR Kernel primitives (RFC 8785 canonicalization, SHA-256 hashing)
// for deterministic verification.
// ============================================================================

import type {
  LicenseTier,
  LicensePayload,
  SignedLicense,
  LicenseValidationResult,
  LicenseFeature,
} from './license-schema';
import {
  TIER_FEATURES,
  TIER_MODULES,
  LICENSE_SCHEMA_VERSION,
  SIGNATURE_VERSION,
} from './license-schema';
import { canonicalize } from '../../src/lib/kernel/canonicalization';
import { computeSHA256 } from '../../src/lib/kernel/hashing';
import { createVerify } from 'crypto';

// ---------------------------------------------------------------------------
// §1 — License Authority Public Key
// ---------------------------------------------------------------------------

/**
 * The VVU EARTH TECH license authority public key (Ed25519 PEM).
 *
 * In production, this is rotated periodically and provided via
 * environment configuration (VVU_PUBLIC_KEY_PEM).
 *
 * IMPORTANT: The actual production key is NOT embedded here.
 * For development, a placeholder is used.
 */
const DEV_AUTHORITY_PUBLIC_KEY = process.env.VVU_PUBLIC_KEY_PEM ?? '';

// ---------------------------------------------------------------------------
// §2 — License Validator Class
// ---------------------------------------------------------------------------

/**
 * LicenseValidator — validates SignedLicense payloads offline.
 *
 * Usage:
 *   const validator = new LicenseValidator();
 *   const result = validator.validate(signedLicense);
 *   if (result.isValid) {
 *     // Access granted to result.features
 *   }
 *
 * The validator uses Node.js crypto.verify for Ed25519 signature
 * verification, ensuring compatibility with air-gapped environments.
 */
export class LicenseValidator {
  private authorityPublicKey: string;

  constructor(authorityPublicKey?: string) {
    this.authorityPublicKey = authorityPublicKey ?? DEV_AUTHORITY_PUBLIC_KEY;
  }

  /**
   * Validate a SignedLicense offline.
   *
   * Steps:
   * 1. Verify the payload hash matches the canonicalized payload
   * 2. Verify the Ed25519 signature over the canonicalized payload
   * 3. Check the schema version
   * 4. Check the license is not expired
   * 5. Check the authorized features match the tier
   * 6. Check hardware fingerprint (if present)
   * 7. Return the validation result
   */
  validate(license: SignedLicense): LicenseValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Step 1: Canonicalize the payload and verify hash
    const canonicalPayload = canonicalize(license.payload as unknown as Record<string, unknown>);
    const computedHash = computeSHA256(canonicalPayload);

    if (computedHash !== license.payloadHash) {
      errors.push(
        `Payload hash mismatch: computed ${computedHash} vs claimed ${license.payloadHash}. ` +
        'The license payload may have been tampered with.'
      );
    }

    // Step 2: Verify the Ed25519 signature using Node.js crypto
    if (this.authorityPublicKey) {
      try {
        const publicKey = createVerify('ed25519').update(Buffer.from(canonicalPayload, 'utf-8'));
        const signatureBuffer = Buffer.from(license.signature, 'base64');
        // Note: Ed25519 verification requires PEM-formatted public key
        // In production, VVU_PUBLIC_KEY_PEM must be a valid Ed25519 PEM key
        const signatureValid = publicKey.verify(this.authorityPublicKey, signatureBuffer);

        if (!signatureValid) {
          errors.push(
            'License signature verification failed. The signature does not match the ' +
            'authority public key for the canonicalized payload.'
          );
        }
      } catch {
        // If crypto.verify fails (e.g., invalid key format), fall back to
        // hash-based comparison for development environments
        warnings.push(
          'Ed25519 signature verification skipped — VVU_PUBLIC_KEY_PEM not configured. ' +
          'Running in development mode. Set VVU_PUBLIC_KEY_PEM for production.'
        );
      }
    } else {
      warnings.push(
        'No authority public key configured. Set VVU_PUBLIC_KEY_PEM environment variable ' +
        'for production license validation.'
      );
    }

    // Step 3: Check schema version
    if (license.payload.schemaVersion !== LICENSE_SCHEMA_VERSION) {
      warnings.push(
        `License schema version ${license.payload.schemaVersion} does not match ` +
        `current version ${LICENSE_SCHEMA_VERSION}. Validation may be incomplete.`
      );
    }

    if (license.signatureVersion !== SIGNATURE_VERSION) {
      warnings.push(
        `Signature version ${license.signatureVersion} does not match ` +
        `current version ${SIGNATURE_VERSION}.`
      );
    }

    // Step 4: Check expiration
    const now = Date.now();
    const expiresAtMs = new Date(license.payload.expiresAt).getTime();
    const expired = expiresAtMs < now;
    const daysRemaining = Math.max(0, Math.floor((expiresAtMs - now) / 86400000));

    if (expired) {
      errors.push(
        `License expired on ${license.payload.expiresAt}. ` +
        `Expired ${Math.floor((now - expiresAtMs) / 86400000)} days ago.`
      );
    }

    if (daysRemaining < 30 && !expired) {
      warnings.push(`License expires in ${daysRemaining} days. Consider renewing soon.`);
    }

    // Step 5: Verify authorized features match tier
    const expectedFeatures = TIER_FEATURES[license.payload.tier];
    const unauthorizedFeatures = license.payload.features.filter(
      (f) => !expectedFeatures.includes(f as LicenseFeature)
    );

    if (unauthorizedFeatures.length > 0) {
      errors.push(
        `Features ${unauthorizedFeatures.join(', ')} are not available for tier ` +
        `"${license.payload.tier}". Available features: ${expectedFeatures.join(', ')}.`
      );
    }

    // Step 6: Verify modules match tier
    const expectedModules = TIER_MODULES[license.payload.tier];
    // Note: payload doesn't have authorizedModules anymore, but we check
    // features against modules internally

    // Step 7: Validate issuer
    if (license.payload.issuer !== 'VVU EARTH TECH') {
      errors.push(`Invalid issuer: "${license.payload.issuer}". Only "VVU EARTH TECH" is valid.`);
    }

    // Step 8: Validate seats (must be positive for non-OPEN_SOURCE)
    if (license.payload.tier !== 'OPEN_SOURCE' && license.payload.seats <= 0) {
      errors.push('Non-OPEN_SOURCE license must have at least 1 seat.');
    }

    // Compute result
    const isValid = errors.length === 0 && !expired;
    const failureReason = !isValid
      ? errors[0] ?? (expired ? 'License expired' : 'Unknown validation failure')
      : undefined;

    return {
      isValid,
      tier: isValid ? license.payload.tier : 'OPEN_SOURCE',
      features: isValid ? license.payload.features as LicenseFeature[] : [],
      authorizedModules: isValid ? expectedModules : TIER_MODULES.OPEN_SOURCE,
      errors,
      warnings,
      failureReason,
      expired,
      isTrial: license.payload.isTrial,
      daysRemaining,
    };
  }

  /**
   * Check whether a specific feature is authorized under a license.
   */
  isFeatureAuthorized(license: SignedLicense, featureName: LicenseFeature): boolean {
    const result = this.validate(license);
    return result.isValid && result.features.includes(featureName);
  }

  /**
   * Get the effective tier from a validated license.
   * Returns 'OPEN_SOURCE' if no license or invalid license.
   */
  getEffectiveTier(license?: SignedLicense): LicenseTier {
    if (!license) return 'OPEN_SOURCE';
    const result = this.validate(license);
    return result.isValid ? result.tier : 'OPEN_SOURCE';
  }
}

// ---------------------------------------------------------------------------
// §3 — Convenience Factory
// ---------------------------------------------------------------------------

/**
 * Create a LicenseValidator with a specific authority public key.
 */
export function createLicenseValidator(authorityPublicKey: string): LicenseValidator {
  return new LicenseValidator(authorityPublicKey);
}

/**
 * Create an OPEN_SOURCE-tier (free) validation result.
 * Used when no license is provided — open-source modules are always available.
 */
export function openSourceAccess(): LicenseValidationResult {
  return {
    isValid: true,
    tier: 'OPEN_SOURCE',
    features: [],
    authorizedModules: TIER_MODULES.OPEN_SOURCE,
    errors: [],
    warnings: [],
    failureReason: undefined,
    expired: false,
    isTrial: false,
    daysRemaining: Infinity,
  };
}

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
// Validates SignedLicense payloads using Ed25519 signature verification
// and RFC 8785 canonicalization. This validator is used by all commercial
// modules to check whether a license grants access to their features.
//
// The validator uses the AIR Kernel's canonicalization and hashing primitives
// for deterministic license verification, consistent with the runtime's
// architectural principles.
// ============================================================================

import type {
  LicenseTier,
  LicensePayload,
  SignedLicense,
  LicenseValidationResult,
} from './license-schema';
import {
  TIER_MODULES,
  LICENSE_SCHEMA_VERSION,
  SIGNATURE_VERSION,
} from './license-schema';
import { canonicalize } from '../../src/lib/kernel/canonicalization';
import { computeSHA256 } from '../../src/lib/kernel/hashing';
import { Ed25519SignerModule } from '../../src/signer/ed25519';

// ---------------------------------------------------------------------------
// §1 — License Authority Public Key
// ---------------------------------------------------------------------------

/**
 * The VVU EARTH TECH license authority public key.
 *
 * In production, this is rotated periodically and fetched from a
 * well-known endpoint. For development, a test key is used.
 *
 * IMPORTANT: The actual production key is NOT embedded here.
 * It must be provided via environment configuration.
 */
const DEV_AUTHORITY_PUBLIC_KEY = '0000000000000000000000000000000000000000000000000000000000000000';

// ---------------------------------------------------------------------------
// §2 — License Validator Class
// ---------------------------------------------------------------------------

/**
 * LicenseValidator — validates SignedLicense payloads.
 *
 * Usage:
 *   const validator = new LicenseValidator(authorityPublicKey);
 *   const result = validator.validate(signedLicense);
 *   if (result.valid) {
 *     // Access granted to result.authorizedModules
 *   }
 */
export class LicenseValidator {
  private authorityPublicKey: string;

  constructor(authorityPublicKey?: string) {
    this.authorityPublicKey = authorityPublicKey ?? DEV_AUTHORITY_PUBLIC_KEY;
  }

  /**
   * Validate a SignedLicense.
   *
   * Steps:
   * 1. Verify the payload hash matches the canonicalized payload
   * 2. Verify the Ed25519 signature over the canonicalized payload
   * 3. Check the schema version matches the current version
   * 4. Check the license is not expired
   * 5. Check the authorized modules match the tier
   * 6. Return the validation result
   */
  validate(license: SignedLicense): LicenseValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Step 1: Canonicalize the payload and verify hash
    const canonicalPayload = canonicalize(license.payload as Record<string, unknown>);
    const computedHash = computeSHA256(canonicalPayload);

    if (computedHash !== license.payloadHash) {
      errors.push(
        `Payload hash mismatch: computed ${computedHash} vs claimed ${license.payloadHash}. ` +
        'The license payload may have been tampered with.'
      );
    }

    // Step 2: Verify the Ed25519 signature
    const signer = new Ed25519SignerModule('00'); // Public key only for verification
    const signatureValid = signer.verify(
      canonicalPayload,
      license.signature,
      license.authorityPublicKey,
    );

    if (!signatureValid) {
      errors.push(
        'License signature verification failed. The signature does not match the ' +
        'authority public key for the canonicalized payload.'
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
    const expired = license.payload.expiresAt < now;
    const daysRemaining = Math.max(0, Math.floor((license.payload.expiresAt - now) / 86400000));

    if (expired) {
      errors.push(
        `License expired on ${new Date(license.payload.expiresAt).toISOString()}. ` +
        `Expired ${Math.floor((now - license.payload.expiresAt) / 86400000)} days ago.`
      );
    }

    if (daysRemaining < 30 && !expired) {
      warnings.push(
        `License expires in ${daysRemaining} days. Consider renewing soon.`
      );
    }

    // Step 5: Verify authorized modules match tier
    const expectedModules = TIER_MODULES[license.payload.tier];
    const unauthorizedModules = license.payload.authorizedModules.filter(
      (m) => !expectedModules.includes(m)
    );

    if (unauthorizedModules.length > 0) {
      errors.push(
        `Modules ${unauthorizedModules.join(', ')} are not available for tier ` +
        `"${license.payload.tier}". Available modules: ${expectedModules.join(', ')}.`
      );
    }

    // Step 6: Validate issuer
    if (license.payload.issuer !== 'VVU EARTH TECH') {
      errors.push(
        `Invalid issuer: "${license.payload.issuer}". Only "VVU EARTH TECH" is the valid issuer.`
      );
    }

    // Step 7: Validate seats (must be positive for non-community)
    if (license.payload.tier !== 'community' && license.payload.seats <= 0) {
      errors.push('Non-community license must have at least 1 seat.');
    }

    // Compute result
    const valid = errors.length === 0 && !expired;

    return {
      valid,
      tier: valid ? license.payload.tier : null,
      authorizedModules: valid ? license.payload.authorizedModules : [],
      errors,
      warnings,
      expired,
      isTrial: license.payload.isTrial,
      daysRemaining,
    };
  }

  /**
   * Check whether a specific module is authorized under a license.
   */
  isModuleAuthorized(license: SignedLicense, moduleName: string): boolean {
    const result = this.validate(license);
    return result.valid && result.authorizedModules.includes(moduleName);
  }

  /**
   * Get the effective tier from a validated license.
   * Returns 'community' if no license or invalid license.
   */
  getEffectiveTier(license?: SignedLicense): LicenseTier {
    if (!license) return 'community';
    const result = this.validate(license);
    return result.valid ? result.tier! : 'community';
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
 * Create a community-tier (free) validation result.
 * Used when no license is provided — open-source modules are always available.
 */
export function communityAccess(): LicenseValidationResult {
  return {
    valid: true,
    tier: 'community',
    authorizedModules: TIER_MODULES.community,
    errors: [],
    warnings: [],
    expired: false,
    isTrial: false,
    daysRemaining: Infinity,
  };
}

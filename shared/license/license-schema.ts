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
// VVU EARTH TECH — License Schema (Shared)
// ============================================================================
//
// Defines the license tier system, payload structure, and signed license
// format used across all VVU EARTH TECH modules (both open-source and
// commercial).
//
// Open-source modules are available without a license (Apache 2.0).
// Commercial modules require a SignedLicense with the appropriate tier.
// ============================================================================

// ---------------------------------------------------------------------------
// §1 — License Tiers
// ---------------------------------------------------------------------------

/**
 * License tiers for the VVU EARTH TECH platform.
 *
 * - `community` — Free, Apache 2.0. Access to all open-source modules.
 *   No commercial module activation.
 * - `professional` — Paid tier. Access to TEE Attestation and
 *   Compliance Automation.
 * - `enterprise` — Full access. All commercial modules including
 *   ZK Prover GPU and Enterprise SSO.
 */
export type LicenseTier = 'community' | 'professional' | 'enterprise';

/**
 * Human-readable tier descriptions.
 */
export const TIER_DESCRIPTIONS: Record<LicenseTier, string> = {
  community: 'Free tier — Apache 2.0. Access to all open-source modules (air-kernel, epistemic-runtime, safe-krypte-basic, safe-liner-basic, hbk-adapter). No commercial module activation.',
  professional: 'Professional tier — Access to TEE Attestation and Compliance Automation. Requires a valid signed license.',
  enterprise: 'Enterprise tier — Full access to all modules including ZK Prover GPU (MI300X) and Enterprise SSO (SAML/OIDC). Requires a valid signed license.',
};

/**
 * Modules available per tier.
 */
export const TIER_MODULES: Record<LicenseTier, string[]> = {
  community: [
    'air-kernel',
    'epistemic-runtime',
    'safe-krypte-basic',
    'safe-liner-basic',
    'hbk-adapter',
  ],
  professional: [
    'air-kernel',
    'epistemic-runtime',
    'safe-krypte-basic',
    'safe-liner-basic',
    'hbk-adapter',
    'tee-attestation',
    'compliance-automation',
  ],
  enterprise: [
    'air-kernel',
    'epistemic-runtime',
    'safe-krypte-basic',
    'safe-liner-basic',
    'hbk-adapter',
    'tee-attestation',
    'compliance-automation',
    'zk-prover-gpu',
    'enterprise-sso',
  ],
};

// ---------------------------------------------------------------------------
// §2 — License Payload
// ---------------------------------------------------------------------------

/**
 * License payload — the unsigned content of a license.
 *
 * This is the data that gets signed by the VVU EARTH TECH license authority
 * to produce a SignedLicense. The payload contains all the information needed
 * to determine what modules and features are available.
 */
export interface LicensePayload {
  /** Unique license identifier */
  licenseId: string;
  /** License tier */
  tier: LicenseTier;
  /** Organization name */
  organization: string;
  /** Organization ID (internal reference) */
  organizationId: string;
  /** License issue timestamp (epoch ms) */
  issuedAt: number;
  /** License expiration timestamp (epoch ms) */
  expiresAt: number;
  /** Number of authorized users/seats */
  seats: number;
  /** Modules explicitly authorized for this license */
  authorizedModules: string[];
  /** Geographic region(s) for compliance (e.g., 'ZA' for South Africa) */
  regions: string[];
  /** Whether this is a trial license */
  isTrial: boolean;
  /** License issuer */
  issuer: 'VVU EARTH TECH';
  /** Version of the license schema */
  schemaVersion: number;
}

// ---------------------------------------------------------------------------
// §3 — Signed License
// ---------------------------------------------------------------------------

/**
 * Signed license — a LicensePayload with an Ed25519 signature from the
 * VVU EARTH TECH license authority.
 *
 * The signature is computed over the RFC 8785 canonicalized JSON of the
 * LicensePayload, ensuring deterministic verification.
 */
export interface SignedLicense {
  /** The unsigned license payload */
  payload: LicensePayload;
  /** Ed25519 signature over canonicalized payload */
  signature: string;
  /** Ed25519 public key of the license authority */
  authorityPublicKey: string;
  /** SHA-256 hash of the canonicalized payload */
  payloadHash: string;
  /** Schema version used for signature computation */
  signatureVersion: number;
}

// ---------------------------------------------------------------------------
// §4 — License Validation Result
// ---------------------------------------------------------------------------

/**
 * Result of license validation.
 */
export interface LicenseValidationResult {
  /** Whether the license is valid */
  valid: boolean;
  /** The validated tier (if valid) */
  tier: LicenseTier | null;
  /** List of authorized modules (if valid) */
  authorizedModules: string[];
  /** Error messages (if invalid) */
  errors: string[];
  /** Warning messages */
  warnings: string[];
  /** Whether the license is expired */
  expired: boolean;
  /** Whether the license is a trial */
  isTrial: boolean;
  /** Days remaining until expiration */
  daysRemaining: number;
}

// ---------------------------------------------------------------------------
// §5 — License Authority Configuration
// ---------------------------------------------------------------------------

/**
 * Configuration for the license authority.
 * The public key is used to verify license signatures.
 * The current authority public key is embedded in the validator.
 */
export const LICENSE_SCHEMA_VERSION = 1;
export const SIGNATURE_VERSION = 1;

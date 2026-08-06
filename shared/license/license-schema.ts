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
// commercial). Aligned with the Master Implementation Blueprint.
//
// Tier Structure (per Blueprint):
// - OPEN_SOURCE: Free, Apache 2.0. All OSS modules.
// - PRO: R5,000/mo. TEE + Compliance Automation.
// - ENTERPRISE: R25,000/mo. Multi-node, TEE, ZK, SSO.
// - GOVERNANCE: R100k+/mo. Full autonomy, tokenization, 60/30/10.
// ============================================================================

// ---------------------------------------------------------------------------
// §1 — License Tiers
// ---------------------------------------------------------------------------

/**
 * License tiers for the VVU EARTH TECH platform.
 * Aligned with the Master Implementation Blueprint's commercial tier structure.
 */
export type LicenseTier = 'OPEN_SOURCE' | 'PRO' | 'ENTERPRISE' | 'GOVERNANCE';

/**
 * Human-readable tier descriptions.
 */
export const TIER_DESCRIPTIONS: Record<LicenseTier, string> = {
  OPEN_SOURCE: 'Free tier — Apache 2.0. Access to all open-source modules (air-kernel, epistemic-runtime, safe-krypte-basic, safe-liner-basic, hbk-adapter). No commercial features.',
  PRO: 'Professional tier (R5,000/mo) — 1 Gateway lease, basic HBK detection, TEE Attestation, Compliance Automation.',
  ENTERPRISE: 'Enterprise tier (R25,000/mo) — Multi-node, TEE attestation, ZK proofs (MI300X), Enterprise SSO (SAML/OIDC).',
  GOVERNANCE: 'Governance tier (R100k+/mo) — Full autonomy, tokenization, 60/30/10 revenue share, all commercial features.',
};

// ---------------------------------------------------------------------------
// §2 — Feature Flags (per Blueprint §4)
// ---------------------------------------------------------------------------

/**
 * Feature flags that map to commercial module capabilities.
 * These are the feature names used by the requireFeature() decorator.
 */
export type LicenseFeature =
  | 'TEE_ATTESTATION'
  | 'ZK_PROVER_GPU'
  | 'COMPLIANCE_AUTOMATION'
  | 'ENTERPRISE_SSO'
  | 'TOKENIZATION'
  | 'MULTI_NODE'
  | 'GOVERNANCE_ENGINE';

/**
 * Features available per tier.
 */
export const TIER_FEATURES: Record<LicenseTier, LicenseFeature[]> = {
  OPEN_SOURCE: [],
  PRO: ['TEE_ATTESTATION', 'COMPLIANCE_AUTOMATION'],
  ENTERPRISE: ['TEE_ATTESTATION', 'ZK_PROVER_GPU', 'COMPLIANCE_AUTOMATION', 'ENTERPRISE_SSO', 'MULTI_NODE'],
  GOVERNANCE: ['TEE_ATTESTATION', 'ZK_PROVER_GPU', 'COMPLIANCE_AUTOMATION', 'ENTERPRISE_SSO', 'TOKENIZATION', 'MULTI_NODE', 'GOVERNANCE_ENGINE'],
};

/**
 * Modules available per tier.
 */
export const TIER_MODULES: Record<LicenseTier, string[]> = {
  OPEN_SOURCE: [
    'air-kernel',
    'epistemic-runtime',
    'safe-krypte-basic',
    'safe-liner-basic',
    'hbk-adapter',
  ],
  PRO: [
    'air-kernel',
    'epistemic-runtime',
    'safe-krypte-basic',
    'safe-liner-basic',
    'hbk-adapter',
    'tee-attestation',
    'compliance-automation',
  ],
  ENTERPRISE: [
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
  GOVERNANCE: [
    'air-kernel',
    'epistemic-runtime',
    'safe-krypte-basic',
    'safe-liner-basic',
    'hbk-adapter',
    'tee-attestation',
    'compliance-automation',
    'zk-prover-gpu',
    'enterprise-sso',
    'tokenization',
  ],
};

// ---------------------------------------------------------------------------
// §3 — License Payload (per Blueprint §4)
// ---------------------------------------------------------------------------

/**
 * License payload — the unsigned content of a license.
 *
 * Aligned with Master Blueprint: includes tier, features array,
 * expiresAt, and optional hardwareFingerprint for air-gapped
 * municipal environments.
 */
export interface LicensePayload {
  /** Unique license identifier */
  licenseId: string;
  /** License tier (OPEN_SOURCE, PRO, ENTERPRISE, GOVERNANCE) */
  tier: LicenseTier;
  /** Organization ID */
  organizationId: string;
  /** ISO 8601 timestamp when license was issued */
  issuedAt: string;
  /** ISO 8601 timestamp when license expires */
  expiresAt: string;
  /** Feature flags authorized for this license */
  features: LicenseFeature[];
  /** Hardware fingerprint for air-gapped environments (SHA-256 of system identifiers) */
  hardwareFingerprint?: string;
  /** Number of authorized nodes/gateways */
  seats: number;
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
// §4 — Signed License
// ---------------------------------------------------------------------------

/**
 * Signed license — a LicensePayload with an Ed25519 signature from the
 * VVU EARTH TECH license authority.
 *
 * The signature is computed over the RFC 8785 canonicalized JSON of the
 * LicensePayload, ensuring deterministic verification.
 * Offline-first: no phone-home server required (per Blueprint §4).
 */
export interface SignedLicense {
  /** The unsigned license payload */
  payload: LicensePayload;
  /** Base64 encoded Ed25519 signature over canonicalized payload */
  signature: string;
  /** Ed25519 public key of the license authority */
  authorityPublicKey: string;
  /** SHA-256 hash of the canonicalized payload */
  payloadHash: string;
  /** Schema version used for signature computation */
  signatureVersion: number;
}

// ---------------------------------------------------------------------------
// §5 — License Validation Result
// ---------------------------------------------------------------------------

/**
 * Result of license validation.
 */
export interface LicenseValidationResult {
  /** Whether the license is valid */
  isValid: boolean;
  /** The validated tier (if valid) */
  tier: LicenseTier;
  /** List of authorized features (if valid) */
  features: LicenseFeature[];
  /** List of authorized modules (if valid) */
  authorizedModules: string[];
  /** Error messages (if invalid) */
  errors: string[];
  /** Warning messages */
  warnings: string[];
  /** Failure reason (if invalid) — used by feature gate HF-006 */
  failureReason?: string;
  /** Whether the license is expired */
  expired: boolean;
  /** Whether the license is a trial */
  isTrial: boolean;
  /** Days remaining until expiration */
  daysRemaining: number;
}

// ---------------------------------------------------------------------------
// §6 — Hard Failure Codes (per Blueprint)
// ---------------------------------------------------------------------------

/**
 * Hard Failure codes used by the feature gate and evidence compiler.
 * These are the authoritative error codes that halt execution.
 */
export const HARD_FAILURE_CODES = {
  HF_001: 'Mock boolean detected (No TEE Verifier injected)',
  HF_002: 'ZK Proof verification unavailable (No ZK Prover injected)',
  HF_003: 'Evidence integrity failure',
  HF_004: 'Non-deterministic API detected',
  HF_005: 'WORM violation',
  HF_006: 'Feature BLOCKED (Commercial tier required)',
  HF_007: 'Tenant Boundary Violation',
  HF_008: 'Canonicalization mismatch',
  HF_009: 'Replay divergence',
  HF_010: 'Policy violation',
  HF_011: 'Thermal state suboptimal (DTR failure)',
  HF_012: 'HBK telemetry hash mismatch',
} as const;

export type HardFailureCode = keyof typeof HARD_FAILURE_CODES;

// ---------------------------------------------------------------------------
// §7 — Constants
// ---------------------------------------------------------------------------

export const LICENSE_SCHEMA_VERSION = 1;
export const SIGNATURE_VERSION = 1;

/**
 * Confidence penalty applied when no TEE Verifier is injected (per Blueprint §2).
 * 0.31 = maximum mathematical penalty for unverified TEE attestation.
 */
export const TEE_CONFIDENCE_PENALTY = 0.31;

/**
 * Maximum confidence score when all verifiers are properly injected.
 */
export const MAX_CONFIDENCE_SCORE = 1.0;

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
// VVU EARTH TECH — Safe Krypte Basic (Open Source, Apache 2.0)
// ============================================================================
//
// Safe Krypte Basic provides the open-source signer primitives used by the
// Epistemic Runtime for cryptographic signing and verification of evidence.
//
// These are the basic, self-hosted signer modules:
//   - Ed25519SignerModule  — Ed25519 via @noble/curves (deterministic, sync)
//   - ECDSAP384Signer      — ECDSA P-384 via @noble/curves (deterministic, sync)
//   - RSAPSSSigner         — RSA-PSS-SHA256 via Web Crypto API (async init)
//
// For cloud-managed keys (AWS KMS, IAM Federation, OIDC), see the commercial
// `enterprise-sso` module or the `src/signer/aws-kms.ts` internal implementation.
// ============================================================================

export { Ed25519SignerModule } from '../../src/signer/ed25519';
export { ECDSAP384Signer } from '../../src/signer/ecdsa-p384';
export { RSAPSSSigner } from '../../src/signer/rsa-pss';

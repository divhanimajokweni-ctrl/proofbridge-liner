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
// VVU EARTH TECH — Verifier Registry Interfaces (Shared)
// ============================================================================
//
// Decision 2 (Master Implementation Blueprint): VerifierRegistry DI.
//
// The VerifierRegistry is injected into the EvidenceCompiler for hardware
// verification. In OSS mode (no registry provided), the compiler applies
// confidence penalties per Blueprint §2:
//   - TEE: penalty of 0.31 → confidence = 0.69
//   - ZK:  penalty of 0.31 → confidence = 0.69
//
// Commercial tiers (PRO, ENTERPRISE, GOVERNANCE) inject real VerifierRegistry
// implementations backed by AMD SEV-SNP / Intel SGX TEE attestation and
// MI300X GPU ZK proof verification.
// ============================================================================

// ---------------------------------------------------------------------------
// §1 — VerifierRegistry (Dependency Injection Interface)
// ---------------------------------------------------------------------------

/**
 * VerifierRegistry — injected into the EvidenceCompiler for hardware verification.
 * If not provided (OSS mode), the compiler applies confidence penalties.
 *
 * This interface enables the Golden Rule separation: open-source modules never
 * directly verify TEE/ZK hardware. They delegate to injected verifiers that
 * may be commercial implementations.
 */
export interface VerifierRegistry {
  /**
   * Verify a TEE attestation quote.
   * Returns TEEVerificationResult with platform identification and confidence.
   */
  verifyTEE(quote: Buffer): Promise<TEEVerificationResult>;

  /**
   * Verify a Zero-Knowledge proof.
   * Returns ZKProofResult with prover identification and confidence.
   */
  verifyZKProof(proof: ZKProofInput): Promise<ZKProofResult>;
}

// ---------------------------------------------------------------------------
// §2 — TEE Verification Result
// ---------------------------------------------------------------------------

/**
 * Result of TEE attestation verification.
 *
 * Confidence scoring:
 *   - 1.0 if verified (TEE attestation valid, hardware authenticated)
 *   - 0.69 if not verified (per Blueprint §2: MAX - TEE_CONFIDENCE_PENALTY)
 *
 * Platform identification:
 *   - AMD_SEV_SNP: AMD Secure Encrypted Virtualization - Secure Nested Paging
 *   - INTEL_SGX: Intel Software Guard Extensions
 *   - NONE: No TEE platform detected (OSS fallback)
 */
export interface TEEVerificationResult {
  /** Whether the TEE attestation was verified */
  verified: boolean;
  /** TEE platform identified from the quote */
  platform: 'AMD_SEV_SNP' | 'INTEL_SGX' | 'NONE';
  /** Confidence score: 1.0 if verified, 0.69 if not (per Blueprint §2) */
  confidenceScore: number;
  /** Hard failure code if verification failed */
  failureCode?: 'HF-001';
  /** Additional verification details (platform-specific) */
  details?: Record<string, unknown>;
}

// ---------------------------------------------------------------------------
// §3 — ZK Proof Verification Result
// ---------------------------------------------------------------------------

/**
 * Result of Zero-Knowledge proof verification.
 *
 * Confidence scoring:
 *   - 1.0 if verified (proof valid, GPU-accelerated or CPU-fallback)
 *   - 0.69 if not verified (penalty applied when no prover available)
 *
 * Prover types:
 *   - MI300X_GPU: AMD MI300X accelerator (enterprise tier)
 *   - CPU_FALLBACK: CPU-based verification (enterprise tier, degraded)
 *   - NONE: No ZK prover available (OSS fallback)
 */
export interface ZKProofResult {
  /** Whether the ZK proof was verified */
  verified: boolean;
  /** Prover type used for verification */
  proverType: 'MI300X_GPU' | 'CPU_FALLBACK' | 'NONE';
  /** Confidence score: 1.0 if verified, penalty if not */
  confidenceScore: number;
  /** Hard failure code if verification failed */
  failureCode?: 'HF-002';
  /** Time taken to verify the proof (in milliseconds) */
  proofTimeMs?: number;
}

// ---------------------------------------------------------------------------
// §4 — ZK Proof Input
// ---------------------------------------------------------------------------

/**
 * Input for ZK proof verification.
 *
 * Contains the circuit identifier, public inputs for verification,
 * and the raw proof data buffer. The VerifierRegistry implementation
 * uses these to verify the proof against the circuit's verification key.
 */
export interface ZKProofInput {
  /** Identifier of the ZK circuit (e.g., 'groth16-merkle-inclusion') */
  circuitId: string;
  /** Public inputs required for proof verification */
  publicInputs: Record<string, unknown>;
  /** Raw proof data as binary buffer */
  proofData: Buffer;
}

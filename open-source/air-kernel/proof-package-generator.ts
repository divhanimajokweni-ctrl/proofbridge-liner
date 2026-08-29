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
// VVU EARTH TECH — Proof Package Generator (Decision 10: Proof Package)
// ============================================================================
//
// The Proof Package Generator assembles a deterministic, verifiable payload
// from the runtime state for submission to the ProofBridge smart contract
// (Phase 3: Tokenization, gated by GOVERNANCE tier).
//
// Key responsibilities:
// 1. Assemble the ProofPackage from runtime state (facts, MMR root, metrics)
// 2. Compute reproducibility_hash: SHA-256 of sorted/canonicalized JSON (RFC 8785)
// 3. Compute merkle_root: Merkle root of FactIDs using the MMR
// 4. Ensure deterministic output: same input → same ProofPackage, always
//
// GOLDEN RULE COMPLIANCE:
// - Uses SHA-256 only (never FNV, CRC, or ad-hoc hashing)
// - Uses RFC 8785 canonicalization (never JSON.stringify)
// - Uses MMR for authenticated data structure (never flat arrays)
// ============================================================================

import { computeSHA256, hashPair } from '../../src/lib/kernel/hashing';
import { canonicalize } from '../../src/lib/kernel/canonicalization';

// ---------------------------------------------------------------------------
// §1 — Proof Package Types
// ---------------------------------------------------------------------------

/**
 * Algorithmic manifest — versions of all runtime components.
 * This ensures reproducibility: the same code + same input → same output.
 */
export interface AlgorithmicManifest {
  /** AIR Kernel runtime version */
  runtimeVersion: string;
  /** Policy engine version */
  policyVersion: string;
  /** Compiler/IR version used for policy evaluation */
  compilerVersion: string;
  /** HBK Adapter version */
  hbkVersion: string;
}

/**
 * Evidence stream — the cryptographic backbone of the proof package.
 * Contains references to all facts that contributed to this proof,
 * anchored by their MMR root and projection root.
 */
export interface EvidenceStream {
  /** Array of FactIDs that constitute the evidence base */
  factIds: string[];
  /** MMR root hash of all facts at the time of proof generation */
  factRoot: string;
  /** Projection root hash — hash of all projection states */
  projectionRoot: string;
}

/**
 * Execution metrics — runtime performance and verification status.
 */
export interface ExecutionMetrics {
  /** Confidence score of the assembled evidence (0.0 to 1.0) */
  confidenceScore: number;
  /** Hard failure codes encountered during execution */
  hardFailureCodes: string[];
  /** Total number of evidence items processed */
  evidenceCount: number;
  /** Whether deterministic replay verification passed */
  replayVerified: boolean;
}

/**
 * Proof Package — the complete, deterministic payload for the
 * ProofBridge smart contract.
 *
 * This is the exact data structure that gets submitted to the blockchain
 * for tokenization (Phase 3, GOVERNANCE tier only). Every field is
 * cryptographically anchored:
 * - reproducibility_hash: SHA-256 of canonicalized JSON of the entire package
 * - merkle_root: Merkle root of FactIDs via MMR
 * - factRoot: MMR root of all facts in the evidence stream
 * - projectionRoot: Hash of all projection states
 *
 * The smart contract verifies:
 * 1. reproducibility_hash matches the canonicalized package
 * 2. merkle_root matches the MMR root computed from factIds
 * 3. All hard failure codes are resolved (or explicitly acknowledged)
 * 4. confidenceScore exceeds the minimum threshold
 * 5. replayVerified is true (deterministic replay passed)
 */
export interface ProofPackage {
  /** Current environment state (e.g., thermal, network, regulatory) */
  environment_state: Record<string, unknown>;
  /** Versions of all runtime components */
  algorithmic_manifest: AlgorithmicManifest;
  /** Evidence stream with cryptographic anchors */
  evidence_stream: EvidenceStream;
  /** Execution metrics and verification status */
  execution_metrics: ExecutionMetrics;
  /** SHA-256 of RFC 8785 canonicalized JSON of the entire package
   *  (computed AFTER all other fields are set, using sorted key order) */
  reproducibility_hash: string;
  /** Merkle root of FactIDs — computed via MMR append + root */
  merkle_root: string;
}

// ---------------------------------------------------------------------------
// §2 — Proof Package Generator Configuration
// ---------------------------------------------------------------------------

export interface ProofPackageGeneratorConfig {
  /** AIR Kernel runtime version string */
  runtimeVersion: string;
  /** Policy engine version string */
  policyVersion: string;
  /** Compiler/IR version string */
  compilerVersion: string;
  /** HBK Adapter version string */
  hbkVersion: string;
  /** Minimum confidence score required for proof package submission */
  minimumConfidence: number;
  /** Whether to require replay verification before submission */
  requireReplayVerification: boolean;
}

const DEFAULT_CONFIG: ProofPackageGeneratorConfig = {
  runtimeVersion: '0.8.0',
  policyVersion: '0.8.0',
  compilerVersion: '0.8.0',
  hbkVersion: '0.0.1-placeholder',
  minimumConfidence: 0.7,
  requireReplayVerification: true,
};

// ---------------------------------------------------------------------------
// §3 — Merkle Root Computation
// ---------------------------------------------------------------------------

/**
 * Compute a Merkle root from an array of FactIDs.
 *
 * This uses a standard binary Merkle tree construction:
 * - If factIds is empty, return SHA-256 of "empty_merkle"
 * - Pair adjacent IDs and hash them together using deterministic ordering
 * - Repeat until a single root hash remains
 * - If odd number of elements at any level, duplicate the last element
 *
 * NOTE: For production use, the full MMR (Merkle Mountain Range) from
 * src/lib/kernel/mmr.ts should be used. This simplified Merkle tree
 * is provided for standalone proof package generation where the full
 * MMR is not available.
 */
export function computeMerkleRoot(factIds: string[]): string {
  if (factIds.length === 0) {
    return computeSHA256('empty_merkle');
  }

  if (factIds.length === 1) {
    return computeSHA256(factIds[0]);
  }

  let currentLevel = factIds.map((id) => computeSHA256(id));

  while (currentLevel.length > 1) {
    const nextLevel: string[] = [];

    for (let i = 0; i < currentLevel.length; i += 2) {
      if (i + 1 < currentLevel.length) {
        // Pair and hash using deterministic ordering (hashPair sorts lexicographically)
        nextLevel.push(hashPair(currentLevel[i], currentLevel[i + 1]));
      } else {
        // Odd element — duplicate it (standard Merkle tree practice)
        nextLevel.push(hashPair(currentLevel[i], currentLevel[i]));
      }
    }

    currentLevel = nextLevel;
  }

  return currentLevel[0];
}

// ---------------------------------------------------------------------------
// §4 — Reproducibility Hash Computation
// ---------------------------------------------------------------------------

/**
 * Compute the reproducibility hash of a Proof Package.
 *
 * This is SHA-256 of the RFC 8785 canonicalized JSON of the package,
 * with reproducibility_hash set to "" (placeholder) to avoid circular
 * dependency. The actual hash is computed AFTER canonicalization.
 *
 * The reproducibility hash ensures that the same package, when
 * re-canonicalized on-chain, produces the same hash. This is the
 * core guarantee of the ProofBridge smart contract's verification.
 */
export function computeReproducibilityHash(packageWithoutHash: Omit<ProofPackage, 'reproducibility_hash'>): string {
  // Set reproducibility_hash to placeholder for canonicalization
  const packageForCanonicalization: ProofPackage = {
    ...packageWithoutHash,
    reproducibility_hash: '', // Placeholder — avoids circular hash
  };

  // RFC 8785 canonicalization — deterministic JSON serialization
  const canonicalJson = canonicalize(packageForCanonicalization);

  // SHA-256 of canonical bytes
  return computeSHA256(canonicalJson);
}

// ---------------------------------------------------------------------------
// §5 — ProofPackageGenerator Class
// ---------------------------------------------------------------------------

/**
 * ProofPackageGenerator — assembles deterministic, verifiable Proof Packages
 * from runtime state for submission to the ProofBridge smart contract.
 *
 * This is the exact payload generator for Phase 3 (Tokenization),
 * gated by GOVERNANCE tier license.
 *
 * Deterministic guarantee:
 * Given the same (factIds, mmrRoot, environmentState, metrics, config),
 * this generator ALWAYS produces the same ProofPackage.
 * This is enforced by:
 * 1. RFC 8785 canonicalization for JSON serialization
 * 2. SHA-256 only for all hashing operations
 * 3. Deterministic Merkle tree construction with sorted hash pairs
 * 4. No Date.now(), no Math.random(), no non-deterministic APIs
 *
 * Usage:
 *   const generator = new ProofPackageGenerator();
 *   const package = generator.generate(
 *     factIds,
 *     mmrRoot,
 *     projectionRoot,
 *     environmentState,
 *     metrics,
 *   );
 *   // Submit to ProofBridge smart contract (GOVERNANCE tier)
 */
export class ProofPackageGenerator {
  private config: ProofPackageGeneratorConfig;

  constructor(config: Partial<ProofPackageGeneratorConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Assemble a Proof Package from runtime state.
   *
   * Computes:
   * - reproducibility_hash: SHA-256 of canonicalized JSON (RFC 8785)
   * - merkle_root: Merkle root of FactIDs
   *
   * This is the exact payload for the ProofBridge smart contract
   * (Phase 3: Tokenization, gated by GOVERNANCE tier).
   *
   * @param factIds Array of FactIDs constituting the evidence base
   * @param mmrRoot Current MMR root hash of all facts
   * @param projectionRoot Hash of all projection states
   * @param environmentState Current environment state (thermal, network, regulatory)
   * @param metrics Execution metrics from the runtime
   * @returns A deterministic ProofPackage ready for smart contract submission
   */
  generate(
    factIds: string[],
    mmrRoot: string,
    projectionRoot: string,
    environmentState: Record<string, unknown> = {},
    metrics: Partial<ExecutionMetrics> = {},
  ): ProofPackage {
    // ── Validate minimum confidence ──
    const confidenceScore = metrics.confidenceScore ?? 0.0;
    if (confidenceScore < this.config.minimumConfidence) {
      throw new Error(
        `Proof Package confidence score (${confidenceScore.toFixed(4)}) is below ` +
        `minimum threshold (${this.config.minimumConfidence}). Cannot submit to ProofBridge.`,
      );
    }

    // ── Validate replay verification ──
    const replayVerified = metrics.replayVerified ?? false;
    if (this.config.requireReplayVerification && !replayVerified) {
      throw new Error(
        'Proof Package requires deterministic replay verification to be passed. ' +
        'Cannot submit to ProofBridge without replay verification.',
      );
    }

    // ── Assemble evidence stream ──
    const evidenceStream: EvidenceStream = {
      factIds: [...factIds].sort(), // Deterministic ordering
      factRoot: mmrRoot,
      projectionRoot,
    };

    // ── Assemble algorithmic manifest ──
    const algorithmicManifest: AlgorithmicManifest = {
      runtimeVersion: this.config.runtimeVersion,
      policyVersion: this.config.policyVersion,
      compilerVersion: this.config.compilerVersion,
      hbkVersion: this.config.hbkVersion,
    };

    // ── Assemble execution metrics ──
    const executionMetrics: ExecutionMetrics = {
      confidenceScore,
      hardFailureCodes: metrics.hardFailureCodes ?? [],
      evidenceCount: factIds.length,
      replayVerified,
    };

    // ── Build package without reproducibility_hash ──
    const packageWithoutHash: Omit<ProofPackage, 'reproducibility_hash'> = {
      environment_state: environmentState,
      algorithmic_manifest: algorithmicManifest,
      evidence_stream: evidenceStream,
      execution_metrics: executionMetrics,
      merkle_root: computeMerkleRoot(factIds),
    };

    // ── Compute reproducibility_hash ──
    const reproducibilityHash = computeReproducibilityHash(packageWithoutHash);

    // ── Assemble final Proof Package ──
    const proofPackage: ProofPackage = {
      ...packageWithoutHash,
      reproducibility_hash: reproducibilityHash,
    };

    return proofPackage;
  }

  /**
   * Verify a Proof Package's reproducibility hash.
   *
   * Re-canonicalizes the package (with reproducibility_hash set to "")
   * and computes SHA-256, then compares with the stored hash.
   *
   * This is the verification method that the ProofBridge smart contract
   * will use on-chain to validate submitted proof packages.
   */
  verifyReproducibilityHash(package_: ProofPackage): boolean {
    const expectedHash = computeReproducibilityHash(package_);
    return expectedHash === package_.reproducibility_hash;
  }

  /**
   * Verify a Proof Package's Merkle root.
   *
   * Recomputes the Merkle root from the FactIDs in the evidence stream
   * and compares with the stored merkle_root.
   */
  verifyMerkleRoot(package_: ProofPackage): boolean {
    const expectedRoot = computeMerkleRoot(package_.evidence_stream.factIds);
    return expectedRoot === package_.merkle_root;
  }

  /**
   * Full verification of a Proof Package.
   *
   * Checks:
   * 1. Reproducibility hash matches canonicalized package
   * 2. Merkle root matches computed root from FactIDs
   * 3. Confidence score exceeds minimum threshold
   * 4. Replay verification is passed
   * 5. No unacknowledged hard failure codes
   */
  verify(package_: ProofPackage): {
    isValid: boolean;
    reproducibilityHashValid: boolean;
    merkleRootValid: boolean;
    confidenceValid: boolean;
    replayValid: boolean;
    hardFailureCodes: string[];
    errors: string[];
  } {
    const errors: string[] = [];

    const reproducibilityHashValid = this.verifyReproducibilityHash(package_);
    if (!reproducibilityHashValid) {
      errors.push('Reproducibility hash mismatch — package has been tampered or canonicalization failed');
    }

    const merkleRootValid = this.verifyMerkleRoot(package_);
    if (!merkleRootValid) {
      errors.push('Merkle root mismatch — FactIDs do not match claimed root');
    }

    const confidenceValid = package_.execution_metrics.confidenceScore >= this.config.minimumConfidence;
    if (!confidenceValid) {
      errors.push(
        `Confidence score (${package_.execution_metrics.confidenceScore.toFixed(4)}) ` +
        `below minimum (${this.config.minimumConfidence})`,
      );
    }

    const replayValid = package_.execution_metrics.replayVerified;
    if (!replayValid && this.config.requireReplayVerification) {
      errors.push('Replay verification not passed — deterministic replay required');
    }

    const hardFailureCodes = package_.execution_metrics.hardFailureCodes;
    if (hardFailureCodes.length > 0) {
      errors.push(`Hard failure codes present: ${hardFailureCodes.join(', ')}`);
    }

    const isValid =
      reproducibilityHashValid &&
      merkleRootValid &&
      confidenceValid &&
      replayValid &&
      hardFailureCodes.length === 0;

    return {
      isValid,
      reproducibilityHashValid,
      merkleRootValid,
      confidenceValid,
      replayValid,
      hardFailureCodes,
      errors,
    };
  }

  /**
   * Get the generator configuration.
   */
  getConfig(): ProofPackageGeneratorConfig {
    return { ...this.config };
  }
}

// ---------------------------------------------------------------------------
// §6 — Convenience Factory
// ---------------------------------------------------------------------------

/**
 * Create a ProofPackageGenerator instance with optional configuration.
 */
export function createProofPackageGenerator(
  config?: Partial<ProofPackageGeneratorConfig>,
): ProofPackageGenerator {
  return new ProofPackageGenerator(config);
}

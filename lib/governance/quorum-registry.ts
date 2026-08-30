/**
 * quorum-registry.ts — Stage 1+ m-of-n Multisig for Governance Changes
 *
 * GROUND-UP RATIONALE (read before modifying)
 * ---------------------------------------------------------------------------
 * Stage 0 of TRD-1.0 is single-key custody. That's honest for development
 * but does not meet the "no single party can unilaterally rewrite" claim.
 *
 * Stage 1 migration: 2-of-3 multisignature, where each TSC member holds
 * an independent SafeKrypte-provisioned signing key. The design choices:
 *
 * · m-of-n multisig, not FROST threshold signatures:
 *   - No DKG ceremony needed (keys are independently generated)
 *   - No interactive signing round (aggregate independently-signed payloads)
 *   - Auditable by inspection (Set of known signers is transparent)
 * · Quorum is 2-of-3 by policy, enforced in verify()
 * · Duplicate signature attack explicitly prevented (Set deduplication)
 * · Unknown signers ignored for quorum but logged for audit
 *
 * At Stage 0, the GovernanceStage.Stage0Insufficient guard prevents any
 * code from claiming quorum before 2-of-3 keys are provisioned.
 *
 * Ed25519 signing uses node:crypto (available since Node 22).
 */

import { createPublicKey, verify as nodeVerify } from "node:crypto";

import { RegistryError, RegistryErrorKind } from "./signed-registry";

// ── Governance Stage ───────────────────────────────────────────────────────

export enum GovernanceStage {
  /** Single-key custody (TRD-1.0 Stage 0). No quorum checks. */
  Stage0SingleKey = "Stage0SingleKey",

  /** m-of-n multisig configured. Quorum checks enforced. */
  Stage1Multisig = "Stage1Multisig",

  /**
   * Code is compiled for Stage 1+ but fewer than 2 signers are provisioned.
   * This is a transitional guard: prevents claiming quorum before it's real.
   */
  Stage0Insufficient = "Stage0Insufficient",
}

// ── Signer Registry ────────────────────────────────────────────────────────

export interface RegisteredSigner {
  /** Human-readable label (e.g. "TSC-Member-Alice") */
  label: string;
  /** 32-byte Ed25519 public key as hex */
  publicKeyHex: string;
  /** ISO timestamp when this signer was provisioned */
  provisionedAt: string;
}

export interface QuorumConfig {
  /** Required m-of-n */
  required: number; // e.g. 2
  /** Total signers in the registry */
  total: number; // e.g. 3
}

export interface AggregatedSignature {
  /** Version of the registry being signed (must match all signers) */
  registryVersion: string;
  /** ISO timestamp of the earliest signature in the set */
  aggregatedAt: string;
  /** Individual signatures, keyed by signer public key hex */
  signatures: Record<string, {
    /** 64-byte Ed25519 signature as hex */
    sigHex: string;
    /** ISO timestamp when this signer produced their signature */
    signedAt: string;
    /** Signer label for human readability */
    signerLabel: string;
  }>;
}

// ── DER wrapper helpers ───────────────────────────────────────────────────

/**
 * Build an Ed25519 SPKI DER structure from raw 32-byte key bytes.
 * SPKI = 30 2A 30 05 06 03 2B 65 70 03 21 00 [32 bytes]
 */
function buildSpkiDer(raw32: ArrayLike<number>): Buffer {
  const out = Buffer.alloc(44);
  out[0] = 0x30; out[1] = 0x2a;
  out[2] = 0x30; out[3] = 0x05; out[4] = 0x06;
  out[5] = 0x03; out[6] = 0x2b; out[7] = 0x65; out[8] = 0x70;
  out[9] = 0x03; out[10] = 0x21; out[11] = 0x00;
  for (let i = 0; i < 32; i++) {
    out[12 + i] = raw32[i];
  }
  return out;
}

// ── Signer Registry (in-memory store) ────────────────────────────────────

const _signers: Map<string, RegisteredSigner> = new Map();

/**
 * Register a new governance signer. At Stage 1+, used during TSC member
 * onboarding. At Stage 0, this is how the Founder provisions additional
 * signers before the migration.
 */
export function registerSigner(signer: RegisteredSigner): void {
  if (_signers.has(signer.publicKeyHex)) {
    throw new Error(
      `Signer already registered: ${signer.label} (${signer.publicKeyHex.slice(0, 8)}...)`,
    );
  }
  _signers.set(signer.publicKeyHex, signer);
}

/**
 * Get current governance stage based on how many signers are provisioned.
 */
export function getGovernanceStage(): GovernanceStage {
  const count = _signers.size;

  if (count === 0) {
    return GovernanceStage.Stage0SingleKey;
  }

  if (count < 2) {
    return GovernanceStage.Stage0Insufficient;
  }

  return GovernanceStage.Stage1Multisig;
}

/**
 * Get the current quorum configuration.
 * At Stage 0, quorum is not applicable — returns null.
 * At Stage 1, quorum is 2-of-N.
 */
export function getQuorumConfig(): QuorumConfig | null {
  const stage = getGovernanceStage();
  if (stage === GovernanceStage.Stage0SingleKey) {
    return null;
  }
  return {
    required: Math.min(2, _signers.size),
    total: _signers.size,
  };
}

/**
 * Verify an aggregated multisignature against the registered signer set.
 *
 * Rules:
 *   - Only signers in the RegisteredSigner set count toward quorum.
 *   - Duplicate signatures from the same signer are counted once.
 *   - Unknown signers are logged but do not contribute to quorum.
 *   - Registry version must be identical across all collected signatures.
 */
export async function verifyAggregatedSignature(
  agg: AggregatedSignature,
): Promise<{ valid: boolean; quorumMet: boolean; signersUsed: number; unknownSigners: string[] }> {
  const stage = getGovernanceStage();

  // Guard: if we're in Stage0Insufficient, fail closed.
  if (stage === GovernanceStage.Stage0Insufficient) {
    throw new Error(
      "Governance stage is Stage0Insufficient: quorum cannot be met. " +
      `Provisioned signers: ${_signers.size}, required: 2.`,
    );
  }

  // At Stage 0, skip quorum (single-key signing handles this).
  if (stage === GovernanceStage.Stage0SingleKey) {
    return { valid: false, quorumMet: false, signersUsed: 0, unknownSigners: [] };
  }

  const payloadBytes = Buffer.from(agg.registryVersion);
  const knownSigners = new Set(_signers.keys());
  const validSigners = new Set<string>();
  const unknownSigners: string[] = [];

  for (const [pubKeyHex, sigEntry] of Object.entries(agg.signatures)) {
    if (!knownSigners.has(pubKeyHex)) {
      unknownSigners.push(pubKeyHex);
      continue;
    }

    // Verify individual signature
    const pubKeyBytes = Buffer.from(pubKeyHex, "hex");
    const spki = buildSpkiDer(pubKeyBytes);
    const key = createPublicKey({ key: spki, format: "der", type: "spki" });
    const sigBytes = Buffer.from(sigEntry.sigHex, "hex");

    // Use new Uint8Array to avoid strict TS Buffer type incompatibility with ArrayBufferView
    const verifyPayload = new Uint8Array(payloadBytes);
    const verifySig = new Uint8Array(sigBytes);
    const valid = nodeVerify(null, verifyPayload, key, verifySig);
    if (valid) {
      validSigners.add(pubKeyHex);
    }
  }

  const quorumConfig = getQuorumConfig()!;
  const quorumMet = validSigners.size >= quorumConfig.required;

  return {
    valid: quorumMet,
    quorumMet,
    signersUsed: validSigners.size,
    unknownSigners,
  };
}

// ── Reset (for testing) ────────────────────────────────────────────────────

export function _resetSignersForTest(): void {
  _signers.clear();
}

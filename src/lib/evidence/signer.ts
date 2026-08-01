// src/lib/evidence/signer.ts
// ───────────────────────────────────────────────────────────────
// Epistemic Runtime — Evidence Digital Signing
// Ed25519 signing of envelope hashes for cryptographic proof.
// Adapted from proofbridge-liner: uses kernel SignerProvider
// interface instead of node:crypto directly. No Date.now() or
// crypto.randomUUID() — all injected via providers.
// ───────────────────────────────────────────────────────────────

import type { SignerProvider, ClockProvider } from '@/lib/kernel/types';
import { hashExecutionEnvelope } from './hashing';
import type { UnsignedEnvelope, ExecutionEnvelope } from './envelope';

// ─── Signer Interface ─────────────────────────────────────────

export interface EvidenceSigner {
  sign(
    envelope: UnsignedEnvelope,
  ): Promise<{ signature: string; signing_key_id: string }>;

  verify(envelope: ExecutionEnvelope): Promise<boolean>;

  getPublicKey(): Promise<string>;
}

// ─── Kernel-Backed Evidence Signer ────────────────────────────

/**
 * EvidenceSigner implementation backed by the kernel's SignerProvider.
 * Delegates all crypto operations to the injected signer, keeping the
 * evidence layer as a thin adapter over the deterministic kernel.
 */
export class KernelEvidenceSigner implements EvidenceSigner {
  private kernelSigner: SignerProvider;
  private keyId: string;

  constructor(kernelSigner: SignerProvider) {
    this.kernelSigner = kernelSigner;
    // Derive a stable key ID from the public key hash
    this.keyId = `ed25519-${kernelSigner.getPublicKey().slice(0, 16)}`;
  }

  /**
   * Sign an unsigned envelope.
   * Hashes stages 1-6, then signs the hash via the kernel signer.
   */
  async sign(
    envelope: UnsignedEnvelope,
  ): Promise<{ signature: string; signing_key_id: string }> {
    const hash = hashExecutionEnvelope(envelope);
    const signature = this.kernelSigner.sign(hash);
    return {
      signature,
      signing_key_id: this.keyId,
    };
  }

  /**
   * Verify a signed envelope's signature.
   * Recomputes the hash from stages 1-6 and checks via kernel signer.
   */
  async verify(envelope: ExecutionEnvelope): Promise<boolean> {
    try {
      const unsignedContent: UnsignedEnvelope = {
        envelope_id: envelope.envelope_id,
        tenant_id: envelope.tenant_id,
        capability_id: envelope.capability_id,
        agent_id: envelope.agent_id,
        goal_id: envelope.goal_id,
        request: envelope.request,
        policy_decision: envelope.policy_decision,
        selected_model: envelope.selected_model,
        tool_calls: envelope.tool_calls,
        output: envelope.output,
        validation: envelope.validation,
      };

      const expectedHash = hashExecutionEnvelope(unsignedContent);

      // Verify hash matches
      if (expectedHash !== envelope.envelope_hash) {
        return false;
      }

      // Verify signature via kernel signer
      return this.kernelSigner.verify(
        envelope.envelope_hash,
        envelope.digital_signature,
        this.kernelSigner.getPublicKey(),
      );
    } catch {
      return false;
    }
  }

  /**
   * Get the public key in hex format (for third-party verification).
   */
  async getPublicKey(): Promise<string> {
    return this.kernelSigner.getPublicKey();
  }

  /**
   * Get the key ID.
   */
  getKeyId(): string {
    return this.keyId;
  }
}

// ─── Signing Helper ───────────────────────────────────────────

/**
 * Sign an envelope and return the full signed ExecutionEnvelope.
 * Uses injected clock provider for timestamps (no Date.now()).
 */
export async function signEnvelope(
  envelope: UnsignedEnvelope,
  signer: EvidenceSigner,
  clock: ClockProvider,
): Promise<ExecutionEnvelope> {
  const envelopeHash = hashExecutionEnvelope(envelope);
  const { signature, signing_key_id } = await signer.sign(envelope);
  const now = clock.now();

  return {
    ...envelope,
    envelope_hash: envelopeHash,
    digital_signature: signature,
    signing_key_id,
    created_at: now,
    signed_at: now,
  };
}

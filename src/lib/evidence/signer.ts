// src/lib/evidence/signer.ts
// ───────────────────────────────────────────────────────────────
// BOTTLENECK 1: Evidence Digital Signing
// ED25519 signing of envelope hashes for cryptographic proof.
// Uses node:crypto built-in (no external dependencies).
// ───────────────────────────────────────────────────────────────

import {
  generateKeyPairSync,
  sign,
  verify,
  type KeyObject,
} from "node:crypto";
import { hashExecutionEnvelope } from "./hashing";
import type { UnsignedEnvelope, ExecutionEnvelope } from "./envelope";

// ─── Signer Interface ─────────────────────────────────────────

export interface EvidenceSigner {
  sign(
    envelope: UnsignedEnvelope,
  ): Promise<{ signature: string; signing_key_id: string }>;

  verify(envelope: ExecutionEnvelope): Promise<boolean>;

  getPublicKey(): Promise<string>;
}

// ─── Node Crypto Implementation ───────────────────────────────

export class NodeCryptoEvidenceSigner implements EvidenceSigner {
  private privateKey: KeyObject;
  private publicKeyObj: KeyObject;
  private publicKeyHex: string;
  private keyId: string;

  constructor() {
    const keypair = generateKeyPairSync("ed25519");
    this.privateKey = keypair.privateKey;
    this.publicKeyObj = keypair.publicKey;

    // Export public key as raw 32-byte hex for compact representation
    const rawPub = this.publicKeyObj.export({
      type: "spki",
      format: "der",
    }) as Buffer;
    // Ed25519 SPKI DER: last 32 bytes are the raw public key
    const raw32 = rawPub.subarray(rawPub.length - 32);
    this.publicKeyHex = raw32.toString("hex");

    // Key ID is first 8 bytes of public key hash
    const { createHash } = require("node:crypto");
    this.keyId =
      "ed25519-" +
      createHash("sha256")
        .update(raw32)
        .digest("hex")
        .substring(0, 16);
  }

  /**
   * Sign an unsigned envelope.
   * Hashes stages 1-6, then signs the hash with ED25519.
   */
  async sign(
    envelope: UnsignedEnvelope,
  ): Promise<{ signature: string; signing_key_id: string }> {
    const hash = hashExecutionEnvelope(envelope);
    const hashBuffer = Buffer.from(hash, "hex");

    const signatureBuffer = sign(null, hashBuffer, this.privateKey) as Buffer;

    return {
      signature: signatureBuffer.toString("base64"),
      signing_key_id: this.keyId,
    };
  }

  /**
   * Verify a signed envelope's signature.
   * Recomputes the hash from stages 1-6 and checks the ED25519 signature.
   */
  async verify(envelope: ExecutionEnvelope): Promise<boolean> {
    try {
      // Recompute the hash from the unsigned content
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

      // Verify signature
      const hashBuffer = Buffer.from(envelope.envelope_hash, "hex");
      const signatureBuffer = Buffer.from(envelope.digital_signature, "base64");

      return verify(null, hashBuffer, this.publicKeyObj, signatureBuffer);
    } catch {
      return false;
    }
  }

  /**
   * Get the public key in hex format (for third-party verification).
   */
  async getPublicKey(): Promise<string> {
    return this.publicKeyHex;
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
 */
export async function signEnvelope(
  envelope: UnsignedEnvelope,
  signer: EvidenceSigner,
): Promise<ExecutionEnvelope> {
  const envelopeHash = hashExecutionEnvelope(envelope);
  const { signature, signing_key_id } = await signer.sign(envelope);

  return {
    ...envelope,
    envelope_hash: envelopeHash,
    digital_signature: signature,
    signing_key_id,
    created_at: new Date(),
    signed_at: new Date(),
  };
}

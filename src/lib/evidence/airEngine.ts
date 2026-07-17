// src/lib/evidence/airEngine.ts
// ───────────────────────────────────────────────────────────────
// BOTTLENECK 1: AIR (Automated Integrity Review) Engine
// Compiled engine that combines types, hashing, signing, and ledger
// for end-to-end evidence envelope management.
// ───────────────────────────────────────────────────────────────

import { createHash, generateKeyPairSync, sign, verify } from "node:crypto";
import {
  buildUnsignedEnvelope,
  type UnsignedEnvelope,
  type ExecutionEnvelope,
  type RequestStage,
  type PolicyDecisionStage,
  type ModelStage,
  type ToolCallStage,
  type OutputStage,
  type ValidationStage,
} from "./envelope";

// ─── AIR-Specific Stage Types ──────────────────────────────────

export interface TeeAttestationStage {
  enclave_id: string;
  attestation_report: string;
  policy_hash: string;
  timestamp: Date;
}

export interface ZkProofStage {
  proof_hash: string;
  proof_system: "groth16" | "plonk" | "bulletproofs";
  verified: boolean;
  timestamp: Date;
}

export interface BayesianSafetyStage {
  hazard_probability: number;
  confidence_interval: [number, number];
  model_version: string;
  timestamp: Date;
}

// ─── AIR Envelope (extends base envelope with TEE/ZK/Bayesian) ──

export interface ProofBridgeAirEnvelope extends ExecutionEnvelope {
  tee_attestation?: TeeAttestationStage;
  zk_proof?: ZkProofStage;
  bayesian_safety?: BayesianSafetyStage;
  air_metadata: {
    engine_version: string;
    pipeline_id: string;
    run_id: string;
  };
}

// ─── AIR Evidence Signer ────────────────────────────────────────

export interface AirEvidenceSigner {
  sign(envelope: UnsignedEnvelope): Promise<{ signature: string; key_id: string }>;
  verify(envelope: ProofBridgeAirEnvelope): Promise<boolean>;
  getPublicKey(): Promise<string>;
  getKeyId(): string;
}

export class NodeCryptoAirEvidenceSigner implements AirEvidenceSigner {
  private privateKey: ReturnType<typeof generateKeyPairSync>["privateKey"];
  private publicKeyObj: ReturnType<typeof generateKeyPairSync>["publicKey"];
  private publicKeyHex: string;
  private keyId: string;

  constructor(privateKeyPem?: string) {
    const keypair = generateKeyPairSync("ed25519");
    this.privateKey = keypair.privateKey;
    this.publicKeyObj = keypair.publicKey;

    const rawPub = this.publicKeyObj.export({
      type: "spki",
      format: "der",
    }) as Buffer;
    const raw32 = rawPub.subarray(rawPub.length - 32);
    this.publicKeyHex = raw32.toString("hex");

    this.keyId =
      "air-ed25519-" +
      createHash("sha256")
        .update(raw32)
        .digest("hex")
        .substring(0, 16);
  }

  async sign(envelope: UnsignedEnvelope): Promise<{ signature: string; key_id: string }> {
    const hash = computeEnvelopeHash(envelope);
    const hashBuffer = Buffer.from(hash, "hex");
    const signatureBuffer = sign(null, hashBuffer, this.privateKey) as Buffer;
    return {
      signature: signatureBuffer.toString("base64"),
      key_id: this.keyId,
    };
  }

  async verify(envelope: ProofBridgeAirEnvelope): Promise<boolean> {
    try {
      const { tee_attestation, zk_proof, bayesian_safety, air_metadata, ...baseEnvelope } = envelope;
      const expectedHash = computeEnvelopeHash(baseEnvelope);
      if (expectedHash !== envelope.envelope_hash) return false;

      const hashBuffer = Buffer.from(envelope.envelope_hash, "hex");
      const signatureBuffer = Buffer.from(envelope.digital_signature, "base64");
      return verify(null, hashBuffer, this.publicKeyObj, signatureBuffer);
    } catch {
      return false;
    }
  }

  async getPublicKey(): Promise<string> {
    return this.publicKeyHex;
  }

  getKeyId(): string {
    return this.keyId;
  }
}

// ─── AIR Evidence Ledger ────────────────────────────────────────

export interface AirLedgerEntry {
  entry_id: string;
  envelope_id: string;
  envelope_hash: string;
  stage: string;
  timestamp: Date;
  metadata: Record<string, unknown>;
}

export interface AirEvidenceLedgerStorage {
  append(entry: AirLedgerEntry): Promise<void>;
  getByEnvelopeId(envelopeId: string): Promise<AirLedgerEntry[]>;
  getAll(): Promise<AirLedgerEntry[]>;
}

export class InMemoryAirEvidenceLedger implements AirEvidenceLedgerStorage {
  private entries: AirLedgerEntry[] = [];

  async append(entry: AirLedgerEntry): Promise<void> {
    this.entries.push(entry);
  }

  async getByEnvelopeId(envelopeId: string): Promise<AirLedgerEntry[]> {
    return this.entries.filter((e) => e.envelope_id === envelopeId);
  }

  async getAll(): Promise<AirLedgerEntry[]> {
    return [...this.entries];
  }
}

// ─── Hash Computation ──────────────────────────────────────────

export function computeEnvelopeHash(envelope: UnsignedEnvelope): string {
  const canonical = JSON.stringify(envelope, Object.keys(envelope).sort());
  return createHash("sha256").update(canonical).digest("hex");
}

// ─── AIR Engine ────────────────────────────────────────────────

export interface AirEngineConfig {
  signer?: AirEvidenceSigner;
  ledger?: AirEvidenceLedgerStorage;
  engineVersion?: string;
}

export class ProofBridgeAirEngine {
  private signer: AirEvidenceSigner;
  private ledger: AirEvidenceLedgerStorage;
  private engineVersion: string;

  constructor(config?: AirEngineConfig) {
    this.signer = config?.signer ?? new NodeCryptoAirEvidenceSigner();
    this.ledger = config?.ledger ?? new InMemoryAirEvidenceLedger();
    this.engineVersion = config?.engineVersion ?? "1.0.0";
  }

  getLedger(): AirEvidenceLedgerStorage {
    return this.ledger;
  }

  getSigner(): AirEvidenceSigner {
    return this.signer;
  }

  /**
   * Create a signed AIR envelope from an unsigned envelope + optional AIR stages.
   */
  async createEnvelope(
    params: {
      tenantId: string;
      capabilityId: string;
      agentId?: string;
      goalId?: string;
      prompt: string;
      tools?: string[];
      modelId?: string;
      provider?: string;
      routingReason?: string;
      policyDecision?: Partial<PolicyDecisionStage>;
      output?: Partial<OutputStage>;
      validation?: Partial<ValidationStage>;
      teeAttestation?: TeeAttestationStage;
      zkProof?: ZkProofStage;
      bayesianSafety?: BayesianSafetyStage;
      pipelineId?: string;
    }
  ): Promise<ProofBridgeAirEnvelope> {
    const unsigned = buildUnsignedEnvelope({
      tenant_id: params.tenantId,
      capability_id: params.capabilityId,
      agent_id: params.agentId,
      goal_id: params.goalId,
      prompt: params.prompt,
      tools: params.tools,
      model_id: params.modelId,
      provider: params.provider,
      routing_reason: params.routingReason,
      policy_decision: params.policyDecision,
      output: params.output,
      validation: params.validation,
    });

    const { signature, key_id } = await this.signer.sign(unsigned);
    const envelopeHash = computeEnvelopeHash(unsigned);

    const airEnvelope: ProofBridgeAirEnvelope = {
      ...unsigned,
      envelope_hash: envelopeHash,
      digital_signature: signature,
      signing_key_id: key_id,
      created_at: new Date(),
      signed_at: new Date(),
      tee_attestation: params.teeAttestation,
      zk_proof: params.zkProof,
      bayesian_safety: params.bayesianSafety,
      air_metadata: {
        engine_version: this.engineVersion,
        pipeline_id: params.pipelineId ?? "default",
        run_id: crypto.randomUUID(),
      },
    };

    // Commit to ledger
    await this.ledger.append({
      entry_id: crypto.randomUUID(),
      envelope_id: airEnvelope.envelope_id,
      envelope_hash: airEnvelope.envelope_hash,
      stage: "created",
      timestamp: new Date(),
      metadata: { engine_version: this.engineVersion },
    });

    return airEnvelope;
  }

  /**
   * Verify an AIR envelope's integrity and signature.
   */
  async verifyEnvelope(envelope: ProofBridgeAirEnvelope): Promise<{
    valid: boolean;
    reasons: string[];
  }> {
    const reasons: string[] = [];

    // Verify hash
    const { tee_attestation, zk_proof, bayesian_safety, air_metadata, ...baseEnvelope } = envelope;
    const expectedHash = computeEnvelopeHash(baseEnvelope);
    if (expectedHash !== envelope.envelope_hash) {
      reasons.push("Hash mismatch");
    }

    // Verify signature
    const sigValid = await this.signer.verify(envelope);
    if (!sigValid) {
      reasons.push("Signature verification failed");
    }

    // Verify TEE attestation if present
    if (envelope.tee_attestation) {
      if (!envelope.tee_attestation.enclave_id) {
        reasons.push("TEE attestation missing enclave_id");
      }
      if (!envelope.tee_attestation.attestation_report) {
        reasons.push("TEE attestation missing attestation_report");
      }
    }

    // Verify ZK proof if present
    if (envelope.zk_proof) {
      if (!envelope.zk_proof.proof_hash) {
        reasons.push("ZK proof missing proof_hash");
      }
      if (!["groth16", "plonk", "bulletproofs"].includes(envelope.zk_proof.proof_system)) {
        reasons.push("ZK proof has invalid proof_system");
      }
    }

    // Verify Bayesian safety if present
    if (envelope.bayesian_safety) {
      const bs = envelope.bayesian_safety;
      if (bs.hazard_probability < 0 || bs.hazard_probability > 1) {
        reasons.push("Bayesian hazard_probability out of range [0, 1]");
      }
      if (bs.confidence_interval[0] > bs.confidence_interval[1]) {
        reasons.push("Bayesian confidence_interval lower bound > upper bound");
      }
    }

    return {
      valid: reasons.length === 0,
      reasons,
    };
  }
}

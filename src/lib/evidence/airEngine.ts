// src/lib/evidence/airEngine.ts
// ───────────────────────────────────────────────────────────────
// Epistemic Runtime — AIR (Automated Integrity Review) Engine
// Compiled engine that combines types, hashing, signing, and ledger
// for end-to-end evidence envelope management.
// Adapted from proofbridge-liner: uses kernel providers instead of
// node:crypto, Date.now(), crypto.randomUUID(), or Math.random().
// ───────────────────────────────────────────────────────────────

import { canonicalize } from '@/lib/kernel/canonicalization';
import { computeSHA256 } from '@/lib/kernel/hashing';
import type { SignerProvider, ClockProvider, UuidProvider } from '@/lib/kernel/types';
import {
  buildUnsignedEnvelope,
  type UnsignedEnvelope,
  type ExecutionEnvelope,
  type PolicyDecisionStage,
  type OutputStage,
  type ValidationStage,
  type EnvelopeProviders,
} from './envelope';
import type { EvidenceSigner } from './signer';

// ─── AIR-Specific Stage Types ──────────────────────────────────

export interface TeeAttestationStage {
  enclave_id: string;
  attestation_report: string;
  policy_hash: string;
  /** Numeric timestamp from injected clock */
  timestamp: number;
}

export interface ZkProofStage {
  proof_hash: string;
  proof_system: 'groth16' | 'plonk' | 'bulletproofs';
  verified: boolean;
  /** Numeric timestamp from injected clock */
  timestamp: number;
}

export interface BayesianSafetyStage {
  hazard_probability: number;
  confidence_interval: [number, number];
  model_version: string;
  /** Numeric timestamp from injected clock */
  timestamp: number;
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

/**
 * AIR Evidence Signer backed by the kernel's SignerProvider.
 * Delegates crypto to the deterministic kernel — no node:crypto.
 */
export class KernelAirEvidenceSigner implements AirEvidenceSigner {
  private kernelSigner: SignerProvider;
  private keyId: string;

  constructor(kernelSigner: SignerProvider) {
    this.kernelSigner = kernelSigner;
    this.keyId = `air-ed25519-${kernelSigner.getPublicKey().slice(0, 16)}`;
  }

  async sign(envelope: UnsignedEnvelope): Promise<{ signature: string; key_id: string }> {
    const hash = computeEnvelopeHash(envelope);
    const signature = this.kernelSigner.sign(hash);
    return {
      signature,
      key_id: this.keyId,
    };
  }

  async verify(envelope: ProofBridgeAirEnvelope): Promise<boolean> {
    try {
      const { tee_attestation, zk_proof, bayesian_safety, air_metadata, ...baseEnvelope } = envelope;
      const expectedHash = computeEnvelopeHash(baseEnvelope);
      if (expectedHash !== envelope.envelope_hash) return false;

      return this.kernelSigner.verify(
        envelope.envelope_hash,
        envelope.digital_signature,
        this.kernelSigner.getPublicKey(),
      );
    } catch {
      return false;
    }
  }

  async getPublicKey(): Promise<string> {
    return this.kernelSigner.getPublicKey();
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
  /** Numeric timestamp from injected clock */
  timestamp: number;
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

/**
 * Compute the envelope hash using kernel's canonicalization and SHA-256.
 */
export function computeEnvelopeHash(envelope: UnsignedEnvelope): string {
  const stages = {
    request: envelope.request,
    policy_decision: envelope.policy_decision,
    selected_model: envelope.selected_model,
    tool_calls: envelope.tool_calls,
    output: envelope.output,
    validation: envelope.validation,
  };
  const canonical = canonicalize(stages);
  return computeSHA256(canonical);
}

// ─── AIR Engine ────────────────────────────────────────────────

export interface AirEngineConfig {
  signer?: AirEvidenceSigner;
  ledger?: AirEvidenceLedgerStorage;
  engineVersion?: string;
  kernelSigner?: SignerProvider;
}

export interface AirEngineProviders {
  clock: ClockProvider;
  uuid: UuidProvider;
}

export class ProofBridgeAirEngine {
  private signer: AirEvidenceSigner;
  private ledger: AirEvidenceLedgerStorage;
  private engineVersion: string;
  private providers: AirEngineProviders;

  constructor(config: AirEngineConfig, providers: AirEngineProviders) {
    // Use provided signer, or create one from kernel signer
    if (config.signer) {
      this.signer = config.signer;
    } else if (config.kernelSigner) {
      this.signer = new KernelAirEvidenceSigner(config.kernelSigner);
    } else {
      throw new Error('AirEngine requires either signer or kernelSigner in config');
    }
    this.ledger = config.ledger ?? new InMemoryAirEvidenceLedger();
    this.engineVersion = config.engineVersion ?? '1.0.0';
    this.providers = providers;
  }

  getLedger(): AirEvidenceLedgerStorage {
    return this.ledger;
  }

  getSigner(): AirEvidenceSigner {
    return this.signer;
  }

  /**
   * Create a signed AIR envelope from an unsigned envelope + optional AIR stages.
   * Uses injected providers — no Date.now(), crypto.randomUUID(), or Math.random().
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
    },
  ): Promise<ProofBridgeAirEnvelope> {
    const envelopeProviders: EnvelopeProviders = {
      clock: this.providers.clock,
      uuid: this.providers.uuid,
    };

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
    }, envelopeProviders);

    const { signature, key_id } = await this.signer.sign(unsigned);
    const envelopeHash = computeEnvelopeHash(unsigned);
    const now = this.providers.clock.now();

    const airEnvelope: ProofBridgeAirEnvelope = {
      ...unsigned,
      envelope_hash: envelopeHash,
      digital_signature: signature,
      signing_key_id: key_id,
      created_at: now,
      signed_at: now,
      tee_attestation: params.teeAttestation,
      zk_proof: params.zkProof,
      bayesian_safety: params.bayesianSafety,
      air_metadata: {
        engine_version: this.engineVersion,
        pipeline_id: params.pipelineId ?? 'default',
        run_id: this.providers.uuid.generate(),
      },
    };

    // Commit to ledger
    await this.ledger.append({
      entry_id: this.providers.uuid.generate(),
      envelope_id: airEnvelope.envelope_id,
      envelope_hash: airEnvelope.envelope_hash,
      stage: 'created',
      timestamp: now,
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
      reasons.push('Hash mismatch');
    }

    // Verify signature
    const sigValid = await this.signer.verify(envelope);
    if (!sigValid) {
      reasons.push('Signature verification failed');
    }

    // Verify TEE attestation if present
    if (envelope.tee_attestation) {
      if (!envelope.tee_attestation.enclave_id) {
        reasons.push('TEE attestation missing enclave_id');
      }
      if (!envelope.tee_attestation.attestation_report) {
        reasons.push('TEE attestation missing attestation_report');
      }
    }

    // Verify ZK proof if present
    if (envelope.zk_proof) {
      if (!envelope.zk_proof.proof_hash) {
        reasons.push('ZK proof missing proof_hash');
      }
      if (!['groth16', 'plonk', 'bulletproofs'].includes(envelope.zk_proof.proof_system)) {
        reasons.push('ZK proof has invalid proof_system');
      }
    }

    // Verify Bayesian safety if present
    if (envelope.bayesian_safety) {
      const bs = envelope.bayesian_safety;
      if (bs.hazard_probability < 0 || bs.hazard_probability > 1) {
        reasons.push('Bayesian hazard_probability out of range [0, 1]');
      }
      if (bs.confidence_interval[0] > bs.confidence_interval[1]) {
        reasons.push('Bayesian confidence_interval lower bound > upper bound');
      }
    }

    return {
      valid: reasons.length === 0,
      reasons,
    };
  }
}

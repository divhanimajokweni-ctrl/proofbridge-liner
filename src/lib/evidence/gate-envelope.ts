// src/lib/evidence/gate-envelope.ts
// ───────────────────────────────────────────────────────────────
// Epistemic Runtime — Gate Integration
// Wraps existing gate evaluation to emit signed evidence envelopes.
// Non-breaking: existing gate functions are called as-is; envelopes
// are generated from their results.
// Adapted from proofbridge-liner: uses injected providers instead
// of Date.now() or crypto.randomUUID().
// ───────────────────────────────────────────────────────────────

import {
  buildUnsignedEnvelope,
  type UnsignedEnvelope,
  type ExecutionEnvelope,
  type PolicyDecisionStage,
  type ValidationStage,
  type EnvelopeProviders,
} from './envelope';
import { signEnvelope, type EvidenceSigner } from './signer';
import {
  InMemoryEvidenceLedger,
  type EvidenceLedgerStorage,
} from './ledger';

// ─── Gate Result Types ────────────────────────────────────────

export interface PolicyGateResult {
  allowed: boolean;
  reason?: string;
  riskScore: number;
  violations: Array<{
    ruleId: string;
    ruleType: string;
    severity: string;
    message: string;
  }>;
  latencyMs: number;
}

export interface ExecutionGateResult {
  allowed: boolean;
  reason?: string;
  verificationStatus: 'pending' | 'verified' | 'rejected';
  violations: Array<{
    ruleId: string;
    severity: string;
    message: string;
  }>;
  latencyMs: number;
}

// ─── Envelope-Emitting Gate Wrapper ───────────────────────────

export class EnvelopeEmittingGate {
  private signer: EvidenceSigner;
  private ledger: EvidenceLedgerStorage;
  private providers: EnvelopeProviders;

  constructor(
    signer: EvidenceSigner,
    providers: EnvelopeProviders,
    ledger?: EvidenceLedgerStorage,
  ) {
    this.signer = signer;
    this.providers = providers;
    this.ledger = ledger ?? new InMemoryEvidenceLedger();
  }

  /**
   * Get the ledger for external access (e.g., verification endpoint).
   */
  getLedger(): EvidenceLedgerStorage {
    return this.ledger;
  }

  /**
   * Wrap a policy gate result with a signed envelope.
   * Call this after enforcePolicyGate() completes.
   */
  async emitPolicyEnvelope(params: {
    tenantId: string;
    capabilityId: string;
    agentId?: string;
    goalId?: string;
    prompt: string;
    tools?: string[];
    modelId?: string;
    provider?: string;
    routingReason?: string;
    result: PolicyGateResult;
    matchedPolicies: string[];
    policyExplanation?: string;
  }): Promise<ExecutionEnvelope> {
    const unsigned: UnsignedEnvelope = buildUnsignedEnvelope({
      tenant_id: params.tenantId,
      capability_id: params.capabilityId,
      agent_id: params.agentId,
      goal_id: params.goalId,
      prompt: params.prompt,
      tools: params.tools,
      model_id: params.modelId,
      provider: params.provider,
      routing_reason: params.routingReason,
      policy_decision: {
        matched_policies: params.matchedPolicies,
        decision: params.result.allowed ? 'allow' : 'deny',
        denied_by: params.result.violations
          .filter((v) => v.severity === 'block')
          .map((v) => v.ruleId),
        policy_explanation:
          params.policyExplanation ?? params.result.reason ?? '',
      },
      validation: {
        validation_score: 1.0 - params.result.riskScore / 100,
        validation_method: 'policy_gate',
        passed: params.result.allowed,
        validation_details: {
          riskScore: params.result.riskScore,
          violations: params.result.violations,
        },
      },
    }, this.providers);

    const signed = await signEnvelope(unsigned, this.signer, this.providers.clock);
    await this.ledger.append(signed);
    return signed;
  }

  /**
   * Wrap an execution gate result with a signed envelope.
   * Call this after enforceExecutionContract() completes.
   */
  async emitExecutionEnvelope(params: {
    tenantId: string;
    capabilityId: string;
    agentId?: string;
    goalId?: string;
    prompt: string;
    tools?: string[];
    modelId?: string;
    provider?: string;
    routingReason?: string;
    result: ExecutionGateResult;
    evidence?: Record<string, unknown>;
  }): Promise<ExecutionEnvelope> {
    const unsigned: UnsignedEnvelope = buildUnsignedEnvelope({
      tenant_id: params.tenantId,
      capability_id: params.capabilityId,
      agent_id: params.agentId,
      goal_id: params.goalId,
      prompt: params.prompt,
      tools: params.tools,
      model_id: params.modelId,
      provider: params.provider,
      routing_reason: params.routingReason,
      validation: {
        validation_score: params.result.allowed ? 1.0 : 0.0,
        validation_method: 'execution_contract',
        passed: params.result.allowed,
        validation_details: {
          verificationStatus: params.result.verificationStatus,
          violations: params.result.violations,
          evidence: params.evidence,
        },
      },
    }, this.providers);

    const signed = await signEnvelope(unsigned, this.signer, this.providers.clock);
    await this.ledger.append(signed);
    return signed;
  }
}

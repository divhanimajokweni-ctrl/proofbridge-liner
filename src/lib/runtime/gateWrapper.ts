// src/lib/runtime/gateWrapper.ts
// ───────────────────────────────────────────────────────────────
// BOTTLENECK 1: Runtime Gate Integration
// Pattern: EnvelopeEmittingGate Integration Wrapper
//
// Intercepts policy orchestration and execution contract paths.
// Emits signed evidence envelopes after evaluation and enforces
// boundary isolation before committing execution blocks.
// ───────────────────────────────────────────────────────────────

import {
  EnvelopeEmittingGate,
  type PolicyGateResult,
  type ExecutionGateResult,
} from "../evidence/gate-envelope";
import type { ExecutionEnvelope } from "../evidence/envelope";
import type { EvidenceSigner } from "../evidence/signer";
import { NodeCryptoEvidenceSigner } from "../evidence/signer";
import type { EvidenceLedgerStorage } from "../evidence/ledger";
import { InMemoryEvidenceLedger } from "../evidence/ledger";

export type { PolicyGateResult, ExecutionGateResult };

// ─── Configuration ─────────────────────────────────────────────

export interface GateWrapperConfig {
  signer?: EvidenceSigner;
  ledger?: EvidenceLedgerStorage;
}

// ─── Shared Ledger + Signer ────────────────────────────────────

const defaultSigner = new NodeCryptoEvidenceSigner();
const defaultLedger = new InMemoryEvidenceLedger();

export const airLedger = defaultLedger;
export const airSigner = defaultSigner;

// ─── Policy Gate with Envelope Emission ────────────────────────

export interface PolicyGateWithEnvelopeResult {
  allowed: boolean;
  reason?: string;
  riskScore: number;
  violations: PolicyGateResult["violations"];
  latencyMs: number;
  envelope?: ExecutionEnvelope;
}

/**
 * Intercepts policy orchestration and emits an unalterable execution envelope trace.
 * Wraps the existing enforcePolicyGate mechanics with envelope emission.
 */
export async function enforcePolicyGateWithEnvelope(params: {
  prompt: string;
  tools?: string[];
  tenantId: string;
  capabilityId: string;
  agentId?: string;
  goalId?: string;
  modelId?: string;
  provider?: string;
  routingReason?: string;
  matchedPolicies: string[];
  gateResult: PolicyGateResult;
  envelopeGate?: EnvelopeEmittingGate;
}): Promise<PolicyGateWithEnvelopeResult> {
  const startTime = Date.now();
  const gate = params.envelopeGate ?? new EnvelopeEmittingGate(defaultSigner, defaultLedger);

  const result: PolicyGateWithEnvelopeResult = {
    allowed: params.gateResult.allowed,
    reason: params.gateResult.reason,
    riskScore: params.gateResult.riskScore,
    violations: params.gateResult.violations,
    latencyMs: params.gateResult.latencyMs,
  };

  // Emit the envelope trace (best-effort, never blocks the gate result)
  try {
    result.envelope = await gate.emitPolicyEnvelope({
      tenantId: params.tenantId,
      capabilityId: params.capabilityId,
      agentId: params.agentId,
      goalId: params.goalId,
      prompt: params.prompt,
      tools: params.tools,
      modelId: params.modelId,
      provider: params.provider,
      routingReason: params.routingReason,
      result: params.gateResult,
      matchedPolicies: params.matchedPolicies,
      policyExplanation: params.gateResult.reason,
    });
  } catch {
    // Envelope emission failure is non-fatal
  }

  return result;
}

// ─── Execution Contract with Boundary Isolation ────────────────

export interface ExecutionContractWithEnvelopeResult {
  allowed: boolean;
  reason?: string;
  verificationStatus: ExecutionGateResult["verificationStatus"];
  violations: ExecutionGateResult["violations"];
  latencyMs: number;
  envelope?: ExecutionEnvelope;
}

/**
 * Enforces contract rules at the execution boundary before committing state anchors.
 * Verifies the envelope exists and is properly isolated before executing the block.
 * Fail-closed: if the envelope is missing or compromised, execution is rejected.
 */
export async function enforceExecutionContractWithEnvelope(params: {
  envelopeId: string;
  executionBlock: () => Promise<unknown>;
  tenantId: string;
  capabilityId: string;
  agentId?: string;
  prompt: string;
  tools?: string[];
  modelId?: string;
  provider?: string;
  routingReason?: string;
  gateResult: ExecutionGateResult;
  envelopeGate?: EnvelopeEmittingGate;
  ledger?: EvidenceLedgerStorage;
}): Promise<{ result: ExecutionContractWithEnvelopeResult; output: unknown }> {
  const startTime = Date.now();
  const ledger = params.ledger ?? defaultLedger;
  const gate = params.envelopeGate ?? new EnvelopeEmittingGate(defaultSigner, ledger);

  // Fail-closed: verify the envelope exists in the ledger
  const currentEnvelope = await ledger.get(params.envelopeId);
  if (!currentEnvelope) {
    return {
      result: {
        allowed: false,
        reason: `Execution Contract Rejected: Envelope ${params.envelopeId} not found in ledger — boundary is compromised or unverified.`,
        verificationStatus: "rejected",
        violations: [{
          ruleId: "envelope_not_found",
          severity: "block",
          message: `Envelope ${params.envelopeId} missing from evidence ledger`,
        }],
        latencyMs: Date.now() - startTime,
      },
      output: null,
    };
  }

  // Fail-closed: verify the envelope signature
  const signer = params.envelopeGate ? defaultSigner : defaultSigner;
  const signatureValid = await defaultSigner.verify(currentEnvelope);
  if (!signatureValid) {
    return {
      result: {
        allowed: false,
        reason: "Execution Contract Rejected: Envelope signature verification failed — boundary is tampered.",
        verificationStatus: "rejected",
        violations: [{
          ruleId: "envelope_signature_invalid",
          severity: "block",
          message: "Envelope digital signature failed verification",
        }],
        latencyMs: Date.now() - startTime,
      },
      output: null,
    };
  }

  // Boundary isolation verified — emit execution envelope and execute
  let envelope: ExecutionEnvelope | undefined;
  try {
    envelope = await gate.emitExecutionEnvelope({
      tenantId: params.tenantId,
      capabilityId: params.capabilityId,
      agentId: params.agentId,
      prompt: params.prompt,
      tools: params.tools,
      modelId: params.modelId,
      provider: params.provider,
      routingReason: params.routingReason,
      result: params.gateResult,
      evidence: {
        sourceEnvelopeId: params.envelopeId,
        sourceEnvelopeHash: currentEnvelope.envelope_hash,
      },
    });
  } catch {
    // Envelope emission failure is non-fatal for execution
  }

  // Execute the isolated transaction block
  const output = await params.executionBlock();

  return {
    result: {
      allowed: params.gateResult.allowed,
      reason: params.gateResult.reason,
      verificationStatus: params.gateResult.verificationStatus,
      violations: params.gateResult.violations,
      latencyMs: Date.now() - startTime,
      envelope,
    },
    output,
  };
}

// ─── Generic GateWrapper Class ─────────────────────────────────

export interface PolicyGateWrapperResult<T> {
  gateResult: T;
  envelope?: ExecutionEnvelope;
  envelopeError?: string;
}

export interface ExecutionGateWrapperResult<T> {
  gateResult: T;
  envelope?: ExecutionEnvelope;
  envelopeError?: string;
}

/**
 * Wraps arbitrary gate evaluation with evidence envelope emission.
 * For typed wrappers, use enforcePolicyGateWithEnvelope / enforceExecutionContractWithEnvelope.
 */
export class GateWrapper {
  private envelopeGate: EnvelopeEmittingGate;

  constructor(config?: GateWrapperConfig) {
    const signer = config?.signer ?? new NodeCryptoEvidenceSigner();
    const ledger = config?.ledger ?? new InMemoryEvidenceLedger();
    this.envelopeGate = new EnvelopeEmittingGate(signer, ledger);
  }

  getEnvelopeGate(): EnvelopeEmittingGate {
    return this.envelopeGate;
  }

  getLedger(): EvidenceLedgerStorage {
    return this.envelopeGate.getLedger();
  }

  async wrapPolicyGate<T extends { allowed: boolean; reason?: string; riskScore?: number; violations?: unknown[]; latencyMs?: number }>(
    gateFn: (...args: unknown[]) => Promise<T>,
    gateArgs: unknown[],
    envelopeParams: {
      tenantId: string;
      capabilityId: string;
      agentId?: string;
      goalId?: string;
      prompt: string;
      tools?: string[];
      modelId?: string;
      provider?: string;
      routingReason?: string;
      matchedPolicies?: string[];
      policyExplanation?: string;
    },
  ): Promise<PolicyGateWrapperResult<T>> {
    const gateResult = await gateFn(...gateArgs);

    try {
      const violations = (gateResult.violations ?? []) as PolicyGateResult["violations"];
      const envelope = await this.envelopeGate.emitPolicyEnvelope({
        tenantId: envelopeParams.tenantId,
        capabilityId: envelopeParams.capabilityId,
        agentId: envelopeParams.agentId,
        goalId: envelopeParams.goalId,
        prompt: envelopeParams.prompt,
        tools: envelopeParams.tools,
        modelId: envelopeParams.modelId,
        provider: envelopeParams.provider,
        routingReason: envelopeParams.routingReason,
        result: {
          allowed: gateResult.allowed,
          reason: gateResult.reason,
          riskScore: gateResult.riskScore ?? 0,
          violations,
          latencyMs: gateResult.latencyMs ?? 0,
        },
        matchedPolicies: envelopeParams.matchedPolicies ?? [],
        policyExplanation: envelopeParams.policyExplanation,
      });

      return { gateResult, envelope };
    } catch (err) {
      return {
        gateResult,
        envelopeError: err instanceof Error ? err.message : String(err),
      };
    }
  }

  async wrapExecutionGate<T extends { allowed: boolean; reason?: string; verificationStatus?: string; violations?: unknown[]; latencyMs?: number }>(
    gateFn: (...args: unknown[]) => Promise<T>,
    gateArgs: unknown[],
    envelopeParams: {
      tenantId: string;
      capabilityId: string;
      agentId?: string;
      goalId?: string;
      prompt: string;
      tools?: string[];
      modelId?: string;
      provider?: string;
      routingReason?: string;
      evidence?: Record<string, unknown>;
    },
  ): Promise<ExecutionGateWrapperResult<T>> {
    const gateResult = await gateFn(...gateArgs);

    try {
      const violations = (gateResult.violations ?? []) as ExecutionGateResult["violations"];
      const envelope = await this.envelopeGate.emitExecutionEnvelope({
        tenantId: envelopeParams.tenantId,
        capabilityId: envelopeParams.capabilityId,
        agentId: envelopeParams.agentId,
        goalId: envelopeParams.goalId,
        prompt: envelopeParams.prompt,
        tools: envelopeParams.tools,
        modelId: envelopeParams.modelId,
        provider: envelopeParams.provider,
        routingReason: envelopeParams.routingReason,
        result: {
          allowed: gateResult.allowed,
          reason: gateResult.reason,
          verificationStatus: (gateResult.verificationStatus ?? "pending") as ExecutionGateResult["verificationStatus"],
          violations,
          latencyMs: gateResult.latencyMs ?? 0,
        },
        evidence: envelopeParams.evidence,
      });

      return { gateResult, envelope };
    } catch (err) {
      return {
        gateResult,
        envelopeError: err instanceof Error ? err.message : String(err),
      };
    }
  }
}

// ─── Singleton Factory ─────────────────────────────────────────

let defaultWrapper: GateWrapper | null = null;

export function getGateWrapper(config?: GateWrapperConfig): GateWrapper {
  if (!defaultWrapper) {
    defaultWrapper = new GateWrapper(config);
  }
  return defaultWrapper;
}

export function resetGateWrapper(): void {
  defaultWrapper = null;
}

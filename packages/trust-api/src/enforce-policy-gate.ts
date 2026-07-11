import type {
  AgentTransactionRequest,
  VerificationPolicy,
  TrustContextReceipt,
} from '@proofbridge/trust-types';
import { RiskEngine, createRiskEngine } from '@proofbridge/trust-runtime';
import { isKillSwitchActive, getKillSwitchState } from './kill-switch';
import { createReceiptGenerator, type TrustReceipt } from '@proofbridge/trust-crypto';

/**
 * enforcePolicyGate — The Single Enforcement Function
 *
 * Every consumer application (Ubuntu Pools, BARTBOT, etc.) calls this
 * function before approving a transaction. It orchestrates:
 *
 * 1. Kill-switch check (in-memory, fast)
 * 2. Context resolution (caller provides the policy)
 * 3. Risk evaluation (RiskEngine 6-gate pipeline)
 * 4. Decision journaling (returns the result for the caller to journal)
 * 5. Receipt generation (cryptographic proof of the decision)
 *
 * This is the architectural equivalent of a firewall: all trust
 * enforcement flows through this single function.
 */

export interface EnforcementGateConfig {
  riskEngine?: RiskEngine;
  receiptSigningKey?: string;
  receiptIssuer?: string;
}

export interface EnforcementRequest {
  transaction: AgentTransactionRequest;
  policy: VerificationPolicy;
  contextId: string;
}

export interface EnforcementResult {
  allowed: boolean;
  receipt?: TrustReceipt;
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

let riskEngine: RiskEngine | null = null;

/**
 * Initialize the enforcement gate with a shared RiskEngine.
 */
export function initEnforcementGate(config: EnforcementGateConfig): void {
  if (config.riskEngine) {
    riskEngine = config.riskEngine;
  }
}

/**
 * The single enforcement function.
 * Call this before approving any transaction.
 */
export async function enforcePolicyGate(
  request: EnforcementRequest,
  config?: EnforcementGateConfig
): Promise<EnforcementResult> {
  const startTime = Date.now();

  // 1. Kill-switch check — fail-closed for safety
  if (isKillSwitchActive()) {
    const ksState = getKillSwitchState();
    return {
      allowed: false,
      reason: `Kill switch active: ${ksState.reason || 'no reason provided'}`,
      riskScore: 100,
      violations: [{
        ruleId: 'kill_switch',
        ruleType: 'kill_switch',
        severity: 'block',
        message: `Kill switch activated by ${ksState.activatedBy || 'unknown'}: ${ksState.reason || 'no reason'}`,
      }],
      latencyMs: Date.now() - startTime,
    };
  }

  // 2. Risk evaluation
  const engine = config?.riskEngine || riskEngine || createRiskEngine();
  const assessment = engine.assessRisk(request.transaction, request.policy);

  // 3. Record transaction for circuit breaker tracking
  engine.recordTransaction(request.transaction.valueETH || 0);

  // 4. Generate receipt if allowed
  let receipt: TrustReceipt | undefined;
  if (assessment.passed && config?.receiptSigningKey) {
    const receiptGen = createReceiptGenerator({
      signingKey: config.receiptSigningKey,
      issuer: config.receiptIssuer || 'enforce-policy-gate',
      version: '1',
    });

    receipt = receiptGen.generate({
      contextId: request.contextId,
      eventId: `enforcement_${Date.now()}`,
      receiptType: 'verification',
      status: 'approved',
      hashChainAnchor: '',
      merkleProof: [],
      latencyMs: Date.now() - startTime,
    });
  }

  return {
    allowed: assessment.passed,
    receipt,
    reason: assessment.violations.length > 0
      ? assessment.violations.map((v) => v.message).join('; ')
      : undefined,
    riskScore: assessment.score,
    violations: assessment.violations.map((v) => ({
      ruleId: v.ruleId,
      ruleType: v.ruleType,
      severity: v.severity,
      message: v.message,
    })),
    latencyMs: Date.now() - startTime,
  };
}

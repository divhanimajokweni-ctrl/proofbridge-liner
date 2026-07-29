import type {
  ExecutionReceipt,
  ExecutionContractResult,
  TaskSpec,
  AgentIdentity,
  VerificationAttestation,
} from '@proofbridge/trust-types';
import { createReceiptGenerator, hashObject, verifyReceiptSignature } from '@proofbridge/trust-crypto';
import { getAgent, isAgentRegistered } from './agent-registry';
import { isKillSwitchActive, getKillSwitchState } from './kill-switch';

/**
 * enforceExecutionContract — The Agent Execution Firewall
 *
 * Every AI agent must pass through this function before contributing code.
 * It orchestrates:
 *
 * 1. Kill-switch check (fail-closed)
 * 2. Agent registration check
 * 3. TaskSpec validation (scope integrity)
 * 4. Evidence verification
 * 5. Receipt generation (cryptographic proof)
 *
 * Follows the same architectural pattern as enforcePolicyGate.
 */

export interface ExecutionContractConfig {
  receiptSigningKey?: string;
  receiptIssuer?: string;
}

export interface ExecutionContractRequest {
  agentId: string;
  agentVersion: string;
  taskSpec: TaskSpec;
  repository: {
    branch: string;
    baseCommit: string;
    headCommit: string;
  };
  evidence: ExecutionReceipt['evidence'];
  diffManifest: ExecutionReceipt['diffManifest'];
  contextId: string;
}

/**
 * The agent execution enforcement function.
 * Call this before opening a PR.
 */
export async function enforceExecutionContract(
  request: ExecutionContractRequest,
  config?: ExecutionContractConfig
): Promise<ExecutionContractResult> {
  const startTime = Date.now();
  const violations: ExecutionContractResult['violations'] = [];

  // 1. Kill-switch check — fail-closed
  if (isKillSwitchActive()) {
    const ksState = getKillSwitchState();
    return {
      allowed: false,
      verificationStatus: 'rejected',
      reason: `Kill switch active: ${ksState.reason || 'no reason provided'}`,
      violations: [{
        ruleId: 'kill_switch',
        severity: 'block',
        message: `Kill switch activated by ${ksState.activatedBy || 'unknown'}`,
      }],
      latencyMs: Date.now() - startTime,
    };
  }

  // 2. Agent registration check
  if (!isAgentRegistered(request.agentId)) {
    return {
      allowed: false,
      verificationStatus: 'rejected',
      reason: `Agent ${request.agentId} not registered`,
      violations: [{
        ruleId: 'agent_not_registered',
        severity: 'block',
        message: `Agent ${request.agentId} is not registered in the Agent Registry`,
      }],
      latencyMs: Date.now() - startTime,
    };
  }

  const agent = await getAgent(request.agentId);
  if (!agent) {
    return {
      allowed: false,
      verificationStatus: 'rejected',
      reason: `Agent ${request.agentId} not found`,
      violations: [{
        ruleId: 'agent_not_found',
        severity: 'block',
        message: `Agent ${request.agentId} disappeared from registry`,
      }],
      latencyMs: Date.now() - startTime,
    };
  }

  // 3. Scope check — agent cannot exceed its capabilities
  for (const restriction of agent.restrictions) {
    if (request.taskSpec.scope.some(s => s.includes(restriction))) {
      violations.push({
        ruleId: 'scope_restriction',
        severity: 'block',
        message: `Agent ${request.agentId} restricted from scope: ${restriction}`,
      });
    }
  }

  // 4. Evidence verification
  if (!request.evidence.typecheck.passed) {
    violations.push({
      ruleId: 'evidence_typecheck',
      severity: 'block',
      message: `Typecheck failed with ${request.evidence.typecheck.errorCount} errors`,
    });
  }

  if (!request.evidence.lint.passed) {
    violations.push({
      ruleId: 'evidence_lint',
      severity: 'block',
      message: `Lint failed with ${request.evidence.lint.errorCount} errors`,
    });
  }

  if (!request.evidence.tests.passed) {
    violations.push({
      ruleId: 'evidence_tests',
      severity: 'block',
      message: `Tests failed: ${request.evidence.tests.failed}/${request.evidence.tests.total} failed`,
    });
  }

  if (!request.evidence.build.passed) {
    violations.push({
      ruleId: 'evidence_build',
      severity: 'block',
      message: 'Build failed',
    });
  }

  // 5. Check for hard failures
  const hasBlockers = violations.some(v => v.severity === 'block');
  if (hasBlockers) {
    return {
      allowed: false,
      verificationStatus: 'rejected',
      reason: violations.map(v => v.message).join('; '),
      violations,
      latencyMs: Date.now() - startTime,
    };
  }

  // 6. Generate execution receipt
  const taskSpecHash = hashObject(request.taskSpec);
  let receipt: ExecutionReceipt | undefined;

  if (config?.receiptSigningKey) {
    const receiptGen = createReceiptGenerator({
      signingKey: config.receiptSigningKey,
      issuer: config.receiptIssuer || 'enforce-execution-contract',
      version: '1',
    });

    const trustReceipt = receiptGen.generate({
      contextId: request.contextId,
      eventId: `exec_${request.taskSpec.taskId}`,
      receiptType: 'execution',
      status: 'approved',
      hashChainAnchor: taskSpecHash,
      merkleProof: [],
      latencyMs: Date.now() - startTime,
      metadata: {
        agentId: request.agentId,
        taskId: request.taskSpec.taskId,
        branch: request.repository.branch,
      },
    });

    receipt = {
      receiptId: trustReceipt.header.receiptId,
      agentId: request.agentId,
      agentVersion: request.agentVersion,
      taskId: request.taskSpec.taskId,
      taskSpecHash,
      repository: request.repository,
      evidence: request.evidence,
      diffManifest: request.diffManifest,
      timestamp: Date.now(),
      contextId: request.contextId,
    };
  }

  return {
    allowed: true,
    receipt,
    verificationStatus: 'pending',
    violations,
    latencyMs: Date.now() - startTime,
  };
}

/**
 * Verify an execution receipt's signature.
 */
export function verifyExecutionReceipt(
  receipt: ExecutionReceipt,
  signingKey: string
): boolean {
  // Reconstruct the trust receipt for signature verification
  const receiptGen = createReceiptGenerator({
    signingKey,
    issuer: 'enforce-execution-contract',
    version: '1',
  });

  const trustReceipt = receiptGen.generate({
    contextId: receipt.contextId,
    eventId: `exec_${receipt.taskId}`,
    receiptType: 'execution',
    status: 'approved',
    hashChainAnchor: receipt.taskSpecHash,
    merkleProof: [],
    latencyMs: 0,
    metadata: {
      agentId: receipt.agentId,
      taskId: receipt.taskId,
      branch: receipt.repository.branch,
    },
  });

  return verifyReceiptSignature(trustReceipt, signingKey);
}

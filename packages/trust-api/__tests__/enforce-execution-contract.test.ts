import { describe, it, expect, beforeEach } from 'vitest';
import { enforceExecutionContract } from '../src/enforce-execution-contract';
import { registerAgent, clearRegistry } from '../src/agent-registry';
import { activateKillSwitch, deactivateKillSwitch } from '../src/kill-switch';
import type { TaskSpec, ExecutionReceipt } from '@proofbridge/trust-types';

function makeTaskSpec(overrides: Partial<TaskSpec> = {}): TaskSpec {
  return {
    taskId: 'task-001',
    description: 'Add agent execution contract',
    scope: ['packages/trust-api'],
    constraints: ['no breaking changes'],
    contextId: 'ctx-001',
    policyId: 'policy-001',
    createdAt: Date.now(),
    ...overrides,
  };
}

function makeEvidence(overrides: Partial<ExecutionReceipt['evidence']> = {}): ExecutionReceipt['evidence'] {
  return {
    typecheck: { passed: true, errorCount: 0 },
    lint: { passed: true, errorCount: 0 },
    tests: { passed: true, total: 10, passedCount: 10, failed: 0 },
    build: { passed: true },
    ...overrides,
  };
}

function makeDiffManifest(): ExecutionReceipt['diffManifest'] {
  return {
    filesChanged: ['src/a.ts', 'src/b.ts'],
    linesAdded: 100,
    linesRemoved: 20,
    testsAdded: 3,
    testsModified: 1,
  };
}

describe('enforceExecutionContract', () => {
  beforeEach(() => {
    clearRegistry();
    deactivateKillSwitch('test', 'cleanup');
  });

  it('allows when all evidence passes and agent is registered', async () => {
    await registerAgent({
      agentId: 'test/impl',
      displayName: 'Test',
      purpose: 'Test',
      capabilities: ['code'],
      restrictions: [],
      signingKeyRef: 'key',
      registeredAt: Date.now(),
    });

    const result = await enforceExecutionContract({
      agentId: 'test/impl',
      agentVersion: '1.0.0',
      taskSpec: makeTaskSpec(),
      repository: { branch: 'feat/x', baseCommit: 'abc', headCommit: 'def' },
      evidence: makeEvidence(),
      diffManifest: makeDiffManifest(),
      contextId: 'ctx-001',
    });

    expect(result.allowed).toBe(true);
    expect(result.verificationStatus).toBe('pending');
    expect(result.violations).toHaveLength(0);
  });

  it('rejects when kill switch is active', async () => {
    activateKillSwitch('founder', 'emergency');

    const result = await enforceExecutionContract({
      agentId: 'test/impl',
      agentVersion: '1.0.0',
      taskSpec: makeTaskSpec(),
      repository: { branch: 'feat/x', baseCommit: 'abc', headCommit: 'def' },
      evidence: makeEvidence(),
      diffManifest: makeDiffManifest(),
      contextId: 'ctx-001',
    });

    expect(result.allowed).toBe(false);
    expect(result.violations[0].ruleId).toBe('kill_switch');
  });

  it('rejects unregistered agent', async () => {
    const result = await enforceExecutionContract({
      agentId: 'unknown/agent',
      agentVersion: '1.0.0',
      taskSpec: makeTaskSpec(),
      repository: { branch: 'feat/x', baseCommit: 'abc', headCommit: 'def' },
      evidence: makeEvidence(),
      diffManifest: makeDiffManifest(),
      contextId: 'ctx-001',
    });

    expect(result.allowed).toBe(false);
    expect(result.violations[0].ruleId).toBe('agent_not_registered');
  });

  it('rejects when typecheck fails', async () => {
    await registerAgent({
      agentId: 'test/impl',
      displayName: 'Test',
      purpose: 'Test',
      capabilities: ['code'],
      restrictions: [],
      signingKeyRef: 'key',
      registeredAt: Date.now(),
    });

    const result = await enforceExecutionContract({
      agentId: 'test/impl',
      agentVersion: '1.0.0',
      taskSpec: makeTaskSpec(),
      repository: { branch: 'feat/x', baseCommit: 'abc', headCommit: 'def' },
      evidence: makeEvidence({ typecheck: { passed: false, errorCount: 3 } }),
      diffManifest: makeDiffManifest(),
      contextId: 'ctx-001',
    });

    expect(result.allowed).toBe(false);
    expect(result.violations[0].ruleId).toBe('evidence_typecheck');
  });

  it('rejects when tests fail', async () => {
    await registerAgent({
      agentId: 'test/impl',
      displayName: 'Test',
      purpose: 'Test',
      capabilities: ['code'],
      restrictions: [],
      signingKeyRef: 'key',
      registeredAt: Date.now(),
    });

    const result = await enforceExecutionContract({
      agentId: 'test/impl',
      agentVersion: '1.0.0',
      taskSpec: makeTaskSpec(),
      repository: { branch: 'feat/x', baseCommit: 'abc', headCommit: 'def' },
      evidence: makeEvidence({ tests: { passed: false, total: 10, passedCount: 7, failed: 3 } }),
      diffManifest: makeDiffManifest(),
      contextId: 'ctx-001',
    });

    expect(result.allowed).toBe(false);
    expect(result.violations[0].ruleId).toBe('evidence_tests');
  });

  it('generates receipt when signing key provided', async () => {
    await registerAgent({
      agentId: 'test/impl',
      displayName: 'Test',
      purpose: 'Test',
      capabilities: ['code'],
      restrictions: [],
      signingKeyRef: 'key',
      registeredAt: Date.now(),
    });

    const result = await enforceExecutionContract(
      {
        agentId: 'test/impl',
        agentVersion: '1.0.0',
        taskSpec: makeTaskSpec(),
        repository: { branch: 'feat/x', baseCommit: 'abc', headCommit: 'def' },
        evidence: makeEvidence(),
        diffManifest: makeDiffManifest(),
        contextId: 'ctx-001',
      },
      { receiptSigningKey: 'test-secret-key', receiptIssuer: 'test' }
    );

    expect(result.allowed).toBe(true);
    expect(result.receipt).toBeDefined();
    expect(result.receipt?.agentId).toBe('test/impl');
    expect(result.receipt?.taskId).toBe('task-001');
  });
});

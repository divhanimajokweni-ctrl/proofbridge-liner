import { describe, it, expect } from 'vitest';
import { generateFounderBrief } from '../src/founder-brief';
import type { TaskSpec, ExecutionReceipt, VerificationAttestation } from '@proofbridge/trust-types';

function makeTaskSpec(): TaskSpec {
  return {
    taskId: 'task-001',
    description: 'Add agent execution contract',
    scope: ['packages/trust-api'],
    constraints: ['no breaking changes'],
    contextId: 'ctx-001',
    policyId: 'policy-001',
    createdAt: Date.now(),
  };
}

function makeReceipt(): ExecutionReceipt {
  return {
    receiptId: 'rcpt_001',
    agentId: 'test/impl',
    agentVersion: '1.0.0',
    taskId: 'task-001',
    taskSpecHash: 'abc123',
    repository: { branch: 'feat/x', baseCommit: 'aaa', headCommit: 'bbb' },
    evidence: {
      typecheck: { passed: true, errorCount: 0 },
      lint: { passed: true, errorCount: 0 },
      tests: { passed: true, total: 10, passedCount: 10, failed: 0 },
      build: { passed: true },
    },
    diffManifest: {
      filesChanged: ['src/a.ts', 'src/b.ts'],
      linesAdded: 100,
      linesRemoved: 20,
      testsAdded: 3,
      testsModified: 1,
    },
    timestamp: Date.now(),
    contextId: 'ctx-001',
  };
}

describe('founder-brief', () => {
  it('generates a complete brief', () => {
    const brief = generateFounderBrief({
      taskSpec: makeTaskSpec(),
      receipt: makeReceipt(),
    });

    expect(brief.taskId).toBe('task-001');
    expect(brief.agentId).toBe('test/impl');
    expect(brief.whatChanged).toContain('2 files');
    expect(brief.whyChanged).toBe('Add agent execution contract');
    expect(brief.howItWorks).toContain('TypeScript type checking passed');
    expect(brief.summary).toContain('test/impl');
  });

  it('includes verification status when attestation provided', () => {
    const attestation: VerificationAttestation = {
      attestationId: 'att-001',
      receiptId: 'rcpt_001',
      verifiedBy: 'validator/1',
      status: 'verified',
      timestamp: Date.now(),
    };

    const brief = generateFounderBrief({
      taskSpec: makeTaskSpec(),
      receipt: makeReceipt(),
      attestation,
    });

    expect(brief.summary).toContain('independently verified');
  });

  it('flags missing verification', () => {
    const brief = generateFounderBrief({
      taskSpec: makeTaskSpec(),
      receipt: makeReceipt(),
    });

    expect(brief.risksRemaining).toContain('Independent verification not yet completed');
  });

  it('flags rejected verification', () => {
    const attestation: VerificationAttestation = {
      attestationId: 'att-002',
      receiptId: 'rcpt_001',
      verifiedBy: 'validator/1',
      status: 'rejected',
      reason: 'Evidence incomplete',
      timestamp: Date.now(),
    };

    const brief = generateFounderBrief({
      taskSpec: makeTaskSpec(),
      receipt: makeReceipt(),
      attestation,
    });

    expect(brief.risksRemaining).toContain('Verification rejected');
  });

  it('describes test failures', () => {
    const receipt = makeReceipt();
    receipt.evidence.tests = { passed: false, total: 10, passedCount: 7, failed: 3 };

    const brief = generateFounderBrief({
      taskSpec: makeTaskSpec(),
      receipt,
    });

    expect(brief.summary).toContain('3 tests failing');
  });

  it('generates one-paragraph summary', () => {
    const brief = generateFounderBrief({
      taskSpec: makeTaskSpec(),
      receipt: makeReceipt(),
    });

    expect(brief.summary).toBeTruthy();
    expect(typeof brief.summary).toBe('string');
    expect(brief.summary.length).toBeGreaterThan(20);
  });
});

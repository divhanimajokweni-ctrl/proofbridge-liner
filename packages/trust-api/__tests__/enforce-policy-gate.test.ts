import { describe, it, expect, vi, beforeEach } from 'vitest';
import { enforcePolicyGate } from '../src/enforce-policy-gate';
import { activateKillSwitch, deactivateKillSwitch } from '../src/kill-switch';
import { createRiskEngine } from '@proofbridge/trust-runtime';
import type {
  AgentTransactionRequest,
  VerificationPolicy,
} from '@proofbridge/trust-types';

function makeRequest(overrides: Partial<AgentTransactionRequest> = {}): AgentTransactionRequest {
  return {
    agentId: 'agent-1',
    contextId: 'ctx-1',
    targetContract: '0x1234567890abcdef1234567890abcdef12345678',
    calldata: '0x',
    valueETH: 0,
    signatureProof: 'trusted-node:sig',
    ...overrides,
  };
}

function makePolicy(rules: VerificationPolicy['rules'] = []): VerificationPolicy {
  return {
    policyId: 'test-policy',
    policyVersion: '1',
    rules,
    circuitBreaker: {
      enabled: false,
      maxTransactionsPerMinute: 100,
      maxVolumePerWindow: 1000,
      windowHours: 24,
      killSwitchEnabled: false,
    },
  };
}

describe('enforcePolicyGate', () => {
  beforeEach(() => {
    deactivateKillSwitch('test', 'reset');
  });

  it('returns allowed=true when risk passes', async () => {
    const result = await enforcePolicyGate({
      transaction: makeRequest(),
      policy: makePolicy(),
      contextId: 'ctx-1',
    });

    expect(result.allowed).toBe(true);
    expect(result.riskScore).toBe(0);
    expect(result.violations).toHaveLength(0);
  });

  it('returns allowed=false when risk fails', async () => {
    const policy = makePolicy([{
      ruleId: 'id-1',
      ruleType: 'identity_proof',
      parameters: { requiredAttestors: [], requireProof: true },
      severity: 'block',
    }]);

    const result = await enforcePolicyGate({
      transaction: makeRequest({ signatureProof: '' }),
      policy,
      contextId: 'ctx-1',
    });

    expect(result.allowed).toBe(false);
    expect(result.riskScore).toBeGreaterThan(0);
    expect(result.violations.length).toBeGreaterThan(0);
  });

  it('kill-switch blocks everything', async () => {
    activateKillSwitch('admin', 'emergency');

    const result = await enforcePolicyGate({
      transaction: makeRequest(),
      policy: makePolicy(),
      contextId: 'ctx-1',
    });

    expect(result.allowed).toBe(false);
    expect(result.riskScore).toBe(100);
    expect(result.violations[0].ruleType).toBe('kill_switch');
    expect(result.reason).toContain('Kill switch active');
  });

  it('receipt generated when allowed + signing key provided', async () => {
    const result = await enforcePolicyGate(
      {
        transaction: makeRequest(),
        policy: makePolicy(),
        contextId: 'ctx-1',
      },
      {
        receiptSigningKey: 'test-signing-key-123',
        receiptIssuer: 'test-issuer',
      }
    );

    expect(result.allowed).toBe(true);
    expect(result.receipt).toBeDefined();
    expect(result.receipt?.header.receiptType).toBe('verification');
    expect(result.receipt?.payload.status).toBe('approved');
  });

  it('no receipt when not allowed', async () => {
    const policy = makePolicy([{
      ruleId: 'id-1',
      ruleType: 'identity_proof',
      parameters: { requiredAttestors: [], requireProof: true },
      severity: 'block',
    }]);

    const result = await enforcePolicyGate(
      {
        transaction: makeRequest({ signatureProof: '' }),
        policy,
        contextId: 'ctx-1',
      },
      {
        receiptSigningKey: 'key',
        receiptIssuer: 'issuer',
      }
    );

    expect(result.allowed).toBe(false);
    expect(result.receipt).toBeUndefined();
  });

  it('latencyMs recorded', async () => {
    const result = await enforcePolicyGate({
      transaction: makeRequest(),
      policy: makePolicy(),
      contextId: 'ctx-1',
    });

    expect(result.latencyMs).toBeTypeOf('number');
    expect(result.latencyMs).toBeGreaterThanOrEqual(0);
  });

  it('violations mapped correctly', async () => {
    const policy = makePolicy([
      {
        ruleId: 'cs-1',
        ruleType: 'calldata_scan',
        parameters: { patterns: ['0xdeadbeef'], blockOnMatch: true },
        severity: 'block',
      },
      {
        ruleId: 'id-1',
        ruleType: 'identity_proof',
        parameters: { requiredAttestors: [], requireProof: true },
        severity: 'block',
      },
    ]);

    const result = await enforcePolicyGate({
      transaction: makeRequest({ calldata: '0xdeadbeef', signatureProof: '' }),
      policy,
      contextId: 'ctx-1',
    });

    expect(result.allowed).toBe(false);
    expect(result.violations.length).toBeGreaterThanOrEqual(2);
    const types = result.violations.map((v) => v.ruleType);
    expect(types).toContain('calldata_scan');
    expect(types).toContain('identity_proof');
  });
});

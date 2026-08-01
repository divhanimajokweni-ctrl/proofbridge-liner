import { describe, it, expect, beforeEach } from 'vitest';
import { RiskEngine, createRiskEngine } from '../src/risk-engine';
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
    signatureProof: 'attestor:sig',
    ...overrides,
  };
}

function makePolicy(rules: VerificationPolicy['rules'], circuitBreaker?: VerificationPolicy['circuitBreaker']): VerificationPolicy {
  return {
    policyId: 'test-policy',
    policyVersion: '1',
    rules,
    circuitBreaker: circuitBreaker || {
      enabled: false,
      maxTransactionsPerMinute: 100,
      maxVolumePerWindow: 1000,
      windowHours: 24,
      killSwitchEnabled: false,
    },
  };
}

describe('RiskEngine', () => {
  let engine: RiskEngine;

  beforeEach(() => {
    engine = createRiskEngine();
  });

  describe('checkRateLimitRule', () => {
    it('passes under threshold', () => {
      const policy = makePolicy([{
        ruleId: 'rl-1',
        ruleType: 'rate_limit',
        parameters: { maxRequests: 10, windowMs: 60_000 },
        severity: 'block',
      }]);

      const result = engine.assessRisk(makeRequest(), policy);
      expect(result.passed).toBe(true);
      expect(result.violations).toHaveLength(0);
    });

    it('blocks over threshold', () => {
      const policy = makePolicy([{
        ruleId: 'rl-1',
        ruleType: 'rate_limit',
        parameters: { maxRequests: 3, windowMs: 60_000 },
        severity: 'block',
      }]);

      for (let i = 0; i < 3; i++) {
        engine.assessRisk(makeRequest(), policy);
      }

      const result = engine.assessRisk(makeRequest(), policy);
      expect(result.passed).toBe(false);
      expect(result.violations.some((v) => v.ruleType === 'rate_limit')).toBe(true);
    });

    it('sliding window expires old entries', () => {
      const policy = makePolicy([{
        ruleId: 'rl-1',
        ruleType: 'rate_limit',
        parameters: { maxRequests: 2, windowMs: 50 },
        severity: 'block',
      }]);

      engine.assessRisk(makeRequest(), policy);
      engine.assessRisk(makeRequest(), policy);

      const blocked = engine.assessRisk(makeRequest(), policy);
      expect(blocked.passed).toBe(false);

      // Wait for window to expire
      return new Promise<void>((resolve) => {
        setTimeout(() => {
          const after = engine.assessRisk(makeRequest(), policy);
          expect(after.passed).toBe(true);
          resolve();
        }, 60);
      });
    });
  });

  describe('checkCalldataScanRule', () => {
    it('passes clean calldata', () => {
      const policy = makePolicy([{
        ruleId: 'cs-1',
        ruleType: 'calldata_scan',
        parameters: { patterns: ['0xdeadbeef'], blockOnMatch: true },
        severity: 'block',
      }]);

      const result = engine.assessRisk(makeRequest({ calldata: '0x12345678' }), policy);
      expect(result.passed).toBe(true);
    });

    it('blocks suspicious patterns', () => {
      const policy = makePolicy([{
        ruleId: 'cs-1',
        ruleType: 'calldata_scan',
        parameters: { patterns: ['0xdeadbeef', 'transfer\\('], blockOnMatch: true },
        severity: 'block',
      }]);

      const result = engine.assessRisk(makeRequest({ calldata: '0xdeadbeef1234' }), policy);
      expect(result.passed).toBe(false);
      expect(result.violations[0].ruleType).toBe('calldata_scan');
    });

    it('passes when calldata is empty', () => {
      const policy = makePolicy([{
        ruleId: 'cs-1',
        ruleType: 'calldata_scan',
        parameters: { patterns: ['.*'], blockOnMatch: true },
        severity: 'block',
      }]);

      const result = engine.assessRisk(makeRequest({ calldata: '' }), policy);
      expect(result.passed).toBe(true);
    });
  });

  describe('checkIdentityProofRule', () => {
    it('passes valid signature format + known attestor', () => {
      const policy = makePolicy([{
        ruleId: 'id-1',
        ruleType: 'identity_proof',
        parameters: { requiredAttestors: ['trusted-node', 'oracle'], requireProof: true },
        severity: 'block',
      }]);

      const result = engine.assessRisk(makeRequest({ signatureProof: 'trusted-node:sig123' }), policy);
      expect(result.passed).toBe(true);
    });

    it('blocks invalid signature format (no proof)', () => {
      const policy = makePolicy([{
        ruleId: 'id-1',
        ruleType: 'identity_proof',
        parameters: { requiredAttestors: [], requireProof: true },
        severity: 'block',
      }]);

      const result = engine.assessRisk(makeRequest({ signatureProof: '' }), policy);
      expect(result.passed).toBe(false);
      expect(result.violations[0].message).toContain('Identity proof required');
    });

    it('blocks unknown attestor', () => {
      const policy = makePolicy([{
        ruleId: 'id-1',
        ruleType: 'identity_proof',
        parameters: { requiredAttestors: ['trusted-node'], requireProof: true },
        severity: 'block',
      }]);

      const result = engine.assessRisk(makeRequest({ signatureProof: 'evil-attestor:sig' }), policy);
      expect(result.passed).toBe(false);
      expect(result.violations[0].message).toContain('not in required list');
    });
  });

  describe('circuit breaker', () => {
    it('records transactions', () => {
      engine.recordTransaction(1.0);
      engine.recordTransaction(2.0);
      const state = engine.getCircuitBreakerState();
      expect(state.transactionCount).toBe(2);
      expect(state.volume).toBeCloseTo(3.0);
    });

    it('per-minute rate limit triggers halt', () => {
      const policy = makePolicy([], {
        enabled: true,
        maxTransactionsPerMinute: 3,
        maxVolumePerWindow: 1000,
        windowHours: 24,
        killSwitchEnabled: false,
      });

      for (let i = 0; i < 3; i++) {
        engine.recordTransaction(0.1);
        engine.assessRisk(makeRequest(), policy);
      }

      const state = engine.getCircuitBreakerState();
      expect(state.active).toBe(true);
    });

    it('manual activation and deactivation', () => {
      engine.activateCircuitBreaker('test');
      expect(engine.getCircuitBreakerState().active).toBe(true);

      engine.deactivateCircuitBreaker();
      expect(engine.getCircuitBreakerState().active).toBe(false);
    });
  });

  describe('kill-switch (RiskEngine)', () => {
    it('activate sets kill-switch active', () => {
      engine.activateKillSwitch('emergency');
      expect(engine.isKillSwitchActive()).toBe(true);
      expect(engine.getCircuitBreakerState().active).toBe(true);
    });

    it('deactivate clears kill-switch', () => {
      engine.activateKillSwitch('test');
      engine.deactivateKillSwitch();
      expect(engine.isKillSwitchActive()).toBe(false);
    });
  });

  describe('no policy = pass', () => {
    it('returns passed when no policy is provided', () => {
      const result = engine.assessRisk(makeRequest());
      expect(result.passed).toBe(true);
      expect(result.violations).toHaveLength(0);
    });
  });
});

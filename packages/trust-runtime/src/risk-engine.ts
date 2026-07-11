// packages/trust-runtime/src/risk-engine.ts
// ───────────────────────────────────────────────────────────────
// Risk Engine
// Circuit breaker and verification policy enforcement
// ───────────────────────────────────────────────────────────────

import type {
  VerificationPolicy,
  VerificationRule,
  VerificationResult,
  AgentTransactionRequest,
  CircuitBreakerConfig,
} from '@proofbridge/trust-types';
import type { TrustEvent } from '@proofbridge/trust-events';

// ───────────────────────────────────────────────────────────────
// Risk Engine Types
// ───────────────────────────────────────────────────────────────

export interface RiskEngineConfig {
  defaultPolicy?: VerificationPolicy;
}

export interface RiskAssessment {
  score: number;
  violations: RiskViolation[];
  passed: boolean;
  latencyMs: number;
}

export interface RiskViolation {
  ruleId: string;
  ruleType: string;
  severity: 'block' | 'warn' | 'log';
  message: string;
  details?: Record<string, unknown>;
}

// ───────────────────────────────────────────────────────────────
// Risk Engine Class
// ───────────────────────────────────────────────────────────────

export class RiskEngine {
  private defaultPolicy: VerificationPolicy | undefined;
  private circuitBreakerState: CircuitBreakerState;
  private rateLimitWindows: Map<string, RateLimitWindow>;
  private killSwitchActive: boolean;

  constructor(config: RiskEngineConfig = {}) {
    this.defaultPolicy = config.defaultPolicy;
    this.circuitBreakerState = {
      active: false,
      transactionCount: 0,
      volume: 0,
      windowStart: Date.now(),
      recentTransactions: [],
    };
    this.rateLimitWindows = new Map();
    this.killSwitchActive = false;
  }

  /**
   * Assess risk for a transaction request
   */
  assessRisk(
    request: AgentTransactionRequest,
    policy?: VerificationPolicy
  ): RiskAssessment {
    const startTime = Date.now();
    const effectivePolicy = policy || this.defaultPolicy;
    
    if (!effectivePolicy) {
      return {
        score: 0,
        violations: [],
        passed: true,
        latencyMs: Date.now() - startTime,
      };
    }

    const violations: RiskViolation[] = [];
    let score = 0;

    // Check circuit breaker
    if (this.circuitBreakerState.active) {
      violations.push({
        ruleId: 'circuit_breaker',
        ruleType: 'circuit_breaker',
        severity: 'block',
        message: 'Circuit breaker is active',
      });
      score = 100;
    }

    // Check each rule
    if (effectivePolicy.rules) {
      for (const rule of effectivePolicy.rules) {
        const violation = this.checkRule(rule, request);
        if (violation) {
          violations.push(violation);
          score += this.getRuleScore(rule.severity);
        }
      }
    }

    // Check circuit breaker config
    if (effectivePolicy.circuitBreaker?.enabled) {
      this.checkCircuitBreaker(effectivePolicy.circuitBreaker);
    }

    const passed = score < 100 && violations.every((v) => v.severity !== 'block');

    return {
      score,
      violations,
      passed,
      latencyMs: Date.now() - startTime,
    };
  }

  /**
   * Check a single rule
   */
  private checkRule(
    rule: VerificationRule,
    request: AgentTransactionRequest
  ): RiskViolation | null {
    switch (rule.ruleType) {
      case 'rate_limit':
        return this.checkRateLimitRule(rule, request);
      case 'spending_cap':
        return this.checkSpendingCapRule(rule, request);
      case 'calldata_scan':
        return this.checkCalldataScanRule(rule, request);
      case 'identity_proof':
        return this.checkIdentityProofRule(rule, request);
      case 'custom':
        return this.checkCustomRule(rule, request);
      default:
        return null;
    }
  }

  /**
   * Check rate limit rule — sliding window per agent
   */
  private checkRateLimitRule(
    rule: VerificationRule,
    request: AgentTransactionRequest
  ): RiskViolation | null {
    const params = rule.parameters as { maxRequests?: number; windowMs?: number };
    const maxRequests = params.maxRequests || 100;
    const windowMs = params.windowMs || 60_000; // default 1 minute

    const agentId = request.agentId;
    const now = Date.now();

    let window = this.rateLimitWindows.get(agentId);
    if (!window || now - window.windowStart > windowMs) {
      window = { windowStart: now, timestamps: [] };
      this.rateLimitWindows.set(agentId, window);
    }

    // Remove timestamps outside the window
    window.timestamps = window.timestamps.filter((t) => now - t < windowMs);
    window.timestamps.push(now);

    if (window.timestamps.length > maxRequests) {
      return {
        ruleId: rule.ruleId,
        ruleType: rule.ruleType,
        severity: rule.severity,
        message: `Rate limit exceeded: ${window.timestamps.length} requests in ${windowMs}ms (max: ${maxRequests})`,
        details: {
          agentId,
          requestCount: window.timestamps.length,
          maxRequests,
          windowMs,
        },
      };
    }

    return null;
  }

  /**
   * Check spending cap rule
   */
  private checkSpendingCapRule(
    rule: VerificationRule,
    request: AgentTransactionRequest
  ): RiskViolation | null {
    const params = rule.parameters as { maxValue?: number };
    const maxValue = params.maxValue || Infinity;
    
    if (request.valueETH > maxValue) {
      return {
        ruleId: rule.ruleId,
        ruleType: rule.ruleType,
        severity: rule.severity,
        message: `Value ${request.valueETH} exceeds spending cap of ${maxValue}`,
        details: { valueETH: request.valueETH, maxValue },
      };
    }
    
    return null;
  }

  /**
   * Check calldata scan rule — regex-based threat pattern matching
   */
  private checkCalldataScanRule(
    rule: VerificationRule,
    request: AgentTransactionRequest
  ): RiskViolation | null {
    const params = rule.parameters as { patterns?: string[]; blockOnMatch?: boolean };
    const patterns = params.patterns || [];
    const blockOnMatch = params.blockOnMatch !== false;

    const calldata = request.calldata || '';
    if (!calldata || patterns.length === 0) {
      return null;
    }

    for (const pattern of patterns) {
      try {
        const regex = new RegExp(pattern, 'i');
        if (regex.test(calldata)) {
          return {
            ruleId: rule.ruleId,
            ruleType: rule.ruleType,
            severity: blockOnMatch ? 'block' : 'warn',
            message: `Calldata matches threat pattern: ${pattern}`,
            details: {
              pattern,
              calldataPreview: calldata.slice(0, 100),
              blockOnMatch,
            },
          };
        }
      } catch {
        // Invalid regex pattern — skip
      }
    }

    return null;
  }

  /**
   * Check identity proof rule — verify proof signature against known attestors
   */
  private checkIdentityProofRule(
    rule: VerificationRule,
    request: AgentTransactionRequest
  ): RiskViolation | null {
    const params = rule.parameters as {
      requiredAttestors?: string[];
      requireProof?: boolean;
    };
    const requireProof = params.requireProof !== false;
    const requiredAttestors = params.requiredAttestors || [];

    // Check if a proof is required and present
    if (requireProof && !request.signatureProof) {
      return {
        ruleId: rule.ruleId,
        ruleType: rule.ruleType,
        severity: rule.severity,
        message: 'Identity proof required but not provided',
        details: {
          agentId: request.agentId,
          requireProof,
        },
      };
    }

    // If specific attestors are required, verify the proof is from one of them
    // The signatureProof format is expected to be "attestor:signature"
    if (requiredAttestors.length > 0 && request.signatureProof) {
      const [attestor] = request.signatureProof.split(':');
      if (!requiredAttestors.includes(attestor)) {
        return {
          ruleId: rule.ruleId,
          ruleType: rule.ruleType,
          severity: rule.severity,
          message: `Proof attestor '${attestor}' is not in required list`,
          details: {
            agentId: request.agentId,
            attestor,
            requiredAttestors,
          },
        };
      }
    }

    return null;
  }

  /**
   * Check custom rule
   */
  private checkCustomRule(
    rule: VerificationRule,
    request: AgentTransactionRequest
  ): RiskViolation | null {
    // Custom rule logic would be implemented here
    return null;
  }

  /**
   * Get score for severity level
   */
  private getRuleScore(severity: 'block' | 'warn' | 'log'): number {
    switch (severity) {
      case 'block': return 100;
      case 'warn': return 50;
      case 'log': return 10;
      default: return 0;
    }
  }

  /**
   * Check circuit breaker
   */
  private checkCircuitBreaker(config: CircuitBreakerConfig): void {
    const now = Date.now();
    const windowHours = config.windowHours || 24;
    const windowMs = windowHours * 60 * 60 * 1000;

    // Reset window if expired
    if (now - this.circuitBreakerState.windowStart > windowMs) {
      this.circuitBreakerState = {
        active: false,
        transactionCount: 0,
        volume: 0,
        windowStart: now,
        recentTransactions: [],
      };
    }

    // Check per-minute transaction rate
    if (config.maxTransactionsPerMinute) {
      const maxPerMinute = config.maxTransactionsPerMinute;
      const oneMinuteAgo = now - 60_000;

      // Prune timestamps older than 1 minute
      this.circuitBreakerState.recentTransactions =
        this.circuitBreakerState.recentTransactions.filter((t) => t > oneMinuteAgo);

      if (this.circuitBreakerState.recentTransactions.length >= maxPerMinute) {
        this.circuitBreakerState.active = true;
      }
    }

    // Check volume
    if (config.maxVolumePerWindow) {
      const maxVolume = config.maxVolumePerWindow;
      if (this.circuitBreakerState.volume > maxVolume) {
        this.circuitBreakerState.active = true;
      }
    }

    // Check kill switch
    if (config.killSwitchEnabled && this.killSwitchActive) {
      this.circuitBreakerState.active = true;
    }
  }

  /**
   * Activate circuit breaker
   */
  activateCircuitBreaker(reason?: string): void {
    this.circuitBreakerState.active = true;
    // TODO: Log activation with reason
  }

  /**
   * Deactivate circuit breaker
   */
  deactivateCircuitBreaker(): void {
    this.circuitBreakerState.active = false;
    this.circuitBreakerState.windowStart = Date.now();
  }

  /**
   * Get circuit breaker state
   */
  getCircuitBreakerState(): CircuitBreakerState {
    return { ...this.circuitBreakerState };
  }

  /**
   * Verify a transaction request
   */
  verifyRequest(
    request: AgentTransactionRequest,
    policy?: VerificationPolicy
  ): VerificationResult {
    const startTime = Date.now();
    const assessment = this.assessRisk(request, policy);
    
    const result: VerificationResult = {
      allowed: assessment.passed,
      reason: assessment.violations.length > 0 
        ? assessment.violations.map((v) => v.message).join('; ')
        : undefined,
      riskScore: assessment.score,
      latencyMs: Date.now() - startTime,
    };

    // Add receipt if available
    // TODO: Add receipt generation

    return result;
  }

  /**
   * Record a transaction for rate limiting
   */
  recordTransaction(valueETH: number): void {
    this.circuitBreakerState.transactionCount++;
    this.circuitBreakerState.volume += valueETH;
    this.circuitBreakerState.recentTransactions.push(Date.now());
  }

  /**
   * Activate the global kill switch
   */
  activateKillSwitch(reason?: string): void {
    this.killSwitchActive = true;
    this.circuitBreakerState.active = true;
  }

  /**
   * Deactivate the global kill switch
   */
  deactivateKillSwitch(): void {
    this.killSwitchActive = false;
    this.circuitBreakerState.active = false;
    this.circuitBreakerState.windowStart = Date.now();
  }

  /**
   * Check if kill switch is active
   */
  isKillSwitchActive(): boolean {
    return this.killSwitchActive;
  }
}

// ───────────────────────────────────────────────────────────────
// Circuit Breaker State
// ───────────────────────────────────────────────────────────────

interface CircuitBreakerState {
  active: boolean;
  transactionCount: number;
  volume: number;
  windowStart: number;
  recentTransactions: number[];
}

interface RateLimitWindow {
  windowStart: number;
  timestamps: number[];
}

// ───────────────────────────────────────────────────────────────
// Factory Function
// ───────────────────────────────────────────────────────────────

export function createRiskEngine(config?: RiskEngineConfig): RiskEngine {
  return new RiskEngine(config);
}

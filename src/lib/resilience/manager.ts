/**
 * @license
 * VVU EARTH TECH - AIR Kernel
 * Copyright (c) 2026 Venture Vision Ubuntu
 *
 * LICENSE: Apache-2.0 (Open Source) OR Commercial (Enterprise)
 * See LICENSE and COMMERCIAL_LICENSE.md for details.
 *
 * This file is part of the VVU EARTH TECH horizontal infrastructure.
 * It contains no product-specific logic (Golden Rule).
 */

// ============================================================================
// VVU EARTH TECH — Resilience Manager
// ============================================================================
//
// Singleton manager that holds all 72-hour adversarial resilience components
// and provides a unified status API.
//
// Components:
// - Circuit Breaker State Machine
// - Hybrid Logical Clock
// - NATS Durable Queue
// - WAL Corruption Healing
// - Cryptographic State Bundle
// - Policy Time Travel
// ============================================================================

import { CircuitBreakerStateMachine } from './circuit-breaker';
import type { CircuitBreakerState, CircuitBreakerThresholds } from './circuit-breaker';
import { HybridLogicalClock } from './hlc';
import type { HLCTuple } from './hlc';
import { DurableQueue } from './nats-queue';
import { validateWAL, healWAL } from './wal-healing';
import type { WALEntry, WALValidationResult, WALHealingReport } from './wal-healing';
import { PolicyTimeTravel, InMemoryPolicyTimeTravelRegistry } from './policy-time-travel';
import type { PolicyTimeTravelResult, PolicyVersion } from './policy-time-travel';
import type { ClockProvider } from '@/lib/kernel/types';

// ---------------------------------------------------------------------------
// §1 — System Clock Provider
// ---------------------------------------------------------------------------

/**
 * System clock provider using Date.now() for production use.
 * In deterministic replay, this would be replaced with a deterministic clock.
 */
const systemClock: ClockProvider = {
  now(): number {
    return Date.now();
  },
  reset(_initialTime: number): void {
    // System clock cannot be reset — only deterministic clocks support reset
  },
};

// ---------------------------------------------------------------------------
// §2 — Resilience Manager State
// ---------------------------------------------------------------------------

/**
 * Overall resilience status of the system.
 */
export interface ResilienceStatus {
  /** Current timestamp (from clock) */
  timestamp: number;

  // Circuit Breaker
  circuitBreaker: {
    /** Current state (NORMAL, DEGRADED, FAIL-CLOSED) */
    state: CircuitBreakerState;
    /** Current error rate (0-100) */
    errorRate: number;
    /** Time current state was entered */
    stateEnteredAt: number;
    /** Number of state transitions in history */
    transitionCount: number;
    /** Last transition reason */
    lastTransitionReason: string | null;
    /** Recovery start time (if in recovery) */
    recoveryStartedAt: number | null;
    /** Current thresholds */
    thresholds: CircuitBreakerThresholds;
  };

  // HLC
  hlc: {
    /** Current HLC tuple */
    current: HLCTuple;
    /** Node ID */
    nodeId: string;
    /** HLC string representation */
    hlcString: string;
  };

  // NATS Queue
  natsQueue: {
    /** Current queue depth */
    depth: number;
    /** Queue name */
    queueName: string;
    /** Subject */
    subject: string;
    /** Durable name */
    durableName: string;
    /** Total messages enqueued */
    totalEnqueued: number;
    /** Total messages processed */
    totalProcessed: number;
  };

  // WAL Health
  walHealth: {
    /** Whether WAL is valid */
    valid: boolean;
    /** Number of entries */
    entryCount: number;
    /** Number of valid entries */
    validEntries: number;
    /** Last healing report (if any) */
    lastHealingReport: WALHealingReport | null;
  };

  // CSB
  csb: {
    /** Whether a CSB is available */
    available: boolean;
    /** CSB bundle hash (if available) */
    bundleHash: string | null;
    /** CSB MMR root (if available) */
    mmrRoot: string | null;
    /** CSB evidence count (if available) */
    evidenceCount: number | null;
    /** CSB creation timestamp (if available) */
    createdAt: number | null;
  };

  // Policy Time Travel
  policyTimeTravel: {
    /** Number of policy versions registered */
    policyVersionCount: number;
    /** Whether the evaluator is active */
    active: boolean;
    /** Last evaluation result */
    lastEvaluationResult: PolicyTimeTravelResult | null;
  };
}

// ---------------------------------------------------------------------------
// §3 — Resilience Manager
// ---------------------------------------------------------------------------

/**
 * Singleton manager for all 72-hour adversarial resilience components.
 * Provides unified access and status reporting.
 */
class ResilienceManager {
  private circuitBreaker: CircuitBreakerStateMachine;
  private hlc: HybridLogicalClock;
  private durableQueue: DurableQueue;
  private policyTimeTravel: PolicyTimeTravel;
  private policyRegistry: InMemoryPolicyTimeTravelRegistry;
  private walEntries: WALEntry[] = [];
  private lastHealingReport: WALHealingReport | null = null;
  private lastCSBBundleHash: string | null = null;
  private lastCSBMMRRoot: string | null = null;
  private lastCSBEvidenceCount: number | null = null;
  private lastCSBCreatedAt: number | null = null;
  private lastPolicyEvaluationResult: PolicyTimeTravelResult | null = null;
  private nodeId: string;

  constructor() {
    this.nodeId = `node-${Math.random().toString(36).substring(2, 8)}`;
    this.circuitBreaker = new CircuitBreakerStateMachine(systemClock, undefined, this.nodeId);
    this.hlc = new HybridLogicalClock(systemClock, this.nodeId);
    this.durableQueue = new DurableQueue(systemClock, 'resilience-queue', 'vvu.et.resilience', `vvu-et-durable-${this.nodeId}`);
    this.policyRegistry = new InMemoryPolicyTimeTravelRegistry();
    this.policyTimeTravel = new PolicyTimeTravel(systemClock, this.policyRegistry);

    // Seed a default policy
    this.policyRegistry.addVersion({
      id: 'policy-default-v1',
      name: 'Default Resilience Policy',
      version: 1,
      effectiveAt: 0,
      supersededAt: null,
      policyHash: '0000000000000000000000000000000000000000000000000000000000000000',
      active: true,
    });
  }

  /** Get Circuit Breaker instance */
  getCircuitBreaker(): CircuitBreakerStateMachine {
    return this.circuitBreaker;
  }

  /** Get HLC instance */
  getHLC(): HybridLogicalClock {
    return this.hlc;
  }

  /** Get NATS Durable Queue instance */
  getDurableQueue(): DurableQueue {
    return this.durableQueue;
  }

  /** Get Policy Time Travel instance */
  getPolicyTimeTravel(): PolicyTimeTravel {
    return this.policyTimeTravel;
  }

  /** Get Policy Registry */
  getPolicyRegistry(): InMemoryPolicyTimeTravelRegistry {
    return this.policyRegistry;
  }

  /** Set WAL entries for health monitoring */
  setWALEntries(entries: WALEntry[]): void {
    this.walEntries = entries;
  }

  /** Set CSB availability */
  setCSBAvailable(bundleHash: string, mmrRoot: string, evidenceCount: number, createdAt: number): void {
    this.lastCSBBundleHash = bundleHash;
    this.lastCSBMMRRoot = mmrRoot;
    this.lastCSBEvidenceCount = evidenceCount;
    this.lastCSBCreatedAt = createdAt;
  }

  /** Set last policy evaluation result */
  setLastPolicyResult(result: PolicyTimeTravelResult): void {
    this.lastPolicyEvaluationResult = result;
  }

  /**
   * Get comprehensive resilience status.
   */
  getStatus(): ResilienceStatus {
    // WAL health
    const walValidation = validateWAL(this.walEntries);
    const walHealth = {
      valid: walValidation.valid,
      entryCount: walValidation.totalEntries,
      validEntries: walValidation.validEntries,
      lastHealingReport: this.lastHealingReport,
    };

    // Circuit Breaker status
    const transitionHistory = this.circuitBreaker.getTransitionHistory();
    const lastTransition = transitionHistory.length > 0
      ? transitionHistory[transitionHistory.length - 1]
      : null;

    return {
      timestamp: systemClock.now(),
      circuitBreaker: {
        state: this.circuitBreaker.getState(),
        errorRate: this.circuitBreaker.getErrorRate(),
        stateEnteredAt: this.circuitBreaker.getStateEnteredAt(),
        transitionCount: transitionHistory.length,
        lastTransitionReason: lastTransition?.reason ?? null,
        recoveryStartedAt: this.circuitBreaker.getRecoveryStartedAt(),
        thresholds: this.circuitBreaker.getThresholds(),
      },
      hlc: {
        current: this.hlc.getCurrent(),
        nodeId: this.hlc.getNodeId(),
        hlcString: HybridLogicalClock.toString(this.hlc.getCurrent()),
      },
      natsQueue: {
        depth: this.durableQueue.getQueueDepth(),
        queueName: this.durableQueue.getQueueName(),
        subject: this.durableQueue.getSubject(),
        durableName: this.durableQueue.getDurableName(),
        totalEnqueued: this.durableQueue.getTotalEnqueued(),
        totalProcessed: this.durableQueue.getTotalProcessed(),
      },
      walHealth,
      csb: {
        available: this.lastCSBBundleHash !== null,
        bundleHash: this.lastCSBBundleHash,
        mmrRoot: this.lastCSBMMRRoot,
        evidenceCount: this.lastCSBEvidenceCount,
        createdAt: this.lastCSBCreatedAt,
      },
      policyTimeTravel: {
        policyVersionCount: this.policyRegistry.getAllVersions().length,
        active: true,
        lastEvaluationResult: this.lastPolicyEvaluationResult,
      },
    };
  }
}

// ---------------------------------------------------------------------------
// §4 — Singleton Instance
// ---------------------------------------------------------------------------

/**
 * Global singleton resilience manager instance.
 * All API routes reference this singleton for consistent state.
 */
let _instance: ResilienceManager | null = null;

/**
 * Get the resilience manager singleton.
 */
export function getResilienceManager(): ResilienceManager {
  if (_instance === null) {
    _instance = new ResilienceManager();
  }
  return _instance;
}

/**
 * Reset the resilience manager singleton (for testing).
 */
export function resetResilienceManager(): void {
  _instance = null;
}

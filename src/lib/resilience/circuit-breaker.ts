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
// VVU EARTH TECH — Circuit Breaker State Machine
// ============================================================================
//
// Enforces 72-hour adversarial resilience by transitioning between
// NORMAL, DEGRADED, and FAIL-CLOSED states based on error rates and
// dependency health.
//
// All timestamps use injected Clock provider (NOT Date.now()).
// All state transitions emit CircuitBreakerEvent with SHA-256 hash
// for the evidence store.
// ============================================================================

import { computeSHA256 } from '@/lib/kernel/hashing';
import { canonicalize } from '@/lib/kernel/canonicalization';
import type { ClockProvider } from '@/lib/kernel/types';
import { HARD_FAILURE_CODES } from '../../../shared/license/license-schema';

// ---------------------------------------------------------------------------
// §1 — Circuit Breaker States
// ---------------------------------------------------------------------------

/**
 * Circuit Breaker states for 72-hour adversarial resilience.
 *
 * NORMAL:      Full throughput, all requests served normally.
 * DEGRADED:    Cached responses allowed, writes queued, reads from cache.
 * FAIL-CLOSED: ALL requests rejected (HTTP 503), throughput = 0%, bypasses caches.
 */
export type CircuitBreakerState = 'NORMAL' | 'DEGRADED' | 'FAIL-CLOSED';

// ---------------------------------------------------------------------------
// §2 — Transition Thresholds
// ---------------------------------------------------------------------------

/**
 * Thresholds governing Circuit Breaker state transitions.
 * All values are in milliseconds for wall_time compatibility.
 */
export interface CircuitBreakerThresholds {
  /** Error rate percentage (0-100) that triggers NORMAL → DEGRADED */
  degradeErrorRate: number;
  /** Time window (ms) over which error rate is measured for degradation */
  degradeWindow: number;
  /** Critical dependency unreachable duration (ms) that triggers NORMAL → DEGRADED */
  degradeDependencyTimeout: number;
  /** Error rate percentage (0-100) that triggers DEGRADED → FAIL-CLOSED */
  failClosedErrorRate: number;
  /** Time window (ms) over which error rate is measured for fail-close */
  failClosedWindow: number;
  /** Critical dependency unreachable duration (ms) that triggers DEGRADED → FAIL-CLOSED */
  failClosedDependencyTimeout: number;
  /** Error rate percentage (0-100) below which recovery begins */
  recoveryErrorRate: number;
  /** Recovery window (ms) for DEGRADED → NORMAL (must sustain low error rate) */
  recoveryWindowDegraded: number;
  /** Recovery window (ms) for FAIL-CLOSED → DEGRADED (must sustain low error rate) */
  recoveryWindowFailClosed: number;
}

/**
 * Default thresholds aligned with 72-hour adversarial resilience spec.
 */
export const DEFAULT_THRESHOLDS: CircuitBreakerThresholds = {
  degradeErrorRate: 15,
  degradeWindow: 60_000,         // 60 seconds
  degradeDependencyTimeout: 15_000, // 15 seconds
  failClosedErrorRate: 40,
  failClosedWindow: 60_000,      // 60 seconds
  failClosedDependencyTimeout: 30_000, // 30 seconds
  recoveryErrorRate: 5,
  recoveryWindowDegraded: 60_000,  // 60 seconds
  recoveryWindowFailClosed: 120_000, // 120 seconds
};

// ---------------------------------------------------------------------------
// §3 — Circuit Breaker Event
// ---------------------------------------------------------------------------

/**
 * Event emitted on every Circuit Breaker state transition.
 * SHA-256 hash ensures tamper-evident audit trail for the evidence store.
 */
export interface CircuitBreakerEvent {
  /** Unique event identifier (SHA-256 of event content) */
  id: string;
  /** Previous state before transition */
  fromState: CircuitBreakerState;
  /** New state after transition */
  toState: CircuitBreakerState;
  /** Reason for the transition */
  reason: string;
  /** Error rate at time of transition (0-100) */
  errorRate: number;
  /** Timestamp from injected clock (NOT Date.now()) */
  timestamp: number;
  /** SHA-256 hash of canonicalized event for evidence store */
  hash: string;
  /** Hard failure code if applicable */
  hardFailureCode?: string;
}

// ---------------------------------------------------------------------------
// §4 — Error Record
// ---------------------------------------------------------------------------

/**
 * Record of a single error for rate calculation.
 */
export interface ErrorRecord {
  /** Timestamp from injected clock */
  timestamp: number;
  /** Whether this was a success (false) or error (true) */
  isError: boolean;
  /** Optional hard failure code */
  hardFailureCode?: string;
}

// ---------------------------------------------------------------------------
// §5 — Dependency Health Record
// ---------------------------------------------------------------------------

/**
 * Record tracking critical dependency health.
 */
export interface DependencyHealthRecord {
  /** Dependency name */
  name: string;
  /** Whether currently reachable */
  reachable: boolean;
  /** Timestamp when unreachable status began (from injected clock) */
  unreachableSince: number | null;
  /** Timestamp of last health check (from injected clock) */
  lastChecked: number;
}

// ---------------------------------------------------------------------------
// §6 — Circuit Breaker Persistent State
// ---------------------------------------------------------------------------

/**
 * State persisted to durable storage to survive crashes during attacks.
 * Prevents compute exhaustion by avoiding re-computation on restart.
 */
export interface CircuitBreakerPersistentState {
  /** Current Circuit Breaker state */
  currentState: CircuitBreakerState;
  /** Time when the current state was entered (injected clock) */
  stateEnteredAt: number;
  /** Current error rate (0-100) */
  currentErrorRate: number;
  /** Time when recovery conditions began being met (null if not recovering) */
  recoveryStartedAt: number | null;
  /** SHA-256 hash of the persistent state for integrity verification */
  stateHash: string;
  /** Last updated timestamp */
  lastUpdated: number;
}

// ---------------------------------------------------------------------------
// §7 — Circuit Breaker State Machine
// ---------------------------------------------------------------------------

/**
 * Circuit Breaker State Machine enforcing 72-hour adversarial resilience.
 *
 * Design principles:
 * - All timestamps from injected Clock provider (deterministic replay)
 * - State persisted to durable storage (survives crashes during attacks)
 * - Every transition emits a CircuitBreakerEvent with SHA-256 hash
 * - FAIL-CLOSED: ALL requests rejected with HTTP 503, throughput = 0%
 * - DEGRADED: cached responses, queued writes, reads from cache
 * - NEVER uses Date.now()
 */
export class CircuitBreakerStateMachine {
  private currentState: CircuitBreakerState = 'NORMAL';
  private stateEnteredAt: number;
  private recoveryStartedAt: number | null = null;
  private errorRecords: ErrorRecord[] = [];
  private dependencies: Map<string, DependencyHealthRecord> = new Map();
  private transitionHistory: CircuitBreakerEvent[] = [];
  private thresholds: CircuitBreakerThresholds;

  /** Durable storage for crash recovery */
  private durableState: CircuitBreakerPersistentState | null = null;

  /**
   * Create a new Circuit Breaker State Machine.
   *
   * @param clock Injected Clock provider (MUST NOT use Date.now())
   * @param thresholds Transition thresholds (defaults to 72-hour resilience spec)
   * @param nodeId Node identifier for evidence attribution
   */
  constructor(
    private readonly clock: ClockProvider,
    thresholds: CircuitBreakerThresholds = DEFAULT_THRESHOLDS,
    private readonly nodeId: string = 'node-0',
  ) {
    this.thresholds = thresholds;
    this.stateEnteredAt = this.clock.now();
    this.persistState();
  }

  // ---------------------------------------------------------------------------
  // State accessors
  // ---------------------------------------------------------------------------

  /** Get current Circuit Breaker state */
  getState(): CircuitBreakerState {
    return this.currentState;
  }

  /** Get the time the current state was entered */
  getStateEnteredAt(): number {
    return this.stateEnteredAt;
  }

  /** Get current error rate (0-100) */
  getErrorRate(): number {
    return this.computeErrorRate();
  }

  /** Get all transition history events */
  getTransitionHistory(): CircuitBreakerEvent[] {
    return [...this.transitionHistory];
  }

  /** Get current thresholds */
  getThresholds(): CircuitBreakerThresholds {
    return { ...this.thresholds };
  }

  /** Get dependency health records */
  getDependencyHealth(): DependencyHealthRecord[] {
    return Array.from(this.dependencies.values());
  }

  /** Get the recovery start time (null if not in recovery) */
  getRecoveryStartedAt(): number | null {
    return this.recoveryStartedAt;
  }

  /** Get persistent state for crash recovery */
  getPersistentState(): CircuitBreakerPersistentState {
    return this.durableState ?? this.buildPersistentState();
  }

  // ---------------------------------------------------------------------------
  // Record operations
  // ---------------------------------------------------------------------------

  /**
   * Record a request outcome (success or error).
   * Uses injected clock for timestamp.
   */
  recordRequest(isError: boolean, hardFailureCode?: string): void {
    this.errorRecords.push({
      timestamp: this.clock.now(),
      isError,
      hardFailureCode,
    });

    // Trim old records outside the measurement windows
    this.trimErrorRecords();

    // Evaluate state transitions after recording
    this.evaluate();
  }

  /**
   * Update dependency health status.
   * Uses injected clock for timestamp.
   */
  updateDependencyHealth(name: string, reachable: boolean): void {
    const now = this.clock.now();
    const existing = this.dependencies.get(name);

    if (existing) {
      if (!reachable && existing.reachable) {
        // Dependency just became unreachable
        existing.reachable = reachable;
        existing.unreachableSince = now;
        existing.lastChecked = now;
      } else if (reachable && !existing.reachable) {
        // Dependency recovered
        existing.reachable = reachable;
        existing.unreachableSince = null;
        existing.lastChecked = now;
      } else {
        existing.lastChecked = now;
      }
    } else {
      this.dependencies.set(name, {
        name,
        reachable,
        unreachableSince: reachable ? null : now,
        lastChecked: now,
      });
    }

    // Evaluate state transitions after dependency update
    this.evaluate();
  }

  // ---------------------------------------------------------------------------
  // Request handling
  // ---------------------------------------------------------------------------

  /**
   * Check if a request should be allowed based on current state.
   *
   * NORMAL:      Allow all requests.
   * DEGRADED:    Allow reads (cached), queue writes.
   * FAIL-CLOSED: Reject ALL requests (HTTP 503).
   */
  shouldAllowRequest(requestType: 'read' | 'write'): {
    allowed: boolean;
    statusCode?: number;
    reason?: string;
  } {
    switch (this.currentState) {
      case 'NORMAL':
        return { allowed: true };
      case 'DEGRADED':
        if (requestType === 'read') {
          return { allowed: true, reason: 'DEGRADED: reads served from cache' };
        }
        return {
          allowed: true,
          reason: 'DEGRADED: writes queued to durable storage',
        };
      case 'FAIL-CLOSED':
        return {
          allowed: false,
          statusCode: 503,
          reason: 'FAIL-CLOSED: all requests rejected (72-hour adversarial resilience)',
        };
    }
  }

  // ---------------------------------------------------------------------------
  // State evaluation
  // ---------------------------------------------------------------------------

  /**
   * Evaluate whether a state transition should occur based on current
   * error rates, dependency health, and recovery conditions.
   *
   * This method is called automatically after recordRequest() and
   * updateDependencyHealth(). It can also be called manually.
   */
  evaluate(): void {
    const errorRate = this.computeErrorRate();
    const now = this.clock.now();

    switch (this.currentState) {
      case 'NORMAL':
        this.evaluateFromNormal(errorRate, now);
        break;
      case 'DEGRADED':
        this.evaluateFromDegraded(errorRate, now);
        break;
      case 'FAIL-CLOSED':
        this.evaluateFromFailClosed(errorRate, now);
        break;
    }

    this.persistState();
  }

  // ---------------------------------------------------------------------------
  // Private: state transition evaluation
  // ---------------------------------------------------------------------------

  private evaluateFromNormal(errorRate: number, now: number): void {
    // NORMAL → DEGRADED: error_rate > 15% over 60s window
    if (errorRate > this.thresholds.degradeErrorRate) {
      this.transition('DEGRADED', `Error rate ${errorRate.toFixed(1)}% exceeds threshold ${this.thresholds.degradeErrorRate}%`, errorRate, now);
      return;
    }

    // NORMAL → DEGRADED: critical dependency unreachable > 15s
    const depTimeout = this.checkDependencyTimeout(this.thresholds.degradeDependencyTimeout, now);
    if (depTimeout) {
      this.transition('DEGRADED', `Critical dependency ${depTimeout} unreachable for >${this.thresholds.degradeDependencyTimeout}ms`, errorRate, now);
      return;
    }
  }

  private evaluateFromDegraded(errorRate: number, now: number): void {
    // DEGRADED → FAIL-CLOSED: error_rate > 40% over 60s window
    if (errorRate > this.thresholds.failClosedErrorRate) {
      this.transition('FAIL-CLOSED', `Error rate ${errorRate.toFixed(1)}% exceeds threshold ${this.thresholds.failClosedErrorRate}%`, errorRate, now, 'HF-003');
      return;
    }

    // DEGRADED → FAIL-CLOSED: critical dependency unreachable > 30s
    const depTimeout = this.checkDependencyTimeout(this.thresholds.failClosedDependencyTimeout, now);
    if (depTimeout) {
      this.transition('FAIL-CLOSED', `Critical dependency ${depTimeout} unreachable for >${this.thresholds.failClosedDependencyTimeout}ms`, errorRate, now, 'HF-003');
      return;
    }

    // DEGRADED → NORMAL: error_rate drops below 5% for 60s
    if (errorRate < this.thresholds.recoveryErrorRate) {
      if (this.recoveryStartedAt === null) {
        this.recoveryStartedAt = now;
      } else if (now - this.recoveryStartedAt >= this.thresholds.recoveryWindowDegraded) {
        // Sustained low error rate for recovery window
        this.transition('NORMAL', `Error rate ${errorRate.toFixed(1)}% sustained below ${this.thresholds.recoveryErrorRate}% for ${this.thresholds.recoveryWindowDegraded}ms`, errorRate, now);
        return;
      }
    } else {
      // Error rate rose above recovery threshold, reset recovery timer
      this.recoveryStartedAt = null;
    }
  }

  private evaluateFromFailClosed(errorRate: number, now: number): void {
    // FAIL-CLOSED → DEGRADED: error_rate drops below 5% for 120s
    if (errorRate < this.thresholds.recoveryErrorRate) {
      if (this.recoveryStartedAt === null) {
        this.recoveryStartedAt = now;
      } else if (now - this.recoveryStartedAt >= this.thresholds.recoveryWindowFailClosed) {
        // Sustained low error rate for recovery window
        this.transition('DEGRADED', `Error rate ${errorRate.toFixed(1)}% sustained below ${this.thresholds.recoveryErrorRate}% for ${this.thresholds.recoveryWindowFailClosed}ms`, errorRate, now);
        return;
      }
    } else {
      // Error rate rose above recovery threshold, reset recovery timer
      this.recoveryStartedAt = null;
    }
  }

  // ---------------------------------------------------------------------------
  // Private: state transition execution
  // ---------------------------------------------------------------------------

  private transition(
    newState: CircuitBreakerState,
    reason: string,
    errorRate: number,
    now: number,
    hardFailureCode?: string,
  ): void {
    const event: CircuitBreakerEvent = {
      id: '', // Will be computed
      fromState: this.currentState,
      toState: newState,
      reason,
      errorRate,
      timestamp: now,
      hash: '', // Will be computed
      hardFailureCode,
    };

    // Compute deterministic ID and hash for evidence store
    const eventForHash = {
      fromState: event.fromState,
      toState: event.toState,
      reason: event.reason,
      errorRate: event.errorRate,
      timestamp: event.timestamp,
      hardFailureCode: event.hardFailureCode ?? null,
      nodeId: this.nodeId,
    };
    event.id = computeSHA256(canonicalize(eventForHash));
    event.hash = computeSHA256(canonicalize(eventForHash) + event.id);

    // Execute transition
    const fromState = this.currentState;
    this.currentState = newState;
    this.stateEnteredAt = now;
    this.recoveryStartedAt = null;

    // Record transition event
    this.transitionHistory.push(event);

    // If entering FAIL-CLOSED, hard failure code is required
    if (newState === 'FAIL-CLOSED' && !hardFailureCode) {
      event.hardFailureCode = 'HF-003';
      // Recompute hash with hard failure code
      const updatedEventForHash = {
        ...eventForHash,
        hardFailureCode: 'HF-003',
      };
      event.id = computeSHA256(canonicalize(updatedEventForHash));
      event.hash = computeSHA256(canonicalize(updatedEventForHash) + event.id);
    }
  }

  // ---------------------------------------------------------------------------
  // Private: error rate computation
  // ---------------------------------------------------------------------------

  /**
   * Compute error rate over the appropriate measurement window.
   * Uses the larger window (60s) for all calculations to ensure
   * consistent measurement.
   */
  private computeErrorRate(): number {
    const now = this.clock.now();
    const windowStart = now - this.thresholds.failClosedWindow;

    // Filter records within the measurement window
    const windowRecords = this.errorRecords.filter(
      r => r.timestamp >= windowStart,
    );

    if (windowRecords.length === 0) {
      return 0; // No requests = no errors
    }

    const errorCount = windowRecords.filter(r => r.isError).length;
    return (errorCount / windowRecords.length) * 100;
  }

  // ---------------------------------------------------------------------------
  // Private: dependency timeout check
  // ---------------------------------------------------------------------------

  /**
   * Check if any critical dependency has been unreachable for longer
   * than the specified timeout.
   */
  private checkDependencyTimeout(timeoutMs: number, now: number): string | null {
    for (const dep of this.dependencies.values()) {
      if (!dep.reachable && dep.unreachableSince !== null) {
        const duration = now - dep.unreachableSince;
        if (duration > timeoutMs) {
          return dep.name;
        }
      }
    }
    return null;
  }

  // ---------------------------------------------------------------------------
  // Private: error record trimming
  // ---------------------------------------------------------------------------

  /**
   * Trim error records older than the largest measurement window
   * to prevent unbounded memory growth.
   */
  private trimErrorRecords(): void {
    const now = this.clock.now();
    const maxWindow = Math.max(
      this.thresholds.degradeWindow,
      this.thresholds.failClosedWindow,
      this.thresholds.recoveryWindowFailClosed,
    );
    const cutoff = now - maxWindow;
    this.errorRecords = this.errorRecords.filter(r => r.timestamp >= cutoff);
  }

  // ---------------------------------------------------------------------------
  // Private: durable state persistence
  // ---------------------------------------------------------------------------

  /**
   * Persist current state to durable storage format.
   * State hash ensures integrity verification on recovery.
   */
  private persistState(): void {
    this.durableState = this.buildPersistentState();
  }

  /**
   * Build persistent state object with integrity hash.
   */
  private buildPersistentState(): CircuitBreakerPersistentState {
    const now = this.clock.now();
    const stateObj = {
      currentState: this.currentState,
      stateEnteredAt: this.stateEnteredAt,
      currentErrorRate: this.computeErrorRate(),
      recoveryStartedAt: this.recoveryStartedAt,
      lastUpdated: now,
      nodeId: this.nodeId,
    };

    const stateHash = computeSHA256(canonicalize(stateObj));

    return {
      ...stateObj,
      stateHash,
    };
  }

  /**
   * Restore state from durable storage (crash recovery).
   * Verifies integrity hash before restoring.
   */
  restoreFromPersistentState(persisted: CircuitBreakerPersistentState): boolean {
    // Verify state hash integrity
    const stateObj = {
      currentState: persisted.currentState,
      stateEnteredAt: persisted.stateEnteredAt,
      currentErrorRate: persisted.currentErrorRate,
      recoveryStartedAt: persisted.recoveryStartedAt,
      lastUpdated: persisted.lastUpdated,
      nodeId: this.nodeId,
    };

    const expectedHash = computeSHA256(canonicalize(stateObj));
    if (persisted.stateHash !== expectedHash) {
      // Integrity check failed — state was tampered or corrupted
      // Per resilience spec: REJECT corrupted state, start from NORMAL
      return false;
    }

    // Restore verified state
    this.currentState = persisted.currentState;
    this.stateEnteredAt = persisted.stateEnteredAt;
    this.recoveryStartedAt = persisted.recoveryStartedAt;
    this.persistState();

    return true;
  }

  // ---------------------------------------------------------------------------
  // Utility: hard failure code lookup
  // ---------------------------------------------------------------------------

  /**
   * Get human-readable description for a hard failure code.
   */
  static describeHardFailure(code: string): string {
    const entry = HARD_FAILURE_CODES[code as keyof typeof HARD_FAILURE_CODES];
    return entry ?? `Unknown hard failure code: ${code}`;
  }
}

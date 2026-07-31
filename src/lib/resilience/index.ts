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
// VVU EARTH TECH — Resilience Barrel Export
// ============================================================================
//
// Exports all 72-hour adversarial resilience modules:
// - Circuit Breaker State Machine (NORMAL/DEGRADED/FAIL-CLOSED)
// - Hybrid Logical Clock (causality during network partitions)
// - Cryptographic State Bundle (instant recovery without Genesis replay)
// - Policy Time Travel (bi-temporal policy evaluation)
// - WAL Corruption Healing (auto-recovery from torn writes)
// - NATS Durable Queue (network partition survival)
// ============================================================================

// Circuit Breaker State Machine
export {
  CircuitBreakerStateMachine,
  DEFAULT_THRESHOLDS,
  CircuitBreakerStateMachine as CircuitBreaker,
} from './circuit-breaker';
export type {
  CircuitBreakerState,
  CircuitBreakerThresholds,
  CircuitBreakerEvent,
  ErrorRecord,
  DependencyHealthRecord,
  CircuitBreakerPersistentState,
} from './circuit-breaker';

// Hybrid Logical Clock
export { HybridLogicalClock } from './hlc';
export type {
  HLCTuple,
  HLCEvent,
} from './hlc';

// Cryptographic State Bundle
export {
  createCSB,
  verifyCSB,
  hydrateFromCSB,
  getCSBEventLog,
  clearCSBEventLog,
  MINIMUM_QUORUM_SIZE,
  CSB_VERSION,
} from './csb';
export type {
  CSB,
  CSBVerificationResult,
  CSBHydrationResult,
  CSBEvent,
} from './csb';

// Policy Time Travel
export {
  PolicyTimeTravel,
  InMemoryPolicyTimeTravelRegistry,
} from './policy-time-travel';
export type {
  PolicyTimeTravelResult,
  PolicyVersion,
  TimeTravelFact,
  PolicyTimeTravelEvent,
  PolicyTimeTravelRegistry,
} from './policy-time-travel';

// WAL Corruption Healing
export {
  computeCRC32c,
  validateWAL,
  healWAL,
  resyncFromLeader,
  createWALEntry,
} from './wal-healing';
export type {
  WALEntry,
  WALValidationResult,
  WALHealingReport,
  WALResyncResult,
} from './wal-healing';

// NATS Durable Queue
export {
  DurableQueue,
  DEFAULT_MAX_RETRIES,
  DEFAULT_DURABLE_PREFIX,
} from './nats-queue';
export type {
  QueueMessage,
  QueueDrainResult,
  QueueEvent,
  QueuePersistentState,
  MessageProcessor,
} from './nats-queue';

// Resilience Manager (singleton for API integration)
export {
  getResilienceManager,
  resetResilienceManager,
} from './manager';
export type {
  ResilienceStatus,
} from './manager';

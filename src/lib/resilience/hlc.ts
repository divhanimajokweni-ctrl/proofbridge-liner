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
// VVU EARTH TECH — Hybrid Logical Clock (HLC)
// ============================================================================
//
// Preserves causality during 72-hour network partitions.
// HLC tuple: (wall_time, logical_counter, node_id)
//
// Rules (per spec):
// - tick(): increment logical counter on local event
// - receive(remoteHLC): merge with remote HLC on network message
// - send(): create HLC for outgoing message
//
// Comparison: HLCs are comparable — earlier = causally before
// toString(): wall_time:logical:node_id
//
// All wall_time values from injected Clock provider (NOT Date.now()).
// ============================================================================

import { computeSHA256 } from '@/lib/kernel/hashing';
import { canonicalize } from '@/lib/kernel/canonicalization';
import type { ClockProvider } from '@/lib/kernel/types';

// ---------------------------------------------------------------------------
// §1 — HLC Interface
// ---------------------------------------------------------------------------

/**
 * Hybrid Logical Clock tuple preserving causality during network partitions.
 *
 * (wall_time, logical_counter, node_id)
 *
 * wall_time: physical timestamp from injected clock
 * logical_counter: monotonically increasing counter for ordering within same wall_time
 * node_id: unique identifier for this node in the distributed system
 */
export interface HLCTuple {
  /** Physical timestamp from injected clock (NOT Date.now()) */
  wallTime: number;
  /** Logical counter for ordering events within same wall_time */
  logicalCounter: number;
  /** Unique node identifier */
  nodeId: string;
}

// ---------------------------------------------------------------------------
// §2 — HLC Event
// ---------------------------------------------------------------------------

/**
 * Event emitted on HLC operations for audit trail.
 * SHA-256 hash ensures tamper-evident evidence store entry.
 */
export interface HLCEvent {
  /** Unique event identifier (SHA-256) */
  id: string;
  /** Operation type */
  operation: 'tick' | 'receive' | 'send';
  /** Previous HLC state */
  previous: HLCTuple;
  /** New HLC state after operation */
  current: HLCTuple;
  /** Remote HLC received (only for 'receive' operation) */
  remote?: HLCTuple;
  /** Timestamp from injected clock */
  timestamp: number;
  /** SHA-256 hash of canonicalized event */
  hash: string;
}

// ---------------------------------------------------------------------------
// §3 — HLC Class
// ---------------------------------------------------------------------------

/**
 * Hybrid Logical Clock — preserves causality during 72-hour network partitions.
 *
 * Design principles:
 * - All wall_time values from injected Clock provider (deterministic replay)
 * - HLC tuple: (wall_time, logical_counter, node_id)
 * - Comparison: earlier = causally before
 * - toString(): wall_time:logical:node_id
 * - Every operation emits an HLCEvent with SHA-256 hash for evidence store
 */
export class HybridLogicalClock {
  private wallTime: number;
  private logicalCounter: number = 0;
  private readonly nodeId: string;
  private eventLog: HLCEvent[] = [];

  /**
   * Create a new Hybrid Logical Clock.
   *
   * @param clock Injected Clock provider (MUST NOT use Date.now())
   * @param nodeId Unique identifier for this node in the distributed system
   */
  constructor(
    private readonly clock: ClockProvider,
    nodeId: string = 'node-0',
  ) {
    this.nodeId = nodeId;
    this.wallTime = this.clock.now();
  }

  // ---------------------------------------------------------------------------
  // Core operations
  // ---------------------------------------------------------------------------

  /**
   * tick() — Increment logical counter on local event.
   *
   * If wall_time has advanced since last tick, reset logical counter to 0.
   * If wall_time is the same, increment logical counter.
   */
  tick(): HLCTuple {
    const previous: HLCTuple = {
      wallTime: this.wallTime,
      logicalCounter: this.logicalCounter,
      nodeId: this.nodeId,
    };

    const currentWallTime = this.clock.now();

    if (currentWallTime > this.wallTime) {
      // Wall time has advanced — reset logical counter
      this.wallTime = currentWallTime;
      this.logicalCounter = 0;
    } else {
      // Same wall time (or clock went backward) — increment logical counter
      this.wallTime = this.wallTime; // Keep current wall_time (never go backward)
      this.logicalCounter = this.logicalCounter + 1;
    }

    const current: HLCTuple = {
      wallTime: this.wallTime,
      logicalCounter: this.logicalCounter,
      nodeId: this.nodeId,
    };

    this.emitEvent('tick', previous, current);

    return current;
  }

  /**
   * receive(remoteHLC) — Merge with remote HLC on network message.
   *
   * Preserves causality by ensuring the new HLC is strictly greater than
   * both the local and remote HLCs.
   *
   * Rules (per spec):
   * - If remote.wall_time > local.wall_time:
   *     new.wall_time = remote.wall_time
   *     new.logical = max(local.logical, remote.logical) + 1
   * - If remote.wall_time == local.wall_time:
   *     new.wall_time = local.wall_time
   *     new.logical = max(local.logical, remote.logical) + 1
   * - If remote.wall_time < local.wall_time:
   *     new.wall_time = local.wall_time
   *     new.logical = local.logical + 1
   */
  receive(remoteHLC: HLCTuple): HLCTuple {
    const previous: HLCTuple = {
      wallTime: this.wallTime,
      logicalCounter: this.logicalCounter,
      nodeId: this.nodeId,
    };

    // Also consider the current physical time
    const currentWallTime = this.clock.now();

    // Determine new wall_time and logical_counter
    if (remoteHLC.wallTime > this.wallTime) {
      // Remote wall_time is newer
      this.wallTime = remoteHLC.wallTime;
      this.logicalCounter = Math.max(this.logicalCounter, remoteHLC.logicalCounter) + 1;
    } else if (remoteHLC.wallTime === this.wallTime) {
      // Same wall_time — increment logical counter to break tie
      this.wallTime = this.wallTime;
      this.logicalCounter = Math.max(this.logicalCounter, remoteHLC.logicalCounter) + 1;
    } else {
      // Remote wall_time is older — local wall_time dominates
      this.wallTime = this.wallTime;
      this.logicalCounter = this.logicalCounter + 1;
    }

    // If current physical time is greater than our computed wall_time,
    // we must advance to it (physical time always dominates)
    if (currentWallTime > this.wallTime) {
      this.wallTime = currentWallTime;
      this.logicalCounter = 0;
    }

    const current: HLCTuple = {
      wallTime: this.wallTime,
      logicalCounter: this.logicalCounter,
      nodeId: this.nodeId,
    };

    this.emitEvent('receive', previous, current, remoteHLC);

    return current;
  }

  /**
   * send() — Create HLC for outgoing message.
   * Essentially a tick() that returns the current HLC for attaching to messages.
   */
  send(): HLCTuple {
    return this.tick();
  }

  // ---------------------------------------------------------------------------
  // Comparison
  // ---------------------------------------------------------------------------

  /**
   * Compare two HLC tuples.
   *
   * Returns:
   * -1 if a is causally before b
   *  0 if they are concurrent (same wall_time AND same logical_counter)
   *  1 if a is causally after b
   *
   * HLC comparison rules:
   * 1. Compare wall_time first (physical ordering)
   * 2. If wall_time equal, compare logical_counter (logical ordering)
   * 3. If both equal, compare nodeId (tie-breaking for uniqueness)
   */
  static compare(a: HLCTuple, b: HLCTuple): number {
    if (a.wallTime < b.wallTime) return -1;
    if (a.wallTime > b.wallTime) return 1;

    // wall_time equal — compare logical_counter
    if (a.logicalCounter < b.logicalCounter) return -1;
    if (a.logicalCounter > b.logicalCounter) return 1;

    // Both wall_time and logical_counter equal — compare nodeId
    if (a.nodeId < b.nodeId) return -1;
    if (a.nodeId > b.nodeId) return 1;

    return 0; // Identical
  }

  /**
   * Check if HLC a is causally before HLC b.
   */
  static isBefore(a: HLCTuple, b: HLCTuple): boolean {
    return HybridLogicalClock.compare(a, b) < 0;
  }

  /**
   * Check if HLC a is causally after HLC b.
   */
  static isAfter(a: HLCTuple, b: HLCTuple): boolean {
    return HybridLogicalClock.compare(a, b) > 0;
  }

  /**
   * Check if two HLCs are concurrent (neither is causally before the other).
   * Concurrent means same wall_time AND same logical_counter but different node_id.
   */
  static isConcurrent(a: HLCTuple, b: HLCTuple): boolean {
    return a.wallTime === b.wallTime && a.logicalCounter === b.logicalCounter && a.nodeId !== b.nodeId;
  }

  // ---------------------------------------------------------------------------
  // Accessors
  // ---------------------------------------------------------------------------

  /** Get current HLC tuple */
  getCurrent(): HLCTuple {
    return {
      wallTime: this.wallTime,
      logicalCounter: this.logicalCounter,
      nodeId: this.nodeId,
    };
  }

  /** Get node ID */
  getNodeId(): string {
    return this.nodeId;
  }

  /** Get event log for audit trail */
  getEventLog(): HLCEvent[] {
    return [...this.eventLog];
  }

  // ---------------------------------------------------------------------------
  // Serialization
  // ---------------------------------------------------------------------------

  /**
   * toString(): wall_time:logical:node_id format.
   * Deterministic string representation for hashing and comparison.
   */
  static toString(hlc: HLCTuple): string {
    return `${hlc.wallTime}:${hlc.logicalCounter}:${hlc.nodeId}`;
  }

  /**
   * Parse HLC from string format "wall_time:logical:node_id".
   */
  static fromString(s: string): HLCTuple {
    const parts = s.split(':');
    if (parts.length !== 3) {
      throw new Error(`Invalid HLC string format: ${s}`);
    }
    return {
      wallTime: parseInt(parts[0], 10),
      logicalCounter: parseInt(parts[1], 10),
      nodeId: parts[2],
    };
  }

  /**
   * Compute SHA-256 hash of an HLC tuple for evidence store.
   */
  static hash(hlc: HLCTuple): string {
    return computeSHA256(canonicalize({
      wallTime: hlc.wallTime,
      logicalCounter: hlc.logicalCounter,
      nodeId: hlc.nodeId,
    }));
  }

  // ---------------------------------------------------------------------------
  // Private: event emission
  // ---------------------------------------------------------------------------

  private emitEvent(
    operation: 'tick' | 'receive' | 'send',
    previous: HLCTuple,
    current: HLCTuple,
    remote?: HLCTuple,
  ): void {
    const eventObj = {
      operation,
      previous: {
        wallTime: previous.wallTime,
        logicalCounter: previous.logicalCounter,
        nodeId: previous.nodeId,
      },
      current: {
        wallTime: current.wallTime,
        logicalCounter: current.logicalCounter,
        nodeId: current.nodeId,
      },
      remote: remote ? {
        wallTime: remote.wallTime,
        logicalCounter: remote.logicalCounter,
        nodeId: remote.nodeId,
      } : null,
      timestamp: this.clock.now(),
      nodeId: this.nodeId,
    };

    const id = computeSHA256(canonicalize(eventObj));
    const hash = computeSHA256(canonicalize(eventObj) + id);

    this.eventLog.push({
      id,
      operation,
      previous,
      current,
      remote,
      timestamp: this.clock.now(),
      hash,
    });
  }
}

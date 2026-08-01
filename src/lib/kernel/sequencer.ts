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

// Epistemic Runtime v0.8 — Deterministic Sequencer
// Assigns monotonically increasing sequence numbers.
// No Date.now(). Uses injected clock for timestamps.

import type { ClockProvider } from './types';

export interface SequencedEntry {
  sequence: number;
  timestamp: number;
}

export class DeterministicSequencer {
  private nextSequence: number = 0;
  private clock: ClockProvider;

  constructor(clock: ClockProvider, startSequence: number = 0) {
    this.nextSequence = startSequence;
    this.clock = clock;
  }

  /**
   * Assign the next sequence number and timestamp.
   * Deterministic: same clock → same timestamps.
   */
  next(): SequencedEntry {
    const entry: SequencedEntry = {
      sequence: this.nextSequence,
      timestamp: this.clock.now(),
    };
    this.nextSequence++;
    return entry;
  }

  /**
   * Peek at the next sequence number without advancing.
   */
  peek(): number {
    return this.nextSequence;
  }

  /**
   * Get current sequence counter.
   */
  get current(): number {
    return this.nextSequence - 1;
  }

  /**
   * Reset sequencer for replay.
   */
  reset(startSequence: number = 0): void {
    this.nextSequence = startSequence;
  }
}

/**
 * Compare two sequenced entries for deterministic ordering:
 * 1. Sequence number (primary)
 * 2. Timestamp (secondary)
 * 3. Fact ID (tertiary — tiebreaker via hash comparison)
 */
export function compareSequenced(
  a: { sequence: number; timestamp: number; id?: string },
  b: { sequence: number; timestamp: number; id?: string }
): number {
  if (a.sequence !== b.sequence) return a.sequence - b.sequence;
  if (a.timestamp !== b.timestamp) return a.timestamp - b.timestamp;
  if (a.id && b.id) return a.id.localeCompare(b.id);
  return 0;
}

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

// Epistemic Runtime v0.8 — Clock Provider
// Injected deterministic clock. Never Date.now() inside kernel.

import type { ClockProvider } from '@/lib/kernel/types';

export class DeterministicClock implements ClockProvider {
  private currentTicks: number;
  private step: number;

  constructor(initialTime: number, step: number = 1000) {
    this.currentTicks = initialTime;
    this.step = step;
  }

  now(): number {
    const ticks = this.currentTicks;
    this.currentTicks += this.step;
    return ticks;
  }

  reset(initialTime: number): void {
    this.currentTicks = initialTime;
  }
}

export class SystemClock implements ClockProvider {
  now(): number {
    return Date.now();
  }
  reset(): void {
    // System clock cannot be reset — used for production, not replay
  }
}

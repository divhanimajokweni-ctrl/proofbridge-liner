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

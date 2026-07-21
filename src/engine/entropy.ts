// Epistemic Runtime v0.8 — Entropy Provider
// Injected deterministic entropy. Never Math.random() inside kernel.

import type { EntropyProvider } from '@/lib/kernel/types';

/**
 * Deterministic PRNG using a simple xorshift128+ algorithm.
 * Given the same seed, produces identical byte sequences.
 */
export class DeterministicEntropy implements EntropyProvider {
  private state: [number, number, number, number];

  constructor(seed: Uint8Array) {
    // Initialize state from seed using simple mixing
    this.state = [0, 0, 0, 0];
    for (let i = 0; i < seed.length; i++) {
      this.state[i % 4] = (this.state[i % 4] * 31 + seed[i]) | 0;
    }
    // Ensure non-zero state
    if (this.state[0] === 0 && this.state[1] === 0 &&
        this.state[2] === 0 && this.state[3] === 0) {
      this.state = [1, 2, 3, 4];
    }
    // Warm up
    for (let i = 0; i < 20; i++) this.nextUint32();
  }

  private nextUint32(): number {
    // xorshift128+
    let t = this.state[3];
    t ^= t << 11;
    t ^= t >>> 8;
    this.state[3] = this.state[2];
    this.state[2] = this.state[1];
    this.state[1] = this.state[0];
    t ^= this.state[0];
    t ^= this.state[0] >>> 19;
    this.state[0] = t;
    return t >>> 0;
  }

  bytes(length: number): Uint8Array {
    const result = new Uint8Array(length);
    for (let i = 0; i < length; i++) {
      result[i] = this.nextUint32() & 0xff;
    }
    return result;
  }

  reset(seed: Uint8Array): void {
    this.state = [0, 0, 0, 0];
    for (let i = 0; i < seed.length; i++) {
      this.state[i % 4] = (this.state[i % 4] * 31 + seed[i]) | 0;
    }
    if (this.state[0] === 0 && this.state[1] === 0 &&
        this.state[2] === 0 && this.state[3] === 0) {
      this.state = [1, 2, 3, 4];
    }
    for (let i = 0; i < 20; i++) this.nextUint32();
  }
}

export class SystemEntropy implements EntropyProvider {
  bytes(length: number): Uint8Array {
    const result = new Uint8Array(length);
    if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
      crypto.getRandomValues(result);
    } else {
      // Fallback for environments without crypto (should not happen in production)
      for (let i = 0; i < length; i++) {
        result[i] = Math.floor(Math.random() * 256);
      }
    }
    return result;
  }
  reset(): void {
    // System entropy cannot be reset
  }
}

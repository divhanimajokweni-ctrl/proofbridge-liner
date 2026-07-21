// Epistemic Runtime v0.8 — UUID Provider
// Injected deterministic UUID generation. Never crypto.randomUUID() inside kernel.

import type { UuidProvider } from '@/lib/kernel/types';
import { computeSHA256 } from '@/lib/kernel/hashing';

export class DeterministicUuid implements UuidProvider {
  private counter: number;
  private namespace: string;

  constructor(namespace: string) {
    this.namespace = namespace;
    this.counter = 0;
  }

  generate(): string {
    // Deterministic UUID v5-like: SHA-256 of namespace + counter
    const input = `${this.namespace}:${this.counter}`;
    const hash = computeSHA256(input);
    this.counter++;
    // Format as UUID-like string (8-4-4-4-12) from hash
    return `${hash.slice(0,8)}-${hash.slice(8,12)}-${hash.slice(12,16)}-${hash.slice(16,20)}-${hash.slice(20,32)}`;
  }

  reset(seed: string): void {
    this.namespace = seed;
    this.counter = 0;
  }
}

export class SystemUuid implements UuidProvider {
  generate(): string {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
      return crypto.randomUUID();
    }
    // Fallback
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
      const r = Math.random() * 16 | 0;
      const v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }
  reset(): void {
    // System UUID cannot be reset
  }
}

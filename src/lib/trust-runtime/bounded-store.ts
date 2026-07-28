/**
 * packages/trust-runtime/bounded-store.ts
 *
 * P0 fix: any long-lived state variable (EventJournal, recentTransactions, Lyapunov
 * history) must be bounded, decaying, or archived — never an unbounded Map/array.
 *
 * This provides a fixed-capacity ring buffer with an optional eviction hook, so
 * evicted entries can be flushed to warm storage (Postgres) instead of silently
 * dropped.
 *
 * TIER: Verified operational reality. Plain, well-understood data structure.
 */

export interface BoundedStoreOptions<T> {
  capacity: number;
  /** Called with the evicted item just before it's dropped. Wire this to your
   *  warm-storage writer (Postgres/object store) if you need durability. */
  onEvict?: (evicted: T) => void;
}

export class BoundedRingBuffer<T> {
  private buf: T[] = [];
  private capacity: number;
  private onEvict?: (evicted: T) => void;

  constructor(options: BoundedStoreOptions<T>) {
    if (options.capacity <= 0) {
      throw new Error('BoundedRingBuffer capacity must be > 0');
    }
    this.capacity = options.capacity;
    this.onEvict = options.onEvict;
  }

  push(item: T): void {
    this.buf.push(item);
    if (this.buf.length > this.capacity) {
      const evicted = this.buf.shift();
      if (evicted !== undefined && this.onEvict) {
        this.onEvict(evicted);
      }
    }
  }

  /** Returns items newest-last, oldest-first. */
  toArray(): readonly T[] {
    return this.buf;
  }

  get length(): number {
    return this.buf.length;
  }

  /** Returns the most recent N items, newest-last. */
  recent(n: number): readonly T[] {
    return this.buf.slice(Math.max(0, this.buf.length - n));
  }

  clear(): void {
    this.buf = [];
  }
}

/**
 * Bounded key-value store with LRU eviction — direct replacement for an
 * unbounded `Map<string, TrustEvent>` EventJournal.
 */
export class BoundedLRUMap<K, V> {
  private map = new Map<K, V>();
  private capacity: number;
  private onEvict?: (key: K, value: V) => void;

  constructor(capacity: number, onEvict?: (key: K, value: V) => void) {
    if (capacity <= 0) {
      throw new Error('BoundedLRUMap capacity must be > 0');
    }
    this.capacity = capacity;
    this.onEvict = onEvict;
  }

  get(key: K): V | undefined {
    if (!this.map.has(key)) return undefined;
    const value = this.map.get(key)!;
    // Refresh recency: delete + re-insert moves it to the end of Map's iteration order.
    this.map.delete(key);
    this.map.set(key, value);
    return value;
  }

  set(key: K, value: V): void {
    if (this.map.has(key)) {
      this.map.delete(key);
    } else if (this.map.size >= this.capacity) {
      const oldestKey = this.map.keys().next().value as K;
      const oldestValue = this.map.get(oldestKey)!;
      this.map.delete(oldestKey);
      if (this.onEvict) this.onEvict(oldestKey, oldestValue);
    }
    this.map.set(key, value);
  }

  has(key: K): boolean {
    return this.map.has(key);
  }

  delete(key: K): boolean {
    return this.map.delete(key);
  }

  get size(): number {
    return this.map.size;
  }

  entries(): IterableIterator<[K, V]> {
    return this.map.entries();
  }
}

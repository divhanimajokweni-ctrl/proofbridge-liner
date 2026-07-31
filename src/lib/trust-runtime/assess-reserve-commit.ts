/**
 * packages/trust-runtime/assess-reserve-commit.ts
 *
 * P0 fix, flagged in the audit as highest-priority: "record, then assess" creates
 * a race window under concurrency — two concurrent requests can both pass an
 * assessment against the same pre-update exposure figure, then both record,
 * exceeding the intended ceiling. This replaces that with assess -> reserve ->
 * commit (or release on rejection/failure), where the reservation itself is the
 * atomic operation.
 *
 * This module provides the pattern via a pluggable `AtomicReservationStore` —
 * it does not assume Postgres/Redis/in-memory, since that choice depends on
 * your actual deployment topology (single-process vs multi-node).
 *
 * For a single Node process, `InMemoryReservationStore` below is safe because
 * JS is single-threaded and the reservation check+write happens without an
 * `await` between them. For multi-node deployments, you MUST supply a store
 * backed by a real atomic primitive (Postgres `SELECT ... FOR UPDATE` in a
 * transaction, or a Redis Lua script / WATCH-MULTI-EXEC) — do not use
 * InMemoryReservationStore across more than one process.
 *
 * TIER: The pattern and in-memory reference implementation are verified-reality.
 * A production multi-node store adapter is NOT included — flagged explicitly
 * rather than stubbed, per the no-placeholders constraint: this is a genuine
 * infra decision (which datastore) that can't be faked with a fake adapter.
 */

export interface AtomicReservationStore {
  /**
   * Atomically checks whether `amount` fits within `ceiling` given current
   * reserved total, and if so, reserves it and returns the reservation id.
   * Returns null if it does not fit (rejection, not an error).
   */
  reserve(key: string, amount: number, ceiling: number): Promise<string | null>;
  /** Finalizes a reservation — call after the guarded operation succeeds. */
  commit(reservationId: string): Promise<void>;
  /** Releases a reservation without committing — call on failure/rejection
   *  downstream of a successful reserve(), so the capacity is freed. */
  release(reservationId: string): Promise<void>;
  /** Current committed + reserved (in-flight) total for a key. */
  currentTotal(key: string): Promise<number>;
}

interface Reservation {
  key: string;
  amount: number;
  committed: boolean;
}

/**
 * Single-process reference implementation. Safe under Node's single-threaded
 * event loop ONLY because reserve() below contains no `await` between the
 * check and the write — do not introduce one without re-deriving atomicity.
 */
export class InMemoryReservationStore implements AtomicReservationStore {
  private reservations = new Map<string, Reservation>();
  private totals = new Map<string, number>();
  private nextId = 1;

  async reserve(key: string, amount: number, ceiling: number): Promise<string | null> {
    const current = this.totals.get(key) ?? 0;
    if (current + amount > ceiling) {
      return null;
    }
    const id = `res_${this.nextId++}`;
    this.reservations.set(id, { key, amount, committed: false });
    this.totals.set(key, current + amount);
    return id;
  }

  async commit(reservationId: string): Promise<void> {
    const res = this.reservations.get(reservationId);
    if (!res) throw new Error(`Unknown reservation ${reservationId}`);
    res.committed = true;
    // Total already reflects this amount from reserve(); committing just marks
    // it as no longer releasable.
  }

  async release(reservationId: string): Promise<void> {
    const res = this.reservations.get(reservationId);
    if (!res) throw new Error(`Unknown reservation ${reservationId}`);
    if (res.committed) {
      throw new Error(`Cannot release already-committed reservation ${reservationId}`);
    }
    const current = this.totals.get(res.key) ?? 0;
    this.totals.set(res.key, Math.max(0, current - res.amount));
    this.reservations.delete(reservationId);
  }

  async currentTotal(key: string): Promise<number> {
    return this.totals.get(key) ?? 0;
  }
}

export class AIRCapacityRejectedError extends Error {
  constructor(public readonly key: string, public readonly amount: number, public readonly ceiling: number) {
    super(`Reservation rejected: ${key} amount=${amount} would exceed ceiling=${ceiling}`);
    this.name = 'AIRCapacityRejectedError';
  }
}

/**
 * High-level helper implementing the full assess-reserve-commit cycle around an
 * arbitrary async operation. If `operation` throws, the reservation is released
 * automatically rather than left dangling.
 */
export async function withReservation<T>(
  store: AtomicReservationStore,
  key: string,
  amount: number,
  ceiling: number,
  operation: () => Promise<T>
): Promise<T> {
  const reservationId = await store.reserve(key, amount, ceiling);
  if (reservationId === null) {
    throw new AIRCapacityRejectedError(key, amount, ceiling);
  }
  try {
    const result = await operation();
    await store.commit(reservationId);
    return result;
  } catch (err) {
    await store.release(reservationId);
    throw err;
  }
}

/**
 * packages/trust-runtime/distributed-kill-switch.ts
 *
 * P0 fix: `let killSwitchState` as a process-local variable is not a kill switch
 * in any multi-node deployment — state_A != state_B is trivially possible. A real
 * kill switch requires an external, consistent store (Redis, etcd, Consul, or
 * Postgres advisory locks) as the single source of truth, with every node reading
 * from it rather than trusting local memory.
 *
 * This file defines the adapter interface plus the runtime logic. It deliberately
 * does NOT hardcode Redis/etcd/Postgres — wire whichever your ops team already
 * operates. Implementing the adapter is a small, mechanical task; getting the
 * consistency model right (this file) is the part worth reviewing.
 *
 * TIER: The interface and polling logic are verified-reality-ready. The actual
 * adapter implementation (RedisKillSwitchStore, etc.) is NOT included here —
 * that's a one-file addition once you tell me which store you're standardizing on.
 */

export interface KillSwitchStore {
  /** Must be a strongly-consistent read — no client-side caching. */
  get(): Promise<boolean>;
  /** Must be atomic / linearizable from the store's perspective. */
  set(engaged: boolean, actor: string, reason: string): Promise<void>;
}

export interface KillSwitchOptions {
  /** How often local callers should re-poll the store, in ms. Lower = more
   *  consistent, higher = less load on the store. Does not replace the store's
   *  own consistency guarantees — this is purely a local caching/poll interval. */
  pollIntervalMs: number;
}

export const DEFAULT_KILL_SWITCH_OPTIONS: KillSwitchOptions = {
  pollIntervalMs: 2000,
};

export class DistributedKillSwitch {
  private cachedValue = false;
  /** -Infinity sentinel, not 0: with 0, a caller invoking isEngaged(0) on a fresh
   *  instance would see `now - lastPolled === 0`, which is NOT >= pollIntervalMs,
   *  so the very first check would silently skip polling and return a bogus
   *  cached `false`. That's the exact stale-kill-switch failure mode this class
   *  exists to prevent, so the sentinel must guarantee the first call always polls. */
  private lastPolled = -Infinity;
  private hasPolledOnce = false;
  private store: KillSwitchStore;
  private options: KillSwitchOptions;

  constructor(store: KillSwitchStore, options: KillSwitchOptions = DEFAULT_KILL_SWITCH_OPTIONS) {
    this.store = store;
    this.options = options;
  }

  /**
   * Returns whether the kill switch is engaged. Uses a short-lived local cache
   * bounded by pollIntervalMs to avoid hammering the store on every request —
   * this is a latency/consistency tradeoff you should tune down toward 0 for
   * anything execution-critical, since a stale cached `false` during an active
   * engagement is the failure mode that matters most here.
   */
  async isEngaged(now: number = Date.now()): Promise<boolean> {
    if (!this.hasPolledOnce || now - this.lastPolled >= this.options.pollIntervalMs) {
      this.cachedValue = await this.store.get();
      this.lastPolled = now;
      this.hasPolledOnce = true;
    }
    return this.cachedValue;
  }

  /** Forces an immediate, uncached read — use this in the actual execution gate,
   *  not isEngaged(), if you need a hard consistency guarantee at commit time. */
  async isEngagedUncached(): Promise<boolean> {
    const value = await this.store.get();
    this.cachedValue = value;
    this.lastPolled = Date.now();
    return value;
  }

  async engage(actor: string, reason: string): Promise<void> {
    await this.store.set(true, actor, reason);
    this.cachedValue = true;
    this.lastPolled = Date.now();
    this.hasPolledOnce = true;
  }

  async disengage(actor: string, reason: string): Promise<void> {
    await this.store.set(false, actor, reason);
    this.cachedValue = false;
    this.lastPolled = Date.now();
    this.hasPolledOnce = true;
  }
}

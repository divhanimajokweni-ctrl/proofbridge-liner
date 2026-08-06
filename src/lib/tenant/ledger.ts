// @ts-nocheck
// ============================================================================
// VVU Tenant-Scoped Evidence Ledger
// ============================================================================
// Wraps the base EventStore so every read/write is automatically scoped
// to a tenant. Tenant A can never read, write, or even enumerate
// Tenant B's evidence. The ledger key is `tenant:{tenantId}:*`.
// ============================================================================

import type { TenantContext } from "./context";
import { InMemoryEventStore } from "../trust-runtime/event-store";
import type { RuntimeEvent } from "../trust-runtime/types";

// ---------------------------------------------------------------------------
// Tenant Ledger Interface
// ---------------------------------------------------------------------------

export interface TenantScopedLedger {
  /** Append an event to a tenant's ledger. */
  append(tenant: TenantContext, event: RuntimeEvent): Promise<number>;

  /** Read a single event from a tenant's ledger. */
  read(tenant: TenantContext, sequence: number): Promise<RuntimeEvent | null>;

  /** Read a range of events from a tenant's ledger. */
  readRange(
    tenant: TenantContext,
    from: number,
    to: number,
  ): Promise<RuntimeEvent[]>;

  /** Read all events from a starting sequence. */
  readFrom(
    tenant: TenantContext,
    fromSequence: number,
  ): Promise<RuntimeEvent[]>;

  /** Get total event count for a tenant. */
  size(tenant: TenantContext): Promise<number>;

  /** Check if an eventId exists within a tenant's ledger. */
  exists(tenant: TenantContext, eventId: string): Promise<boolean>;

  /** Save a snapshot scoped to a tenant. */
  saveSnapshot<T>(
    tenant: TenantContext,
    sequence: number,
    state: T,
  ): Promise<void>;

  /** Load the latest snapshot for a tenant. */
  loadLatestSnapshot<T>(
    tenant: TenantContext,
    atSequence?: number,
  ): Promise<{ sequence: number; state: T } | null>;
}

// ---------------------------------------------------------------------------
// In-Memory Tenant-Scoped Ledger
// ---------------------------------------------------------------------------
// Each tenant gets its own InMemoryEventStore instance, ensuring complete
// isolation at the data structure level.

export class InMemoryTenantLedger implements TenantScopedLedger {
  private stores = new Map<string, InMemoryEventStore>();

  private getStore(tenantId: string): InMemoryEventStore {
    let store = this.stores.get(tenantId);
    if (!store) {
      store = new InMemoryEventStore();
      this.stores.set(tenantId, store);
    }
    return store;
  }

  async append(tenant: TenantContext, event: RuntimeEvent): Promise<number> {
    return this.getStore(tenant.tenantId).append(event);
  }

  async read(
    tenant: TenantContext,
    sequence: number,
  ): Promise<RuntimeEvent | null> {
    return this.getStore(tenant.tenantId).read(sequence);
  }

  async readRange(
    tenant: TenantContext,
    from: number,
    to: number,
  ): Promise<RuntimeEvent[]> {
    return this.getStore(tenant.tenantId).readRange(from, to);
  }

  async readFrom(
    tenant: TenantContext,
    fromSequence: number,
  ): Promise<RuntimeEvent[]> {
    return this.getStore(tenant.tenantId).readFrom(fromSequence);
  }

  async size(tenant: TenantContext): Promise<number> {
    return this.getStore(tenant.tenantId).size();
  }

  async exists(tenant: TenantContext, eventId: string): Promise<boolean> {
    return this.getStore(tenant.tenantId).exists(eventId);
  }

  async saveSnapshot<T>(
    tenant: TenantContext,
    sequence: number,
    state: T,
  ): Promise<void> {
    return this.getStore(tenant.tenantId).saveSnapshot(sequence, state);
  }

  async loadLatestSnapshot<T>(
    tenant: TenantContext,
    atSequence?: number,
  ): Promise<{ sequence: number; state: T } | null> {
    return this.getStore(tenant.tenantId).loadLatestSnapshot<T>(atSequence);
  }
}

// ---------------------------------------------------------------------------
// Isolated Ledger Wrapper — enforce tenant identity on every call
// ---------------------------------------------------------------------------
// Wraps any TenantScopedLedger and validates that the TenantContext matches
// an expected tenant before delegating. Prevents accidental context leaks.

export class IsolatedLedgerWrapper {
  private ledger: TenantScopedLedger;

  constructor(ledger: TenantScopedLedger) {
    this.ledger = ledger;
  }

  /** Enforce that the operation targets the expected tenant. */
  private assertTenant(
    ctx: TenantContext,
    expectedTenantId: string,
  ): void {
    if (ctx.tenantId !== expectedTenantId) {
      throw new Error(
        `LEDGER_ISOLATION_VIOLATION: Expected tenant ${expectedTenantId}, got ${ctx.tenantId}`,
      );
    }
  }

  async append(
    ctx: TenantContext,
    event: RuntimeEvent,
    expectedTenantId?: string,
  ): Promise<number> {
    if (expectedTenantId) this.assertTenant(ctx, expectedTenantId);
    return this.ledger.append(ctx, event);
  }

  async read(
    ctx: TenantContext,
    sequence: number,
    expectedTenantId?: string,
  ): Promise<RuntimeEvent | null> {
    if (expectedTenantId) this.assertTenant(ctx, expectedTenantId);
    return this.ledger.read(ctx, sequence);
  }

  async readRange(
    ctx: TenantContext,
    from: number,
    to: number,
    expectedTenantId?: string,
  ): Promise<RuntimeEvent[]> {
    if (expectedTenantId) this.assertTenant(ctx, expectedTenantId);
    return this.ledger.readRange(ctx, from, to);
  }

  async readFrom(
    ctx: TenantContext,
    fromSequence: number,
    expectedTenantId?: string,
  ): Promise<RuntimeEvent[]> {
    if (expectedTenantId) this.assertTenant(ctx, expectedTenantId);
    return this.ledger.readFrom(ctx, fromSequence);
  }

  async size(
    ctx: TenantContext,
    expectedTenantId?: string,
  ): Promise<number> {
    if (expectedTenantId) this.assertTenant(ctx, expectedTenantId);
    return this.ledger.size(ctx);
  }

  async exists(
    ctx: TenantContext,
    eventId: string,
    expectedTenantId?: string,
  ): Promise<boolean> {
    if (expectedTenantId) this.assertTenant(ctx, expectedTenantId);
    return this.ledger.exists(ctx, eventId);
  }
}

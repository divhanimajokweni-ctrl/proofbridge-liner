// ============================================================================
// VVU Tenant Registry — Tenant Record Store
// ============================================================================
// Stores tenant records. In production backed by Supabase; in-memory for
// dev/test. The registry is the authority on which tenants exist and their
// configuration.
// ============================================================================

import { z } from "zod";
import type { TenantContext } from "./context";

// ---------------------------------------------------------------------------
// Tenant Record — persisted representation
// ---------------------------------------------------------------------------

export const TenantRecordSchema = z.object({
  tenantId: z.string().min(1),
  displayName: z.string().min(1),
  tier: z.enum(["starter", "professional", "enterprise"]),
  jurisdiction: z.string().min(1),
  createdAt: z.number().int().positive(),
  updatedAt: z.number().int().positive(),
  active: z.boolean(),
  config: z
    .object({
      maxEvidencePerDay: z.number().int().positive().optional(),
      allowedAttestationPlatforms: z.array(z.string()).optional(),
      webhookUrl: z.string().url().optional(),
    })
    .optional(),
});

export type TenantRecord = z.infer<typeof TenantRecordSchema>;

// ---------------------------------------------------------------------------
// Registry Interface
// ---------------------------------------------------------------------------

export interface TenantRegistry {
  /** Register a new tenant. Throws if tenantId already exists. */
  register(record: Omit<TenantRecord, "updatedAt" | "active">): Promise<void>;

  /** Retrieve a tenant record by ID. Returns null if not found. */
  getById(tenantId: string): Promise<TenantRecord | null>;

  /** List all active tenants. */
  listActive(): Promise<TenantRecord[]>;

  /** Update a tenant's config or metadata. Throws if not found. */
  update(
    tenantId: string,
    patch: Partial<Pick<TenantRecord, "displayName" | "tier" | "config" | "active">>,
  ): Promise<void>;

  /** Convert a TenantRecord to a TenantContext. */
  toContext(record: TenantRecord): TenantContext;

  /** Soft-delete (deactivate) a tenant. */
  deactivate(tenantId: string): Promise<void>;
}

// ---------------------------------------------------------------------------
// In-Memory Tenant Registry (dev / test)
// ---------------------------------------------------------------------------

export class InMemoryTenantRegistry implements TenantRegistry {
  private records = new Map<string, TenantRecord>();

  async register(
    record: Omit<TenantRecord, "updatedAt" | "active">,
  ): Promise<void> {
    if (this.records.has(record.tenantId)) {
      throw new Error(`Tenant ${record.tenantId} already registered`);
    }
    const now = Date.now();
    this.records.set(record.tenantId, {
      ...record,
      updatedAt: now,
      active: true,
    });
  }

  async getById(tenantId: string): Promise<TenantRecord | null> {
    return this.records.get(tenantId) ?? null;
  }

  async listActive(): Promise<TenantRecord[]> {
    return Array.from(this.records.values()).filter((r) => r.active);
  }

  async update(
    tenantId: string,
    patch: Partial<Pick<TenantRecord, "displayName" | "tier" | "config" | "active">>,
  ): Promise<void> {
    const existing = this.records.get(tenantId);
    if (!existing) throw new Error(`Tenant ${tenantId} not found`);
    this.records.set(tenantId, {
      ...existing,
      ...patch,
      updatedAt: Date.now(),
    });
  }

  toContext(record: TenantRecord): TenantContext {
    return {
      tenantId: record.tenantId,
      displayName: record.displayName,
      tier: record.tier,
      jurisdiction: record.jurisdiction,
      createdAt: record.createdAt,
    };
  }

  async deactivate(tenantId: string): Promise<void> {
    await this.update(tenantId, { active: false });
  }
}

// ---------------------------------------------------------------------------
// Supabase Tenant Registry (production)
// ---------------------------------------------------------------------------

function getSupabase() {
  // Lazy-load to avoid throwing at import time in test environments
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const mod = require("@/lib/supabase");
  return mod.supabase;
}

const TENANT_TABLE = "tenants";

export class SupabaseTenantRegistry implements TenantRegistry {
  async register(
    record: Omit<TenantRecord, "updatedAt" | "active">,
  ): Promise<void> {
    const now = Date.now();
    const supabase = getSupabase();
    const { error } = await supabase.from(TENANT_TABLE).insert({
      tenant_id: record.tenantId,
      display_name: record.displayName,
      tier: record.tier,
      jurisdiction: record.jurisdiction,
      created_at: record.createdAt,
      updated_at: now,
      active: true,
      config: record.config ?? {},
    });
    if (error) throw new Error(`Register tenant failed: ${error.message}`);
  }

  async getById(tenantId: string): Promise<TenantRecord | null> {
    const supabase = getSupabase();
    const { data, error } = await supabase
      .from(TENANT_TABLE)
      .select("*")
      .eq("tenant_id", tenantId)
      .single();
    if (error || !data) return null;
    return this.mapRow(data);
  }

  async listActive(): Promise<TenantRecord[]> {
    const supabase = getSupabase();
    const { data, error } = await supabase
      .from(TENANT_TABLE)
      .select("*")
      .eq("active", true);
    if (error || !data) return [];
    return data.map(this.mapRow);
  }

  async update(
    tenantId: string,
    patch: Partial<Pick<TenantRecord, "displayName" | "tier" | "config" | "active">>,
  ): Promise<void> {
    const dbPatch: Record<string, unknown> = { updated_at: Date.now() };
    if (patch.displayName !== undefined) dbPatch.display_name = patch.displayName;
    if (patch.tier !== undefined) dbPatch.tier = patch.tier;
    if (patch.config !== undefined) dbPatch.config = patch.config;
    if (patch.active !== undefined) dbPatch.active = patch.active;

    const supabase = getSupabase();
    const { error } = await supabase
      .from(TENANT_TABLE)
      .update(dbPatch)
      .eq("tenant_id", tenantId);
    if (error) throw new Error(`Update tenant failed: ${error.message}`);
  }

  toContext(record: TenantRecord): TenantContext {
    return {
      tenantId: record.tenantId,
      displayName: record.displayName,
      tier: record.tier,
      jurisdiction: record.jurisdiction,
      createdAt: record.createdAt,
    };
  }

  async deactivate(tenantId: string): Promise<void> {
    await this.update(tenantId, { active: false });
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private mapRow(row: any): TenantRecord {
    return {
      tenantId: row.tenant_id,
      displayName: row.display_name,
      tier: row.tier,
      jurisdiction: row.jurisdiction,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      active: row.active,
      config: row.config,
    };
  }
}

// ============================================================================
// VVU Tenant-Scoped Audit Logger
// ============================================================================
// Every operation in the system emits an audit entry tagged with tenant_id.
// The logger enforces that audit entries are tenant-scoped and append-only.
// ============================================================================

import type { TenantContext } from "./context";

// ---------------------------------------------------------------------------
// Audit Entry
// ---------------------------------------------------------------------------

export type AuditSeverity = "info" | "warn" | "error" | "critical";

export interface AuditEntry {
  /** Auto-generated unique ID. */
  entryId: string;
  /** Tenant this event belongs to. */
  tenantId: string;
  /** ISO-8601 timestamp. */
  timestamp: string;
  /** Severity level. */
  severity: AuditSeverity;
  /** Operation category (e.g. "evidence.append", "secret.read"). */
  category: string;
  /** Human-readable message. */
  message: string;
  /** Actor who initiated the operation (user ID or system). */
  actor: string;
  /** Optional metadata (request ID, IP, etc). */
  metadata?: Record<string, unknown>;
}

// ---------------------------------------------------------------------------
// Audit Logger Interface
// ---------------------------------------------------------------------------

export interface TenantAuditLogger {
  /** Write an audit entry for a tenant. */
  log(tenant: TenantContext, entry: Omit<AuditEntry, "entryId" | "tenantId" | "timestamp">): Promise<void>;

  /** Query audit entries for a tenant. */
  query(
    tenant: TenantContext,
    options?: {
      severity?: AuditSeverity;
      category?: string;
      from?: number;
      limit?: number;
    },
  ): Promise<AuditEntry[]>;

  /** Count entries for a tenant (for quota checks). */
  count(tenant: TenantContext): Promise<number>;
}

// ---------------------------------------------------------------------------
// In-Memory Audit Logger (dev / test)
// ---------------------------------------------------------------------------

export class InMemoryAuditLogger implements TenantAuditLogger {
  private entries: AuditEntry[] = [];

  async log(
    tenant: TenantContext,
    entry: Omit<AuditEntry, "entryId" | "tenantId" | "timestamp">,
  ): Promise<void> {
    this.entries.push({
      ...entry,
      entryId: `audit-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      tenantId: tenant.tenantId,
      timestamp: new Date().toISOString(),
    });
  }

  async query(
    tenant: TenantContext,
    options?: {
      severity?: AuditSeverity;
      category?: string;
      from?: number;
      limit?: number;
    },
  ): Promise<AuditEntry[]> {
    let results = this.entries.filter((e) => e.tenantId === tenant.tenantId);

    if (options?.severity) {
      results = results.filter((e) => e.severity === options.severity);
    }
    if (options?.category) {
      results = results.filter((e) => e.category === options.category);
    }
    if (options?.from) {
      results = results.filter(
        (e) => new Date(e.timestamp).getTime() >= options.from!,
      );
    }

    // Return most recent first
    results.sort(
      (a, b) =>
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
    );

    if (options?.limit) {
      results = results.slice(0, options.limit);
    }

    return results;
  }

  async count(tenant: TenantContext): Promise<number> {
    return this.entries.filter((e) => e.tenantId === tenant.tenantId).length;
  }
}

// ---------------------------------------------------------------------------
// Supabase Audit Logger (production)
// ---------------------------------------------------------------------------

function getSupabase() {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const mod = require("@/lib/supabase");
  return mod.supabase;
}

const AUDIT_TABLE = "tenant_audit_log";

export class SupabaseAuditLogger implements TenantAuditLogger {
  async log(
    tenant: TenantContext,
    entry: Omit<AuditEntry, "entryId" | "tenantId" | "timestamp">,
  ): Promise<void> {
    const supabase = getSupabase();
    const { error } = await supabase.from(AUDIT_TABLE).insert({
      entry_id: `audit-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      tenant_id: tenant.tenantId,
      timestamp: new Date().toISOString(),
      severity: entry.severity,
      category: entry.category,
      message: entry.message,
      actor: entry.actor,
      metadata: entry.metadata ?? {},
    });
    if (error) throw new Error(`Audit log write failed: ${error.message}`);
  }

  async query(
    tenant: TenantContext,
    options?: {
      severity?: AuditSeverity;
      category?: string;
      from?: number;
      limit?: number;
    },
  ): Promise<AuditEntry[]> {
    const supabase = getSupabase();
    let query = supabase
      .from(AUDIT_TABLE)
      .select("*")
      .eq("tenant_id", tenant.tenantId)
      .order("timestamp", { ascending: false });

    if (options?.severity) {
      query = query.eq("severity", options.severity);
    }
    if (options?.category) {
      query = query.eq("category", options.category);
    }
    if (options?.from) {
      query = query.gte("timestamp", new Date(options.from).toISOString());
    }
    if (options?.limit) {
      query = query.limit(options.limit);
    }

    const { data, error } = await query;
    if (error || !data) return [];

    return data.map((row: Record<string, unknown>) => ({
      entryId: row.entry_id,
      tenantId: row.tenant_id,
      timestamp: row.timestamp,
      severity: row.severity,
      category: row.category,
      message: row.message,
      actor: row.actor,
      metadata: row.metadata,
    }));
  }

  async count(tenant: TenantContext): Promise<number> {
    const supabase = getSupabase();
    const { count, error } = await supabase
      .from(AUDIT_TABLE)
      .select("*", { count: "exact", head: true })
      .eq("tenant_id", tenant.tenantId);
    if (error) throw new Error(`Audit count failed: ${error.message}`);
    return count ?? 0;
  }
}

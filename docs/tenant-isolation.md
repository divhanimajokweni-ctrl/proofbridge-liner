# Tenant Isolation — Technical Specification

## Overview

BOTTLENECK 2: Port-Based Multi-Tenant Isolation for ProofBridge.

**Status:** Implemented (lightweight version for single-client pilot)
**Test coverage:** 27 automated isolation tests
**Backward compatible:** Yes — all tenant fields default to `"default"`

---

## Architecture

### TenantContext — Identity Envelope

```typescript
interface TenantContext {
  tenantId: string;        // Unique client identifier
  displayName: string;     // Human-readable name
  tier: "starter" | "professional" | "enterprise";
  jurisdiction: string;    // ISO country code (e.g. "ZA")
  createdAt: number;       // Unix timestamp
  metadata?: Record<string, unknown>;
}
```

**Extraction methods:**
- `extractFromHeaders(headers)` — reads `x-vvu-tenant-*` headers set by middleware
- `extractFromCookie(cookieHeader)` — reads from `vvu_session` cookie
- `extractFromToken(payload)` — reads from JWT payload
- `defaultTenantContext()` — returns fallback for single-tenant mode

### TenantRegistry — Client Record Store

```typescript
interface TenantRegistry {
  register(record): Promise<void>;
  getById(tenantId): Promise<TenantRecord | null>;
  listActive(): Promise<TenantRecord[]>;
  update(tenantId, patch): Promise<void>;
  toContext(record): TenantContext;
  deactivate(tenantId): Promise<void>;
}
```

**Implementations:**
- `InMemoryTenantRegistry` — dev/test (Map-based)
- `SupabaseTenantRegistry` — production (PostgreSQL via Supabase)

### SecretProvider — Tenant-Scoped Secrets

```typescript
interface SecretProvider {
  getSecret(tenant, name): Promise<string | null>;
  getSecrets(tenant, names[]): Promise<Record<string, string>>;
  hasSecret(tenant, name): Promise<boolean>;
}
```

**Implementations:**
- `EnvSecretProvider` — reads `TENANT_{ID}_{SECRET}` env vars, falls back to `{SECRET}`
- `VaultSecretProvider` — HashiCorp Vault integration (stub)

### TenantScopedLedger — Isolated Event Storage

```typescript
interface TenantScopedLedger {
  append(tenant, event): Promise<number>;
  read(tenant, sequence): Promise<RuntimeEvent | null>;
  readRange(tenant, from, to): Promise<RuntimeEvent[]>;
  readFrom(tenant, fromSequence): Promise<RuntimeEvent[]>;
  size(tenant): Promise<number>;
  exists(tenant, eventId): Promise<boolean>;
  saveSnapshot(tenant, sequence, state): Promise<void>;
  loadLatestSnapshot(tenant, atSequence?): Promise<...>;
}
```

**Implementations:**
- `InMemoryTenantLedger` — one `InMemoryEventStore` per tenant (complete isolation)
- `IsolatedLedgerWrapper` — enforcement layer that validates tenant identity

### TenantAuditLogger — Per-Tenant Audit Trail

```typescript
interface TenantAuditLogger {
  log(tenant, entry): Promise<void>;
  query(tenant, options?): Promise<AuditEntry[]>;
  count(tenant): Promise<number>;
}
```

**Implementations:**
- `InMemoryAuditLogger` — dev/test
- `SupabaseAuditLogger` — production (PostgreSQL)

---

## Integration Flow

### 1. Middleware (Request Entry Point)

```
Supabase auth.getUser()
    │
    ▼
Extract tenant_id from user.user_metadata or user.app_metadata
    │
    ▼
Set response headers:
  x-vvu-tenant-id: {tenantId}
  x-vvu-tenant-tier: {tier}
  x-vvu-tenant-jurisdiction: {jurisdiction}
```

### 2. Route Handlers

```typescript
import { extractFromHeaders } from "@/lib/tenant/context";

export async function POST(req: NextRequest) {
  const tenant = extractFromHeaders(req.headers);
  // tenant is TenantContext | null
  // null means single-tenant mode (use defaultTenantContext())
}
```

### 3. Command Handler

```typescript
// Commands carry optional tenantId
const command: Command = {
  type: "SubmitEvidence",
  evidence: { ... },
  idempotencyKey: "key-123",
  tenantId: "client-alpha",  // optional, defaults to "default"
};

// Events are automatically stamped with tenantId
const events = await runtime.dispatch(command, "client-alpha");
```

### 4. persistReceipt

```typescript
import { persistReceipt } from "@/lib/audit";
import { extractFromHeaders } from "@/lib/tenant/context";

const tenant = extractFromHeaders(req.headers);
await persistReceipt(payload, tenant ?? defaultTenantContext());
```

---

## Isolation Guarantees

| Guarantee | Enforcement |
|-----------|-------------|
| Tenant A cannot read Tenant B's events | Separate `InMemoryEventStore` per tenant |
| Tenant A cannot read Tenant B's secrets | `EnvSecretProvider` prefixes env vars by tenant ID |
| Tenant A cannot query Tenant B's audit log | `InMemoryAuditLogger` filters by `tenantId` |
| Cross-tenant access throws error | `IsolatedLedgerWrapper` validates tenant identity |
| Sequence numbers are independent | Each tenant's store has its own counter |
| Snapshots are tenant-scoped | Snapshot storage is per-store |

---

## Configuration

### Environment Variables

```bash
# Per-tenant secrets (EnvSecretProvider)
TENANT_ALPHA_API_KEY=alpha-secret-key
TENANT_BRAVO_API_KEY=bravo-secret-key

# Generic fallback (shared across tenants)
GENERIC_SECRET=shared-fallback

# Vault (production, optional)
VAULT_URL=https://vault.internal:8200
VAULT_TOKEN=hvs.xxx
VAULT_MOUNT_PATH=vvu
```

### Supabase Tables

```sql
-- Tenant registry
CREATE TABLE tenants (
  tenant_id TEXT PRIMARY KEY,
  display_name TEXT NOT NULL,
  tier TEXT NOT NULL CHECK (tier IN ('starter', 'professional', 'enterprise')),
  jurisdiction TEXT NOT NULL,
  created_at BIGINT NOT NULL,
  updated_at BIGINT NOT NULL,
  active BOOLEAN DEFAULT true,
  config JSONB DEFAULT '{}'
);

-- Tenant audit log
CREATE TABLE tenant_audit_log (
  entry_id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL REFERENCES tenants(tenant_id),
  timestamp TIMESTAMPTZ NOT NULL,
  severity TEXT NOT NULL CHECK (severity IN ('info', 'warn', 'error', 'critical')),
  category TEXT NOT NULL,
  message TEXT NOT NULL,
  actor TEXT NOT NULL,
  metadata JSONB DEFAULT '{}'
);

-- Receipts (add tenant_id column)
ALTER TABLE receipts ADD COLUMN tenant_id TEXT DEFAULT 'default';
```

---

## Test Coverage

27 tests in `src/lib/tenant/__tests__/isolation.test.ts`:

| Category | Tests |
|----------|-------|
| TenantContext extraction | 4 tests (valid token, invalid tier, missing ID, default) |
| TenantRegistry CRUD | 5 tests (register, duplicate, unknown, list active, toContext) |
| Secret isolation | 7 tests (tenant-scoped, fallback, nonexistent, batch, hasSecret, cross-tenant leak) |
| Ledger isolation | 5 tests (independent sequences, cross-tenant read blocked, readFrom scoped, exists scoped, snapshots scoped) |
| IsolatedLedgerWrapper | 2 tests (matching tenant, mismatch throws) |
| Audit log isolation | 4 tests (query scoped, count scoped, severity filter, category filter) |

---

## Migration Path

### From Single-Tenant to Multi-Tenant

1. Add `tenant_id` column to existing tables (default: `"default"`)
2. Set `tenant_id` in Supabase user metadata for each client
3. All existing data is automatically associated with `"default"` tenant
4. New requests carry tenant context via headers

### From Port-Based to Process-Based (Future)

The current implementation uses in-memory isolation (port-based). To upgrade:
1. Replace `InMemoryTenantLedger` with a database-backed implementation
2. Replace `InMemoryAuditLogger` with `SupabaseAuditLogger`
3. Replace `InMemoryTenantRegistry` with `SupabaseTenantRegistry`
4. The interfaces remain identical — only the implementation changes

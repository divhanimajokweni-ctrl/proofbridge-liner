// @ts-nocheck
// ============================================================================
// VVU Tenant Isolation — Integration Tests
// ============================================================================
// Verifies that tenants cannot read each other's data, secrets, or audit
// entries. This is the core isolation contract.
// ============================================================================

import { describe, it, expect, beforeEach } from "vitest";
import {
  extractFromToken,
  defaultTenantContext,
  validateTenantContext,
} from "../context";
import type { TenantContext } from "../context";
import { InMemoryTenantRegistry } from "../registry";
import { EnvSecretProvider } from "../secrets";
import { InMemoryTenantLedger, IsolatedLedgerWrapper } from "../ledger";
import { InMemoryAuditLogger } from "../audit";
import type { RuntimeEvent } from "../trust-runtime/types";

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

function makeTenant(overrides: Partial<TenantContext> = {}): TenantContext {
  return {
    tenantId: "tenant-alpha",
    displayName: "Alpha Corp",
    tier: "professional",
    jurisdiction: "ZA",
    createdAt: Date.now(),
    ...overrides,
  };
}

function makeEvent(overrides: Partial<RuntimeEvent> = {}): RuntimeEvent {
  return {
    eventId: `evt-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    type: "EvidenceReceived",
    version: 1,
    timestamp: Date.now(),
    sequence: 0,
    correlationId: "test-corr",
    causationId: null,
    source: "test",
    payload: { claim: "test evidence", source: "test", confidence: "high" },
    tenantId: "default",
    streamId: "default-stream",
    streamVersion: 1,
    schemaVersion: 1,
    payloadHash: "abc123",
    eventHash: "def456",
    previousHash: null,
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// TenantContext Extraction
// ---------------------------------------------------------------------------

describe("TenantContext", () => {
  it("extracts from a valid token payload", () => {
    const ctx = extractFromToken({
      tenant_id: "t-1",
      display_name: "Test",
      tier: "enterprise",
      jurisdiction: "US",
      created_at: 1000,
    });
    expect(ctx).not.toBeNull();
    expect(ctx!.tenantId).toBe("t-1");
    expect(ctx!.tier).toBe("enterprise");
  });

  it("returns null for invalid tier", () => {
    const ctx = extractFromToken({ tenant_id: "t-1", tier: "invalid" });
    expect(ctx).toBeNull();
  });

  it("returns null for missing tenant_id", () => {
    const ctx = extractFromToken({ tier: "starter" });
    expect(ctx).toBeNull();
  });

  it("defaultTenantContext returns a valid context", () => {
    const ctx = defaultTenantContext();
    expect(validateTenantContext(ctx)).not.toBeNull();
  });
});

// ---------------------------------------------------------------------------
// Tenant Registry
// ---------------------------------------------------------------------------

describe("InMemoryTenantRegistry", () => {
  let registry: InMemoryTenantRegistry;

  beforeEach(() => {
    registry = new InMemoryTenantRegistry();
  });

  it("registers and retrieves a tenant", async () => {
    const tenant = makeTenant();
    await registry.register(tenant);
    const record = await registry.getById("tenant-alpha");
    expect(record).not.toBeNull();
    expect(record!.displayName).toBe("Alpha Corp");
  });

  it("throws on duplicate registration", async () => {
    await registry.register(makeTenant());
    await expect(registry.register(makeTenant())).rejects.toThrow(
      "already registered",
    );
  });

  it("returns null for unknown tenant", async () => {
    const record = await registry.getById("nonexistent");
    expect(record).toBeNull();
  });

  it("lists only active tenants", async () => {
    await registry.register(makeTenant());
    await registry.register(makeTenant({ tenantId: "t-2" }));
    await registry.deactivate("tenant-alpha");

    const active = await registry.listActive();
    expect(active).toHaveLength(1);
    expect(active[0].tenantId).toBe("t-2");
  });

  it("converts record to context", async () => {
    await registry.register(makeTenant());
    const record = await registry.getById("tenant-alpha");
    const ctx = registry.toContext(record!);
    expect(ctx.tenantId).toBe("tenant-alpha");
  });
});

// ---------------------------------------------------------------------------
// Secret Provider — Tenant Isolation
// ---------------------------------------------------------------------------

describe("EnvSecretProvider — tenant isolation", () => {
  let provider: EnvSecretProvider;

  beforeEach(() => {
    provider = new EnvSecretProvider();
    process.env["TENANT_ALPHA_API_KEY"] = "alpha-secret-key";
    process.env["TENANT_BRAVO_API_KEY"] = "bravo-secret-key";
    process.env["GENERIC_SECRET"] = "shared-fallback";
  });

  it("resolves tenant-scoped secrets", async () => {
    const alpha = makeTenant({ tenantId: "alpha" });
    const bravo = makeTenant({ tenantId: "bravo" });

    const alphaKey = await provider.getSecret(alpha, "API_KEY");
    const bravoKey = await provider.getSecret(bravo, "API_KEY");

    expect(alphaKey).toBe("alpha-secret-key");
    expect(bravoKey).toBe("bravo-secret-key");
  });

  it("falls back to generic env var", async () => {
    const tenant = makeTenant({ tenantId: "unknown" });
    const secret = await provider.getSecret(tenant, "GENERIC_SECRET");
    expect(secret).toBe("shared-fallback");
  });

  it("returns null for nonexistent secret", async () => {
    const tenant = makeTenant();
    const secret = await provider.getSecret(tenant, "NONEXISTENT_KEY");
    expect(secret).toBeNull();
  });

  it("getSecrets returns only available secrets", async () => {
    const alpha = makeTenant({ tenantId: "alpha" });
    const secrets = await provider.getSecrets(alpha, ["API_KEY", "MISSING"]);
    expect(secrets).toEqual({ API_KEY: "alpha-secret-key" });
  });

  it("hasSecret returns correct boolean", async () => {
    const alpha = makeTenant({ tenantId: "alpha" });
    expect(await provider.hasSecret(alpha, "API_KEY")).toBe(true);
    expect(await provider.hasSecret(alpha, "NOPE")).toBe(false);
  });

  it("never leaks tenant A secret to tenant B", async () => {
    const alpha = makeTenant({ tenantId: "alpha" });
    const bravo = makeTenant({ tenantId: "bravo" });

    const alphaVal = await provider.getSecret(alpha, "API_KEY");
    const bravoVal = await provider.getSecret(bravo, "API_KEY");

    expect(alphaVal).not.toBe(bravoVal);
    expect(alphaVal).toBe("alpha-secret-key");
    expect(bravoVal).toBe("bravo-secret-key");
  });
});

// ---------------------------------------------------------------------------
// Tenant-Scoped Ledger — Data Isolation
// ---------------------------------------------------------------------------

describe("InMemoryTenantLedger — tenant isolation", () => {
  let ledger: InMemoryTenantLedger;
  const alpha = makeTenant({ tenantId: "alpha" });
  const bravo = makeTenant({ tenantId: "bravo" });

  beforeEach(() => {
    ledger = new InMemoryTenantLedger();
  });

  it("each tenant has independent sequence numbers", async () => {
    await ledger.append(alpha, makeEvent({ eventId: "a1", tenantId: "alpha" }));
    await ledger.append(alpha, makeEvent({ eventId: "a2", tenantId: "alpha" }));
    await ledger.append(bravo, makeEvent({ eventId: "b1", tenantId: "bravo" }));

    expect(await ledger.size(alpha)).toBe(2);
    expect(await ledger.size(bravo)).toBe(1);
  });

  it("tenant A cannot read tenant B events", async () => {
    await ledger.append(bravo, makeEvent({ eventId: "b-secret", tenantId: "bravo" }));

    const event = await ledger.read(bravo, 1);
    expect(event).not.toBeNull();
    expect(event!.eventId).toBe("b-secret");

    // Alpha's ledger is empty — the event doesn't exist there
    const alphaEvent = await ledger.read(alpha, 1);
    expect(alphaEvent).toBeNull();
  });

  it("tenant A cannot enumerate tenant B events via readFrom", async () => {
    await ledger.append(bravo, makeEvent({ eventId: "b1", tenantId: "bravo" }));
    await ledger.append(bravo, makeEvent({ eventId: "b2", tenantId: "bravo" }));

    const alphaEvents = await ledger.readFrom(alpha, 1);
    expect(alphaEvents).toHaveLength(0);

    const bravoEvents = await ledger.readFrom(bravo, 1);
    expect(bravoEvents).toHaveLength(2);
  });

  it("exists only checks within tenant scope", async () => {
    await ledger.append(bravo, makeEvent({ eventId: "b-unique", tenantId: "bravo" }));

    expect(await ledger.exists(bravo, "b-unique")).toBe(true);
    expect(await ledger.exists(alpha, "b-unique")).toBe(false);
  });

  it("snapshots are tenant-scoped", async () => {
    await ledger.append(alpha, makeEvent({ eventId: "a1", tenantId: "alpha" }));
    await ledger.saveSnapshot(alpha, 1, { trust: 0.9 });
    await ledger.append(bravo, makeEvent({ eventId: "b1", tenantId: "bravo" }));

    const alphaSnap = await ledger.loadLatestSnapshot<{ trust: number }>(alpha);
    expect(alphaSnap).not.toBeNull();
    expect(alphaSnap!.state.trust).toBe(0.9);

    const bravoSnap = await ledger.loadLatestSnapshot(bravo);
    expect(bravoSnap).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// IsolatedLedgerWrapper — enforcement
// ---------------------------------------------------------------------------

describe("IsolatedLedgerWrapper", () => {
  let ledger: InMemoryTenantLedger;
  let wrapper: IsolatedLedgerWrapper;
  const alpha = makeTenant({ tenantId: "alpha" });

  beforeEach(() => {
    ledger = new InMemoryTenantLedger();
    wrapper = new IsolatedLedgerWrapper(ledger);
  });

  it("allows operations with matching tenant", async () => {
    const seq = await wrapper.append(
      alpha,
      makeEvent({ eventId: "ok", tenantId: "alpha" }),
      "alpha",
    );
    expect(seq).toBe(1);
  });

  it("throws on tenant mismatch", async () => {
    await expect(
      wrapper.append(
        alpha,
        makeEvent({ eventId: "bad", tenantId: "alpha" }),
        "wrong-tenant",
      ),
    ).rejects.toThrow("ISOLATION_VIOLATION");
  });
});

// ---------------------------------------------------------------------------
// Audit Logger — Tenant Isolation
// ---------------------------------------------------------------------------

describe("InMemoryAuditLogger — tenant isolation", () => {
  let logger: InMemoryAuditLogger;
  const alpha = makeTenant({ tenantId: "alpha" });
  const bravo = makeTenant({ tenantId: "bravo" });

  beforeEach(() => {
    logger = new InMemoryAuditLogger();
  });

  it("logs and queries within tenant scope", async () => {
    await logger.log(alpha, {
      severity: "info",
      category: "evidence.append",
      message: "Evidence added",
      actor: "user-1",
    });
    await logger.log(bravo, {
      severity: "error",
      category: "secret.read",
      message: "Secret access denied",
      actor: "user-2",
    });

    const alphaEntries = await logger.query(alpha);
    expect(alphaEntries).toHaveLength(1);
    expect(alphaEntries[0].category).toBe("evidence.append");

    const bravoEntries = await logger.query(bravo);
    expect(bravoEntries).toHaveLength(1);
    expect(bravoEntries[0].severity).toBe("error");
  });

  it("count is tenant-scoped", async () => {
    await logger.log(alpha, {
      severity: "info",
      category: "test",
      message: "msg1",
      actor: "sys",
    });
    await logger.log(alpha, {
      severity: "info",
      category: "test",
      message: "msg2",
      actor: "sys",
    });
    await logger.log(bravo, {
      severity: "info",
      category: "test",
      message: "msg3",
      actor: "sys",
    });

    expect(await logger.count(alpha)).toBe(2);
    expect(await logger.count(bravo)).toBe(1);
  });

  it("filters by severity within tenant", async () => {
    await logger.log(alpha, {
      severity: "info",
      category: "test",
      message: "info",
      actor: "sys",
    });
    await logger.log(alpha, {
      severity: "critical",
      category: "test",
      message: "crit",
      actor: "sys",
    });

    const criticals = await logger.query(alpha, { severity: "critical" });
    expect(criticals).toHaveLength(1);
    expect(criticals[0].message).toBe("crit");
  });

  it("filters by category within tenant", async () => {
    await logger.log(alpha, {
      severity: "info",
      category: "auth.login",
      message: "login",
      actor: "user",
    });
    await logger.log(alpha, {
      severity: "info",
      category: "auth.logout",
      message: "logout",
      actor: "user",
    });

    const logins = await logger.query(alpha, { category: "auth.login" });
    expect(logins).toHaveLength(1);
  });

  it("enforces limit within tenant scope", async () => {
    for (let i = 0; i < 10; i++) {
      await logger.log(alpha, {
        severity: "info",
        category: "test",
        message: `msg-${i}`,
        actor: "sys",
      });
    }

    const limited = await logger.query(alpha, { limit: 3 });
    expect(limited).toHaveLength(3);
  });
});

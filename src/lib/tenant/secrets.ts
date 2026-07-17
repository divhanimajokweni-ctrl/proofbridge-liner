// ============================================================================
// VVU Secret Provider — Tenant-Scoped Secret Resolution
// ============================================================================
// Abstracts secret access so each tenant's cryptographic material and
// configuration secrets are resolved independently. Supports env-based
// (dev) and Vault-based (prod) backends.
// ============================================================================

import type { TenantContext } from "./context";

// ---------------------------------------------------------------------------
// Secret Provider Interface
// ---------------------------------------------------------------------------

export interface SecretProvider {
  /** Retrieve a named secret for a specific tenant. */
  getSecret(tenant: TenantContext, name: string): Promise<string | null>;

  /** Retrieve multiple secrets in one call. Returns a map of name → value. */
  getSecrets(
    tenant: TenantContext,
    names: string[],
  ): Promise<Record<string, string>>;

  /** Check if a secret exists for a tenant (without retrieving value). */
  hasSecret(tenant: TenantContext, name: string): Promise<boolean>;
}

// ---------------------------------------------------------------------------
// Environment Variable Secret Provider (dev / single-tenant)
// ---------------------------------------------------------------------------
// Reads secrets as `TENANT_{TENANT_ID}_{SECRET_NAME}` from env.
// Falls back to `{SECRET_NAME}` without tenant prefix for backward compat.

export class EnvSecretProvider implements SecretProvider {
  async getSecret(
    tenant: TenantContext,
    name: string,
  ): Promise<string | null> {
    const tenantKey = `TENANT_${tenant.tenantId.toUpperCase()}_${name.toUpperCase()}`;
    const genericKey = name.toUpperCase();

    return process.env[tenantKey] ?? process.env[genericKey] ?? null;
  }

  async getSecrets(
    tenant: TenantContext,
    names: string[],
  ): Promise<Record<string, string>> {
    const result: Record<string, string> = {};
    for (const name of names) {
      const value = await this.getSecret(tenant, name);
      if (value !== null) {
        result[name] = value;
      }
    }
    return result;
  }

  async hasSecret(
    tenant: TenantContext,
    name: string,
  ): Promise<boolean> {
    const value = await this.getSecret(tenant, name);
    return value !== null;
  }
}

// ---------------------------------------------------------------------------
// Vault Secret Provider (production — stub for future HashiCorp Vault impl)
// ---------------------------------------------------------------------------

export interface VaultConfig {
  /** Vault server URL (e.g. https://vault.internal:8200). */
  url: string;
  /** Auth token or approle credentials. */
  token: string;
  /** Mount path for tenant secrets. */
  mountPath: string;
}

export class VaultSecretProvider implements SecretProvider {
  constructor(private readonly config: VaultConfig) {}

  async getSecret(
    tenant: TenantContext,
    name: string,
  ): Promise<string | null> {
    const path = `${this.config.mountPath}/tenants/${tenant.tenantId}/${name}`;
    try {
      const response = await fetch(`${this.config.url}/v1/${path}`, {
        headers: {
          "X-Vault-Token": this.config.token,
        },
      });
      if (!response.ok) return null;
      const body = await response.json();
      return body?.data?.data?.value ?? null;
    } catch {
      return null;
    }
  }

  async getSecrets(
    tenant: TenantContext,
    names: string[],
  ): Promise<Record<string, string>> {
    const result: Record<string, string> = {};
    for (const name of names) {
      const value = await this.getSecret(tenant, name);
      if (value !== null) {
        result[name] = value;
      }
    }
    return result;
  }

  async hasSecret(
    tenant: TenantContext,
    name: string,
  ): Promise<boolean> {
    return (await this.getSecret(tenant, name)) !== null;
  }
}

// ---------------------------------------------------------------------------
// Factory — pick provider based on environment
// ---------------------------------------------------------------------------

export function createSecretProvider(): SecretProvider {
  if (process.env.VAULT_URL && process.env.VAULT_TOKEN) {
    return new VaultSecretProvider({
      url: process.env.VAULT_URL,
      token: process.env.VAULT_TOKEN,
      mountPath: process.env.VAULT_MOUNT_PATH ?? "vvu",
    });
  }
  return new EnvSecretProvider();
}

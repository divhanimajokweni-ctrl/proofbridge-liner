// ============================================================================
// VVU Tenant Isolation — Public API
// ============================================================================

export {
  TenantContextSchema,
  extractFromToken,
  extractFromCookie,
  extractFromHeaders,
  defaultTenantContext,
  validateTenantContext,
  type TenantContext,
} from "./context";

export {
  TenantRecordSchema,
  InMemoryTenantRegistry,
  SupabaseTenantRegistry,
  type TenantRecord,
  type TenantRegistry,
} from "./registry";

export {
  EnvSecretProvider,
  VaultSecretProvider,
  createSecretProvider,
  type SecretProvider,
  type VaultConfig,
} from "./secrets";

export {
  InMemoryTenantLedger,
  IsolatedLedgerWrapper,
  type TenantScopedLedger,
} from "./ledger";

export {
  InMemoryAuditLogger,
  SupabaseAuditLogger,
  type TenantAuditLogger,
  type AuditEntry,
  type AuditSeverity,
} from "./audit";

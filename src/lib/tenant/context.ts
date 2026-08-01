// ============================================================================
// VVU Tenant Context — Multi-Tenant Isolation Primitive
// ============================================================================
// The TenantContext flows through every execution layer. It is the single
// identity primitive that gates access to secrets, ledger, and audit.
// ============================================================================

import { z } from "zod";

// ---------------------------------------------------------------------------
// TenantContext — the identity envelope carried by every operation
// ---------------------------------------------------------------------------

export const TenantContextSchema = z.object({
  tenantId: z.string().min(1),
  displayName: z.string().min(1),
  tier: z.enum(["starter", "professional", "enterprise"]),
  jurisdiction: z.string().min(1),
  createdAt: z.number().int().positive(),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

export type TenantContext = z.infer<typeof TenantContextSchema>;

// ---------------------------------------------------------------------------
// Extraction helpers
// ---------------------------------------------------------------------------

/** Extract TenantContext from a JWT-style payload (base64url). */
export function extractFromToken(
  tokenPayload: Record<string, unknown>,
): TenantContext | null {
  const parsed = TenantContextSchema.safeParse({
    tenantId: tokenPayload.tenant_id ?? tokenPayload.sub,
    displayName:
      tokenPayload.display_name ?? tokenPayload.tenant_id ?? "Unknown",
    tier: tokenPayload.tier ?? "starter",
    jurisdiction: tokenPayload.jurisdiction ?? "ZA",
    createdAt:
      tokenPayload.created_at ?? tokenPayload.iat ?? Date.now(),
    metadata: tokenPayload.metadata,
  });
  return parsed.success ? parsed.data : null;
}

/** Extract TenantContext from a cookie string (VVU session format). */
export function extractFromCookie(cookieHeader: string): TenantContext | null {
  try {
    const cookies: Record<string, string> = {};
    cookieHeader.split(";").forEach((pair) => {
      const [key, ...rest] = pair.split("=");
      if (key) cookies[key.trim()] = decodeURIComponent(rest.join("=").trim());
    });

    const sessionValue = cookies["vvu_session"];
    if (!sessionValue) return null;

    const parts = sessionValue.split(".");
    if (parts.length !== 2) return null;

    const [payloadB64] = parts;
    const data = JSON.parse(Buffer.from(payloadB64, "base64url").toString());

    return extractFromToken(data);
  } catch {
    return null;
  }
}

/** Create a default TenantContext for single-tenant / development mode. */
export function defaultTenantContext(): TenantContext {
  return {
    tenantId: "default",
    displayName: "Default Tenant",
    tier: "starter",
    jurisdiction: "ZA",
    createdAt: Date.now(),
  };
}

/** Validate that a value conforms to TenantContextSchema. Returns null on failure. */
export function validateTenantContext(
  value: unknown,
): TenantContext | null {
  const parsed = TenantContextSchema.safeParse(value);
  return parsed.success ? parsed.data : null;
}

/** Extract TenantContext from middleware-injected request headers. */
export function extractFromHeaders(
  headers: Headers | Record<string, string>,
): TenantContext | null {
  const get = (key: string) =>
    headers instanceof Headers ? headers.get(key) : headers[key];

  const tenantId = get("x-vvu-tenant-id");
  if (!tenantId) return null;

  return validateTenantContext({
    tenantId,
    displayName: tenantId,
    tier: get("x-vvu-tenant-tier") ?? "starter",
    jurisdiction: get("x-vvu-tenant-jurisdiction") ?? "ZA",
    createdAt: Date.now(),
  });
}

/**
 * Centralized, schema-safe role helpers.
 *
 * Supports both:
 * - Migration target: app_metadata.roles (string[] from DB trigger)
 * - Fallback:      user_metadata.role (string from legacy profile)
 */

export type Role = 'facilitator' | 'admin' | 'member';

export const VALID_ROLES: readonly Role[] = ['facilitator', 'admin', 'member'];

function normalizeRole(input: unknown): Role | null {
  if (typeof input !== 'string') return null;
  const value = input.trim().toLowerCase();
  return VALID_ROLES.includes(value as Role) ? (value as Role) : null;
}

function extractRoles(
  appMetadata: Record<string, unknown> | undefined,
  userMetadata: Record<string, unknown> | undefined,
): Role[] {
  const appMeta = appMetadata ?? {};
  const userMeta = userMetadata ?? {};

  const appRoles: unknown = appMeta.roles;
  const legacyRole: unknown = userMeta.role;

  const candidates = Array.isArray(appRoles)
    ? appRoles
    : typeof appRoles === 'string'
      ? [appRoles]
      : [];

  if (candidates.length > 0) {
    return candidates.map((r) => normalizeRole(r)).filter((r): r is Role => r !== null);
  }

  const normalized = normalizeRole(legacyRole);
  return normalized ? [normalized] : [];
}

/**
 * Returns true if the user has the given role.
 * Safe for server or client contexts.
 */
export function hasRole(
  user: { app_metadata?: Record<string, unknown>; user_metadata?: Record<string, unknown> } | null,
  role: Role,
): boolean {
  if (!user) return false;
  return extractRoles(user.app_metadata, user.user_metadata).includes(role);
}

/**
 * Returns all known roles for the user without duplicates.
 */
export function getRoles(
  user: { app_metadata?: Record<string, unknown>; user_metadata?: Record<string, unknown> } | null,
): Role[] {
  if (!user) return [];
  return extractRoles(user.app_metadata, user.user_metadata);
}

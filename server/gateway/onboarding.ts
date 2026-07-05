/**
 * server/gateway/onboarding.ts
 *
 * Automated account creation and tier provisioning.
 * First 1000 users get SafeLiner + SafeKrypte free.
 * Handles tenant manifest generation and service provisioning.
 *
 * ⚠ FILESYSTEM-FREE — uses Postgres via Drizzle ORM for persistence.
 * Compatible with Vercel serverless (read-only /var/task/ filesystem).
 */
import * as crypto from 'node:crypto';
import { eq, sql } from 'drizzle-orm';
import { db } from '../../lib/db/src';
import { gatewayParticipantsTable } from '../../lib/db/src/schema/gatewayParticipants';

// ─── Configuration ──────────────────────────────────────────────────────

const FREE_1K_LIMIT = 1000;

const TIER_DEFAULTS = {
  FREE_FIRST_1K: {
    warRoom: true,
    emailNode: true,
    safeKrypte: true,
    safeLiner: true,
    safeGridMesh: 'DISABLED' as const,
    hmacRateLimit: 100,
    safeDeckStorageBytes: 5 * 1024 * 1024 * 1024, // 5GB
  },
  FREE_STANDARD: {
    warRoom: true,
    emailNode: true,
    safeKrypte: false,
    safeLiner: false,
    safeGridMesh: 'DISABLED' as const,
    hmacRateLimit: 50,
    safeDeckStorageBytes: 1 * 1024 * 1024 * 1024, // 1GB
  },
  COMMERCIAL_PRO: {
    warRoom: true,
    emailNode: true,
    safeKrypte: true,
    safeLiner: true,
    safeGridMesh: 'EDGE_STANDARD' as const,
    hmacRateLimit: 1000,
    safeDeckStorageBytes: 100 * 1024 * 1024 * 1024, // 100GB
  },
  INDUSTRY_MONOLITH: {
    warRoom: true,
    emailNode: true,
    safeKrypte: true,
    safeLiner: true,
    safeGridMesh: 'FULL_FABRIC_MESH' as const,
    hmacRateLimit: 10000,
    safeDeckStorageBytes: 1024 * 1024 * 1024 * 1024, // 1TB
  },
} as const;

// ─── Types ──────────────────────────────────────────────────────────────

export interface TenantManifest {
  tenantId: number;
  tierLevel: string;
  assignedDomain: string;
  email: string;
  displayName: string;
  provisionedServices: {
    warRoom: boolean;
    emailNode: boolean;
    safeKrypte: boolean;
    safeLiner: boolean;
    safeGridMesh: string;
    hmacRateLimit: number;
    safeDeckStorageBytes: number;
  };
  createdAt: string;
}

// ─── Sequence Counter (DB-backed, replaces fs.readFileSync) ─────────────

async function getNextSequence(): Promise<number> {
  // Use a sequence counter stored in gateway_participants meta row
  // Count existing participants + 1
  const result = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(gatewayParticipantsTable);
  return (result[0]?.count ?? 0) + 1;
}

async function getCurrentCount(): Promise<number> {
  const result = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(gatewayParticipantsTable);
  return result[0]?.count ?? 0;
}

// ─── Account Creation ───────────────────────────────────────────────────

export async function createAccount(params: {
  email: string;
  displayName: string;
  password: string;
  participantId?: string; // Set by route if Supabase Auth user is pre-created
}): Promise<{ ok: boolean; manifest?: TenantManifest; pin?: string; error?: string }> {
  const { email, displayName, password } = params;

  if (!email || !email.includes('@')) {
    return { ok: false, error: 'Valid email required' };
  }

  // Check if email already registered (DB-backed)
  const existingTenants = await listTenants();
  if (existingTenants.some(t => t.email === email.toLowerCase())) {
    return { ok: false, error: 'Email already registered' };
  }

  const sequenceId = await getNextSequence();
  const isFree1K = sequenceId <= FREE_1K_LIMIT;

  const tier: TenantManifest['tierLevel'] = isFree1K ? 'FREE_FIRST_1K' : 'FREE_STANDARD';
  const domain = `${email.split('@')[0]}.vvu.on.za`;

  const manifest: TenantManifest = {
    tenantId: sequenceId,
    tierLevel: tier,
    assignedDomain: domain,
    email: email.toLowerCase(),
    displayName,
    provisionedServices: {
      ...TIER_DEFAULTS[tier as keyof typeof TIER_DEFAULTS],
    },
    createdAt: new Date().toISOString(),
  };

  // Persist tenant to database (REPLACES: fs.writeFileSync to data/gateway/tenants/tenant_N.json)
  const participantId = params.participantId ?? crypto.randomUUID();
  try {
    await db.insert(gatewayParticipantsTable).values({
      id: participantId,
      email: email.toLowerCase().trim(),
      displayName,
      onboardingStatus: 'pending_verification',
      gatewayVersion: '2.0-STABLE',
      ubuntuScore: '0',
      participantClass: 'NaturalPerson',
    });
  } catch (err: any) {
    // Handle unique constraint violation
    if (err?.message?.includes('unique') || err?.code === '23505') {
      return { ok: false, error: 'Email already registered' };
    }
    console.error('[ONBOARDING] DB insert error:', err);
    return { ok: false, error: 'Account creation failed' };
  }

  console.log(`[ONBOARDING] Tenant #${sequenceId} created — ${tier} — ${email}`);

  // Generate initial PIN
  const { registerPin } = await import('./auth');
  const pin = crypto.randomInt(100000, 999999).toString();
  const pinHash = crypto.createHash('sha256').update(pin + email).digest('hex');
  await registerPin(email, pinHash);

  return { ok: true, manifest, pin };
}

// ─── Tenant Lookup (DB-backed, replaces fs.readdirSync) ─────────────────

export async function listTenants(): Promise<TenantManifest[]> {
  try {
    const rows = await db
      .select()
      .from(gatewayParticipantsTable)
      .orderBy(gatewayParticipantsTable.createdAt);

    return rows.map((row, index) => ({
      tenantId: index + 1,
      tierLevel: row.ubuntuScore === '0' ? 'FREE_STANDARD' : 'FREE_FIRST_1K',
      assignedDomain: `${row.email.split('@')[0]}.vvu.on.za`,
      email: row.email,
      displayName: row.displayName,
      provisionedServices: {
        ...TIER_DEFAULTS.FREE_STANDARD,
      },
      createdAt: row.createdAt?.toISOString() ?? new Date().toISOString(),
    }));
  } catch (err) {
    console.error('[ONBOARDING] DB read error:', err);
    return [];
  }
}

export async function getTenantByEmail(email: string): Promise<TenantManifest | null> {
  const tenants = await listTenants();
  return tenants.find(t => t.email === email.toLowerCase()) || null;
}

// ─── Stats ──────────────────────────────────────────────────────────────

export async function getOnboardingStats() {
  const count = await getCurrentCount();
  return {
    totalRegistered: count,
    free1kRemaining: Math.max(0, FREE_1K_LIMIT - count),
    free1kExhausted: count >= FREE_1K_LIMIT,
    tiers: {
      FREE_FIRST_1K: Math.min(count, FREE_1K_LIMIT),
      FREE_STANDARD: Math.max(0, count - FREE_1K_LIMIT),
    },
  };
}

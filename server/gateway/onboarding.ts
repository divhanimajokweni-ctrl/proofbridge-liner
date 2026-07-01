/**
 * server/gateway/onboarding.ts
 *
 * Automated account creation and tier provisioning.
 * First 1000 users get SafeLiner + SafeKrypte free.
 * Handles tenant manifest generation and service provisioning.
 */
import * as crypto from 'node:crypto';
import * as fs from 'node:fs';
import * as path from 'node:path';

// ─── Configuration ──────────────────────────────────────────────────────

const DATA_DIR = path.join(process.cwd(), 'data', 'gateway');
const TENANTS_DIR = path.join(DATA_DIR, 'tenants');
const SEQUENCE_FILE = path.join(DATA_DIR, 'user-sequence.dat');

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

// ─── Helpers ────────────────────────────────────────────────────────────

function ensureDirs() {
  [DATA_DIR, TENANTS_DIR].forEach(dir => {
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  });
}

function getNextSequence(): number {
  ensureDirs();
  let seq = 0;
  try {
    seq = parseInt(fs.readFileSync(SEQUENCE_FILE, 'utf-8'), 10) || 0;
  } catch {
    seq = 0;
  }
  seq++;
  fs.writeFileSync(SEQUENCE_FILE, seq.toString());
  return seq;
}

function getCurrentCount(): number {
  ensureDirs();
  try {
    return parseInt(fs.readFileSync(SEQUENCE_FILE, 'utf-8'), 10) || 0;
  } catch {
    return 0;
  }
}

// ─── Account Creation ───────────────────────────────────────────────────

export async function createAccount(params: {
  email: string;
  displayName: string;
  password: string;
}): Promise<{ ok: boolean; manifest?: TenantManifest; pin?: string; error?: string }> {
  const { email, displayName, password } = params;

  if (!email || !email.includes('@')) {
    return { ok: false, error: 'Valid email required' };
  }

  // Check if email already registered
  const existingTenants = listTenants();
  if (existingTenants.some(t => t.email === email.toLowerCase())) {
    return { ok: false, error: 'Email already registered' };
  }

  const sequenceId = getNextSequence();
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

  // Persist tenant manifest
  const manifestPath = path.join(TENANTS_DIR, `tenant_${sequenceId}.json`);
  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));

  console.log(`[ONBOARDING] Tenant #${sequenceId} created — ${tier} — ${email}`);

  // Generate initial PIN
  const { registerPin } = await import('./auth');
  const pin = crypto.randomInt(100000, 999999).toString();
  const pinHash = crypto.createHash('sha256').update(pin + email).digest('hex');
  await registerPin(email, pinHash);

  return { ok: true, manifest, pin };
}

// ─── Tenant Lookup ──────────────────────────────────────────────────────

export function listTenants(): TenantManifest[] {
  ensureDirs();
  const tenants: TenantManifest[] = [];

  try {
    const files = fs.readdirSync(TENANTS_DIR).filter(f => f.startsWith('tenant_') && f.endsWith('.json'));
    for (const file of files) {
      try {
        tenants.push(JSON.parse(fs.readFileSync(path.join(TENANTS_DIR, file), 'utf-8')));
      } catch { continue; }
    }
  } catch { /* no tenants yet */ }

  return tenants.sort((a, b) => a.tenantId - b.tenantId);
}

export function getTenantByEmail(email: string): TenantManifest | null {
  const tenants = listTenants();
  return tenants.find(t => t.email === email.toLowerCase()) || null;
}

// ─── Stats ──────────────────────────────────────────────────────────────

export function getOnboardingStats() {
  const count = getCurrentCount();
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

/**
 * server/gateway/auth.ts
 *
 * Zero-knowledge PIN verification with Argon2id hashing.
 * Fail2Ban-style rate limiter: 3 failures → 15min IP jail.
 * PINs are hashed client-side, verified server-side. Raw PINs never touch the backend.
 */
import * as argon2 from 'argon2';
import * as crypto from 'node:crypto';
import * as fs from 'node:fs';
import * as path from 'node:path';

// ─── Configuration ──────────────────────────────────────────────────────

const MAX_ATTEMPTS = 3;
const JAIL_DURATION_MS = 15 * 60 * 1000; // 15 minutes
const DATA_DIR = path.join(process.cwd(), 'data', 'gateway');
const PIN_STORE_FILE = path.join(DATA_DIR, 'pin-store.json');
const JAIL_FILE = path.join(DATA_DIR, 'ip-jail.json');

// ─── PIN Store (hashed PINs) ───────────────────────────────────────────

interface PinRecord {
  userId: string;
  pinHash: string;
  createdAt: string;
  lastAuth: string | null;
}

interface PinStore {
  [userId: string]: PinRecord;
}

function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

function loadPinStore(): PinStore {
  ensureDataDir();
  try {
    return JSON.parse(fs.readFileSync(PIN_STORE_FILE, 'utf-8'));
  } catch {
    return {};
  }
}

function savePinStore(store: PinStore) {
  ensureDataDir();
  fs.writeFileSync(PIN_STORE_FILE, JSON.stringify(store, null, 2));
}

// ─── IP Jail (Fail2Ban) ─────────────────────────────────────────────────

interface JailEntry {
  ip: string;
  failedAttempts: number;
  jailedAt: number | null;
  lastAttempt: number;
}

interface JailStore {
  [ip: string]: JailEntry;
}

function loadJail(): JailStore {
  ensureDataDir();
  try {
    return JSON.parse(fs.readFileSync(JAIL_FILE, 'utf-8'));
  } catch {
    return {};
  }
}

function saveJail(store: JailStore) {
  ensureDataDir();
  fs.writeFileSync(JAIL_FILE, JSON.stringify(store, null, 2));
}

export function isIpJailed(ip: string): boolean {
  const jail = loadJail();
  const entry = jail[ip];
  if (!entry || !entry.jailedAt) return false;
  return Date.now() - entry.jailedAt < JAIL_DURATION_MS;
}

export function getJailRemainingMs(ip: string): number {
  const jail = loadJail();
  const entry = jail[ip];
  if (!entry || !entry.jailedAt) return 0;
  const remaining = JAIL_DURATION_MS - (Date.now() - entry.jailedAt);
  return remaining > 0 ? remaining : 0;
}

function recordFailedAttempt(ip: string): JailStore {
  const jail = loadJail();
  const now = Date.now();

  if (!jail[ip]) {
    jail[ip] = { ip, failedAttempts: 1, jailedAt: null, lastAttempt: now };
  } else {
    jail[ip].failedAttempts++;
    jail[ip].lastAttempt = now;

    if (jail[ip].failedAttempts >= MAX_ATTEMPTS) {
      jail[ip].jailedAt = now;
      console.log(`[FAIL2BAN] IP ${ip} jailed for ${JAIL_DURATION_MS / 60000} minutes after ${MAX_ATTEMPTS} failed attempts`);
    }
  }

  saveJail(jail);
  return jail;
}

function resetFailedAttempts(ip: string) {
  const jail = loadJail();
  if (jail[ip]) {
    jail[ip].failedAttempts = 0;
    jail[ip].jailedAt = null;
    saveJail(jail);
  }
}

// ─── PIN Registration ───────────────────────────────────────────────────

export async function registerPin(
  userId: string,
  pinHash: string,
): Promise<{ ok: boolean; error?: string }> {
  const store = loadPinStore();

  if (store[userId]) {
    return { ok: false, error: 'User already registered' };
  }

  const hash = await argon2.hash(pinHash, {
    type: argon2.argon2id,
    memoryCost: 65536,
    timeCost: 3,
    parallelism: 4,
  });

  store[userId] = {
    userId,
    pinHash: hash,
    createdAt: new Date().toISOString(),
    lastAuth: null,
  };

  savePinStore(store);
  return { ok: true };
}

// ─── PIN Verification ───────────────────────────────────────────────────

export async function verifyPin(
  userId: string,
  pinHash: string,
  clientIp: string,
): Promise<{ ok: boolean; error?: string; sessionId?: string }> {
  // Check IP jail
  if (isIpJailed(clientIp)) {
    const remaining = getJailRemainingMs(clientIp);
    return {
      ok: false,
      error: `IP jailed. Try again in ${Math.ceil(remaining / 60000)} minutes.`,
    };
  }

  const store = loadPinStore();
  const record = store[userId];

  if (!record) {
    recordFailedAttempt(clientIp);
    return { ok: false, error: 'Invalid credentials' };
  }

  // Verify the client-side hash against the stored hash
  const valid = await argon2.verify(record.pinHash, pinHash);

  if (!valid) {
    recordFailedAttempt(clientIp);
    const jail = loadJail();
    const attempts = jail[clientIp]?.failedAttempts || 0;
    const remaining = MAX_ATTEMPTS - attempts;
    return {
      ok: false,
      error: remaining > 0
        ? `Invalid PIN. ${remaining} attempts remaining.`
        : 'Too many attempts. IP jailed for 15 minutes.',
    };
  }

  // Success — reset jail counter and generate session
  resetFailedAttempts(clientIp);

  // Update last auth time
  store[userId].lastAuth = new Date().toISOString();
  savePinStore(store);

  // Generate session token
  const sessionId = crypto.randomBytes(32).toString('hex');
  return { ok: true, sessionId };
}

// ─── Default PIN Setup ──────────────────────────────────────────────────

export async function setupDefaultPin(userId: string): Promise<{ ok: boolean; pin?: string }> {
  const store = loadPinStore();
  if (store[userId]) {
    return { ok: false };
  }

  // Generate a 6-digit PIN for initial setup
  const pin = crypto.randomInt(100000, 999999).toString();
  const pinHash = await argon2.hash(pin, {
    type: argon2.argon2id,
    memoryCost: 65536,
    timeCost: 3,
    parallelism: 4,
  });

  store[userId] = {
    userId,
    pinHash,
    createdAt: new Date().toISOString(),
    lastAuth: null,
  };

  savePinStore(store);
  return { ok: true, pin };
}

// ─── Cleanup expired jail entries ───────────────────────────────────────

export function cleanupJail() {
  const jail = loadJail();
  const now = Date.now();
  let cleaned = 0;

  for (const ip of Object.keys(jail)) {
    const entry = jail[ip];
    if (entry.jailedAt && now - entry.jailedAt > JAIL_DURATION_MS) {
      delete jail[ip];
      cleaned++;
    }
  }

  if (cleaned > 0) {
    saveJail(jail);
    console.log(`[FAIL2BAN] Cleaned ${cleaned} expired jail entries`);
  }
}

// Run cleanup every 5 minutes
setInterval(cleanupJail, 5 * 60 * 1000);

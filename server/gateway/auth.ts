/**
 * server/gateway/auth.ts
 *
 * Zero-knowledge PIN verification with Argon2id hashing.
 * Fail2Ban-style rate limiter: 3 failures → 15min IP jail.
 * PINs are hashed client-side, verified server-side. Raw PINs never touch the backend.
 *
 * ⚠ FILESYSTEM-FREE — uses Postgres via Drizzle ORM for persistence.
 * Compatible with Vercel serverless (read-only /var/task/ filesystem).
 */
import * as argon2 from 'argon2';
import * as crypto from 'node:crypto';
import { eq, and, lt, sql } from 'drizzle-orm';
import { getDb } from '../../lib/db/src';
import { pgTable, text, integer, timestamp, uuid } from 'drizzle-orm/pg-core';

// ─── Schema (local — these tables are small and auth-specific) ──────────
// Tables are created via the Supabase migration: 20260705_gateway_participants.sql

const pinStoreTable = pgTable('gateway_pin_store', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: text('user_id').notNull().unique(),
  pinHash: text('pin_hash').notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  lastAuth: timestamp('last_auth'),
});

const jailTable = pgTable('gateway_ip_jail', {
  ip: text('ip').primaryKey(),
  failedAttempts: integer('failed_attempts').notNull().default(0),
  jailedAt: timestamp('jailed_at'),
  lastAttempt: timestamp('last_attempt').notNull().defaultNow(),
});

// ─── Configuration ──────────────────────────────────────────────────────

const MAX_ATTEMPTS = 3;
const JAIL_DURATION_MS = 15 * 60 * 1000; // 15 minutes

// ─── IP Jail (Fail2Ban, DB-backed) ──────────────────────────────────────

export async function isIpJailed(ip: string): Promise<boolean> {
  try {
    const rows = await getDb()
      .select()
      .from(jailTable)
      .where(eq(jailTable.ip, ip))
      .limit(1);

    if (rows.length === 0) return false;
    const entry = rows[0];
    if (!entry.jailedAt) return false;
    return Date.now() - entry.jailedAt.getTime() < JAIL_DURATION_MS;
  } catch {
    return false;
  }
}

export async function getJailRemainingMs(ip: string): Promise<number> {
  try {
    const rows = await getDb().
      select()
      .from(jailTable)
      .where(eq(jailTable.ip, ip))
      .limit(1);

    if (rows.length === 0 || !rows[0].jailedAt) return 0;
    const remaining = JAIL_DURATION_MS - (Date.now() - rows[0].jailedAt.getTime());
    return remaining > 0 ? remaining : 0;
  } catch {
    return 0;
  }
}

async function recordFailedAttempt(ip: string): Promise<void> {
  try {
    const existing = await getDb().
      select()
      .from(jailTable)
      .where(eq(jailTable.ip, ip))
      .limit(1);

    const now = new Date();

    if (existing.length === 0) {
      await getDb().insert(jailTable).values({
        ip,
        failedAttempts: 1,
        lastAttempt: now,
      });
    } else {
      const newAttempts = existing[0].failedAttempts + 1;
      const shouldJail = newAttempts >= MAX_ATTEMPTS;

      await getDb()
        .update(jailTable)
        .set({
          failedAttempts: newAttempts,
          lastAttempt: now,
          jailedAt: shouldJail ? now : existing[0].jailedAt,
        })
        .where(eq(jailTable.ip, ip));

      if (shouldJail) {
        console.log(`[FAIL2BAN] IP ${ip} jailed for ${JAIL_DURATION_MS / 60000} minutes after ${MAX_ATTEMPTS} failed attempts`);
      }
    }
  } catch (err) {
    console.error('[FAIL2BAN] DB error:', err);
  }
}

async function resetFailedAttempts(ip: string): Promise<void> {
  try {
    await getDb().
      update(jailTable)
      .set({
        failedAttempts: 0,
        jailedAt: null,
        lastAttempt: new Date(),
      })
      .where(eq(jailTable.ip, ip));
  } catch (err) {
    console.error('[FAIL2BAN] DB reset error:', err);
  }
}

// ─── PIN Registration (DB-backed) ───────────────────────────────────────

export async function registerPin(
  userId: string,
  pinHash: string,
): Promise<{ ok: boolean; error?: string }> {
  try {
    // Check if user already has a PIN
    const existing = await getDb().
      select()
      .from(pinStoreTable)
      .where(eq(pinStoreTable.userId, userId))
      .limit(1);

    if (existing.length > 0) {
      return { ok: false, error: 'User already registered' };
    }

    const hash = await argon2.hash(pinHash, {
      type: argon2.argon2id,
      memoryCost: 65536,
      timeCost: 3,
      parallelism: 4,
    });

    await getDb().insert(pinStoreTable).values({
      userId,
      pinHash: hash,
    });

    return { ok: true };
  } catch (err: any) {
    if (err?.message?.includes('unique') || err?.code === '23505') {
      return { ok: false, error: 'User already registered' };
    }
    console.error('[AUTH] registerPin DB error:', err);
    return { ok: false, error: 'PIN registration failed' };
  }
}

// ─── PIN Verification (DB-backed) ───────────────────────────────────────

export async function verifyPin(
  userId: string,
  pinHash: string,
  clientIp: string,
): Promise<{ ok: boolean; error?: string; sessionId?: string }> {
  try {
    // Check IP jail
    if (await isIpJailed(clientIp)) {
      const remaining = await getJailRemainingMs(clientIp);
      return {
        ok: false,
        error: `IP jailed. Try again in ${Math.ceil(remaining / 60000)} minutes.`,
      };
    }

    const rows = await getDb().
      select()
      .from(pinStoreTable)
      .where(eq(pinStoreTable.userId, userId))
      .limit(1);

    if (rows.length === 0) {
      await recordFailedAttempt(clientIp);
      return { ok: false, error: 'Invalid credentials' };
    }

    // Verify the client-side hash against the stored hash
    const valid = await argon2.verify(rows[0].pinHash, pinHash);

    if (!valid) {
      await recordFailedAttempt(clientIp);

      // Fetch updated attempt count
      const jailRows = await getDb()
        .select()
        .from(jailTable)
        .where(eq(jailTable.ip, clientIp))
        .limit(1);

      const attempts = jailRows[0]?.failedAttempts || 0;
      const remaining = MAX_ATTEMPTS - attempts;

      return {
        ok: false,
        error: remaining > 0
          ? `Invalid PIN. ${remaining} attempts remaining.`
          : 'Too many attempts. IP jailed for 15 minutes.',
      };
    }

    // Success — reset jail counter and update last auth
    await resetFailedAttempts(clientIp);
    await getDb().
      update(pinStoreTable)
      .set({ lastAuth: new Date() })
      .where(eq(pinStoreTable.userId, userId));

    // Generate session token
    const sessionId = crypto.randomBytes(32).toString('hex');
    return { ok: true, sessionId };
  } catch (err) {
    console.error('[AUTH] verifyPin error:', err);
    return { ok: false, error: 'Verification failed' };
  }
}

// ─── Default PIN Setup ──────────────────────────────────────────────────

export async function setupDefaultPin(userId: string): Promise<{ ok: boolean; pin?: string }> {
  try {
    const existing = await getDb().
      select()
      .from(pinStoreTable)
      .where(eq(pinStoreTable.userId, userId))
      .limit(1);

    if (existing.length > 0) {
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

    await getDb().insert(pinStoreTable).values({
      userId,
      pinHash,
    });

    return { ok: true, pin };
  } catch (err) {
    console.error('[AUTH] setupDefaultPin error:', err);
    return { ok: false };
  }
}

// ─── Cleanup expired jail entries ───────────────────────────────────────

export async function cleanupJail(): Promise<void> {
  try {
    const cutoff = new Date(Date.now() - JAIL_DURATION_MS);
    const result = await getDb().
      delete(jailTable)
      .where(
        and(
          sql`jailed_at IS NOT NULL`,
          lt(jailTable.jailedAt, cutoff),
        ),
      );

    if (result.rowCount && result.rowCount > 0) {
      console.log(`[FAIL2BAN] Cleaned ${result.rowCount} expired jail entries`);
    }
  } catch (err) {
    console.error('[FAIL2BAN] Cleanup error:', err);
  }
}

// Run cleanup every 5 minutes (only in non-serverless environments)
if (typeof setInterval !== 'undefined') {
  setInterval(() => { cleanupJail().catch(() => {}); }, 5 * 60 * 1000);
}

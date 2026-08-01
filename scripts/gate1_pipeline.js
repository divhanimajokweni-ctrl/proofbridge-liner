#!/usr/bin/env node
/**
 * gate1_pipeline.js — VVU Production Data Pipeline
 * HEAD: f4b82102 | Optimized for Kilo Code + MiniMax M3
 * ============================================================
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const os = require('os');

// ─── CONFIGURATION ──────────────────────────────────────────
const VAULT_PATH = path.join(__dirname, 'vvu_cache');
const LOG_PATH = path.join(__dirname, 'vvu_logs');

if (!fs.existsSync(VAULT_PATH)) fs.mkdirSync(VAULT_PATH, { recursive: true });
if (!fs.existsSync(LOG_PATH)) fs.mkdirSync(LOG_PATH, { recursive: true });

const STATE_FILE = path.join(VAULT_PATH, 'used_hashes.json');

// ─── ENVIRONMENT LOAD ──────────────────────────────────────
function loadEnvironment() {
  const env = {
    KERNEL_MODE: process.env.KERNEL_MODE || 'production',
    KERNEL_HEAD: process.env.KERNEL_HEAD || 'f4b82102',
    TEE_MODE: process.env.TEE_MODE || 'software-attested',
    ENFORCE_POPIA_CHECKPOINT: (process.env.ENFORCE_POPIA_CHECKPOINT || 'true') === 'true',
    STITCH_WEBHOOK_SECRET: process.env.STITCH_WEBHOOK_SECRET || '',
    BULLMQ_REDIS_URL: process.env.BULLMQ_REDIS_URL || '',
    PROOFBRIDGE_PRIVATE_KEY: process.env.ORACLE_PRIVATE_KEY || '',
  };

  if (!env.STITCH_WEBHOOK_SECRET) {
    console.warn('[WARN] STITCH_WEBHOOK_SECRET not set — webhook verification will fail');
  }

  return env;
}

const ENV = loadEnvironment();

// ─── HMAC VERIFICATION ─────────────────────────────────────
function verifyHmac(payload, signature, secret) {
  if (!secret || !signature) return false;
  const expected = crypto.createHmac('sha256', secret)
    .update(JSON.stringify(payload))
    .digest('hex');
  return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature));
}

// ─── REPLAY PROTECTION ─────────────────────────────────────
class ReplayProtection {
  constructor(vaultPath) {
    this.vaultPath = vaultPath;
    this.usedHashes = new Set();
    this._loadState();
  }

  _loadState() {
    try {
      if (fs.existsSync(STATE_FILE)) {
        const data = JSON.parse(fs.readFileSync(STATE_FILE, 'utf-8'));
        this.usedHashes = new Set(data.hashes || []);
        console.log(`[REPLAY] Loaded ${this.usedHashes.size} used hashes`);
      }
    } catch (e) {
      console.error(`[REPLAY] Failed to load state: ${e.message}`);
    }
  }

  _persistState() {
    try {
      fs.writeFileSync(STATE_FILE, JSON.stringify({ hashes: Array.from(this.usedHashes) }, null, 2));
    } catch (e) {
      console.error(`[REPLAY] Failed to persist state: ${e.message}`);
    }
  }

  isDuplicate(eventHash) {
    return this.usedHashes.has(eventHash);
  }

  markUsed(eventHash) {
    this.usedHashes.add(eventHash);
    if (this.usedHashes.size % 100 === 0) this._persistState();
  }
}

// ─── EVENT PROCESSING ──────────────────────────────────────
function computeEventHash(payload) {
  const sorted = JSON.stringify(payload);
  return crypto.createHash('sha256').update(sorted).digest('hex');
}

function processWebhook(payload, signature) {
  const start = Date.now();
  console.log(`[PIPELINE] Processing webhook: ${payload.payment_id || 'unknown'}`);

  if (!verifyHmac(payload, signature, ENV.STITCH_WEBHOOK_SECRET)) {
    console.error('[PIPELINE] HMAC verification failed');
    return { success: false, error: 'HMAC_VERIFICATION_FAILED' };
  }

  const eventHash = computeEventHash(payload);
  const replay = new ReplayProtection(VAULT_PATH);

  if (replay.isDuplicate(eventHash)) {
    console.warn(`[PIPELINE] Duplicate event detected: ${eventHash.slice(0, 16)}`);
    return { success: false, error: 'DUPLICATE_EVENT' };
  }

  if (ENV.ENFORCE_POPIA_CHECKPOINT) {
    const required = ['payment_id', 'amount', 'timestamp', 'member_id'];
    for (const field of required) {
      if (!(field in payload)) {
        console.error(`[PIPELINE] Missing required field: ${field}`);
        return { success: false, error: `MISSING_${field.toUpperCase()}` };
      }
    }
  }

  const eventRecord = {
    event_hash: eventHash,
    payment_id: payload.payment_id,
    amount: payload.amount,
    timestamp: payload.timestamp,
    received_at: new Date().toISOString(),
    status: 'QUEUED',
  };

  const eventFile = path.join(VAULT_PATH, `event_${eventHash.slice(0, 16)}.json`);
  fs.writeFileSync(eventFile, JSON.stringify(eventRecord, null, 2));

  replay.markUsed(eventHash);
  const elapsed = Date.now() - start;

  console.log(`[PIPELINE] Event processed in ${elapsed}ms: ${eventHash.slice(0, 16)}`);

  return {
    success: true,
    event_hash: eventHash,
    payment_id: payload.payment_id,
    elapsed_ms: elapsed,
    status: 'QUEUED',
  };
}

// ─── MAIN ENTRY ─────────────────────────────────────────────
if (require.main === module) {
  const testPayload = {
    payment_id: 'test_123',
    amount: 50000,
    timestamp: new Date().toISOString(),
    member_id: 'member_001',
    pool_id: 'pool_001',
  };

  const testSignature = crypto.createHmac('sha256', ENV.STITCH_WEBHOOK_SECRET || '')
    .update(JSON.stringify(testPayload))
    .digest('hex');

  const result = processWebhook(testPayload, testSignature);
  console.log(JSON.stringify(result, null, 2));
  console.log('[PIPELINE] Gate 1 Pipeline ready — awaiting production webhooks');
}

module.exports = { processWebhook, verifyHmac, ReplayProtection };

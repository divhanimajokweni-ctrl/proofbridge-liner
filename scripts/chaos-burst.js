#!/usr/bin/env node
/**
 * ProofBridge Liner — Chaos Engineering Burst Script
 *
 * Floods Upstash Redis with randomized mock transaction events
 * to test the PiP dashboard, billing quota enforcement, and
 * role-based view mappers under live load.
 *
 * Usage:
 *   node scripts/chaos-burst.js
 *
 * Requires: UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN in env.
 */

const { Redis } = require('@upstash/redis');
const crypto = require('crypto');
require('dotenv').config();

// ── Redis Client ───────────────────────────────────────────────────

const url = process.env.UPSTASH_REDIS_REST_URL;
const token = process.env.UPSTASH_REDIS_REST_TOKEN;

if (!url || !token) {
  console.error('❌ UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN must be set.');
  process.exit(1);
}

const redis = new Redis({ url, token });
const CHRONICLE_KEY = 'billing:chronicles';

// ── Mock Data Sources ──────────────────────────────────────────────

const AGENTS = [
  'agent-alpha-01', 'agent-beta-09', 'agent-maintenance-bot',
  'agent-liquidity-runner', 'agent-compliance-03', 'agent-swap-executor',
];

const TARGETS = [
  '0xUniswapRouterAddress', '0xAavePoolAddress',
  '0xGnosisSafeMultisig', '0xSynthetixBridge',
  '0xCompoundLens', '0xCurvePool',
];

const FAILURE_REASONS = [
  'RATE_LIMIT_EXCEEDED: Agent exceeded 8 requests per 60s window.',
  'TARGET_CONTRACT_NOT_WHITELISTED: Target not in verified registry.',
  'EXCEEDS_SINGLE_TX_VALUE_CAP: Exceeded 2.50 ETH single tx limit.',
  'PROMPT_INJECTION_MITIGATION: Suspicious calldata patterns detected.',
  'EXPIRED_SESSION_KEY: Agent authentication token expired.',
  'INSUFFICIENT_GAS_ESTIMATE: Dry run reverted due to gas estimation.',
];

// ── Log Generator ──────────────────────────────────────────────────

function generateLog() {
  const isApproved = Math.random() > 0.40; // 60% approval rate
  const agentId = AGENTS[Math.floor(Math.random() * AGENTS.length)];
  const targetContract = TARGETS[Math.floor(Math.random() * TARGETS.length)];

  const entry = {
    chronicleId: `0x${crypto.randomBytes(20).toString('hex')}`,
    timestamp: Date.now(),
    status: isApproved ? 'APPROVED' : 'REJECTED',
    agentId,
    targetContract,
    valueETH: isApproved ? parseFloat((Math.random() * 5).toFixed(4)) : 0,
  };

  if (isApproved) {
    entry.calldataHash = `0x${crypto.randomBytes(32).toString('hex')}`;
    entry.reason = 'READY_FOR_ATTESTATION';
  } else {
    entry.reason =
      FAILURE_REASONS[Math.floor(Math.random() * FAILURE_REASONS.length)];
  }

  return entry;
}

// ── Injection Loop ─────────────────────────────────────────────────

async function startChaosInjection() {
  console.log('╔═══════════════════════════════════════════════╗');
  console.log('║  ProofBridge Chaos Engineering Burst Engine  ║');
  console.log('╚═══════════════════════════════════════════════╝');
  console.log(`Target: ${CHRONICLE_KEY}`);
  console.log(`Interval: 2.5s per event`);
  console.log('Press Ctrl+C to stop.\n');

  let count = 0;

  setInterval(async () => {
    const log = generateLog();
    count++;

    try {
      await redis.lpush(CHRONICLE_KEY, JSON.stringify(log));
      await redis.ltrim(CHRONICLE_KEY, 0, 49); // Cap at 50 entries

      const status = log.status === 'APPROVED' ? '✅' : '❌';
      console.log(
        `[#${count}] ${status} ${log.status} | ${log.agentId} | ${log.valueETH} ETH | ${log.chronicleId.substring(0, 10)}...`
      );
    } catch (err) {
      console.error(`[#${count}] ❌ Write failed: ${err.message}`);
    }
  }, 2500);
}

// ── Startup ────────────────────────────────────────────────────────

startChaosInjection().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});

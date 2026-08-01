/**
 * ProofBridge Liner — Automated Weekly Summary Reporter
 *
 * Runs every Friday at 15:00 UTC via node-cron.
 * Pulls metrics from Upstash Redis and posts to Slack, Discord, and WhatsApp.
 *
 * Usage:
 *   node scripts/weekly-reporter.js          # manual run
 *   pm2 start ecosystem.config.js --only proofbridge-weekly-reporter
 *
 * Requires: @upstash/redis, node-cron, @whiskeysockets/baileys, pino, dotenv
 */

const { Redis } = require('@upstash/redis');
const cron = require('node-cron');
const { makeWASocket, useMultiFileAuthState } = require('@whiskeysockets/baileys');
const pino = require('pino');
require('dotenv').config();

// ── Redis Client ───────────────────────────────────────────────────

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL || '',
  token: process.env.UPSTASH_REDIS_REST_TOKEN || '',
});

// ── Metrics Compiler ───────────────────────────────────────────────

async function compileWeeklyMetrics() {
  console.log('[weekly-reporter] Compiling weekly metrics from Upstash Redis...');

  const rawLogs = (await redis.lrange('billing:chronicles', 0, 499)) || [];

  let totalIntercepted = rawLogs.length;
  let blockedAttacks = 0;
  let totalApproved = 0;
  let totalValueETH = 0;
  const violationBreakdown = {};

  for (const item of rawLogs) {
    try {
      const log = typeof item === 'string' ? JSON.parse(item) : item;
      if (log.status === 'REJECTED') {
        blockedAttacks++;
        const vector = (log.reason || 'UNKNOWN').split(':')[0];
        violationBreakdown[vector] = (violationBreakdown[vector] || 0) + 1;
      } else if (log.status === 'APPROVED') {
        totalApproved++;
        totalValueETH += log.valueETH || 0;
      }
    } catch {
      // skip malformed entries
    }
  }

  // Find top threat vector
  let topThreatVector = 'None identified';
  let maxCount = 0;
  for (const [vector, count] of Object.entries(violationBreakdown)) {
    if (count > maxCount) {
      maxCount = count;
      topThreatVector = `${vector} (${count} occurrences)`;
    }
  }

  return {
    totalIntercepted,
    blockedAttacks,
    totalApproved,
    totalValueETH: totalValueETH.toFixed(2),
    topThreatVector,
  };
}

// ── Slack Dispatch ─────────────────────────────────────────────────

async function dispatchToSlack(metrics) {
  const url = process.env.SLACK_OPERATIONAL_WEBHOOK_URL;
  if (!url) return;

  const blocks = [
    {
      type: 'header',
      text: {
        type: 'plain_text',
        text: '📊 PROOFBRIDGE LINER: WEEKLY REPORT 📊',
        emoji: true,
      },
    },
    { type: 'divider' },
    {
      type: 'section',
      fields: [
        {
          type: 'mrkdwn',
          text: `*Intercepted:*\n\`${metrics.totalIntercepted}\` payloads`,
        },
        {
          type: 'mrkdwn',
          text: `*Blocked:*\n\`${metrics.blockedAttacks}\` threats`,
        },
        {
          type: 'mrkdwn',
          text: `*Approved:*\n\`${metrics.totalApproved}\` transactions`,
        },
        {
          type: 'mrkdwn',
          text: `*Volume:*\n\`${metrics.totalValueETH} ETH\``,
        },
      ],
    },
    {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: `*Primary Threat Vector:* \`${metrics.topThreatVector}\``,
      },
    },
    {
      type: 'context',
      elements: [
        {
          type: 'mrkdwn',
          text: `Weekly Report • ${new Date().toDateString()}`,
        },
      ],
    },
  ];

  await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ blocks }),
  });
}

// ── Discord Dispatch ───────────────────────────────────────────────

async function dispatchToDiscord(metrics) {
  const url = process.env.DISCORD_OPERATIONAL_WEBHOOK_URL;
  if (!url) return;

  const payload = {
    embeds: [
      {
        title: '📊 PROOFBRIDGE LINER: WEEKLY RUNTIME SUMMARY',
        color: 0x3447003,
        fields: [
          { name: 'Total Intercepted', value: `\`${metrics.totalIntercepted}\``, inline: true },
          { name: 'Blocked Threats', value: `\`${metrics.blockedAttacks}\``, inline: true },
          { name: 'Approved Runs', value: `\`${metrics.totalApproved}\``, inline: true },
          { name: 'Transaction Volume', value: `\`${metrics.totalValueETH} ETH\``, inline: true },
          { name: 'Primary Threat', value: `\`${metrics.topThreatVector}\``, inline: false },
        ],
        timestamp: new Date().toISOString(),
        footer: { text: 'ProofBridge Gateway' },
      },
    ],
  };

  await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
}

// ── WhatsApp Dispatch ──────────────────────────────────────────────

async function dispatchToWhatsApp(metrics) {
  const adminPhones = (process.env.WHATSAPP_ADMIN_PHONES || '').split(',').filter(Boolean);
  if (adminPhones.length === 0) return;

  try {
    const { state, saveCreds } = await useMultiFileAuthState(
      process.env.WHATSAPP_AUTH_DIR || 'auth_store_whatsapp'
    );
    const sock = makeWASocket({
      auth: state,
      logger: pino({ level: 'silent' }),
    });

    sock.ev.on('connection.update', async (update) => {
      if (update.connection === 'open') {
        const text = [
          `📊 *PROOFBRIDGE LINER: WEEKLY REPORT*`,
          ``,
          `• Intercepted: ${metrics.totalIntercepted}`,
          `• Threats Blocked: ${metrics.blockedAttacks}`,
          `• Approved: ${metrics.totalApproved}`,
          `• Volume: ${metrics.totalValueETH} ETH`,
          `• Top Threat: ${metrics.topThreatVector}`,
          ``,
          `Report generated: ${new Date().toDateString()}`,
        ].join('\n');

        for (const phone of adminPhones) {
          await sock.sendMessage(`${phone}@s.whatsapp.net`, { text });
        }
        setTimeout(() => process.exit(0), 3000);
      }
    });
  } catch (err) {
    console.error('[weekly-reporter] WhatsApp dispatch error:', err.message);
  }
}

// ── Main Sequence ──────────────────────────────────────────────────

async function triggerWeeklySequence() {
  console.log('[weekly-reporter] Starting Friday report sequence...');

  try {
    const metrics = await compileWeeklyMetrics();

    await Promise.all([dispatchToSlack(metrics), dispatchToDiscord(metrics)]);
    await dispatchToWhatsApp(metrics);

    console.log('[weekly-reporter] Report dispatched successfully.');
  } catch (err) {
    console.error('[weekly-reporter] Sequence failed:', err.message);
  }
}

// ── Schedule: Every Friday 15:00 UTC ───────────────────────────────

cron.schedule('0 15 * * 5', () => {
  console.log('[weekly-reporter] Cron trigger matched — Friday 15:00 UTC.');
  triggerWeeklySequence();
});

console.log('[weekly-reporter] Scheduler initialized. Waiting for Friday 15:00 UTC...');

module.exports = { triggerWeeklySequence };

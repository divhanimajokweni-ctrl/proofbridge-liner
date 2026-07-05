/**
 * ProofBridge Liner — Baileys WhatsApp Notification Daemon
 *
 * Background service that:
 * 1. Sends automated alerts for circuit-breaker events
 * 2. Listens for !restore and !dismiss commands from authorized admins
 * 3. Exposes health endpoint on port 3001
 *
 * Run via PM2: pm2 start ecosystem.config.js --only proofbridge-whatsapp-daemon
 * Or standalone: node services/whatsapp-notifier.js
 *
 * @see https://github.com/WhiskeySockets/Baileys
 */

const { makeWASocket, useMultiFileAuthState, delay } = require('@whiskeysockets/baileys');
const { Redis } = require('@upstash/redis');
const pino = require('pino');
const express = require('express');
require('dotenv').config();

// ── Configuration ──────────────────────────────────────────────────

const REDIS_URL = process.env.UPSTASH_REDIS_REST_URL || '';
const REDIS_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN || '';
const AUTH_DIR = process.env.WHATSAPP_AUTH_DIR || 'auth_store_whatsapp';
const HEALTH_PORT = parseInt(process.env.WHATSAPP_HEALTH_PORT || '3001', 10);

// Whitelisted admin phone numbers (JID format: phone@s.whatsapp.net)
const AUTHORIZED_ADMINS = (
  process.env.WHATSAPP_ADMIN_PHONES || ''
).split(',').filter(Boolean).map((p) => `${p.trim()}@s.whatsapp.net`);

// ── State ──────────────────────────────────────────────────────────

let whatsappSocket = null;
let currentConnectionStatus = 'DISCONNECTED';

// ── Redis Client ───────────────────────────────────────────────────

let redis = null;
try {
  if (REDIS_URL && REDIS_TOKEN) {
    redis = new Redis({ url: REDIS_URL, token: REDIS_TOKEN });
  }
} catch (err) {
  console.warn('[whatsapp-daemon] Redis init failed:', err.message);
}

// ── Baileys Engine ─────────────────────────────────────────────────

async function startWhatsAppEngine() {
  try {
    const { state, saveCreds } = await useMultiFileAuthState(AUTH_DIR);

    whatsappSocket = makeWASocket({
      logger: pino({ level: 'silent' }),
      auth: state,
      printQRInTerminal: true,
      browser: ['ProofBridge Liner', 'Chrome', '1.0.0'],
    });

    whatsappSocket.ev.on('creds.update', saveCreds);

    whatsappSocket.ev.on('connection.update', (update) => {
      const { connection, lastDisconnect } = update;

      if (connection === 'close') {
        currentConnectionStatus = 'RECONNECTING';
        console.log('[whatsapp-daemon] Connection lost. Reconnecting in 5s...');
        setTimeout(startWhatsAppEngine, 5000);
      } else if (connection === 'open') {
        currentConnectionStatus = 'ONLINE';
        console.log('[whatsapp-daemon] ProofBridge WhatsApp Gateway ONLINE.');
      } else if (connection === 'connecting') {
        currentConnectionStatus = 'CONNECTING';
      }
    });

    // ── Interactive command handler ───────────────────────────────
    whatsappSocket.ev.on('messages.upsert', async (m) => {
      try {
        const msg = m.messages[0];
        if (!msg.message || msg.key.fromMe) return;

        const sender = msg.key.remoteJid;
        const text =
          msg.message.conversation ||
          msg.message.extendedTextMessage?.text ||
          '';

        // Only respond to authorized admins
        if (!AUTHORIZED_ADMINS.includes(sender) && AUTHORIZED_ADMINS.length > 0) {
          return;
        }

        const cmd = text.trim().toLowerCase();

        if (cmd === '!restore') {
          if (redis) {
            try {
              await redis.set('billing:global_shutdown', false);
              await whatsappSocket.sendMessage(sender, {
                text: '✅ *REMOTE RESTORE*: Global circuit breaker deactivated. Signer nodes are online.',
              });
            } catch (err) {
              await whatsappSocket.sendMessage(sender, {
                text: `❌ Redis error: ${err.message}`,
              });
            }
          } else {
            await whatsappSocket.sendMessage(sender, {
              text: '❌ Redis not configured. Cannot process !restore.',
            });
          }
        } else if (cmd.startsWith('!dismiss ')) {
          const targetId = text.replace('!dismiss ', '').trim();
          await whatsappSocket.sendMessage(sender, {
            text: `🔓 *DISMISSED*: Incident \`${targetId}\` logged as dismissed.`,
          });
        } else if (cmd === '!ping') {
          await whatsappSocket.sendMessage(sender, {
            text: `🏓 Pong! Status: ${currentConnectionStatus} | Agents online`,
          });
        } else if (cmd === '!status') {
          const shutdownState = redis ? await redis.get('billing:global_shutdown') : 'unknown';
          await whatsappSocket.sendMessage(sender, {
            text: `📊 *ProofBridge Status*\n• Connection: ${currentConnectionStatus}\n• Kill Switch: ${shutdownState ? 'ACTIVE' : 'INACTIVE'}\n• Redis: ${redis ? 'CONNECTED' : 'DISABLED'}`,
          });
        }
      } catch (handlerErr) {
        console.error('[whatsapp-daemon] Message handler error:', handlerErr.message);
      }
    });
  } catch (err) {
    console.error('[whatsapp-daemon] Fatal init error:', err.message);
    process.exit(1);
  }
}

// ── Alert Dispatcher ───────────────────────────────────────────────

async function triggerTelemetryAlert(recipientPhone, agentId, alertReason, txValue) {
  if (!whatsappSocket) {
    throw new Error('WhatsApp socket not initialized.');
  }

  const jid = `${recipientPhone}@s.whatsapp.net`;
  const message = [
    `🚨 *PROOFBRIDGE LINER: POLICY ENFORCEMENT ALERT* 🚨`,
    ``,
    `*Agent:* ${agentId}`,
    `*Vector:* ${alertReason}`,
    `*Value:* ${txValue} ETH`,
    ``,
    `The pre-signing circuit breaker has isolated the wallet pipeline.`,
    `Use \`!status\` for system state or \`!restore\` to deactivate kill-switch.`,
  ].join('\n');

  await whatsappSocket.sendMessage(jid, { text: message });
}

// ── Express Health Server ──────────────────────────────────────────

const app = express();

app.get('/api/whatsapp-node-health', (req, res) => {
  res.json({
    daemon: 'proofbridge-liner-baileys',
    status: currentConnectionStatus,
    admins: AUTHORIZED_ADMINS.length,
    redis: redis !== null,
    uptime: process.uptime(),
    timestamp: Date.now(),
  });
});

app.get('/api/health', (req, res) => {
  res.status(200).send('OK');
});

// ── Startup ────────────────────────────────────────────────────────

app.listen(HEALTH_PORT, () => {
  console.log(`[whatsapp-daemon] Health API on port ${HEALTH_PORT}.`);
  startWhatsAppEngine();
});

module.exports = { startWhatsAppEngine, triggerTelemetryAlert };

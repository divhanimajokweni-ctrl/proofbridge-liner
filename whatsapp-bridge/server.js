require('dotenv').config();
const { Client, LocalAuth } = require('whatsapp-web.js');
const express = require('express');
const qrcode = require('qrcode-terminal');
const QR = require('qrcode');
const fs = require('node:fs');
const path = require('node:path');

const app = express();
app.use(express.json());

const PORT = process.env.WHATSAPP_BRIDGE_PORT || 3456;
const WORKSPACE_API = process.env.WORKSPACE_API_URL || 'http://localhost:3000/api/whatsapp/handler';
const ALLOWED_NUMBERS = new Set(
  (process.env.ALLOWED_NUMBERS || '').split(',').map(s => s.trim()).filter(Boolean)
);

let latestQr = null;
let latestQrAt = 0;

const client = new Client({
  authStrategy: new LocalAuth({
    clientId: 'kilo-bridge-v1',
    dataPath: process.env.WHATSAPP_SESSION_PATH || './.wwebjs_auth',
  }),
  puppeteer: {
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  },
});

client.on('qr', (qr) => {
  latestQr = qr;
  latestQrAt = Date.now();
  console.log('\n📱 WhatsApp Web QR Code — scan with WhatsApp > Linked Devices > Link a Device:\n');
  qrcode.generate(qr, { small: true });
});

client.on('ready', () => {
  console.log('✅ WhatsApp bridge ready. Connected as:', client.info.wid.user);
});

client.on('message_create', async (msg) => {
  if (msg.fromMe) return;

  const sender = msg.from;
  if (ALLOWED_NUMBERS.size > 0 && !ALLOWED_NUMBERS.has(sender)) {
    console.log(`⛔ Blocked message from unauthorized sender: ${sender}`);
    return;
  }

  const text = msg.body?.trim();
  if (!text) return;

  console.log(`📩 Incoming WhatsApp message from ${sender}: ${text}`);

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 60000);

    const response = await fetch(WORKSPACE_API, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: sender,
        text,
        timestamp: new Date().toISOString(),
      }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);
    const result = await response.json();

    if (result.reply && typeof result.reply === 'string') {
      await msg.reply(result.reply);
      console.log(`📤 Replied to ${sender}`);
    } else if (result.error) {
      console.error(`⚠️ Handler error for ${sender}:`, result.error);
      await msg.reply('⚠️ *Bridge Error:* Processing failed. Check server logs.');
    }
  } catch (err) {
    console.error(`❌ Failed to process WhatsApp message from ${sender}:`, err.message);
    await msg.reply('⚠️ *Bridge Error:* Unable to reach workspace handler.');
  }
});

client.on('disconnected', (reason) => {
  console.warn(`🔌 WhatsApp client disconnected: ${reason}`);
  if (reason === 'LOGOUT') {
    latestQr = null;
    latestQrAt = 0;
  }
});

app.get('/health', (req, res) => {
  res.json({ ready: client.info ? true : false });
});

function normalizeQr(raw) {
  if (!raw) return null;
  if (raw.includes(';base64,')) return raw;
  return `data:image/png;base64,${raw}`;
}

app.get('/qr', (req, res) => {
  if (!latestQr) return res.status(404).json({ error: 'No QR code available yet' });
  res.json({ qr: latestQr, image: normalizeQr(latestQr), generatedAt: new Date(latestQrAt).toISOString() });
});

app.get('/qr/image', (req, res) => {
  if (!latestQr) return res.status(404).send('No QR code available yet');
  QR.toBuffer(latestQr, { type: 'png', width: 400, margin: 2, color: { dark: '#000', light: '#fff' } })
    .then(buf => {
      res.setHeader('Content-Type', 'image/png');
      res.setHeader('Content-Length', buf.length);
      res.send(buf);
    })
    .catch(() => res.status(500).send('Failed to generate QR image'));
});

app.get('/qr/export', (req, res) => {
  if (!latestQr) return res.status(404).json({ error: 'No QR code available yet' });
  const exportPath = path.resolve(process.env.WHATSAPP_SESSION_PATH || './.wwebjs_auth', 'whatsapp-qr-export.png');
  fs.mkdirSync(path.dirname(exportPath), { recursive: true });
  const rawBase64 = latestQr.includes(';base64,') ? latestQr.split(';base64,')[1] : latestQr;
  fs.writeFileSync(exportPath, Buffer.from(rawBase64, 'base64'));
  res.json({ exported: true, path: exportPath, size: fs.statSync(exportPath).size });
});

const server = app.listen(PORT, () => {
  console.log(`🌐 WhatsApp bridge HTTP listening on :${PORT}`);
});

client.initialize().catch((err) => {
  console.error('❌ Failed to initialize WhatsApp client:', err);
  process.exit(1);
});

process.on('SIGINT', async () => {
  console.log('\n🛑 Shutting down...');
  await client.destroy();
  server.close(() => process.exit(0));
});

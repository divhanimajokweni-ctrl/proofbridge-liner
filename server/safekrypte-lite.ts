import http from 'node:http';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

const PORT = Math.max(1024, Math.min(65535, Number(process.env.SAFEKRIPTE_LITE_PORT ?? 5096)));
const HOST = process.env.HOST ?? '127.0.0.1';
const LITE_TIER_MAX = 1000;
const KEY_ROTATION_MS = Math.max(0, Number(process.env.KEY_ROTATION_MS ?? 0));
const DATA_BUS_URL = process.env.DATA_BUS_URL ?? '';
const MAX_BODY_BYTES = Number(process.env.MAX_BODY_BYTES ?? 10240);
const PUBKEY_DIR = process.env.PUBKEY_DIR ?? path.resolve(process.cwd(), 'data', 'public-keys');

const HEX_RE = /^[0-9a-fA-F]+$/;
const ID_RE = /^[\w@.\-:+]+$/;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

let creatorCount = 0;
let keyRotationCount = 0;
const attestations = new Map<string, Attestation>();
let litePrivateKey: crypto.KeyObject | null = null;
let litePublicKeyPem = '';
let keyGeneratedAt = 0;

// Per-email key store: email -> { privateKey (exported), publicKeyPem, keyId, createdAt }
const emailKeyStore = new Map<string, { privateKey: Buffer; publicKeyPem: string; keyId: string; createdAt: string }>();

function ensurePubkeyDir(): void {
  if (!fs.existsSync(PUBKEY_DIR)) {
    fs.mkdirSync(PUBKEY_DIR, { recursive: true });
  }
}

function savePublicKey(email: string, publicKeyPem: string, keyId: string): void {
  ensurePubkeyDir();
  const fp = path.join(PUBKEY_DIR, `${email.replace(/@/g, '_at_').replace(/\./g, '_dot_')}.json`);
  fs.writeFileSync(fp, JSON.stringify({ email, publicKeyPem, keyId, registeredAt: new Date().toISOString() }, null, 2));
}

function loadPublicKey(email: string): { email: string; publicKeyPem: string; keyId: string } | null {
  ensurePubkeyDir();
  const fp = path.join(PUBKEY_DIR, `${email.replace(/@/g, '_at_').replace(/\./g, '_dot_')}.json`);
  try {
    return JSON.parse(fs.readFileSync(fp, 'utf8'));
  } catch {
    return null;
  }
}

process.on('uncaughtException', (err) => {
  console.error(JSON.stringify({ event: 'VU_SAFEKRIPTE_CRASH', error: err.message }));
});

interface Attestation {
  id: string;
  contentHash: string;
  creatorId: string;
  signature: string;
  timestamp: string;
  vvuKeyId: string;
  liteTier: true;
}

async function initKey(): Promise<void> {
  const { publicKey, privateKey } = crypto.generateKeyPairSync('ed25519');
  litePrivateKey = privateKey;
  litePublicKeyPem = publicKey.export({ type: 'spki', format: 'pem' });
  keyGeneratedAt = Date.now();
  keyRotationCount++;
}

async function maybeRotateKey(): Promise<void> {
  if (KEY_ROTATION_MS > 0 && Date.now() - keyGeneratedAt > KEY_ROTATION_MS) {
    await initKey();
  }
}

async function emitDataBusEvent(eventType: string, payload: Record<string, unknown>): Promise<void> {
  if (!DATA_BUS_URL) return;
  try {
    const body = JSON.stringify({ eventType, payload, source: 'safekrypte-lite', timestamp: new Date().toISOString() });
    await fetch(DATA_BUS_URL, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body });
  } catch {
    // Data bus unavailable — non-blocking
  }
}

function generateId(): string {
  return `sk_lite_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
}

function sendJson(res: http.ServerResponse, status: number, body: unknown): void {
  const data = typeof body === 'string' ? body : JSON.stringify(body);
  res.writeHead(status, { 'Content-Type': 'application/json' });
  res.end(data);
}

function sendPem(res: http.ServerResponse, pem: string): void {
  res.writeHead(200, { 'Content-Type': 'application/x-pem-file' });
  res.end(pem);
}

function readBody(req: http.IncomingMessage): Promise<Record<string, unknown>> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    let totalBytes = 0;
    req.on('data', (c: Buffer) => {
      totalBytes += c.length;
      if (totalBytes > MAX_BODY_BYTES) {
        req.destroy(new Error('Request body too large'));
        reject(new Error('Request body too large'));
      }
      chunks.push(c);
    });
    req.on('end', () => {
      try { resolve(JSON.parse(Buffer.concat(chunks).toString())); }
      catch { reject(new Error('Invalid JSON body')); }
    });
    req.on('error', reject);
  });
}

async function handleRequest(req: http.IncomingMessage, res: http.ServerResponse) {
  const url = new URL(req.url ?? '/', `http://${req.headers.host ?? 'localhost'}`);
  const method = req.method ?? 'GET';

  if (method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    });
    res.end();
    return;
  }

  try {
    const result = await route(method, url, req, res);
    if (!result.handled) {
      sendJson(res, 404, { ok: false, error: `Not found: ${method} ${url.pathname}` });
    }
  } catch (err) {
    sendJson(res, 500, { ok: false, error: err instanceof Error ? err.message : 'Internal error' });
  }
}

async function route(
  method: string, url: URL, req: http.IncomingMessage, res: http.ServerResponse
): Promise<{ handled: boolean }> {
  const path = url.pathname;

  if (path === '/health' && method === 'GET') {
    sendJson(res, 200, { ok: true, service: 'safekrypte-lite', uptime: process.uptime(), creators: creatorCount, tierMax: LITE_TIER_MAX });
    return { handled: true };
  }

  if ((path === '/.well-known/safekrypte-lite-pubkey.pem' || path === '/pk') && method === 'GET') {
    sendPem(res, litePublicKeyPem);
    return { handled: true };
  }

  const verifyMatch = path.match(/^\/commons\/v1\/verify\/(.+)$/);
  if (verifyMatch && method === 'GET') {
    const att = attestations.get(verifyMatch[1]);
    if (!att) { sendJson(res, 404, { ok: false, error: 'Attestation not found' }); return { handled: true }; }
    sendJson(res, 200, { ok: true, data: att });
    return { handled: true };
  }

  if (path === '/commons/v1/sign' && method === 'POST') {
    if (creatorCount >= LITE_TIER_MAX) {
      sendJson(res, 403, { ok: false, error: 'Free tier exhausted (1000/1000). Upgrade to SafeKrypte Full.', tier: 'exhausted' });
      return { handled: true };
    }

    await maybeRotateKey();

    const body = await readBody(req);
    const contentHash = String(body?.content_hash ?? '').trim();
    const creatorId = String(body?.creator_id ?? '').trim();

    if (!contentHash || !HEX_RE.test(contentHash)) {
      sendJson(res, 400, { ok: false, error: 'content_hash required and must be hex-encoded' });
      return { handled: true };
    }
    if (!creatorId || !ID_RE.test(creatorId)) {
      sendJson(res, 400, { ok: false, error: 'creator_id required (alphanumeric, @, ., -, :, +)' });
      return { handled: true };
    }

    if (!litePrivateKey) throw new Error('Key pair not initialized');

    const signature = crypto.sign(null, Buffer.from(contentHash, 'hex'), litePrivateKey);
    const attId = generateId();
    const timestamp = new Date().toISOString();

    const attestation: Attestation = {
      id: attId,
      contentHash,
      creatorId,
      signature: signature.toString('base64'),
      timestamp,
      vvuKeyId: `sk_lite_v1_k${keyRotationCount}`,
      liteTier: true,
    };

    attestations.set(attId, attestation);
    creatorCount++;

    emitDataBusEvent('safekrypte.ip.hash_registered', {
      attestationId: attId,
      contentHash,
      creatorId,
      tier: 'lite',
    });

    sendJson(res, 200, {
      ok: true,
      data: {
        signedAttestation: attestation,
        verificationUrl: `/commons/v1/verify/${attId}`,
        liteTier: true,
        creatorsUsed: creatorCount,
        creatorsRemaining: LITE_TIER_MAX - creatorCount,
      },
    });
    return { handled: true };
  }

  if (path === '/commons/v1/keygen' && method === 'POST') {
    const body = await readBody(req);
    const email = String(body?.email ?? '').trim().toLowerCase();

    if (!email || !EMAIL_RE.test(email)) {
      sendJson(res, 400, { ok: false, error: 'Valid email required' });
      return { handled: true };
    }

    // Check if key already exists for this email
    const existing = loadPublicKey(email);
    if (existing) {
      sendJson(res, 200, { ok: true, data: { email, publicKey: existing.publicKeyPem, keyId: existing.keyId, existing: true } });
      return { handled: true };
    }

    // Generate ED25519 key pair bound to this email
    const { publicKey, privateKey } = crypto.generateKeyPairSync('ed25519');
    const publicKeyPem = publicKey.export({ type: 'spki', format: 'pem' });
    const privateKeyBuffer = privateKey.export({ type: 'pkcs8', format: 'der' });
    const keyId = `email_sk_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
    const createdAt = new Date().toISOString();

    // Store in local map (private key held in memory for this session)
    emailKeyStore.set(email, { privateKey: privateKeyBuffer, publicKeyPem, keyId, createdAt });

    // Save public key to directory
    savePublicKey(email, publicKeyPem, keyId);

    sendJson(res, 200, {
      ok: true,
      data: {
        email,
        publicKey: publicKeyPem,
        keyId,
        algorithm: 'ED25519',
        createdAt,
        note: 'Private key held in memory for this session. Download and store securely for persistent use.',
      },
    });

    emitDataBusEvent('safekrypte.email.keygen', { email, keyId });
    return { handled: true };
  }

  if (path === '/commons/v1/pubkey' && method === 'GET') {
    const email = (url.searchParams.get('email') ?? '').trim().toLowerCase();
    if (!email || !EMAIL_RE.test(email)) {
      sendJson(res, 400, { ok: false, error: 'email query parameter required' });
      return { handled: true };
    }
    const entry = loadPublicKey(email);
    if (!entry) {
      sendJson(res, 404, { ok: false, error: `No public key registered for ${email}` });
      return { handled: true };
    }
    sendJson(res, 200, { ok: true, data: entry });
    return { handled: true };
  }

  if (path === '/commons/v1/emailsign' && method === 'POST') {
    const body = await readBody(req);
    const email = String(body?.email ?? '').trim().toLowerCase();
    const contentHash = String(body?.content_hash ?? '').trim();

    if (!email || !EMAIL_RE.test(email)) {
      sendJson(res, 400, { ok: false, error: 'Valid email required' });
      return { handled: true };
    }
    if (!contentHash || !HEX_RE.test(contentHash)) {
      sendJson(res, 400, { ok: false, error: 'content_hash required and must be hex-encoded' });
      return { handled: true };
    }

    const keyEntry = emailKeyStore.get(email);
    if (!keyEntry) {
      sendJson(res, 404, { ok: false, error: `No private key found for ${email}. Generate keys first via POST /commons/v1/keygen.` });
      return { handled: true };
    }

    const privateKey = crypto.createPrivateKey({ key: keyEntry.privateKey, format: 'der', type: 'pkcs8' });
    const signature = crypto.sign(null, Buffer.from(contentHash, 'hex'), privateKey);

    sendJson(res, 200, {
      ok: true,
      data: {
        email,
        contentHash,
        signature: signature.toString('base64'),
        keyId: keyEntry.keyId,
        algorithm: 'ED25519',
      },
    });
    return { handled: true };
  }

  if (path === '/commons/v1/stats' && method === 'GET') {
    sendJson(res, 200, {
      ok: true,
      data: {
        totalCreators: creatorCount,
        tierMax: LITE_TIER_MAX,
        tierRemaining: LITE_TIER_MAX - creatorCount,
        totalAttestations: attestations.size,
        tier: creatorCount >= LITE_TIER_MAX ? 'exhausted' : 'active',
        publicKeyUrl: '/.well-known/safekrypte-lite-pubkey.pem',
        algorithm: 'ED25519',
      },
    });
    return { handled: true };
  }

  return { handled: false };
}

const server = http.createServer(handleRequest);
server.headersTimeout = 8000;
server.requestTimeout = 15000;
server.timeout = 20000;

server.listen(PORT, HOST, async () => {
  await initKey();
  console.log(JSON.stringify({
    event: 'VU_SAFEKRIPTE_LITE_ONLINE',
    host: HOST,
    port: PORT,
    tierMax: LITE_TIER_MAX,
    algorithm: 'ED25519',
    endpoints: [
      'GET  /health',
    'GET  /.well-known/safekrypte-lite-pubkey.pem',
    'GET  /pk',
    'POST /commons/v1/sign',
    'POST /commons/v1/keygen',
    'GET  /commons/v1/pubkey?email=',
    'POST /commons/v1/emailsign',
    'GET  /commons/v1/verify/:id',
    'GET  /commons/v1/stats',
    ],
  }));
});

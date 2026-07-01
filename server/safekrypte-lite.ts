import http from 'node:http';
import crypto from 'node:crypto';

const PORT = Number(process.env.SAFEKRIPTE_LITE_PORT ?? 5096);
const HOST = process.env.HOST ?? '127.0.0.1';
const LITE_TIER_MAX = 1000;
const KEY_ROTATION_MS = Number(process.env.KEY_ROTATION_MS ?? 0);
const DATA_BUS_URL = process.env.DATA_BUS_URL ?? '';

let creatorCount = 0;
let keyRotationCount = 0;
const attestations = new Map<string, Attestation>();
let litePrivateKey: crypto.KeyObject | null = null;
let litePublicKeyPem = '';
let keyGeneratedAt = 0;

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
    req.on('data', (c: Buffer) => chunks.push(c));
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
    const contentHash = String(body?.content_hash ?? '');
    const creatorId = String(body?.creator_id ?? '');

    if (!contentHash || !creatorId) {
      sendJson(res, 400, { ok: false, error: 'content_hash and creator_id required' });
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
    'GET  /commons/v1/verify/:id',
    'GET  /commons/v1/stats',
    ],
  }));
});

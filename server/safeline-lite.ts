import http from 'node:http';
import crypto from 'node:crypto';

const PORT = Math.max(1024, Math.min(65535, Number(process.env.SAFELINER_LITE_PORT ?? 5097)));
const HOST = process.env.HOST ?? '127.0.0.1';
const LITE_TIER_MAX = 1000;
const SAFEKRIPTE_LITE_URL = process.env.SAFEKRIPTE_LITE_URL ?? 'http://127.0.0.1:5096';
const MAX_BODY_BYTES = Number(process.env.MAX_BODY_BYTES ?? 10240);
const SK_SIGN_TIMEOUT = Number(process.env.SK_SIGN_TIMEOUT ?? 5000);

const ID_RE = /^[\w@.\-:+]+$/;

let credentialCount = 0;
const credentials = new Map<string, Credential>();

process.on('uncaughtException', (err) => {
  console.error(JSON.stringify({ event: 'VU_SAFELINER_CRASH', error: err.message }));
});

interface Credential {
  id: string;
  holderId: string;
  holderName: string;
  credentialType: string;
  issuer: string;
  issuedAt: string;
  contentHash: string;
  signature: string;
  liteTier: true;
}

function generateId(): string {
  return `sl_lite_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
}

function sendJson(res: http.ServerResponse, status: number, body: unknown): void {
  res.writeHead(status, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(body));
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
    const { handled } = await route(method, url, req, res);
    if (!handled) {
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
    sendJson(res, 200, { ok: true, service: 'safeline-lite', uptime: process.uptime(), credentials: credentialCount, tierMax: LITE_TIER_MAX });
    return { handled: true };
  }

  const credMatch = path.match(/^\/commons\/v1\/credential\/([^/]+)$/);
  if (credMatch && method === 'GET') {
    const cred = credentials.get(credMatch[1]);
    if (!cred) { sendJson(res, 404, { ok: false, error: 'Credential not found' }); return { handled: true }; }
    sendJson(res, 200, { ok: true, data: cred });
    return { handled: true };
  }

  const qrMatch = path.match(/^\/commons\/v1\/credential\/([^/]+)\/qr$/);
  if (qrMatch && method === 'GET') {
    const cred = credentials.get(qrMatch[1]);
    if (!cred) { sendJson(res, 404, { ok: false, error: 'Credential not found' }); return { handled: true }; }

    const qrPayload = JSON.stringify({
      type: 'VVU Credential',
      id: cred.id,
      holder: cred.holderName,
      credentialType: cred.credentialType,
      issuedAt: cred.issuedAt,
      verifyUrl: `/commons/v1/credential/${cred.id}`,
    });

    sendJson(res, 200, {
      ok: true,
      data: {
        qrContent: qrPayload,
        credentialId: cred.id,
        verifyUrl: `/commons/v1/credential/${cred.id}`,
      },
    });
    return { handled: true };
  }

  if (path === '/commons/v1/issue' && method === 'POST') {
    if (credentialCount >= LITE_TIER_MAX) {
      sendJson(res, 403, { ok: false, error: 'Free tier exhausted (1000/1000). Upgrade to SafeLiner Full.', tier: 'exhausted' });
      return { handled: true };
    }

    const body = await readBody(req);
    const holderId = String(body?.holder_id ?? '').trim();
    const holderName = String(body?.holder_name ?? '').trim();
    const credentialType = String(body?.credential_type ?? 'completion').trim();

    if (!holderId || !ID_RE.test(holderId)) {
      sendJson(res, 400, { ok: false, error: 'holder_id required (alphanumeric, @, ., -, :, +)' });
      return { handled: true };
    }
    if (!holderName || holderName.length > 200) {
      sendJson(res, 400, { ok: false, error: 'holder_name required (max 200 chars)' });
      return { handled: true };
    }

    const credId = generateId();
    const timestamp = new Date().toISOString();
    const contentHash = crypto.createHash('sha256').update(`${holderId}:${credentialType}:${timestamp}`).digest('hex');

    let signature = '';
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), SK_SIGN_TIMEOUT);
      const skRes = await fetch(`${SAFEKRIPTE_LITE_URL}/commons/v1/sign`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content_hash: contentHash, creator_id: `safeline:${holderId}` }),
        signal: controller.signal,
      });
      clearTimeout(timeout);
      if (skRes.ok) {
        const skData = await skRes.json();
        signature = skData?.data?.signedAttestation?.signature ?? '';
      }
    } catch {
      signature = crypto.createHash('sha256').update(contentHash).digest('hex');
    }
    if (!signature) {
      signature = crypto.createHash('sha256').update(contentHash).digest('hex');
    }

    const credential: Credential = {
      id: credId,
      holderId,
      holderName,
      credentialType,
      issuer: 'VVU SafeLiner Lite',
      issuedAt: timestamp,
      contentHash,
      signature,
      liteTier: true,
    };

    credentials.set(credId, credential);
    credentialCount++;

    sendJson(res, 200, {
      ok: true,
      data: {
        credential,
        verifyUrl: `/commons/v1/credential/${credId}`,
        qrUrl: `/commons/v1/credential/${credId}/qr`,
        liteTier: true,
        credentialsUsed: credentialCount,
        credentialsRemaining: LITE_TIER_MAX - credentialCount,
      },
    });
    return { handled: true };
  }

  if (path === '/commons/v1/stats' && method === 'GET') {
    sendJson(res, 200, {
      ok: true,
      data: {
        totalCredentials: credentialCount,
        tierMax: LITE_TIER_MAX,
        tierRemaining: LITE_TIER_MAX - credentialCount,
        tier: credentialCount >= LITE_TIER_MAX ? 'exhausted' : 'active',
        issuer: 'VVU SafeLiner Lite',
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

server.listen(PORT, HOST, () => {
  console.log(JSON.stringify({
    event: 'VU_SAFELINER_LITE_ONLINE',
    host: HOST,
    port: PORT,
    tierMax: LITE_TIER_MAX,
    endpoints: [
      'GET  /health',
      'POST /commons/v1/issue',
      'GET  /commons/v1/credential/:id',
      'GET  /commons/v1/credential/:id/qr',
      'GET  /commons/v1/stats',
    ],
  }));
});

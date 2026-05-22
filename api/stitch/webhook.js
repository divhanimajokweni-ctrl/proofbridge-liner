import { createHmac, timingSafeEqual } from 'node:crypto';

function json(res, status, payload) {
  res.statusCode = status;
  res.setHeader('content-type', 'application/json');
  res.end(JSON.stringify(payload));
}

async function readRawBody(req) {
  const chunks = [];
  for await (const chunk of req) chunks.push(Buffer.from(chunk));
  return Buffer.concat(chunks);
}

function header(req, name) {
  const value = req.headers[name] || req.headers[name.toLowerCase()];
  return Array.isArray(value) ? value[0] : value;
}

function safeEqual(left, right) {
  const a = Buffer.from(String(left));
  const b = Buffer.from(String(right));
  return a.length === b.length && timingSafeEqual(a, b);
}

function normalizeSvixSecret(secret) {
  return String(secret).startsWith('whsec_') ? Buffer.from(String(secret).slice(6), 'base64') : secret;
}

function secrets() {
  return [process.env.STITCH_WEBHOOK_SECRET, process.env.STITCH_ENDPOINT_SIGNING_SECRET, process.env.STITCH_SECRET].filter(Boolean);
}

function verifySvix(req, rawBody) {
  const svixId = header(req, 'svix-id');
  const svixTimestamp = header(req, 'svix-timestamp');
  const svixSignature = header(req, 'svix-signature');
  const configured = secrets();
  if (!configured.length) return { ok: false, error: 'missing_webhook_secret' };
  if (!svixId || !svixTimestamp || !svixSignature) return { ok: false, error: 'missing_svix_headers' };

  const timestampMs = Number(svixTimestamp) * 1000;
  if (!Number.isFinite(timestampMs) || Math.abs(Date.now() - timestampMs) > 5 * 60 * 1000) {
    return { ok: false, error: 'stale_signature' };
  }

  const signedContent = Buffer.concat([Buffer.from(`${svixId}.${svixTimestamp}.`), rawBody]);
  const signatures = String(svixSignature)
    .split(' ')
    .flatMap((entry) => entry.split(','))
    .map((entry) => entry.replace(/^v\d+=/, ''));

  for (const secret of configured) {
    const expected = createHmac('sha256', normalizeSvixSecret(secret)).update(signedContent).digest('base64');
    if (signatures.some((sig) => safeEqual(expected, sig))) return { ok: true };
  }
  return { ok: false, error: 'invalid_signature' };
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return json(res, 405, { ok: false, error: 'method_not_allowed', allowed: ['POST'] });
  const rawBody = await readRawBody(req);
  const verification = verifySvix(req, rawBody);
  if (!verification.ok) return json(res, 401, { ok: false, error: verification.error });

  let event;
  try { event = JSON.parse(rawBody.toString('utf8') || '{}'); }
  catch { return json(res, 400, { ok: false, error: 'invalid_json' }); }

  const type = String(event.type || '').toLowerCase();
  const status = String(event.status || '').toUpperCase();
  const paid = type === 'link' && status === 'PAID' || type === 'payment.paid' || status === 'PAID';

  return json(res, 200, {
    ok: true,
    rail: 'stitch-express',
    received: true,
    processed: paid,
    event_type: event.type || null,
    status: event.status || null,
    payment_id: event.id || null,
    link_id: event.linkId || null,
    amount: event.amount || null,
  });
}

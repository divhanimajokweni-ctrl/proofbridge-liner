const STITCH_EXPRESS_BASE_URL = process.env.STITCH_EXPRESS_BASE_URL || 'https://express.stitch.money';
const DEFAULT_SCOPE = 'client_paymentrequest';

function json(res, status, payload) {
  res.statusCode = status;
  res.setHeader('content-type', 'application/json');
  res.end(JSON.stringify(payload));
}

async function readBody(req) {
  const chunks = [];
  for await (const chunk of req) chunks.push(Buffer.from(chunk));
  const raw = Buffer.concat(chunks).toString('utf8');
  return raw ? JSON.parse(raw) : {};
}

function amountToCents(body) {
  if (body.amountCents !== undefined) return Number(body.amountCents);
  if (body.amount_cents !== undefined) return Number(body.amount_cents);
  if (body.amount !== undefined) return Math.round(Number(body.amount) * 100);
  return NaN;
}

async function stitchToken(scope = DEFAULT_SCOPE) {
  const clientId = process.env.STITCH_CLIENT_ID;
  const clientSecret = process.env.STITCH_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    const err = new Error('STITCH_CLIENT_ID and STITCH_CLIENT_SECRET are required');
    err.status = 500;
    throw err;
  }

  const response = await fetch(`${STITCH_EXPRESS_BASE_URL}/api/v1/token`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ clientId, clientSecret, scope }),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok || data.success === false || !data.data?.accessToken) {
    const err = new Error(data.message || data.error || `Stitch token failed with ${response.status}`);
    err.status = response.status || 502;
    err.upstream = data;
    throw err;
  }
  return data.data.accessToken;
}

async function createPaymentLink({ amountCents, payerName, merchantReference, redirectUrl }) {
  const token = await stitchToken(DEFAULT_SCOPE);
  const response = await fetch(`${STITCH_EXPRESS_BASE_URL}/api/v1/payment-links`, {
    method: 'POST',
    headers: { authorization: `Bearer ${token}`, 'content-type': 'application/json' },
    body: JSON.stringify({ amount: amountCents, payerName, merchantReference }),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok || data.success === false) {
    const err = new Error(data.message || data.error || `Stitch payment-link failed with ${response.status}`);
    err.status = response.status || 502;
    err.upstream = data;
    throw err;
  }

  const payment = data.data?.payment || data.data || {};
  let link = payment.link;
  if (link && redirectUrl) {
    const sep = link.includes('?') ? '&' : '?';
    link = `${link}${sep}redirect_url=${encodeURIComponent(redirectUrl)}`;
  }
  return { ...payment, link };
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return json(res, 405, { ok: false, error: 'method_not_allowed', allowed: ['POST'] });
  }

  let body;
  try { body = await readBody(req); }
  catch { return json(res, 400, { ok: false, error: 'INVALID_JSON' }); }

  const amountCents = amountToCents(body);
  const payerName = String(body.payerName || body.payer_name || 'Ubuntu Pool Member').trim();
  const merchantReference = String(body.merchantReference || body.reference || `PBL-${Date.now()}`).trim();
  const redirectUrl = body.redirectUrl || body.redirect_url || (process.env.APP_URL ? `${process.env.APP_URL}/pools` : undefined);

  if (!Number.isFinite(amountCents) || amountCents < 100) {
    return json(res, 400, { ok: false, error: 'VALIDATION_ERROR', errors: ['amount must be at least 100 cents / R1.00'] });
  }
  if (!payerName) return json(res, 400, { ok: false, error: 'VALIDATION_ERROR', errors: ['payerName is required'] });
  if (!merchantReference) return json(res, 400, { ok: false, error: 'VALIDATION_ERROR', errors: ['merchantReference is required'] });

  try {
    const payment = await createPaymentLink({ amountCents, payerName, merchantReference, redirectUrl });
    return json(res, 200, { ok: true, rail: 'stitch-express', payment });
  } catch (err) {
    return json(res, err.status || 502, { ok: false, error: 'STITCH_EXPRESS_ERROR', detail: err.message, upstream: err.upstream });
  }
}

export { stitchToken, createPaymentLink };

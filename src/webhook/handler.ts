import crypto from 'crypto';
import { prisma } from '../db';
import { queueProof } from '../queue';
import { auditLog } from '../audit/middleware';

const MAX_AGE_MS = 300_000;

type WebhookPayload = Record<string, unknown> & { paymentId?: string; timestamp?: string | number };

function stableJson(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(stableJson).join(',')}]`;
  if (value && typeof value === 'object') {
    return `{${Object.keys(value as Record<string, unknown>).sort().map((key) => `${JSON.stringify(key)}:${stableJson((value as Record<string, unknown>)[key])}`).join(',')}}`;
  }
  return JSON.stringify(value);
}

export function hashEvent(payload: Record<string, unknown>): string {
  return crypto.createHash('sha256').update(stableJson(payload)).digest('hex');
}

export function verifyHMAC(payload: string, signature: string): boolean {
  const secret = process.env.STITCH_WEBHOOK_SECRET;
  if (!secret) return false;
  const expected = crypto.createHmac('sha256', secret).update(payload).digest('hex');
  const received = signature.startsWith('sha256=') ? signature.slice(7) : signature;
  const expectedBuffer = Buffer.from(expected, 'hex');
  const receivedBuffer = Buffer.from(received, 'hex');
  return expectedBuffer.length === receivedBuffer.length && crypto.timingSafeEqual(new Uint8Array(receivedBuffer), new Uint8Array(expectedBuffer));
}

export async function handleStitchWebhook(req: Request) {
  const signature = req.headers.get('x-stitch-signature');
  const rawBody = await req.text();

  if (!signature || !verifyHMAC(rawBody, signature)) {
    return Response.json({ error: 'Invalid signature' }, { status: 401 });
  }

  let payload: WebhookPayload;
  try {
    payload = JSON.parse(rawBody) as WebhookPayload;
  } catch {
    return Response.json({ error: 'Invalid JSON payload' }, { status: 400 });
  }

  const timestamp = Number(payload.timestamp);
  if (!Number.isFinite(timestamp) || Math.abs(Date.now() - timestamp) > MAX_AGE_MS) {
    return Response.json({ error: 'Expired webhook' }, { status: 401 });
  }

  if (!payload.paymentId || typeof payload.paymentId !== 'string') {
    return Response.json({ error: 'Missing paymentId' }, { status: 400 });
  }

  const eventHash = hashEvent(payload);
  const existing = await prisma.proofEvent.findUnique({ where: { eventHash } });
  if (existing) {
    return Response.json({ message: 'Duplicate event, already processed', eventHash }, { status: 200 });
  }

  const event = await prisma.proofEvent.create({
    data: {
      paymentId: payload.paymentId,
      eventHash,
      status: 'RECEIVED',
      payload,
    },
  });

  await queueProof(event.id, payload);
  await auditLog(eventHash, 'WEBHOOK_RECEIVED', 'stitch', { paymentId: payload.paymentId });

  return Response.json({ success: true, eventId: event.id });
}

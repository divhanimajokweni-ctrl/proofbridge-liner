import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';

function getResend(): Resend {
  return new Resend(process.env.RESEND_API_KEY);
}

const rateLimitCache = new Map<string, number[]>();
const LIMIT_WINDOW_MS = 60000;
const MAX_REQUESTS = 30;

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  if (!rateLimitCache.has(ip)) {
    rateLimitCache.set(ip, [now]);
    return false;
  }
  const timestamps = rateLimitCache.get(ip)!.filter(t => now - t < LIMIT_WINDOW_MS);
  if (timestamps.length >= MAX_REQUESTS) return true;
  timestamps.push(now);
  rateLimitCache.set(ip, timestamps);
  return false;
}

export async function POST(req: NextRequest) {
  const ip = req.ip || req.headers.get('x-forwarded-for') || 'unknown-client';
  if (isRateLimited(ip)) {
    return NextResponse.json({ error: 'Too Many Requests' }, { status: 429 });
  }

  const authHeader = req.headers.get('Authorization');
  if (!authHeader || authHeader !== `Bearer ${process.env.KERNEL_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { to, subject, html } = body;

    if (!to || !subject || !html) {
      return NextResponse.json({
        error: 'VALIDATION_ERROR',
        detail: 'Missing required fields: to, subject, html',
      }, { status: 400 });
    }

    const { data, error } = await getResend().emails.send({
      from: 'hello@venturevisionubuntu.co.za',
      to,
      subject,
      html,
    });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true, id: data?.id }, { status: 200 });
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }
}

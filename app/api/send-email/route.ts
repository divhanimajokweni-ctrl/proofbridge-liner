import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';
import { checkRateLimit } from '@/lib/rate-limiter';

function getResend(): Resend {
  return new Resend(process.env.RESEND_API_KEY);
}

export async function POST(req: NextRequest) {
  const rateLimitResponse = await checkRateLimit(req, { maxRequests: 30 });
  if (rateLimitResponse) return rateLimitResponse;

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

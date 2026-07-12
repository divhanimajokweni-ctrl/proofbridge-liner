import { NextRequest, NextResponse } from 'next/server';
import { addMessage, listConversations } from '@/lib/agent/conversation-store';

const RESEND_WEBHOOK_SECRET = process.env.RESEND_WEBHOOK_SECRET;

async function verifyResendSignature(req: NextRequest, body: string): Promise<boolean> {
  if (!RESEND_WEBHOOK_SECRET) return true;
  const signature = req.headers.get('resend-signature');
  if (!signature) return false;
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(RESEND_WEBHOOK_SECRET),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const signed = await crypto.subtle.sign('HMAC', key, encoder.encode(body));
  const expected = Array.from(new Uint8Array(signed)).map(b => b.toString(16).padStart(2, '0')).join('');
  return signature === expected;
}

function extractThreadId(subject: string): string | null {
  const match = subject.match(/\[([a-f0-9]{8})\]/);
  if (!match) return null;
  const prefix = match[1];
  const threads = listConversations();
  const found = threads.find(t => t.threadId.includes(prefix));
  return found?.threadId ?? null;
}

function stripQuotedReply(text: string): string {
  const lines = text.split('\n');
  const filtered: string[] = [];
  for (const line of lines) {
    if (line.startsWith('>') || line.match(/^On .+ wrote:/) || line.match(/^---\s*Original/)) break;
    filtered.push(line);
  }
  return filtered.join('\n').trim();
}

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text();

    if (RESEND_WEBHOOK_SECRET) {
      const valid = await verifyResendSignature(req, rawBody);
      if (!valid) {
        return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
      }
    }

    const payload = JSON.parse(rawBody);
    if (payload.type !== 'email.received') {
      return NextResponse.json({ ok: true, skipped: true });
    }

    const data = payload.data;
    const from = data.from || '';
    const to = Array.isArray(data.to) ? data.to[0] : data.to || '';
    const subject = data.subject || '';
    const textBody = stripQuotedReply(data.text || '');

    if (!textBody) {
      return NextResponse.json({ ok: true, skipped: true, reason: 'empty body' });
    }

    let threadId = extractThreadId(subject) || `thread_email_${Date.now()}`;
    const isNewThread = !extractThreadId(subject);

    addMessage(threadId, from, {
      role: 'user',
      content: textBody,
      timestamp: Date.now(),
    });

    try {
      const baseUrl = process.env.VERCEL_URL
        ? `https://${process.env.VERCEL_URL}`
        : (process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000');

      const agentRes = await fetch(`${baseUrl}/api/agent/converse`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-internal-request': 'true',
        },
        body: JSON.stringify({
          message: textBody,
          threadId,
          to: from,
        }),
      });

      if (!agentRes.ok) {
        console.error('[email/inbound] Agent converse failed:', agentRes.status);
      }
    } catch (agentErr) {
      console.error('[email/inbound] Agent converse error:', agentErr);
    }

    try {
      const { db } = await import('@/lib/db');
      const { auditLogsTable } = await import('@/lib/db/schema');
      const crypto = await import('crypto');

      await db.insert(auditLogsTable).values({
        id: `email_inbound_${crypto.randomUUID()}`,
        tenantId: 'system',
        userId: null,
        userEmail: from,
        action: 'create',
        resource: 'email_inbound',
        resourceId: threadId,
        severity: 'info',
        ipAddress: req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || null,
        userAgent: req.headers.get('user-agent') || null,
        requestMethod: 'POST',
        requestPath: '/api/email/inbound',
        requestBody: {
          from,
          to,
          subject,
          threadId,
          isNewThread,
          bodyLength: textBody.length,
        },
        responseStatus: '200',
        metadata: {
          channel: 'email',
          provider: 'resend',
          direction: 'inbound',
        },
      });
    } catch (auditErr) {
      console.error('[email/inbound] Audit log failed:', auditErr);
    }

    return NextResponse.json({ ok: true, threadId, isNewThread });
  } catch (err) {
    console.error('[email/inbound] Error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

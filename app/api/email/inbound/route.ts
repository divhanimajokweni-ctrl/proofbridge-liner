import { NextRequest, NextResponse } from 'next/server';
import { addMessage, listConversations } from '@/lib/agent/conversation-store';
import { Resend } from 'resend';

const RESEND_API_KEY = process.env.RESEND_API_KEY;
const RESEND_WEBHOOK_SECRET = process.env.RESEND_WEBHOOK_SECRET;

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

    if (!RESEND_API_KEY) {
      return NextResponse.json({ error: 'RESEND_API_KEY not configured' }, { status: 500 });
    }

    const resend = new Resend(RESEND_API_KEY);

    if (RESEND_WEBHOOK_SECRET) {
      const svixId = req.headers.get('svix-id');
      const svixTimestamp = req.headers.get('svix-timestamp');
      const svixSignature = req.headers.get('svix-signature');

      if (!svixId || !svixTimestamp || !svixSignature) {
        return NextResponse.json({ error: 'Missing Svix headers' }, { status: 401 });
      }

      try {
        resend.webhooks.verify({
          payload: rawBody,
          headers: {
            id: svixId,
            timestamp: svixTimestamp,
            signature: svixSignature,
          },
          webhookSecret: RESEND_WEBHOOK_SECRET,
        });
      } catch {
        return NextResponse.json({ error: 'Invalid webhook signature' }, { status: 401 });
      }
    }

    const payload = JSON.parse(rawBody);

    if (payload.type !== 'email.received') {
      return NextResponse.json({ ok: true, skipped: true });
    }

    const webhookData = payload.data;
    const emailId = webhookData.email_id;
    const from = webhookData.from || '';
    const to = Array.isArray(webhookData.to) ? webhookData.to[0] : webhookData.to || '';
    const subject = webhookData.subject || '';

    const { data: email, error: emailError } = await resend.emails.receiving.get(emailId);

    if (emailError || !email) {
      console.error('[email/inbound] Failed to fetch email content:', emailError);
      return NextResponse.json({ error: 'Failed to fetch email content' }, { status: 500 });
    }

    const textBody = stripQuotedReply(email.text || '');

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
          emailId,
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

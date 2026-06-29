import { NextRequest, NextResponse } from 'next/server';
import { addMessage, getConversation } from '@/lib/agent/conversation-store';

const MODEL = process.env.MISTRAL_MODEL || 'mistral-small-latest';
const API_URL = 'https://api.mistral.ai/v1/chat/completions';

function buildSystemPrompt(): string {
  return [
    'You are VVU Gateway OS — an autonomous agent operating the Venture Vision Ubuntu ecosystem.',
    'You have access to the following capabilities:',
    '- Answer questions about the VVU platform, Ubuntu Pools, ProofBridge Liner, and compliance infrastructure.',
    '- Provide status on gates, entities, and system health.',
    '- Assist with onboarding, documentation, and technical inquiries.',
    '- Route complex tasks to specialized agents when needed.',
    '',
    'Rules:',
    '1. Be concise and precise. Return structured information when possible.',
    '2. If you cannot fulfill a request, explain why clearly.',
    '3. Never output sensitive credentials, private keys, or internal secrets.',
    '4. Maintain conversation context — refer to previous messages when relevant.',
    '5. For tasks requiring on-chain operations, explain that human authorization is required.',
    '6. Sign off with your agent role identifier.',
  ].join('\n');
}

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get('Authorization');
    const isInternal = req.headers.get('x-internal-request') === 'true';
    if (!isInternal && (!authHeader || authHeader !== `Bearer ${process.env.KERNEL_SECRET}`)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json().catch(() => null);
    if (!body || typeof body.message !== 'string' || !body.message.trim()) {
      return NextResponse.json({ error: 'Invalid body. { message: string, threadId?: string, to?: string } required.' }, { status: 400 });
    }

    const apiKey = process.env.MISTRAL_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'MISTRAL_API_KEY is not configured on server.' }, { status: 500 });
    }

    const threadId: string = body.threadId || `thread_${Date.now()}`;
    const to: string = body.to || '';
    const userMessage = body.message.trim();

    const conv = getConversation(threadId);

    addMessage(threadId, to, { role: 'user', content: userMessage, timestamp: Date.now() });

    const messages = [
      { role: 'system', content: buildSystemPrompt() },
      ...conv.messages.slice(-20).map(m => ({ role: m.role, content: m.content })),
    ];

    const response = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({
        model: body.model || MODEL,
        temperature: typeof body.temperature === 'number' ? body.temperature : 0.3,
        max_tokens: typeof body.maxTokens === 'number' ? body.maxTokens : 2048,
        messages,
      }),
    });

    if (!response.ok) {
      const text = await response.text();
      return NextResponse.json({ error: `Mistral API error ${response.status}`, detail: text }, { status: 502 });
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content ?? '';

    addMessage(threadId, to, { role: 'assistant', content, timestamp: Date.now() });

    if (to && process.env.RESEND_API_KEY) {
      try {
        const { Resend } = await import('resend');
        const resend = new Resend(process.env.RESEND_API_KEY);
        await resend.emails.send({
          from: 'hello@venturevisionubuntu.co.za',
          to,
          subject: `VVU Agent Response [${threadId.slice(0, 8)}]`,
          html: `<div style="font-family:system-ui,sans-serif;max-width:600px;margin:0 auto;padding:24px;">
            <h2 style="color:#C8A84A;margin-bottom:16px;">VVU Gateway OS — Agent Response</h2>
            <div style="background:#f5f5f0;border-radius:8px;padding:16px;margin-bottom:16px;white-space:pre-wrap;font-family:monospace;font-size:13px;line-height:1.6;">${content.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</div>
            <hr style="border:none;border-top:1px solid #ddd;margin:16px 0;" />
            <p style="color:#888;font-size:12px;">Reply to this email to continue the conversation, or visit your VVU Gateway dashboard.</p>
            <p style="color:#888;font-size:11px;">Thread: ${threadId} &middot; VVU Gateway OS &middot; Venture Vision Ubuntu</p>
          </div>`,
        });
      } catch (emailErr) {
        console.error('[api/agent/converse] Failed to send email response:', emailErr);
      }
    }

    return NextResponse.json({
      ok: true,
      threadId,
      content,
      model: data.model || MODEL,
      usage: data.usage ?? null,
    });
  } catch (err) {
    console.error('[api/agent/converse] Error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('Authorization');
  const isInternal = req.headers.get('x-internal-request') === 'true';
  if (!isInternal && (!authHeader || authHeader !== `Bearer ${process.env.KERNEL_SECRET}`)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const threadId = searchParams.get('threadId');

  if (threadId) {
    const conv = getConversation(threadId);
    return NextResponse.json({ ok: true, conversation: conv });
  }

  const { listConversations } = await import('@/lib/agent/conversation-store');
  const threads = listConversations();
  return NextResponse.json({ ok: true, threads });
}

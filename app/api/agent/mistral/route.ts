import { NextRequest, NextResponse } from 'next/server';

const MODEL = process.env.MISTRAL_MODEL || 'mistral-small-latest';
const API_URL = 'https://api.mistral.ai/v1/chat/completions';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null);
    if (!body || typeof body.prompt !== 'string' || !body.prompt.trim()) {
      return NextResponse.json({ error: 'Invalid body. { prompt: string } required.' }, { status: 400 });
    }

    const apiKey = process.env.MISTRAL_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'MISTRAL_API_KEY is not configured on server.' }, { status: 500 });
    }

    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: body.model || MODEL,
        temperature: typeof body.temperature === 'number' ? body.temperature : 0.2,
        max_tokens: typeof body.maxTokens === 'number' ? body.maxTokens : 2048,
        messages: [
          {
            role: 'system',
            content: [
              'You are a headless workspace agent executing on behalf of a user.',
              'Operate within the supplied task prompt only.',
              'Return structured, machine-readable output when possible.',
            ].join(' '),
          },
          { role: 'user', content: body.prompt },
        ],
      }),
    });

    if (!response.ok) {
      const text = await response.text();
      return NextResponse.json({ error: `Mistral API error ${response.status}`, detail: text }, { status: 502 });
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content ?? '';

    return NextResponse.json({
      ok: true,
      model: data.model || MODEL,
      usage: data.usage ?? null,
      content,
    });
  } catch (err) {
    console.error('[api/agent/mistral] Error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

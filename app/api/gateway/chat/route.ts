/**
 * app/api/gateway/chat/route.ts
 *
 * Agent conversational endpoint.
 * Accepts user message, returns agent response.
 * Parses intents into system commands.
 */
import { NextRequest, NextResponse } from 'next/server';
import { parseCookies, validateSession } from '@/server/gateway/session';
import orchestrator from '@/server/agent/orchestrator';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { message } = body;

    if (!message || typeof message !== 'string') {
      return NextResponse.json(
        { ok: false, error: 'Message required' },
        { status: 400 },
      );
    }

    // Optional: validate session if cookie present
    const cookieHeader = req.headers.get('cookie') || '';
    const cookies = parseCookies(cookieHeader);
    const session = validateSession(cookies['vvu_session'] || '');

    // Agent processes intent (works with or without session for now)
    const response = await orchestrator.processIntent(message);

    return NextResponse.json({
      ok: true,
      response,
      userId: session?.userId || 'anonymous',
      timestamp: Date.now(),
    });

  } catch (err: any) {
    console.error('[AGENT CHAT ERROR]', err);
    return NextResponse.json(
      { ok: false, error: 'Agent processing error' },
      { status: 500 },
    );
  }
}

export async function GET() {
  // Return conversation history
  const history = orchestrator.getHistory();
  return NextResponse.json({
    ok: true,
    messages: history,
    count: history.length,
  });
}

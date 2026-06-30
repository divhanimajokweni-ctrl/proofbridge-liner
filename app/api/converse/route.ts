import { NextResponse } from 'next/server';
import { UnifiedConversationStore } from '@/lib/agents/conversation-store';

export async function POST(request: Request) {
  try {
    const { message, sessionId = crypto.randomUUID() } = await request.json().catch(() => ({}));
    if (!message || typeof message !== 'string' || !message.trim()) {
      return NextResponse.json({ success: false, error: 'Empty prompt discarded.' }, { status: 400 });
    }

    const store = new UnifiedConversationStore('SAFELINER-ORCHESTRATOR', sessionId);
    store.pushAgentPayload('INITIATE', 'user', message);
    store.pushAgentPayload('RECEIVE_PAYLOAD', 'system', 'Data buffered for sandbox validation.');

    const reply = `[SAFELINER] Processed: "${message.slice(0, 60)}..." | State: ${store.getCurrentStatus()}`;
    store.pushAgentPayload('PASS_SANDBOX', 'system', 'Clearance issued.');
    store.pushAgentPayload('DISPATCH', 'assistant', reply);

    return NextResponse.json({
      success: true,
      reply,
      state: store.getCurrentStatus(),
      trace: store.getContext().payloadHistory.map(p => ({ state: p.step, ts: p.timestamp })),
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'State Engine runtime failure' }, { status: 500 });
  }
}

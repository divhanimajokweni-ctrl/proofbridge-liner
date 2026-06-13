import { NextResponse } from 'next/server';
import { LindiweCognitiveHandler } from '@/lib/lindiwe/LindiweCognitiveHandler';
import { LindiweVoiceEngine } from '@/lib/lindiwe/LindiweVoiceEngine';
import { LindiweReasoningEngine } from '@/lib/lindiwe/LindiweReasoningEngine';
import { appendAuditTrail } from '@/lib/audit/auditService';

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  if (!body || typeof body !== 'object') {
    return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
  }
  const query = typeof body.q === 'string' ? body.q : '';
  if (!query.trim()) {
    return NextResponse.json({ error: 'Missing query' }, { status: 400 });
  }
  const state = {
    posture: body.state?.posture ?? 'NOMINAL',
    tauDynamics: typeof body.state?.tauDynamics === 'object' ? body.state.tauDynamics : {},
    failureCascades: Array.isArray(body.state?.failureCascades) ? body.state.failureCascades : [],
  };
  const voiceEngine = new LindiweVoiceEngine();
  const reasoningEngine = new LindiweReasoningEngine();
  const handler = new LindiweCognitiveHandler({ voiceEngine, reasoningEngine });
  const result = await handler.handleQuery({ q: query, state });

  void appendAuditTrail({
    actor: 'operator',
    action: 'LINDIWE_QUERY',
    target: 'cognitive_handler',
    metadata: {
      query,
      posture: state.posture,
      confidence: result.trace.confidence,
      inference: result.trace.inference,
    },
    severity: 'LOW',
  });

  return NextResponse.json({ ok: true, response: result });
}

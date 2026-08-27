/**
 * POST /api/facilitator
 * ---------------------
 * Study Room · Facilitator Agent backend.
 *
 * Receives the running chat transcript (system + user + assistant turns) and
 * asks the LLM (via z-ai-web-dev-sdk) for the next assistant reply. The
 * facilitator is a domain expert on the VVU IVE evidence-verification stack
 * (EIS v1.0, HBK, HOM, 72-hour protocol, Zero Fabrication Mandate).
 *
 * Body:
 *   {
 *     messages: Array<{ role: 'user'|'assistant'|'system', content: string }>
 *   }
 *
 * Returns:
 *   { content: string, model: string, classification: string }
 *
 * `runtime = 'nodejs'` because z-ai-web-dev-sdk reads the .z-ai-config file
 * from disk and uses Node-only fetch extensions. All demo data referenced by
 * the facilitator is SIMULATION — NOT MUNICIPAL OPERATIONAL DATA.
 */

import { NextRequest, NextResponse } from 'next/server';
import ZAI from 'z-ai-web-dev-sdk';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const SYSTEM_PROMPT = `You are the VVU IVE Facilitator, a domain expert on the Venture Vision Ubuntu Immersive Virtual Environment — an evidence-verification layer for municipal water infrastructure observations. You explain: (1) EIS v1.0 Evidence Independence Scoring — prevents evidence inflation, classifies observations as VALID/MISSING/ANOMALOUS/CORRELATED/INDEPENDENT, score = PRIMARY(0.3)+CORRELATED(0.2)+INDEPENDENT(0.4), threshold 0.8. (2) HBK Hydro-Bayesian Kernel — sequential Bayesian localization over 32×32 grid, MAP estimate, 95% credible radius, mixture-noise blast handling. (3) HOM Hydraulic Observability Model — sparse sensors can identify abnormal behaviour but not pinpoint leaks. (4) The 72-hour validation protocol — 4 phases: ingestion, anomaly detection, evidence assessment, reporting. (5) Zero Fabrication Mandate — missing data is never guessed, preserved as UNDEFINED. (6) 11-field provenance spine per observation. Be concise, technical, and honest. Acknowledge that all demo data is SIMULATION — NOT MUNICIPAL OPERATIONAL DATA. Reference docs: 01a executive brief, 02a HOM, 02c EIS v1.0, 04a validation brief, 05a 72h protocol.`;

interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

interface FacilitatorBody {
  messages?: ChatMessage[];
}

const MAX_MESSAGES = 24; // hard cap to keep context bounded
const MAX_CONTENT_CHARS = 4000;

function sanitizeMessages(messages: ChatMessage[]): ChatMessage[] {
  const clean = messages
    .filter((m) => m && typeof m.content === 'string' && m.content.trim().length > 0)
    .slice(-MAX_MESSAGES)
    .map((m) => ({
      role: m.role,
      content: m.content.slice(0, MAX_CONTENT_CHARS),
    }));
  return clean;
}

export async function POST(req: NextRequest) {
  let body: FacilitatorBody;
  try {
    body = (await req.json()) as FacilitatorBody;
  } catch {
    body = {};
  }

  const userMessages = Array.isArray(body.messages) ? body.messages : [];
  const sanitized = sanitizeMessages(userMessages);

  // Always prepend the system prompt so the facilitator stays in-character even
  // if the client strips it for display.
  const messagesForLLM: ChatMessage[] = [
    { role: 'system', content: SYSTEM_PROMPT },
    ...sanitized,
  ];

  // If the caller sent no user message at all, return the welcome blurb
  // directly without round-tripping to the LLM (saves a request).
  const lastUser = [...sanitized].reverse().find((m) => m.role === 'user');
  if (!lastUser) {
    return NextResponse.json({
      content:
        'Ask me anything about the VVU IVE stack — EIS v1.0, HBK, HOM, the 72-hour protocol, or the Zero Fabrication Mandate.',
      model: 'facilitator-welcome',
      classification: 'SIMULATION — NOT MUNICIPAL OPERATIONAL DATA',
    });
  }

  try {
    const zai = await ZAI.create();
    const completion = await zai.chat.completions.create({
      model: 'glm-4-flash',
      messages: messagesForLLM,
      thinking: { type: 'disabled' },
      temperature: 0.4,
    });

    const content: string =
      completion?.choices?.[0]?.message?.content ??
      '[facilitator: no content returned]';

    return NextResponse.json({
      content,
      model: 'glm-4-flash',
      classification: 'SIMULATION — NOT MUNICIPAL OPERATIONAL DATA',
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json(
      {
        content: `[facilitator offline · ${message}]

The LLM endpoint is currently unreachable. The Study Room UI is still functional — the Lesson Stepper and Residual Trunk remain fully interactive. Please retry the question in a moment.`,
        model: 'facilitator-error',
        error: message,
        classification: 'SIMULATION — NOT MUNICIPAL OPERATIONAL DATA',
      },
      { status: 200 },
    );
  }
}

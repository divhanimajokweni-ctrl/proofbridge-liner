import Anthropic from '@anthropic-ai/sdk';

type MessageParam = Anthropic.MessageParam;
type ToolUseBlock = any;
type TextBlock = any;
type ToolResultBlockParam = any;
type ContentBlock = any;
import { CONFIG } from './config';
import { load_history, save_turns, init_db } from './memory';
import { buildBoundedContext } from './context';
import { VVU_TOOLS, dispatch_tool, reportToolHardFailure } from './tools';
import { logger } from './logger';

init_db();

const client = new Anthropic({ apiKey: CONFIG.anthropic_key });

const SYSTEM_PROMPT = `You are ${CONFIG.agent_name}, the internal intelligence layer of VVU OS.
PORTFOLIO: Ubuntu Pools, ProofBridge, SafeKrypte, SafeGrid, Ekasi/Ubuntu Games, Lindiwe AI.
GOVERNANCE: Mino (75% majority, absolute veto), Ubuntu Data Bus (NATS JetStream, 34 events, 7 namespaces).
INVARIANTS (non-negotiable):
1. WhatsApp context: Reply <= 400 chars unless user requests detail.
2. Use SA vernacular naturally (eish, yoh, bro, lekker, sho, sharp).
3. ZERO static visibility into live metrics. Invoke tools before factual claims.
4. Surface tool errors cleanly and halt. Never speculate.
5. Ground every operational claim in tool data. Assumptions prohibited.`;

const MAX_TOOL_ROUNDS = 8;
const FALLBACK_REPLY = 'Andicabangi. (No response formulated.)';

export interface AgentResult {
  reply: string;
  toolRounds: number;
  jid: string;
}

function extractText(content: Anthropic.ContentBlock[]): string {
  return (content.find((b): b is TextBlock => b.type === 'text'))?.text ?? FALLBACK_REPLY;
}

export async function run_agent(jid: string, user_text: string): Promise<AgentResult> {
  const messages = buildBoundedContext(
    user_text,
    load_history(jid),
  ) as MessageParam[];

  let response = await client.messages.create({
    model: CONFIG.model,
    max_tokens: 1024,
    system: SYSTEM_PROMPT,
    tools: VVU_TOOLS,
    messages,
  });

  logger.debug({ jid, stop_reason: response.stop_reason, blocks: response.content.length }, 'Claude initial response');

  let round = 0;

  while (response.stop_reason === 'tool_use') {
    round++;
    if (round > MAX_TOOL_ROUNDS) {
      logger.warn({  jid, round  }, '[AGENT] Max tool rounds exceeded — forcing text extraction');
      break;
    }

    const toolCalls = response.content.filter(
      (b): b is ToolUseBlock => b.type === 'tool_use',
    );

logger.debug({ jid, round, tools: toolCalls.map(t => t.name) }, '[AGENT] Dispatching tool calls');

    messages.push({ role: 'assistant', content: response.content });

    const toolResults: ToolResultBlockParam[] = await Promise.all(
      toolCalls.map(async (call): Promise<ToolResultBlockParam> => {
        const content = await dispatch_tool(call.name, call.input as Record<string, unknown>);
logger.debug({ jid, tool: call.name, chars: typeof content === 'string' ? content.length : 0, failure: reportToolHardFailure(content) }, '[AGENT] Tool result received');
        return {
          type: 'tool_result',
          tool_use_id: call.id,
          content,
        };
      }),
    );

    const hasHardFailure = toolResults.some(r =>
      typeof r.content === 'string' && reportToolHardFailure(r.content),
    );

    messages.push({ role: 'user', content: toolResults });

    if (hasHardFailure) {
logger.warn({ jid, round }, '[AGENT] Hard tool failure detected — requesting Claude surface text');
      response = await client.messages.create({
        model: CONFIG.model,
        max_tokens: 256,
        system: SYSTEM_PROMPT,
        tools: VVU_TOOLS,
        messages,
      });
      break;
    }

    response = await client.messages.create({
      model: CONFIG.model,
      max_tokens: 1024,
      system: SYSTEM_PROMPT,
      tools: VVU_TOOLS,
      messages,
    });

logger.debug({ jid, round, stop_reason: response.stop_reason }, '[AGENT] Claude follow-up response');
  }

  const reply = extractText(response.content);

logger.info({ jid, round, reply_chars: reply.length }, '[AGENT] Turn complete');

  save_turns(jid, [
    { role: 'user', content: user_text },
    { role: 'assistant', content: reply },
  ]);

  return { reply, toolRounds: round, jid };
}

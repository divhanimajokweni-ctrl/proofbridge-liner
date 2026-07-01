import type Anthropic from '@anthropic-ai/sdk';

type VvuToolDef = Anthropic.Tool;

export const VVU_TOOLS: VvuToolDef[] = [
  {
    name: 'query_ubuntu_pools',
    description:
      'Query Ubuntu Pools for Stitch InstantEFT status, contribution history, or member tier.',
    input_schema: {
      type: 'object',
      properties: {
        member_id: { type: 'string' },
        action: { type: 'string', enum: ['status', 'history', 'tier'] },
      },
      required: ['member_id', 'action'],
    },
  },
  {
    name: 'query_safekrypte',
    description: 'Look up a SafeKrypte attestation by attestation_id or verify a signed hash.',
    input_schema: {
      type: 'object',
      properties: {
        attestation_id: { type: 'string' },
        content_hash: { type: 'string' },
        creator_id: { type: 'string' },
      },
    },
  },
  {
    name: 'query_governance',
    description:
      'Read GovernanceAnchor vote status, check vetoes, or fetch Ubuntu-Ctrl Fund balance.',
    input_schema: {
      type: 'object',
      properties: {
        proposal_id: { type: 'string' },
        action: { type: 'string', enum: ['status', 'vote', 'audit'] },
      },
    },
  },
  {
    name: 'query_ekasi',
    description:
      'Check Ekasi/Ubuntu Games match schedule, bet settlement, or payout status.',
    input_schema: {
      type: 'object',
      properties: {
        match_id: { type: 'string' },
        action: { type: 'string', enum: ['schedule', 'bets', 'payout'] },
      },
    },
  },
  {
    name: 'query_proofbridge',
    description: 'Fetch ProofBridge citation chain or check watertight status.',
    input_schema: {
      type: 'object',
      properties: {
        case_id: { type: 'string' },
        action: { type: 'string', enum: ['chain', 'watertight', 'commit'] },
      },
    },
  },
  {
    name: 'query_safegrid',
    description: 'Get SafeGrid load metrics, circuit breaker state, or outage reports.',
    input_schema: {
      type: 'object',
      properties: {
        action: { type: 'string', enum: ['status', 'outage', 'throttle'] },
      },
    },
  },
];

/**
 * Dispatch a tool call by name with the given input.
 * Returns a JSON string result or an error message.
 */
export async function dispatch_tool(
  name: string,
  input: Record<string, unknown>,
): Promise<string> {
  switch (name) {
    case 'query_ubuntu_pools':
      return JSON.stringify({ ok: true, data: `Ubuntu Pools query: ${JSON.stringify(input)}` });
    case 'query_safekrypte':
      return JSON.stringify({ ok: true, data: `SafeKrypte query: ${JSON.stringify(input)}` });
    case 'query_governance':
      return JSON.stringify({ ok: true, data: `Governance query: ${JSON.stringify(input)}` });
    case 'query_ekasi':
      return JSON.stringify({ ok: true, data: `Ekasi query: ${JSON.stringify(input)}` });
    case 'query_proofbridge':
      return JSON.stringify({ ok: true, data: `ProofBridge query: ${JSON.stringify(input)}` });
    case 'query_safegrid':
      return JSON.stringify({ ok: true, data: `SafeGrid query: ${JSON.stringify(input)}` });
    default:
      return JSON.stringify({ ok: false, error: `Unknown tool: ${name}` });
  }
}

/**
 * Check if a tool result indicates a hard failure.
 * Returns true if the content is a string that represents an error condition.
 */
export function reportToolHardFailure(content: unknown): boolean {
  if (typeof content !== 'string') return false;
  try {
    const parsed = JSON.parse(content);
    return parsed.ok === false;
  } catch {
    return false;
  }
}

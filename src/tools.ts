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
    name: 'query_safeline',
    description: 'Look up a SafeLiner credential by credential_id or verify a credential.',
    input_schema: {
      type: 'object',
      properties: {
        credential_id: { type: 'string' },
        action: { type: 'string', enum: ['status', 'verify'] },
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

// ─── SERVICE CLIENTS ──────────────────────────────────────────────────────

const SAFEKRIPTE_LITE_URL = process.env.SAFEKRIPTE_LITE_URL ?? 'http://127.0.0.1:5096';
const SAFELINER_LITE_URL = process.env.SAFELINER_LITE_URL ?? 'http://127.0.0.1:5097';
const OPERATUS_URL = process.env.OPERATUS_URL ?? 'http://127.0.0.1:4096';
const FETCH_TIMEOUT_MS = Number(process.env.TOOL_FETCH_TIMEOUT_MS ?? 3000);

async function fetchJSON(url: string, timeoutMs: number = FETCH_TIMEOUT_MS): Promise<Record<string, unknown>> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(timeout);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json() as Record<string, unknown>;
  } catch (err) {
    clearTimeout(timeout);
    throw err;
  }
}

async function querySafeKrypte(input: Record<string, unknown>): Promise<string> {
  try {
    const { attestation_id, content_hash, creator_id } = input;

    // If looking up a specific attestation
    if (attestation_id) {
      const data = await fetchJSON(`${SAFEKRIPTE_LITE_URL}/commons/v1/verify/${attestation_id}`);
      return JSON.stringify({ ok: true, data: { service: 'safekrypte-lite', attestation: data } });
    }

    // If creating a new attestation
    if (content_hash && creator_id) {
      const res = await fetch(`${SAFEKRIPTE_LITE_URL}/commons/v1/sign`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content_hash, creator_id }),
        signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
      });
      if (!res.ok) throw new Error(`SafeKrypte sign HTTP ${res.status}`);
      const data = await res.json() as Record<string, unknown>;
      return JSON.stringify({ ok: true, data: { service: 'safekrypte-lite', result: data } });
    }

    // Default: return stats
    const stats = await fetchJSON(`${SAFEKRIPTE_LITE_URL}/commons/v1/stats`);
    return JSON.stringify({ ok: true, data: { service: 'safekrypte-lite', stats } });
  } catch (err) {
    return JSON.stringify({
      ok: false,
      error: `SafeKrypte query failed: ${err instanceof Error ? err.message : 'Unknown error'}`,
      data: { service: 'safekrypte-lite', hint: 'SafeKrypte Lite may be offline. Try http://127.0.0.1:5096/health' },
    });
  }
}

async function querySafeLine(input: Record<string, unknown>): Promise<string> {
  try {
    const { credential_id, action } = input as { credential_id?: string; action?: string };

    if (credential_id && action === 'verify') {
      const data = await fetchJSON(`${SAFELINER_LITE_URL}/commons/v1/credential/${credential_id}`);
      return JSON.stringify({ ok: true, data: { service: 'safeline-lite', credential: data } });
    }

    // Default: return stats
    const stats = await fetchJSON(`${SAFELINER_LITE_URL}/commons/v1/stats`);
    return JSON.stringify({ ok: true, data: { service: 'safeline-lite', stats } });
  } catch (err) {
    return JSON.stringify({
      ok: false,
      error: `SafeLiner query failed: ${err instanceof Error ? err.message : 'Unknown error'}`,
      data: { service: 'safeline-lite', hint: 'SafeLiner Lite may be offline. Try http://127.0.0.1:5097/health' },
    });
  }
}

async function queryOperatus(command: string, args?: Record<string, unknown>): Promise<string> {
  try {
    const res = await fetch(`${OPERATUS_URL}/execute`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ target: 'kernel', command, args }),
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
    });
    if (!res.ok) throw new Error(`Operatus HTTP ${res.status}`);
    const data = await res.json() as Record<string, unknown>;
    return JSON.stringify({ ok: true, data: { service: 'operatus', result: data } });
  } catch (err) {
    return JSON.stringify({
      ok: false,
      error: `Operatus query failed: ${err instanceof Error ? err.message : 'Unknown error'}`,
      data: { service: 'operatus', hint: 'VVU Operatus may be offline. Try http://127.0.0.1:4096/health' },
    });
  }
}

/**
 * Generic stub for services not yet deployed.
 */
function stubService(serviceName: string, input: Record<string, unknown>): string {
  return JSON.stringify({
    ok: true,
    data: {
      service: serviceName,
      status: 'stub',
      message: `${serviceName} service is not yet deployed. This is a placeholder response.`,
      input,
    },
  });
}

/**
 * Dispatch a tool call by name with the given input.
 * Returns a JSON string result or an error message.
 */
export async function dispatch_tool(
  name: string,
  input: Record<string, unknown>,
): Promise<string> {
  switch (name) {
    case 'query_safekrypte':
      return querySafeKrypte(input);
    case 'query_safeline':
      return querySafeLine(input);
    case 'query_ubuntu_pools':
      return queryOperatus('status', input);
    case 'query_governance':
      return stubService('governance', input);
    case 'query_ekasi':
      return stubService('ekasi', input);
    case 'query_proofbridge':
      return stubService('proofbridge', input);
    case 'query_safegrid':
      return stubService('safegrid', input);
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

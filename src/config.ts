// Environment variables are loaded natively by Next.js (and by the runtime
// for standalone scripts), so no explicit dotenv loading is required here.
export const CONFIG = {
  agent_name: process.env.AGENT_NAME ?? 'Lindiwe',
  anthropic_key: process.env.ANTHROPIC_API_KEY ?? '',
  model: process.env.AGENT_MODEL ?? 'claude-sonnet-4-20250514',
  wa_auth_dir: process.env.WA_AUTH_DIR ?? './data/wa_auth',
  allowlist: new Set(
    (process.env.WHATSAPP_ALLOWLIST ?? '').split(',').filter(Boolean),
  ),
  db_path: process.env.SQLITE_DB_PATH ?? './data/agent_memory.db',
  max_context_tokens: parseInt(process.env.MAX_CONTEXT_TOKENS ?? '8000', 10),
  max_tool_rounds: parseInt(process.env.MAX_TOOL_ROUNDS ?? '8', 10),
};

export function assertConfigured(): void {
  if (!CONFIG.anthropic_key) {
    throw new Error('ANTHROPIC_API_KEY is required');
  }
}

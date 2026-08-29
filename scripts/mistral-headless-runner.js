#!/usr/bin/env node
/**
 * Mistral Headless Runner
 *
 * A minimal Mistral-powered headless agent that processes a single prompt
 * and returns a structured response. Used by agent-dispatcher.mjs for
 * general-purpose LLM reasoning.
 *
 * Usage:
 *   node scripts/mistral-headless-runner.js "your prompt here"
 *   node scripts/mistral-headless-runner.js --json "your prompt here"
 *
 * Env:
 *   MISTRAL_API_KEY         Required
 *   MISTRAL_MODEL           Default: mistral-small-latest
 *   MISTRAL_ENDPOINT        Default: https://api.mistral.ai/v1/chat/completions
 */

const MISTRAL_ENDPOINT = process.env.MISTRAL_ENDPOINT || 'https://api.mistral.ai/v1/chat/completions';
const MISTRAL_MODEL = process.env.MISTRAL_MODEL || 'mistral-small-latest';
const SYSTEM_PROMPT = process.env.MISTRAL_SYSTEM_PROMPT || `You are Lindiwe, the internal intelligence layer of VVU OS.
You have access to system tools via the agent dispatcher.
Respond concisely and accurately. Use South African vernacular naturally where appropriate.
Ground every operational claim in tool data. Never speculate.`;

async function run(prompt) {
  const apiKey = process.env.MISTRAL_API_KEY;
  if (!apiKey) {
    throw new Error('MISTRAL_API_KEY environment variable is required');
  }

  const response = await fetch(MISTRAL_ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: MISTRAL_MODEL,
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: prompt },
      ],
      max_tokens: 1024,
      temperature: 0.3,
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Mistral API error ${response.status}: ${text}`);
  }

  const data = await response.json();
  const content = data?.choices?.[0]?.message?.content || '';
  return content.trim();
}

// CLI entry point
const args = process.argv.slice(2);
let asJson = false;
let prompt = '';

for (const arg of args) {
  if (arg === '--json') {
    asJson = true;
  } else {
    prompt = (prompt ? prompt + ' ' : '') + arg;
  }
}

if (!prompt) {
  console.error('Usage: node mistral-headless-runner.js [--json] "<prompt>"');
  process.exit(1);
}

run(prompt)
  .then((result) => {
    if (asJson) {
      console.log(JSON.stringify({ ok: true, output: result }));
    } else {
      console.log(result);
    }
    process.exit(0);
  })
  .catch((err) => {
    if (asJson) {
      console.log(JSON.stringify({ ok: false, error: err.message }));
    } else {
      console.error(`Error: ${err.message}`);
    }
    process.exit(1);
  });

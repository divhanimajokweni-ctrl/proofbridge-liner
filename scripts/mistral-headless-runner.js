require('dotenv').config();

const DEFAULT_MODEL = process.env.MISTRAL_MODEL || 'mistral-small-latest';
const API_URL = 'https://api.mistral.ai/v1/chat/completions';

async function runHeadlessAgent({ prompt, model = DEFAULT_MODEL, temperature = 0.2, maxTokens = 2048 } = {}) {
  const apiKey = process.env.MISTRAL_API_KEY;
  if (!apiKey) {
    throw new Error('MISTRAL_API_KEY is not set');
  }

  const system = [
    'You are a headless workspace agent.',
    'Operate strictly within the provided context.',
    'Return structured, action-ready output. No filler.',
    'Do not ask for confirmation unless absolutely required.',
  ].join(' ');

  const body = {
    model,
    temperature,
    max_tokens: maxTokens,
    messages: [
      { role: 'system', content: system },
      { role: 'user', content: prompt },
    ],
  };

  const res = await fetch(API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Mistral API error ${res.status}: ${text}`);
  }

  const data = await res.json();
  const content = data.choices?.[0]?.message?.content ?? '';
  return {
    content,
    usage: data.usage ?? null,
    model: data.model ?? model,
  };
}

async function main() {
  const argv = process.argv.slice(2);
  if (argv.length === 0 || argv.includes('--help') || argv.includes('-h')) {
    console.log(`Usage:
  node mistral-headless-runner.js "your task prompt"
  node mistral-headless-runner.js --model mistral-large-latest --max-tokens 4096 "complex task"

Env:
  MISTRAL_API_KEY   Required
  MISTRAL_MODEL     Optional, default: ${DEFAULT_MODEL}`);
    process.exit(argv.includes('--help') || argv.includes('-h') ? 0 : 1);
  }

  let model = process.env.MISTRAL_MODEL || DEFAULT_MODEL;
  let maxTokens = 2048;
  const promptParts = [];

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === '--model' && argv[i + 1]) {
      model = argv[++i];
      continue;
    }
    if (arg === '--max-tokens' && argv[i + 1]) {
      maxTokens = parseInt(argv[++i], 10);
      continue;
    }
    promptParts.push(arg);
  }

  const prompt = promptParts.join(' ').trim();
  if (!prompt) {
    console.error('Error: prompt is required');
    process.exit(1);
  }

  try {
    const out = await runHeadlessAgent({ prompt, model, maxTokens });
    console.log(JSON.stringify({ model: out.model, usage: out.usage, content: out.content }, null, 2));
    process.exit(0);
  } catch (err) {
    console.error(`Headless agent error: ${err.message}`);
    process.exit(1);
  }
}

main();

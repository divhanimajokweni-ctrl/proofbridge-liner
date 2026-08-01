#!/usr/bin/env node
/**
 * Agent Ecosystem Dispatcher
 *
 * Routes incoming intents to skills/agents, executes them, and returns
 * structured results.  Integrates:
 *   - Mistral headless runner (llmAgent)
 *   - Monte Carlo simulation (simulationAgent)
 *   - Stub skills (customer-360 parked; Intercom token required)
 *
 * Usage:
 *   node agent-dispatcher.js "Run a Monte Carlo localisation with 5 nodes and 2 sensors."
 *   node agent-dispatcher.js --json "Summarise the governance document in artifacts/governance_document.md"
 *   echo '{"intent":"list agents"}' | node agent-dispatcher.js --stdin
 *
 * Env:
 *   MISTRAL_API_KEY      Required for llmAgent
 *   WORKSPACE_ROOT       Default: cwd
 */

import { spawn, spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';

const WORKSPACE_ROOT = process.env.WORKSPACE_ROOT || process.cwd();

const AGENTS = {
  llmAgent: {
    name: 'llmAgent',
    description: 'General-purpose reasoning via Mistral. Use for any text task.',
    triggers: ['summar', 'analyse', 'explain', 'write', 'draft', 'review', 'audit', 'plan'],
    execute: async (intent) => {
      const script = `${WORKSPACE_ROOT}/scripts/mistral-headless-runner.js`;
      if (!existsSync(script)) throw new Error('Mistral runner missing');
      return runScript(process.execPath, [script, intent]);
    },
  },

  simulationAgent: {
    name: 'simulationAgent',
    description: 'Dual-mode Bayesian localisation Monte Carlo.',
    triggers: ['monte carlo', 'simulate', 'locali'],
    execute: async (intent) => {
      const script = `${WORKSPACE_ROOT}/artifacts/monte_carlo_simulation.py`;
      if (!existsSync(script)) throw new Error('simulation script missing');

      const m = intent.match(/(\d+)\s*nodes?\s*(?:and\s*)?(\d+)\s*sensors?/i);
      const nodes = m ? parseInt(m[1], 10) : 5;
      const sensors = m ? parseInt(m[2], 10) : 2;
      return runScript('python3', [script, '--nodes', String(nodes), '--sensors', String(sensors), '--output', `${WORKSPACE_ROOT}/artifacts/simulation_results.csv`]);
    },
  },

  customer360Agent: {
    name: 'customer360Agent',
    description: 'Intercom customer profile aggregator (parked — requires INTERCOM_TOKEN).',
    triggers: ['customer 360', 'intercom', 'look up customer'],
    execute: async (intent) => ({
      parked: true,
      reason: 'INTERCOM_TOKEN not configured. Set INTERCOM_TOKEN in .env to activate.',
      skill: 'customer-360',
      hint: 'npm run customer-360 -- user@example.com',
    }),
  },

  deployGuardian: {
    name: 'deployGuardian',
    description: 'Pre-flight deploy safety checks.',
    triggers: ['deploy', 'production', 'vercel', 'rollout'],
    execute: async (intent) => {
      const script = `${WORKSPACE_ROOT}/scripts/verify-setup.js`;
      if (!existsSync(script)) throw new Error('verify-setup script missing');
      const res = runScript(process.execPath, [script]);
      const gateRes = runScript(process.execPath, [`${WORKSPACE_ROOT}/scripts/orchestrate-gates.js`]);
      return [res, gateRes].join('\n\n');
    },
  },
};

function runScript(command, args) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      cwd: WORKSPACE_ROOT,
      encoding: 'utf8',
      maxBuffer: 10 * 1024 * 1024,
      env: { ...process.env },
    });
    let stdout = '';
    let stderr = '';
    child.stdout.on('data', (d) => { stdout += d.toString(); });
    child.stderr.on('data', (d) => { stderr += d.toString(); });
    child.on('close', (code) => {
      if (code !== 0) {
        reject(new Error(stderr || stdout || `exit ${code}`));
      } else {
        resolve(stdout.trim());
      }
    });
    child.on('error', reject);
  });
}

function classifyIntent(intent) {
  const lower = intent.toLowerCase();
  let best = null;
  let bestScore = -1;
  for (const agent of Object.values(AGENTS)) {
    const score = agent.triggers.reduce((s, t) => (lower.includes(t) ? s + 1 : s), 0);
    if (score > bestScore) {
      bestScore = score;
      best = agent;
    }
  }
  return bestScore > 0 ? best : AGENTS.llmAgent;
}

function renderAgentList() {
  return Object.values(AGENTS)
    .map((a) => `- **${a.name}**: ${a.description}`)
    .join('\n');
}

export async function dispatch(intent) {
  const trimmed = String(intent).trim();
  if (!trimmed) throw new Error('Empty intent');

  if (trimmed.toLowerCase().startsWith('list agents')) {
    return { agent: 'dispatcher', intent: trimmed, output: renderAgentList() };
  }

  const agent = classifyIntent(trimmed);
  const start = Date.now();
  let output;
  try {
    output = await agent.execute(trimmed);
  } catch (err) {
    output = `Agent ${agent.name} failed: ${err.message}`;
  }
  return {
    agent: agent.name,
    intent: trimmed,
    durationMs: Date.now() - start,
    output,
  };
}

// CLI
if (import.meta.url === `file://${process.argv[1]}`) {
  const args = process.argv.slice(2);
  let intent = '';
  let asJson = false;

  for (const a of args) {
    if (a === '--json') asJson = true;
    else if (a === '--stdin') {
      process.stdin.setEncoding('utf8');
      let chunk = '';
      for await (const c of process.stdin) chunk += c;
      intent = chunk.trim();
    } else {
      intent += (intent ? ' ' : '') + a;
    }
  }

  dispatch(intent).then((res) => {
    if (asJson) console.log(JSON.stringify(res, null, 2));
    else console.log(`[${res.agent}] ${res.intent}\n\n${res.output}`);
    process.exit(0);
  }).catch((err) => {
    console.error(`Dispatcher error: ${err.message}`);
    process.exit(1);
  });
}

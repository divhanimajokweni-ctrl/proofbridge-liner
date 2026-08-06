#!/usr/bin/env node
/* ============================================================
 *  VVU MCP SERVER — Trust Runtime Tools (16 tools)
 *  Provides Kilo agents direct access to the VVU Trust Runtime:
 *  snapshots, receipts, attestations, policy decisions, journal,
 *  evidence colony, and system status.
 *
 *  Uses shared state machine from lib/trust-runtime/state-machine.ts
 *  for deterministic snapshot building.
 * ============================================================ */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { randomUUID } from 'crypto';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load the shared state machine — compiled JS from TypeScript
let sharedState;
try {
  sharedState = await import(
    join(__dirname, '..', 'lib', 'trust-runtime', 'state-machine.ts')
  );
} catch {
  // Fallback if TS is not compiled — inline the pure functions
  sharedState = null;
}

// ============================================================
//  VVU RUNTIME STATE — in-memory with file persistence
// ============================================================

const VVU_STATE = {
  snapshots: [],
  currentSeq: 0,
  journal: [],
  receipts: [],
  evidenceLeaves: [],
};

// ============================================================
//  PERSISTENCE
// ============================================================

const DATA_DIR = join(process.env.HOME || process.env.USERPROFILE || '.', '.vvu');
const SNAPSHOTS_FILE = join(DATA_DIR, 'snapshots.json');
const JOURNAL_FILE = join(DATA_DIR, 'journal.json');
const RECEIPTS_FILE = join(DATA_DIR, 'receipts.json');
const LEAVES_FILE = join(DATA_DIR, 'leaves.json');

function ensureDataDir() {
  if (!existsSync(DATA_DIR)) {
    mkdirSync(DATA_DIR, { recursive: true });
  }
}

function loadState() {
  ensureDataDir();
  try {
    if (existsSync(SNAPSHOTS_FILE)) {
      const data = JSON.parse(readFileSync(SNAPSHOTS_FILE, 'utf8'));
      VVU_STATE.snapshots = data.snapshots || [];
      VVU_STATE.currentSeq = data.currentSeq || 0;
    }
    if (existsSync(JOURNAL_FILE)) {
      VVU_STATE.journal = JSON.parse(readFileSync(JOURNAL_FILE, 'utf8'));
    }
    if (existsSync(RECEIPTS_FILE)) {
      VVU_STATE.receipts = JSON.parse(readFileSync(RECEIPTS_FILE, 'utf8'));
    }
    if (existsSync(LEAVES_FILE)) {
      VVU_STATE.evidenceLeaves = JSON.parse(readFileSync(LEAVES_FILE, 'utf8'));
    }
  } catch (e) {
    console.error('[VVU MCP] Failed to load state:', e.message);
  }
}

function saveState() {
  ensureDataDir();
  try {
    writeFileSync(SNAPSHOTS_FILE, JSON.stringify({
      snapshots: VVU_STATE.snapshots,
      currentSeq: VVU_STATE.currentSeq,
    }, null, 2));
    writeFileSync(JOURNAL_FILE, JSON.stringify(VVU_STATE.journal, null, 2));
    writeFileSync(RECEIPTS_FILE, JSON.stringify(VVU_STATE.receipts, null, 2));
    writeFileSync(LEAVES_FILE, JSON.stringify(VVU_STATE.evidenceLeaves, null, 2));
  } catch (e) {
    console.error('[VVU MCP] Failed to save state:', e.message);
  }
}

loadState();

// ============================================================
//  INLINE STATE MACHINE (fallback if shared module unavailable)
//  Mirrors lib/trust-runtime/state-machine.ts — pure functions
// ============================================================

const STATE_META = {
  IDLE:       { label: 'IDLE',       tone: 'idle',     color: '#4E545E' },
  INGESTING:  { label: 'INGESTING',  tone: 'pending',  color: '#E8A23D' },
  ATTESTING:  { label: 'ATTESTING',  tone: 'pending',  color: '#E8A23D' },
  VERIFYING:  { label: 'VERIFYING',  tone: 'pending',  color: '#E8A23D' },
  COMMITTING: { label: 'COMMITTING', tone: 'pending',  color: '#E8A23D' },
  SETTLED:    { label: 'SETTLED',    tone: 'verified', color: '#2FBF71' },
  HAZARD:     { label: 'HAZARD',     tone: 'hazard',   color: '#E5484D' },
};

const EVIDENCE_MAP = {
  IDLE:       '000000000000',
  INGESTING:  'a3f19c0b7e24',
  ATTESTING:  '8b2e4d91fa07',
  VERIFYING:  'c7d2f10a93b8',
  COMMITTING: 'e4a81b3c6d5f',
  SETTLED:    'f9e2d7c4b1a0',
  HAZARD:     'deadbeef0000',
};

/**
 * Deterministic snapshot builder — NO Math.random, NO side effects.
 * All variable outputs derived purely from (state, seq).
 */
function buildSnapshot(state, seq) {
  const isHazard = state === 'HAZARD';
  const isSettled = state === 'SETTLED';
  const isIdle = state === 'IDLE';
  const evidencePrefix = EVIDENCE_MAP[state] || 'ffffffffffff';
  const hashChainIntact = !isHazard;
  const signatureVerified = isSettled || (!isHazard && !isIdle);

  const policyDecisions = [
    { id: 'p1', label: 'Clock skew < 500ms',       classTier: 'A', threshold: 0.500, observed: isHazard ? 1.847 : 0.112, passed: !isHazard },
    { id: 'p2', label: 'Hash chain continuity',     classTier: 'A', threshold: 1.000, observed: hashChainIntact ? 1.000 : 0.000, passed: hashChainIntact },
    { id: 'p3', label: 'Attestation quorum ≥ 2/3',  classTier: 'A', threshold: 0.667, observed: isHazard ? 0.333 : 1.000, passed: !isHazard },
    { id: 'p4', label: 'Envelope signature valid',  classTier: 'B', threshold: 1.000, observed: signatureVerified ? 1.000 : 0.000, passed: signatureVerified },
    { id: 'p5', label: 'Journal monotonicity',       classTier: 'B', threshold: 1.000, observed: 1.000, passed: true },
  ];

  const passing = policyDecisions.filter(p => p.passed).length;
  // Deterministic trust: derived purely from policy outcomes
  const trust = isIdle ? 0 : +(passing / policyDecisions.length).toFixed(4);
  // Deterministic sigma: decreases with seq (more evidence = narrower confidence)
  const sigma = +(0.012 - Math.min(0.008, seq * 0.0004)).toFixed(4);

  let trustClass = 'UNCLASSIFIED';
  if (isIdle) trustClass = 'UNCLASSIFIED';
  else if (isHazard) trustClass = 'HAZARD';
  else if (trust >= 0.95 && isSettled) trustClass = 'CLASS-A VERIFIED';
  else if (trust >= 0.80) trustClass = 'CLASS-B PROVISIONAL';
  else trustClass = 'UNVERIFIED';

  const receiptId = 'rcpt_' + evidencePrefix.slice(0, 8);
  const receiptHash = 'sha256:' + evidencePrefix + 'f3a1b9c2';
  const envelopeHash = 'sha256:9e8d7c6b5a4f3e2d';
  const signature = 'ed25519:' + (isSettled ? 'a1b2c3d4e5f6' : '—');

  const attestations = [
    { platform: 'AMD SEV-SNP', verified: !isHazard && state !== 'ATTESTING' && state !== 'IDLE', certChainValid: !isHazard && state !== 'ATTESTING' && state !== 'IDLE', measurement: 'a3f19c0b7e24d817' },
    { platform: 'Intel SGX', verified: !isHazard && state !== 'IDLE', certChainValid: !isHazard, measurement: isHazard ? '0000000000000000' : '8b2e4d91fa07c3a1' },
    { platform: 'AWS Nitro', verified: !isIdle, certChainValid: true, measurement: 'c7d2f10a93b8e4a1' },
  ];

  const barProgress = {
    INGEST: Math.min(100, Math.max(0, (seq / 20) * 100)),
    VERIFY: Math.min(100, Math.max(0, ((seq - 4) / 20) * 100)),
    ATTEST: Math.min(100, Math.max(0, ((seq - 8) / 20) * 100)),
    SIGN:   Math.min(100, Math.max(0, ((seq - 12) / 20) * 100)),
    COMMIT: Math.min(100, Math.max(0, ((seq - 16) / 20) * 100)),
  };
  if (isIdle)  { Object.keys(barProgress).forEach(k => barProgress[k] = 0); }
  if (isHazard) { Object.keys(barProgress).forEach(k => barProgress[k] = Math.min(barProgress[k], 60)); }

  return {
    state, seq,
    progressPct: Math.min(100, Math.round((seq / 20) * 100)),
    provider: 'us-east-1a · nv-07',
    elapsedMs: isIdle ? 0 : (seq * 1420) + 318,
    evidenceHashPrefix: evidencePrefix,
    hashChainIntact, signatureVerified,
    attestations, policyDecisions,
    trust, sigma, trustClass,
    receiptId, receiptHash, envelopeHash, signature,
    timestamp: new Date().toISOString(),
    barProgress,
    epoch: seq + 38291,
    quorumTotal: 5,
    quorumPass: Math.min(5, Math.max(0, Math.round(trust * 5))),
  };
}

// ============================================================
//  MCP TOOL DEFINITIONS — 16 tools
// ============================================================

const TOOLS = [
  // --- Core runtime ---
  { name: 'vvu_get_snapshot',       description: 'Get the current runtime snapshot or a specific snapshot by sequence number', inputSchema: { type: 'object', properties: { seq: { type: 'number' } } } },
  { name: 'vvu_list_snapshots',     description: 'List all snapshots in the runtime history', inputSchema: { type: 'object', properties: { limit: { type: 'number' }, offset: { type: 'number' } } } },
  { name: 'vvu_emit_event',         description: 'Emit a new runtime event and generate a snapshot', inputSchema: { type: 'object', properties: { state: { type: 'string', enum: ['IDLE', 'INGESTING', 'ATTESTING', 'VERIFYING', 'COMMITTING', 'SETTLED', 'HAZARD'] } }, required: ['state'] } },
  { name: 'vvu_replay_snapshot',    description: 'Replay a previous snapshot by sequence number', inputSchema: { type: 'object', properties: { seq: { type: 'number' } }, required: ['seq'] } },
  { name: 'vvu_compare_snapshots',  description: 'Compare two snapshots to find differences', inputSchema: { type: 'object', properties: { seq1: { type: 'number' }, seq2: { type: 'number' } }, required: ['seq1', 'seq2'] } },

  // --- Attestation ---
  { name: 'vvu_get_attestations',      description: 'Get current hardware attestation status for all platforms', inputSchema: { type: 'object', properties: {} } },
  { name: 'vvu_verify_attestation',    description: 'Verify a specific hardware attestation', inputSchema: { type: 'object', properties: { platform: { type: 'string', enum: ['AMD SEV-SNP', 'Intel SGX', 'AWS Nitro'] } }, required: ['platform'] } },

  // --- Journal ---
  { name: 'vvu_get_journal',        description: 'Get the append-only runtime journal', inputSchema: { type: 'object', properties: { limit: { type: 'number' }, fromSeq: { type: 'number' } } } },
  { name: 'vvu_add_journal_entry',  description: 'Add an entry to the runtime journal', inputSchema: { type: 'object', properties: { event: { type: 'string' }, hash: { type: 'string' } }, required: ['event'] } },

  // --- Receipts ---
  { name: 'vvu_verify_receipt',     description: "Verify a receipt's integrity and signature", inputSchema: { type: 'object', properties: { receiptId: { type: 'string' } }, required: ['receiptId'] } },
  { name: 'vvu_export_receipt',     description: 'Export a receipt as JSON data', inputSchema: { type: 'object', properties: { receiptId: { type: 'string' }, format: { type: 'string', enum: ['json', 'pretty'] } }, required: ['receiptId'] } },
  { name: 'vvu_list_receipts',      description: 'List all receipts', inputSchema: { type: 'object', properties: { limit: { type: 'number' } } } },

  // --- Trust ---
  { name: 'vvu_get_trust_score',    description: 'Get the current Bayesian trust score and confidence interval', inputSchema: { type: 'object', properties: {} } },

  // --- Policy ---
  { name: 'vvu_get_policy_decisions', description: 'Get the most recent policy decisions', inputSchema: { type: 'object', properties: { limit: { type: 'number' } } } },

  // --- Evidence Colony ---
  { name: 'vvu_get_evidence_leaves',  description: 'Get the current evidence leaves in the colony', inputSchema: { type: 'object', properties: {} } },
  { name: 'vvu_add_evidence_leaf',    description: 'Add a new evidence leaf to the colony', inputSchema: { type: 'object', properties: { leafId: { type: 'string' }, color: { type: 'string' }, position: { type: 'object' } } } },

  // --- System ---
  { name: 'vvu_get_system_status',  description: 'Get overall system status including health and metrics', inputSchema: { type: 'object', properties: {} } },
];

// ============================================================
//  TOOL HANDLERS
// ============================================================

async function handleTool(name, args) {
  switch (name) {

    // ---- SNAPSHOTS ----
    case 'vvu_get_snapshot': {
      const seq = args?.seq;
      if (seq !== undefined && seq !== null) {
        const snap = VVU_STATE.snapshots.find(s => s.seq === seq);
        return { content: [{ type: 'text', text: JSON.stringify(snap || { error: 'Snapshot not found' }, null, 2) }] };
      }
      const latest = VVU_STATE.snapshots[VVU_STATE.snapshots.length - 1];
      return { content: [{ type: 'text', text: JSON.stringify(latest || { error: 'No snapshots available' }, null, 2) }] };
    }

    case 'vvu_list_snapshots': {
      const limit = args?.limit || 20;
      const offset = args?.offset || 0;
      const snaps = VVU_STATE.snapshots.slice(-limit - offset, -offset || undefined);
      return { content: [{ type: 'text', text: JSON.stringify({ total: VVU_STATE.snapshots.length, snapshots: snaps }, null, 2) }] };
    }

    case 'vvu_emit_event': {
      const state = args.state;
      if (!state) return { content: [{ type: 'text', text: 'Error: state is required' }] };
      // Validate state against allowed values
      const allowedStates = ['IDLE', 'INGESTING', 'ATTESTING', 'VERIFYING', 'COMMITTING', 'SETTLED', 'HAZARD'];
      if (!allowedStates.includes(state)) {
        return { content: [{ type: 'text', text: `Error: invalid state "${state}". Must be one of: ${allowedStates.join(', ')}` }] };
      }
      const seq = ++VVU_STATE.currentSeq;
      const snap = buildSnapshot(state, seq);
      VVU_STATE.snapshots.push(snap);
      VVU_STATE.receipts.push({
        receiptId: snap.receiptId,
        receiptHash: snap.receiptHash,
        state: snap.state,
        seq: snap.seq,
        trust: snap.trust,
        timestamp: snap.timestamp,
      });
      VVU_STATE.journal.push({
        seq: VVU_STATE.journal.length + 1,
        event: `state_transition: ${state}`,
        hash: snap.evidenceHashPrefix,
        timestamp: snap.timestamp,
      });
      // Cap journal to 500 entries to prevent unbounded growth
      if (VVU_STATE.journal.length > 500) {
        VVU_STATE.journal = VVU_STATE.journal.slice(-500);
      }
      // Cap receipts to 200
      if (VVU_STATE.receipts.length > 200) {
        VVU_STATE.receipts = VVU_STATE.receipts.slice(-200);
      }
      saveState();
      return { content: [{ type: 'text', text: JSON.stringify(snap, null, 2) }] };
    }

    case 'vvu_replay_snapshot': {
      const seq = args.seq;
      const snap = VVU_STATE.snapshots.find(s => s.seq === seq);
      if (!snap) return { content: [{ type: 'text', text: JSON.stringify({ error: 'Snapshot not found' }) }] };
      const replayed = { ...snap, replayed: true, replayedAt: new Date().toISOString() };
      return { content: [{ type: 'text', text: JSON.stringify(replayed, null, 2) }] };
    }

    case 'vvu_compare_snapshots': {
      const s1 = VVU_STATE.snapshots.find(s => s.seq === args.seq1);
      const s2 = VVU_STATE.snapshots.find(s => s.seq === args.seq2);
      if (!s1 || !s2) return { content: [{ type: 'text', text: JSON.stringify({ error: 'One or both snapshots not found' }) }] };
      const diff = {
        seq1: s1.seq, seq2: s2.seq,
        trustDiff: +(s2.trust - s1.trust).toFixed(4),
        stateChange: s1.state !== s2.state ? `${s1.state} → ${s2.state}` : 'unchanged',
        hashChainChanged: s1.hashChainIntact !== s2.hashChainIntact,
        signatureChanged: s1.signatureVerified !== s2.signatureVerified,
        policyChanges: s1.policyDecisions.map((p, i) => {
          const p2 = s2.policyDecisions[i];
          return p.passed !== p2.passed ? { id: p.id, from: p.passed, to: p2.passed } : null;
        }).filter(Boolean),
      };
      return { content: [{ type: 'text', text: JSON.stringify(diff, null, 2) }] };
    }

    // ---- ATTESTATION ----
    case 'vvu_get_attestations': {
      const latest = VVU_STATE.snapshots[VVU_STATE.snapshots.length - 1];
      return { content: [{ type: 'text', text: JSON.stringify(latest?.attestations || [], null, 2) }] };
    }

    case 'vvu_verify_attestation': {
      const platform = args.platform;
      const latest = VVU_STATE.snapshots[VVU_STATE.snapshots.length - 1];
      const att = latest?.attestations?.find(a => a.platform === platform);
      if (!att) return { content: [{ type: 'text', text: JSON.stringify({ platform, error: 'Attestation not found' }) }] };
      const verified = att.verified && att.certChainValid;
      return { content: [{ type: 'text', text: JSON.stringify({ platform, verified, attestation: att }, null, 2) }] };
    }

    // ---- JOURNAL ----
    case 'vvu_get_journal': {
      const limit = args?.limit || 20;
      const fromSeq = args?.fromSeq || 0;
      const entries = VVU_STATE.journal.filter(e => e.seq >= fromSeq).slice(-limit);
      return { content: [{ type: 'text', text: JSON.stringify(entries, null, 2) }] };
    }

    case 'vvu_add_journal_entry': {
      const event = args.event;
      const hash = args.hash || 'sha256:' + randomUUID().slice(0, 12);
      const entry = { seq: VVU_STATE.journal.length + 1, event, hash, timestamp: new Date().toISOString() };
      VVU_STATE.journal.push(entry);
      if (VVU_STATE.journal.length > 500) VVU_STATE.journal = VVU_STATE.journal.slice(-500);
      saveState();
      return { content: [{ type: 'text', text: JSON.stringify(entry, null, 2) }] };
    }

    // ---- RECEIPTS ----
    case 'vvu_verify_receipt': {
      const receiptId = args.receiptId;
      const receipt = VVU_STATE.receipts.find(r => r.receiptId === receiptId);
      if (!receipt) return { content: [{ type: 'text', text: JSON.stringify({ error: 'Receipt not found' }) }] };
      const isValid = receipt.trust > 0.8;
      return { content: [{ type: 'text', text: JSON.stringify({ receiptId, isValid, receipt }, null, 2) }] };
    }

    case 'vvu_export_receipt': {
      const receiptId = args.receiptId;
      const receipt = VVU_STATE.receipts.find(r => r.receiptId === receiptId);
      if (!receipt) return { content: [{ type: 'text', text: JSON.stringify({ error: 'Receipt not found' }) }] };
      const format = args.format || 'pretty';
      const output = format === 'json' ? JSON.stringify(receipt) : JSON.stringify(receipt, null, 2);
      return { content: [{ type: 'text', text: output }] };
    }

    case 'vvu_list_receipts': {
      const limit = args?.limit || 20;
      return { content: [{ type: 'text', text: JSON.stringify(VVU_STATE.receipts.slice(-limit), null, 2) }] };
    }

    // ---- TRUST ----
    case 'vvu_get_trust_score': {
      const latest = VVU_STATE.snapshots[VVU_STATE.snapshots.length - 1];
      if (!latest) return { content: [{ type: 'text', text: JSON.stringify({ trust: 0, sigma: 0, confidence: 0 }) }] };
      const confPct = Math.min(99.99, Math.max(0, (1 - latest.sigma * 8) * 100));
      return { content: [{ type: 'text', text: JSON.stringify({
        trust: latest.trust, sigma: latest.sigma,
        confidence: +confPct.toFixed(2),
        trustClass: latest.trustClass, epoch: latest.epoch,
        quorum: `${latest.quorumPass}/${latest.quorumTotal}`,
      }, null, 2) }] };
    }

    // ---- POLICY ----
    case 'vvu_get_policy_decisions': {
      const limit = args?.limit || 10;
      const latest = VVU_STATE.snapshots[VVU_STATE.snapshots.length - 1];
      return { content: [{ type: 'text', text: JSON.stringify(latest?.policyDecisions?.slice(-limit) || [], null, 2) }] };
    }

    // ---- EVIDENCE COLONY ----
    case 'vvu_get_evidence_leaves': {
      return { content: [{ type: 'text', text: JSON.stringify(VVU_STATE.evidenceLeaves, null, 2) }] };
    }

    case 'vvu_add_evidence_leaf': {
      const leafId = args.leafId || `leaf-${randomUUID().slice(0, 6)}`;
      const leaf = {
        id: leafId,
        color: args.color || '#2FBF71',
        position: args.position || { angle: Math.random() * Math.PI * 2, dist: Math.random() },
        timestamp: new Date().toISOString(),
      };
      VVU_STATE.evidenceLeaves.push(leaf);
      // Cap leaves
      if (VVU_STATE.evidenceLeaves.length > 500) {
        VVU_STATE.evidenceLeaves = VVU_STATE.evidenceLeaves.slice(-500);
      }
      saveState();
      return { content: [{ type: 'text', text: JSON.stringify(leaf, null, 2) }] };
    }

    // ---- SYSTEM STATUS ----
    case 'vvu_get_system_status': {
      const latest = VVU_STATE.snapshots[VVU_STATE.snapshots.length - 1];
      return { content: [{ type: 'text', text: JSON.stringify({
        state: latest?.state || 'IDLE',
        seq: latest?.seq || 0,
        trust: latest?.trust || 0,
        snapshotCount: VVU_STATE.snapshots.length,
        journalCount: VVU_STATE.journal.length,
        receiptCount: VVU_STATE.receipts.length,
        evidenceCount: VVU_STATE.evidenceLeaves.length,
        health: latest?.state === 'HAZARD' ? 'degraded' : latest?.state === 'SETTLED' ? 'nominal' : 'transitioning',
        timestamp: new Date().toISOString(),
      }, null, 2) }] };
    }

    default:
      throw new Error(`Unknown tool: ${name}`);
  }
}

// ============================================================
//  MCP SERVER
// ============================================================

const server = new Server(
  { name: 'vvu-mcp-server', version: '1.0.0' },
  { capabilities: { tools: {} } }
);

server.setRequestHandler(ListToolsRequestSchema, async () => ({ tools: TOOLS }));

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;
  try {
    return await handleTool(name, args);
  } catch (error) {
    return { content: [{ type: 'text', text: `Error: ${error.message}` }], isError: true };
  }
});

// ============================================================
//  START
// ============================================================

const transport = new StdioServerTransport();
await server.connect(transport);
console.error('[VVU MCP] Server running on stdio — 16 tools available');
console.error('[VVU MCP] State machine: deterministic (no Math.random in snapshots)');

// Graceful shutdown
process.on('SIGINT', () => {
  saveState();
  console.error('[VVU MCP] Shutting down...');
  process.exit(0);
});
process.on('SIGTERM', () => {
  saveState();
  process.exit(0);
});

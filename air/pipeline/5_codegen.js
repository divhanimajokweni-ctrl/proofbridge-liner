/**
 * Pass 5: Codegen — Decisions to Knowledge Graph + ADR + Exit Code
 *
 * Recompiles the Architecture Knowledge Graph, writes updated ADR markdown
 * records, and emits the final CI process exit code.
 *
 * Usage: node air/pipeline/5_codegen.js
 * Input: Decisions JSON from 4_govern.js (piped or from file)
 * Output: Exit code 0 (all PASS) or 1 (any BLOCKED)
 */

'use strict';

const fs = require('fs');
const path = require('path');

const GRAPH_PATH = path.join(__dirname, '..', 'graph', 'graph.json');
const ADR_DIR = path.join(__dirname, '..', 'adr');
const EVIDENCE_LOG = path.join(__dirname, '..', 'store', 'evidence_log.json');

/**
 * Read the evidence store for graph lineage references.
 */
function readEvidence() {
  if (!fs.existsSync(EVIDENCE_LOG)) return [];
  const content = fs.readFileSync(EVIDENCE_LOG, 'utf-8').trim();
  if (!content) return [];
  return content.split('\n').map(line => {
    try { return JSON.parse(line); } catch { return null; }
  }).filter(Boolean);
}

/**
 * Build the Knowledge Graph from inferences and decisions.
 */
function buildGraph(inferences, decisions) {
  const evidence = readEvidence();
  const nodes = [];
  const edges = [];

  // Evidence nodes
  for (const ev of evidence) {
    nodes.push({
      id: `ev-${ev.id}`,
      type: 'Evidence',
      evidenceId: ev.id,
      collector: ev.collector,
      status: ev.status,
    });
  }

  // Capability nodes (from inferences)
  for (const inf of inferences) {
    const capNodeId = `cap-${inf.capabilityId}`;
    if (!nodes.find(n => n.id === capNodeId)) {
      nodes.push({
        id: capNodeId,
        type: 'Capability',
        capabilityId: inf.capabilityId,
      });
    }

    // Link evidence to capability
    for (const evRef of inf.evidenceReferences) {
      edges.push({
        from: `ev-${evRef}`,
        to: capNodeId,
        type: 'VERIFIES',
      });
    }
  }

  // Rule nodes (from decisions)
  for (const dec of decisions) {
    const ruleNodeId = `rule-${dec.ruleId}`;
    if (!nodes.find(n => n.id === ruleNodeId)) {
      nodes.push({
        id: ruleNodeId,
        type: 'ConstitutionalRule',
        ruleId: dec.ruleId,
        description: dec.ruleDescription,
      });
    }

    // Link capabilities to rule
    for (const capId of dec.affectedCapabilities) {
      edges.push({
        from: `cap-${capId}`,
        to: ruleNodeId,
        type: 'SATISFIES',
      });
    }

    // Decision node
    const decNodeId = `dec-${dec.ruleId}-${Date.now()}`;
    nodes.push({
      id: decNodeId,
      type: 'Decision',
      ruleId: dec.ruleId,
      conclusion: dec.conclusion,
      reason: dec.reason,
      evaluatedAt: dec.evaluatedAt,
    });

    edges.push({
      from: ruleNodeId,
      to: decNodeId,
      type: 'CERTIFIES',
    });

    // Release gate edge
    if (dec.conclusion === 'PASS') {
      edges.push({
        from: decNodeId,
        to: 'release-gate',
        type: 'TRIGGERS',
      });
    }
  }

  // Release gate node
  const allPass = decisions.every(d => d.conclusion === 'PASS');
  nodes.push({
    id: 'release-gate',
    type: 'ReleaseGate',
    conclusion: allPass ? 'PASS' : 'BLOCKED',
    evaluatedAt: new Date().toISOString(),
  });

  return { nodes, edges, metadata: {
    generatedAt: new Date().toISOString(),
    nodeCount: nodes.length,
    edgeCount: edges.length,
  }};
}

/**
 * Generate ADR markdown for each governance decision.
 */
function generateADRs(decisions, inferences) {
  if (!fs.existsSync(ADR_DIR)) {
    fs.mkdirSync(ADR_DIR, { recursive: true });
  }

  const timestamp = new Date().toISOString().slice(0, 10);
  let adrIndex = 1;

  for (const dec of decisions) {
    const adrId = `ADR-${String(adrIndex).padStart(3, '0')}`;
    const filename = `${adrId}-air-${dec.ruleId.toLowerCase()}.md`;

    const relatedInferences = inferences.filter(inf =>
      dec.affectedCapabilities.includes(inf.capabilityId)
    );

    const evidenceRefs = relatedInferences.flatMap(inf => inf.evidenceReferences);

    const content = `---
id: ${adrId}
title: "AIR Governance: ${dec.ruleId}"
status: ${dec.conclusion === 'PASS' ? 'Accepted' : 'Rejected'}
date: "${timestamp}"
generated_by: AIR Pipeline (5_codegen)
---

# Context

The AIR governance engine evaluated capability state against the \`${dec.ruleId}\` constitutional rule module.

## Rule Description

${dec.ruleDescription || 'No description provided.'}

## Evaluation Result

- **Conclusion:** ${dec.conclusion}
- **Reason:** ${dec.reason || 'No reason provided.'}
- **Affected Capabilities:** ${dec.affectedCapabilities.join(', ') || 'None'}
- **Evidence References:** ${evidenceRefs.join(', ') || 'None'}

## Inference Summary

${relatedInferences.map(inf => `- \`${inf.capabilityId}\`: ${inf.conclusion} (confidence: ${inf.confidence})`).join('\n') || 'No related inferences.'}

# Decision

${dec.conclusion === 'PASS'
  ? 'The capability matrix satisfies all constitutional invariants for this rule. No release block.'
  : `The capability matrix fails to satisfy constitutional invariants for this rule. This is a release blocker.`}

# Consequences

${dec.conclusion === 'PASS'
  ? '- Release pipeline may proceed past this gate.\n- Knowledge Graph updated with CERTIFIES edge.'
  : '- Release pipeline is BLOCKED at this gate.\n- Issue must be resolved before deployment.\n- Knowledge Graph updated with BLOCKED decision node.'}
`;

    fs.writeFileSync(path.join(ADR_DIR, filename), content, 'utf-8');
    console.error(`[CODEGEN] Generated ${filename}`);
    adrIndex++;
  }
}

/**
 * Main codegen pass: build graph, generate ADRs, emit exit code.
 */
function codegen(inferences, decisions) {
  // Ensure directories exist
  const graphDir = path.dirname(GRAPH_PATH);
  if (!fs.existsSync(graphDir)) fs.mkdirSync(graphDir, { recursive: true });

  // Build and write Knowledge Graph
  const graph = buildGraph(inferences, decisions);
  fs.writeFileSync(GRAPH_PATH, JSON.stringify(graph, null, 2), 'utf-8');
  console.error(`[CODEGEN] Knowledge Graph: ${graph.metadata.nodeCount} nodes, ${graph.metadata.edgeCount} edges`);

  // Generate ADRs
  generateADRs(decisions, inferences);

  // Determine exit code
  const blockedRules = decisions.filter(d => d.conclusion !== 'PASS');
  const exitCode = blockedRules.length > 0 ? 1 : 0;

  if (blockedRules.length > 0) {
    console.error(`[CODEGEN] BLOCKED by ${blockedRules.length} rule(s):`);
    for (const r of blockedRules) {
      console.error(`[CODEGEN]   ❌ ${r.ruleId}: ${r.reason}`);
    }
  } else {
    console.error('[CODEGEN] ALL RULES PASSED — release gate open');
  }

  return { exitCode, graph, decisions };
}

if (require.main === module) {
  let inputData = '';

  if (process.argv[2]) {
    inputData = fs.readFileSync(process.argv[2], 'utf-8');
  } else {
    inputData = fs.readFileSync('/dev/stdin', 'utf-8');
  }

  try {
    const parsed = JSON.parse(inputData);

    // Accept either { inferences, decisions } or just decisions array
    let inferences, decisions;
    if (parsed.inferences && parsed.decisions) {
      inferences = parsed.inferences;
      decisions = parsed.decisions;
    } else if (Array.isArray(parsed) && parsed.length > 0 && parsed[0].ruleId) {
      decisions = parsed;
      inferences = [];
    } else {
      inferences = parsed;
      decisions = [];
    }

    const result = codegen(inferences, decisions);
    process.exit(result.exitCode);
  } catch (e) {
    console.error(`[CODEGEN] Failed to process input: ${e.message}`);
    process.exit(1);
  }
}

module.exports = { codegen, buildGraph, generateADRs };

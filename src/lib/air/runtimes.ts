// ──────────────────────────────────────────────────────────────────────────────
// VVU AIR v3.1.0 — Nine Runtimes Module
// Pure functions over data + store. No internal state.
// ──────────────────────────────────────────────────────────────────────────────

import * as data from './data';
import * as store from './store';

// ──────────────────────────────────────────────────────────────────────────────
// Types
// ──────────────────────────────────────────────────────────────────────────────

type Conclusion = 'PASS' | 'FAIL' | 'PENDING' | 'UNKNOWN';
type GateOutcome = 'PASS' | 'FAIL' | 'UNKNOWN';
type RFCStatus = 'Draft' | 'Review' | 'Approved' | 'Rejected' | 'Promoted';
type RuleEnabled = boolean;

interface Capability {
  id: string;
  name: string;
  description: string;
  evidenceCount: number;
  lastSeen: string;
  status: Conclusion;
  schema: Record<string, unknown>;
  evidenceFields: string[];
}

interface ConstitutionalRule {
  id: string;
  name: string;
  description: string;
  enabled: RuleEnabled;
  schema: string[];
  evidenceRequirements: string[];
  evaluatedAt?: string;
  lastConclusion?: Conclusion;
}

interface EvidenceEntry {
  id: string;
  collector: string;
  timestamp: string;
  artifact: string;
  digest: string;
  status: Conclusion;
  metadata: Record<string, unknown>;
}

interface InferenceIR {
  inferenceId: string;
  evidenceReferences: string[];
  capabilityId: string;
  conclusion: Conclusion;
  confidence: number;
  explainability: {
    contributors: Array<{
      factor: string;
      weight: number;
      satisfied: boolean;
      actual?: unknown;
      required?: unknown;
    }>;
  };
  derivedAt: string;
}

interface DecisionRecord {
  ruleId: string;
  conclusion: Conclusion;
  reason: string;
  affectedCapabilities: string[];
  evaluatedAt: string;
}

interface GraphNode {
  id: string;
  type: string;
  [key: string]: unknown;
}

interface GraphEdge {
  from: string;
  to: string;
  type: string;
}

interface GateResult {
  outcome: GateOutcome;
  exitCode: number;
  capability: string;
  evidenceCompleteness: number;
  ruleResults: Array<{
    ruleId: string;
    conclusion: Conclusion;
    reason: string;
  }>;
  timestamp: string;
}

interface ADR {
  id: string;
  title: string;
  status: string;
  date: string;
  generatedBy: string;
  context: string;
  ruleDescription: string;
  evaluationResult: {
    conclusion: string;
    reason: string;
    affectedCapabilities: string[];
    evidenceReferences: string[];
  };
  inferenceSummary: Record<string, { conclusion: string; confidence: number }>;
  decision: string;
  consequences: string[];
}

interface TelemetryBaseline {
  capabilityId: string;
  metricName: string;
  target: number;
  unit: string;
  setAt: string;
}

interface TelemetryReading {
  capabilityId: string;
  metricName: string;
  value: number;
  unit: string;
  readAt: string;
}

interface DriftEvent {
  id: string;
  capabilityId: string;
  metricName: string;
  baseline: number;
  reading: number;
  deviation: number;
  severity: 'info' | 'warn' | 'critical';
  detectedAt: string;
  resolved: boolean;
  resolvedAt?: string;
}

interface RFC {
  id: string;
  title: string;
  author: string;
  summary: string;
  status: RFCStatus;
  createdAt: string;
  updatedAt: string;
  changelog: string[];
}

interface ConstitutionVersion {
  version: string;
  bumpedAt: string;
  bumpedBy: string;
  rfcId?: string;
  changelog: string[];
  ruleCount: number;
}

interface GateHistoryEntry {
  id: string;
  outcome: GateOutcome;
  exitCode: number;
  runAt: string;
  capabilityCount: number;
  passCount: number;
  failCount: number;
  unknownCount: number;
}

interface EvidenceAuditRow {
  capabilityId: string;
  totalEvidence: number;
  passCount: number;
  failCount: number;
  pendingCount: number;
  collectors: string[];
  completeness: number;
  lastEvidenceAt: string;
}

// ──────────────────────────────────────────────────────────────────────────────
// Formatting Helpers
// ──────────────────────────────────────────────────────────────────────────────

const BOX = {
  tl: '\u250c',
  tr: '\u2510',
  bl: '\u2514',
  br: '\u2518',
  h: '\u2500',
  v: '\u2502',
  ml: '\u251c',
  mr: '\u2524',
  t: '\u252c',
  b: '\u2534',
  x: '\u253c',
};

function pad(str: string, width: number, align: 'left' | 'right' = 'left'): string {
  if (align === 'right') return str.padStart(width);
  return str.padEnd(width);
}

function truncate(str: string, maxWidth: number): string {
  if (str.length <= maxWidth) return str;
  return str.slice(0, maxWidth - 1) + '\u2026';
}

function boxLine(content: string, width: number): string {
  return `${BOX.v} ${pad(content, width - 4)} ${BOX.v}`;
}

function boxTop(width: number): string {
  return BOX.tl + BOX.h.repeat(width - 2) + BOX.tr;
}

function boxBottom(width: number): string {
  return BOX.bl + BOX.h.repeat(width - 2) + BOX.br;
}

function boxSeparator(width: number, left: string = BOX.ml, mid: string = BOX.x, right: string = BOX.mr): string {
  return left + BOX.h.repeat(width - 2) + right;
}

function conclusionIcon(c: Conclusion): string {
  switch (c) {
    case 'PASS': return '\u2714';
    case 'FAIL': return '\u2718';
    case 'PENDING': return '\u25cb';
    case 'UNKNOWN': return '?';
    default: return '-';
  }
}

function statusColor(s: string): string {
  return s;
}

function timestampShort(iso: string): string {
  try {
    const d = new Date(iso);
    return d.toISOString().replace('T', ' ').replace(/\.\d+Z$/, '');
  } catch {
    return iso;
  }
}

function durationSince(iso: string): string {
  try {
    const ms = Date.now() - new Date(iso).getTime();
    if (ms < 60_000) return `${Math.floor(ms / 1000)}s ago`;
    if (ms < 3_600_000) return `${Math.floor(ms / 60_000)}m ago`;
    if (ms < 86_400_000) return `${Math.floor(ms / 3_600_000)}h ago`;
    return `${Math.floor(ms / 86_400_000)}d ago`;
  } catch {
    return 'unknown';
  }
}

// ──────────────────────────────────────────────────────────────────────────────
// Rule Evidence Requirements Map
// ──────────────────────────────────────────────────────────────────────────────

export const RULE_EVIDENCE_REQUIREMENTS: Record<string, string[]> = {
  'adapter-boundary-integrity': [
    'governance_anchor_deployed',
    'zk_proof_verification',
    'source_analysis',
    'broadcast_receipt',
  ],
  'bayesian-calibration': [
    'calibration_dataset_size',
    'test_coverage',
    'aggregate_test_result',
  ],
  'hmac-domain-separation': [
    'webhook_hmac_key',
    'vct_hmac_key',
    'domain_separation_proof',
    'source_analysis',
  ],
  'normative-transition': [
    'capability_conclusion',
    'confidence_score',
    'normative_strength',
  ],
  'quorum-registry': [
    'distinct_collectors',
    'evidence_quorum',
    'contributor_count',
  ],
  'trust-boundary-integrity': [
    'tee_attestation',
    'confidence_threshold',
    'hardware_verification',
    'source_analysis',
    'test_coverage',
  ],
};

// ──────────────────────────────────────────────────────────────────────────────
// 1. CapabilityRuntime
// ──────────────────────────────────────────────────────────────────────────────

export const CapabilityRuntime = {
  list(): string {
    const capabilities = data.getCapabilities();
    const width = 72;

    const lines: string[] = [];
    lines.push(boxTop(width));
    lines.push(boxLine(`CAPABILITY REGISTRY  (${capabilities.length} capabilities)`, width));
    lines.push(boxSeparator(width, BOX.ml, BOX.t, BOX.mr));
    lines.push(boxLine(
      `${pad('ID', 28)} ${pad('STATUS', 10)} ${pad('EVIDENCE', 10)} ${pad('LAST SEEN', 20)}`,
      width,
    ));
    lines.push(boxSeparator(width));

    for (const cap of capabilities) {
      const icon = conclusionIcon(cap.status);
      lines.push(boxLine(
        `${pad(cap.id, 28)} ${pad(`${icon} ${cap.status}`, 10)} ${pad(String(cap.evidenceCount), 10)} ${pad(durationSince(cap.lastSeen), 20)}`,
        width,
      ));
    }

    lines.push(boxBottom(width));
    return lines.join('\n');
  },

  show(id: string): string {
    const cap = data.getCapability(id);
    if (!cap) return `Capability not found: ${id}`;

    const width = 72;
    const lines: string[] = [];
    lines.push(boxTop(width));
    lines.push(boxLine(`CAPABILITY: ${cap.id}`, width));
    lines.push(boxSeparator(width));
    lines.push(boxLine(`Status:        ${conclusionIcon(cap.status)} ${cap.status}`, width));
    lines.push(boxLine(`Name:          ${cap.name}`, width));
    lines.push(boxLine(`Description:   ${truncate(cap.description, 50)}`, width));
    lines.push(boxLine(`Evidence:      ${cap.evidenceCount} records`, width));
    lines.push(boxLine(`Last Seen:     ${timestampShort(cap.lastSeen)}`, width));
    lines.push(boxSeparator(width));
    lines.push(boxLine('EVIDENCE FIELDS:', width));

    for (const field of cap.evidenceFields) {
      lines.push(boxLine(`  \u2022 ${field}`, width));
    }

    lines.push(boxSeparator(width));
    lines.push(boxLine('SCHEMA:', width));
    const schemaStr = JSON.stringify(cap.schema, null, 2);
    for (const line of schemaStr.split('\n').slice(0, 8)) {
      lines.push(boxLine(`  ${truncate(line, 56)}`, width));
    }

    lines.push(boxBottom(width));
    return lines.join('\n');
  },

  validate(id: string): string {
    const cap = data.getCapability(id);
    if (!cap) return `Capability not found: ${id}`;

    const errors: string[] = [];
    if (!cap.id || typeof cap.id !== 'string') errors.push('Missing or invalid id');
    if (!cap.name || typeof cap.name !== 'string') errors.push('Missing or invalid name');
    if (!cap.description) errors.push('Missing description');
    if (typeof cap.evidenceCount !== 'number' || cap.evidenceCount < 0) errors.push('Invalid evidenceCount');
    if (!cap.lastSeen) errors.push('Missing lastSeen timestamp');
    if (!['PASS', 'FAIL', 'PENDING', 'UNKNOWN'].includes(cap.status)) errors.push(`Invalid status: ${cap.status}`);
    if (!Array.isArray(cap.evidenceFields)) errors.push('Missing evidenceFields array');
    if (!cap.schema || typeof cap.schema !== 'object') errors.push('Missing or invalid schema');

    const width = 60;
    const lines: string[] = [];
    lines.push(boxTop(width));
    lines.push(boxLine(`SCHEMA VALIDATION: ${cap.id}`, width));
    lines.push(boxSeparator(width));

    if (errors.length === 0) {
      lines.push(boxLine('  \u2714 All fields valid', width));
      lines.push(boxLine(`  Fields: ${cap.evidenceFields.length} evidence fields`, width));
      lines.push(boxLine(`  Schema: ${Object.keys(cap.schema).length} properties`, width));
    } else {
      for (const err of errors) {
        lines.push(boxLine(`  \u2718 ${err}`, width));
      }
    }

    lines.push(boxSeparator(width));
    lines.push(boxLine(`Result: ${errors.length === 0 ? 'VALID' : `${errors.length} error(s)`}`, width));
    lines.push(boxBottom(width));
    return lines.join('\n');
  },
};

// ──────────────────────────────────────────────────────────────────────────────
// 2. ConstitutionRuntime
// ──────────────────────────────────────────────────────────────────────────────

export const ConstitutionRuntime = {
  list(): string {
    const rules = data.getRules();
    const width = 78;

    const lines: string[] = [];
    lines.push(boxTop(width));
    lines.push(boxLine(`CONSTITUTIONAL RULES  (${rules.length} rules)`, width));
    lines.push(boxSeparator(width, BOX.ml, BOX.t, BOX.mr));
    lines.push(boxLine(
      `${pad('ID', 30)} ${pad('ENABLED', 10)} ${pad('LAST', 10)} ${pad('DESCRIPTION', 24)}`,
      width,
    ));
    lines.push(boxSeparator(width));

    for (const rule of rules) {
      const en = rule.enabled ? '\u25cf ON ' : '\u25cb OFF';
      const last = rule.lastConclusion ? conclusionIcon(rule.lastConclusion) : '-';
      lines.push(boxLine(
        `${pad(rule.id, 30)} ${pad(en, 10)} ${pad(last, 10)} ${pad(truncate(rule.description, 24), 24)}`,
        width,
      ));
    }

    lines.push(boxBottom(width));
    return lines.join('\n');
  },

  run(): string {
    const rules = data.getRules().filter(r => r.enabled);
    const capabilities = data.getCapabilities();
    const width = 90;

    const colWidth = Math.max(16, Math.floor((width - 4) / Math.max(capabilities.length, 1)));
    const lines: string[] = [];

    lines.push(boxTop(width));
    lines.push(boxLine('CONSTITUTIONAL EVALUATION MATRIX', width));
    lines.push(boxSeparator(width, BOX.ml, BOX.t, BOX.mr));
    lines.push(boxLine(`Rules: ${rules.length} enabled | Capabilities: ${capabilities.length}`, width));
    lines.push(boxSeparator(width));

    // Header row
    const headerParts: string[] = [''];
    for (const cap of capabilities) {
      headerParts.push(pad(truncate(cap.id, colWidth - 2), colWidth));
    }
    lines.push(boxLine(headerParts.join(''), width));
    lines.push(boxSeparator(width));

    let passAll = 0;
    let failAny = 0;

    for (const rule of rules) {
      const parts: string[] = [pad(truncate(rule.id, 28), 28)];
      for (const cap of capabilities) {
        const result = data.evaluateRule(rule.id, cap.id);
        const icon = conclusionIcon(result.conclusion);
        if (result.conclusion === 'PASS') passAll++;
        else failAny++;
        parts.push(pad(`${icon}`, colWidth));
      }
      lines.push(boxLine(parts.join(''), width));
    }

    lines.push(boxSeparator(width));
    lines.push(boxLine(`PASS: ${passAll} | FAIL: ${failAny} | Total cells: ${rules.length * capabilities.length}`, width));
    lines.push(boxBottom(width));
    return lines.join('\n');
  },

  explain(rule: string): string {
    const ruleData = data.getRule(rule);
    if (!ruleData) return `Rule not found: ${rule}`;

    const requirements = RULE_EVIDENCE_REQUIREMENTS[rule] || [];
    const width = 72;

    const lines: string[] = [];
    lines.push(boxTop(width));
    lines.push(boxLine(`RULE: ${ruleData.id}`, width));
    lines.push(boxSeparator(width));
    lines.push(boxLine(`Description:    ${truncate(ruleData.description, 52)}`, width));
    lines.push(boxLine(`Enabled:        ${ruleData.enabled ? 'YES' : 'NO'}`, width));
    lines.push(boxLine(`Last Evaluated: ${ruleData.evaluatedAt ? timestampShort(ruleData.evaluatedAt) : 'never'}`, width));
    lines.push(boxLine(`Last Result:    ${ruleData.lastConclusion ? conclusionIcon(ruleData.lastConclusion) + ' ' + ruleData.lastConclusion : 'N/A'}`, width));
    lines.push(boxSeparator(width));
    lines.push(boxLine('EVIDENCE REQUIREMENTS:', width));

    for (const req of requirements) {
      lines.push(boxLine(`  \u2022 ${req}`, width));
    }

    lines.push(boxSeparator(width));
    lines.push(boxLine('SCHEMA:', width));

    for (const field of ruleData.schema) {
      lines.push(boxLine(`  \u2022 ${field}`, width));
    }

    lines.push(boxBottom(width));
    return lines.join('\n');
  },

  enable(rule: string): string {
    const success = store.toggleRule(rule, true);
    if (!success) return `Rule not found: ${rule}`;
    return `Rule enabled: ${rule}`;
  },

  disable(rule: string): string {
    const success = store.toggleRule(rule, false);
    if (!success) return `Rule not found: ${rule}`;
    return `Rule disabled: ${rule}`;
  },

  test(rule: string): string {
    const ruleData = data.getRule(rule);
    if (!ruleData) return `Rule not found: ${rule}`;

    const capabilities = data.getCapabilities();
    const width = 72;

    const lines: string[] = [];
    lines.push(boxTop(width));
    lines.push(boxLine(`RULE TEST: ${rule}`, width));
    lines.push(boxSeparator(width));

    let passCount = 0;
    let failCount = 0;

    for (const cap of capabilities) {
      const result = data.evaluateRule(rule, cap.id);
      const icon = conclusionIcon(result.conclusion);
      lines.push(boxLine(
        `  ${icon} ${pad(cap.id, 24)} ${pad(result.conclusion, 8)} ${truncate(result.reason, 30)}`,
        width,
      ));
      if (result.conclusion === 'PASS') passCount++;
      else failCount++;
    }

    lines.push(boxSeparator(width));
    lines.push(boxLine(`Results: ${passCount} PASS, ${failCount} FAIL out of ${capabilities.length} capabilities`, width));
    lines.push(boxBottom(width));
    return lines.join('\n');
  },
};

// ──────────────────────────────────────────────────────────────────────────────
// 3. EvidenceRuntime
// ──────────────────────────────────────────────────────────────────────────────

export const EvidenceRuntime = {
  list(): string {
    const audit = data.getEvidenceAudit();
    const width = 90;

    const lines: string[] = [];
    lines.push(boxTop(width));
    lines.push(boxLine('EVIDENCE AUDIT TABLE', width));
    lines.push(boxSeparator(width, BOX.ml, BOX.t, BOX.mr));
    lines.push(boxLine(
      `${pad('CAPABILITY', 24)} ${pad('TOTAL', 7)} ${pad('PASS', 7)} ${pad('FAIL', 7)} ${pad('PEND', 7)} ${pad('COMPL%', 8)} ${pad('COLLECTORS', 25)}`,
      width,
    ));
    lines.push(boxSeparator(width));

    for (const row of audit) {
      lines.push(boxLine(
        `${pad(row.capabilityId, 24)} ${pad(String(row.totalEvidence), 7)} ${pad(String(row.passCount), 7)} ${pad(String(row.failCount), 7)} ${pad(String(row.pendingCount), 7)} ${pad(row.completeness.toFixed(1) + '%', 8)} ${pad(truncate(row.collectors.join(', '), 25), 25)}`,
        width,
      ));
    }

    lines.push(boxBottom(width));
    return lines.join('\n');
  },

  verify(capId: string): string {
    const cap = data.getCapability(capId);
    if (!cap) return `Capability not found: ${capId}`;

    const evidence = data.getEvidenceForCapability(capId);
    const requirements = RULE_EVIDENCE_REQUIREMENTS as Record<string, string[]>;
    const allRequired: string[] = [];

    for (const [, reqs] of Object.entries(requirements)) {
      for (const r of reqs) {
        if (!allRequired.includes(r)) allRequired.push(r);
      }
    }

    const present = new Set(evidence.map(e => e.metadata?.collectorType || e.collector));
    const missing = allRequired.filter(r => !present.has(r));

    const width = 72;
    const lines: string[] = [];
    lines.push(boxTop(width));
    lines.push(boxLine(`EVIDENCE VERIFICATION: ${capId}`, width));
    lines.push(boxSeparator(width));
    lines.push(boxLine(`Total evidence records: ${evidence.length}`, width));
    lines.push(boxLine(`Unique collectors:      ${present.size}`, width));
    lines.push(boxLine(`Required fields:        ${allRequired.length}`, width));
    lines.push(boxSeparator(width));

    if (missing.length === 0) {
      lines.push(boxLine('  \u2714 All evidence fields satisfied', width));
    } else {
      lines.push(boxLine('  MISSING EVIDENCE:', width));
      for (const m of missing) {
        lines.push(boxLine(`    \u2718 ${m}`, width));
      }
    }

    lines.push(boxSeparator(width));
    const complete = missing.length === 0;
    lines.push(boxLine(`Verification: ${complete ? '\u2714 COMPLETE' : `\u2718 ${missing.length} field(s) missing`}`, width));
    lines.push(boxBottom(width));
    return lines.join('\n');
  },

  attach(capId: string, field: string, value: string): string {
    const success = store.attachEvidence(capId, field, value);
    if (!success) return `Failed to attach evidence: capability ${capId} not found`;
    return `Evidence attached: ${capId}.${field} = ${value}`;
  },

  detach(capId: string, field: string): string {
    const success = store.detachEvidence(capId, field);
    if (!success) return `Failed to detach evidence: ${capId}.${field} not found`;
    return `Evidence detached: ${capId}.${field}`;
  },

  fields(): string {
    const allFields = new Set<string>();
    const requirements = RULE_EVIDENCE_REQUIREMENTS;

    for (const [, reqs] of Object.entries(requirements)) {
      for (const r of reqs) allFields.add(r);
    }

    const fields = Array.from(allFields).sort();
    const width = 48;

    const lines: string[] = [];
    lines.push(boxTop(width));
    lines.push(boxLine(`EVIDENCE FIELDS  (${fields.length})`, width));
    lines.push(boxSeparator(width));

    for (const f of fields) {
      const usedBy = Object.entries(requirements)
        .filter(([, reqs]) => reqs.includes(f))
        .map(([ruleId]) => ruleId);
      lines.push(boxLine(`  \u2022 ${f}`, width));
      lines.push(boxLine(`    Used by: ${truncate(usedBy.join(', '), 36)}`, width));
    }

    lines.push(boxBottom(width));
    return lines.join('\n');
  },

  missing(): string {
    const audit = data.getEvidenceAudit();
    const incomplete = audit.filter(a => a.completeness < 100);
    const width = 72;

    const lines: string[] = [];
    lines.push(boxTop(width));
    lines.push(boxLine(`MISSING EVIDENCE  (${incomplete.length} capabilities incomplete)`, width));
    lines.push(boxSeparator(width));

    if (incomplete.length === 0) {
      lines.push(boxLine('  \u2714 All capabilities have complete evidence', width));
    } else {
      for (const row of incomplete) {
        lines.push(boxLine(
          `  \u2718 ${pad(row.capabilityId, 22)} completeness: ${row.completeness.toFixed(1)}%`,
          width,
        ));
        lines.push(boxLine(
          `    Evidence: ${row.passCount}P / ${row.failCount}F / ${row.pendingCount}Pnd of ${row.totalEvidence}`,
          width,
        ));
      }
    }

    lines.push(boxBottom(width));
    return lines.join('\n');
  },

  audit(): string {
    const audit = data.getEvidenceAudit();
    const totalEvidence = audit.reduce((sum, a) => sum + a.totalEvidence, 0);
    const totalPass = audit.reduce((sum, a) => sum + a.passCount, 0);
    const totalFail = audit.reduce((sum, a) => sum + a.failCount, 0);
    const totalPend = audit.reduce((sum, a) => sum + a.pendingCount, 0);
    const avgCompleteness = audit.length > 0
      ? audit.reduce((sum, a) => sum + a.completeness, 0) / audit.length
      : 0;

    const width = 72;
    const lines: string[] = [];
    lines.push(boxTop(width));
    lines.push(boxLine('FULL EVIDENCE AUDIT REPORT', width));
    lines.push(boxSeparator(width, BOX.ml, BOX.t, BOX.mr));
    lines.push(boxLine(`Total Capabilities:   ${audit.length}`, width));
    lines.push(boxLine(`Total Evidence:       ${totalEvidence}`, width));
    lines.push(boxLine(`  PASS:               ${totalPass}`, width));
    lines.push(boxLine(`  FAIL:               ${totalFail}`, width));
    lines.push(boxLine(`  PENDING:            ${totalPend}`, width));
    lines.push(boxLine(`Avg Completeness:     ${avgCompleteness.toFixed(1)}%`, width));
    lines.push(boxSeparator(width));

    for (const row of audit) {
      const icon = row.completeness === 100 ? '\u2714' : '\u2718';
      lines.push(boxLine(
        `  ${icon} ${pad(row.capabilityId, 24)} ${row.completeness.toFixed(1).padStart(6)}%  [${row.passCount}P/${row.failCount}F/${row.pendingCount}Nd]`,
        width,
      ));
    }

    lines.push(boxSeparator(width));
    const complete = audit.filter(a => a.completeness === 100).length;
    lines.push(boxLine(`Completeness: ${complete}/${audit.length} capabilities fully evidenced`, width));
    lines.push(boxBottom(width));
    return lines.join('\n');
  },
};

// ──────────────────────────────────────────────────────────────────────────────
// 4. DecisionRuntime (Constitutional Gate)
// ──────────────────────────────────────────────────────────────────────────────

export const DecisionRuntime = {
  run(): string {
    const capabilities = data.getCapabilities();
    const rules = data.getRules().filter(r => r.enabled);
    const width = 84;

    const results: GateResult[] = [];
    const lines: string[] = [];

    lines.push(boxTop(width));
    lines.push(boxLine('CONSTITUTIONAL GATE', width));
    lines.push(boxSeparator(width, BOX.ml, BOX.t, BOX.mr));
    lines.push(boxLine('Pipeline: Capability \u2192 Evidence \u2192 Constitution \u2192 Decision', width));
    lines.push(boxSeparator(width));

    let overallOutcome: GateOutcome = 'PASS';
    let passCount = 0;
    let failCount = 0;
    let unknownCount = 0;

    for (const cap of capabilities) {
      const evidenceComplete = EvidenceRuntime.verify(cap.id).includes('COMPLETE');
      const ruleResults: GateResult['ruleResults'] = [];

      for (const rule of rules) {
        const decision = data.evaluateRule(rule.id, cap.id);
        ruleResults.push({
          ruleId: rule.id,
          conclusion: decision.conclusion,
          reason: decision.reason,
        });
      }

      const hasFail = ruleResults.some(r => r.conclusion === 'FAIL');
      const hasPass = ruleResults.some(r => r.conclusion === 'PASS');
      let outcome: GateOutcome = 'UNKNOWN';
      if (hasFail) outcome = 'FAIL';
      else if (hasPass && evidenceComplete) outcome = 'PASS';

      const exitCode = outcome === 'PASS' ? 0 : outcome === 'FAIL' ? 1 : 2;
      if (outcome === 'PASS') passCount++;
      else if (outcome === 'FAIL') failCount++;
      else unknownCount++;

      if (outcome === 'FAIL') overallOutcome = 'FAIL';
      else if (outcome === 'UNKNOWN' && overallOutcome !== 'FAIL') overallOutcome = 'UNKNOWN';

      results.push({
        outcome,
        exitCode,
        capability: cap.id,
        evidenceCompleteness: evidenceComplete ? 100 : 0,
        ruleResults,
        timestamp: new Date().toISOString(),
      });

      const icon = outcome === 'PASS' ? '\u2714' : outcome === 'FAIL' ? '\u2718' : '?';
      lines.push(boxLine(
        `  ${icon} ${pad(cap.id, 28)} ${pad(outcome, 8)} exit=${exitCode}`,
        width,
      ));

      for (const rr of ruleResults) {
        const rIcon = conclusionIcon(rr.conclusion);
        lines.push(boxLine(
          `      ${rIcon} ${pad(rr.ruleId, 30)} ${rr.conclusion}`,
          width,
        ));
      }
    }

    const overallExitCode = overallOutcome === 'PASS' ? 0 : overallOutcome === 'FAIL' ? 1 : 2;
    lines.push(boxSeparator(width));
    lines.push(boxLine(`OVERALL: ${overallOutcome} (exit=${overallExitCode}) | PASS: ${passCount} FAIL: ${failCount} UNKNOWN: ${unknownCount}`, width));
    lines.push(boxBottom(width));

    store.recordGateRun({
      outcome: overallOutcome,
      exitCode: overallExitCode,
      capabilityCount: capabilities.length,
      passCount,
      failCount,
      unknownCount,
    });

    return lines.join('\n');
  },

  explain(): string {
    const capabilities = data.getCapabilities();
    const rules = data.getRules().filter(r => r.enabled);
    const width = 84;

    const lines: string[] = [];
    lines.push(boxTop(width));
    lines.push(boxLine('GATE EXPLANATION (per-capability, rule-level detail)', width));
    lines.push(boxSeparator(width, BOX.ml, BOX.t, BOX.mr));

    for (const cap of capabilities) {
      lines.push(boxLine(`CAPABILITY: ${cap.id}`, width));
      lines.push(boxSeparator(width, BOX.ml, BOX.x, BOX.mr));

      const evidence = data.getEvidenceForCapability(cap.id);
      lines.push(boxLine(`  Evidence records: ${evidence.length}`, width));
      lines.push(boxLine(`  Evidence status breakdown:`, width));

      const byCollector: Record<string, { pass: number; fail: number; pending: number }> = {};
      for (const e of evidence) {
        if (!byCollector[e.collector]) byCollector[e.collector] = { pass: 0, fail: 0, pending: 0 };
        if (e.status === 'PASS') byCollector[e.collector].pass++;
        else if (e.status === 'FAIL') byCollector[e.collector].fail++;
        else byCollector[e.collector].pending++;
      }

      for (const [collector, counts] of Object.entries(byCollector)) {
        lines.push(boxLine(
          `    ${pad(collector, 20)} P:${counts.pass} F:${counts.fail} Nd:${counts.pending}`,
          width,
        ));
      }

      lines.push(boxSeparator(width, BOX.ml, BOX.x, BOX.mr));
      lines.push(boxLine('  RULE EVALUATIONS:', width));

      for (const rule of rules) {
        const decision = data.evaluateRule(rule.id, cap.id);
        const icon = conclusionIcon(decision.conclusion);
        lines.push(boxLine(`    ${icon} ${pad(rule.id, 30)} ${decision.conclusion}`, width));
        lines.push(boxLine(`      ${truncate(decision.reason, 68)}`, width));
      }

      lines.push(boxSeparator(width));
    }

    lines.push(boxBottom(width));
    return lines.join('\n');
  },

  json(): string {
    const capabilities = data.getCapabilities();
    const rules = data.getRules().filter(r => r.enabled);

    const gateResults: Record<string, unknown>[] = [];

    for (const cap of capabilities) {
      const ruleResults: Record<string, unknown>[] = [];
      for (const rule of rules) {
        const decision = data.evaluateRule(rule.id, cap.id);
        ruleResults.push({
          ruleId: rule.id,
          conclusion: decision.conclusion,
          reason: decision.reason,
        });
      }

      gateResults.push({
        capability: cap.id,
        ruleResults,
        evaluatedAt: new Date().toISOString(),
      });
    }

    const output = {
      version: 'VVU-IR/3.1.0',
      gateType: 'constitutional',
      evaluatedAt: new Date().toISOString(),
      capabilities: gateResults,
      summary: {
        total: capabilities.length,
        rules: rules.length,
      },
    };

    return JSON.stringify(output, null, 2);
  },

  html(): string {
    const capabilities = data.getCapabilities();
    const rules = data.getRules().filter(r => r.enabled);
    const timestamp = new Date().toISOString();

    let html = '<!DOCTYPE html>\n<html lang="en">\n<head>\n';
    html += '<meta charset="UTF-8">\n';
    html += '<title>VVU AIR Constitutional Gate Report</title>\n';
    html += '<style>\n';
    html += 'body { font-family: monospace; background: #1a1a2e; color: #e0e0e0; padding: 2rem; }\n';
    html += 'h1 { color: #00d4ff; border-bottom: 2px solid #00d4ff; padding-bottom: 0.5rem; }\n';
    html += 'h2 { color: #7b68ee; }\n';
    html += 'table { border-collapse: collapse; width: 100%; margin: 1rem 0; }\n';
    html += 'th, td { border: 1px solid #333; padding: 0.5rem 1rem; text-align: left; }\n';
    html += 'th { background: #16213e; color: #00d4ff; }\n';
    html += 'td { background: #0f3460; }\n';
    html += '.pass { color: #00ff88; font-weight: bold; }\n';
    html += '.fail { color: #ff4444; font-weight: bold; }\n';
    html += '.unknown { color: #ffaa00; font-weight: bold; }\n';
    html += '.summary { font-size: 1.2rem; padding: 1rem; background: #16213e; border-radius: 4px; margin: 1rem 0; }\n';
    html += '</style>\n</head>\n<body>\n';
    html += `<h1>VVU AIR Constitutional Gate Report</h1>\n`;
    html += `<p>Generated: ${timestamp}</p>\n`;
    html += `<div class="summary">Capabilities: ${capabilities.length} | Rules: ${rules.length}</div>\n`;

    for (const cap of capabilities) {
      html += `<h2>${cap.id}</h2>\n`;
      html += '<table>\n<tr><th>Rule</th><th>Conclusion</th><th>Reason</th></tr>\n';
      for (const rule of rules) {
        const decision = data.evaluateRule(rule.id, cap.id);
        const cls = decision.conclusion === 'PASS' ? 'pass' : decision.conclusion === 'FAIL' ? 'fail' : 'unknown';
        html += `<tr><td>${rule.id}</td><td class="${cls}">${decision.conclusion}</td><td>${decision.reason}</td></tr>\n`;
      }
      html += '</table>\n';
    }

    html += '</body>\n</html>';

    const filePath = `/tmp/air-gate-report-${Date.now()}.html`;
    store.writeFile(filePath, html);
    return `HTML report saved to: ${filePath}`;
  },

  history(): string {
    const history = store.getGateHistory();
    const width = 80;

    const lines: string[] = [];
    lines.push(boxTop(width));
    lines.push(boxLine(`GATE RUN HISTORY  (${history.length} runs)`, width));
    lines.push(boxSeparator(width, BOX.ml, BOX.t, BOX.mr));
    lines.push(boxLine(
      `${pad('TIMESTAMP', 22)} ${pad('OUTCOME', 10)} ${pad('EXIT', 6)} ${pad('CAPS', 6)} ${pad('PASS', 6)} ${pad('FAIL', 6)} ${pad('UNK', 6)}`,
      width,
    ));
    lines.push(boxSeparator(width));

    const recent = history.slice(-20).reverse();
    for (const entry of recent) {
      const icon = entry.outcome === 'PASS' ? '\u2714' : entry.outcome === 'FAIL' ? '\u2718' : '?';
      lines.push(boxLine(
        `${pad(timestampShort(entry.runAt), 22)} ${pad(`${icon} ${entry.outcome}`, 10)} ${pad(String(entry.exitCode), 6)} ${pad(String(entry.capabilityCount), 6)} ${pad(String(entry.passCount), 6)} ${pad(String(entry.failCount), 6)} ${pad(String(entry.unknownCount), 6)}`,
        width,
      ));
    }

    if (history.length === 0) {
      lines.push(boxLine('  No gate runs recorded', width));
    }

    lines.push(boxBottom(width));
    return lines.join('\n');
  },
};

// ──────────────────────────────────────────────────────────────────────────────
// 5. KnowledgeRuntime (Graph)
// ──────────────────────────────────────────────────────────────────────────────

export const KnowledgeRuntime = {
  stats(): string {
    const graph = data.getGraph();
    const nodeTypes: Record<string, number> = {};
    const edgeTypes: Record<string, number> = {};

    for (const node of graph.nodes) {
      nodeTypes[node.type] = (nodeTypes[node.type] || 0) + 1;
    }
    for (const edge of graph.edges) {
      edgeTypes[edge.type] = (edgeTypes[edge.type] || 0) + 1;
    }

    const width = 56;

    const lines: string[] = [];
    lines.push(boxTop(width));
    lines.push(boxLine('KNOWLEDGE GRAPH STATS', width));
    lines.push(boxSeparator(width, BOX.ml, BOX.t, BOX.mr));
    lines.push(boxLine(`Total Nodes: ${graph.nodes.length}`, width));
    lines.push(boxLine(`Total Edges: ${graph.edges.length}`, width));
    lines.push(boxSeparator(width));
    lines.push(boxLine('NODE TYPES:', width));

    for (const [type, count] of Object.entries(nodeTypes).sort((a, b) => b[1] - a[1])) {
      lines.push(boxLine(`  ${pad(type, 28)} ${String(count).padStart(4)}`, width));
    }

    lines.push(boxSeparator(width));
    lines.push(boxLine('EDGE TYPES:', width));

    for (const [type, count] of Object.entries(edgeTypes).sort((a, b) => b[1] - a[1])) {
      lines.push(boxLine(`  ${pad(type, 28)} ${String(count).padStart(4)}`, width));
    }

    if (graph.metadata) {
      lines.push(boxSeparator(width));
      lines.push(boxLine(`Generated: ${timestampShort(graph.metadata.generatedAt)}`, width));
    }

    lines.push(boxBottom(width));
    return lines.join('\n');
  },

  export(): string {
    const graph = data.getGraph();
    return JSON.stringify(graph, null, 2);
  },

  explain(): string {
    const graph = data.getGraph();
    const width = 78;

    const capNodes = graph.nodes.filter(n => n.type === 'Capability');
    const ruleNodes = graph.nodes.filter(n => n.type === 'ConstitutionalRule');
    const evidenceNodes = graph.nodes.filter(n => n.type === 'Evidence');
    const decisionNodes = graph.nodes.filter(n => n.type === 'Decision');
    const gateNode = graph.nodes.find(n => n.type === 'ReleaseGate');

    const verifiesEdges = graph.edges.filter(e => e.type === 'VERIFIES');
    const satisfiesEdges = graph.edges.filter(e => e.type === 'SATISFIES');
    const certifiesEdges = graph.edges.filter(e => e.type === 'CERTIFIES');
    const triggersEdges = graph.edges.filter(e => e.type === 'TRIGGERS');

    const lines: string[] = [];
    lines.push(boxTop(width));
    lines.push(boxLine('KNOWLEDGE GRAPH EXPLANATION', width));
    lines.push(boxSeparator(width, BOX.ml, BOX.t, BOX.mr));
    lines.push(boxLine('The VVU AIR Knowledge Graph is a causal lineage network', width));
    lines.push(boxLine('mapping evidence observations to business release decisions.', width));
    lines.push(boxSeparator(width));
    lines.push(boxLine('STRUCTURE:', width));
    lines.push(boxLine(`  Evidence nodes:       ${evidenceNodes.length} (Layer 2: standardized observation records)`, width));
    lines.push(boxLine(`  Capability nodes:     ${capNodes.length} (Layer 3: compiled capability state)`, width));
    lines.push(boxLine(`  Rule nodes:           ${ruleNodes.length} (Layer 4: constitutional rule definitions)`, width));
    lines.push(boxLine(`  Decision nodes:       ${decisionNodes.length} (Layer 5: governance rule judgements)`, width));
    lines.push(boxLine(`  Release gate node:    ${gateNode ? '1 (BLOCKED)' : '0'}`, width));
    lines.push(boxSeparator(width));
    lines.push(boxLine('CAUSAL EDGES:', width));
    lines.push(boxLine(`  VERIFIES:     ${verifiesEdges.length}  Evidence \u2192 Capability`, width));
    lines.push(boxLine(`  SATISFIES:    ${satisfiesEdges.length}  Capability \u2192 ConstitutionalRule`, width));
    lines.push(boxLine(`  CERTIFIES:    ${certifiesEdges.length}  ConstitutionalRule \u2192 Decision`, width));
    lines.push(boxLine(`  TRIGGERS:     ${triggersEdges.length}  Decision \u2192 ReleaseGate`, width));
    lines.push(boxSeparator(width));
    lines.push(boxLine('LINEAGE CHAIN:', width));
    lines.push(boxLine('  Observation \u2192 Evidence \u2192 Capability \u2192 Rule \u2192 Decision \u2192 Gate', width));
    lines.push(boxSeparator(width));
    lines.push(boxLine('Every graph node is traceable to append-only evidence store records.', width));
    lines.push(boxLine('Replaying the evidence store from genesis reproduces this graph.', width));
    lines.push(boxBottom(width));
    return lines.join('\n');
  },

  query(sql: string): string {
    const graph = data.getGraph();
    const width = 80;

    const match = sql.match(/^SHOW\s+(.+?)(?:\s+WHERE\s+(.+))?$/i);
    if (!match) return `Invalid query syntax. Expected: SHOW <type> [WHERE <field> = <value>]`;

    const nodeType = match[1].trim();
    const whereClause = match[2]?.trim();

    let filters: Array<{ field: string; value: string }> = [];
    if (whereClause) {
      const parts = whereClause.split(/\s*=\s*/);
      if (parts.length === 2) {
        filters.push({ field: parts[0].trim(), value: parts[1].trim().replace(/^["']|["']$/g, '') });
      }
    }

    let nodes: GraphNode[];
    if (nodeType === 'EDGE') {
      // Handle edge queries
      const edges = graph.edges.filter(e => {
        for (const f of filters) {
          if (f.field === 'type' && e.type !== f.value) return false;
        }
        return true;
      });

      const lines: string[] = [];
      lines.push(boxTop(width));
      lines.push(boxLine(`QUERY: ${sql}`, width));
      lines.push(boxSeparator(width));
      lines.push(boxLine(`Results: ${edges.length} edges`, width));
      lines.push(boxSeparator(width));
      lines.push(boxLine(`${pad('FROM', 30)} ${pad('TO', 30)} ${pad('TYPE', 16)}`, width));
      lines.push(boxSeparator(width));

      for (const e of edges.slice(0, 50)) {
        lines.push(boxLine(`${pad(truncate(e.from, 30), 30)} ${pad(truncate(e.to, 30), 30)} ${pad(e.type, 16)}`, width));
      }

      lines.push(boxBottom(width));
      return lines.join('\n');
    }

    nodes = graph.nodes.filter(n => {
      if (n.type !== nodeType) return false;
      for (const f of filters) {
        const val = n[f.field];
        if (val === undefined || String(val) !== f.value) return false;
      }
      return true;
    });

    const lines: string[] = [];
    lines.push(boxTop(width));
    lines.push(boxLine(`QUERY: ${sql}`, width));
    lines.push(boxSeparator(width));
    lines.push(boxLine(`Results: ${nodes.length} nodes`, width));
    lines.push(boxSeparator(width));
    lines.push(boxLine(`${pad('ID', 36)} ${pad('TYPE', 20)} ${pad('DETAILS', 20)}`, width));
    lines.push(boxSeparator(width));

    for (const n of nodes.slice(0, 50)) {
      const detail = n.conclusion || n.ruleId || n.evidenceId || n.collector || '';
      lines.push(boxLine(`${pad(truncate(String(n.id), 36), 36)} ${pad(n.type, 20)} ${pad(truncate(String(detail), 20), 20)}`, width));
    }

    lines.push(boxBottom(width));
    return lines.join('\n');
  },
};

// ──────────────────────────────────────────────────────────────────────────────
// 6. ADRRuntime
// ──────────────────────────────────────────────────────────────────────────────

export const ADRRuntime = {
  list(): string {
    const adrs = data.getADRs();
    const width = 72;

    const lines: string[] = [];
    lines.push(boxTop(width));
    lines.push(boxLine(`ARCHITECTURE DECISION RECORDS  (${adrs.length} ADRs)`, width));
    lines.push(boxSeparator(width, BOX.ml, BOX.t, BOX.mr));
    lines.push(boxLine(
      `${pad('ID', 10)} ${pad('STATUS', 12)} ${pad('DATE', 12)} ${pad('TITLE', 34)}`,
      width,
    ));
    lines.push(boxSeparator(width));

    for (const adr of adrs) {
      const statusIcon = adr.status === 'Approved' ? '\u2714' : adr.status === 'Rejected' ? '\u2718' : '\u25cb';
      lines.push(boxLine(
        `${pad(adr.id, 10)} ${pad(`${statusIcon} ${adr.status}`, 12)} ${pad(adr.date, 12)} ${pad(truncate(adr.title, 34), 34)}`,
        width,
      ));
    }

    lines.push(boxBottom(width));
    return lines.join('\n');
  },

  generate(): string {
    const adrs = data.generateADRs();
    const width = 60;

    const lines: string[] = [];
    lines.push(boxTop(width));
    lines.push(boxLine('ADR GENERATION', width));
    lines.push(boxSeparator(width));
    lines.push(boxLine(`Generated ${adrs.length} ADRs from capability records`, width));
    lines.push(boxSeparator(width));

    for (const adr of adrs) {
      lines.push(boxLine(`  \u2714 ${adr.id}: ${truncate(adr.title, 42)}`, width));
    }

    lines.push(boxSeparator(width));
    lines.push(boxLine('ADRs written to air/adr/', width));
    lines.push(boxBottom(width));
    return lines.join('\n');
  },

  diff(a: string, b: string): string {
    const adrList = data.getADRs();
    const adrA = adrList.find(adr => adr.id === a);
    const adrB = adrList.find(adr => adr.id === b);

    if (!adrA) return `ADR not found: ${a}`;
    if (!adrB) return `ADR not found: ${b}`;

    const width = 72;
    const lines: string[] = [];
    lines.push(boxTop(width));
    lines.push(boxLine(`ADR DIFF: ${a} \u2194 ${b}`, width));
    lines.push(boxSeparator(width, BOX.ml, BOX.t, BOX.mr));

    const fields: Array<[string, string, string]> = [
      ['Status', adrA.status, adrB.status],
      ['Date', adrA.date, adrB.date],
      ['Title', adrA.title, adrB.title],
      ['Conclusion', adrA.evaluationResult.conclusion, adrB.evaluationResult.conclusion],
    ];

    let diffCount = 0;
    for (const [field, valA, valB] of fields) {
      const same = valA === valB;
      if (!same) diffCount++;
      const icon = same ? '=' : '\u2260';
      lines.push(boxLine(
        `  ${icon} ${pad(field, 14)} ${pad(truncate(valA, 24), 24)} | ${pad(truncate(valB, 24), 24)}`,
        width,
      ));
    }

    lines.push(boxSeparator(width));
    lines.push(boxLine(`Differences: ${diffCount} field(s) differ`, width));
    lines.push(boxBottom(width));
    return lines.join('\n');
  },

  export(id?: string): string {
    const adrs = data.getADRs();
    if (id) {
      const adr = adrs.find(a => a.id === id);
      if (!adr) return `ADR not found: ${id}`;
      return formatADRMarkdown(adr);
    }

    return adrs.map(a => formatADRMarkdown(a)).join('\n\n---\n\n');
  },
};

function formatADRMarkdown(adr: ADR): string {
  const lines: string[] = [];
  lines.push('---');
  lines.push(`id: ${adr.id}`);
  lines.push(`title: "${adr.title}"`);
  lines.push(`status: ${adr.status}`);
  lines.push(`date: "${adr.date}"`);
  lines.push(`generated_by: ${adr.generatedBy}`);
  lines.push('---');
  lines.push('');
  lines.push('# Context');
  lines.push('');
  lines.push(adr.context);
  lines.push('');
  lines.push('## Rule Description');
  lines.push('');
  lines.push(adr.ruleDescription);
  lines.push('');
  lines.push('## Evaluation Result');
  lines.push('');
  lines.push(`- **Conclusion:** ${adr.evaluationResult.conclusion}`);
  lines.push(`- **Reason:** ${adr.evaluationResult.reason}`);
  lines.push(`- **Affected Capabilities:** ${adr.evaluationResult.affectedCapabilities.join(', ')}`);

  if (adr.evaluationResult.evidenceReferences.length > 0) {
    lines.push(`- **Evidence References:** ${adr.evaluationResult.evidenceReferences.join(', ')}`);
  }

  lines.push('');
  lines.push('## Inference Summary');
  lines.push('');

  for (const [capId, inf] of Object.entries(adr.inferenceSummary)) {
    lines.push(`- \`${capId}\`: ${inf.conclusion} (confidence: ${inf.confidence})`);
  }

  lines.push('');
  lines.push('# Decision');
  lines.push('');
  lines.push(adr.decision);
  lines.push('');
  lines.push('# Consequences');
  lines.push('');

  for (const c of adr.consequences) {
    lines.push(`- ${c}`);
  }

  return lines.join('\n');
}

// ──────────────────────────────────────────────────────────────────────────────
// 7. TelemetryRuntime
// ──────────────────────────────────────────────────────────────────────────────

export const TelemetryRuntime = {
  overview(): string {
    const baselines = store.getTelemetryBaselines();
    const readings = store.getTelemetryReadings();
    const drifts = store.getDriftEvents();

    const unresolved = drifts.filter(d => !d.resolved);
    const resolved = drifts.filter(d => d.resolved);
    const critical = unresolved.filter(d => d.severity === 'critical');

    const width = 64;

    const lines: string[] = [];
    lines.push(boxTop(width));
    lines.push(boxLine('TELEMETRY OVERVIEW', width));
    lines.push(boxSeparator(width, BOX.ml, BOX.t, BOX.mr));
    lines.push(boxLine(`Baselines:     ${baselines.length} registered`, width));
    lines.push(boxLine(`Readings:      ${readings.length} recorded`, width));
    lines.push(boxLine(`Drift Events:  ${drifts.length} total`, width));
    lines.push(boxLine(`  Unresolved:  ${unresolved.length}`, width));
    lines.push(boxLine(`  Critical:    ${critical.length}`, width));
    lines.push(boxLine(`  Resolved:    ${resolved.length}`, width));
    lines.push(boxSeparator(width));

    if (critical.length > 0) {
      lines.push(boxLine('CRITICAL DRIFTS:', width));
      for (const d of critical) {
        lines.push(boxLine(
          `  ! ${pad(d.capabilityId, 20)} ${d.metricName}: ${d.baseline} \u2192 ${d.reading}`,
          width,
        ));
      }
    } else if (unresolved.length > 0) {
      lines.push(boxLine('UNRESOLVED DRIFTS:', width));
      for (const d of unresolved) {
        lines.push(boxLine(
          `  ~ ${pad(d.capabilityId, 20)} ${d.metricName}: ${d.deviation.toFixed(2)} deviation`,
          width,
        ));
      }
    } else {
      lines.push(boxLine('  \u2714 No active drift events', width));
    }

    lines.push(boxBottom(width));
    return lines.join('\n');
  },

  baseline(): string {
    const baselines = store.getTelemetryBaselines();
    const width = 72;

    const lines: string[] = [];
    lines.push(boxTop(width));
    lines.push(boxLine(`TELEMETRY BASELINES  (${baselines.length})`, width));
    lines.push(boxSeparator(width, BOX.ml, BOX.t, BOX.mr));
    lines.push(boxLine(
      `${pad('CAPABILITY', 24)} ${pad('METRIC', 20)} ${pad('TARGET', 10)} ${pad('UNIT', 8)}`,
      width,
    ));
    lines.push(boxSeparator(width));

    for (const b of baselines) {
      lines.push(boxLine(
        `${pad(b.capabilityId, 24)} ${pad(b.metricName, 20)} ${pad(String(b.target), 10)} ${pad(b.unit, 8)}`,
        width,
      ));
    }

    if (baselines.length === 0) {
      lines.push(boxLine('  No baselines registered', width));
    }

    lines.push(boxBottom(width));
    return lines.join('\n');
  },

  read(): string {
    const readings = store.getTelemetryReadings();
    const width = 76;

    const lines: string[] = [];
    lines.push(boxTop(width));
    lines.push(boxLine(`TELEMETRY READINGS  (${readings.length} latest)`, width));
    lines.push(boxSeparator(width, BOX.ml, BOX.t, BOX.mr));
    lines.push(boxLine(
      `${pad('CAPABILITY', 22)} ${pad('METRIC', 18)} ${pad('VALUE', 10)} ${pad('UNIT', 8)} ${pad('WHEN', 14)}`,
      width,
    ));
    lines.push(boxSeparator(width));

    const latest = readings.slice(-30).reverse();
    for (const r of latest) {
      lines.push(boxLine(
        `${pad(r.capabilityId, 22)} ${pad(r.metricName, 18)} ${pad(String(r.value), 10)} ${pad(r.unit, 8)} ${pad(durationSince(r.readAt), 14)}`,
        width,
      ));
    }

    if (readings.length === 0) {
      lines.push(boxLine('  No readings recorded', width));
    }

    lines.push(boxBottom(width));
    return lines.join('\n');
  },

  record(capabilityId: string, metricName: string, value: number, unit: string): string {
    const reading: TelemetryReading = {
      capabilityId,
      metricName,
      value,
      unit,
      readAt: new Date().toISOString(),
    };

    store.recordTelemetry(reading);

    const baseline = store.getTelemetryBaseline(capabilityId, metricName);
    let driftMsg = '';

    if (baseline) {
      const deviation = Math.abs(value - baseline.target) / baseline.target;
      if (deviation > 0.2) {
        const severity: DriftEvent['severity'] = deviation > 0.5 ? 'critical' : 'warn';
        store.recordDrift({
          id: `drift-${Date.now().toString(36)}`,
          capabilityId,
          metricName,
          baseline: baseline.target,
          reading: value,
          deviation,
          severity,
          detectedAt: new Date().toISOString(),
          resolved: false,
        });
        driftMsg = `\n  DRIFT DETECTED: ${severity.toUpperCase()} deviation ${(deviation * 100).toFixed(1)}% from baseline`;
      }
    }

    return `Reading recorded: ${capabilityId}.${metricName} = ${value} ${unit}${driftMsg}`;
  },

  drift(): string {
    const drifts = store.getDriftEvents();
    const unresolved = drifts.filter(d => !d.resolved);
    const width = 80;

    const lines: string[] = [];
    lines.push(boxTop(width));
    lines.push(boxLine(`DRIFT EVENTS  (${unresolved.length} unresolved / ${drifts.length} total)`, width));
    lines.push(boxSeparator(width, BOX.ml, BOX.t, BOX.mr));
    lines.push(boxLine(
      `${pad('ID', 16)} ${pad('CAPABILITY', 20)} ${pad('METRIC', 16)} ${pad('SEV', 8)} ${pad('DEVIATION', 10)} ${pad('STATUS', 10)}`,
      width,
    ));
    lines.push(boxSeparator(width));

    for (const d of drifts.slice(-30).reverse()) {
      const sevIcon = d.severity === 'critical' ? '\u26a0' : d.severity === 'warn' ? '~' : 'i';
      const status = d.resolved ? '\u2714 resolved' : '\u25cb active';
      lines.push(boxLine(
        `${pad(d.id, 16)} ${pad(d.capabilityId, 20)} ${pad(d.metricName, 16)} ${pad(`${sevIcon} ${d.severity}`, 8)} ${pad((d.deviation * 100).toFixed(1) + '%', 10)} ${pad(status, 10)}`,
        width,
      ));
    }

    if (drifts.length === 0) {
      lines.push(boxLine('  No drift events recorded', width));
    }

    lines.push(boxBottom(width));
    return lines.join('\n');
  },
};

// ──────────────────────────────────────────────────────────────────────────────
// 8. RFCRuntime
// ──────────────────────────────────────────────────────────────────────────────

export const RFCRuntime = {
  list(): string {
    const rfcs = store.getRFCs();
    const width = 78;

    const lines: string[] = [];
    lines.push(boxTop(width));
    lines.push(boxLine(`RFCs  (${rfcs.length})`, width));
    lines.push(boxSeparator(width, BOX.ml, BOX.t, BOX.mr));
    lines.push(boxLine(
      `${pad('ID', 10)} ${pad('STATUS', 12)} ${pad('AUTHOR', 14)} ${pad('TITLE', 36)}`,
      width,
    ));
    lines.push(boxSeparator(width));

    for (const rfc of rfcs) {
      const icon = rfc.status === 'Approved' ? '\u2714'
        : rfc.status === 'Rejected' ? '\u2718'
        : rfc.status === 'Promoted' ? '\u2b50'
        : '\u25cb';
      lines.push(boxLine(
        `${pad(rfc.id, 10)} ${pad(`${icon} ${rfc.status}`, 12)} ${pad(rfc.author, 14)} ${pad(truncate(rfc.title, 36), 36)}`,
        width,
      ));
    }

    if (rfcs.length === 0) {
      lines.push(boxLine('  No RFCs', width));
    }

    lines.push(boxBottom(width));
    return lines.join('\n');
  },

  show(id: string): string {
    const rfcs = store.getRFCs();
    const rfc = rfcs.find(r => r.id === id);
    if (!rfc) return `RFC not found: ${id}`;

    const width = 72;
    const lines: string[] = [];
    lines.push(boxTop(width));
    lines.push(boxLine(`RFC: ${rfc.id}`, width));
    lines.push(boxSeparator(width));
    lines.push(boxLine(`Title:     ${rfc.title}`, width));
    lines.push(boxLine(`Author:    ${rfc.author}`, width));
    lines.push(boxLine(`Status:    ${rfc.status}`, width));
    lines.push(boxLine(`Created:   ${timestampShort(rfc.createdAt)}`, width));
    lines.push(boxLine(`Updated:   ${timestampShort(rfc.updatedAt)}`, width));
    lines.push(boxSeparator(width));
    lines.push(boxLine('Summary:', width));
    lines.push(boxLine(`  ${truncate(rfc.summary, 62)}`, width));
    lines.push(boxSeparator(width));

    if (rfc.changelog.length > 0) {
      lines.push(boxLine('CHANGELOG:', width));
      for (const entry of rfc.changelog) {
        lines.push(boxLine(`  \u2022 ${truncate(entry, 60)}`, width));
      }
    }

    lines.push(boxBottom(width));
    return lines.join('\n');
  },

  create(title: string, author: string, summary: string): string {
    const rfc: RFC = {
      id: `RFC-${(store.getRFCs().length + 1).toString().padStart(3, '0')}`,
      title,
      author,
      summary,
      status: 'Draft',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      changelog: [`Created as Draft by ${author}`],
    };

    store.createRFC(rfc);
    return `RFC created: ${rfc.id} (${rfc.status})`;
  },

  advance(id: string): string {
    const rfcs = store.getRFCs();
    const rfc = rfcs.find(r => r.id === id);
    if (!rfc) return `RFC not found: ${id}`;

    const transitions: Record<RFCStatus, RFCStatus> = {
      'Draft': 'Review',
      'Review': 'Approved',
      'Approved': 'Promoted',
      'Rejected': 'Rejected',
      'Promoted': 'Promoted',
    };

    const next = transitions[rfc.status];
    if (next === rfc.status) return `RFC ${id} cannot be advanced from status: ${rfc.status}`;

    store.updateRFC(id, {
      status: next,
      updatedAt: new Date().toISOString(),
      changelog: [...rfc.changelog, `Advanced from ${rfc.status} to ${next}`],
    });

    return `RFC ${id}: ${rfc.status} \u2192 ${next}`;
  },

  reject(id: string): string {
    const rfcs = store.getRFCs();
    const rfc = rfcs.find(r => r.id === id);
    if (!rfc) return `RFC not found: ${id}`;

    if (rfc.status === 'Promoted') return `RFC ${id} is already Promoted and cannot be rejected`;
    if (rfc.status === 'Rejected') return `RFC ${id} is already Rejected`;

    store.updateRFC(id, {
      status: 'Rejected',
      updatedAt: new Date().toISOString(),
      changelog: [...rfc.changelog, `Rejected (was ${rfc.status})`],
    });

    return `RFC ${id}: ${rfc.status} \u2192 Rejected`;
  },
};

// ──────────────────────────────────────────────────────────────────────────────
// 9. ConstitutionVersionRuntime
// ──────────────────────────────────────────────────────────────────────────────

export const ConstitutionVersionRuntime = {
  overview(): string {
    const versions = store.getConstitutionVersions();
    const current = versions[versions.length - 1];
    const width = 64;

    const lines: string[] = [];
    lines.push(boxTop(width));
    lines.push(boxLine('CONSTITUTION VERSION HISTORY', width));
    lines.push(boxSeparator(width, BOX.ml, BOX.t, BOX.mr));
    lines.push(boxLine(`Total versions:  ${versions.length}`, width));
    lines.push(boxLine(`Current version: ${current?.version || 'N/A'}`, width));
    lines.push(boxLine(`Active rules:    ${current?.ruleCount || 0}`, width));

    if (current) {
      lines.push(boxLine(`Bumped at:       ${timestampShort(current.bumpedAt)}`, width));
      lines.push(boxLine(`Bumped by:       ${current.bumpedBy}`, width));
      if (current.rfcId) {
        lines.push(boxLine(`RFC:             ${current.rfcId}`, width));
      }
    }

    lines.push(boxSeparator(width));
    lines.push(boxLine('VERSIONS:', width));

    for (const v of versions.slice().reverse()) {
      lines.push(boxLine(`  ${pad(v.version, 10)} ${pad(timestampShort(v.bumpedAt), 20)} ${pad(v.ruleCount + ' rules', 10)}`, width));
    }

    if (versions.length === 0) {
      lines.push(boxLine('  No versions recorded', width));
    }

    lines.push(boxBottom(width));
    return lines.join('\n');
  },

  versions(): string {
    const versions = store.getConstitutionVersions();
    const width = 72;

    const lines: string[] = [];
    lines.push(boxTop(width));
    lines.push(boxLine(`CONSTITUTION VERSIONS  (${versions.length})`, width));
    lines.push(boxSeparator(width, BOX.ml, BOX.t, BOX.mr));

    for (const v of versions) {
      lines.push(boxLine(`VERSION: ${v.version}`, width));
      lines.push(boxLine(`  Bumped: ${timestampShort(v.bumpedAt)} by ${v.bumpedBy}`, width));
      if (v.rfcId) lines.push(boxLine(`  RFC:    ${v.rfcId}`, width));
      lines.push(boxLine(`  Rules:  ${v.ruleCount}`, width));

      if (v.changelog.length > 0) {
        lines.push(boxLine('  Changelog:', width));
        for (const entry of v.changelog) {
          lines.push(boxLine(`    \u2022 ${truncate(entry, 54)}`, width));
        }
      }

      lines.push(boxSeparator(width));
    }

    if (versions.length === 0) {
      lines.push(boxLine('  No versions', width));
    }

    lines.push(boxBottom(width));
    return lines.join('\n');
  },

  promote(rfcId: string, opts?: { author?: string; ruleName?: string; ruleDescription?: string }): string {
    const rfcs = store.getRFCs();
    const rfc = rfcs.find(r => r.id === rfcId);
    if (!rfc) return `RFC not found: ${rfcId}`;
    if (rfc.status !== 'Approved' && rfc.status !== 'Promoted') {
      return `RFC ${rfcId} must be Approved before promoting (current: ${rfc.status})`;
    }

    const versions = store.getConstitutionVersions();
    const currentVersion = versions[versions.length - 1];
    const currentNum = currentVersion
      ? parseFloat(currentVersion.version.replace('v', ''))
      : 3.0;
    const newVersion = `v${(currentNum + 0.1).toFixed(1)}`;

    const newChangelog: string[] = [
      `Promoted via ${rfcId}: ${rfc.title}`,
    ];

    if (opts?.ruleName) {
      newChangelog.push(`New rule: ${opts.ruleName} \u2014 ${opts.ruleDescription || 'no description'}`);

      const newRule: ConstitutionalRule = {
        id: opts.ruleName,
        name: opts.ruleName,
        description: opts.ruleDescription || '',
        enabled: true,
        schema: [],
        evidenceRequirements: [],
      };
      store.addRule(newRule);
    }

    const version: ConstitutionVersion = {
      version: newVersion,
      bumpedAt: new Date().toISOString(),
      bumpedBy: opts?.author || rfc.author,
      rfcId,
      changelog: newChangelog,
      ruleCount: (currentVersion?.ruleCount || 0) + (opts?.ruleName ? 1 : 0),
    };

    store.bumpConstitutionVersion(version);

    store.updateRFC(rfcId, {
      status: 'Promoted',
      updatedAt: new Date().toISOString(),
      changelog: [...rfc.changelog, `Promoted to constitution version ${newVersion}`],
    });

    const width = 60;
    const lines: string[] = [];
    lines.push(boxTop(width));
    lines.push(boxLine('CONSTITUTION PROMOTED', width));
    lines.push(boxSeparator(width));
    lines.push(boxLine(`Previous:  ${currentVersion?.version || 'N/A'}`, width));
    lines.push(boxLine(`New:       ${newVersion}`, width));
    lines.push(boxLine(`RFC:       ${rfcId}`, width));
    lines.push(boxLine(`Author:    ${opts?.author || rfc.author}`, width));
    lines.push(boxLine(`Rules:     ${version.ruleCount}`, width));
    lines.push(boxSeparator(width));
    lines.push(boxLine('CHANGELOG:', width));
    for (const entry of newChangelog) {
      lines.push(boxLine(`  \u2022 ${truncate(entry, 52)}`, width));
    }
    lines.push(boxBottom(width));
    return lines.join('\n');
  },
};

// ──────────────────────────────────────────────────────────────────────────────
// System Reports
// ──────────────────────────────────────────────────────────────────────────────

export function statusReport(): string {
  const capabilities = data.getCapabilities();
  const rules = data.getRules();
  const graph = data.getGraph();
  const adrs = data.getADRs();
  const rfcs = store.getRFCs();
  const versions = store.getConstitutionVersions();
  const drifts = store.getDriftEvents();
  const gateHistory = store.getGateHistory();

  const enabledRules = rules.filter(r => r.enabled);
  const passCaps = capabilities.filter(c => c.status === 'PASS').length;
  const failCaps = capabilities.filter(c => c.status === 'FAIL').length;
  const pendingCaps = capabilities.filter(c => c.status === 'PENDING').length;

  const lastGate = gateHistory[gateHistory.length - 1];

  const width = 68;
  const lines: string[] = [];
  lines.push(boxTop(width));
  lines.push(boxLine('VVU AIR v3.1.0 \u2014 SYSTEM STATUS REPORT', width));
  lines.push(boxSeparator(width, BOX.ml, BOX.t, BOX.mr));
  lines.push(boxLine(`Timestamp: ${new Date().toISOString()}`, width));
  lines.push(boxSeparator(width));

  lines.push(boxLine('CAPABILITIES:', width));
  lines.push(boxLine(`  Total:    ${capabilities.length}`, width));
  lines.push(boxLine(`  PASS:     ${passCaps}  ${'\u2714'.repeat(Math.min(passCaps, 20))}`, width));
  lines.push(boxLine(`  FAIL:     ${failCaps}  ${'\u2718'.repeat(Math.min(failCaps, 20))}`, width));
  lines.push(boxLine(`  PENDING:  ${pendingCaps}  ${'\u25cb'.repeat(Math.min(pendingCaps, 20))}`, width));
  lines.push(boxSeparator(width));

  lines.push(boxLine('CONSTITUTION:', width));
  lines.push(boxLine(`  Rules:       ${rules.length} (${enabledRules.length} enabled)`, width));
  lines.push(boxLine(`  Version:     ${versions[versions.length - 1]?.version || 'N/A'}`, width));
  lines.push(boxLine(`  Versions:    ${versions.length}`, width));
  lines.push(boxSeparator(width));

  lines.push(boxLine('KNOWLEDGE GRAPH:', width));
  lines.push(boxLine(`  Nodes:       ${graph.nodes.length}`, width));
  lines.push(boxLine(`  Edges:       ${graph.edges.length}`, width));
  lines.push(boxSeparator(width));

  lines.push(boxLine('GOVERNANCE:', width));
  lines.push(boxLine(`  ADRs:        ${adrs.length}`, width));
  lines.push(boxLine(`  RFCs:        ${rfcs.length}`, width));
  lines.push(boxLine(`  Drifts:      ${drifts.filter(d => !d.resolved).length} unresolved`, width));
  lines.push(boxSeparator(width));

  if (lastGate) {
    lines.push(boxLine('LAST GATE RUN:', width));
    lines.push(boxLine(`  Outcome:  ${lastGate.outcome} (exit=${lastGate.exitCode})`, width));
    lines.push(boxLine(`  Time:     ${timestampShort(lastGate.runAt)}`, width));
  } else {
    lines.push(boxLine('LAST GATE RUN: none', width));
  }

  lines.push(boxBottom(width));
  return lines.join('\n');
}

export function healthReport(): string {
  const runtimes = [
    { name: 'CapabilityRuntime', healthy: !!CapabilityRuntime.list },
    { name: 'ConstitutionRuntime', healthy: !!ConstitutionRuntime.run },
    { name: 'EvidenceRuntime', healthy: !!EvidenceRuntime.audit },
    { name: 'DecisionRuntime', healthy: !!DecisionRuntime.run },
    { name: 'KnowledgeRuntime', healthy: !!KnowledgeRuntime.stats },
    { name: 'ADRRuntime', healthy: !!ADRRuntime.generate },
    { name: 'TelemetryRuntime', healthy: !!TelemetryRuntime.overview },
    { name: 'RFCRuntime', healthy: !!RFCRuntime.list },
    { name: 'ConstitutionVersionRuntime', healthy: !!ConstitutionVersionRuntime.promote },
  ];

  const width = 56;
  const lines: string[] = [];
  lines.push(boxTop(width));
  lines.push(boxLine('RUNTIME HEALTH CHECK', width));
  lines.push(boxSeparator(width, BOX.ml, BOX.t, BOX.mr));

  let allHealthy = true;
  for (const rt of runtimes) {
    const icon = rt.healthy ? '\u2714' : '\u2718';
    if (!rt.healthy) allHealthy = false;
    lines.push(boxLine(`  ${icon} ${pad(rt.name, 34)} ${rt.healthy ? 'OK' : 'DEGRADED'}`, width));
  }

  lines.push(boxSeparator(width));
  lines.push(boxLine(`OVERALL: ${allHealthy ? '\u2714 ALL SYSTEMS OPERATIONAL' : '\u2718 DEGRADED'}`, width));
  lines.push(boxBottom(width));
  return lines.join('\n');
}

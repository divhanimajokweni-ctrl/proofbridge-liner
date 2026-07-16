/**
 * VVU AIR v3.1.0 — Virtual Filesystem
 * Generates file content on-the-fly from runtime data.
 */

import {
  CAPABILITIES,
  RULES,
  PATTERNS,
  ADRS,
  RFCS,
  HARD_FAILURES,
  CONSTITUTIONAL_DEBT,
  AIR_CONFIG,
  Capability,
  Rule,
  Pattern,
  ADR,
  RFC,
  HardFailure,
  ConstitutionalDebtItem,
} from './data';

import {
  driftEvents,
  constitutionVersions,
  getActiveRules,
  getConstitutionVersion,
  getStoreSnapshot,
} from './store';

export interface VfsNode {
  name: string;
  type: 'file' | 'directory';
  content?: string;
  children?: VfsNode[];
}

// ── Helpers ──────────────────────────────────────────────────────────────────

const f = (name: string, content: string): VfsNode => ({ name, type: 'file', content });
const d = (name: string, children: VfsNode[]): VfsNode => ({ name, type: 'directory', children });
const lines = (items: readonly string[]): string => items.length ? items.map(i => `- ${i}`).join('\n') : 'None.';

function tbl(headers: string[], rows: string[][]): string {
  const w = headers.map((h, i) => Math.max(h.length, ...rows.map(r => (r[i] || '').length)));
  const pad = (s: string, i: number) => s.length > w[i] ? s.slice(0, w[i] - 1) + '\u2026' : s.padEnd(w[i]);
  const h = '| ' + headers.map((h, i) => pad(h, i)).join(' | ') + ' |';
  const s = '|' + w.map(i => '-'.repeat(i + 2)).join('|') + '|';
  const r = rows.map(row => '| ' + row.map((c, i) => pad(c, i)).join(' | ') + ' |');
  return [h, s, ...r].join('\n');
}

// ── Content Generators ───────────────────────────────────────────────────────

function capMd(cap: Capability): string {
  const ev = tbl(['Field', 'Req', 'Collector', 'Description'],
    cap.evidence.map(e => [e.field, e.required ? 'Y' : 'N', e.collector, e.description]));
  return [
    `# ${cap.title}`, '', cap.description, '',
    `- **Classification:** ${cap.classification} | **Maturity:** ${cap.maturity} | **Owner:** ${cap.owner}`, '',
    '## Evidence Requirements', '', ev, '',
    '## Hard Failures', '', lines(cap.hardFailures.length ? cap.hardFailures.map(h => `**${h}**`) : ['None.']), '',
    '## Adapter Boundary', '', cap.adapterBoundary, '',
    '## Exit Strategy', '', cap.exitStrategy, '',
    '## Tradeoffs', '', lines(cap.tradeoffs), '',
    '## Recommendation', '', cap.recommendation, '',
    '## Advantage', '', cap.advantage,
  ].join('\n');
}

function ruleMd(r: Rule): string {
  return [`# ${r.title}`, '', r.description, '',
    `- **Enabled:** ${r.enabled ? 'Yes' : 'No'}`, '',
    '## Schema Fields', '', lines(r.schema.map(s => `\`${s}\``))].join('\n');
}

function patMd(p: Pattern): string {
  return [`# ${p.title}`, '', p.description, '',
    '## Applicability', '', lines(p.applicability), '',
    '## Tradeoffs', '', lines(p.tradeoffs), '',
    '## References', '', lines(p.references)].join('\n');
}

function adrMd(a: ADR): string {
  return [`# ${a.title}`, '', `**Status:** ${a.status} | **Date:** ${a.date}`, '',
    '## Context', '', a.context, '',
    '## Decision', '', a.decision, '',
    '## Consequences', '', lines(a.consequences), '',
    '## Related Rules', '', lines(a.relatedRules.map(r => `\`${r}\``)), '',
    '## Related Capabilities', '', lines(a.relatedCapabilities.map(c => `\`${c}\``))].join('\n');
}

function rfcMd(r: RFC): string {
  return [`# ${r.title}`, '', `**Status:** ${r.status} | **Author:** ${r.author} | **Date:** ${r.date}`, '',
    '## Summary', '', r.summary, '',
    '## Implementation Notes', '', r.implementationNotes, '',
    '## Related ADRs', '', lines(r.relatedAdrs.map(a => `\`${a}\``))].join('\n');
}

function hfMd(hf: HardFailure): string {
  return [`# ${hf.title}`, '',
    `**Severity:** ${hf.severity} | **Status:** ${hf.status} | **Detected:** ${hf.detectedAt}`, '',
    '## Description', '', hf.description, '',
    '## Affected Capabilities', '', lines(hf.affectedCapabilities.map(c => `\`${c}\``)), '',
    '## Remediation', '', hf.remediation, '',
    '## Evidence', '', hf.evidence, '',
    '## Blocked By', '', lines(hf.blockedBy.length ? hf.blockedBy.map(b => `\`${b}\``) : ['None.'])].join('\n');
}

function debtMd(item: ConstitutionalDebtItem): string {
  return [`# ${item.title}`, '',
    `**Severity:** ${item.severity} | **Owner:** ${item.owner}`,
    `**Introduced:** ${item.introducedAt} | **Resolved:** ${item.resolvedAt ?? 'Unresolved'}`, '',
    '## Description', '', item.description, '',
    '## Related Capabilities', '', lines(item.relatedCapabilities.map(c => `\`${c}\``)), '',
    '## Related Hard Failures', '', lines(item.relatedHardFailures.map(h => `\`${h}\``)), '',
    '## Remediation', '', item.remediation].join('\n');
}

function evidenceMd(cap: Capability): string {
  const ev = tbl(['Field', 'Req', 'Collector', 'Description'],
    cap.evidence.map(e => [e.field, e.required ? 'Y' : 'N', e.collector, e.description]));
  const hfLines = cap.hardFailures.length
    ? cap.hardFailures.map(id => { const h = HARD_FAILURES.find(x => x.id === id); return h ? `- **${h.id}:** ${h.title} (${h.severity}) \u2014 ${h.status}` : `- **${id}:** (not found)`; }).join('\n')
    : 'No hard failures affecting this capability.';
  return [`# Evidence Audit: ${cap.title}`, '',
    `- **Capability:** ${cap.id} | **Fields:** ${cap.evidence.length} | **Required:** ${cap.evidence.filter(e => e.required).length}`,
    `- **Classification:** ${cap.classification} | **Maturity:** ${cap.maturity}`, '',
    ev, '', '## Hard Failure Impact', '', hfLines].join('\n');
}

// ── Runtime Info ─────────────────────────────────────────────────────────────

function runtimeStatusMd(): string {
  const s = getStoreSnapshot();
  return [`# AIR Runtime Status`, '',
    `- **Version:** ${AIR_CONFIG.version} | **Codename:** ${AIR_CONFIG.codename}`,
    `- **Status:** ${AIR_CONFIG.status} | **Updated:** ${AIR_CONFIG.lastUpdated}`,
    `- **Constitution:** v${getConstitutionVersion()}`, '',
    '## Counts', '',
    `- Capabilities: ${AIR_CONFIG.capabilityCount} | Rules: ${AIR_CONFIG.ruleCount} | Patterns: ${AIR_CONFIG.patternCount}`,
    `- ADRs: ${AIR_CONFIG.adrCount} | RFCs: ${AIR_CONFIG.rfcCount}`,
    `- Hard Failures: ${AIR_CONFIG.hardFailureCount} | Open Blockers: ${AIR_CONFIG.openBlockerCount}`, '',
    '## Store', '',
    `- Readings: ${s.telemetryReadingsCount} | Drifts: ${s.driftEventsCount} (${s.unresolvedDriftEvents} unresolved)`,
    `- Evidence: ${s.evidenceCount} | Rules: ${s.activeRulesCount} active, ${s.customRulesCount} custom`,
  ].join('\n');
}

function runtimeHealthMd(): string {
  const openHF = HARD_FAILURES.filter(h => h.status === 'Open');
  const openCD = CONSTITUTIONAL_DEBT.filter(c => c.resolvedAt === null && c.severity === 'Blocker');
  const critical = driftEvents.filter(d => !d.resolved && d.severity === 'CRITICAL');
  const caps = CAPABILITIES.map(c => `- **${c.id}:** ${c.hardFailures.length ? 'BLOCKED' : 'OK'} (${c.maturity})`).join('\n');
  return [`# AIR Health Report`, '', `Generated: ${new Date().toISOString()}`, '',
    `## Status: ${AIR_CONFIG.status}`, '',
    `## Hard Failures (Open: ${openHF.length})`, '',
    openHF.map(h => `  - **${h.id}:** ${h.title} (${h.severity})`).join('\n') || 'None.', '',
    `## Debt (Open Blockers: ${openCD.length})`, '',
    openCD.map(c => `  - **${c.id}:** ${c.title}`).join('\n') || 'None.', '',
    `## Drifts (Critical: ${critical.length})`, '',
    critical.map(d => `  - **${d.id}:** ${d.capabilityId}.${d.field}`).join('\n') || 'None.', '',
    '## Capabilities', '', caps].join('\n');
}

function runtimeVersionMd(): string {
  const cvLines = constitutionVersions.map(cv =>
    [`### v${cv.version}`, '', `- **Date:** ${cv.date}`, `- **Changelog:** ${cv.changelog}`, cv.rfcOrigin ? `- **RFC Origin:** ${cv.rfcOrigin}` : ''].filter(Boolean).join('\n')
  ).join('\n\n');
  return [`# AIR Version Information`, '',
    `- **Version:** ${AIR_CONFIG.version} (${AIR_CONFIG.codename})`,
    `- **Status:** ${AIR_CONFIG.status} | **Updated:** ${AIR_CONFIG.lastUpdated}`, '',
    '## Constitution History', '', cvLines].join('\n');
}

// ── Log Generators ───────────────────────────────────────────────────────────

function driftLogs(): VfsNode[] {
  return driftEvents.map(e =>
    f(`${e.id}.md`, [`# Log: ${e.id}`, '', `- **Category:** drift | **Time:** ${e.timestamp}`, '',
      `- **Capability:** ${e.capabilityId} | **Field:** ${e.field}`,
      `- **Baseline:** ${e.baseline} | **Actual:** ${e.actual} | **Severity:** ${e.severity}`,
      `- **Resolved:** ${e.resolved}`].join('\n')));
}

function gateLogs(): VfsNode[] {
  const rules = getActiveRules();
  const n = Date.now();
  return [f(`gate-run-${n}.md`, [`# Log: gate-run-${n}`, '', `- **Category:** gate-run | **Time:** ${new Date().toISOString()}`, '',
    `- **Rules:** ${rules.length} | **Capabilities:** ${CAPABILITIES.length} | **Cells:** ${rules.length * CAPABILITIES.length}`,
    `- **Constitution:** v${getConstitutionVersion()}`].join('\n'))];
}

// ── VFS Root ─────────────────────────────────────────────────────────────────

function buildRoot(): VfsNode {
  return d('/', [
    d('capabilities', CAPABILITIES.map(c => f(`${c.id}.md`, capMd(c)))),
    d('rules', RULES.map(r => f(`${r.id}.md`, ruleMd(r)))),
    d('patterns', PATTERNS.map(p => f(`${p.id}.md`, patMd(p)))),
    d('adr', ADRS.map(a => f(`${a.id}.md`, adrMd(a)))),
    d('evidence', CAPABILITIES.map(c => f(`${c.id}.md`, evidenceMd(c)))),
    d('rfc', RFCS.map(r => f(`${r.id}.md`, rfcMd(r)))),
    d('runtime', [
      f('status.md', runtimeStatusMd()),
      f('health.md', runtimeHealthMd()),
      f('version.md', runtimeVersionMd()),
    ]),
    d('logs', [...driftLogs(), ...gateLogs()]),
    d('debt', CONSTITUTIONAL_DEBT.map(c => f(`${c.id}.md`, debtMd(c)))),
    d('hard-failures', HARD_FAILURES.map(h => f(`${h.id}.md`, hfMd(h)))),
    d('config', [f('air.json', JSON.stringify({
      version: AIR_CONFIG.version, codename: AIR_CONFIG.codename,
      status: AIR_CONFIG.status, lastUpdated: AIR_CONFIG.lastUpdated,
      counts: {
        capabilities: AIR_CONFIG.capabilityCount, rules: AIR_CONFIG.ruleCount,
        patterns: AIR_CONFIG.patternCount, adrs: AIR_CONFIG.adrCount,
        rfcs: AIR_CONFIG.rfcCount, hardFailures: AIR_CONFIG.hardFailureCount,
        openBlockers: AIR_CONFIG.openBlockerCount,
      },
    }, null, 2))]),
  ]);
}

export const VFS: VfsNode = new Proxy({} as VfsNode, {
  get(_, prop) {
    const root = buildRoot();
    if (prop === 'name') return root.name;
    if (prop === 'type') return root.type;
    if (prop === 'children') return root.children;
    return (root as Record<string | symbol, unknown>)[prop];
  },
});

// ── Path Resolution ──────────────────────────────────────────────────────────

function normalizePath(input: string): string[] {
  const segs = input.split('/').filter(s => s !== '' && s !== '.');
  const out: string[] = [];
  for (const s of segs) s === '..' ? out.pop() : out.push(s);
  return out;
}

export function resolvePath(path: string): VfsNode | null {
  let cur = buildRoot();
  for (const seg of normalizePath(path)) {
    if (cur.type !== 'directory' || !cur.children) return null;
    const child = cur.children.find(c => c.name === seg);
    if (!child) return null;
    cur = child;
  }
  return cur;
}

export function getNode(path: string): VfsNode | null { return resolvePath(path); }

export function listDir(path: string): VfsNode[] {
  const n = resolvePath(path);
  return n && n.type === 'directory' && n.children ? n.children : [];
}

export function readFile(path: string): string | null {
  const n = resolvePath(path);
  return n && n.type === 'file' ? (n.content ?? null) : null;
}

// ── Tree ─────────────────────────────────────────────────────────────────────

function treeLines(node: VfsNode, prefix: string, isLast: boolean): string[] {
  const conn = isLast ? '\u2514\u2500\u2500 ' : '\u251c\u2500\u2500 ';
  if (node.type === 'directory') {
    const kids = node.children ?? [];
    const pfx = prefix + (isLast ? '    ' : '\u2502   ');
    return [
      `${prefix}${conn}${node.name}/`,
      ...kids.flatMap((c, i) => treeLines(c, pfx, i === kids.length - 1)),
    ];
  }
  return [`${prefix}${conn}${node.name}`];
}

export function tree(path: string): string {
  const n = resolvePath(path);
  return n ? treeLines(n, '', true).join('\n') : `Path not found: ${path}`;
}

// ── Glob Search ──────────────────────────────────────────────────────────────

function globRe(pattern: string): RegExp {
  const re = pattern.replace(/\./g, '\\.').replace(/\*\*/g, '{{G}}').replace(/\*/g, '[^/]*').replace(/\?/g, '[^/]').replace(/\{\{G\}\}/g, '.*');
  return new RegExp(`^${re}$`);
}

function allFilePaths(node: VfsNode, p: string): string[] {
  const out: string[] = [];
  if (node.type === 'file') out.push(p);
  for (const c of node.children ?? []) out.push(...allFilePaths(c, p === '/' ? `/${c.name}` : `${p}/${c.name}`));
  return out;
}

export function findFiles(pattern: string): string[] {
  const regex = globRe(pattern);
  return allFilePaths(buildRoot(), '/').filter(p => regex.test(p));
}

// ── Grep ─────────────────────────────────────────────────────────────────────

interface GrepResult { path: string; line: number; content: string; }

export function grepFiles(pattern: string, searchPath?: string): GrepResult[] {
  const regex = new RegExp(pattern, 'gi');
  const paths = searchPath ? allFilePaths(buildRoot(), '/').filter(p => p.startsWith(searchPath)) : allFilePaths(buildRoot(), '/');
  const results: GrepResult[] = [];
  for (const fp of paths) {
    const c = readFile(fp);
    if (!c) continue;
    for (let i = 0; i < c.split('\n').length; i++) {
      const line = c.split('\n')[i];
      if (regex.test(line)) results.push({ path: fp, line: i + 1, content: line });
      regex.lastIndex = 0;
    }
  }
  return results;
}

export function rootTree(): string { return tree('/'); }

export const filesystem = {
  ls: (path: string) => {
    const nodes = listDir(path);
    return {
      entries: nodes.map(n => ({
        name: n.name,
        isDirectory: n.type === 'directory',
        size: n.content ? String(n.content.length) : undefined,
      })),
    };
  },
  cd: (path: string) => {
    const node = getNode(path);
    if (!node) return `cd: no such file or directory: ${path}`;
    if (node.type !== 'directory') return `cd: not a directory: ${path}`;
    return path;
  },
  cat: (path: string) => {
    const content = readFile(path);
    if (content === null) return `cat: no such file: ${path}`;
    return content;
  },
  pwd: () => '/',
  tree: (path: string, depth?: number) => tree(path),
  find: (pattern: string, path?: string) => findFiles(pattern).join('\n'),
  grep: (pattern: string, path?: string) => {
    const results = grepFiles(pattern, path);
    return results.map(r => `${r.path}:${r.line}: ${r.content}`).join('\n') || '(no matches)';
  },
};

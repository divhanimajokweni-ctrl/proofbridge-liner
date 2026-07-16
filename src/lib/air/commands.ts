/**
 * VVU AIR v3.1.0 — Command Dispatcher
 * Codename: "CRT Terminal"
 *
 * Parses user input, routes to runtimes, and returns styled output.
 * Supports 60+ commands across 9+ command families.
 *
 * Exports:
 *   dispatch(input: string): CommandResult
 *   complete(partial: string): string[]
 *   CommandResult
 *   PagerPayload
 */

// ──────────────────────────────────────────────────────────────────────────────
// Imports
// ──────────────────────────────────────────────────────────────────────────────

import {
  CAPABILITIES,
  RULES,
  PATTERNS,
  ADRS,
  RFCS,
  HARD_FAILURES,
  CONSTITUTIONAL_DEBT,
  AIR_CONFIG,
} from './data';

import {
  CapabilityRuntime,
  ConstitutionRuntime,
  EvidenceRuntime,
  DecisionRuntime,
  KnowledgeRuntime,
  ADRRuntime,
  TelemetryRuntime,
  RFCRuntime,
  ConstitutionVersionRuntime,
  statusReport,
  healthReport,
  RULE_EVIDENCE_REQUIREMENTS,
} from './runtimes';

import {
  attachEvidence,
  detachEvidence,
  getActiveRules,
  getConstitutionVersion,
  recordTelemetryReading,
  resolveDriftEvent,
  setBaseline,
  advanceRFC,
  rejectRFC,
  submitRFC,
  listRFCs,
  getRFC,
  getStoreSnapshot,
  VALID_EVIDENCE_FIELDS,
  telemetryBaselines,
  telemetryReadings,
  driftEvents,
  constitutionVersions,
  customRules,
} from './store';

import { filesystem } from './filesystem';
import { manpages } from './manpages';

// ──────────────────────────────────────────────────────────────────────────────
// Types
// ──────────────────────────────────────────────────────────────────────────────

export interface CommandResult {
  output: string;
  pager?: PagerPayload;
  exitCode?: number;
}

export interface PagerPayload {
  header: string;
  body: string;
  footer: string;
}

interface TokenizedInput {
  command: string;
  subcommand: string;
  args: string[];
  flags: Record<string, string>;
  raw: string;
}

interface CommandDef {
  names: string[];
  family: string;
  description: string;
  usage: string;
  minArgs: number;
  maxArgs: number;
  handler: (tokens: TokenizedInput) => CommandResult;
}

interface SuggestionResult {
  command: string;
  distance: number;
}

// ──────────────────────────────────────────────────────────────────────────────
// ANSI Color Codes
// ──────────────────────────────────────────────────────────────────────────────

const C = {
  reset: '\x1b[0m',
  bold: '\x1b[1m',
  dim: '\x1b[2m',
  underline: '\x1b[4m',

  black: '\x1b[30m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',

  brightBlack: '\x1b[90m',
  brightRed: '\x1b[91m',
  brightGreen: '\x1b[92m',
  brightYellow: '\x1b[93m',
  brightBlue: '\x1b[94m',
  brightMagenta: '\x1b[95m',
  brightCyan: '\x1b[96m',
  brightWhite: '\x1b[97m',

  bgBlack: '\x1b[40m',
  bgRed: '\x1b[41m',
  bgGreen: '\x1b[42m',
  bgYellow: '\x1b[43m',
  bgBlue: '\x1b[44m',
  bgMagenta: '\x1b[45m',
  bgCyan: '\x1b[46m',
  bgWhite: '\x1b[47m',
} as const;

// ──────────────────────────────────────────────────────────────────────────────
// Theme State
// ──────────────────────────────────────────────────────────────────────────────

type ThemeName = 'green' | 'amber' | 'white';

interface ThemeColors {
  primary: string;
  secondary: string;
  accent: string;
  success: string;
  warning: string;
  error: string;
  dim: string;
  reset: string;
  bold: string;
}

const THEMES: Record<ThemeName, ThemeColors> = {
  green: {
    primary: C.brightGreen,
    secondary: C.green,
    accent: C.brightCyan,
    success: C.brightGreen,
    warning: C.yellow,
    error: C.brightRed,
    dim: C.dim,
    reset: C.reset,
    bold: C.bold,
  },
  amber: {
    primary: C.brightYellow,
    secondary: C.yellow,
    accent: C.brightMagenta,
    success: C.brightGreen,
    warning: C.brightYellow,
    error: C.brightRed,
    dim: C.dim,
    reset: C.reset,
    bold: C.bold,
  },
  white: {
    primary: C.brightWhite,
    secondary: C.white,
    accent: C.brightCyan,
    success: C.brightWhite,
    warning: C.brightWhite,
    error: C.brightWhite,
    dim: C.dim,
    reset: C.reset,
    bold: C.bold,
  },
};

let currentTheme: ThemeName = 'green';
let crtEnabled = true;
let soundEnabled = false;

function t(): ThemeColors {
  return THEMES[currentTheme];
}

// ──────────────────────────────────────────────────────────────────────────────
// Box-Drawing Helpers
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
} as const;

function pad(str: string, width: number, align: 'left' | 'right' = 'left'): string {
  if (align === 'right') return str.padStart(width);
  return str.padEnd(width);
}

function truncate(str: string, maxWidth: number): string {
  if (str.length <= maxWidth) return str;
  return str.slice(0, maxWidth - 1) + '\u2026';
}

function boxLine(content: string, width: number): string {
  return `${t().dim}${BOX.v}${t().reset} ${pad(content, width - 4)} ${t().dim}${BOX.v}${t().reset}`;
}

function boxTop(width: number): string {
  return `${t().dim}${BOX.tl}${BOX.h.repeat(width - 2)}${BOX.tr}${t().reset}`;
}

function boxBottom(width: number): string {
  return `${t().dim}${BOX.bl}${BOX.h.repeat(width - 2)}${BOX.br}${t().reset}`;
}

function boxSeparator(
  width: number,
  left: string = BOX.ml,
  _mid: string = BOX.x,
  right: string = BOX.mr,
): string {
  return `${t().dim}${left}${BOX.h.repeat(width - 2)}${right}${t().reset}`;
}

function boxMidSep(width: number): string {
  return `${t().dim}${BOX.ml}${BOX.h.repeat(width - 2)}${BOX.mr}${t().reset}`;
}

function colored(text: string, color: string): string {
  if (!crtEnabled) return text;
  return `${color}${text}${C.reset}`;
}

function bold(text: string): string {
  return colored(text, t().bold);
}

function dim(text: string): string {
  return colored(text, t().dim);
}

function success(text: string): string {
  return colored(text, t().success);
}

function warn(text: string): string {
  return colored(text, t().warning);
}

function err(text: string): string {
  return colored(text, t().error);
}

function accent(text: string): string {
  return colored(text, t().accent);
}

// ──────────────────────────────────────────────────────────────────────────────
// Tokenizer
// ──────────────────────────────────────────────────────────────────────────────

function tokenize(input: string): TokenizedInput {
  const trimmed = input.trim();
  if (!trimmed) {
    return { command: '', subcommand: '', args: [], flags: {}, raw: trimmed };
  }

  const tokens: string[] = [];
  const flags: Record<string, string> = {};
  let current = '';
  let inSingleQuote = false;
  let inDoubleQuote = false;
  let escapeNext = false;

  for (let i = 0; i < trimmed.length; i++) {
    const ch = trimmed[i];

    if (escapeNext) {
      current += ch;
      escapeNext = false;
      continue;
    }

    if (ch === '\\') {
      escapeNext = true;
      continue;
    }

    if (ch === "'" && !inDoubleQuote) {
      inSingleQuote = !inSingleQuote;
      continue;
    }

    if (ch === '"' && !inSingleQuote) {
      inDoubleQuote = !inDoubleQuote;
      continue;
    }

    if (ch === ' ' && !inSingleQuote && !inDoubleQuote) {
      if (current.length > 0) {
        tokens.push(current);
        current = '';
      }
      continue;
    }

    current += ch;
  }

  if (current.length > 0) {
    tokens.push(current);
  }

  const args: string[] = [];
  for (let i = 0; i < tokens.length; i++) {
    const token = tokens[i];
    if (token.startsWith('--')) {
      const eqIdx = token.indexOf('=');
      if (eqIdx !== -1) {
        flags[token.slice(2, eqIdx)] = token.slice(eqIdx + 1);
      } else {
        const next = tokens[i + 1];
        if (next && !next.startsWith('--')) {
          flags[token.slice(2)] = next;
          i++;
        } else {
          flags[token.slice(2)] = 'true';
        }
      }
    } else {
      args.push(token);
    }
  }

  const command = args[0] ?? '';
  const subcommand = args[1] ?? '';
  const restArgs = args.slice(2);

  return {
    command,
    subcommand,
    args: restArgs,
    flags,
    raw: trimmed,
  };
}

// ──────────────────────────────────────────────────────────────────────────────
// Levenshtein Distance (for suggestions)
// ──────────────────────────────────────────────────────────────────────────────

function levenshtein(a: string, b: string): number {
  const m = a.length;
  const n = b.length;
  const dp: number[][] = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));

  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      dp[i][j] = Math.min(
        dp[i - 1][j] + 1,
        dp[i][j - 1] + 1,
        dp[i - 1][j - 1] + cost,
      );
    }
  }

  return dp[m][n];
}

function suggestCommand(input: string): string | null {
  const allNames: string[] = [];
  for (const cmd of COMMAND_REGISTRY) {
    allNames.push(...cmd.names);
  }

  const unique = [...new Set(allNames)];
  let best: SuggestionResult | null = null;

  for (const name of unique) {
    const dist = levenshtein(input.toLowerCase(), name.toLowerCase());
    if (dist <= 3 && (!best || dist < best.distance)) {
      best = { command: name, distance: dist };
    }
  }

  return best?.command ?? null;
}

// ──────────────────────────────────────────────────────────────────────────────
// Timestamp Helpers
// ──────────────────────────────────────────────────────────────────────────────

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
    if (ms < 0) return 'future';
    if (ms < 60_000) return `${Math.floor(ms / 1000)}s ago`;
    if (ms < 3_600_000) return `${Math.floor(ms / 60_000)}m ago`;
    if (ms < 86_400_000) return `${Math.floor(ms / 3_600_000)}h ago`;
    return `${Math.floor(ms / 86_400_000)}d ago`;
  } catch {
    return 'unknown';
  }
}

function conclusionIcon(c: string): string {
  switch (c) {
    case 'PASS': return '\u2714';
    case 'FAIL': return '\u2718';
    case 'PENDING': return '\u25cb';
    case 'UNKNOWN': return '?';
    default: return '-';
  }
}

// ──────────────────────────────────────────────────────────────────────────────
// Command Registry
// ──────────────────────────────────────────────────────────────────────────────

const COMMAND_REGISTRY: CommandDef[] = [];

function register(def: CommandDef): void {
  COMMAND_REGISTRY.push(def);
}

// ──────────────────────────────────────────────────────────────────────────────
// 1. HELP FAMILY
// ──────────────────────────────────────────────────────────────────────────────

register({
  names: ['help'],
  family: 'help',
  description: 'Show available commands or help for a specific command',
  usage: 'help [command]',
  minArgs: 0,
  maxArgs: 1,
  handler(tokens): CommandResult {
    if (tokens.args.length === 0) {
      const width = 72;
      const lines: string[] = [];
      lines.push(boxTop(width));
      lines.push(boxLine(accent('VVU AIR v3.1.0 \u2014 COMMAND REFERENCE'), width));
      lines.push(boxMidSep(width));

      const families: Record<string, string[]> = {};
      for (const cmd of COMMAND_REGISTRY) {
        if (!families[cmd.family]) families[cmd.family] = [];
        for (const name of cmd.names) {
          families[cmd.family].push(name);
        }
      }

      for (const [family, cmds] of Object.entries(families)) {
        lines.push(boxLine(bold(`  ${family.toUpperCase()}`), width));
        for (const cmd of cmds) {
          lines.push(boxLine(`    ${accent(pad(cmd, 18))} ${dim(CODE(c => c === cmd ? '' : ''))}`, width));
        }
      }

      lines.push(boxMidSep(width));
      lines.push(boxLine(dim('Type "help <command>" for detailed usage'), width));
      lines.push(boxBottom(width));
      return { output: lines.join('\n'), exitCode: 0 };
    }

    const target = tokens.args[0];
    const cmd = COMMAND_REGISTRY.find(c => c.names.includes(target));
    if (!cmd) {
      return { output: err(`Unknown command: ${target}`), exitCode: 1 };
    }

    const width = 60;
    const lines: string[] = [];
    lines.push(boxTop(width));
    lines.push(boxLine(accent(`HELP: ${cmd.names[0]}`), width));
    lines.push(boxMidSep(width));
    lines.push(boxLine(`Family:    ${cmd.family}`, width));
    lines.push(boxLine(`Usage:     ${cmd.usage}`, width));
    lines.push(boxLine(`Aliases:   ${cmd.names.join(', ')}`, width));
    lines.push(boxMidSep(width));
    lines.push(boxLine(cmd.description, width));
    lines.push(boxBottom(width));
    return { output: lines.join('\n'), exitCode: 0 };
  },
});

function CODE(_fn: (s: string) => string): string {
  return '';
}

register({
  names: ['man'],
  family: 'help',
  description: 'Display the manual page for a topic',
  usage: 'man <topic>',
  minArgs: 1,
  maxArgs: 1,
  handler(tokens): CommandResult {
    const topic = tokens.args[0];
    if (!topic) {
      return { output: err('Usage: man <topic>'), exitCode: 1 };
    }

    try {
      const page = manpages.lookup(topic);
      if (!page) {
        return { output: err(`No manual page for: ${topic}`), exitCode: 1 };
      }

      const width = 72;
      const lines: string[] = [];
      lines.push(boxTop(width));
      lines.push(boxLine(accent(`MANUAL: ${topic.toUpperCase()}`), width));
      lines.push(boxMidSep(width));

      for (const line of page.split('\n')) {
        lines.push(boxLine(`  ${line}`, width));
      }

      lines.push(boxBottom(width));
      return { output: lines.join('\n'), exitCode: 0 };
    } catch {
      return { output: err(`Manual page not available for: ${topic}`), exitCode: 1 };
    }
  },
});

// ──────────────────────────────────────────────────────────────────────────────
// 2. CAPABILITY FAMILY
// ──────────────────────────────────────────────────────────────────────────────

register({
  names: ['cap', 'capability'],
  family: 'capability',
  description: 'List, show, or validate capabilities',
  usage: 'cap list | cap show <id> | cap validate <id>',
  minArgs: 1,
  maxArgs: 3,
  handler(tokens): CommandResult {
    const sub = tokens.subcommand.toLowerCase();
    switch (sub) {
      case 'list':
      case 'ls':
        return { output: CapabilityRuntime.list(), exitCode: 0 };

      case 'show':
      case 'get': {
        const id = tokens.args[0];
        if (!id) return { output: err('Usage: cap show <id>'), exitCode: 1 };
        return { output: CapabilityRuntime.show(id), exitCode: 0 };
      }

      case 'validate':
      case 'check': {
        const id = tokens.args[0];
        if (!id) return { output: err('Usage: cap validate <id>'), exitCode: 1 };
        return { output: CapabilityRuntime.validate(id), exitCode: 0 };
      }

      default:
        return {
          output: err(`Unknown cap subcommand: ${sub}\nUsage: cap list | cap show <id> | cap validate <id>`),
          exitCode: 1,
        };
    }
  },
});

// ──────────────────────────────────────────────────────────────────────────────
// 3. RULE FAMILY
// ──────────────────────────────────────────────────────────────────────────────

register({
  names: ['rule'],
  family: 'rule',
  description: 'Manage and evaluate constitutional rules',
  usage: 'rule list | rule run | rule explain <id> | rule enable <id> | rule disable <id> | rule test <id>',
  minArgs: 1,
  maxArgs: 3,
  handler(tokens): CommandResult {
    const sub = tokens.subcommand.toLowerCase();
    switch (sub) {
      case 'list':
      case 'ls':
        return { output: ConstitutionRuntime.list(), exitCode: 0 };

      case 'run':
      case 'eval':
      case 'evaluate':
        return { output: ConstitutionRuntime.run(), exitCode: 0 };

      case 'explain':
      case 'info': {
        const ruleId = tokens.args[0];
        if (!ruleId) return { output: err('Usage: rule explain <rule-id>'), exitCode: 1 };
        return { output: ConstitutionRuntime.explain(ruleId), exitCode: 0 };
      }

      case 'enable':
      case 'on': {
        const ruleId = tokens.args[0];
        if (!ruleId) return { output: err('Usage: rule enable <rule-id>'), exitCode: 1 };
        return { output: ConstitutionRuntime.enable(ruleId), exitCode: 0 };
      }

      case 'disable':
      case 'off': {
        const ruleId = tokens.args[0];
        if (!ruleId) return { output: err('Usage: rule disable <rule-id>'), exitCode: 1 };
        return { output: ConstitutionRuntime.disable(ruleId), exitCode: 0 };
      }

      case 'test': {
        const ruleId = tokens.args[0];
        if (!ruleId) return { output: err('Usage: rule test <rule-id>'), exitCode: 1 };
        return { output: ConstitutionRuntime.test(ruleId), exitCode: 0 };
      }

      default:
        return {
          output: err(
            `Unknown rule subcommand: ${sub}\n` +
            'Usage: rule list | rule run | rule explain <id> | rule enable <id> | rule disable <id> | rule test <id>'
          ),
          exitCode: 1,
        };
    }
  },
});

// ──────────────────────────────────────────────────────────────────────────────
// 4. EVIDENCE FAMILY
// ──────────────────────────────────────────────────────────────────────────────

register({
  names: ['evidence', 'ev'],
  family: 'evidence',
  description: 'Manage evidence attachments and audits',
  usage: 'evidence list | evidence verify <id> | evidence attach <id> <field> <value> | evidence detach <id> <field> | evidence fields | evidence missing | evidence audit',
  minArgs: 1,
  maxArgs: 5,
  handler(tokens): CommandResult {
    const sub = tokens.subcommand.toLowerCase();
    switch (sub) {
      case 'list':
      case 'ls':
        return { output: EvidenceRuntime.list(), exitCode: 0 };

      case 'verify':
      case 'check': {
        const capId = tokens.args[0];
        if (!capId) return { output: err('Usage: evidence verify <capability-id>'), exitCode: 1 };
        return { output: EvidenceRuntime.verify(capId), exitCode: 0 };
      }

      case 'attach':
      case 'set': {
        const capId = tokens.args[0];
        const field = tokens.args[1];
        const value = tokens.args.slice(2).join(' ');
        if (!capId || !field || !value) {
          return { output: err('Usage: evidence attach <cap-id> <field> <value>'), exitCode: 1 };
        }
        return { output: EvidenceRuntime.attach(capId, field, value), exitCode: 0 };
      }

      case 'detach':
      case 'remove': {
        const capId = tokens.args[0];
        const field = tokens.args[1];
        if (!capId || !field) {
          return { output: err('Usage: evidence detach <cap-id> <field>'), exitCode: 1 };
        }
        return { output: EvidenceRuntime.detach(capId, field), exitCode: 0 };
      }

      case 'fields':
        return { output: EvidenceRuntime.fields(), exitCode: 0 };

      case 'missing':
        return { output: EvidenceRuntime.missing(), exitCode: 0 };

      case 'audit':
        return { output: EvidenceRuntime.audit(), exitCode: 0 };

      default:
        return {
          output: err(
            `Unknown evidence subcommand: ${sub}\n` +
            'Usage: evidence list | verify <id> | attach <id> <field> <value> | detach <id> <field> | fields | missing | audit'
          ),
          exitCode: 1,
        };
    }
  },
});

// ──────────────────────────────────────────────────────────────────────────────
// 5. GATE FAMILY
// ──────────────────────────────────────────────────────────────────────────────

register({
  names: ['gate', 'constitutional-gate'],
  family: 'gate',
  description: 'Run and inspect the constitutional release gate',
  usage: 'gate | gate explain | gate json | gate html | gate history',
  minArgs: 0,
  maxArgs: 1,
  handler(tokens): CommandResult {
    const sub = (tokens.subcommand || 'run').toLowerCase();
    switch (sub) {
      case 'run':
        return { output: DecisionRuntime.run(), exitCode: 0 };

      case 'explain':
        return { output: DecisionRuntime.explain(), exitCode: 0 };

      case 'json':
        return { output: DecisionRuntime.json(), exitCode: 0 };

      case 'html':
        return { output: DecisionRuntime.html(), exitCode: 0 };

      case 'history':
      case 'log':
        return { output: DecisionRuntime.history(), exitCode: 0 };

      default:
        return {
          output: err(
            `Unknown gate subcommand: ${sub}\n` +
            'Usage: gate | gate explain | gate json | gate html | gate history'
          ),
          exitCode: 1,
        };
    }
  },
});

// ──────────────────────────────────────────────────────────────────────────────
// 6. GRAPH FAMILY
// ──────────────────────────────────────────────────────────────────────────────

register({
  names: ['graph', 'kg'],
  family: 'graph',
  description: 'Inspect and query the knowledge graph',
  usage: 'graph | graph stats | graph export | graph explain | graph query "SHOW ... WHERE ..."',
  minArgs: 0,
  maxArgs: 3,
  handler(tokens): CommandResult {
    const sub = (tokens.subcommand || 'view').toLowerCase();
    switch (sub) {
      case 'view':
      case 'show':
        return {
          output: KnowledgeRuntime.stats(),
          exitCode: 0,
        };

      case 'stats':
      case 'stat':
        return { output: KnowledgeRuntime.stats(), exitCode: 0 };

      case 'export':
      case 'json':
        return { output: KnowledgeRuntime.export(), exitCode: 0 };

      case 'explain':
      case 'help':
        return { output: KnowledgeRuntime.explain(), exitCode: 0 };

      case 'query':
      case 'q': {
        const queryStr = tokens.args[0] || tokens.flags.query;
        if (!queryStr) {
          return {
            output: err('Usage: graph query "SHOW <type> [WHERE <field> = <value>]"'),
            exitCode: 1,
          };
        }
        return { output: KnowledgeRuntime.query(queryStr), exitCode: 0 };
      }

      default:
        return {
          output: err(
            `Unknown graph subcommand: ${sub}\n` +
            'Usage: graph | graph stats | graph export | graph explain | graph query "SHOW ..."'
          ),
          exitCode: 1,
        };
    }
  },
});

// ──────────────────────────────────────────────────────────────────────────────
// 7. ADR FAMILY
// ──────────────────────────────────────────────────────────────────────────────

register({
  names: ['adr'],
  family: 'adr',
  description: 'Manage Architecture Decision Records',
  usage: 'adr list | adr generate | adr diff <a> <b> | adr export [id]',
  minArgs: 1,
  maxArgs: 3,
  handler(tokens): CommandResult {
    const sub = tokens.subcommand.toLowerCase();
    switch (sub) {
      case 'list':
      case 'ls':
        return { output: ADRRuntime.list(), exitCode: 0 };

      case 'generate':
      case 'gen':
        return { output: ADRRuntime.generate(), exitCode: 0 };

      case 'diff': {
        const a = tokens.args[0];
        const b = tokens.args[1];
        if (!a || !b) {
          return { output: err('Usage: adr diff <adr-id-a> <adr-id-b>'), exitCode: 1 };
        }
        return { output: ADRRuntime.diff(a, b), exitCode: 0 };
      }

      case 'export':
      case 'out': {
        const id = tokens.args[0];
        return { output: ADRRuntime.export(id), exitCode: 0 };
      }

      default:
        return {
          output: err(
            `Unknown ADR subcommand: ${sub}\n` +
            'Usage: adr list | adr generate | adr diff <a> <b> | adr export [id]'
          ),
          exitCode: 1,
        };
    }
  },
});

// ──────────────────────────────────────────────────────────────────────────────
// 8. RFC FAMILY
// ──────────────────────────────────────────────────────────────────────────────

register({
  names: ['rfc'],
  family: 'rfc',
  description: 'Manage Requests for Comments',
  usage: 'rfc list | rfc show <id> | rfc create "<title>" "<author>" "<summary>" | rfc advance <id> | rfc reject <id>',
  minArgs: 1,
  maxArgs: 5,
  handler(tokens): CommandResult {
    const sub = tokens.subcommand.toLowerCase();
    switch (sub) {
      case 'list':
      case 'ls':
        return { output: RFCRuntime.list(), exitCode: 0 };

      case 'show':
      case 'get': {
        const id = tokens.args[0];
        if (!id) return { output: err('Usage: rfc show <id>'), exitCode: 1 };
        return { output: RFCRuntime.show(id), exitCode: 0 };
      }

      case 'create':
      case 'new': {
        const title = tokens.args[0];
        const author = tokens.args[1];
        const summary = tokens.args[2];
        if (!title || !author || !summary) {
          return { output: err('Usage: rfc create "<title>" "<author>" "<summary>"'), exitCode: 1 };
        }
        return { output: RFCRuntime.create(title, author, summary), exitCode: 0 };
      }

      case 'advance':
      case 'promote': {
        const id = tokens.args[0];
        if (!id) return { output: err('Usage: rfc advance <id>'), exitCode: 1 };
        return { output: RFCRuntime.advance(id), exitCode: 0 };
      }

      case 'reject':
      case 'deny': {
        const id = tokens.args[0];
        if (!id) return { output: err('Usage: rfc reject <id>'), exitCode: 1 };
        return { output: RFCRuntime.reject(id), exitCode: 0 };
      }

      default:
        return {
          output: err(
            `Unknown RFC subcommand: ${sub}\n` +
            'Usage: rfc list | rfc show <id> | rfc create "..." "..." "..." | rfc advance <id> | rfc reject <id>'
          ),
          exitCode: 1,
        };
    }
  },
});

// ──────────────────────────────────────────────────────────────────────────────
// 9. CONSTITUTION FAMILY
// ──────────────────────────────────────────────────────────────────────────────

register({
  names: ['constitution', 'const'],
  family: 'constitution',
  description: 'Constitution version management and promotion',
  usage: 'constitution | constitution versions | constitution promote <rfc-id> [--rule-name X --rule-desc "Y"]',
  minArgs: 0,
  maxArgs: 5,
  handler(tokens): CommandResult {
    const sub = (tokens.subcommand || 'overview').toLowerCase();
    switch (sub) {
      case 'overview':
      case 'view':
        return { output: ConstitutionVersionRuntime.overview(), exitCode: 0 };

      case 'versions':
      case 'history':
        return { output: ConstitutionVersionRuntime.versions(), exitCode: 0 };

      case 'promote':
      case 'bump': {
        const rfcId = tokens.args[0];
        if (!rfcId) return { output: err('Usage: constitution promote <rfc-id>'), exitCode: 1 };

        const opts: { author?: string; ruleName?: string; ruleDescription?: string } = {};
        if (tokens.flags['rule-name']) opts.ruleName = tokens.flags['rule-name'];
        if (tokens.flags['rule-desc']) opts.ruleDescription = tokens.flags['rule-desc'];
        if (tokens.flags.author) opts.author = tokens.flags.author;

        return { output: ConstitutionVersionRuntime.promote(rfcId, opts), exitCode: 0 };
      }

      default:
        return {
          output: err(
            `Unknown constitution subcommand: ${sub}\n` +
            'Usage: constitution | constitution versions | constitution promote <rfc-id>'
          ),
          exitCode: 1,
        };
    }
  },
});

// ──────────────────────────────────────────────────────────────────────────────
// 10. TELEMETRY FAMILY
// ──────────────────────────────────────────────────────────────────────────────

register({
  names: ['telemetry', 'telem', 'tm'],
  family: 'telemetry',
  description: 'Telemetry overview, baselines, readings, and drift detection',
  usage: 'telemetry | telemetry baseline | telemetry read | telemetry record <cap> <field> <val> | telemetry drift | telemetry drift list | telemetry drift check | telemetry drift resolve <id>',
  minArgs: 0,
  maxArgs: 5,
  handler(tokens): CommandResult {
    const sub = (tokens.subcommand || 'overview').toLowerCase();
    switch (sub) {
      case 'overview':
      case 'status':
        return { output: TelemetryRuntime.overview(), exitCode: 0 };

      case 'baseline':
      case 'base': {
        const sub2 = (tokens.args[0] || 'list').toLowerCase();
        switch (sub2) {
          case 'list':
          case 'ls':
            return { output: TelemetryRuntime.baseline(), exitCode: 0 };

          case 'set':
          case 'update': {
            const cap = tokens.args[1];
            const field = tokens.args[2];
            const val = tokens.args[3];
            if (!cap || !field || !val) {
              return { output: err('Usage: telemetry baseline set <capability> <field> <value>'), exitCode: 1 };
            }
            const numVal = parseFloat(val);
            if (isNaN(numVal)) {
              return { output: err(`Invalid numeric value: ${val}`), exitCode: 1 };
            }
            const result = setBaseline(cap, field, numVal);
            if (!result.success) {
              return { output: err(result.error || 'Failed to set baseline'), exitCode: 1 };
            }
            return { output: success(`Baseline set: ${cap}.${field} = ${numVal}`), exitCode: 0 };
          }

          default:
            return {
              output: err(`Unknown baseline subcommand: ${sub2}\nUsage: telemetry baseline | telemetry baseline set <cap> <field> <val>`),
              exitCode: 1,
            };
        }
      }

      case 'read':
      case 'readings':
        return { output: TelemetryRuntime.read(), exitCode: 0 };

      case 'record':
      case 'add': {
        const cap = tokens.args[0];
        const field = tokens.args[1];
        const val = tokens.args[2];
        if (!cap || !field || !val) {
          return { output: err('Usage: telemetry record <capability> <field> <value>'), exitCode: 1 };
        }
        const numVal = parseFloat(val);
        if (isNaN(numVal)) {
          return { output: err(`Invalid numeric value: ${val}`), exitCode: 1 };
        }
        return {
          output: TelemetryRuntime.record(cap, field, numVal, tokens.flags.unit || ''),
          exitCode: 0,
        };
      }

      case 'drift':
      case 'delta': {
        const sub2 = (tokens.args[0] || 'list').toLowerCase();
        switch (sub2) {
          case 'list':
          case 'ls':
            return { output: TelemetryRuntime.drift(), exitCode: 0 };

          case 'check':
          case 'scan': {
            const unresolved = driftEvents.filter(d => !d.resolved);
            const width = 64;
            const lines: string[] = [];
            lines.push(boxTop(width));
            lines.push(boxLine(accent('DRIFT CHECK'), width));
            lines.push(boxMidSep(width));
            lines.push(boxLine(`Unresolved drift events: ${unresolved.length}`, width));

            if (unresolved.length === 0) {
              lines.push(boxLine(success('  \u2714 No active drift'), width));
            } else {
              const critical = unresolved.filter(d => d.severity === 'CRITICAL');
              const warn = unresolved.filter(d => d.severity === 'WARN');
              lines.push(boxLine(`  CRITICAL: ${critical.length}`, width));
              lines.push(boxLine(`  WARN:     ${warn.length}`, width));
            }

            lines.push(boxBottom(width));
            return { output: lines.join('\n'), exitCode: 0 };
          }

          case 'resolve':
          case 'fix': {
            const eventId = tokens.args[1];
            if (!eventId) {
              return { output: err('Usage: telemetry drift resolve <event-id>'), exitCode: 1 };
            }
            const result = resolveDriftEvent(eventId);
            if (!result.success) {
              return { output: err(result.error || 'Failed to resolve drift'), exitCode: 1 };
            }
            return { output: success(`Drift event resolved: ${eventId}`), exitCode: 0 };
          }

          default:
            return {
              output: err(
                `Unknown drift subcommand: ${sub2}\n` +
                'Usage: telemetry drift list | telemetry drift check | telemetry drift resolve <id>'
              ),
              exitCode: 1,
            };
        }
      }

      default:
        return {
          output: err(
            `Unknown telemetry subcommand: ${sub}\n` +
            'Usage: telemetry | telemetry baseline | telemetry read | telemetry record | telemetry drift'
          ),
          exitCode: 1,
        };
    }
  },
});

// ──────────────────────────────────────────────────────────────────────────────
// 11. STATUS FAMILY
// ──────────────────────────────────────────────────────────────────────────────

register({
  names: ['status'],
  family: 'status',
  description: 'Show the full system status report',
  usage: 'status',
  minArgs: 0,
  maxArgs: 0,
  handler(): CommandResult {
    return { output: statusReport(), exitCode: 0 };
  },
});

register({
  names: ['health'],
  family: 'status',
  description: 'Run runtime health checks',
  usage: 'health',
  minArgs: 0,
  maxArgs: 0,
  handler(): CommandResult {
    return { output: healthReport(), exitCode: 0 };
  },
});

register({
  names: ['audit'],
  family: 'status',
  description: 'Run a full evidence audit across all capabilities',
  usage: 'audit',
  minArgs: 0,
  maxArgs: 0,
  handler(): CommandResult {
    return { output: EvidenceRuntime.audit(), exitCode: 0 };
  },
});

register({
  names: ['verify'],
  family: 'status',
  description: 'Verify all capabilities against constitutional rules',
  usage: 'verify',
  minArgs: 0,
  maxArgs: 0,
  handler(): CommandResult {
    return { output: DecisionRuntime.run(), exitCode: 0 };
  },
});

// ──────────────────────────────────────────────────────────────────────────────
// 12. PATTERNS FAMILY
// ──────────────────────────────────────────────────────────────────────────────

register({
  names: ['patterns', 'pat'],
  family: 'patterns',
  description: 'List architectural patterns and their applicability',
  usage: 'patterns',
  minArgs: 0,
  maxArgs: 0,
  handler(): CommandResult {
    const patterns = PATTERNS;
    const width = 76;

    const lines: string[] = [];
    lines.push(boxTop(width));
    lines.push(boxLine(accent(`ARCHITECTURAL PATTERNS  (${patterns.length} patterns)`), width));
    lines.push(boxMidSep(width));
    lines.push(boxLine(
      `${pad('ID', 16)} ${pad('TITLE', 30)} ${pad('REFS', 8)} ${pad('TRADEOFFS', 16)}`,
      width,
    ));
    lines.push(boxMidSep(width));

    for (const pat of patterns) {
      lines.push(boxLine(
        `${accent(pad(pat.id, 16))} ${pad(truncate(pat.title, 30), 30)} ${pad(String(pat.references.length), 8)} ${pad(String(pat.tradeoffs.length), 16)}`,
        width,
      ));
    }

    lines.push(boxMidSep(width));
    lines.push(boxLine(dim('Use "patterns <id>" for details'), width));
    lines.push(boxBottom(width));
    return { output: lines.join('\n'), exitCode: 0 };
  },
});

// ──────────────────────────────────────────────────────────────────────────────
// 13. EXPORT / REPORT FAMILY
// ──────────────────────────────────────────────────────────────────────────────

register({
  names: ['export'],
  family: 'export',
  description: 'Export system data as JSON',
  usage: 'export [capabilities|rules|graph|adrs|rfcs|gate]',
  minArgs: 0,
  maxArgs: 1,
  handler(tokens): CommandResult {
    const target = (tokens.args[0] || 'snapshot').toLowerCase();
    switch (target) {
      case 'snapshot':
      case 'all':
        return { output: JSON.stringify(getStoreSnapshot(), null, 2), exitCode: 0 };

      case 'capabilities':
      case 'caps':
        return { output: JSON.stringify(CAPABILITIES, null, 2), exitCode: 0 };

      case 'rules':
        return { output: JSON.stringify(RULES, null, 2), exitCode: 0 };

      case 'graph':
        return { output: KnowledgeRuntime.export(), exitCode: 0 };

      case 'adrs':
        return { output: ADRRuntime.export(), exitCode: 0 };

      case 'rfcs':
        return { output: JSON.stringify(listRFCs(), null, 2), exitCode: 0 };

      case 'gate':
        return { output: DecisionRuntime.json(), exitCode: 0 };

      default:
        return {
          output: err(`Unknown export target: ${target}\nValid: capabilities, rules, graph, adrs, rfcs, gate, snapshot`),
          exitCode: 1,
        };
    }
  },
});

register({
  names: ['report'],
  family: 'export',
  description: 'Generate a formatted report',
  usage: 'report [full|status|gate|evidence]',
  minArgs: 0,
  maxArgs: 1,
  handler(tokens): CommandResult {
    const target = (tokens.args[0] || 'full').toLowerCase();
    switch (target) {
      case 'full':
        return { output: statusReport(), exitCode: 0 };

      case 'status':
        return { output: statusReport(), exitCode: 0 };

      case 'gate':
        return { output: DecisionRuntime.run(), exitCode: 0 };

      case 'evidence':
        return { output: EvidenceRuntime.audit(), exitCode: 0 };

      default:
        return {
          output: err(`Unknown report type: ${target}\nValid: full, status, gate, evidence`),
          exitCode: 1,
        };
    }
  },
});

// ──────────────────────────────────────────────────────────────────────────────
// 14. SEARCH FAMILY
// ──────────────────────────────────────────────────────────────────────────────

register({
  names: ['search', 'find', 'grep'],
  family: 'search',
  description: 'Search across capabilities, rules, or evidence',
  usage: 'search <scope> <pattern>',
  minArgs: 2,
  maxArgs: 2,
  handler(tokens): CommandResult {
    const scope = tokens.args[0].toLowerCase();
    const pattern = tokens.args[1].toLowerCase();
    const width = 72;

    const lines: string[] = [];
    lines.push(boxTop(width));
    lines.push(boxLine(accent(`SEARCH: "${pattern}" in ${scope}`), width));
    lines.push(boxMidSep(width));

    let found = 0;

    switch (scope) {
      case 'capabilities':
      case 'caps': {
        for (const cap of CAPABILITIES) {
          const searchable = `${cap.id} ${cap.title} ${cap.description} ${cap.owner}`.toLowerCase();
          if (searchable.includes(pattern)) {
            lines.push(boxLine(`  ${success('\u2714')} ${accent(cap.id)}: ${truncate(cap.title, 50)}`, width));
            found++;
          }
        }
        break;
      }

      case 'rules': {
        for (const rule of RULES) {
          const searchable = `${rule.id} ${rule.title} ${rule.description}`.toLowerCase();
          if (searchable.includes(pattern)) {
            lines.push(boxLine(`  ${success('\u2714')} ${accent(rule.id)}: ${truncate(rule.title, 50)}`, width));
            found++;
          }
        }
        break;
      }

      case 'evidence': {
        const allFields = new Set<string>();
        for (const [, reqs] of Object.entries(RULE_EVIDENCE_REQUIREMENTS)) {
          for (const r of reqs) allFields.add(r);
        }
        for (const field of allFields) {
          if (field.toLowerCase().includes(pattern)) {
            const usedBy = Object.entries(RULE_EVIDENCE_REQUIREMENTS)
              .filter(([, reqs]) => reqs.includes(field))
              .map(([ruleId]) => ruleId);
            lines.push(boxLine(`  ${success('\u2714')} ${accent(field)} (used by: ${usedBy.join(', ')})`, width));
            found++;
          }
        }
        break;
      }

      case 'adrs': {
        for (const adr of ADRS) {
          const searchable = `${adr.id} ${adr.title} ${adr.context} ${adr.decision}`.toLowerCase();
          if (searchable.includes(pattern)) {
            lines.push(boxLine(`  ${success('\u2714')} ${accent(adr.id)}: ${truncate(adr.title, 50)}`, width));
            found++;
          }
        }
        break;
      }

      case 'rfcs': {
        const rfcs = listRFCs();
        for (const rfc of rfcs) {
          const searchable = `${rfc.id} ${rfc.title} ${rfc.author} ${rfc.summary}`.toLowerCase();
          if (searchable.includes(pattern)) {
            lines.push(boxLine(`  ${success('\u2714')} ${accent(rfc.id)}: ${truncate(rfc.title, 50)}`, width));
            found++;
          }
        }
        break;
      }

      case 'patterns': {
        for (const pat of PATTERNS) {
          const searchable = `${pat.id} ${pat.title} ${pat.description} ${pat.applicability.join(' ')}`.toLowerCase();
          if (searchable.includes(pattern)) {
            lines.push(boxLine(`  ${success('\u2714')} ${accent(pat.id)}: ${truncate(pat.title, 50)}`, width));
            found++;
          }
        }
        break;
      }

      case 'failures':
      case 'hard-failures': {
        for (const hf of HARD_FAILURES) {
          const searchable = `${hf.id} ${hf.title} ${hf.description} ${hf.remediation}`.toLowerCase();
          if (searchable.includes(pattern)) {
            lines.push(boxLine(`  ${err('\u2718')} ${accent(hf.id)}: ${truncate(hf.title, 50)} [${hf.severity}]`, width));
            found++;
          }
        }
        break;
      }

      case 'debt': {
        for (const item of CONSTITUTIONAL_DEBT) {
          const searchable = `${item.id} ${item.title} ${item.description}`.toLowerCase();
          if (searchable.includes(pattern)) {
            lines.push(boxLine(`  ${warn('~')} ${accent(item.id)}: ${truncate(item.title, 50)} [${item.severity}]`, width));
            found++;
          }
        }
        break;
      }

      default: {
        lines.push(boxLine(err(`Unknown search scope: ${scope}`), width));
        lines.push(boxLine(dim('Valid scopes: capabilities, rules, evidence, adrs, rfcs, patterns, failures, debt'), width));
      }
    }

    lines.push(boxMidSep(width));
    lines.push(boxLine(`Results: ${found} match(es)`, width));
    lines.push(boxBottom(width));
    return { output: lines.join('\n'), exitCode: found > 0 ? 0 : 1 };
  },
});

// ──────────────────────────────────────────────────────────────────────────────
// 15. THEME FAMILY
// ──────────────────────────────────────────────────────────────────────────────

register({
  names: ['theme'],
  family: 'theme',
  description: 'Set the terminal color theme',
  usage: 'theme green|amber|white',
  minArgs: 1,
  maxArgs: 1,
  handler(tokens): CommandResult {
    const name = tokens.args[0].toLowerCase() as ThemeName;
    if (!THEMES[name]) {
      return {
        output: err(`Unknown theme: ${name}\nValid themes: green, amber, white`),
        exitCode: 1,
      };
    }
    currentTheme = name;
    const width = 44;
    const lines: string[] = [];
    lines.push(boxTop(width));
    lines.push(boxLine(success(`Theme set to: ${name}`), width));
    lines.push(boxLine(`${accent('Sample: ')} box-drawing works`, width));
    lines.push(boxBottom(width));
    return { output: lines.join('\n'), exitCode: 0 };
  },
});

// ──────────────────────────────────────────────────────────────────────────────
// 16. CRT FAMILY
// ──────────────────────────────────────────────────────────────────────────────

register({
  names: ['crt'],
  family: 'crt',
  description: 'Toggle CRT phosphor styling',
  usage: 'crt on|off',
  minArgs: 1,
  maxArgs: 1,
  handler(tokens): CommandResult {
    const arg = tokens.args[0].toLowerCase();
    if (arg === 'on') {
      crtEnabled = true;
      return { output: success('CRT styling enabled'), exitCode: 0 };
    }
    if (arg === 'off') {
      crtEnabled = false;
      return { output: 'CRT styling disabled', exitCode: 0 };
    }
    return {
      output: err(`Invalid argument: ${arg}\nUsage: crt on|off`),
      exitCode: 1,
    };
  },
});

// ──────────────────────────────────────────────────────────────────────────────
// 17. SOUND FAMILY
// ──────────────────────────────────────────────────────────────────────────────

register({
  names: ['sound'],
  family: 'sound',
  description: 'Toggle terminal sound effects',
  usage: 'sound on|off',
  minArgs: 1,
  maxArgs: 1,
  handler(tokens): CommandResult {
    const arg = tokens.args[0].toLowerCase();
    if (arg === 'on') {
      soundEnabled = true;
      return { output: success('Sound effects enabled'), exitCode: 0 };
    }
    if (arg === 'off') {
      soundEnabled = false;
      return { output: 'Sound effects disabled', exitCode: 0 };
    }
    return {
      output: err(`Invalid argument: ${arg}\nUsage: sound on|off`),
      exitCode: 1,
    };
  },
});

// ──────────────────────────────────────────────────────────────────────────────
// 18. FILESYSTEM FAMILY
// ──────────────────────────────────────────────────────────────────────────────

register({
  names: ['ls'],
  family: 'filesystem',
  description: 'List directory contents',
  usage: 'ls [path]',
  minArgs: 0,
  maxArgs: 1,
  handler(tokens): CommandResult {
    const path = tokens.args[0] || '.';
    try {
      const result = filesystem.ls(path);
      const width = 64;
      const lines: string[] = [];
      lines.push(boxTop(width));
      lines.push(boxLine(accent(`LS: ${path}`), width));
      lines.push(boxMidSep(width));

      if (result.entries.length === 0) {
        lines.push(boxLine(dim('  (empty)'), width));
      } else {
        for (const entry of result.entries) {
          const icon = entry.isDirectory ? '\u25bc' : '\u25b8';
          const name = entry.isDirectory ? bold(entry.name) : entry.name;
          lines.push(boxLine(`  ${icon} ${pad(name, 40)} ${dim(entry.size ?? '')}`, width));
        }
      }

      lines.push(boxMidSep(width));
      lines.push(boxLine(`${result.entries.length} entries`, width));
      lines.push(boxBottom(width));
      return { output: lines.join('\n'), exitCode: 0 };
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      return { output: err(`ls failed: ${msg}`), exitCode: 1 };
    }
  },
});

register({
  names: ['cd'],
  family: 'filesystem',
  description: 'Change the current directory',
  usage: 'cd <path>',
  minArgs: 1,
  maxArgs: 1,
  handler(tokens): CommandResult {
    const path = tokens.args[0];
    try {
      const result = filesystem.cd(path);
      if (result.success) {
        return { output: success(`Changed to: ${result.cwd}`), exitCode: 0 };
      }
      return { output: err(result.error || 'Failed to change directory'), exitCode: 1 };
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      return { output: err(`cd failed: ${msg}`), exitCode: 1 };
    }
  },
});

register({
  names: ['cat'],
  family: 'filesystem',
  description: 'Display file contents',
  usage: 'cat <path>',
  minArgs: 1,
  maxArgs: 1,
  handler(tokens): CommandResult {
    const path = tokens.args[0];
    try {
      const result = filesystem.cat(path);
      const width = 76;
      const lines: string[] = [];
      lines.push(boxTop(width));
      lines.push(boxLine(accent(`FILE: ${path}`), width));
      lines.push(boxMidSep(width));

      for (const line of result.content.split('\n')) {
        lines.push(boxLine(`  ${line}`, width));
      }

      lines.push(boxMidSep(width));
      lines.push(boxLine(`${result.lineCount} lines`, width));
      lines.push(boxBottom(width));
      return { output: lines.join('\n'), exitCode: 0 };
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      return { output: err(`cat failed: ${msg}`), exitCode: 1 };
    }
  },
});

register({
  names: ['pwd'],
  family: 'filesystem',
  description: 'Print the current working directory',
  usage: 'pwd',
  minArgs: 0,
  maxArgs: 0,
  handler(): CommandResult {
    try {
      const cwd = filesystem.pwd();
      return { output: cwd, exitCode: 0 };
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      return { output: err(`pwd failed: ${msg}`), exitCode: 1 };
    }
  },
});

register({
  names: ['tree'],
  family: 'filesystem',
  description: 'Display directory tree',
  usage: 'tree [path] [--depth N]',
  minArgs: 0,
  maxArgs: 1,
  handler(tokens): CommandResult {
    const path = tokens.args[0] || '.';
    const depth = parseInt(tokens.flags.depth || '3', 10);
    try {
      const result = filesystem.tree(path, depth);
      const width = 72;
      const lines: string[] = [];
      lines.push(boxTop(width));
      lines.push(boxLine(accent(`TREE: ${path}`), width));
      lines.push(boxMidSep(width));

      for (const entry of result.entries) {
        lines.push(boxLine(`  ${entry}`, width));
      }

      lines.push(boxMidSep(width));
      lines.push(boxLine(`${result.totalFiles} files, ${result.totalDirs} directories`, width));
      lines.push(boxBottom(width));
      return { output: lines.join('\n'), exitCode: 0 };
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      return { output: err(`tree failed: ${msg}`), exitCode: 1 };
    }
  },
});

register({
  names: ['find'],
  family: 'filesystem',
  description: 'Find files matching a pattern',
  usage: 'find <pattern> [path]',
  minArgs: 1,
  maxArgs: 2,
  handler(tokens): CommandResult {
    const pattern = tokens.args[0];
    const path = tokens.args[1] || '.';
    try {
      const result = filesystem.find(pattern, path);
      const width = 72;
      const lines: string[] = [];
      lines.push(boxTop(width));
      lines.push(boxLine(accent(`FIND: "${pattern}" in ${path}`), width));
      lines.push(boxMidSep(width));

      if (result.matches.length === 0) {
        lines.push(boxLine(dim('  No matches found'), width));
      } else {
        for (const match of result.matches.slice(0, 50)) {
          lines.push(boxLine(`  \u25b8 ${match}`, width));
        }
        if (result.matches.length > 50) {
          lines.push(boxLine(dim(`  ... and ${result.matches.length - 50} more`), width));
        }
      }

      lines.push(boxMidSep(width));
      lines.push(boxLine(`${result.matches.length} match(es)`, width));
      lines.push(boxBottom(width));
      return { output: lines.join('\n'), exitCode: result.matches.length > 0 ? 0 : 1 };
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      return { output: err(`find failed: ${msg}`), exitCode: 1 };
    }
  },
});

register({
  names: ['fgrep'],
  family: 'filesystem',
  description: 'Search file contents by pattern',
  usage: 'grep <pattern> <path>',
  minArgs: 2,
  maxArgs: 2,
  handler(tokens): CommandResult {
    const pattern = tokens.args[0];
    const path = tokens.args[1];
    try {
      const result = filesystem.grep(pattern, path);
      const width = 76;
      const lines: string[] = [];
      lines.push(boxTop(width));
      lines.push(boxLine(accent(`GREP: "${pattern}" in ${path}`), width));
      lines.push(boxMidSep(width));

      if (result.matches.length === 0) {
        lines.push(boxLine(dim('  No matches'), width));
      } else {
        for (const m of result.matches.slice(0, 50)) {
          lines.push(boxLine(`  ${accent(m.lineNumber)}: ${m.line}`, width));
        }
        if (result.matches.length > 50) {
          lines.push(boxLine(dim(`  ... and ${result.matches.length - 50} more`), width));
        }
      }

      lines.push(boxMidSep(width));
      lines.push(boxLine(`${result.matches.length} match(es) in ${result.filesScanned} file(s)`, width));
      lines.push(boxBottom(width));
      return { output: lines.join('\n'), exitCode: result.matches.length > 0 ? 0 : 1 };
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      return { output: err(`grep failed: ${msg}`), exitCode: 1 };
    }
  },
});

// ──────────────────────────────────────────────────────────────────────────────
// 19. TERMINAL FAMILY
// ──────────────────────────────────────────────────────────────────────────────

register({
  names: ['clear', 'cls'],
  family: 'terminal',
  description: 'Clear the terminal screen',
  usage: 'clear',
  minArgs: 0,
  maxArgs: 0,
  handler(): CommandResult {
    return { output: '\x1b[2J\x1b[H', exitCode: 0 };
  },
});

// ──────────────────────────────────────────────────────────────────────────────
// 20. VERSION / INFO FAMILY
// ──────────────────────────────────────────────────────────────────────────────

register({
  names: ['version', 'ver', 'about'],
  family: 'info',
  description: 'Show AIR version and system info',
  usage: 'version',
  minArgs: 0,
  maxArgs: 0,
  handler(): CommandResult {
    const width = 56;
    const lines: string[] = [];
    lines.push(boxTop(width));
    lines.push(boxLine(accent('VVU AIR \u2014 Adaptive Intelligence Runtime'), width));
    lines.push(boxMidSep(width));
    lines.push(boxLine(`Version:      ${AIR_CONFIG.version}`, width));
    lines.push(boxLine(`Codename:     ${AIR_CONFIG.codename}`, width));
    lines.push(boxLine(`Status:       ${AIR_CONFIG.status}`, width));
    lines.push(boxLine(`Last Updated: ${AIR_CONFIG.lastUpdated}`, width));
    lines.push(boxMidSep(width));
    lines.push(boxLine(`Capabilities: ${AIR_CONFIG.capabilityCount}`, width));
    lines.push(boxLine(`Rules:        ${AIR_CONFIG.ruleCount}`, width));
    lines.push(boxLine(`Patterns:     ${AIR_CONFIG.patternCount}`, width));
    lines.push(boxLine(`ADRs:         ${AIR_CONFIG.adrCount}`, width));
    lines.push(boxLine(`RFCs:         ${AIR_CONFIG.rfcCount}`, width));
    lines.push(boxMidSep(width));
    lines.push(boxLine(`Hard Failures:    ${AIR_CONFIG.hardFailureCount}`, width));
    lines.push(boxLine(`Open Blockers:    ${AIR_CONFIG.openBlockerCount}`, width));
    lines.push(boxMidSep(width));
    lines.push(boxLine(dim(`Theme: ${currentTheme} | CRT: ${crtEnabled ? 'on' : 'off'} | Sound: ${soundEnabled ? 'on' : 'off'}`), width));
    lines.push(boxBottom(width));
    return { output: lines.join('\n'), exitCode: 0 };
  },
});

// ──────────────────────────────────────────────────────────────────────────────
// 21. SNAPSHOTS FAMILY
// ──────────────────────────────────────────────────────────────────────────────

register({
  names: ['snapshot', 'snap'],
  family: 'snapshot',
  description: 'Show the current store snapshot',
  usage: 'snapshot',
  minArgs: 0,
  maxArgs: 0,
  handler(): CommandResult {
    const snap = getStoreSnapshot();
    const width = 64;

    const lines: string[] = [];
    lines.push(boxTop(width));
    lines.push(boxLine(accent('STORE SNAPSHOT'), width));
    lines.push(boxMidSep(width));
    lines.push(boxLine(`Version:            ${snap.version}`, width));
    lines.push(boxLine(`Constitution Vers:  ${snap.constitutionVersions.length}`, width));
    lines.push(boxLine(`Baselines:          ${Object.keys(snap.telemetryBaselines).length}`, width));
    lines.push(boxLine(`Readings:           ${snap.telemetryReadingsCount}`, width));
    lines.push(boxLine(`Drift Events:       ${snap.driftEventsCount}`, width));
    lines.push(boxLine(`  Unresolved:       ${snap.unresolvedDriftEvents}`, width));
    lines.push(boxLine(`Evidence Entries:   ${snap.evidenceCount}`, width));
    lines.push(boxLine(`Active Rules:       ${snap.activeRulesCount}`, width));
    lines.push(boxLine(`Custom Rules:       ${snap.customRulesCount}`, width));
    lines.push(boxLine(`RFCs:               ${snap.rfcCount}`, width));
    lines.push(boxBottom(width));
    return { output: lines.join('\n'), exitCode: 0 };
  },
});

// ──────────────────────────────────────────────────────────────────────────────
// 22. EVIDENCE FIELDS FAMILY (shortcut)
// ──────────────────────────────────────────────────────────────────────────────

register({
  names: ['fields'],
  family: 'evidence',
  description: 'List valid evidence field types',
  usage: 'fields',
  minArgs: 0,
  maxArgs: 0,
  handler(): CommandResult {
    const width = 44;
    const lines: string[] = [];
    lines.push(boxTop(width));
    lines.push(boxLine(accent(`VALID EVIDENCE FIELDS  (${VALID_EVIDENCE_FIELDS.length})`), width));
    lines.push(boxMidSep(width));

    for (const field of VALID_EVIDENCE_FIELDS) {
      lines.push(boxLine(`  \u2022 ${accent(field)}`, width));
    }

    lines.push(boxBottom(width));
    return { output: lines.join('\n'), exitCode: 0 };
  },
});

// ──────────────────────────────────────────────────────────────────────────────
// 23. HISTORY / LOG FAMILY
// ──────────────────────────────────────────────────────────────────────────────

register({
  names: ['history', 'log'],
  family: 'history',
  description: 'Show gate run history or drift event log',
  usage: 'history [gate|drift]',
  minArgs: 0,
  maxArgs: 1,
  handler(tokens): CommandResult {
    const target = (tokens.args[0] || 'gate').toLowerCase();
    switch (target) {
      case 'gate':
        return { output: DecisionRuntime.history(), exitCode: 0 };

      case 'drift':
        return { output: TelemetryRuntime.drift(), exitCode: 0 };

      default:
        return {
          output: err(`Unknown history type: ${target}\nValid: gate, drift`),
          exitCode: 1,
        };
    }
  },
});

// ──────────────────────────────────────────────────────────────────────────────
// 24. CONFIG FAMILY
// ──────────────────────────────────────────────────────────────────────────────

register({
  names: ['config', 'cfg', 'settings'],
  family: 'config',
  description: 'View or modify AIR configuration',
  usage: 'config show | config theme <name> | config crt <on|off> | config sound <on|off>',
  minArgs: 0,
  maxArgs: 2,
  handler(tokens): CommandResult {
    const sub = (tokens.subcommand || 'show').toLowerCase();
    switch (sub) {
      case 'show':
      case 'get': {
        const width = 52;
        const lines: string[] = [];
        lines.push(boxTop(width));
        lines.push(boxLine(accent('AIR CONFIGURATION'), width));
        lines.push(boxMidSep(width));
        lines.push(boxLine(`Version:    ${AIR_CONFIG.version}`, width));
        lines.push(boxLine(`Codename:   ${AIR_CONFIG.codename}`, width));
        lines.push(boxLine(`Status:     ${AIR_CONFIG.status}`, width));
        lines.push(boxLine(`Theme:      ${currentTheme}`, width));
        lines.push(boxLine(`CRT:        ${crtEnabled ? 'enabled' : 'disabled'}`, width));
        lines.push(boxLine(`Sound:      ${soundEnabled ? 'enabled' : 'disabled'}`, width));
        lines.push(boxBottom(width));
        return { output: lines.join('\n'), exitCode: 0 };
      }

      case 'theme': {
        const name = tokens.args[0]?.toLowerCase() as ThemeName;
        if (!name || !THEMES[name]) {
          return { output: err('Usage: config theme <green|amber|white>'), exitCode: 1 };
        }
        currentTheme = name;
        return { output: success(`Theme changed to: ${name}`), exitCode: 0 };
      }

      case 'crt': {
        const val = tokens.args[0]?.toLowerCase();
        if (val === 'on') { crtEnabled = true; return { output: success('CRT enabled'), exitCode: 0 }; }
        if (val === 'off') { crtEnabled = false; return { output: 'CRT disabled', exitCode: 0 }; }
        return { output: err('Usage: config crt <on|off>'), exitCode: 1 };
      }

      case 'sound': {
        const val = tokens.args[0]?.toLowerCase();
        if (val === 'on') { soundEnabled = true; return { output: success('Sound enabled'), exitCode: 0 }; }
        if (val === 'off') { soundEnabled = false; return { output: 'Sound disabled', exitCode: 0 }; }
        return { output: err('Usage: config sound <on|off>'), exitCode: 1 };
      }

      default:
        return {
          output: err(`Unknown config subcommand: ${sub}\nUsage: config show | config theme | config crt | config sound`),
          exitCode: 1,
        };
    }
  },
});

// ──────────────────────────────────────────────────────────────────────────────
// 25. DIFF FAMILY
// ──────────────────────────────────────────────────────────────────────────────

register({
  names: ['diff'],
  family: 'diff',
  description: 'Compare two capabilities or ADRs',
  usage: 'diff <scope> <a> <b>',
  minArgs: 3,
  maxArgs: 3,
  handler(tokens): CommandResult {
    const scope = tokens.args[0].toLowerCase();
    const a = tokens.args[1];
    const b = tokens.args[2];

    switch (scope) {
      case 'adr':
      case 'adrs':
        return { output: ADRRuntime.diff(a, b), exitCode: 0 };

      case 'cap':
      case 'capability':
      case 'capabilities': {
        const capA = CAPABILITIES.find(c => c.id === a);
        const capB = CAPABILITIES.find(c => c.id === b);
        if (!capA) return { output: err(`Capability not found: ${a}`), exitCode: 1 };
        if (!capB) return { output: err(`Capability not found: ${b}`), exitCode: 1 };

        const width = 72;
        const lines: string[] = [];
        lines.push(boxTop(width));
        lines.push(boxLine(accent(`DIFF: ${a} \u2194 ${b}`), width));
        lines.push(boxMidSep(width));

        const fields: Array<[string, string, string]> = [
          ['Title', capA.title, capB.title],
          ['Class', capA.classification, capB.classification],
          ['Mat.', capA.maturity, capB.maturity],
          ['Owner', capA.owner, capB.owner],
          ['Evid.', String(capA.evidence.length), String(capB.evidence.length)],
        ];

        let diffCount = 0;
        for (const [field, valA, valB] of fields) {
          const same = valA === valB;
          if (!same) diffCount++;
          const icon = same ? '=' : '\u2260';
          lines.push(boxLine(
            `  ${icon} ${pad(field, 10)} ${pad(truncate(valA, 26), 26)} | ${pad(truncate(valB, 26), 26)}`,
            width,
          ));
        }

        lines.push(boxMidSep(width));
        lines.push(boxLine(`Differences: ${diffCount} field(s) differ`, width));
        lines.push(boxBottom(width));
        return { output: lines.join('\n'), exitCode: 0 };
      }

      default:
        return {
          output: err(`Unknown diff scope: ${scope}\nValid: adr, cap`),
          exitCode: 1,
        };
    }
  },
});

// ──────────────────────────────────────────────────────────────────────────────
// 26. HELPERS FAMILY
// ──────────────────────────────────────────────────────────────────────────────

register({
  names: ['families'],
  family: 'info',
  description: 'List all command families',
  usage: 'families',
  minArgs: 0,
  maxArgs: 0,
  handler(): CommandResult {
    const families: Record<string, string[]> = {};
    for (const cmd of COMMAND_REGISTRY) {
      if (!families[cmd.family]) families[cmd.family] = [];
      families[cmd.family].push(...cmd.names);
    }

    const width = 64;
    const lines: string[] = [];
    lines.push(boxTop(width));
    lines.push(boxLine(accent('COMMAND FAMILIES'), width));
    lines.push(boxMidSep(width));

    for (const [family, cmds] of Object.entries(families)) {
      lines.push(boxLine(bold(`  ${family.toUpperCase()}`), width));
      const unique = [...new Set(cmds)];
      for (const cmd of unique) {
        lines.push(boxLine(`    ${accent(pad(cmd, 18))}`, width));
      }
    }

    lines.push(boxMidSep(width));
    lines.push(boxLine(`${COMMAND_REGISTRY.length} commands registered`, width));
    lines.push(boxBottom(width));
    return { output: lines.join('\n'), exitCode: 0 };
  },
});

register({
  names: ['count'],
  family: 'info',
  description: 'Count registered commands and entries',
  usage: 'count',
  minArgs: 0,
  maxArgs: 0,
  handler(): CommandResult {
    const families: Record<string, number> = {};
    for (const cmd of COMMAND_REGISTRY) {
      families[cmd.family] = (families[cmd.family] || 0) + 1;
    }

    const width = 48;
    const lines: string[] = [];
    lines.push(boxTop(width));
    lines.push(boxLine(accent('COMMAND COUNT'), width));
    lines.push(boxMidSep(width));

    for (const [family, count] of Object.entries(families).sort((a, b) => b[1] - a[1])) {
      lines.push(boxLine(`  ${pad(family, 24)} ${String(count).padStart(4)}`, width));
    }

    lines.push(boxMidSep(width));
    lines.push(boxLine(`  ${bold('TOTAL')} ${String(COMMAND_REGISTRY.length).padStart(20)}`, width));
    lines.push(boxBottom(width));
    return { output: lines.join('\n'), exitCode: 0 };
  },
});

// ──────────────────────────────────────────────────────────────────────────────
// 27. WHOAMI FAMILY
// ──────────────────────────────────────────────────────────────────────────────

register({
  names: ['whoami'],
  family: 'info',
  description: 'Display the current AIR session context',
  usage: 'whoami',
  minArgs: 0,
  maxArgs: 0,
  handler(): CommandResult {
    const snap = getStoreSnapshot();
    const width = 48;
    const lines: string[] = [];
    lines.push(boxTop(width));
    lines.push(boxLine(accent('SESSION CONTEXT'), width));
    lines.push(boxMidSep(width));
    lines.push(boxLine(`AIR Version:   ${AIR_CONFIG.version}`, width));
    lines.push(boxLine(`Constitution:  ${snap.version}`, width));
    lines.push(boxLine(`Theme:         ${currentTheme}`, width));
    lines.push(boxLine(`CRT:           ${crtEnabled ? 'on' : 'off'}`, width));
    lines.push(boxLine(`Sound:         ${soundEnabled ? 'on' : 'off'}`, width));
    lines.push(boxLine(`Session Time:  ${new Date().toISOString()}`, width));
    lines.push(boxBottom(width));
    return { output: lines.join('\n'), exitCode: 0 };
  },
});

// ──────────────────────────────────────────────────────────────────────────────
// 28. DATE / TIME FAMILY
// ──────────────────────────────────────────────────────────────────────────────

register({
  names: ['date', 'time', 'now'],
  family: 'info',
  description: 'Show current date and time',
  usage: 'date',
  minArgs: 0,
  maxArgs: 0,
  handler(): CommandResult {
    const now = new Date();
    return {
      output: now.toISOString(),
      exitCode: 0,
    };
  },
});

// ──────────────────────────────────────────────────────────────────────────────
// 29. QUIET / VERBOSE MODE TOGGLES
// ──────────────────────────────────────────────────────────────────────────────

register({
  names: ['quiet', 'silent'],
  family: 'terminal',
  description: 'Reduce output verbosity',
  usage: 'quiet <command>',
  minArgs: 1,
  maxArgs: 10,
  handler(tokens): CommandResult {
    const subInput = tokens.args.join(' ');
    const subTokens = tokenize(subInput);
    const cmd = COMMAND_REGISTRY.find(c => c.names.includes(subTokens.command));
    if (!cmd) {
      return { output: err(`Unknown command: ${subTokens.command}`), exitCode: 1 };
    }

    const result = cmd.handler(subTokens);
    const lines = result.output.split('\n');

    const filtered = lines.filter(line =>
      !line.includes('\u2500') &&
      !line.includes('\u2502') &&
      !line.includes('\u250c') &&
      !line.includes('\u2510') &&
      !line.includes('\u2514') &&
      !line.includes('\u2518') &&
      line.trim().length > 0
    );

    return { ...result, output: filtered.join('\n') };
  },
});

// ──────────────────────────────────────────────────────────────────────────────
// Completion Table (for tab completion)
// ──────────────────────────────────────────────────────────────────────────────

const COMPLETION_TABLE: string[] = [];

function buildCompletionTable(): void {
  if (COMPLETION_TABLE.length > 0) return;

  const families: Record<string, string[]> = {};
  for (const cmd of COMMAND_REGISTRY) {
    if (!families[cmd.family]) families[cmd.family] = [];
    for (const name of cmd.names) {
      if (!families[cmd.family].includes(name)) {
        families[cmd.family].push(name);
      }
    }
  }

  for (const cmds of Object.values(families)) {
    for (const name of cmds) {
      COMPLETION_TABLE.push(name);
    }
  }

  const subcmds = [
    'cap list', 'cap show', 'cap validate',
    'rule list', 'rule run', 'rule explain', 'rule enable', 'rule disable', 'rule test',
    'evidence list', 'evidence verify', 'evidence attach', 'evidence detach', 'evidence fields', 'evidence missing', 'evidence audit',
    'gate', 'gate explain', 'gate json', 'gate html', 'gate history',
    'graph', 'graph stats', 'graph export', 'graph explain', 'graph query',
    'adr list', 'adr generate', 'adr diff', 'adr export',
    'rfc list', 'rfc show', 'rfc create', 'rfc advance', 'rfc reject',
    'constitution', 'constitution versions', 'constitution promote',
    'telemetry', 'telemetry baseline', 'telemetry read', 'telemetry record', 'telemetry drift',
    'export capabilities', 'export rules', 'export graph', 'export adrs', 'export rfcs', 'export gate', 'export snapshot',
    'report full', 'report status', 'report gate', 'report evidence',
    'search capabilities', 'search rules', 'search evidence', 'search adrs', 'search rfcs', 'search patterns', 'search failures', 'search debt',
    'theme green', 'theme amber', 'theme white',
    'crt on', 'crt off',
    'sound on', 'sound off',
    'history gate', 'history drift',
    'config show', 'config theme', 'config crt', 'config sound',
    'diff adr', 'diff cap',
  ];

  COMPLETION_TABLE.push(...subcmds);

  const capIds = CAPABILITIES.map(c => c.id);
  const ruleIds = RULES.map(r => r.id);

  for (const capId of capIds) {
    COMPLETION_TABLE.push(`cap show ${capId}`);
    COMPLETION_TABLE.push(`cap validate ${capId}`);
    COMPLETION_TABLE.push(`evidence verify ${capId}`);
  }

  for (const ruleId of ruleIds) {
    COMPLETION_TABLE.push(`rule explain ${ruleId}`);
    COMPLETION_TABLE.push(`rule enable ${ruleId}`);
    COMPLETION_TABLE.push(`rule disable ${ruleId}`);
    COMPLETION_TABLE.push(`rule test ${ruleId}`);
  }

  for (const field of VALID_EVIDENCE_FIELDS) {
    COMPLETION_TABLE.push(`evidence fields`);
    COMPLETION_TABLE.push(`search evidence ${field}`);
  }

  const adrIds = ADRS.map(a => a.id);
  for (const id of adrIds) {
    COMPLETION_TABLE.push(`adr export ${id}`);
    for (const other of adrIds) {
      if (id !== other) {
        COMPLETION_TABLE.push(`adr diff ${id} ${other}`);
      }
    }
  }

  const rfcs = listRFCs();
  for (const rfc of rfcs) {
    COMPLETION_TABLE.push(`rfc show ${rfc.id}`);
    COMPLETION_TABLE.push(`rfc advance ${rfc.id}`);
    COMPLETION_TABLE.push(`rfc reject ${rfc.id}`);
  }
}

buildCompletionTable();

// ──────────────────────────────────────────────────────────────────────────────
// Tab Completion
// ──────────────────────────────────────────────────────────────────────────────

export function complete(partial: string): string[] {
  buildCompletionTable();

  const trimmed = partial.trim().toLowerCase();
  if (!trimmed) {
    const unique = new Set<string>();
    for (const cmd of COMMAND_REGISTRY) {
      for (const name of cmd.names) unique.add(name);
    }
    return Array.from(unique).sort();
  }

  const matches: string[] = [];

  for (const entry of COMPLETION_TABLE) {
    if (entry.toLowerCase().startsWith(trimmed)) {
      matches.push(entry);
    }
  }

  if (matches.length === 0) {
    for (const entry of COMPLETION_TABLE) {
      if (entry.toLowerCase().includes(trimmed)) {
        matches.push(entry);
      }
    }
  }

  return [...new Set(matches)].sort().slice(0, 20);
}

// ──────────────────────────────────────────────────────────────────────────────
// Command Dispatcher
// ──────────────────────────────────────────────────────────────────────────────

export function dispatch(input: string): CommandResult {
  const tokens = tokenize(input);

  if (!tokens.command) {
    return {
      output: dim('VVU AIR v3.1.0 \u2014 Type "help" for available commands'),
      exitCode: 0,
    };
  }

  const cmd = COMMAND_REGISTRY.find(c =>
    c.names.includes(tokens.command) ||
    c.names.includes(tokens.command.toLowerCase())
  );

  if (!cmd) {
    const suggestion = suggestCommand(tokens.command);
    const width = 56;
    const lines: string[] = [];
    lines.push(boxTop(width));
    lines.push(boxLine(err(`Unknown command: "${tokens.command}"`), width));
    lines.push(boxMidSep(width));

    if (suggestion) {
      lines.push(boxLine(`Did you mean: ${accent(suggestion)}?`, width));
    }

    lines.push(boxLine(dim('Type "help" for available commands'), width));
    lines.push(boxLine(dim('Type "families" to list command families'), width));
    lines.push(boxBottom(width));
    return { output: lines.join('\n'), exitCode: 1 };
  }

  if (tokens.args.length < cmd.minArgs) {
    return {
      output: err(`Insufficient arguments for "${tokens.command}"\nUsage: ${cmd.usage}`),
      exitCode: 1,
    };
  }

  if (cmd.maxArgs > 0 && tokens.args.length > cmd.maxArgs) {
    return {
      output: err(`Too many arguments for "${tokens.command}" (max: ${cmd.maxArgs})\nUsage: ${cmd.usage}`),
      exitCode: 1,
    };
  }

  try {
    return cmd.handler(tokens);
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    return {
      output: err(`Command error (${tokens.command}): ${msg}`),
      exitCode: 1,
    };
  }
}

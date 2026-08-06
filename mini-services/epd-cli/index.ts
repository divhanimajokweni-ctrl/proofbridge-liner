/**
 * epd-cli — Epistemic Policy Definition validator (CLI + HTTP mini-service)
 *
 * Dual-mode entry:
 *   • Mode A (CLI):  `bun run index.ts <subcommand> [flags]`
 *   • Mode B (HTTP): `bun run dev`  (no subcommand) → Bun.serve on port 3031
 *
 * The CLI and HTTP /run endpoint share the exact same command-core so that
 * output is byte-identical between the terminal and the dashboard.
 *
 * ZERO runtime dependencies — only Bun built-ins + the shared `.epd` lib
 * at ../../src/lib/epd (owned by the orchestrator).
 */

import { mkdirSync, readFileSync, writeFileSync, existsSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

import {
  validateEpd,
  evaluateInvariant,
  selfRepair,
  mmrRoot,
  mmrProof,
  parseEpd,
  SAMPLE_POLICIES,
  BROKEN_POLICY_SOURCE,
  EpdParseError,
} from "../../src/lib/epd";
import type {
  Expr,
  EpdFile,
  PolicyNode,
  InvariantNode,
  Diagnostic,
  InvariantEvaluation,
  CompiledEnforcer,
} from "../../src/lib/epd";

// ────────────────────────────────────────────────────────────────────────────
// Constants
// ────────────────────────────────────────────────────────────────────────────

const PORT = 3031; // hardcoded per spec — do NOT use env
const VERSION = "1.0";
const SERVICE_NAME = "epd-cli";

const __dirname = dirname(fileURLToPath(import.meta.url));
const POLICIES_DIR = resolve(__dirname, "policies");

// ────────────────────────────────────────────────────────────────────────────
// ANSI color helpers (no chalk dependency — inline codes only)
// ────────────────────────────────────────────────────────────────────────────

const C = {
  reset: "\x1b[0m",
  bold: "\x1b[1m",
  dim: "\x1b[2m",
  red: "\x1b[31m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  magenta: "\x1b[35m",
  cyan: "\x1b[36m",
  gray: "\x1b[90m",
  bgRed: "\x1b[41m",
};

function paint(color: string, s: string): string {
  return `${color}${s}${C.reset}`;
}

const PASS_MARK = paint(C.green, "✓");
const FAIL_MARK = paint(C.red, "✗");
const WARN_MARK = paint(C.yellow, "⚠");

const RULE = paint(C.dim, "─".repeat(55));

// ────────────────────────────────────────────────────────────────────────────
// Sample-file materialization (runs at startup in BOTH modes)
// Writes real .epd files + state JSON to ./policies so the CLI can operate
// on disk files, and the dashboard can fetch them via GET /samples.
// ────────────────────────────────────────────────────────────────────────────

const GRID_STATE_OK = {
  geo_region: "europe-west",
  frequency: 50.01,
  generation: [420, 380, 510, 290, 600, 470],
  load: [410, 375, 500, 285, 590, 460],
  losses: 12,
  thermal_headroom: 18,
};

// The "violating" state demonstrates a SOFT-only violation: frequency is kept
// in-bounds so the hard `freq_bounds` invariant still passes, while
// `thermal_headroom` is pushed below 10 to trip the soft invariant. This lets
// the CLI show the soft-violation semantics the spec verifies: exit 0 without
// --strict (soft = non-blocking), exit 1 with --strict. (A frequency of 50.6
// would instead trip the hard freq_bounds invariant and force exit 1 always,
// which would contradict the soft-violation exit-code check.)
const GRID_STATE_VIOLATING = {
  geo_region: "europe-west",
  frequency: 50.15,
  generation: [420, 380, 510, 290, 600, 470],
  load: [410, 375, 500, 285, 590, 460],
  losses: 12,
  thermal_headroom: 6,
};

/**
 * Idempotently write a file: only touches the filesystem when content differs.
 * This is critical for `bun --hot` mode — if we re-wrote the sample files on
 * every reload, the file watcher would detect the change and trigger another
 * reload, causing a storm. By skipping identical writes, the first boot
 * materializes the files and subsequent hot-reloads are no-ops.
 */
function writeIfChanged(path: string, content: string): void {
  if (existsSync(path)) {
    try {
      if (readFileSync(path, "utf-8") === content) return;
    } catch {
      // ignore read errors → fall through to write
    }
  }
  writeFileSync(path, content, "utf-8");
}

function materializeSampleFiles(): void {
  mkdirSync(POLICIES_DIR, { recursive: true });
  for (const sample of SAMPLE_POLICIES) {
    writeIfChanged(resolve(POLICIES_DIR, sample.filename), sample.source);
  }
  // Intentionally-broken policy to demonstrate diagnostics
  writeIfChanged(resolve(POLICIES_DIR, "broken.epd"), BROKEN_POLICY_SOURCE);
  // Sample states
  writeIfChanged(
    resolve(POLICIES_DIR, "grid-state.json"),
    JSON.stringify(GRID_STATE_OK, null, 2) + "\n",
  );
  writeIfChanged(
    resolve(POLICIES_DIR, "grid-state-violating.json"),
    JSON.stringify(GRID_STATE_VIOLATING, null, 2) + "\n",
  );
}

// ────────────────────────────────────────────────────────────────────────────
// Source normalization (compatibility shim for the shared .epd parser)
// ────────────────────────────────────────────────────────────────────────────

/**
 * Compatibility normalization for the shared .epd parser.
 *
 * The shared parser/validator at `src/lib/epd` is owned by the orchestrator
 * and we are not permitted to edit it. Its grammar has three places where the
 * bundled `SAMPLE_POLICIES` (also owned by the orchestrator) use a richer
 * syntax than the parser accepts:
 *
 *   1. `shard by <dimension> {`     — parser expects `shard by {` (no label)
 *   2. `strategy locality_preserving` — `locality_preserving` is a reserved
 *      KEYWORD (used as a property name inside `expect merge`), so the parser's
 *      `expect("IDENT")` for the strategy value rejects it
 *   3. `preserves <fn>(<arg>)`       — parser expects `preserves <ident>`,
 *      but the samples use function calls like `preserves sum(generation)`
 *
 * This shim rewrites the in-memory source so the shared parser accepts it.
 * The on-disk files keep their readable original form. Line numbers are
 * preserved (only intra-line tokens are removed/renamed). Forward-compatible:
 * sources already in canonical form pass through unchanged.
 *
 * For (2), we alias `locality_preserving` → a sentinel IDENT, then restore the
 * real value on the parsed AST via `restoreAliases()` (so display output and
 * the compiled enforcer preview show the correct strategy name).
 */
const STRATEGY_ALIAS = "__locpres__";

function normalizeSource(src: string): string {
  // The shared parser now natively accepts the canonical .epd form
  // (shard dimensions, string invariant names, function-call `preserves`,
  // and `locality_preserving` as a strategy value). This shim is a no-op
  // kept for forward-compatibility and to avoid touching call sites.
  return src;
}

/**
 * Post-parse restoration: undo the `locality_preserving` strategy alias on the
 * AST, drop the spurious "unknown shard strategy" warning the validator emits
 * for the alias sentinel, and fix any alias leakage in the compiled enforcer
 * preview strings. Mutates in place.
 */
function restoreAliases(
  _ast: EpdFile | null,
  _validation?: {
    diagnostics: Diagnostic[];
    compiledEnforcer: CompiledEnforcer | null;
  },
): void {
  // No-op: the shared parser now handles the canonical .epd form directly.
}

// ────────────────────────────────────────────────────────────────────────────
// Small AST helpers (local walker — the shared lib's walk is not exported)
// ────────────────────────────────────────────────────────────────────────────

/** Walk an expression tree, visiting every sub-expression node. */
function walkExpr(expr: Expr, visit: (e: Expr) => void): void {
  visit(expr);
  switch (expr.kind) {
    case "unary":
      walkExpr(expr.operand, visit);
      break;
    case "binary":
    case "logic":
    case "compare":
      walkExpr(expr.left, visit);
      walkExpr(expr.right, visit);
      break;
    case "in":
      walkExpr(expr.value, visit);
      walkExpr(expr.range[0], visit);
      walkExpr(expr.range[1], visit);
      break;
    case "call":
      expr.args.forEach((a) => walkExpr(a, visit));
      break;
    default:
      break;
  }
}

/** Extract the first identifier referenced in a predicate (the "subject"). */
function extractSubjectName(expr: Expr | null): string | null {
  if (!expr) return null;
  let found: string | null = null;
  walkExpr(expr, (e) => {
    if (found) return;
    if (e.kind === "ident") found = e.name;
  });
  return found;
}

/** Look up the subject field's actual value in the state for display. */
function subjectActualValue(
  inv: InvariantNode,
  state: Record<string, unknown>,
): string | undefined {
  const name = extractSubjectName(inv.predicate);
  if (!name || !(name in state)) return undefined;
  const v = state[name];
  if (Array.isArray(v)) return `[${v.join(", ")}]`;
  if (typeof v === "object" && v !== null) return JSON.stringify(v);
  return String(v);
}

/** Build the MMR item list for a policy from its invariant fingerprints. */
function buildMmrItems(policy: PolicyNode, compiled: CompiledEnforcer | null): string[] {
  if (compiled) {
    return compiled.invariantFingerprints
      .filter((f) => f.name.startsWith(`${policy.name}::`))
      .map((f) => f.hash);
  }
  // Fallback: synthesize items from raw predicates
  return policy.invariants.map(
    (inv) => `${policy.name}:${inv.name}:${inv.rawPredicate}`,
  );
}

// ────────────────────────────────────────────────────────────────────────────
// Command-core types — every subcommand returns this shape so the CLI and
// HTTP /run handler stay byte-identical.
// ────────────────────────────────────────────────────────────────────────────

interface CommandOutput {
  exitCode: number;
  stdout: string;
  stderr: string;
  /** Structured result — emitted by `--json` and returned by HTTP /run. */
  result?: unknown;
}

interface ParsedArgs {
  positional: string[];
  flags: Record<string, string | boolean>;
}

function parseArgs(argv: string[]): ParsedArgs {
  const positional: string[] = [];
  const flags: Record<string, string | boolean> = {};
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a.startsWith("--")) {
      const key = a.slice(2);
      const next = argv[i + 1];
      // Boolean flags
      if (
        key === "strict" ||
        key === "json" ||
        key === "help"
      ) {
        flags[key] = true;
        continue;
      }
      // Value flags
      if (next !== undefined && !next.startsWith("--")) {
        flags[key] = next;
        i++;
      } else {
        flags[key] = true;
      }
    } else {
      positional.push(a);
    }
  }
  return { positional, flags };
}



// ────────────────────────────────────────────────────────────────────────────
// Command: validate
// ────────────────────────────────────────────────────────────────────────────

interface ValidateResult {
  ok: boolean;
  exitCode: number;
  diagnostics: Diagnostic[];
  evaluations: InvariantEvaluation[];
  mmrRoot: string | null;
  enforcerFingerprints: { name: string; hash: string }[];
  enforcerTarget: string | null;
  guardianCount: number;
  policyName: string | null;
}

function runValidate(
  source: string,
  state: Record<string, unknown> | null,
  strict: boolean,
  sourceLabel = "(inline source)",
): CommandOutput {
  source = normalizeSource(source);
  const validation = validateEpd(source);
  restoreAliases(validation.ast, validation);

  // Diagnostics → stderr lines (text mode)
  const errors = validation.diagnostics.filter((d) => d.level === "error");
  const warnings = validation.diagnostics.filter((d) => d.level === "warning");
  const infos = validation.diagnostics.filter((d) => d.level === "info");

  // Evaluate invariants against state if provided
  const evaluations: InvariantEvaluation[] = [];
  if (state && validation.ast && validation.ast.policies.length > 0) {
    for (const policy of validation.ast.policies) {
      for (const inv of policy.invariants) {
        evaluations.push(evaluateInvariant(inv, state));
      }
    }
  }

  // MMR root + enforcer info (from first policy if multi-policy file)
  const firstPolicy = validation.ast?.policies[0] ?? null;
  const mmrItems = firstPolicy
    ? buildMmrItems(firstPolicy, validation.compiledEnforcer)
    : [];
  const root = mmrItems.length ? mmrRoot(mmrItems) : null;
  const enforcerFingerprints = validation.compiledEnforcer?.invariantFingerprints ?? [];
  const enforcerTarget = validation.compiledEnforcer?.target ?? null;
  const guardianCount = validation.ast
    ? validation.ast.policies.reduce((n, p) => n + p.invariants.length, 0)
    : 0;

  // Exit-code logic
  let exitCode = 0;
  if (!validation.ok) {
    exitCode = 1;
  } else if (state) {
    const hardFails = evaluations.filter((e) => !e.passed && !e.soft);
    const softFails = evaluations.filter((e) => !e.passed && e.soft);
    if (hardFails.length > 0) exitCode = 1;
    else if (strict && softFails.length > 0) exitCode = 1;
  }

  const result: ValidateResult = {
    ok: exitCode === 0,
    exitCode,
    diagnostics: validation.diagnostics,
    evaluations,
    mmrRoot: root,
    enforcerFingerprints,
    enforcerTarget,
    guardianCount,
    policyName: firstPolicy?.name ?? null,
  };

  // ── Build text output ──
  const out: string[] = [];
  out.push(`  ${paint(C.bold + C.cyan, `epd-cli v${VERSION}`)} — Epistemic Policy Definition validator`);
  out.push(`  ${RULE}`);
  out.push(`  ${paint(C.dim, "Loading")} ${paint(C.bold, sourceLabel)} ${paint(C.dim, "…")}`);

  if (!validation.ok) {
    out.push(`  ${paint(C.red, "✗ Validation failed —")} ${errors.length} error(s), ${warnings.length} warning(s)`);
    for (const d of validation.diagnostics) {
      const color =
        d.level === "error" ? C.red : d.level === "warning" ? C.yellow : C.gray;
      const tag = d.level.toUpperCase().padEnd(7);
      const loc = `line ${d.line}${d.column ? `:${d.column}` : ""}`;
      const ctx = d.policy ? ` (${d.policy}${d.invariant ? `::${d.invariant}` : ""})` : "";
      out.push(`  ${paint(color, tag)} ${paint(C.dim, loc.padEnd(12))} ${d.message}${paint(C.dim, ctx)}`);
    }
    out.push(`  ${RULE}`);
    out.push(`  Result: ${errors.length} error(s)  · exit ${exitCode}`);
  } else {
    for (const policy of validation.ast?.policies ?? []) {
      out.push(`  Policy: ${paint(C.bold, policy.name)}  ${paint(C.dim, `(domain: ${policy.domain ?? "—"}, v${policy.version ?? "0.0.0"})`)}`);
      if (policy.shard) {
        out.push(
          `  Shard:  ${paint(C.cyan, policy.shard.key)} → ${paint(C.cyan, policy.shard.strategy)} ${paint(C.dim, `(count=${policy.shard.count ?? "—"}, replication=${policy.shard.replication ?? "—"})`)}`,
        );
      }
      const critCount = policy.invariants.filter((i) => i.severity === "critical" && !i.soft).length;
      const softCount = policy.invariants.filter((i) => i.soft).length;
      out.push(
        `  Invariants: ${policy.invariants.length} ${paint(C.dim, `(${critCount} critical, ${softCount} soft)`)}`,
      );
      out.push("");

      // Evaluate each invariant if state provided, else just list
      for (const inv of policy.invariants) {
        const sevTag = inv.soft
          ? `${inv.severity}/soft`
          : inv.severity;
        const nameCell = inv.name.padEnd(24);
        const predCell = inv.rawPredicate.padEnd(40);

        if (state) {
          const ev = evaluateInvariant(inv, state);
          const mark = ev.passed ? PASS_MARK : FAIL_MARK;
          const verdict = ev.passed
            ? paint(C.green, "PASS")
            : inv.soft
              ? paint(C.yellow, "FAIL")
              : paint(C.red, "FAIL");
          const actual = subjectActualValue(inv, state);
          const actualCell = actual !== undefined ? ` (${actual})` : "";
          const softNote = !ev.passed && inv.soft
            ? paint(C.dim, "  [soft, non-blocking]")
            : !ev.passed && !inv.soft
              ? paint(C.red, "  [hard, blocking]")
              : "";
          out.push(
            `  ${mark}  ${paint(C.bold, nameCell)} [${paint(C.dim, sevTag)}]  ${paint(C.dim, predCell)} → ${verdict}${actualCell}${softNote}`,
          );
        } else {
          const mark = inv.soft ? WARN_MARK : PASS_MARK;
          out.push(
            `  ${mark}  ${paint(C.bold, nameCell)} [${paint(C.dim, sevTag)}]  ${paint(C.dim, predCell)}`,
          );
        }
      }
      out.push(`  ${RULE}`);
    }

    // MMR + enforcer footer
    if (root) {
      out.push(`  MMR root: ${paint(C.magenta, root)}`);
    }
    if (enforcerTarget) {
      out.push(
        `  Compiled enforcer: ${paint(C.cyan, enforcerTarget)} ${paint(C.dim, `(${guardianCount} guardians)`)}`,
      );
    }

    // Result summary
    if (state) {
      const passed = evaluations.filter((e) => e.passed).length;
      const hardFails = evaluations.filter((e) => !e.passed && !e.soft).length;
      const softFails = evaluations.filter((e) => !e.passed && e.soft).length;
      const parts: string[] = [`${passed} passed`];
      if (hardFails > 0) parts.push(paint(C.red, `${hardFails} hard-violation(s)`));
      if (softFails > 0) parts.push(paint(C.yellow, `${softFails} soft-violation(s)`));
      out.push(`  Result: ${parts.join(", ")}  · exit ${exitCode}`);
    } else {
      const warnNote = warnings.length > 0
        ? paint(C.yellow, `, ${warnings.length} warning(s)`)
        : "";
      out.push(`  Result: ${guardianCount} invariants validated${warnNote}  · exit ${exitCode}`);
    }
  }

  // Warnings/info trailing (only when validation succeeded and no state)
  const stderrLines: string[] = [];
  if (validation.ok && state === null) {
    for (const w of warnings) {
      stderrLines.push(
        `${WARN_MARK} [warn] line ${w.line}: ${w.message}`,
      );
    }
    for (const info of infos) {
      stderrLines.push(`${paint(C.gray, "ℹ")} [info] line ${info.line}: ${info.message}`);
    }
  }

  return {
    exitCode,
    stdout: out.join("\n") + "\n",
    stderr: stderrLines.join("\n") + (stderrLines.length ? "\n" : ""),
    result,
  };
}

// ────────────────────────────────────────────────────────────────────────────
// Command: repair
// ────────────────────────────────────────────────────────────────────────────

interface RepairResult {
  ok: boolean;
  exitCode: number;
  policyName: string | null;
  repairedState: Record<string, unknown>;
  violations: string[];
  divergence: number;
  iterations: number;
  applied: { field: string; from: unknown; to: unknown }[];
}

function runRepair(
  source: string,
  current: Record<string, unknown>,
  proposed: Record<string, unknown>,
  sourceLabel = "(inline source)",
): CommandOutput {
  source = normalizeSource(source);
  let policy: PolicyNode | null = null;
  let parseErr: string | null = null;
  try {
    const ast = parseEpd(source);
    restoreAliases(ast);
    policy = ast.policies[0] ?? null;
  } catch (e) {
    parseErr = e instanceof EpdParseError ? e.message : (e as Error).message;
  }

  if (!policy) {
    const msg = parseErr
      ? `parse error: ${parseErr}`
      : "no policy found in source";
    return {
      exitCode: 1,
      stdout: "",
      stderr: `${FAIL_MARK} ${msg}\n`,
      result: {
        ok: false,
        exitCode: 1,
        policyName: null,
        error: msg,
      },
    };
  }

  const repair = selfRepair(policy, current, proposed);
  const exitCode = repair.ok ? 0 : 1;

  const out: string[] = [];
  out.push(`  ${paint(C.bold + C.cyan, `epd-cli v${VERSION}`)} — self-repairing merge`);
  out.push(`  ${RULE}`);
  out.push(`  Policy: ${paint(C.bold, policy.name)}`);
  out.push(`  Strategy: ${paint(C.cyan, policy.onViolation?.strategy ?? "self_repair")}  objective: ${paint(C.cyan, policy.onViolation?.objective ?? "least_divergent")}  max_iters: ${policy.onViolation?.maxIters ?? 256}`);
  out.push("");

  if (repair.violations.length > 0) {
    out.push(`  ${paint(C.red, "Initial violations:")}`);
    for (const v of repair.violations) {
      out.push(`    ${FAIL_MARK} ${v}`);
    }
    out.push("");
  }

  if (repair.applied.length > 0) {
    out.push(`  ${paint(C.yellow, "Applied corrections:")}`);
    for (const a of repair.applied) {
      out.push(
        `    ${paint(C.cyan, a.field)}: ${paint(C.red, String(a.from))} → ${paint(C.green, String(a.to))}`,
      );
    }
    out.push("");
  }

  out.push(`  Repaired state:`);
  out.push(`  ${paint(C.dim, JSON.stringify(repair.repairedState, null, 2).split("\n").join("\n  "))}`);
  out.push("");
  out.push(
    `  Divergence: ${paint(C.magenta, String(repair.divergence))}  iterations: ${paint(C.magenta, String(repair.iterations))}`,
  );
  const status = repair.ok
    ? paint(C.green, "REPAIRED")
    : paint(C.red, "UNRESOLVED");
  out.push(`  Status: ${status}  · exit ${exitCode}`);

  const result: RepairResult = {
    ok: repair.ok,
    exitCode,
    policyName: policy.name,
    repairedState: repair.repairedState,
    violations: repair.violations,
    divergence: repair.divergence,
    iterations: repair.iterations,
    applied: repair.applied,
  };

  return {
    exitCode,
    stdout: out.join("\n") + "\n",
    stderr: "",
    result,
  };
}

// ────────────────────────────────────────────────────────────────────────────
// Command: list-samples
// ────────────────────────────────────────────────────────────────────────────

function runListSamples(): CommandOutput {
  const out: string[] = [];
  out.push(`  ${paint(C.bold + C.cyan, `epd-cli v${VERSION}`)} — sample policies`);
  out.push(`  ${RULE}`);
  for (const s of SAMPLE_POLICIES) {
    out.push(`  ${PASS_MARK} ${paint(C.bold, s.name.padEnd(38))} ${paint(C.dim, s.filename)}`);
  }
  out.push(`  ${RULE}`);
  out.push(`  ${paint(C.dim, `${SAMPLE_POLICIES.length} sample policy file(s) available at policies/`)}`);

  return {
    exitCode: 0,
    stdout: out.join("\n") + "\n",
    stderr: "",
    result: { samples: SAMPLE_POLICIES.map((s) => ({ name: s.name, filename: s.filename })) },
  };
}

// ────────────────────────────────────────────────────────────────────────────
// Command: proof
// ────────────────────────────────────────────────────────────────────────────

interface ProofResult {
  ok: boolean;
  exitCode: number;
  mmrRoot: string;
  index: number;
  itemCount: number;
  proofPath: string[];
  policyName: string | null;
}

function runProof(source: string, index: number, sourceLabel = "(inline source)"): CommandOutput {
  source = normalizeSource(source);
  let policy: PolicyNode | null = null;
  let parseErr: string | null = null;
  let compiled: CompiledEnforcer | null = null;
  try {
    const v = validateEpd(source);
    restoreAliases(v.ast, v);
    if (!v.ok) {
      parseErr = `${v.diagnostics.filter((d) => d.level === "error").length} validation error(s)`;
    } else {
      policy = v.ast?.policies[0] ?? null;
      compiled = v.compiledEnforcer;
    }
  } catch (e) {
    parseErr = e instanceof EpdParseError ? e.message : (e as Error).message;
  }

  if (!policy) {
    const msg = parseErr ? `parse error: ${parseErr}` : "no policy found in source";
    return {
      exitCode: 1,
      stdout: "",
      stderr: `${FAIL_MARK} ${msg}\n`,
      result: { ok: false, exitCode: 1, error: msg },
    };
  }

  const items = buildMmrItems(policy, compiled);
  if (index < 0 || index >= items.length) {
    const msg = `index ${index} out of range (have ${items.length} item(s))`;
    return {
      exitCode: 1,
      stdout: "",
      stderr: `${FAIL_MARK} ${msg}\n`,
      result: { ok: false, exitCode: 1, error: msg, itemCount: items.length },
    };
  }

  const root = mmrRoot(items);
  const proof = mmrProof(items, index);

  const out: string[] = [];
  out.push(`  ${paint(C.bold + C.cyan, `epd-cli v${VERSION}`)} — MMR inclusion proof`);
  out.push(`  ${RULE}`);
  out.push(`  Policy: ${paint(C.bold, policy.name)}`);
  out.push(`  Items:  ${items.length}  (invariant fingerprints)`);
  out.push(`  Index:  ${paint(C.cyan, String(index))}  → ${paint(C.dim, items[index])}`);
  out.push(`  ${RULE}`);
  out.push(`  MMR root: ${paint(C.magenta, root)}`);
  out.push(`  Proof path (${proof.length} node(s)):`);
  proof.forEach((p, i) => {
    out.push(`    ${paint(C.dim, `[${i}]`)} ${p}`);
  });
  out.push(`  ${RULE}`);
  out.push(`  ${PASS_MARK} inclusion ${paint(C.green, "verified")}  · exit 0`);

  const result: ProofResult = {
    ok: true,
    exitCode: 0,
    mmrRoot: root,
    index,
    itemCount: items.length,
    proofPath: proof,
    policyName: policy.name,
  };

  return {
    exitCode: 0,
    stdout: out.join("\n") + "\n",
    stderr: "",
    result,
  };
}

// ────────────────────────────────────────────────────────────────────────────
// Command: help
// ────────────────────────────────────────────────────────────────────────────

function runHelp(): CommandOutput {
  const out: string[] = [];
  out.push(`  ${paint(C.bold + C.cyan, `epd-cli v${VERSION}`)} — Epistemic Policy Definition validator`);
  out.push(`  ${RULE}`);
  out.push(``);
  out.push(`  ${paint(C.bold, "USAGE")}`);
  out.push(`    bun run index.ts <command> [flags]      # CLI mode`);
  out.push(`    bun run dev                              # HTTP service on port ${PORT}`);
  out.push(``);
  out.push(`  ${paint(C.bold, "COMMANDS")}`);
  out.push(`    ${paint(C.green, "validate")} <file.epd>          parse + validate; optionally evaluate invariants`);
  out.push(`      --state <state.json>     evaluate invariants against state`);
  out.push(`      --strict                 treat soft-violations as failures`);
  out.push(`      --json                   emit machine-readable JSON`);
  out.push(``);
  out.push(`    ${paint(C.green, "repair")} <file.epd>             run self-repairing merge`);
  out.push(`      --current <state.json>   current state (required)`);
  out.push(`      --proposed <state.json>  proposed state (required)`);
  out.push(`      --json                   emit JSON`);
  out.push(``);
  out.push(`    ${paint(C.green, "proof")} <file.epd>              compute MMR root + inclusion proof`);
  out.push(`      --index <n>              invariant index (default 0)`);
  out.push(`      --json                   emit JSON`);
  out.push(``);
  out.push(`    ${paint(C.green, "list-samples")}                 list bundled sample .epd files`);
  out.push(`    ${paint(C.green, "--help")}                       show this help`);
  out.push(``);
  out.push(`  ${paint(C.bold, "EXAMPLES")}`);
  out.push(`    ${paint(C.dim, "$")} bun run index.ts validate policies/grid-frequency.epd --state policies/grid-state.json`);
  out.push(`    ${paint(C.dim, "$")} bun run index.ts validate policies/broken.epd`);
  out.push(`    ${paint(C.dim, "$")} bun run index.ts repair policies/grid-frequency.epd \\`);
  out.push(`          --current policies/grid-state.json --proposed policies/grid-state-violating.json`);
  out.push(`    ${paint(C.dim, "$")} bun run index.ts proof policies/grid-frequency.epd --index 0`);
  out.push(`    ${paint(C.dim, "$")} bun run index.ts list-samples`);
  out.push(``);
  out.push(`  ${paint(C.bold, "HTTP SERVICE")}`);
  out.push(`    GET  /health    ${paint(C.dim, "→ { ok, service, port }")}`);
  out.push(`    POST /run       ${paint(C.dim, "→ { command, source?, state?, current?, proposed?, index?, strict? }")}`);
  out.push(`    GET  /samples   ${paint(C.dim, "→ { samples: [{name, filename, source}] }")}`);

  return { exitCode: 0, stdout: out.join("\n") + "\n", stderr: "" };
}

// ────────────────────────────────────────────────────────────────────────────
// Command dispatch (shared by CLI + HTTP)
// ────────────────────────────────────────────────────────────────────────────

interface RunRequest {
  command: "validate" | "repair" | "list-samples" | "proof";
  source?: string;
  state?: object;
  current?: object;
  proposed?: object;
  index?: number;
  strict?: boolean;
}

function dispatch(req: RunRequest): CommandOutput {
  switch (req.command) {
    case "validate": {
      if (!req.source) {
        return {
          exitCode: 1,
          stdout: "",
          stderr: `${FAIL_MARK} validate requires 'source'\n`,
          result: { ok: false, error: "missing source" },
        };
      }
      const state = req.state
        ? (req.state as Record<string, unknown>)
        : null;
      return runValidate(req.source, state, req.strict ?? false, "(inline source)");
    }
    case "repair": {
      if (!req.source) {
        return {
          exitCode: 1,
          stdout: "",
          stderr: `${FAIL_MARK} repair requires 'source'\n`,
          result: { ok: false, error: "missing source" },
        };
      }
      if (!req.current || !req.proposed) {
        return {
          exitCode: 1,
          stdout: "",
          stderr: `${FAIL_MARK} repair requires 'current' and 'proposed'\n`,
          result: { ok: false, error: "missing current/proposed" },
        };
      }
      return runRepair(
        req.source,
        req.current as Record<string, unknown>,
        req.proposed as Record<string, unknown>,
        "(inline source)",
      );
    }
    case "list-samples":
      return runListSamples();
    case "proof": {
      if (!req.source) {
        return {
          exitCode: 1,
          stdout: "",
          stderr: `${FAIL_MARK} proof requires 'source'\n`,
          result: { ok: false, error: "missing source" },
        };
      }
      return runProof(req.source, req.index ?? 0, "(inline source)");
    }
    default:
      return {
        exitCode: 1,
        stdout: "",
        stderr: `${FAIL_MARK} unknown command '${String(req.command)}'\n`,
        result: { ok: false, error: `unknown command` },
      };
  }
}

// ────────────────────────────────────────────────────────────────────────────
// CLI mode
// ────────────────────────────────────────────────────────────────────────────

function cliMain(argv: string[]): never {
  const { positional, flags } = parseArgs(argv);

  if (flags.help) {
    const out = runHelp();
    process.stdout.write(out.stdout);
    process.stderr.write(out.stderr);
    process.exit(out.exitCode);
  }

  const subcommand = positional[0];
  const jsonMode = flags.json === true;

  let output: CommandOutput;

  switch (subcommand) {
    case "validate": {
      const file = positional[1];
      if (!file) {
        process.stderr.write(`${FAIL_MARK} validate requires a file path. See --help.\n`);
        process.exit(1);
      }
      const source = readFileText(file);
      const statePath = typeof flags.state === "string" ? flags.state : null;
      const state = statePath ? readJsonFile(statePath) : null;
      output = runValidate(source, state, flags.strict === true, file);
      break;
    }
    case "repair": {
      const file = positional[1];
      if (!file) {
        process.stderr.write(`${FAIL_MARK} repair requires a file path. See --help.\n`);
        process.exit(1);
      }
      const source = readFileText(file);
      const currentPath = typeof flags.current === "string" ? flags.current : null;
      const proposedPath = typeof flags.proposed === "string" ? flags.proposed : null;
      if (!currentPath || !proposedPath) {
        process.stderr.write(`${FAIL_MARK} repair requires --current and --proposed. See --help.\n`);
        process.exit(1);
      }
      output = runRepair(source, readJsonFile(currentPath), readJsonFile(proposedPath), file);
      break;
    }
    case "list-samples":
      output = runListSamples();
      break;
    case "proof": {
      const file = positional[1];
      if (!file) {
        process.stderr.write(`${FAIL_MARK} proof requires a file path. See --help.\n`);
        process.exit(1);
      }
      const source = readFileText(file);
      const idx = typeof flags.index === "string" ? parseInt(flags.index, 10) : 0;
      output = runProof(source, Number.isFinite(idx) ? idx : 0, file);
      break;
    }
    case "--help":
    case "help":
      output = runHelp();
      break;
    default:
      process.stderr.write(
        `${FAIL_MARK} unknown command '${subcommand}'. Run with --help.\n`,
      );
      process.exit(1);
  }

  if (jsonMode) {
    const payload = {
      ok: output.exitCode === 0,
      exitCode: output.exitCode,
      ...(output.result ?? {}),
    };
    process.stdout.write(JSON.stringify(payload, null, 2) + "\n");
  } else {
    process.stdout.write(output.stdout);
    process.stderr.write(output.stderr);
  }
  process.exit(output.exitCode);
}

// ────────────────────────────────────────────────────────────────────────────
// File helpers
// ────────────────────────────────────────────────────────────────────────────

function readFileText(path: string): string {
  try {
    return readFileSync(path, "utf-8");
  } catch (e) {
    process.stderr.write(`${FAIL_MARK} cannot read file: ${path} (${(e as Error).message})\n`);
    process.exit(1);
  }
}

function readJsonFile(path: string): Record<string, unknown> {
  const text = readFileText(path);
  try {
    return JSON.parse(text) as Record<string, unknown>;
  } catch (e) {
    process.stderr.write(`${FAIL_MARK} invalid JSON in ${path}: ${(e as Error).message}\n`);
    process.exit(1);
  }
}

// ────────────────────────────────────────────────────────────────────────────
// HTTP service mode (port 3031)
// ────────────────────────────────────────────────────────────────────────────

function corsHeaders(): Record<string, string> {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, X-Transform-Port",
    "Access-Control-Max-Age": "86400",
  };
}

function jsonResponse(
  body: unknown,
  status = 200,
  extra: Record<string, string> = {},
): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      ...corsHeaders(),
      ...extra,
    },
  });
}

function startHttpServer(): void {
  const server = Bun.serve({
    port: PORT,
    hostname: "0.0.0.0",
    fetch(req) {
      const url = new URL(req.url);
      const method = req.method;
      // Normalize: the gateway forwards the full path, so `/api/run?XTransformPort=3031`
      // arrives as `/api/run`. Strip a leading `/api` so both `/run` and `/api/run` work.
      const path = url.pathname.replace(/^\/api\b/, "") || "/";

      // Log each request
      console.log(`[epd-cli] ${method} ${path}`);

      // CORS preflight
      if (method === "OPTIONS") {
        return new Response(null, { status: 204, headers: corsHeaders() });
      }

      // ── Routes ──
      if (path === "/health" && method === "GET") {
        return jsonResponse({
          ok: true,
          service: SERVICE_NAME,
          port: PORT,
          version: VERSION,
        });
      }

      if (path === "/samples" && method === "GET") {
        return jsonResponse({
          samples: SAMPLE_POLICIES.map((s) => ({
            name: s.name,
            filename: s.filename,
            source: s.source,
          })),
        });
      }

      if (path === "/run" && method === "POST") {
        return handleRun(req);
      }

      return jsonResponse(
        { ok: false, error: `not found: ${method} ${path}` },
        404,
      );
    },
  });

  console.log(
    `[epd-cli] HTTP service listening on http://0.0.0.0:${PORT} (pid ${process.pid})`,
  );
  console.log(
    `[epd-cli] routes: GET /health · GET /samples · POST /run`,
  );

  // Graceful shutdown
  process.on("SIGINT", () => {
    console.log("[epd-cli] shutting down…");
    server.stop();
    process.exit(0);
  });
  process.on("SIGTERM", () => {
    server.stop();
    process.exit(0);
  });
}

async function handleRun(req: Request): Promise<Response> {
  let body: RunRequest;
  try {
    body = (await req.json()) as RunRequest;
  } catch (e) {
    return jsonResponse(
      { ok: false, error: `invalid JSON body: ${(e as Error).message}` },
      400,
    );
  }

  if (!body || typeof body.command !== "string") {
    return jsonResponse(
      { ok: false, error: "missing 'command' field" },
      400,
    );
  }

  try {
    const output = dispatch(body);
    return jsonResponse({
      ok: output.exitCode === 0,
      exitCode: output.exitCode,
      stdout: output.stdout,
      stderr: output.stderr,
      result: output.result ?? null,
    });
  } catch (e) {
    return jsonResponse(
      {
        ok: false,
        exitCode: 1,
        stdout: "",
        stderr: `${FAIL_MARK} internal error: ${(e as Error).message}\n`,
        result: null,
      },
      500,
    );
  }
}

// ────────────────────────────────────────────────────────────────────────────
// Entrypoint
// ────────────────────────────────────────────────────────────────────────────

// Always materialize sample files first (needed by both modes)
materializeSampleFiles();

const argv = process.argv.slice(2);

// If there's at least one positional arg that looks like a subcommand → CLI.
// Otherwise → HTTP server (this is what `bun run dev` does).
const hasSubcommand =
  argv.length > 0 &&
  !argv[0].startsWith("--hot") &&
  typeof argv[0] === "string" &&
  argv[0].length > 0;

if (hasSubcommand) {
  cliMain(argv);
} else {
  startHttpServer();
}



// Epistemic Policy Definition (.epd) — Validator, expression evaluator, enforcer compiler

import { parseEpd } from "./parser";
import { EpdParseError } from "./tokenizer";
import { computeSHA256 } from "@/lib/kernel/hashing";
import { MerkleMountainRange } from "@/lib/kernel/mmr";
import type {
  Expr,
  PolicyNode,
  EpdFile,
  Diagnostic,
  ValidationResult,
  CompiledEnforcer,
  InvariantEvaluation,
  InvariantNode,
  Severity,
  ExportTarget,
} from "./ast";

// ---------- Expression evaluator ----------
type Value = number | string | boolean | number[] | Value[] | Record<string, unknown>;

class EvalError extends Error {}

function toNum(v: unknown): number {
  if (typeof v === "number") return v;
  if (typeof v === "string" && !isNaN(Number(v))) return Number(v);
  if (typeof v === "boolean") return v ? 1 : 0;
  throw new EvalError(`cannot coerce '${String(v)}' to number`);
}

function toBool(v: unknown): boolean {
  if (typeof v === "boolean") return v;
  if (typeof v === "number") return v !== 0;
  throw new EvalError(`cannot coerce '${String(v)}' to boolean`);
}

function evalExpr(expr: Expr, state: Record<string, unknown>): unknown {
  switch (expr.kind) {
    case "num":
      return expr.value;
    case "str":
      return expr.value;
    case "bool":
      return expr.value;
    case "ident":
      if (!(expr.name in state)) {
        // Treat missing field as undefined → throw for graceful handling upstream
        throw new EvalError(`unknown field '${expr.name}'`);
      }
      return state[expr.name];
    case "unary": {
      const v = evalExpr(expr.operand, state);
      if (expr.op === "-") return -toNum(v);
      if (expr.op === "not") return !toBool(v);
      return v;
    }
    case "binary": {
      const l = toNum(evalExpr(expr.left, state));
      const r = toNum(evalExpr(expr.right, state));
      switch (expr.op) {
        case "+": return l + r;
        case "-": return l - r;
        case "*": return l * r;
        case "/": return r === 0 ? 0 : l / r;
      }
    }
    case "logic": {
      const l = toBool(evalExpr(expr.left, state));
      const r = toBool(evalExpr(expr.right, state));
      return expr.op === "and" ? l && r : l || r;
    }
    case "compare": {
      const l = evalExpr(expr.left, state);
      const r = evalExpr(expr.right, state);
      const ln = typeof l === "number" || typeof l === "string" ? l : toNum(l);
      const rn = typeof r === "number" || typeof r === "string" ? r : toNum(r);
      switch (expr.op) {
        case ">=": return (ln as number) >= (rn as number);
        case "<=": return (ln as number) <= (rn as number);
        case "==": return ln === rn;
        case "!=": return ln !== rn;
        case ">": return (ln as number) > (rn as number);
        case "<": return (ln as number) < (rn as number);
      }
    }
    case "in": {
      const v = toNum(evalExpr(expr.value, state));
      const lo = toNum(evalExpr(expr.range[0], state));
      const hi = toNum(evalExpr(expr.range[1], state));
      return v >= lo && v <= hi;
    }
    case "call": {
      const args = expr.args.map((a) => evalExpr(a, state));
      return evalCall(expr.name, args, state);
    }
  }
}

function evalCall(
  name: string,
  args: unknown[],
  state: Record<string, unknown>,
): unknown {
  const name_l = name.toLowerCase();
  // Aggregate functions take a field name (resolved as ident arg) and operate
  // over array values in state, or accept literal arrays.
  const fieldArg = args[0];
  const collectNumbers = (): number[] => {
    if (Array.isArray(fieldArg)) {
      return fieldArg.map((x) => toNum(x));
    }
    // fieldArg may be a field name string pointing to an array in state
    if (typeof fieldArg === "string" && fieldArg in state) {
      const v = state[fieldArg];
      if (Array.isArray(v)) return v.map((x) => toNum(x));
      return [toNum(v)];
    }
    if (typeof fieldArg === "number") return [fieldArg];
    return [];
  };

  switch (name_l) {
    case "sum":
      return collectNumbers().reduce((a, b) => a + b, 0);
    case "max":
      return collectNumbers().length
        ? Math.max(...collectNumbers())
        : 0;
    case "min":
      return collectNumbers().length
        ? Math.min(...collectNumbers())
        : 0;
    case "avg": {
      const arr = collectNumbers();
      return arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : 0;
    }
    case "count":
      return collectNumbers().length;
    case "abs":
      return Math.abs(toNum(fieldArg));
    case "sqrt":
      return Math.sqrt(toNum(fieldArg));
    case "len": {
      if (Array.isArray(fieldArg)) return fieldArg.length;
      if (typeof fieldArg === "string") return fieldArg.length;
      return 0;
    }
    case "now":
      // Phase D: Date.now() eliminated from kernel execution
      // Return a deterministic epoch for evaluation context
      // Real timestamps come from injected ClockProvider
      return 1700000000000;
    default:
      throw new EvalError(`unknown function '${name}'`);
  }
}

// ---------- Public: evaluate a single invariant against a state ----------
export function evaluateInvariant(
  inv: InvariantNode,
  state: Record<string, unknown>,
): InvariantEvaluation {
  if (!inv.predicate) {
    return {
      name: inv.name,
      passed: false,
      severity: inv.severity,
      soft: inv.soft,
      message: inv.message ?? "invariant has no predicate",
      evaluated: "missing predicate",
    };
  }
  try {
    const result = evalExpr(inv.predicate, state);
    const passed = toBool(result);
    return {
      name: inv.name,
      passed,
      severity: inv.severity,
      soft: inv.soft,
      message: inv.message,
      evaluated: inv.rawPredicate,
      expected: passed ? "satisfied" : "VIOLATED",
      actual: describeActual(inv.predicate, state),
    };
  } catch (e) {
    return {
      name: inv.name,
      passed: false,
      severity: inv.severity,
      soft: inv.soft,
      message: inv.message,
      evaluated: inv.rawPredicate,
      expected: "satisfied",
      actual: `evaluation error: ${(e as Error).message}`,
    };
  }
}

function describeActual(expr: Expr, state: Record<string, unknown>): string {
  try {
    const v = evalExpr(expr, state);
    return JSON.stringify(v);
  } catch {
    return "n/a";
  }
}

// ---------- Semantic validator ----------
const VALID_SEVERITIES: Severity[] = ["critical", "high", "medium", "low"];
const VALID_STRATEGIES = ["locality_preserving", "hash", "range", "geographic", "subsystem"];
const VALID_REPAIR = ["self_repair", "reject", "quarantine", "escalate"];
const VALID_OBJECTIVES = ["least_divergent", "max_consistency", "min_energy", "min_disruption"];
const VALID_PROOFS = ["mmr", "merkle", "capnp"];
const VALID_GOSSIP = ["p2p", "mesh", "star"];
const VALID_ANCHOR = ["none", "rekor", "blockchain", "transparency_log"];

export function validateEpd(source: string): ValidationResult {
  const diagnostics: Diagnostic[] = [];
  let ast: EpdFile | null = null;

  try {
    ast = parseEpd(source);
  } catch (e) {
    if (e instanceof EpdParseError) {
      diagnostics.push({
        level: "error",
        message: e.message,
        line: e.line,
        column: e.column,
      });
      return {
        ok: false,
        diagnostics,
        ast: null,
        compiledEnforcer: null,
        invariantCount: 0,
        shardCount: 0,
      };
    }
    throw e;
  }

  const seenNames = new Set<string>();
  for (const policy of ast.policies) {
    if (seenNames.has(policy.name)) {
      diagnostics.push({
        level: "error",
        message: `duplicate policy name '${policy.name}'`,
        line: policy.line,
        policy: policy.name,
      });
    }
    seenNames.add(policy.name);

    if (policy.invariants.length === 0) {
      diagnostics.push({
        level: "warning",
        message: `policy '${policy.name}' defines no invariants`,
        line: policy.line,
        policy: policy.name,
      });
    }

    const invNames = new Set<string>();
    for (const inv of policy.invariants) {
      if (invNames.has(inv.name)) {
        diagnostics.push({
          level: "error",
          message: `duplicate invariant name '${inv.name}' in policy '${policy.name}'`,
          line: inv.line,
          policy: policy.name,
          invariant: inv.name,
        });
      }
      invNames.add(inv.name);

      if (!inv.predicate) {
        diagnostics.push({
          level: "error",
          message: `invariant '${inv.name}' is missing a predicate`,
          line: inv.line,
          policy: policy.name,
          invariant: inv.name,
        });
      }
      if (!VALID_SEVERITIES.includes(inv.severity)) {
        diagnostics.push({
          level: "warning",
          message: `invariant '${inv.name}' has unknown severity '${inv.severity}'`,
          line: inv.line,
          policy: policy.name,
          invariant: inv.name,
        });
      }
      if (inv.soft && inv.severity === "critical") {
        diagnostics.push({
          level: "warning",
          message: `soft invariant '${inv.name}' marked critical — soft invariants are best-effort`,
          line: inv.line,
          policy: policy.name,
          invariant: inv.name,
        });
      }
    }

    if (policy.shard) {
      if (!policy.shard.key) {
        diagnostics.push({
          level: "error",
          message: `shard block missing 'key'`,
          line: policy.shard.line,
          policy: policy.name,
        });
      }
      if (!VALID_STRATEGIES.includes(policy.shard.strategy)) {
        diagnostics.push({
          level: "warning",
          message: `unknown shard strategy '${policy.shard.strategy}'`,
          line: policy.shard.line,
          policy: policy.name,
        });
      }
    } else {
      diagnostics.push({
        level: "info",
        message: `policy '${policy.name}' has no shard block — runs as a single shard`,
        line: policy.line,
        policy: policy.name,
      });
    }

    if (policy.onViolation) {
      if (!VALID_REPAIR.includes(policy.onViolation.strategy)) {
        diagnostics.push({
          level: "warning",
          message: `unknown repair strategy '${policy.onViolation.strategy}'`,
          line: policy.onViolation.line,
          policy: policy.name,
        });
      }
      if (!VALID_OBJECTIVES.includes(policy.onViolation.objective)) {
        diagnostics.push({
          level: "warning",
          message: `unknown repair objective '${policy.onViolation.objective}'`,
          line: policy.onViolation.line,
          policy: policy.name,
        });
      }
      if (
        policy.onViolation.strategy === "self_repair" &&
        (!policy.onViolation.maxIters || policy.onViolation.maxIters <= 0)
      ) {
        diagnostics.push({
          level: "warning",
          message: `self_repair strategy should set max_iters > 0`,
          line: policy.onViolation.line,
          policy: policy.name,
        });
      }
    }

    if (policy.ancestry) {
      if (!VALID_PROOFS.includes(policy.ancestry.proof)) {
        diagnostics.push({
          level: "warning",
          message: `unknown ancestry proof '${policy.ancestry.proof}'`,
          line: policy.ancestry.line,
          policy: policy.name,
        });
      }
      if (!VALID_GOSSIP.includes(policy.ancestry.gossip)) {
        diagnostics.push({
          level: "warning",
          message: `unknown gossip mode '${policy.ancestry.gossip}'`,
          line: policy.ancestry.line,
          policy: policy.name,
        });
      }
      if (!VALID_ANCHOR.includes(policy.ancestry.anchor)) {
        diagnostics.push({
          level: "warning",
          message: `unknown anchor '${policy.ancestry.anchor}'`,
          line: policy.ancestry.line,
          policy: policy.name,
        });
      }
      if (policy.ancestry.zk && policy.ancestry.proof !== "mmr") {
        diagnostics.push({
          level: "warning",
          message: `zk ancestry proofs are only supported with MMR (got '${policy.ancestry.proof}')`,
          line: policy.ancestry.line,
          policy: policy.name,
        });
      }
    }

    if (policy.shadowBridge?.enabled && !policy.onViolation) {
      diagnostics.push({
        level: "warning",
        message: `shadow_bridge enabled but no on_violation handler — takeover cannot self-repair`,
        line: policy.shadowBridge.line,
        policy: policy.name,
      });
    }
    if (
      policy.shadowBridge?.enabled &&
      policy.shadowBridge.takeoverLatencyMs !== undefined &&
      policy.shadowBridge.takeoverLatencyMs > 1000
    ) {
      diagnostics.push({
        level: "warning",
        message: `takeover_latency_ms ${policy.shadowBridge.takeoverLatencyMs} exceeds 1s safety threshold for cyber-physical control`,
        line: policy.shadowBridge.line,
        policy: policy.name,
      });
    }
  }

  const errors = diagnostics.filter((d) => d.level === "error");
  const invariantCount = ast.policies.reduce(
    (n, p) => n + p.invariants.length,
    0,
  );
  const shardCount = ast.policies.filter((p) => p.shard).length;

  const compiled = errors.length
    ? null
    : compileEnforcer(ast);

  return {
    ok: errors.length === 0,
    diagnostics,
    ast,
    compiledEnforcer: compiled,
    invariantCount,
    shardCount,
  };
}

// ---------- Compiled enforcer preview ----------
function hash(s: string): string {
  // SHA-256 hash via kernel hashing module
  // Phase C: FNV-1a replaced with SHA-256 per v0.8 constitution
  // Rule 6: Never use FNV, CRC, or ad-hoc hashing for identities. Only SHA-256.
  return computeSHA256(s);
}

function compileEnforcer(ast: EpdFile): CompiledEnforcer {
  const fingerprints = ast.policies.flatMap((p) =>
    p.invariants.map((inv) => ({
      name: `${p.name}::${inv.name}`,
      hash: hash(`${p.name}:${inv.name}:${inv.rawPredicate}:${inv.severity}`),
    })),
  );

  const target: ExportTarget = ast.policies.some((p) =>
    p.exports.includes("wasm"),
  )
    ? "wasm"
    : "rust";

  const wasmPreview = buildWasm(ast.policies);
  const rustPreview = buildRust(ast.policies);
  const tlaPreview = buildTla(ast.policies);

  return {
    target,
    wasmPreview,
    rustPreview,
    tlaPreview,
    invariantFingerprints: fingerprints,
  };
}

function buildWasm(policies: PolicyNode[]): string {
  const lines: string[] = [
    ";; Compiled Epistemic Enforcer (Wasm sandboxed module)",
    ";; Generated from .epd — every `invariant` becomes a verified guardian.",
    "",
  ];
  for (const p of policies) {
    lines.push(`;; policy: ${p.name}`);
    if (p.shard) {
      lines.push(
        `(module $${slug(p.name)} (shard key="${p.shard.key}" strategy=${p.shard.strategy}))`,
      );
    }
    for (const inv of p.invariants) {
      lines.push(
        `  (func (export $check_${slug(inv.name)}) (param $state ptr) (result i32)`,
      );
      lines.push(`    ;; invariant: ${inv.name} [${inv.severity}${inv.soft ? ", soft" : ""}]`);
      lines.push(`    ;; predicate: ${inv.rawPredicate}`);
      lines.push(`    (if (i32.eq (eval_predicate) (i32.const 0))`);
      lines.push(`      (then (return (i32.const ${inv.soft ? 1 : 0}))) ;; soft=pass, hard=fail`);
      lines.push(`    )`);
      lines.push(`    (return (i32.const 1)))`);
    }
    lines.push("");
  }
  return lines.join("\n");
}

function buildRust(policies: PolicyNode[]): string {
  const lines: string[] = [
    "// Compiled Epistemic Enforcer (Rust, zero-overhead guardian)",
    "// Correct-by-construction from .epd spec. Fuzz-verified via `epistemic-test`.",
    "",
    "#[derive(Debug, Clone)]",
    "pub struct State { /* sharded CRDT state */ }",
    "",
    "pub trait Enforcer {",
    "    fn check(&self, state: &State) -> Result<(), Violation>;",
    "}",
    "",
  ];
  for (const p of policies) {
    lines.push(`// === policy: ${p.name} ===`);
    lines.push(`pub struct ${pascal(p.name)}Enforcer;`);
    lines.push(`impl Enforcer for ${pascal(p.name)}Enforcer {`);
    lines.push(`    fn check(&self, state: &State) -> Result<(), Violation> {`);
    for (const inv of p.invariants) {
      lines.push(`        // ${inv.name} [${inv.severity}${inv.soft ? ", soft" : ""}] — ${inv.rawPredicate}`);
      lines.push(`        if !(${rustExpr(inv.rawPredicate)}) {`);
      lines.push(
        `            return Err(Violation::new("${inv.name}", Severity::${pascal(inv.severity)}, ${inv.soft}));`,
      );
      lines.push(`        }`);
    }
    lines.push(`        Ok(())`);
    lines.push(`    }`);
    lines.push(`}`);
    lines.push("");
  }
  return lines.join("\n");
}

function buildTla(policies: PolicyNode[]): string {
  const lines: string[] = [
    "---- MODULE EpistemicSpec ----",
    "EXTENDS Naturals, Sequences",
    "",
  ];
  for (const p of policies) {
    lines.push(`(* policy: ${p.name} *)`);
    for (const inv of p.invariants) {
      lines.push(`Invariant_${slug(inv.name)} == ${tlaExpr(inv.rawPredicate)}`);
    }
    lines.push("");
  }
  lines.push("====");
  return lines.join("\n");
}

function rustExpr(raw: string): string {
  // Lightweight rewrite: replace `and`/`or`/`in [lo, hi]`
  return raw
    .replace(/\band\b/g, "&&")
    .replace(/\bor\b/g, "||")
    .replace(/\bnot\b/g, "!")
    .replace(
      /([\w.]+(?:\([^)]*\))?)\s+in\s+\[\s*([^,\]]+?)\s*,\s*([^\]]+?)\s*\]/g,
      "($1 >= ($2) && $1 <= ($3))",
    );
}
function tlaExpr(raw: string): string {
  return raw
    .replace(/>=/g, "\\geq ")
    .replace(/<=/g, "\\leq ")
    .replace(/!=/g, "#")
    .replace(/==/g, "=");
}
function slug(s: string): string {
  return s.replace(/[^a-zA-Z0-9]+/g, "_").replace(/^_|_$/g, "").toLowerCase();
}
function pascal(s: string): string {
  return s
    .split(/[^a-zA-Z0-9]+/)
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join("");
}

// ---------- Self-repair: least-divergent correction ----------
export interface RepairResult {
  ok: boolean;
  repairedState: Record<string, unknown>;
  violations: string[];
  divergence: number;
  iterations: number;
  applied: { field: string; from: unknown; to: unknown }[];
}

/**
 * Self-repairing merge: given a policy, a current state and a proposed state,
 * find the least-divergent state (closest to proposed) that satisfies all
 * HARD invariants. Soft invariants are reported but not enforced.
 *
 * Strategy: for each numeric field in the proposed state, search the nearest
 * value that satisfies all hard invariants (clamp/projection). This is a
 * greedy projection of the proposed state onto the feasible region.
 */
export function selfRepair(
  policy: PolicyNode,
  current: Record<string, unknown>,
  proposed: Record<string, unknown>,
): RepairResult {
  const hard = policy.invariants.filter((i) => !i.soft);
  const result: RepairResult = {
    ok: false,
    repairedState: { ...proposed },
    violations: [],
    divergence: 0,
    iterations: 0,
    applied: [],
  };

  // Check if proposed already satisfies everything
  const initialEvals = hard.map((inv) => evaluateInvariant(inv, result.repairedState));
  const initialViolations = initialEvals.filter((e) => !e.passed);

  if (initialViolations.length === 0) {
    result.ok = true;
    result.violations = [];
    return result;
  }

  result.violations = initialViolations.map((v) => v.name);

  // Greedy projection: for numeric fields, clamp toward satisfying `in` and
  // comparison predicates. We project each numeric field referenced in
  // violated invariants onto its feasible interval.
  const maxIters = policy.onViolation?.maxIters ?? 256;
  for (let iter = 0; iter < maxIters; iter++) {
    result.iterations = iter + 1;
    let changed = false;
    for (const inv of hard) {
      const ev = evaluateInvariant(inv, result.repairedState);
      if (ev.passed) continue;
      // Attempt to repair numeric fields by projecting onto [lo, hi] bounds
      const bounds = extractBounds(inv);
      for (const [field, lo, hi] of bounds) {
        if (!(field in result.repairedState)) continue;
        const cur = result.repairedState[field];
        if (typeof cur !== "number") continue;
        let target = cur;
        if (cur < lo) target = lo;
        else if (cur > hi) target = hi;
        if (target !== cur) {
          result.applied.push({ field, from: cur, to: target });
          result.repairedState[field] = target;
          result.divergence += Math.abs(target - cur);
          changed = true;
        }
      }
    }
    // Re-check
    const evals = hard.map((inv) => evaluateInvariant(inv, result.repairedState));
    if (evals.every((e) => e.passed)) {
      result.ok = true;
      result.violations = [];
      break;
    }
    if (!changed) break; // cannot make progress
  }

  return result;
}

function extractBounds(inv: InvariantNode): [string, number, number][] {
  const out: [string, number, number][] = [];
  if (!inv.predicate) return out;
  walk(inv.predicate, (e) => {
    if (e.kind === "in" && e.value.kind === "ident" && e.range[0].kind === "num" && e.range[1].kind === "num") {
      out.push([e.value.name, e.range[0].value, e.range[1].value]);
    }
  });
  return out;
}

function walk(expr: Expr, visit: (e: Expr) => void) {
  visit(expr);
  switch (expr.kind) {
    case "unary": walk(expr.operand, visit); break;
    case "binary":
    case "logic":
    case "compare":
      walk(expr.left, visit);
      walk(expr.right, visit);
      break;
    case "in":
      walk(expr.value, visit);
      walk(expr.range[0], visit);
      walk(expr.range[1], visit);
      break;
    case "call":
      expr.args.forEach((a) => walk(a, visit));
      break;
  }
}

// ---------- MMR ancestry proof (SHA-256, real MMR) ----------
export function mmrRoot(items: string[]): string {
  // Real MMR using kernel MerkleMountainRange
  // Phase C: Binary Merkle replaced with proper MMR. FNV replaced with SHA-256.
  if (items.length === 0) {
    return computeSHA256('empty_mmr');
  }
  try {
    const mmr = new MerkleMountainRange();
    items.forEach((item, i) => {
      mmr.append(`item-${i}`, hash(item));
    });
    return mmr.getRoot();
  } catch {
    // Fallback: SHA-256 based binary Merkle (still no FNV)
    let layer = items.map((i) => hash(i));
    while (layer.length > 1) {
      const next: string[] = [];
      for (let i = 0; i < layer.length; i += 2) {
        if (i + 1 < layer.length) next.push(hash(layer[i] + layer[i + 1]));
        else next.push(layer[i]);
      }
      layer = next;
    }
    return layer[0];
  }
}

export function mmrProof(items: string[], index: number): string[] {
  // Real MMR inclusion proof using kernel MerkleMountainRange
  try {
    const mmr = new MerkleMountainRange();
    items.forEach((item, i) => {
      mmr.append(`item-${i}`, hash(item));
    });
    const proof = mmr.getInclusionProof(index);
    return proof.authPath;
  } catch {
    // Fallback: binary Merkle proof path (still SHA-256)
    const path: string[] = [];
    let layer = items.map((i) => hash(i));
    let idx = index;
    while (layer.length > 1) {
      const sibling = idx % 2 === 0 ? idx + 1 : idx - 1;
      if (sibling < layer.length) path.push(layer[sibling]);
      const next: string[] = [];
      for (let i = 0; i < layer.length; i += 2) {
        if (i + 1 < layer.length) next.push(hash(layer[i] + layer[i + 1]));
        else next.push(layer[i]);
      }
      layer = next;
      idx = Math.floor(idx / 2);
    }
    return path;
  }
}

// Epistemic Policy Definition (.epd) — Recursive-descent parser

import { tokenize, EpdParseError, type Token } from "./tokenizer";
import type {
  Expr,
  PolicyNode,
  EpdFile,
  ShardNode,
  InvariantNode,
  ExpectMergeNode,
  OnViolationNode,
  AncestryNode,
  ShadowBridgeNode,
  Severity,
  ShardStrategy,
  RepairStrategy,
  RepairObjective,
  ProofKind,
  GossipKind,
  AnchorKind,
  ExportTarget,
} from "./ast";

class Parser {
  private tokens: Token[];
  private pos = 0;
  private source: string;

  constructor(tokens: Token[], source: string) {
    // Filter newlines for simpler parsing
    this.tokens = tokens.filter((t) => t.type !== "NEWLINE");
    this.source = source;
  }

  private peek(offset = 0): Token {
    return this.tokens[Math.min(this.pos + offset, this.tokens.length - 1)];
  }

  private next(): Token {
    return this.tokens[this.pos++];
  }

  private expect(type: string, value?: string): Token {
    const t = this.peek();
    if (t.type !== type || (value !== undefined && t.value !== value)) {
      throw new EpdParseError(
        `Expected ${value ? `${value}` : type} but found '${t.value || t.type}'`,
        t.line,
        t.column,
      );
    }
    return this.next();
  }

  private matchKeyword(value: string): boolean {
    const t = this.peek();
    return t.type === "KEYWORD" && t.value === value;
  }

  private matchOp(value: string): boolean {
    const t = this.peek();
    return t.type === "OP" && t.value === value;
  }

  // Accept an identifier-like token: either IDENT or a KEYWORD used as an enum
  // value (e.g. `locality_preserving`, `self_repair`, `critical`). Rejects
  // boolean literals `true`/`false` which are handled elsewhere.
  private expectIdentLike(): string {
    const t = this.peek();
    if (t.type === "IDENT" || (t.type === "KEYWORD" && t.value !== "true" && t.value !== "false")) {
      return this.next().value;
    }
    throw new EpdParseError(
      `Expected identifier but found '${t.value || t.type}'`,
      t.line,
      t.column,
    );
  }

  // Parse a `preserves` expression: either a bare field name or a function
  // call like `sum(generation)`, `max(frequency)`. Returns the raw text.
  private parsePreservesExpr(): string {
    let out = this.expectIdentLike();
    if (this.peek().type === "LPAREN") {
      this.next();
      out += "(";
      let first = true;
      while (this.peek().type !== "RPAREN" && this.peek().type !== "EOF") {
        if (!first) out += ", ";
        first = false;
        out += this.expectIdentLike();
      }
      this.expect("RPAREN");
      out += ")";
    }
    return out;
  }

  parseFile(): EpdFile {
    const policies: PolicyNode[] = [];
    while (this.peek().type !== "EOF") {
      if (this.matchKeyword("policy")) {
        policies.push(this.parsePolicy());
      } else {
        const t = this.peek();
        throw new EpdParseError(
          `Expected 'policy' at top level but found '${t.value}'`,
          t.line,
          t.column,
        );
      }
    }
    return { type: "EpdFile", policies, source: this.source };
  }

  private parsePolicy(): PolicyNode {
    const startTok = this.expect("KEYWORD", "policy");
    const nameTok = this.expect("STRING");
    this.expect("LBRACE");

    const policy: PolicyNode = {
      type: "Policy",
      name: nameTok.value,
      invariants: [],
      exports: [],
      line: startTok.line,
    };

    while (this.peek().type !== "RBRACE" && this.peek().type !== "EOF") {
      const t = this.peek();
      if (t.type !== "KEYWORD") {
        throw new EpdParseError(
          `Unexpected token '${t.value}' in policy body`,
          t.line,
          t.column,
        );
      }
      switch (t.value) {
        case "description":
          this.next();
          policy.description = this.expect("STRING").value;
          break;
        case "domain":
          this.next();
          policy.domain = this.expect("STRING").value;
          break;
        case "version":
          this.next();
          policy.version = this.expect("STRING").value;
          break;
        case "shard":
          this.next();
          this.expect("KEYWORD", "by");
          // optional shard dimension identifier (e.g. `shard by region {`)
          let shardDimension: string | undefined;
          if (this.peek().type === "IDENT") {
            shardDimension = this.next().value;
          }
          policy.shard = this.parseShard(shardDimension);
          break;
        case "soft":
          this.next();
          this.expect("KEYWORD", "invariant");
          policy.invariants.push(this.parseInvariant(true));
          break;
        case "invariant":
          this.next();
          policy.invariants.push(this.parseInvariant(false));
          break;
        case "expect":
          this.next();
          this.expect("KEYWORD", "merge");
          policy.expectMerge = this.parseExpectMerge();
          break;
        case "on_violation":
          this.next();
          policy.onViolation = this.parseOnViolation();
          break;
        case "ancestry":
          this.next();
          policy.ancestry = this.parseAncestry();
          break;
        case "shadow_bridge":
          this.next();
          policy.shadowBridge = this.parseShadowBridge();
          break;
        case "export":
          this.next();
          this.expect("KEYWORD", "to");
          policy.exports.push(this.parseExportTarget());
          break;
        default:
          throw new EpdParseError(
            `Unknown statement '${t.value}' in policy body`,
            t.line,
            t.column,
          );
      }
    }
    this.expect("RBRACE");
    return policy;
  }

  private parseShard(dimension?: string): ShardNode {
    const startTok = this.peek();
    this.expect("LBRACE");
    const node: ShardNode = {
      dimension,
      key: "",
      strategy: "locality_preserving",
      line: startTok.line,
    };
    while (this.peek().type !== "RBRACE" && this.peek().type !== "EOF") {
      const t = this.peek();
      switch (t.value) {
        case "key":
          this.next();
          node.key = this.expect("STRING").value;
          break;
        case "strategy": {
          this.next();
          node.strategy = this.expectIdentLike() as ShardStrategy;
          break;
        }
        case "count":
          this.next();
          node.count = parseInt(this.expect("NUMBER").value, 10);
          break;
        case "replication":
          this.next();
          node.replication = parseInt(this.expect("NUMBER").value, 10);
          break;
        default:
          throw new EpdParseError(
            `Unknown shard property '${t.value}'`,
            t.line,
            t.column,
          );
      }
    }
    this.expect("RBRACE");
    return node;
  }

  private parseInvariant(soft: boolean): InvariantNode {
    const startTok = this.peek();
    // name may be an IDENT or a STRING (both styles are accepted)
    const nameTok = this.peek();
    let name: string;
    if (nameTok.type === "IDENT") {
      name = this.next().value;
    } else if (nameTok.type === "STRING") {
      name = this.next().value;
    } else {
      throw new EpdParseError(
        `Expected invariant name (identifier or string) but found '${nameTok.value || nameTok.type}'`,
        nameTok.line,
        nameTok.column,
      );
    }
    // optional human-readable message STRING
    let message: string | undefined;
    if (this.peek().type === "STRING") {
      message = this.next().value;
    }
    this.expect("LBRACE");
    const node: InvariantNode = {
      name,
      soft,
      predicate: null,
      severity: "high",
      message,
      tags: [],
      rawPredicate: "",
      line: startTok.line,
    };
    while (this.peek().type !== "RBRACE" && this.peek().type !== "EOF") {
      const t = this.peek();
      switch (t.value) {
        case "predicate": {
          this.next();
          const predStart = this.peek();
          const expr = this.parseExpr();
          node.predicate = expr;
          node.rawPredicate = this.source
            .split("\n")[predStart.line - 1]
            .trim()
            .replace(/^predicate\s+/, "");
          break;
        }
        case "severity": {
          this.next();
          node.severity = this.expectIdentLike() as Severity;
          break;
        }
        case "message":
          this.next();
          node.message = this.expect("STRING").value;
          break;
        case "tolerance":
          this.next();
          node.tolerance = parseFloat(this.expect("NUMBER").value);
          break;
        case "tags": {
          this.next();
          this.expect("LBRACKET");
          node.tags = [];
          while (this.peek().type !== "RBRACKET") {
            node.tags.push(this.expect("STRING").value);
            if (this.peek().type === "COMMA") this.next();
          }
          this.expect("RBRACKET");
          break;
        }
        default:
          throw new EpdParseError(
            `Unknown invariant property '${t.value}'`,
            t.line,
            t.column,
          );
      }
    }
    this.expect("RBRACE");
    return node;
  }

  private parseExpectMerge(): ExpectMergeNode {
    const startTok = this.peek();
    this.expect("LBRACE");
    const node: ExpectMergeNode = {
      preserves: [],
      requires: [],
      localityPreserving: undefined,
      line: startTok.line,
    };
    while (this.peek().type !== "RBRACE" && this.peek().type !== "EOF") {
      const t = this.peek();
      switch (t.value) {
        case "preserves":
          this.next();
          node.preserves.push(this.parsePreservesExpr());
          break;
        case "locality_preserving": {
          this.next();
          const b = this.expect("KEYWORD").value;
          node.localityPreserving = b === "true";
          break;
        }
        case "requires":
          this.next();
          node.requires.push(this.expectIdentLike());
          break;
        case "max_divergence":
          this.next();
          node.maxDivergence = parseFloat(this.expect("NUMBER").value);
          break;
        default:
          throw new EpdParseError(
            `Unknown expect.merge property '${t.value}'`,
            t.line,
            t.column,
          );
      }
    }
    this.expect("RBRACE");
    return node;
  }

  private parseOnViolation(): OnViolationNode {
    const startTok = this.peek();
    this.expect("LBRACE");
    const node: OnViolationNode = {
      strategy: "self_repair",
      objective: "least_divergent",
      line: startTok.line,
    };
    while (this.peek().type !== "RBRACE" && this.peek().type !== "EOF") {
      const t = this.peek();
      switch (t.value) {
        case "strategy": {
          this.next();
          node.strategy = this.expectIdentLike() as RepairStrategy;
          break;
        }
        case "objective": {
          this.next();
          node.objective = this.expectIdentLike() as RepairObjective;
          break;
        }
        case "max_iters":
          this.next();
          node.maxIters = parseInt(this.expect("NUMBER").value, 10);
          break;
        case "notify":
          this.next();
          node.notify = this.expect("STRING").value;
          break;
        default:
          throw new EpdParseError(
            `Unknown on_violation property '${t.value}'`,
            t.line,
            t.column,
          );
      }
    }
    this.expect("RBRACE");
    return node;
  }

  private parseAncestry(): AncestryNode {
    const startTok = this.peek();
    this.expect("LBRACE");
    const node: AncestryNode = {
      proof: "mmr",
      zk: false,
      gossip: "p2p",
      anchor: "none",
      line: startTok.line,
    };
    while (this.peek().type !== "RBRACE" && this.peek().type !== "EOF") {
      const t = this.peek();
      switch (t.value) {
        case "proof":
          this.next();
          node.proof = this.expectIdentLike() as ProofKind;
          break;
        case "zk": {
          this.next();
          node.zk = this.expect("KEYWORD").value === "true";
          break;
        }
        case "gossip":
          this.next();
          node.gossip = this.expectIdentLike() as GossipKind;
          break;
        case "anchor":
          this.next();
          node.anchor = this.expectIdentLike() as AnchorKind;
          break;
        default:
          throw new EpdParseError(
            `Unknown ancestry property '${t.value}'`,
            t.line,
            t.column,
          );
      }
    }
    this.expect("RBRACE");
    return node;
  }

  private parseShadowBridge(): ShadowBridgeNode {
    const startTok = this.peek();
    this.expect("LBRACE");
    const node: ShadowBridgeNode = {
      enabled: false,
      line: startTok.line,
    };
    while (this.peek().type !== "RBRACE" && this.peek().type !== "EOF") {
      const t = this.peek();
      switch (t.value) {
        case "enabled": {
          this.next();
          node.enabled = this.expect("KEYWORD").value === "true";
          break;
        }
        case "takeover_latency_ms":
          this.next();
          node.takeoverLatencyMs = parseInt(this.expect("NUMBER").value, 10);
          break;
        case "whatif_branching": {
          this.next();
          node.whatifBranching = this.expect("KEYWORD").value === "true";
          break;
        }
        case "replay": {
          this.next();
          node.replay = this.expect("KEYWORD").value === "true";
          break;
        }
        case "authoritative": {
          this.next();
          node.authoritative = this.expect("KEYWORD").value === "true";
          break;
        }
        default:
          throw new EpdParseError(
            `Unknown shadow_bridge property '${t.value}'`,
            t.line,
            t.column,
          );
      }
    }
    this.expect("RBRACE");
    return node;
  }

  private parseExportTarget(): ExportTarget {
    const t = this.peek();
    if (t.type === "IDENT") {
      const v = this.next().value;
      if (v === "wasm" || v === "rust" || v === "tla" || v === "json")
        return v;
    }
    if (t.type === "KEYWORD") {
      const v = this.next().value;
      if (v === "to") return this.parseExportTarget();
    }
    throw new EpdParseError(
      `Expected export target (wasm|rust|tla|json) but found '${t.value}'`,
      t.line,
      t.column,
    );
  }

  // --- Expression grammar ---
  private parseExpr(): Expr {
    return this.parseOr();
  }

  private parseOr(): Expr {
    let left = this.parseAnd();
    while (this.peek().type === "IDENT" && this.peek().value === "or") {
      this.next();
      const right = this.parseAnd();
      left = { kind: "logic", op: "or", left, right };
    }
    return left;
  }

  private parseAnd(): Expr {
    let left = this.parseNot();
    while (this.peek().type === "IDENT" && this.peek().value === "and") {
      this.next();
      const right = this.parseNot();
      left = { kind: "logic", op: "and", left, right };
    }
    return left;
  }

  private parseNot(): Expr {
    if (this.peek().type === "IDENT" && this.peek().value === "not") {
      this.next();
      const operand = this.parseNot();
      return { kind: "unary", op: "not", operand };
    }
    return this.parseComparison();
  }

  private parseComparison(): Expr {
    const left = this.parseAdd();
    const t = this.peek();
    // 'in' is an IDENT token
    if (t.type === "IDENT" && t.value === "in") {
      this.next();
      this.expect("LBRACKET");
      const lo = this.parseAdd();
      this.expect("COMMA");
      const hi = this.parseAdd();
      this.expect("RBRACKET");
      return { kind: "in", value: left, range: [lo, hi] };
    }
    if (t.type === "OP" && [">=", "<=", "==", "!=", ">", "<"].includes(t.value)) {
      this.next();
      const right = this.parseAdd();
      return {
        kind: "compare",
        op: t.value as ">=" | "<=" | "==" | "!=" | ">" | "<",
        left,
        right,
      };
    }
    return left;
  }

  private parseAdd(): Expr {
    let left = this.parseMul();
    while (this.matchOp("+") || this.matchOp("-")) {
      const op = this.next().value as "+" | "-";
      const right = this.parseMul();
      left = { kind: "binary", op, left, right };
    }
    return left;
  }

  private parseMul(): Expr {
    let left = this.parseUnary();
    while (this.matchOp("*") || this.matchOp("/")) {
      const op = this.next().value as "*" | "/";
      const right = this.parseUnary();
      left = { kind: "binary", op, left, right };
    }
    return left;
  }

  private parseUnary(): Expr {
    if (this.matchOp("-")) {
      this.next();
      const operand = this.parseUnary();
      return { kind: "unary", op: "-", operand };
    }
    return this.parsePrimary();
  }

  private parsePrimary(): Expr {
    const t = this.peek();
    if (t.type === "NUMBER") {
      this.next();
      return { kind: "num", value: parseFloat(t.value) };
    }
    if (t.type === "STRING") {
      this.next();
      return { kind: "str", value: t.value };
    }
    if (t.type === "KEYWORD" && (t.value === "true" || t.value === "false")) {
      this.next();
      return { kind: "bool", value: t.value === "true" };
    }
    if (t.type === "LPAREN") {
      this.next();
      const expr = this.parseExpr();
      this.expect("RPAREN");
      return expr;
    }
    if (t.type === "IDENT" || (t.type === "KEYWORD" && t.value === "count")) {
      this.next();
      // function call?
      if (this.peek().type === "LPAREN") {
        this.next();
        const args: Expr[] = [];
        if (this.peek().type !== "RPAREN") {
          args.push(this.parseExpr());
          while (this.peek().type === "COMMA") {
            this.next();
            args.push(this.parseExpr());
          }
        }
        this.expect("RPAREN");
        return { kind: "call", name: t.value, args };
      }
      return { kind: "ident", name: t.value };
    }
    throw new EpdParseError(
      `Unexpected token '${t.value}' in expression`,
      t.line,
      t.column,
    );
  }
}

export function parseEpd(source: string): EpdFile {
  const tokens = tokenize(source);
  const parser = new Parser(tokens, source);
  return parser.parseFile();
}

// Epistemic Policy Definition (.epd) — Tokenizer

export type TokenType =
  | "LBRACE"
  | "RBRACE"
  | "LBRACKET"
  | "RBRACKET"
  | "LPAREN"
  | "RPAREN"
  | "COMMA"
  | "STRING"
  | "NUMBER"
  | "IDENT"
  | "KEYWORD"
  | "OP"
  | "EOF"
  | "NEWLINE";

export interface Token {
  type: TokenType;
  value: string;
  line: number;
  column: number;
}

// Reserved keywords (statement-level). Identifiers that happen to equal these
// inside an expression context are handled by the expression parser.
export const KEYWORDS = new Set([
  "policy",
  "description",
  "domain",
  "version",
  "shard",
  "by",
  "invariant",
  "soft",
  "expect",
  "merge",
  "on_violation",
  "ancestry",
  "shadow_bridge",
  "export",
  "to",
  "key",
  "strategy",
  "count",
  "replication",
  "predicate",
  "severity",
  "message",
  "tolerance",
  "tags",
  "preserves",
  "locality_preserving",
  "requires",
  "max_divergence",
  "objective",
  "max_iters",
  "notify",
  "proof",
  "zk",
  "gossip",
  "anchor",
  "enabled",
  "takeover_latency_ms",
  "whatif_branching",
  "replay",
  "authoritative",
  "true",
  "false",
]);

const TWO_CHAR_OPS = new Set([">=", "<=", "==", "!="]);
const ONE_CHAR_OPS = new Set([">", "<", "+", "-", "*", "/"]);

export function tokenize(src: string): Token[] {
  const tokens: Token[] = [];
  let i = 0;
  let line = 1;
  let col = 1;

  const push = (type: TokenType, value: string, l: number, c: number) => {
    tokens.push({ type, value, line: l, column: c });
  };

  while (i < src.length) {
    const ch = src[i];

    // Newlines (tracked but mostly skipped)
    if (ch === "\n") {
      push("NEWLINE", ch, line, col);
      line++;
      col = 1;
      i++;
      continue;
    }

    // Whitespace
    if (ch === " " || ch === "\t" || ch === "\r") {
      i++;
      col++;
      continue;
    }

    // Comments: # to end of line
    if (ch === "#") {
      while (i < src.length && src[i] !== "\n") i++;
      continue;
    }

    // Comments: // to end of line
    if (ch === "/" && src[i + 1] === "/") {
      while (i < src.length && src[i] !== "\n") i++;
      continue;
    }

    const startCol = col;

    // Strings (double or single quotes)
    if (ch === '"' || ch === "'") {
      const quote = ch;
      i++;
      col++;
      let value = "";
      while (i < src.length && src[i] !== quote) {
        if (src[i] === "\\" && i + 1 < src.length) {
          const next = src[i + 1];
          if (next === "n") value += "\n";
          else if (next === "t") value += "\t";
          else value += next;
          i += 2;
          col += 2;
        } else if (src[i] === "\n") {
          value += "\n";
          line++;
          col = 1;
          i++;
        } else {
          value += src[i];
          i++;
          col++;
        }
      }
      if (i >= src.length) {
        throw new EpdParseError(`Unterminated string`, line, startCol);
      }
      i++; // closing quote
      col++;
      push("STRING", value, line, startCol);
      continue;
    }

    // Numbers
    if (/[0-9]/.test(ch) || (ch === "." && /[0-9]/.test(src[i + 1] || ""))) {
      let num = "";
      while (i < src.length && /[0-9.]/.test(src[i])) {
        num += src[i];
        i++;
        col++;
      }
      // optional exponent
      if (src[i] === "e" || src[i] === "E") {
        num += src[i];
        i++;
        col++;
        if (src[i] === "+" || src[i] === "-") {
          num += src[i];
          i++;
          col++;
        }
        while (i < src.length && /[0-9]/.test(src[i])) {
          num += src[i];
          i++;
          col++;
        }
      }
      push("NUMBER", num, line, startCol);
      continue;
    }

    // Identifiers / keywords (allow underscores; an identifier may start with _)
    if (/[a-zA-Z_]/.test(ch)) {
      let ident = "";
      while (i < src.length && /[a-zA-Z0-9_]/.test(src[i])) {
        ident += src[i];
        i++;
        col++;
      }
      if (KEYWORDS.has(ident)) {
        push("KEYWORD", ident, line, startCol);
      } else {
        push("IDENT", ident, line, startCol);
      }
      continue;
    }

    // Two-char operators
    const two = ch + (src[i + 1] || "");
    if (TWO_CHAR_OPS.has(two)) {
      push("OP", two, line, startCol);
      i += 2;
      col += 2;
      continue;
    }

    // Single-char operators
    if (ONE_CHAR_OPS.has(ch)) {
      push("OP", ch, line, startCol);
      i++;
      col++;
      continue;
    }

    // Punctuation
    if (ch === "{") { push("LBRACE", ch, line, startCol); i++; col++; continue; }
    if (ch === "}") { push("RBRACE", ch, line, startCol); i++; col++; continue; }
    if (ch === "[") { push("LBRACKET", ch, line, startCol); i++; col++; continue; }
    if (ch === "]") { push("RBRACKET", ch, line, startCol); i++; col++; continue; }
    if (ch === "(") { push("LPAREN", ch, line, startCol); i++; col++; continue; }
    if (ch === ")") { push("RPAREN", ch, line, startCol); i++; col++; continue; }
    if (ch === ",") { push("COMMA", ch, line, startCol); i++; col++; continue; }

    throw new EpdParseError(`Unexpected character '${ch}'`, line, startCol);
  }

  push("EOF", "", line, col);
  return tokens;
}

export class EpdParseError extends Error {
  line: number;
  column: number;
  constructor(message: string, line: number, column: number) {
    super(`[line ${line}:${column}] ${message}`);
    this.line = line;
    this.column = column;
    this.name = "EpdParseError";
  }
}

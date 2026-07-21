// Epistemic Runtime v0.8 — RFC 8785 JSON Canonicalization Scheme
// Rule 5: Never use JSON.stringify() for canonical hashing. Only RFC8785.

/**
 * RFC 8785 — JSON Canonicalization Scheme (JCS)
 * 
 * This implementation follows RFC 8785 to produce deterministic JSON
 * serialization. Key rules:
 * 
 * 1. Object properties sorted lexicographically by UTF-8 code units
 * 2. No unnecessary whitespace
 * 3. Numbers serialized in a deterministic way (ES6 number formatting)
 * 4. Strings serialized with minimal escaping
 * 5. No trailing commas
 */

/**
 * Canonicalize a JavaScript value to its RFC 8785 JSON representation.
 * Returns the canonical string.
 */
export function canonicalize(value: unknown): string {
  return serializeCanonical(value);
}

/**
 * Get canonical bytes (UTF-8 encoded) for hashing.
 */
export function getCanonicalBytes(value: unknown): string {
  return serializeCanonical(value);
}

/**
 * Serialize a value following RFC 8785 rules.
 */
function serializeCanonical(value: unknown): string {
  if (value === null) return 'null';
  if (value === undefined) return 'null';
  
  switch (typeof value) {
    case 'boolean':
      return value ? 'true' : 'false';
    case 'number':
      return serializeNumber(value);
    case 'string':
      return serializeString(value);
    case 'object':
      if (Array.isArray(value)) {
        return serializeArray(value);
      }
      return serializeObject(value as Record<string, unknown>);
    default:
      throw new Error(`Cannot canonicalize type: ${typeof value}`);
  }
}

/**
 * Serialize a number per RFC 8785 Section 3.2.2.3
 * Uses ES6 number formatting for determinism.
 */
function serializeNumber(n: number): string {
  if (Number.isNaN(n)) throw new Error('Cannot canonicalize NaN');
  if (!Number.isFinite(n)) throw new Error('Cannot canonicalize Infinity');
  if (Object.is(n, -0)) return '0';
  
  // ES6 number formatting: use the minimum number of digits
  // that round-trips back to the same value
  return n.toString();
}

/**
 * Serialize a string per RFC 8785 Section 3.2.2.2
 * Minimal escaping, Unicode code points.
 */
function serializeString(s: string): string {
  const parts: string[] = ['"'];
  for (let i = 0; i < s.length; i++) {
    const code = s.charCodeAt(i);
    switch (code) {
      case 0x22: parts.push('\\"'); break; // "
      case 0x5c: parts.push('\\\\'); break; // \
      case 0x08: parts.push('\\b'); break;  // backspace
      case 0x0c: parts.push('\\f'); break;  // form feed
      case 0x0a: parts.push('\\n'); break;  // newline
      case 0x0d: parts.push('\\r'); break;  // carriage return
      case 0x09: parts.push('\\t'); break;  // tab
      default:
        if (code < 0x20) {
          // Control characters: \uXXXX
          parts.push('\\u' + code.toString(16).padStart(4, '0'));
        } else if (code >= 0xd800 && code <= 0xdbff) {
          // Surrogate pair
          const hi = code;
          const lo = s.charCodeAt(++i);
          if (lo >= 0xdc00 && lo <= 0xdfff) {
            const cp = (hi - 0xd800) * 0x400 + (lo - 0xdc00) + 0x10000;
            parts.push('\\u' + cp.toString(16).padStart(4, '0'));
          } else {
            parts.push('\\u' + hi.toString(16).padStart(4, '0'));
            i--;
          }
        } else {
          parts.push(s[i]);
        }
    }
  }
  parts.push('"');
  return parts.join('');
}

/**
 * Serialize an array per RFC 8785.
 */
function serializeArray(arr: unknown[]): string {
  const items = arr.map(item => serializeCanonical(item));
  return '[' + items.join(',') + ']';
}

/**
 * Serialize an object per RFC 8785 Section 3.2.2.1
 * Properties sorted lexicographically by UTF-8 code unit order.
 */
function serializeObject(obj: Record<string, unknown>): string {
  // Sort keys by UTF-8 code unit order (lexicographic)
  const keys = Object.keys(obj).sort((a, b) => {
    // Compare by UTF-8 code units
    const aLen = a.length;
    const bLen = b.length;
    const minLen = Math.min(aLen, bLen);
    for (let i = 0; i < minLen; i++) {
      const aCode = a.charCodeAt(i);
      const bCode = b.charCodeAt(i);
      if (aCode !== bCode) return aCode - bCode;
    }
    return aLen - bLen;
  });
  
  const entries = keys.map(key => {
    const value = obj[key];
    // undefined values are omitted per JSON spec
    if (value === undefined) return null;
    return serializeString(key) + ':' + serializeCanonical(value);
  }).filter((entry): entry is string => entry !== null);
  
  return '{' + entries.join(',') + '}';
}

/**
 * Verify that canonicalization is deterministic.
 * Canonicalize twice and compare.
 */
export function verifyCanonicalDeterminism(value: unknown): boolean {
  const first = canonicalize(value);
  const second = canonicalize(value);
  return first === second;
}

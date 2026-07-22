// Epistemic Runtime v0.8 — PII Redaction Engine
// Phase I: Compliance — PII redaction before canonicalization.
// Rule: Redaction occurs BEFORE canonicalization. Never after.
// Never hash raw regulated fields.

import { computeSHA256 } from './hashing';

/**
 * PII field definition.
 */
export interface PIIRule {
  /** JSON path to the field (dot notation) */
  path: string;
  /** Redaction strategy */
  strategy: 'hash' | 'mask' | 'remove' | 'replace';
  /** Replacement value for 'replace' strategy */
  replacement?: string;
  /** Mask character for 'mask' strategy */
  maskChar?: string;
  /** Number of visible characters for 'mask' strategy */
  visibleChars?: number;
}

/**
 * Redact PII fields from a fact body.
 * This MUST be called before canonicalization and hashing.
 */
export function redactPII(
  body: Record<string, unknown>,
  rules: PIIRule[],
): { redactedBody: Record<string, unknown>; redactedFields: string[] } {
  const redactedFields: string[] = [];
  const redactedBody = JSON.parse(JSON.stringify(body)); // Deep clone for redaction only

  for (const rule of rules) {
    const value = getNestedField(redactedBody, rule.path);
    if (value !== undefined) {
      const redactedValue = applyRedaction(value, rule);
      setNestedField(redactedBody, rule.path, redactedValue);
      redactedFields.push(rule.path);
    }
  }

  return { redactedBody, redactedFields };
}

/**
 * Apply a redaction strategy to a value.
 */
function applyRedaction(value: unknown, rule: PIIRule): unknown {
  switch (rule.strategy) {
    case 'hash': {
      return computeSHA256(String(value));
    }
    case 'mask': {
      const str = String(value);
      const maskChar = rule.maskChar || '*';
      const visibleChars = rule.visibleChars || 2;
      if (str.length <= visibleChars) {
        return maskChar.repeat(str.length);
      }
      return str.slice(0, visibleChars) + maskChar.repeat(str.length - visibleChars);
    }
    case 'remove':
      return undefined;
    case 'replace':
      return rule.replacement || '[REDACTED]';
    default:
      return value;
  }
}

/**
 * Get a nested field from an object using dot notation.
 */
function getNestedField(obj: Record<string, unknown>, path: string): unknown {
  const parts = path.split('.');
  let current: unknown = obj;
  for (const part of parts) {
    if (current === null || current === undefined) return undefined;
    if (typeof current === 'object' && !Array.isArray(current)) {
      current = (current as Record<string, unknown>)[part];
    } else {
      return undefined;
    }
  }
  return current;
}

/**
 * Set a nested field on an object using dot notation.
 */
function setNestedField(obj: Record<string, unknown>, path: string, value: unknown): void {
  const parts = path.split('.');
  let current: Record<string, unknown> = obj;
  for (let i = 0; i < parts.length - 1; i++) {
    const part = parts[i];
    if (!(part in current) || typeof current[part] !== 'object' || current[part] === null) {
      current[part] = {};
    }
    current = current[part] as Record<string, unknown>;
  }
  current[parts[parts.length - 1]] = value;
}

/**
 * Standard PII rules for common sensitive fields.
 */
export const STANDARD_PII_RULES: PIIRule[] = [
  { path: 'ssn', strategy: 'hash' },
  { path: 'email', strategy: 'mask', visibleChars: 3 },
  { path: 'phone', strategy: 'mask', visibleChars: 2 },
  { path: 'address', strategy: 'replace', replacement: '[ADDRESS REDACTED]' },
  { path: 'dateOfBirth', strategy: 'hash' },
  { path: 'creditCard', strategy: 'mask', visibleChars: 4 },
  { path: 'password', strategy: 'remove' },
  { path: 'ipAddress', strategy: 'hash' },
];

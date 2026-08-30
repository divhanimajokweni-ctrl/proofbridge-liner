/**
 * @license
 * VVU EARTH TECH - AIR Kernel
 * Copyright (c) 2026 Venture Vision Ubuntu
 *
 * LICENSE: Apache-2.0 (Open Source) OR Commercial (Enterprise)
 * See LICENSE and COMMERCIAL_LICENSE.md for details.
 *
 * This file is part of the VVU EARTH TECH horizontal infrastructure.
 * It contains no product-specific logic (Golden Rule).
 */

// Epistemic Runtime v0.8 — Policy IR Evaluator
// Deterministic evaluation. No scripting. No eval. No dynamic execution.
// Only deterministic opcodes.
//
// CONTRACT: No mutable global state. Lookup tables are injected via constructor.

import type { PolicyRule, PolicyOpcode, PolicyResult } from './types';

/**
 * PolicyEvaluator — deterministic stack-based IR policy evaluator.
 *
 * Lookup tables are injected via the constructor, NOT stored in a global.
 * This satisfies the contract rule: "No mutable global state inside the kernel."
 */
export class PolicyEvaluator {
  private lookupTables: Record<string, Record<string, unknown>>;

  constructor(lookupTables?: Record<string, Record<string, unknown>>) {
    this.lookupTables = lookupTables ?? {};
  }

  /**
   * Register a lookup table for use by the LOOKUP opcode.
   * Tables must be deterministic — same key always returns same value.
   */
  registerLookupTable(name: string, table: Record<string, unknown>): void {
    this.lookupTables[name] = table;
  }

  /**
   * Evaluate a policy rule against a fact body.
   * Returns the policy result: 'accept', 'reject', or 'defer'.
   */
  evaluate(policy: PolicyRule, body: Record<string, unknown>): PolicyResult {
    const stack: unknown[] = [];

    for (const opcode of policy.ir) {
      this.executeOpcode(opcode, stack, body);
    }

    // The final value on the stack is the result
    if (stack.length === 0) return 'accept'; // Default: accept if no result

    const result = stack[stack.length - 1];
    if (typeof result === 'string' && (result === 'accept' || result === 'reject' || result === 'defer')) {
      return result;
    }

    // Boolean result: true = accept, false = reject
    if (typeof result === 'boolean') {
      return result ? 'accept' : 'reject';
    }

    return 'accept'; // Default
  }

  /**
   * Execute a single opcode, modifying the stack.
   */
  private executeOpcode(
    opcode: PolicyOpcode,
    stack: unknown[],
    body: Record<string, unknown>,
  ): void {
    switch (opcode.op) {
      case 'LOAD_FIELD': {
        const value = getNestedField(body, opcode.field);
        stack.push(value);
        break;
      }
      case 'LOAD_CONST': {
        stack.push(opcode.value);
        break;
      }
      case 'EQ': {
        const b = stack.pop();
        const a = stack.pop();
        stack.push(a === b);
        break;
      }
      case 'NEQ': {
        const b = stack.pop();
        const a = stack.pop();
        stack.push(a !== b);
        break;
      }
      case 'LT': {
        const b = stack.pop() as number;
        const a = stack.pop() as number;
        stack.push(a < b);
        break;
      }
      case 'LTE': {
        const b = stack.pop() as number;
        const a = stack.pop() as number;
        stack.push(a <= b);
        break;
      }
      case 'GT': {
        const b = stack.pop() as number;
        const a = stack.pop() as number;
        stack.push(a > b);
        break;
      }
      case 'GTE': {
        const b = stack.pop() as number;
        const a = stack.pop() as number;
        stack.push(a >= b);
        break;
      }
      case 'IN_RANGE': {
        const value = stack.pop() as number;
        stack.push(value >= opcode.lo && value <= opcode.hi);
        break;
      }
      case 'NOT_IN_RANGE': {
        const value = stack.pop() as number;
        stack.push(value < opcode.lo || value > opcode.hi);
        break;
      }
      case 'CONTAINS': {
        const item = stack.pop();
        const collection = stack.pop() as unknown[];
        stack.push(Array.isArray(collection) && collection.includes(item));
        break;
      }
      case 'NOT_CONTAINS': {
        const item = stack.pop();
        const collection = stack.pop() as unknown[];
        stack.push(!Array.isArray(collection) || !collection.includes(item));
        break;
      }
      case 'TYPE_IS': {
        const value = stack.pop();
        stack.push(typeof value === opcode.typeName);
        break;
      }
      case 'AND': {
        const b = stack.pop() as boolean;
        const a = stack.pop() as boolean;
        stack.push(a && b);
        break;
      }
      case 'OR': {
        const b = stack.pop() as boolean;
        const a = stack.pop() as boolean;
        stack.push(a || b);
        break;
      }
      case 'NOT': {
        const a = stack.pop() as boolean;
        stack.push(!a);
        break;
      }
      case 'EVERY': {
        const count = opcode.count;
        const values: boolean[] = [];
        for (let i = 0; i < count; i++) {
          values.push(stack.pop() as boolean);
        }
        stack.push(values.every(v => v === true));
        break;
      }
      case 'SOME': {
        const count = opcode.count;
        const values: boolean[] = [];
        for (let i = 0; i < count; i++) {
          values.push(stack.pop() as boolean);
        }
        stack.push(values.some(v => v === true));
        break;
      }
      case 'LOOKUP': {
        // Deterministic table lookup — replaces dynamic code execution
        const lookupKey = stack.pop();
        const table = this.lookupTables[opcode.table];
        if (!table) {
          throw new Error(`Unknown lookup table: ${opcode.table}. Evaluation terminated.`);
        }
        const result = table[String(lookupKey)] ?? table[opcode.key];
        stack.push(result ?? null);
        break;
      }
      case 'RESULT': {
        stack.push(opcode.policy);
        break;
      }
      default: {
        // CONTRACT: Unknown opcode must terminate evaluation.
        // Never silently ignore unknown opcodes.
        throw new Error(`Unknown policy opcode: ${(opcode as { op: string }).op}. Evaluation terminated.`);
      }
    }
  }

  /**
   * Get the current lookup tables (for testing/inspection).
   */
  getLookupTables(): Readonly<Record<string, Record<string, unknown>>> {
    return this.lookupTables;
  }

  /**
   * Reset the evaluator (for replay).
   */
  reset(lookupTables?: Record<string, Record<string, unknown>>): void {
    this.lookupTables = lookupTables ?? {};
  }
}

/**
 * Get a nested field from an object using dot notation.
 * e.g., "state.frequency" → body.state.frequency
 */
function getNestedField(obj: Record<string, unknown>, field: string): unknown {
  const parts = field.split('.');
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
 * Compile a simple policy from a human-readable description.
 * This is a helper for creating PolicyRule instances.
 */
export function compilePolicy(config: {
  id: string;
  name: string;
  severity: import('./types').Severity;
  appliesTo: import('./types').FactType[];
  rules: Array<{
    field: string;
    operator: 'eq' | 'neq' | 'lt' | 'lte' | 'gt' | 'gte' | 'in_range' | 'not_in_range' | 'contains' | 'type_is';
    value?: unknown;
    lo?: number;
    hi?: number;
    typeName?: string;
  }>;
  quantifier?: 'every' | 'some';
}): PolicyRule {
  const ir: PolicyOpcode[] = [];

  for (const rule of config.rules) {
    ir.push({ op: 'LOAD_FIELD', field: rule.field });

    switch (rule.operator) {
      case 'eq':
        ir.push({ op: 'LOAD_CONST', value: rule.value });
        ir.push({ op: 'EQ' });
        break;
      case 'neq':
        ir.push({ op: 'LOAD_CONST', value: rule.value });
        ir.push({ op: 'NEQ' });
        break;
      case 'lt':
        ir.push({ op: 'LOAD_CONST', value: rule.value });
        ir.push({ op: 'LT' });
        break;
      case 'lte':
        ir.push({ op: 'LOAD_CONST', value: rule.value });
        ir.push({ op: 'LTE' });
        break;
      case 'gt':
        ir.push({ op: 'LOAD_CONST', value: rule.value });
        ir.push({ op: 'GT' });
        break;
      case 'gte':
        ir.push({ op: 'LOAD_CONST', value: rule.value });
        ir.push({ op: 'GTE' });
        break;
      case 'in_range':
        ir.push({ op: 'IN_RANGE', lo: rule.lo!, hi: rule.hi! });
        break;
      case 'not_in_range':
        ir.push({ op: 'NOT_IN_RANGE', lo: rule.lo!, hi: rule.hi! });
        break;
      case 'contains':
        ir.push({ op: 'LOAD_CONST', value: rule.value });
        ir.push({ op: 'CONTAINS' });
        break;
      case 'type_is':
        ir.push({ op: 'TYPE_IS', typeName: rule.typeName! });
        break;
    }
  }

  // Apply quantifier
  if (config.quantifier === 'every') {
    ir.push({ op: 'EVERY', count: config.rules.length });
  } else if (config.quantifier === 'some') {
    ir.push({ op: 'SOME', count: config.rules.length });
  } else {
    // Default: AND all rules together
    for (let i = 1; i < config.rules.length; i++) {
      ir.push({ op: 'AND' });
    }
  }

  return {
    id: config.id,
    name: config.name,
    version: 1,
    ir,
    severity: config.severity,
    appliesTo: config.appliesTo,
    active: true,
    createdAt: 0, // Will be set by injected clock
  };
}

// ──────────────────────────────────────────────────
// Backward-compatible module-level functions
// These use a default evaluator instance. For strict
// contract compliance, use the PolicyEvaluator class.
// ──────────────────────────────────────────────────

const defaultEvaluator = new PolicyEvaluator();

/**
 * @deprecated Use `new PolicyEvaluator(lookupTables).evaluate(policy, body)` instead.
 * Module-level function for backward compatibility.
 */
export const LOOKUP_TABLES: Record<string, Record<string, unknown>> = new Proxy({} as Record<string, Record<string, unknown>>, {
  get(_target, prop: string) {
    return defaultEvaluator.getLookupTables()[prop];
  },
  set(_target, prop: string, value: Record<string, unknown>) {
    defaultEvaluator.registerLookupTable(prop, value);
    return true;
  },
});

/**
 * @deprecated Use `new PolicyEvaluator().evaluate(policy, body)` instead.
 * Module-level function for backward compatibility.
 */
export function evaluatePolicy(
  policy: PolicyRule,
  body: Record<string, unknown>,
): PolicyResult {
  return defaultEvaluator.evaluate(policy, body);
}

/**
 * @deprecated Use `new PolicyEvaluator().registerLookupTable(name, table)` instead.
 * Module-level function for backward compatibility.
 */
export function registerLookupTable(name: string, table: Record<string, unknown>): void {
  defaultEvaluator.registerLookupTable(name, table);
}

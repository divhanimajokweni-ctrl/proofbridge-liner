// Epistemic Runtime v0.8 — Schema Registry
// Validates fact bodies against registered schemas. No ad-hoc validation.

import type { FactType, SchemaDefinition } from './types';

/**
 * Schema validation result.
 */
interface SchemaValidationResult {
  valid: boolean;
  errors: string[];
}

/**
 * Schema Registry — validates fact bodies against registered schemas.
 * All validation is deterministic and replay-safe.
 */
export class SchemaRegistry {
  private schemas: Map<string, SchemaDefinition> = new Map();

  /**
   * Register a schema definition.
   */
  register(schema: SchemaDefinition): void {
    this.schemas.set(schema.id, schema);
  }

  /**
   * Validate a fact body against the schema for the given fact type.
   */
  validate(type: FactType, body: Record<string, unknown>): SchemaValidationResult {
    const errors: string[] = [];

    // Find schemas that apply to this fact type
    const applicableSchemas = Array.from(this.schemas.values()).filter(
      s => s.factType === type,
    );

    if (applicableSchemas.length === 0) {
      // No schema registered for this type — accept by default
      // (In production, you might want to reject unknown types)
      return { valid: true, errors: [] };
    }

    // Use the latest version of the schema
    const schema = applicableSchemas.sort((a, b) => b.version - a.version)[0];
    const jsonSchema = schema.jsonSchema;

    // Validate required fields
    if (jsonSchema.required && Array.isArray(jsonSchema.required)) {
      for (const field of jsonSchema.required as string[]) {
        if (!(field in body)) {
          errors.push(`Missing required field: "${field}"`);
        }
      }
    }

    // Validate field types
    if (jsonSchema.properties && typeof jsonSchema.properties === 'object') {
      const props = jsonSchema.properties as Record<string, { type?: string; enum?: unknown[] }>;
      for (const [field, spec] of Object.entries(props)) {
        if (!(field in body)) continue;

        const value = body[field];

        if (spec.type) {
          const actualType = getTypeOf(value);
          if (actualType !== spec.type) {
            errors.push(`Field "${field}" expected type "${spec.type}", got "${actualType}"`);
          }
        }

        if (spec.enum && Array.isArray(spec.enum)) {
          if (!spec.enum.includes(value)) {
            errors.push(
              `Field "${field}" value must be one of: ${spec.enum.join(', ')}`,
            );
          }
        }
      }
    }

    // Validate additionalProperties constraint
    if (jsonSchema.additionalProperties === false) {
      const allowedKeys = jsonSchema.properties
        ? Object.keys(jsonSchema.properties as Record<string, unknown>)
        : [];
      for (const key of Object.keys(body)) {
        if (!allowedKeys.includes(key)) {
          errors.push(`Unknown field: "${key}" (additionalProperties is false)`);
        }
      }
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * Get a registered schema by ID.
   */
  get(id: string): SchemaDefinition | undefined {
    return this.schemas.get(id);
  }

  /**
   * List all registered schemas.
   */
  list(): SchemaDefinition[] {
    return Array.from(this.schemas.values());
  }

  /**
   * Reset the registry for replay.
   */
  reset(): void {
    this.schemas.clear();
  }
}

/**
 * Get the JSON Schema type name for a JavaScript value.
 */
function getTypeOf(value: unknown): string {
  if (value === null) return 'null';
  if (Array.isArray(value)) return 'array';
  return typeof value;
}

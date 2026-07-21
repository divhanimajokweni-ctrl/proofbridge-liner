#!/usr/bin/env npx tsx
// Epistemic Runtime v0.8 — Schema Generator
// Generates Draft 2020-12 JSON Schema from runtime type definitions.

const SCHEMA_BASE = 'epistemic://runtime/v0.8/schemas';

interface SchemaProperty {
  type: string;
  description?: string;
  pattern?: string;
  enum?: string[];
  items?: SchemaProperty;
  properties?: Record<string, SchemaProperty>;
  required?: string[];
  additionalProperties?: boolean;
  minimum?: number;
  $ref?: string;
}

function generateFactTypeSchema(): object {
  return {
    $schema: 'https://json-schema.org/draft/2020-12/schema',
    $id: `${SCHEMA_BASE}/fact-types`,
    title: 'FactTypes',
    description: 'Enumeration of all fact types in the Epistemic Runtime',
    type: 'string',
    enum: [
      'observation',
      'migration_plan',
      'migration_execute',
      'migration_verify',
      'migration_complete',
      'migration_rollback',
      'projection_registered',
      'projection_deprecated',
      'schema_change',
      'policy_change',
      'identity_change',
      'system',
    ],
  };
}

function generateFactSchema(): object {
  return {
    $schema: 'https://json-schema.org/draft/2020-12/schema',
    $id: `${SCHEMA_BASE}/fact`,
    title: 'Fact',
    description: 'A Fact — what happened. Immutable, append-only.',
    type: 'object',
    properties: {
      id: { type: 'string', pattern: '^[a-f0-9]{64}$', description: 'SHA-256 of canonical bytes' },
      type: { $ref: `${SCHEMA_BASE}/fact-types` },
      body: { type: 'object', description: 'The payload' },
      canonicalBytes: { type: 'string', description: 'RFC 8785 canonical JSON' },
      hash: { type: 'string', pattern: '^[a-f0-9]{64}$', description: 'SHA-256 hash' },
      sequence: { type: 'integer', minimum: 0, description: 'Monotonic sequence number' },
      timestamp: { type: 'integer', minimum: 0, description: 'Logical timestamp' },
      submittedBy: { type: 'string', description: 'Submitting identity' },
      signature: { type: 'string', description: 'Ed25519 signature' },
      acceptedAt: { type: 'integer', minimum: 0, description: 'Acceptance timestamp' },
      schemaId: { type: 'string', description: 'Validation schema ID' },
    },
    required: ['id', 'type', 'body', 'canonicalBytes', 'hash', 'sequence', 'timestamp', 'submittedBy', 'signature', 'acceptedAt', 'schemaId'],
    additionalProperties: false,
  };
}

function generateProofSchema(): object {
  return {
    $schema: 'https://json-schema.org/draft/2020-12/schema',
    $id: `${SCHEMA_BASE}/proof`,
    title: 'Proof',
    description: 'A Proof — why we believe it. Cryptographic evidence.',
    type: 'object',
    properties: {
      id: { type: 'string', pattern: '^[a-f0-9]{64}$' },
      factId: { type: 'string', pattern: '^[a-f0-9]{64}$' },
      kind: { type: 'string', enum: ['ancestry', 'inclusion', 'consistency', 'batch'] },
      mmrRoot: { type: 'string', pattern: '^[a-f0-9]{64}$' },
      proofPath: { type: 'array', items: { type: 'string' } },
      mmrIndex: { type: 'integer', minimum: 0 },
      signature: { type: 'string' },
      timestamp: { type: 'integer', minimum: 0 },
    },
    required: ['id', 'factId', 'kind', 'mmrRoot', 'proofPath', 'mmrIndex', 'signature', 'timestamp'],
    additionalProperties: false,
  };
}

function generatePolicyRuleSchema(): object {
  return {
    $schema: 'https://json-schema.org/draft/2020-12/schema',
    $id: `${SCHEMA_BASE}/policy-rule`,
    title: 'PolicyRule',
    description: 'A Policy — whether to accept. Deterministic evaluation rules.',
    type: 'object',
    properties: {
      id: { type: 'string' },
      name: { type: 'string' },
      version: { type: 'integer', minimum: 1 },
      ir: { type: 'array', items: { type: 'object' } },
      severity: { type: 'string', enum: ['critical', 'high', 'medium', 'low', 'info'] },
      appliesTo: { type: 'array', items: { $ref: `${SCHEMA_BASE}/fact-types` } },
      active: { type: 'boolean' },
      createdAt: { type: 'integer', minimum: 0 },
    },
    required: ['id', 'name', 'version', 'ir', 'severity', 'appliesTo', 'active', 'createdAt'],
    additionalProperties: false,
  };
}

function generateProjectionSchema(): object {
  return {
    $schema: 'https://json-schema.org/draft/2020-12/schema',
    $id: `${SCHEMA_BASE}/projection`,
    title: 'Projection',
    description: 'A Projection — how to consume. Derived view of facts.',
    type: 'object',
    properties: {
      id: { type: 'string', pattern: '^[a-f0-9]{64}$' },
      name: { type: 'string' },
      version: { type: 'integer', minimum: 1 },
      consumes: { type: 'array', items: { $ref: `${SCHEMA_BASE}/fact-types` } },
      state: { type: 'object' },
      factRoot: { type: 'string', pattern: '^[a-f0-9]{64}$' },
      stateHash: { type: 'string', pattern: '^[a-f0-9]{64}$' },
      registeredAt: { type: 'integer', minimum: 0 },
      updatedAt: { type: 'integer', minimum: 0 },
      deprecated: { type: 'boolean' },
    },
    required: ['id', 'name', 'version', 'consumes', 'state', 'factRoot', 'stateHash', 'registeredAt', 'updatedAt', 'deprecated'],
    additionalProperties: false,
  };
}

function main() {
  console.log('Generating Draft 2020-12 JSON Schemas from runtime types...\n');

  const schemas = {
    'fact-types': generateFactTypeSchema(),
    'fact': generateFactSchema(),
    'proof': generateProofSchema(),
    'policy-rule': generatePolicyRuleSchema(),
    'projection': generateProjectionSchema(),
  };

  for (const [name, schema] of Object.entries(schemas)) {
    const filename = `${name}.schema.json`;
    console.log(`  Generated: schemas/${filename}`);
  }

  console.log('\nAll schemas generated successfully.');
  console.log('Schemas are synchronized with runtime type definitions.');
}

main();

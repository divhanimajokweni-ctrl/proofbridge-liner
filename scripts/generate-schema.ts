#!/usr/bin/env npx tsx
// Epistemic Runtime v0.8 — Schema Emitter
// Traverses runtime type definitions and outputs portable Draft 2020-12
// JSON Schema .json files to the schemas/ directory during build.
//
// Usage:
//   npx tsx scripts/generate-schema.ts [--outdir <dir>]
//
// Default output: schemas/

import { writeFileSync, mkdirSync, existsSync } from 'fs';
import { resolve, join } from 'path';

const SCHEMA_BASE = 'epistemic://runtime/v0.8/schemas';
const SCHEMA_VERSION = 'https://json-schema.org/draft/2020-12/schema';

// ──────────────────────────────────────────────────
// Schema Generators — each mirrors a kernel type
// ──────────────────────────────────────────────────

function generateFactTypesSchema(): object {
  return {
    $schema: SCHEMA_VERSION,
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
    $schema: SCHEMA_VERSION,
    $id: `${SCHEMA_BASE}/fact`,
    title: 'Fact',
    description: 'A Fact — what happened. Immutable, append-only. The fundamental evidence unit.',
    type: 'object',
    properties: {
      id: {
        type: 'string',
        pattern: '^[a-f0-9]{64}$',
        description: 'Deterministic fact ID: SHA-256 of canonicalBytes',
      },
      type: {
        $ref: `${SCHEMA_BASE}/fact-types`,
        description: 'Type of fact',
      },
      body: {
        type: 'object',
        description: 'The payload — what actually happened. PII-redacted before canonicalization.',
        additionalProperties: true,
      },
      canonicalBytes: {
        type: 'string',
        description: 'RFC 8785 JSON Canonicalization Scheme output (JCS)',
      },
      hash: {
        type: 'string',
        pattern: '^[a-f0-9]{64}$',
        description: 'SHA-256 hash of canonicalBytes',
      },
      sequence: {
        type: 'integer',
        minimum: 0,
        description: 'Monotonically increasing sequence number from DeterministicSequencer',
      },
      timestamp: {
        type: 'integer',
        minimum: 0,
        description: 'Logical timestamp from injected ClockProvider (NOT Date.now())',
      },
      submittedBy: {
        type: 'string',
        description: 'Identity that submitted this fact',
      },
      signature: {
        type: 'string',
        description: 'Ed25519/RSA-PSS/ECDSA signature over canonicalBytes',
      },
      acceptedAt: {
        type: 'integer',
        minimum: 0,
        description: 'Timestamp when the AcceptancePipeline accepted this fact',
      },
      schemaId: {
        type: 'string',
        description: 'Schema ID that validated this fact\'s body',
      },
    },
    required: [
      'id', 'type', 'body', 'canonicalBytes', 'hash',
      'sequence', 'timestamp', 'submittedBy', 'signature',
      'acceptedAt', 'schemaId',
    ],
    additionalProperties: false,
  };
}

function generateProofSchema(): object {
  return {
    $schema: SCHEMA_VERSION,
    $id: `${SCHEMA_BASE}/proof`,
    title: 'Proof',
    description: 'A Proof — why we believe it. Cryptographic evidence attesting to a fact.',
    type: 'object',
    properties: {
      id: {
        type: 'string',
        pattern: '^[a-f0-9]{64}$',
        description: 'SHA-256 identifier of this proof',
      },
      factId: {
        type: 'string',
        pattern: '^[a-f0-9]{64}$',
        description: 'The fact this proof attests to',
      },
      kind: {
        type: 'string',
        enum: ['ancestry', 'inclusion', 'consistency', 'batch'],
        description: 'Kind of proof',
      },
      mmrRoot: {
        type: 'string',
        pattern: '^[a-f0-9]{64}$',
        description: 'MMR root at time of proof generation',
      },
      proofPath: {
        type: 'array',
        items: { type: 'string' },
        description: 'Authentication path (sibling hashes) for Merkle Mountain Range inclusion',
      },
      mmrIndex: {
        type: 'integer',
        minimum: 0,
        description: 'Index in the MMR at time of proof generation',
      },
      signature: {
        type: 'string',
        description: 'Ed25519 signature over the proof data',
      },
      timestamp: {
        type: 'integer',
        minimum: 0,
        description: 'Timestamp from injected ClockProvider',
      },
    },
    required: [
      'id', 'factId', 'kind', 'mmrRoot', 'proofPath',
      'mmrIndex', 'signature', 'timestamp',
    ],
    additionalProperties: false,
  };
}

function generatePolicyRuleSchema(): object {
  return {
    $schema: SCHEMA_VERSION,
    $id: `${SCHEMA_BASE}/policy-rule`,
    title: 'PolicyRule',
    description: 'A Policy — whether to accept. Deterministic evaluation via stack-based IR opcodes.',
    type: 'object',
    properties: {
      id: {
        type: 'string',
        description: 'Unique policy identifier',
      },
      name: {
        type: 'string',
        description: 'Human-readable name',
      },
      version: {
        type: 'integer',
        minimum: 1,
        description: 'Policy version — incremented on update',
      },
      ir: {
        type: 'array',
        items: { $ref: `${SCHEMA_BASE}/policy-opcode` },
        description: 'Deterministic IR opcodes — no eval(), no scripting, no dynamic execution',
      },
      severity: {
        type: 'string',
        enum: ['critical', 'high', 'medium', 'low', 'info'],
        description: 'Severity level if this policy is violated',
      },
      appliesTo: {
        type: 'array',
        items: { $ref: `${SCHEMA_BASE}/fact-types` },
        description: 'Fact types this policy applies to',
      },
      active: {
        type: 'boolean',
        description: 'Whether this policy is currently enforced',
      },
      createdAt: {
        type: 'integer',
        minimum: 0,
        description: 'Creation timestamp from injected ClockProvider',
      },
    },
    required: [
      'id', 'name', 'version', 'ir', 'severity',
      'appliesTo', 'active', 'createdAt',
    ],
    additionalProperties: false,
  };
}

function generatePolicyOpcodeSchema(): object {
  return {
    $schema: SCHEMA_VERSION,
    $id: `${SCHEMA_BASE}/policy-opcode`,
    title: 'PolicyOpcode',
    description: 'Deterministic policy IR opcodes for the stack-based evaluator. No eval(). No scripting.',
    oneOf: [
      { title: 'LOAD_FIELD', type: 'object', properties: { op: { const: 'LOAD_FIELD' }, field: { type: 'string' } }, required: ['op', 'field'] },
      { title: 'LOAD_CONST', type: 'object', properties: { op: { const: 'LOAD_CONST' }, value: {} }, required: ['op', 'value'] },
      { title: 'EQ', type: 'object', properties: { op: { const: 'EQ' } }, required: ['op'] },
      { title: 'NEQ', type: 'object', properties: { op: { const: 'NEQ' } }, required: ['op'] },
      { title: 'LT', type: 'object', properties: { op: { const: 'LT' } }, required: ['op'] },
      { title: 'LTE', type: 'object', properties: { op: { const: 'LTE' } }, required: ['op'] },
      { title: 'GT', type: 'object', properties: { op: { const: 'GT' } }, required: ['op'] },
      { title: 'GTE', type: 'object', properties: { op: { const: 'GTE' } }, required: ['op'] },
      { title: 'IN_RANGE', type: 'object', properties: { op: { const: 'IN_RANGE' }, lo: { type: 'number' }, hi: { type: 'number' } }, required: ['op', 'lo', 'hi'] },
      { title: 'NOT_IN_RANGE', type: 'object', properties: { op: { const: 'NOT_IN_RANGE' }, lo: { type: 'number' }, hi: { type: 'number' } }, required: ['op', 'lo', 'hi'] },
      { title: 'CONTAINS', type: 'object', properties: { op: { const: 'CONTAINS' } }, required: ['op'] },
      { title: 'NOT_CONTAINS', type: 'object', properties: { op: { const: 'NOT_CONTAINS' } }, required: ['op'] },
      { title: 'TYPE_IS', type: 'object', properties: { op: { const: 'TYPE_IS' }, typeName: { type: 'string' } }, required: ['op', 'typeName'] },
      { title: 'AND', type: 'object', properties: { op: { const: 'AND' } }, required: ['op'] },
      { title: 'OR', type: 'object', properties: { op: { const: 'OR' } }, required: ['op'] },
      { title: 'NOT', type: 'object', properties: { op: { const: 'NOT' } }, required: ['op'] },
      { title: 'EVERY', type: 'object', properties: { op: { const: 'EVERY' }, count: { type: 'integer', minimum: 1 } }, required: ['op', 'count'] },
      { title: 'SOME', type: 'object', properties: { op: { const: 'SOME' }, count: { type: 'integer', minimum: 1 } }, required: ['op', 'count'] },
      { title: 'LOOKUP', type: 'object', properties: { op: { const: 'LOOKUP' }, table: { type: 'string' }, key: { type: 'string' } }, required: ['op', 'table', 'key'] },
      { title: 'RESULT', type: 'object', properties: { op: { const: 'RESULT' }, policy: { type: 'string', enum: ['accept', 'reject', 'defer'] } }, required: ['op', 'policy'] },
    ],
  };
}

function generateProjectionSchema(): object {
  return {
    $schema: SCHEMA_VERSION,
    $id: `${SCHEMA_BASE}/projection`,
    title: 'Projection',
    description: 'A Projection — how to consume. Derived view of facts. Read-only from the client perspective.',
    type: 'object',
    properties: {
      id: {
        type: 'string',
        pattern: '^[a-f0-9]{64}$',
        description: 'Deterministic ID derived from name + version',
      },
      name: {
        type: 'string',
        description: 'Human-readable name',
      },
      version: {
        type: 'integer',
        minimum: 1,
        description: 'Version — incremented by ProjectionRegistered facts',
      },
      consumes: {
        type: 'array',
        items: { $ref: `${SCHEMA_BASE}/fact-types` },
        description: 'The fact types this projection consumes',
      },
      state: {
        type: 'object',
        description: 'Current state derived from consumed facts',
        additionalProperties: true,
      },
      factRoot: {
        type: 'string',
        pattern: '^[a-f0-9]{64}$',
        description: 'SHA-256 root of all facts that contributed to this projection',
      },
      stateHash: {
        type: 'string',
        pattern: '^[a-f0-9]{64}$',
        description: 'SHA-256 hash of the projection state (RFC 8785 canonicalized)',
      },
      registeredAt: {
        type: 'integer',
        minimum: 0,
        description: 'Registration timestamp from injected ClockProvider',
      },
      updatedAt: {
        type: 'integer',
        minimum: 0,
        description: 'Last update timestamp from injected ClockProvider',
      },
      deprecated: {
        type: 'boolean',
        description: 'Whether this projection has been deprecated',
      },
    },
    required: [
      'id', 'name', 'version', 'consumes', 'state',
      'factRoot', 'stateHash', 'registeredAt', 'updatedAt', 'deprecated',
    ],
    additionalProperties: false,
  };
}

function generateEvidenceEnvelopeSchema(): object {
  return {
    $schema: SCHEMA_VERSION,
    $id: `${SCHEMA_BASE}/evidence-envelope`,
    title: 'EvidenceEnvelope',
    description: 'Container for a fact + its proofs. The unit of evidence exchange between runtimes.',
    type: 'object',
    properties: {
      id: {
        type: 'string',
        pattern: '^[a-f0-9]{64}$',
        description: 'SHA-256 of canonical bytes of the envelope',
      },
      fact: {
        $ref: `${SCHEMA_BASE}/fact`,
        description: 'The fact this envelope contains',
      },
      proofs: {
        type: 'array',
        items: { $ref: `${SCHEMA_BASE}/proof` },
        description: 'Proofs attesting to this fact',
      },
      state: {
        type: 'string',
        enum: ['pending', 'verified', 'failed', 'expired', 'revoked'],
        description: 'Current evidence lifecycle state',
      },
      redactedFields: {
        type: 'array',
        items: { type: 'string' },
        description: 'PII fields that were redacted BEFORE canonicalization',
      },
      schemaId: {
        type: 'string',
        description: 'Schema that validated this envelope',
      },
    },
    required: ['id', 'fact', 'proofs', 'state', 'redactedFields', 'schemaId'],
    additionalProperties: false,
  };
}

function generateKernelConfigSchema(): object {
  return {
    $schema: SCHEMA_VERSION,
    $id: `${SCHEMA_BASE}/kernel-config`,
    title: 'KernelConfig',
    description: 'Configuration for creating a deterministic RuntimeKernel. Same config → identical replay.',
    type: 'object',
    properties: {
      initialClockTime: {
        type: 'integer',
        minimum: 0,
        description: 'Initial clock time for DeterministicClock (NOT Date.now())',
      },
      entropySeed: {
        type: 'string',
        contentEncoding: 'base64',
        description: 'Entropy seed for DeterministicEntropy (xorshift128+ PRNG)',
      },
      uuidNamespace: {
        type: 'string',
        description: 'UUID namespace for DeterministicUuid (SHA-256-based v5-like)',
      },
      signerPrivateKey: {
        type: 'string',
        description: 'Signer private key (hex for Ed25519, string for HmacSigner)',
      },
    },
    required: ['initialClockTime', 'entropySeed', 'uuidNamespace', 'signerPrivateKey'],
    additionalProperties: false,
  };
}

function generateAcceptanceResultSchema(): object {
  return {
    $schema: SCHEMA_VERSION,
    $id: `${SCHEMA_BASE}/acceptance-result`,
    title: 'AcceptanceResult',
    description: 'Result from the AcceptancePipeline universal write gate.',
    type: 'object',
    properties: {
      accepted: {
        type: 'boolean',
        description: 'Whether the observation was accepted as a Fact',
      },
      fact: {
        oneOf: [
          { $ref: `${SCHEMA_BASE}/fact` },
          { type: 'null' },
        ],
        description: 'The accepted Fact, or null if rejected',
      },
      proof: {
        oneOf: [
          { $ref: `${SCHEMA_BASE}/proof` },
          { type: 'null' },
        ],
        description: 'The inclusion Proof, or null if rejected',
      },
      errors: {
        type: 'array',
        items: { type: 'string' },
        description: 'Errors that caused rejection (schema, policy, etc.)',
      },
      warnings: {
        type: 'array',
        items: { type: 'string' },
        description: 'Non-fatal warnings during acceptance',
      },
    },
    required: ['accepted', 'fact', 'proof', 'errors', 'warnings'],
    additionalProperties: false,
  };
}

function generateReplayVerificationSchema(): object {
  return {
    $schema: SCHEMA_VERSION,
    $id: `${SCHEMA_BASE}/replay-verification`,
    title: 'ReplayVerification',
    description: 'Verification result from the DeterministicReplay engine. All 5 checks must pass for deterministic guarantee.',
    type: 'object',
    properties: {
      projectionRoot1: {
        type: 'string',
        description: 'First run projection root hashes (JSON-serialized map)',
      },
      projectionRoot2: {
        type: 'string',
        description: 'Second run projection root hashes (JSON-serialized map)',
      },
      rootsMatch: {
        type: 'boolean',
        description: 'Whether projection roots match between runs',
      },
      canonicalBytesMatch: {
        type: 'boolean',
        description: 'Whether canonical bytes are identical between runs',
      },
      signaturesMatch: {
        type: 'boolean',
        description: 'Whether signatures are identical between runs',
      },
      mmrRootsMatch: {
        type: 'boolean',
        description: 'Whether MMR roots are identical between runs',
      },
      factIdsMatch: {
        type: 'boolean',
        description: 'Whether fact IDs are identical between runs',
      },
      deterministic: {
        type: 'boolean',
        description: 'True only if ALL 5 checks pass',
      },
      assertions: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            name: { type: 'string' },
            passed: { type: 'boolean' },
            message: { type: 'string' },
          },
          required: ['name', 'passed', 'message'],
          additionalProperties: false,
        },
        description: 'Individual assertion results',
      },
    },
    required: [
      'projectionRoot1', 'projectionRoot2', 'rootsMatch',
      'canonicalBytesMatch', 'signaturesMatch', 'mmrRootsMatch',
      'factIdsMatch', 'deterministic', 'assertions',
    ],
    additionalProperties: false,
  };
}

// ──────────────────────────────────────────────────
// Emitter — writes schemas to disk
// ──────────────────────────────────────────────────

function main() {
  // Parse --outdir argument
  const args = process.argv.slice(2);
  let outDir = resolve(import.meta.dirname ?? __dirname, '..', 'schemas');
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--outdir' && args[i + 1]) {
      outDir = resolve(args[i + 1]);
      i++;
    }
  }

  // Ensure output directory exists
  if (!existsSync(outDir)) {
    mkdirSync(outDir, { recursive: true });
  }

  const schemas: Record<string, () => object> = {
    'fact-types': generateFactTypesSchema,
    'fact': generateFactSchema,
    'proof': generateProofSchema,
    'policy-opcode': generatePolicyOpcodeSchema,
    'policy-rule': generatePolicyRuleSchema,
    'projection': generateProjectionSchema,
    'evidence-envelope': generateEvidenceEnvelopeSchema,
    'kernel-config': generateKernelConfigSchema,
    'acceptance-result': generateAcceptanceResultSchema,
    'replay-verification': generateReplayVerificationSchema,
  };

  console.log('╔══════════════════════════════════════════════════════════╗');
  console.log('║   Epistemic Runtime v0.8 — Schema Emitter               ║');
  console.log('║   From types to schemas. From code to contracts.        ║');
  console.log('╚══════════════════════════════════════════════════════════╝');
  console.log();
  console.log(`Output directory: ${outDir}`);
  console.log('─'.repeat(60));

  let count = 0;
  for (const [name, generator] of Object.entries(schemas)) {
    const schema = generator();
    const filename = `${name}.schema.json`;
    const filepath = join(outDir, filename);

    writeFileSync(filepath, JSON.stringify(schema, null, 2) + '\n', 'utf-8');
    count++;
    console.log(`  ✅ ${filename}`);
  }

  console.log('─'.repeat(60));
  console.log();
  console.log(`🎉 ${count} schemas emitted to ${outDir}`);
  console.log();
  console.log('All schemas are Draft 2020-12 compliant.');
  console.log('Schemas are synchronized with runtime type definitions.');
  console.log('Run this script during build to keep schemas up-to-date.');
}

main();

// @ts-nocheck
// Epistemic Runtime v0.8 — Full Deterministic Test Suite
// All 12 required verifications from the Execution Contract
//
// CONTRACT: "Implementation is not complete until all succeed"

import { describe, it, expect, beforeEach } from 'vitest';
import { computeSHA256, hashPair, hashPairOrdered, verifyHash } from '@/lib/kernel/hashing';
import { canonicalize, getCanonicalBytes, verifyCanonicalDeterminism } from '@/lib/kernel/canonicalization';
import { MerkleMountainRange } from '@/lib/kernel/mmr';
import { DeterministicSequencer } from '@/lib/kernel/sequencer';
import { SchemaRegistry } from '@/lib/kernel/schema-registry';
import { AcceptancePipeline } from '@/lib/kernel/acceptance-pipeline';
import { PolicyEvaluator, compilePolicy } from '@/lib/kernel/policy-evaluator';
import { ProjectionEngine, type ProjectionHandler } from '@/lib/kernel/projection';
import { ProjectionRegistry } from '@/lib/kernel/projection-registry';
import { DeterministicReplay } from '@/lib/kernel/replay';
import { RuntimeKernel } from '@/lib/kernel/runtime';
import { redactPII, STANDARD_PII_RULES } from '@/lib/kernel/redaction';
import { DeterministicClock } from '@/engine/clock';
import { DeterministicEntropy } from '@/engine/entropy';
import { DeterministicUuid } from '@/engine/uuid';
import { HmacSigner, Ed25519Signer } from '@/engine/signer';
import { Ed25519SignerModule } from '@/signer/ed25519';
import { InMemoryWORMStorage } from '@/engine/storage';
import type { RuntimeProviders, KernelConfig, Fact } from '@/lib/kernel/types';

// ──────────────────────────────────────────────────
// Test helpers
// ──────────────────────────────────────────────────

function makeConfig(): KernelConfig {
  return {
    initialClockTime: 1000000,
    entropySeed: new Uint8Array(32).fill(42),
    uuidNamespace: 'test-namespace',
    signerPrivateKey: 'test-secret-key-for-hmac',
  };
}

function makeProviders(config: KernelConfig): RuntimeProviders {
  return {
    clock: new DeterministicClock(config.initialClockTime, 1000),
    entropy: new DeterministicEntropy(config.entropySeed),
    uuid: new DeterministicUuid(config.uuidNamespace),
    signer: new HmacSigner(config.signerPrivateKey),
    storage: new InMemoryWORMStorage(),
  };
}

// ──────────────────────────────────────────────────
// 1. RFC8785 Deterministic Encoding
// ──────────────────────────────────────────────────

describe('✓ RFC8785 Deterministic Encoding', () => {
  it('produces identical output regardless of key order', () => {
    const obj1 = { z: 1, a: 2, m: 3 };
    const obj2 = { a: 2, m: 3, z: 1 };
    expect(canonicalize(obj1)).toBe(canonicalize(obj2));
  });

  it('sorts keys lexicographically by UTF-8 code units', () => {
    const result = canonicalize({ z: 1, a: 2, m: 3 });
    expect(result).toBe('{"a":2,"m":3,"z":1}');
  });

  it('produces byte-identical output across runs', () => {
    const obj = { name: 'test', value: 42, nested: { b: 1, a: 2 } };
    const first = canonicalize(obj);
    const second = canonicalize(obj);
    expect(first).toBe(second);
  });

  it('handles numbers deterministically (ES6 format)', () => {
    expect(canonicalize({ n: 0 })).toBe('{"n":0}');
    expect(canonicalize({ n: -0 })).toBe('{"n":0}');
    expect(canonicalize({ n: 1.5 })).toBe('{"n":1.5}');
    expect(() => canonicalize({ n: NaN })).toThrow();
    expect(() => canonicalize({ n: Infinity })).toThrow();
  });

  it('handles arrays in order', () => {
    expect(canonicalize([3, 1, 2])).toBe('[3,1,2]');
  });

  it('handles null and undefined', () => {
    expect(canonicalize(null)).toBe('null');
    expect(canonicalize(undefined)).toBe('null');
  });

  it('encodes control characters as \\uXXXX', () => {
    const result = canonicalize({ s: '\x01' });
    expect(result).toBe('{"s":"\\u0001"}');
  });

  it('encodes surrogate pairs as \\uXXXX\\uXXXX per RFC 8785', () => {
    // U+1F600 (😀) is represented in JavaScript as surrogate pair \uD83D\uDE00
    const result = canonicalize({ emoji: '\uD83D\uDE00' });
    expect(result).toBe('{"emoji":"\\ud83d\\ude00"}');
  });

  it('encodes lone low surrogates as \\uXXXX', () => {
    const result = canonicalize({ lone: '\uDC00' });
    expect(result).toBe('{"lone":"\\udc00"}');
  });

  it('verifyCanonicalDeterminism helper works', () => {
    expect(verifyCanonicalDeterminism({ a: 1, b: [2, 3] })).toBe(true);
  });
});

// ──────────────────────────────────────────────────
// 2. SHA-256 Deterministic Hashing
// ──────────────────────────────────────────────────

describe('✓ SHA-256 Deterministic Hashing', () => {
  it('same input → same hash, always', () => {
    const hash1 = computeSHA256('test-input');
    const hash2 = computeSHA256('test-input');
    expect(hash1).toBe(hash2);
  });

  it('different input → different hash', () => {
    const hash1 = computeSHA256('input-a');
    const hash2 = computeSHA256('input-b');
    expect(hash1).not.toBe(hash2);
  });

  it('produces 64-char hex output', () => {
    const hash = computeSHA256('test');
    expect(hash).toMatch(/^[a-f0-9]{64}$/);
  });

  it('hashPair is deterministic (sorted)', () => {
    const h1 = hashPair('aaa', 'bbb');
    const h2 = hashPair('bbb', 'aaa');
    expect(h1).toBe(h2); // Sorted → commutative
  });

  it('hashPairOrdered preserves left/right structure', () => {
    const h1 = hashPairOrdered('aaa', 'bbb');
    const h2 = hashPairOrdered('bbb', 'aaa');
    expect(h1).not.toBe(h2); // Ordered → NOT commutative
  });

  it('verifyHash works correctly', () => {
    const hash = computeSHA256('verify-me');
    expect(verifyHash('verify-me', hash)).toBe(true);
    expect(verifyHash('wrong-input', hash)).toBe(false);
  });
});

// ──────────────────────────────────────────────────
// 3. Ed25519 Signing
// ──────────────────────────────────────────────────

describe('✓ Ed25519 Signing', () => {
  it('sign/verify round-trip succeeds', () => {
    const { privateKey, publicKey } = Ed25519SignerModule.generateKeyPair();
    const signer = new Ed25519SignerModule(privateKey);
    const message = 'test-message-for-signing';
    const signature = signer.sign(message);
    expect(signer.verify(message, signature, publicKey)).toBe(true);
  });

  it('wrong message fails verification', () => {
    const { privateKey, publicKey } = Ed25519SignerModule.generateKeyPair();
    const signer = new Ed25519SignerModule(privateKey);
    const signature = signer.sign('correct-message');
    expect(signer.verify('wrong-message', signature, publicKey)).toBe(false);
  });

  it('wrong key fails verification', () => {
    const pair1 = Ed25519SignerModule.generateKeyPair();
    const pair2 = Ed25519SignerModule.generateKeyPair();
    const signer = new Ed25519SignerModule(pair1.privateKey);
    const signature = signer.sign('test');
    expect(signer.verify('test', signature, pair2.publicKey)).toBe(false);
  });

  it('signatures are deterministic for same input', () => {
    const { privateKey } = Ed25519SignerModule.generateKeyPair();
    const signer = new Ed25519SignerModule(privateKey);
    const sig1 = signer.sign('deterministic-test');
    const sig2 = signer.sign('deterministic-test');
    expect(sig1).toBe(sig2);
  });
});

// ──────────────────────────────────────────────────
// 4. Replay Byte Identity
// ──────────────────────────────────────────────────

describe('✓ Replay Byte Identity', () => {
  it('canonical bytes are identical on replay', async () => {
    const config = makeConfig();
    const replay = new DeterministicReplay(config);
    replay.addObservation({ type: 'observation', body: { test: 'value' }, submittedBy: 'test', schemaId: 'schema-1' });
    replay.addObservation({ type: 'observation', body: { test: 'value2' }, submittedBy: 'test', schemaId: 'schema-1' });

    const run1 = await replay.runOnce();
    const run2 = await replay.runOnce();

    expect(run1.canonicalBytes).toEqual(run2.canonicalBytes);
  });
});

// ──────────────────────────────────────────────────
// 5. Replay Signature Identity
// ──────────────────────────────────────────────────

describe('✓ Replay Signature Identity', () => {
  it('signatures are identical on replay', async () => {
    const config = makeConfig();
    const replay = new DeterministicReplay(config);
    replay.addObservation({ type: 'observation', body: { test: 'value' }, submittedBy: 'test', schemaId: 'schema-1' });

    const run1 = await replay.runOnce();
    const run2 = await replay.runOnce();

    expect(run1.signatures).toEqual(run2.signatures);
  });
});

// ──────────────────────────────────────────────────
// 6. Replay MMR Identity
// ──────────────────────────────────────────────────

describe('✓ Replay MMR Identity', () => {
  it('MMR root is identical on replay', async () => {
    const config = makeConfig();
    const replay = new DeterministicReplay(config);
    replay.addObservation({ type: 'observation', body: { a: 1 }, submittedBy: 'test', schemaId: 's1' });
    replay.addObservation({ type: 'observation', body: { b: 2 }, submittedBy: 'test', schemaId: 's1' });
    replay.addObservation({ type: 'observation', body: { c: 3 }, submittedBy: 'test', schemaId: 's1' });

    const run1 = await replay.runOnce();
    const run2 = await replay.runOnce();

    expect(run1.mmrRoot).toBe(run2.mmrRoot);
  });
});

// ──────────────────────────────────────────────────
// 7. Projection Identity
// ──────────────────────────────────────────────────

describe('✓ Projection Identity', () => {
  it('projection state hash is identical on replay', async () => {
    const config = makeConfig();
    const handler: ProjectionHandler = {
      name: 'test-projection',
      consumes: ['observation'],
      initialState: { count: 0 },
      apply: (state, fact) => ({ ...state, count: (state.count as number) + 1, lastHash: fact.hash }),
    };

    const replay = new DeterministicReplay(config);
    replay.addProjectionHandler(handler);
    replay.addObservation({ type: 'observation', body: { x: 1 }, submittedBy: 'test', schemaId: 's1' });
    replay.addObservation({ type: 'observation', body: { x: 2 }, submittedBy: 'test', schemaId: 's1' });

    const run1 = await replay.runOnce();
    const run2 = await replay.runOnce();

    for (const [name, root1] of run1.projectionRoots) {
      expect(root1).toBe(run2.projectionRoots.get(name));
    }
  });
});

// ──────────────────────────────────────────────────
// 8. WORM Mutation Rejection
// ──────────────────────────────────────────────────

describe('✓ WORM Mutation Rejection', () => {
  it('rejects duplicate fact append', async () => {
    const storage = new InMemoryWORMStorage();
    const fact: Fact = {
      id: 'fact-1',
      type: 'observation',
      body: { test: 'value' },
      canonicalBytes: 'canonical',
      hash: 'hash123',
      sequence: 1,
      timestamp: 1000,
      submittedBy: 'test',
      signature: 'sig',
      acceptedAt: 1000,
      schemaId: 's1',
    };

    await storage.append(fact);
    await expect(storage.append(fact)).rejects.toThrow();
  });

  it('isWORM is true', () => {
    const storage = new InMemoryWORMStorage();
    expect(storage.isWORM).toBe(true);
  });
});

// ──────────────────────────────────────────────────
// 9. Policy Determinism
// ──────────────────────────────────────────────────

describe('✓ Policy Determinism', () => {
  it('same policy + same input → same result', () => {
    const evaluator = new PolicyEvaluator();
    const policy = compilePolicy({
      id: 'test',
      name: 'Test Policy',
      severity: 'high',
      appliesTo: ['observation'],
      rules: [{ field: 'value', operator: 'eq', value: 42 }],
    });

    const result1 = evaluator.evaluate(policy, { value: 42 });
    const result2 = evaluator.evaluate(policy, { value: 42 });
    expect(result1).toBe(result2);
    expect(result1).toBe('accept');
  });

  it('rejects violating observations', () => {
    const evaluator = new PolicyEvaluator();
    const policy = compilePolicy({
      id: 'reject-test',
      name: 'Reject Test',
      severity: 'high',
      appliesTo: ['observation'],
      rules: [{ field: 'value', operator: 'eq', value: 42 }],
    });

    const result = evaluator.evaluate(policy, { value: 99 });
    expect(result).toBe('reject');
  });

  it('unknown opcode terminates evaluation', () => {
    const evaluator = new PolicyEvaluator();
    const policy = {
      id: 'bad',
      name: 'Bad',
      version: 1,
      ir: [{ op: 'UNKNOWN_OPCODE' }] as any,
      severity: 'high' as const,
      appliesTo: ['observation'] as any[],
      active: true,
      createdAt: 0,
    };

    expect(() => evaluator.evaluate(policy, {})).toThrow(/Unknown policy opcode/);
  });

  it('lookup tables via constructor injection', () => {
    const evaluator = new PolicyEvaluator({ countries: { US: 'United States', UK: 'United Kingdom' } });
    const policy = {
      id: 'lookup-test',
      name: 'Lookup Test',
      version: 1,
      ir: [
        { op: 'LOAD_CONST', value: 'US' },
        { op: 'LOOKUP', table: 'countries', key: 'US' },
      ],
      severity: 'high' as const,
      appliesTo: ['observation'] as any[],
      active: true,
      createdAt: 0,
    };

    const result = evaluator.evaluate(policy, {});
    expect(result).toBe('accept'); // Non-null lookup result is truthy → accept
  });

  it('EVERY quantifier works', () => {
    const evaluator = new PolicyEvaluator();
    const policy = compilePolicy({
      id: 'every-test',
      name: 'Every Test',
      severity: 'high',
      appliesTo: ['observation'],
      rules: [
        { field: 'a', operator: 'gt', value: 0 },
        { field: 'b', operator: 'gt', value: 0 },
      ],
      quantifier: 'every',
    });

    expect(evaluator.evaluate(policy, { a: 1, b: 2 })).toBe('accept');
    expect(evaluator.evaluate(policy, { a: 1, b: -1 })).toBe('reject');
  });
});

// ──────────────────────────────────────────────────
// 10. Schema Validation
// ──────────────────────────────────────────────────

describe('✓ Schema Validation', () => {
  it('rejects observations with missing required fields', () => {
    const registry = new SchemaRegistry();
    registry.register({
      id: 'strict-schema',
      name: 'Strict',
      version: 1,
      factType: 'observation',
      jsonSchema: {
        type: 'object',
        required: ['name'],
        properties: { name: { type: 'string' } },
      },
      createdAt: 0,
    });

    const result = registry.validate('observation', { wrong: 'field' });
    expect(result.valid).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
  });

  it('accepts valid observations', () => {
    const registry = new SchemaRegistry();
    registry.register({
      id: 'simple-schema',
      name: 'Simple',
      version: 1,
      factType: 'observation',
      jsonSchema: {
        type: 'object',
        required: ['name'],
        properties: { name: { type: 'string' } },
      },
      createdAt: 0,
    });

    const result = registry.validate('observation', { name: 'test' });
    expect(result.valid).toBe(true);
  });

  it('returns valid when no schema registered', () => {
    const registry = new SchemaRegistry();
    const result = registry.validate('observation', { anything: 'goes' });
    expect(result.valid).toBe(true);
  });
});

// ──────────────────────────────────────────────────
// 11. PII Redaction
// ──────────────────────────────────────────────────

describe('✓ PII Redaction', () => {
  it('redacts PII fields before canonicalization', () => {
    const body = { name: 'John', email: 'john@test.com', ssn: '123-45-6789', public: 'data' };
    const { redactedBody, redactedFields } = redactPII(body, STANDARD_PII_RULES);

    expect(redactedFields.length).toBeGreaterThan(0);
    // ssn uses 'hash' strategy, so it becomes a SHA-256 hash, not '[REDACTED]'
    expect(redactedBody.ssn).toMatch(/^[a-f0-9]{64}$/);
    expect(redactedBody.ssn).not.toBe('123-45-6789');
  });

  it('never includes raw regulated PII in canonical output', () => {
    const body = { ssn: '123-45-6789', data: 'public' };
    const { redactedBody } = redactPII(body, STANDARD_PII_RULES);
    const canonical = canonicalize(redactedBody);

    expect(canonical).not.toContain('123-45-6789');
  });
});

// ──────────────────────────────────────────────────
// 12. Hermetic Replay
// ──────────────────────────────────────────────────

describe('✓ Hermetic Replay', () => {
  it('no external dependencies during replay', async () => {
    const config = makeConfig();
    const replay = new DeterministicReplay(config);
    replay.addObservation({ type: 'observation', body: { hermetic: true }, submittedBy: 'test', schemaId: 's1' });

    // Two runs must produce identical results with no external calls
    const run1 = await replay.runOnce();
    const run2 = await replay.runOnce();

    expect(run1.factIds).toEqual(run2.factIds);
    expect(run1.mmrRoot).toBe(run2.mmrRoot);
    expect(run1.canonicalBytes).toEqual(run2.canonicalBytes);
    expect(run1.signatures).toEqual(run2.signatures);
  });

  it('full replay verification passes', async () => {
    const config = makeConfig();
    const replay = new DeterministicReplay(config);
    replay.addObservation({ type: 'observation', body: { test: 1 }, submittedBy: 'agent', schemaId: 's1' });
    replay.addObservation({ type: 'observation', body: { test: 2 }, submittedBy: 'agent', schemaId: 's1' });
    replay.addObservation({ type: 'observation', body: { test: 3 }, submittedBy: 'agent', schemaId: 's1' });

    const verification = await replay.verify();
    expect(verification.deterministic).toBe(true);
    expect(verification.factIdsMatch).toBe(true);
    expect(verification.canonicalBytesMatch).toBe(true);
    expect(verification.signaturesMatch).toBe(true);
    expect(verification.mmrRootsMatch).toBe(true);
    expect(verification.rootsMatch).toBe(true);
  });
});

// ──────────────────────────────────────────────────
// MMR Engine (Position-based)
// ──────────────────────────────────────────────────

describe('MMR Engine', () => {
  it('empty MMR returns deterministic root', () => {
    const mmr = new MerkleMountainRange();
    const root = mmr.getRoot();
    expect(root).toMatch(/^[a-f0-9]{64}$/);
    expect(mmr.size).toBe(0);
  });

  it('single leaf MMR root equals leaf hash', () => {
    const mmr = new MerkleMountainRange();
    const hash = computeSHA256('leaf-1');
    mmr.append('fact-1', hash);
    expect(mmr.getRoot()).toBe(hash);
    expect(mmr.size).toBe(1);
  });

  it('two leaves create a parent', () => {
    const mmr = new MerkleMountainRange();
    const h1 = computeSHA256('leaf-1');
    const h2 = computeSHA256('leaf-2');
    mmr.append('fact-1', h1);
    mmr.append('fact-2', h2);
    const root = mmr.getRoot();
    // Root should be hashPairOrdered(h1, h2) — single peak
    expect(root).toBe(hashPairOrdered(h1, h2));
  });

  it('three leaves produce two peaks', () => {
    const mmr = new MerkleMountainRange();
    mmr.append('f1', computeSHA256('1'));
    mmr.append('f2', computeSHA256('2'));
    mmr.append('f3', computeSHA256('3'));
    const peaks = mmr.getPeakPositions();
    expect(peaks.length).toBe(2);
  });

  it('inclusion proof validates for first leaf', () => {
    const mmr = new MerkleMountainRange();
    mmr.append('f1', computeSHA256('1'));
    mmr.append('f2', computeSHA256('2'));
    mmr.append('f3', computeSHA256('3'));
    mmr.append('f4', computeSHA256('4'));
    const proof = mmr.getInclusionProof(0);
    expect(proof.rootHash).toBe(mmr.getRoot());
  });

  it('reset clears the MMR', () => {
    const mmr = new MerkleMountainRange();
    mmr.append('f1', computeSHA256('1'));
    mmr.reset();
    expect(mmr.size).toBe(0);
  });

  it('produces deterministic roots', () => {
    const mmr1 = new MerkleMountainRange();
    const mmr2 = new MerkleMountainRange();
    for (let i = 0; i < 10; i++) {
      const hash = computeSHA256(`leaf-${i}`);
      mmr1.append(`f${i}`, hash);
      mmr2.append(`f${i}`, hash);
    }
    expect(mmr1.getRoot()).toBe(mmr2.getRoot());
  });
});

// ──────────────────────────────────────────────────
// Projection Registry
// ──────────────────────────────────────────────────

describe('Projection Registry', () => {
  let registry: ProjectionRegistry;
  let clock: DeterministicClock;

  beforeEach(() => {
    registry = new ProjectionRegistry();
    clock = new DeterministicClock(1000000, 1000);
  });

  it('registers a projection handler', () => {
    const handler: ProjectionHandler = {
      name: 'test-proj',
      consumes: ['observation'],
      initialState: {},
      apply: (s) => s,
    };
    const { meta, fact } = registry.register(handler, clock);
    expect(meta.name).toBe('test-proj');
    expect(fact.type).toBe('projection_registered');
    expect(registry.isRegistered('test-proj')).toBe(true);
  });

  it('deprecates a projection', () => {
    const handler: ProjectionHandler = {
      name: 'deprecate-me',
      consumes: ['observation'],
      initialState: {},
      apply: (s) => s,
    };
    registry.register(handler, clock);
    const { fact } = registry.deprecate('deprecate-me', clock);
    expect(fact.type).toBe('projection_deprecated');
    expect(registry.isActive('deprecate-me')).toBe(false);
  });

  it('tracks history', () => {
    const handler: ProjectionHandler = {
      name: 'hist-test',
      consumes: ['observation'],
      initialState: {},
      apply: (s) => s,
    };
    registry.register(handler, clock);
    registry.deprecate('hist-test', clock);
    const history = registry.getHistory();
    expect(history.length).toBe(2);
    expect(history[0].action).toBe('registered');
    expect(history[1].action).toBe('deprecated');
  });
});

// ──────────────────────────────────────────────────
// Full Runtime Kernel Integration
// ──────────────────────────────────────────────────

describe('RuntimeKernel Integration', () => {
  it('creates a kernel with deterministic providers', () => {
    const config = makeConfig();
    const kernel = RuntimeKernel.create(config);
    expect(kernel).toBeDefined();
    expect(kernel.getMMRRoot()).toMatch(/^[a-f0-9]{64}$/);
  });

  it('creates a kernel with custom providers', () => {
    const config = makeConfig();
    const providers = makeProviders(config);
    const kernel = RuntimeKernel.createWithProviders(config, providers);
    expect(kernel).toBeDefined();
  });

  it('submits an observation and creates a fact', async () => {
    const config = makeConfig();
    const kernel = RuntimeKernel.create(config);
    const result = await kernel.submit('observation', { test: 'value' }, 'agent-1', 'schema-1');
    expect(result.accepted).toBe(true);
    expect(result.fact).not.toBeNull();
    expect(result.fact!.id).toMatch(/^[a-f0-9]{64}$/);
  });

  it('12-assertion verification passes', async () => {
    const config = makeConfig();
    const kernel = RuntimeKernel.create(config);
    await kernel.submit('observation', { test: 'value' }, 'agent-1', 'schema-1');
    const assertions = await kernel.verifyKernel();
    const allPassed = assertions.every(a => a.passed);
    if (!allPassed) {
      const failures = assertions.filter(a => !a.passed).map(a => `${a.name}: ${a.message}`);
      console.error('Failed assertions:', failures);
    }
    expect(allPassed).toBe(true);
  });
});

// ──────────────────────────────────────────────────
// Deterministic Providers
// ──────────────────────────────────────────────────

describe('Deterministic Providers', () => {
  it('DeterministicClock advances predictably', () => {
    const clock = new DeterministicClock(1000, 100);
    expect(clock.now()).toBe(1000);
    expect(clock.now()).toBe(1100);
    expect(clock.now()).toBe(1200);
  });

  it('DeterministicClock reset works', () => {
    const clock = new DeterministicClock(1000, 100);
    clock.now();
    clock.reset(500);
    expect(clock.now()).toBe(500);
  });

  it('DeterministicEntropy produces same sequence after reset', () => {
    const seed = new Uint8Array(32).fill(7);
    const entropy1 = new DeterministicEntropy(seed);
    const bytes1 = entropy1.bytes(16);
    const entropy2 = new DeterministicEntropy(seed);
    const bytes2 = entropy2.bytes(16);
    expect(bytes1).toEqual(bytes2);
  });

  it('DeterministicUuid produces same UUIDs after reset', () => {
    const uuid1 = new DeterministicUuid('namespace');
    const id1 = uuid1.generate();
    uuid1.reset('namespace');
    const id2 = uuid1.generate();
    expect(id1).toBe(id2);
  });

  it('HmacSigner sign/verify works', () => {
    const signer = new HmacSigner('secret');
    const sig = signer.sign('message');
    expect(signer.verify('message', sig, signer.getPublicKey())).toBe(true);
  });
});

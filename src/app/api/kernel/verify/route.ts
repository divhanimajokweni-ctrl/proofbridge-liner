// Epistemic Runtime v0.8 — Replay Verification API

import { NextResponse } from 'next/server';
import { DeterministicReplay } from '@/lib/kernel/replay';
import type { KernelConfig, FactType } from '@/lib/kernel/types';

export async function GET() {
  try {
    const config: KernelConfig = {
      initialClockTime: 1700000000000,
      entropySeed: new TextEncoder().encode('epistemic-replay-verification-seed'),
      uuidNamespace: 'epistemic://runtime/v0.8/replay',
      signerPrivateKey: 'kernel-replay-key-v0.8',
    };

    const replay = new DeterministicReplay(config);

    // Register schemas
    const types: FactType[] = ['observation', 'migration_plan', 'migration_execute'];
    for (const type of types) {
      replay.addSchemaRegistration({
        id: `schema-${type}-v1`,
        name: `${type} schema`,
        version: 1,
        factType: type,
        jsonSchema: { type: 'object', additionalProperties: true },
      });
    }

    // Register projection
    replay.addProjectionHandler({
      name: 'replay-test',
      consumes: ['observation', 'migration_plan'],
      initialState: { count: 0 },
      apply: (state, fact) => ({ ...state, count: ((state.count as number) || 0) + 1 }),
    });

    // Add observations
    replay.addObservation({ type: 'observation', body: { x: 1 }, submittedBy: 'replay-test', schemaId: 'schema-observation-v1' });
    replay.addObservation({ type: 'observation', body: { x: 2 }, submittedBy: 'replay-test', schemaId: 'schema-observation-v1' });
    replay.addObservation({ type: 'observation', body: { x: 3 }, submittedBy: 'replay-test', schemaId: 'schema-observation-v1' });
    replay.addObservation({ type: 'migration_plan', body: { from: 'a', to: 'b' }, submittedBy: 'replay-test', schemaId: 'schema-migration_plan-v1' });

    // Run verification
    const result = await replay.verify();

    return NextResponse.json({
      deterministic: result.deterministic,
      checks: {
        factIdsMatch: result.factIdsMatch,
        canonicalBytesMatch: result.canonicalBytesMatch,
        signaturesMatch: result.signaturesMatch,
        mmrRootsMatch: result.mmrRootsMatch,
        rootsMatch: result.rootsMatch,
      },
      assertions: result.assertions,
      projectionRoot1: result.projectionRoot1,
      projectionRoot2: result.projectionRoot2,
      verdict: result.deterministic
        ? 'DETERMINISTIC — replay produces byte-identical output'
        : 'NONDETERMINISTIC — replay diverged between runs',
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Replay verification failed', details: error instanceof Error ? error.message : String(error) },
      { status: 500 },
    );
  }
}

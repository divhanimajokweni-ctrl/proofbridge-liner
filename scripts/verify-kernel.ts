#!/usr/bin/env npx tsx
// Epistemic Runtime v0.8 — Kernel Verification Script
// Phase M: Run 12 assertions and report results.
// Usage: npx tsx scripts/verify-kernel.ts

import { RuntimeKernel } from '../src/lib/kernel/runtime';
import type { KernelConfig, FactType } from '../src/lib/kernel/types';

async function main() {
  console.log('╔══════════════════════════════════════════════════════════╗');
  console.log('║   Epistemic Runtime v0.8 — Kernel Verification          ║');
  console.log('║   From hope to proof. From trust to verification.       ║');
  console.log('╚══════════════════════════════════════════════════════════╝');
  console.log();

  // Create deterministic kernel config
  const config: KernelConfig = {
    initialClockTime: 1700000000000,
    entropySeed: new TextEncoder().encode('epistemic-runtime-v0.8-verification-seed'),
    uuidNamespace: 'epistemic://runtime/v0.8',
    signerPrivateKey: 'kernel-verification-key-v0.8',
  };

  const kernel = RuntimeKernel.create(config);

  // Register schemas
  const factTypes: FactType[] = [
    'observation', 'migration_plan', 'migration_execute', 'migration_verify',
    'migration_complete', 'migration_rollback', 'projection_registered',
    'projection_deprecated', 'schema_change', 'policy_change',
    'identity_change', 'system',
  ];

  for (const type of factTypes) {
    kernel.registerSchema({
      id: `schema-${type}-v1`,
      name: `${type} schema`,
      version: 1,
      factType: type,
      jsonSchema: {
        type: 'object',
        additionalProperties: true,
      },
      createdAt: 1700000000000,
    });
  }

  // Register projection
  kernel.registerProjection({
    name: 'state-summary',
    consumes: ['observation', 'migration_plan', 'migration_execute', 'migration_verify', 'migration_complete', 'migration_rollback'],
    initialState: { totalFacts: 0, byType: {} },
    apply: (state, fact) => {
      const newState = { ...state, byType: { ...(state.byType as Record<string, number>) } };
      newState.totalFacts = ((state.totalFacts as number) || 0) + 1;
      const typeKey = fact.type;
      (newState.byType as Record<string, number>)[typeKey] = ((newState.byType as Record<string, number>)[typeKey] || 0) + 1;
      return newState;
    },
  });

  // Submit test facts
  console.log('Submitting test observations...');
  const observations = [
    { type: 'observation' as FactType, body: { sensor: 'temp-1', value: 23.5, unit: 'celsius' } },
    { type: 'observation' as FactType, body: { sensor: 'pressure-1', value: 1013.25, unit: 'hPa' } },
    { type: 'observation' as FactType, body: { sensor: 'humidity-1', value: 65.0, unit: 'percent' } },
    { type: 'migration_plan' as FactType, body: { source: 'v0.7', target: 'v0.8', steps: 5 } },
    { type: 'migration_execute' as FactType, body: { step: 1, status: 'completed' } },
  ];

  for (const obs of observations) {
    const result = await kernel.submit(obs.type, obs.body, 'verify-script', `schema-${obs.type}-v1`);
    if (result.accepted) {
      console.log(`  ✅ ${obs.type}: ${result.fact?.id.slice(0, 16)}... (seq: ${result.fact?.sequence})`);
    } else {
      console.log(`  ❌ ${obs.type}: ${result.errors.join(', ')}`);
    }
  }
  console.log();

  // Run verification
  console.log('Running 12-assertion kernel verification...');
  console.log('─'.repeat(60));

  const assertions = await kernel.verifyKernel();

  let passCount = 0;
  let failCount = 0;

  for (let i = 0; i < assertions.length; i++) {
    const a = assertions[i];
    const icon = a.passed ? '✅' : '❌';
    const num = String(i + 1).padStart(2, '0');
    console.log(`  ${icon} [${num}/12] ${a.name}`);
    console.log(`         ${a.message}`);
    if (a.passed) passCount++;
    else failCount++;
  }

  console.log('─'.repeat(60));
  console.log();
  
  if (failCount === 0) {
    console.log(`🎉 ALL 12/12 ASSERTIONS PASS`);
    console.log();
    console.log(`  MMR Root:    ${kernel.getMMRRoot()}`);
    console.log(`  Sequence:    ${kernel.getCurrentSequence()}`);
    const proj = kernel.getProjection('state-summary');
    if (proj) {
      console.log(`  Projection:  ${proj.stateHash.slice(0, 16)}...`);
    }
  } else {
    console.log(`⚠️  ${passCount}/12 PASSED, ${failCount} FAILED`);
    process.exit(1);
  }
}

main().catch(err => {
  console.error('Verification failed:', err);
  process.exit(1);
});

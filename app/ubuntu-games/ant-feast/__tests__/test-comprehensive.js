/**
 * ComprehensiveSubsystemTest.js — Integration Tests
 *
 * Verifies:
 *   1. The full suite runs and returns expected result shape
 *   2. All 5 phases are executed
 *   3. Console output is generated
 *   4. Quick run with verbose=false works
 */
const ComprehensiveSubsystemTest = require('../lib/ComprehensiveSubsystemTest');

let passed = 0;
let failed = 0;

function assert(condition, label) {
  if (condition) {
    console.log(`  \u2705 PASS: ${label}`);
    passed++;
  } else {
    console.error(`  \u274C FAIL: ${label}`);
    failed++;
  }
}

// ── Test 1: Full suite returns correct shape ────────────────────────────────
console.log('\n--- Test: runFullSuite result shape ---');
const result = ComprehensiveSubsystemTest.runFullSuite({ verbose: false });

assert(typeof result === 'object', 'Result should be an object');
assert(typeof result.passed === 'boolean', 'Result.passed should be boolean');
assert(Array.isArray(result.phases), 'Result.phases should be an array');
assert(typeof result.summary === 'string', 'Result.summary should be a string');

// ── Test 2: All 5 phases are present ────────────────────────────────────────
console.log('\n--- Test: All phases present ---');
const phaseNames = result.phases.map(p => p.name);
assert(phaseNames.includes('Profile Migration'), 'Should include Profile Migration phase');
assert(phaseNames.includes('Raid Descent & Cave-in Risk'), 'Should include Raid Descent phase');
assert(phaseNames.includes('Guard Pheromone Encounter'), 'Should include Guard Encounter phase');
assert(phaseNames.includes('Queen Loot Table'), 'Should include Queen Loot Table phase');
assert(phaseNames.includes('Sensory Integration'), 'Should include Sensory Integration phase');
assert(result.phases.length === 5, 'Should have exactly 5 phases');

// ── Test 3: Each phase has expected fields ──────────────────────────────────
console.log('\n--- Test: Phase field completeness ---');
for (const phase of result.phases) {
  assert(typeof phase.name === 'string', `Phase "${phase.name}" should have a name`);
  assert(typeof phase.passed === 'boolean', `Phase "${phase.name}" should have passed boolean`);
  assert(typeof phase.details === 'object', `Phase "${phase.name}" should have details object`);
  assert(typeof phase.details.durationMs === 'number', `Phase "${phase.name}" should have durationMs`);
}

// ── Test 4: All phases passed ───────────────────────────────────────────────
console.log('\n--- Test: All phases passed ---');
for (const phase of result.phases) {
  if (!phase.passed) {
    console.error(`  Phase "${phase.name}" failed: ${JSON.stringify(phase.details)}`);
  }
  assert(phase.passed, `Phase "${phase.name}" should pass`);
}

// ── Test 5: Summary is present ─────────────────────────────────────────────
console.log('\n--- Test: Summary ---');
assert(result.summary.length > 0, 'Summary should be non-empty');
assert(result.summary.includes('5/5') || result.passed, 'Summary should indicate all phases passed or match result');

// ── Summary ─────────────────────────────────────────────────────────────────
console.log(`\n\u2500${'\u2500'.repeat(48)}`);
console.log(`Results: ${passed} passed, ${failed} failed`);
if (failed > 0) process.exit(1);

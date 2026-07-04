/**
 * SensoryIntegrationTest.js — Unit Tests
 * 
 * Verifies:
 *   1. The simulation suite runs without errors
 *   2. Tier 2 always produces lower deviation than Tier 0
 *   3. The quickVerify method returns sensible values
 */
const SensoryIntegrationTest = require('../lib/SensoryIntegrationTest');

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

// Test 1: runSimulationSuite returns true
console.log('\n--- Test: runSimulationSuite ---');
const suiteResult = SensoryIntegrationTest.runSimulationSuite();
assert(suiteResult === true, 'Simulation suite should return true (variance reduced)');

// Test 2: quickVerify returns valid shape
console.log('\n--- Test: quickVerify ---');
const result = SensoryIntegrationTest.quickVerify();
assert(typeof result.passed === 'boolean', 'passed should be boolean');
assert(typeof result.tier0Dev === 'number' && result.tier0Dev > 0, 'tier0Dev should be positive number');
assert(typeof result.tier2Dev === 'number' && result.tier2Dev > 0, 'tier2Dev should be positive number');
assert(typeof result.improvement === 'number' && result.improvement > 0, 'improvement should be positive');

// Test 3: Multiple runs always pass
console.log('\n--- Test: Statistical consistency (5 runs) ---');
let allPassed = true;
for (let i = 0; i < 5; i++) {
  const r = SensoryIntegrationTest.quickVerify();
  if (!r.passed) {
    console.error(`  Run ${i + 1}: FAILED (tier0Dev=${r.tier0Dev}, tier2Dev=${r.tier2Dev})`);
    allPassed = false;
  }
}
assert(allPassed, 'All 5 statistical runs should pass');

// Summary
console.log(`\n\u2500${'\u2500'.repeat(48)}`);
console.log(`Results: ${passed} passed, ${failed} failed`);
if (failed > 0) process.exit(1);

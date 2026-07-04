/**
 * RaidTime.js — Unit Tests
 * 
 * Verifies:
 *   1. Depth calculation with drag penalty
 *   2. Cave-in risk exponential curve
 *   3. Stamina cost calculation
 *   4. Passive drain calculation
 */
const RaidTime = require('../lib/RaidTime');

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

// Test 1: Depth calculation with no cargo
console.log('\n--- Test: calculateDepth ---');
const depthNoCargo = RaidTime.calculateDepth(0, 6.5, 0);
assert(depthNoCargo === 0.65, 'No cargo: depth should be 0 + (6.5 * 1.0 * 0.1) = 0.65');

// Test 2: Depth calculation with cargo drag
const depthWithCargo = RaidTime.calculateDepth(10, 6.5, 15);
const expectedWithCargo = 10 + (6.5 * 0.40 * 0.1);
assert(
  Math.abs(depthWithCargo - expectedWithCargo) < 0.001,
  `With cargo (15kg): depth should be ${expectedWithCargo} (got ${depthWithCargo})`
);

// Test 3: Cave-in risk below 50m is always 0
console.log('\n--- Test: checkCaveInRisk (safe zone) ---');
for (let d = 0; d < 50; d += 10) {
  const result = RaidTime.checkCaveInRisk(d, 0);
  assert(
    result.riskPercent === 0 && result.triggersCaveIn === false,
    `Depth ${d}m: risk should be 0% (got ${result.riskPercent}%)`
  );
}

// Test 4: Cave-in risk at 100m with no integrity
console.log('\n--- Test: checkCaveInRisk (deep zone) ---');
const deepRisk = RaidTime.checkCaveInRisk(100, 0);
assert(
  deepRisk.riskPercent > 0,
  `Depth 100m: risk should be > 0% (got ${deepRisk.riskPercent}%)`
);
assert(
  deepRisk.riskPercent <= 95,
  `Depth 100m: risk should be capped at 95% (got ${deepRisk.riskPercent}%)`
);

// Test 5: Cave-in risk mitigated by structural integrity
const mitigatedRisk = RaidTime.checkCaveInRisk(100, 10);
assert(
  mitigatedRisk.riskPercent < deepRisk.riskPercent,
  `Integrity 10 should reduce risk: ${deepRisk.riskPercent}% -> ${mitigatedRisk.riskPercent}%`
);

// Test 6: Stamina cost increases with depth
console.log('\n--- Test: calculateStaminaCost ---');
assert(RaidTime.calculateStaminaCost(0) === 8, 'Depth 0: cost should be 8');
assert(RaidTime.calculateStaminaCost(60) === 10, 'Depth 60: cost should be 10 (8+2)');
assert(RaidTime.calculateStaminaCost(90) === 12, 'Depth 90: cost should be 12 (8+4)');

// Test 7: Passive drain
console.log('\n--- Test: getPassiveDrain ---');
const shallowDrain = RaidTime.getPassiveDrain(10);
assert(shallowDrain.drainAmount === 3, 'Shallow drain amount should be 3');
assert(shallowDrain.drainChance === 0.06, 'Shallow drain chance should be 0.06');

const deepDrain = RaidTime.getPassiveDrain(60);
assert(deepDrain.drainAmount === 5, 'Deep drain amount should be 5');
assert(deepDrain.drainChance === 0.10, 'Deep drain chance should be 0.10');

// Summary
console.log(`\n\u2500${'\u2500'.repeat(48)}`);
console.log(`Results: ${passed} passed, ${failed} failed`);
if (failed > 0) process.exit(1);

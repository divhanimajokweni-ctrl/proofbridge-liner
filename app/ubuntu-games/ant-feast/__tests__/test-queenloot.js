/**
 * QueenLootTableProcessor.js — Unit Tests
 *
 * Verifies:
 *   1. rollOnce returns a valid drop from the table
 *   2. rollMultiple returns the correct count
 *   3. rollBossLoot enforces rare guarantees at higher tiers
 *   4. Drop count scales with boss tier
 *   5. probabilityOfAtLeastOne is in valid range
 *   6. Statistical distribution is within expected bounds
 */
const QueenLootTableProcessor = require('../lib/QueenLootTableProcessor');

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

// ── Test 1: rollOnce returns valid drop ─────────────────────────────────────
console.log('\n--- Test: rollOnce ---');
for (let i = 0; i < 50; i++) {
  const drop = QueenLootTableProcessor.rollOnce();
  assert(
    drop.id && drop.name && drop.tier && drop.icon,
    `Drop ${i}: should have all fields (got ${JSON.stringify(drop)})`
  );
  assert(
    ['common', 'rare', 'epic'].includes(drop.tier),
    `Drop ${i}: tier should be valid (got ${drop.tier})`
  );
}

// ── Test 2: rollMultiple returns correct count ──────────────────────────────
console.log('\n--- Test: rollMultiple ---');
const fiveDrops = QueenLootTableProcessor.rollMultiple(5);
assert(fiveDrops.length === 5, 'rollMultiple(5) should return 5 items');

const zeroDrops = QueenLootTableProcessor.rollMultiple(0);
assert(zeroDrops.length === 0, 'rollMultiple(0) should return empty array');

// ── Test 3: rollBossLoot basic structure ────────────────────────────────────
console.log('\n--- Test: rollBossLoot ---');
const bossLoot = QueenLootTableProcessor.rollBossLoot({ bossTier: 1 });
assert(
  Array.isArray(bossLoot.drops),
  'rollBossLoot should return drops array'
);
assert(
  bossLoot.summary && bossLoot.summary.totalDrops > 0,
  'rollBossLoot should include summary with totalDrops'
);
assert(
  bossLoot.summary.byTier && typeof bossLoot.summary.byTier.common === 'number',
  'Summary should include byTier breakdown'
);

// ── Test 4: Drop count scales with tier ──────────────────────────────────────
console.log('\n--- Test: Boss tier drop scaling ---');
const tier1 = QueenLootTableProcessor.rollBossLoot({ bossTier: 1 });
const tier3 = QueenLootTableProcessor.rollBossLoot({ bossTier: 3 });
const tier5 = QueenLootTableProcessor.rollBossLoot({ bossTier: 5 });

assert(tier1.summary.totalDrops === 2, 'Tier 1: 2 base drops');
assert(tier3.summary.totalDrops === 3, 'Tier 3: 3 drops (2 base + 1 from tier)');
assert(tier5.summary.totalDrops === 4, 'Tier 5: 4 drops (2 base + 2 from tier)');

assert(tier1.summary.byTier.rare + tier1.summary.byTier.epic >= 1, 'Tier 1: at least 1 rare+');

// ── Test 5: probabilityOfAtLeastOne ─────────────────────────────────────────
console.log('\n--- Test: probabilityOfAtLeastOne ---');
const prob1 = QueenLootTableProcessor.probabilityOfAtLeastOne('worker_dna', 1);
assert(prob1 > 0 && prob1 < 1, 'Single roll probability should be between 0 and 1');

const prob10 = QueenLootTableProcessor.probabilityOfAtLeastOne('worker_dna', 10);
assert(prob10 > prob1, '10 rolls should have higher probability than 1 roll');

const probRoyalEgg = QueenLootTableProcessor.probabilityOfAtLeastOne('royal_egg', 100);
assert(probRoyalEgg < 1, 'Even 100 rolls should not guarantee 100% for a 5% item');

// ── Test 6: Statistical distribution ────────────────────────────────────────
console.log('\n--- Test: Statistical distribution (1000 rolls) ---');
const counts = {};
for (let i = 0; i < 1000; i++) {
  const drop = QueenLootTableProcessor.rollOnce();
  counts[drop.id] = (counts[drop.id] || 0) + 1;
}

// Worker DNA should be the most common (35% weight = ~350/1000)
assert(counts['worker_dna'] > 200, `worker_dna count ${counts['worker_dna']} should be > 200`);

// Royal Egg should be the least common (5% weight = ~50/1000)
assert(counts['royal_egg'] > 0, `royal_egg count ${counts['royal_egg']} should be > 0`);
assert(counts['royal_egg'] < counts['worker_dna'], 'royal_egg count should be < worker_dna count');

// ── Summary ─────────────────────────────────────────────────────────────────
console.log(`\n\u2500${'\u2500'.repeat(48)}`);
console.log(`Results: ${passed} passed, ${failed} failed`);
if (failed > 0) process.exit(1);

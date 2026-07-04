/**
 * ComprehensiveSubsystemTest.js
 * Integration test that exercises all subsystems together.
 *
 * This module simulates a complete Ant Feast raid lifecycle:
 *   1. Profile Migration — upgrade v1 state to current schema
 *   2. Raid Descent — depth tracking with cave-in risk
 *   3. Guard Encounter — pheromone-based AI force calculation
 *   4. Queen Loot — weighted drop table processing
 *   5. Validation — verify output consistency
 *
 * Run directly: node lib/ComprehensiveSubsystemTest.js
 */

const RaidTime = require('./RaidTime');
const PheromoneGuardMath = require('./PheromoneGuardMath');
const SensoryIntegrationTest = require('./SensoryIntegrationTest');
const QueenLootTableProcessor = require('./QueenLootTableProcessor');
const ProfileMigrationEngine = require('./ProfileMigrationEngine');

const ComprehensiveSubsystemTest = {
  /**
   * Runs the full integration test suite.
   * @param {Object} [options]
   * @param {boolean} [options.verbose] - Enable detailed logging
   * @returns {{ passed: boolean, phases: Object[], summary: string }}
   */
  runFullSuite: function(options = {}) {
    const verbose = options.verbose !== false;
    const phases = [];
    let suitePassed = true;

    const log = verbose ? (...args) => console.log(...args) : () => {};

    log('\uD83D\uDD04 ================================================');
    log('\uD83D\uDD04 COMPREHENSIVE SUBSYSTEM INTEGRATION TEST SUITE');
    log('\uD83D\uDD04 ================================================');

    // ── PHASE 1: Profile Migration ────────────────────────────────────
    log('\n\uD83D\uDCC0 PHASE 1: Profile Migration Engine');
    const legacyState = {
      _migration_version: 1,
      depth_record: 45,
      total_worker_dna: 600,
      total_royal_jelly: 2,
      raidSessions: [
        { depth_reached: 30, dna_collected: 50 },
        { depth_reached: 60, dna_collected: 120, boss_defeated: true },
      ],
    };

    const phase1Start = Date.now();
    const migrationResult = ProfileMigrationEngine.migrate(legacyState);
    const phase1Duration = Date.now() - phase1Start;
    const phase1Valid = ProfileMigrationEngine.validate(migrationResult.state);

    const phase1 = {
      name: 'Profile Migration',
      passed: migrationResult.errors.length === 0 && phase1Valid.valid,
      details: {
        applied: migrationResult.applied,
        version: ProfileMigrationEngine.getVersion(migrationResult.state),
        hasRaidSessions: Array.isArray(migrationResult.state.raidSessions),
        sessionsCount: migrationResult.state.raidSessions?.length || 0,
        validationIssues: phase1Valid.issues,
        durationMs: phase1Duration,
      },
    };
    phases.push(phase1);
    suitePassed = suitePassed && phase1.passed;

    log(`  Applied migrations: ${migrationResult.applied.join(', ') || 'none'}`);
    log(`  Final version: v${phase1.details.version}`);
    log(`  Raid sessions: ${phase1.details.sessionsCount}`);
    log(`  Validation: ${phase1Valid.valid ? '\u2705 PASS' : '\u274C FAIL'}`);

    // ── PHASE 2: Raid Descent + Cave-in Risk ───────────────────────────
    log('\n\uD83E\uDDEC PHASE 2: Raid Descent & Cave-in Risk');

    const phase2Start = Date.now();
    const migratedState = migrationResult.state;
    let depth = 0;
    const depthLog = [];

    // Simulate 6 descent ticks with cargo
    for (let tick = 1; tick <= 6; tick++) {
      depth = RaidTime.calculateDepth(depth, 6.5, 15);
      const staminaCost = RaidTime.calculateStaminaCost(depth);
      const caveIn = RaidTime.checkCaveInRisk(depth, migratedState.stats?.highestDepthReached || 0);
      depthLog.push({ tick, depth, staminaCost, caveInRisk: caveIn.riskPercent });
    }

    const phase2Duration = Date.now() - phase2Start;
    const phase2Passed = depth > 0 && depthLog.every(d => d.staminaCost >= 8);

    const phase2 = {
      name: 'Raid Descent & Cave-in Risk',
      passed: phase2Passed,
      details: {
        finalDepth: parseFloat(depth.toFixed(2)),
        ticks: depthLog,
        maxStaminaCost: Math.max(...depthLog.map(d => d.staminaCost)),
        maxCaveInRisk: Math.max(...depthLog.map(d => d.caveInRisk)),
        durationMs: phase2Duration,
      },
    };
    phases.push(phase2);
    suitePassed = suitePassed && phase2Passed;

    log(`  Final depth: ${phase2.details.finalDepth}m after 6 ticks`);
    log(`  Max stamina cost: ${phase2.details.maxStaminaCost}`);
    log(`  Max cave-in risk: ${phase2.details.maxCaveInRisk.toFixed(1)}%`);

    // ── PHASE 3: Guard Pheromone Encounter ────────────────────────────
    log('\n\uD83D\uDC1C PHASE 3: Guard Pheromone Encounter');

    const phase3Start = Date.now();
    const guardPos = { x: 120, y: 160 };
    const targetPos = { x: 200, y: 140 };
    const pheromones = [
      PheromoneGuardMath.createPheromonePoint(130, 155, 5, 'ATTACK'),
      PheromoneGuardMath.createPheromonePoint(150, 150, 3, 'SCATTER'),
      PheromoneGuardMath.createPheromonePoint(180, 145, 7, 'ATTACK'),
    ];

    const force = PheromoneGuardMath.calculatePheromoneForce(
      guardPos, targetPos, pheromones, 1.5
    );
    const magnitude = Math.sqrt(force.fx ** 2 + force.fy ** 2);
    const phase3Duration = Date.now() - phase3Start;
    const phase3Passed = magnitude > 0 && magnitude <= 12; // 8.0 * 1.5 aggression limit

    const phase3 = {
      name: 'Guard Pheromone Encounter',
      passed: phase3Passed,
      details: {
        force,
        magnitude: parseFloat(magnitude.toFixed(4)),
        pheromoneCount: pheromones.length,
        withinBounds: magnitude <= 12,
        durationMs: phase3Duration,
      },
    };
    phases.push(phase3);
    suitePassed = suitePassed && phase3Passed;

    log(`  Force vector: (${force.fx.toFixed(4)}, ${force.fy.toFixed(4)})`);
    log(`  Magnitude: ${magnitude.toFixed(4)} (limit: 12.0)`);
    log(`  In bounds: ${phase3Passed ? '\u2705' : '\u274C'}`);

    // ── PHASE 4: Queen Loot Table ─────────────────────────────────────
    log('\n\uD83D\uDC51 PHASE 4: Queen Loot Table Processing');

    const phase4Start = Date.now();
    const lootResults = [];

    // Run 10 boss loot rolls at various tiers
    for (let tier = 1; tier <= 5; tier++) {
      const loot = QueenLootTableProcessor.rollBossLoot({ bossTier: tier, baseDropCount: 2 });
      lootResults.push({ tier, ...loot.summary });
    }

    // Verify probability calculations
    const probCrownShard5 = QueenLootTableProcessor.probabilityOfAtLeastOne('crown_shard', 5);
    const probRoyalEgg10 = QueenLootTableProcessor.probabilityOfAtLeastOne('royal_egg', 10);

    const phase4Duration = Date.now() - phase4Start;
    const phase4Passed = lootResults.every(r => r.totalDrops >= 2 && r.totalDrops <= 4);

    const phase4 = {
      name: 'Queen Loot Table',
      passed: phase4Passed,
      details: {
        resultsByTier: lootResults,
        probCrownShardIn5: parseFloat(probCrownShard5.toFixed(4)),
        probRoyalEggIn10: parseFloat(probRoyalEgg10.toFixed(4)),
        durationMs: phase4Duration,
      },
    };
    phases.push(phase4);
    suitePassed = suitePassed && phase4Passed;

    log(`  Loot results verified across tiers 1-5`);
    log(`  P(Crown Shard in 5 rolls) = ${(probCrownShard5 * 100).toFixed(1)}%`);
    log(`  P(Royal Egg in 10 rolls) = ${(probRoyalEgg10 * 100).toFixed(1)}%`);

    // ── PHASE 5: Sensory Integration ──────────────────────────────────
    log('\n\uD83D\uDCF7 PHASE 5: Sensory Integration Test');

    const phase5Start = Date.now();
    const sensoryPassed = SensoryIntegrationTest.runSimulationSuite();
    const phase5Duration = Date.now() - phase5Start;
    const quickResult = SensoryIntegrationTest.quickVerify();

    const phase5 = {
      name: 'Sensory Integration',
      passed: sensoryPassed,
      details: {
        improvement: parseFloat(quickResult.improvement.toFixed(1)),
        tier0Dev: parseFloat(quickResult.tier0Dev.toFixed(6)),
        tier2Dev: parseFloat(quickResult.tier2Dev.toFixed(6)),
        durationMs: phase5Duration,
      },
    };
    phases.push(phase5);
    suitePassed = suitePassed && sensoryPassed;

    log(`  Variance reduction: ${quickResult.improvement.toFixed(1)}%`);

    // ── Summary ───────────────────────────────────────────────────────
    const totalDuration = [phase1Duration, phase2Duration, phase3Duration, phase4Duration, phase5Duration]
      .reduce((a, b) => a + b, 0);

    const passedCount = phases.filter(p => p.passed).length;
    const summary = `${passedCount}/${phases.length} phases passed in ${totalDuration}ms`;

    log(`\n\u2500${'\u2500'.repeat(50)}`);
    log(`  RESULT: ${suitePassed ? '\u2705 ALL PHASES PASSED' : '\u274C SOME PHASES FAILED'}`);
    log(`  ${summary}`);
    log(`\u2500${'\u2500'.repeat(50)}`);

    return { passed: suitePassed, phases, summary };
  },
};

// Auto-execute when run directly
if (require.main === module) {
  const result = ComprehensiveSubsystemTest.runFullSuite({ verbose: true });
  process.exit(result.passed ? 0 : 1);
}

module.exports = ComprehensiveSubsystemTest;

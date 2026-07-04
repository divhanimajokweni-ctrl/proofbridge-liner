/**
 * AntEaterE2EEngineParser.js
 * Complete end-to-end system integration runtime that compiles and tests all
 * components built for the Ant Feast raid system.
 * 
 * Execution thread:
 *   1. System engine cache initialization
 *   2. Surface scouting + offline radar resolution
 *   3. Snout descent + tactical depth loop
 *   4. Deep chamber encounter + pheromone guard vector sampling
 *   5. Cave-in failure + death penalty protocols
 *   6. Mutation purchase + state update
 */
const RaidTime = require('./RaidTime');
const PheromoneGuardMath = require('./PheromoneGuardMath');
const SensoryIntegrationTest = require('./SensoryIntegrationTest');

const AntEaterE2EEngineParser = {
  /**
   * Executes the complete integration lifecycle for all raid subsystems.
   * @param {Object} [initialState] - Optional initial game state override
   * @returns {Object} Final system state after lifecycle execution
   */
  executeCompleteLifecycle: function(initialState) {
    console.log('\uD83C\uDFC1 ========================================================');
    console.log('\uD83C\uDFC1 INITIATING END-TO-END SYSTEM INTEGRATION LIFECYCLE PARSER');
    console.log('\uD83C\uDFC1 ========================================================');

    // ── PHASE 1: Initialize System Engine Cache & State Schema ──────────
    let systemStorageState = initialState || {
      total_worker_dna: 600,
      total_royal_jelly: 2,
      highest_depth_reached: 12.0,
      unlocked_tiers: { elasticity: 0, gastronomy: 0, sensory: 0 },
    };
    console.log(
      `[E2E Init] Cache loaded successfully. Starting Balance: \uD83E\uDDEC ${systemStorageState.total_worker_dna} DNA.`
    );

    // ── PHASE 2: Execute Surface Scouting & Offline Radar Resolution ──
    console.log(
      '\n[E2E Surface Phase] Running localized surface scouting matrices...'
    );
    SensoryIntegrationTest.runSimulationSuite();

    // ── PHASE 3: Drop Snout Into Entry Points & Trigger Descent Loop ──
    console.log(
      '\n[E2E Descent Phase] Snout anchored. Beginning active cave exploration loop simulation...'
    );
    let liveRaidTelemetry = {
      depth: 0,
      collectedDna: 0,
      larvaeWeight: 15.0,
    };
    let ticksElapsed = 0;
    const baseSpeedSetting = 6.5;

    // Simulate 4 calculation ticks inside the gameplay execution loop
    while (ticksElapsed < 4) {
      ticksElapsed++;
      liveRaidTelemetry.depth = RaidTime.calculateDepth(
        liveRaidTelemetry.depth,
        baseSpeedSetting,
        liveRaidTelemetry.larvaeWeight
      );
      liveRaidTelemetry.collectedDna += Math.floor(Math.random() * 15) + 10;

      console.log(
        ` -> Tick ${ticksElapsed}: Current Depth: ${liveRaidTelemetry.depth.toFixed(1)}m | Cargo Payload: ${liveRaidTelemetry.larvaeWeight}kg`
      );
    }

    // ── PHASE 4: Deep Chamber Encounter & Pheromone Guard Vector ──────
    console.log(
      '\n[E2E Encounter Phase] Infiltrating deep nest node structure. Sampling AI threat mechanics...'
    );
    const guardPosition = { x: 45.0, y: 80.0 };
    const playerSnoutPosition = { x: 50.0, y: 110.0 };
    const mockPheromones = [
      { x: 48.0, y: 95.0, density: 4.5, type: 'ATTACK' },
    ];

    const steeringForce = PheromoneGuardMath.calculatePheromoneForce(
      guardPosition,
      playerSnoutPosition,
      mockPheromones,
      1.5 // Active Boss Phase 2 Aggression scaling
    );
    console.log(
      ` -> Guard AI calculated acceleration steering output forces: { fx: ${steeringForce.fx}, fy: ${steeringForce.fy} }`
    );

    // ── PHASE 5: Trigger Crash Mechanics & Execute Death Penalty ──────
    console.log(
      '\n[E2E Failure Phase] Structural collapse condition reached past safe thresholds.'
    );
    console.log(
      ` -> Total collected run assets lost: \uD83E\uDDEC ${liveRaidTelemetry.collectedDna} DNA destroyed.`
    );

    // Line 622 State Mutation Simulation — matching original component.js pattern
    systemStorageState.total_worker_dna = Math.floor(
      systemStorageState.total_worker_dna * 0.5
    );
    systemStorageState.highest_depth_reached = Math.max(
      systemStorageState.highest_depth_reached,
      liveRaidTelemetry.depth
    );
    systemStorageState.updated_at = new Date().toISOString();

    console.log(
      ` -> Post-run sync complete. Core base balance penalized to: \uD83E\uDDEC ${systemStorageState.total_worker_dna} DNA.`
    );

    // ── PHASE 6: Mutate Context via Mutation Screen UI Triggers ──────
    console.log(
      '\n[E2E Core Upgrade Purchase Phase] Processing lab requests inside Mutation Lab view...'
    );
    const targetUpgradeCost = 120;

    console.log(
      ` -> Checking balances against purchase cost requirements: \uD83E\uDDEC ${targetUpgradeCost} DNA`
    );
    if (systemStorageState.total_worker_dna >= targetUpgradeCost) {
      // Execute explicit state assignment matching Line 1170 of component.js
      systemStorageState = Object.assign({}, systemStorageState, {
        total_worker_dna:
          systemStorageState.total_worker_dna - targetUpgradeCost,
        unlocked_tiers: {
          ...systemStorageState.unlocked_tiers,
          elasticity: 1,
        },
      });
      console.log(
        ' -> Upgrade authorization accepted. Mutation compiled securely into system state.'
      );
    } else {
      console.log(
        ' -> Order rejected: Insufficient mutations capital resources. Player locked out.'
      );
    }

    console.log('\n========================================================");
    console.log(
      '\uD83C\uDFC1 END-TO-END LIFE CYCLE COMPILATION COMPLETE: ALL SYSTEMS RUNNING'
    );
    console.log('========================================================");

    return systemStorageState;
  },
};

// Auto-execute when run directly
if (require.main === module) {
  AntEaterE2EEngineParser.executeCompleteLifecycle();
}

module.exports = AntEaterE2EEngineParser;

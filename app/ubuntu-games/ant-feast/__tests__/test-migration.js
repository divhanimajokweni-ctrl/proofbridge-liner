/**
 * ProfileMigrationEngine.js — Unit Tests
 *
 * Verifies:
 *   1. getVersion returns 0 for unversioned state
 *   2. needsMigration detects outdated states
 *   3. v1→v2 migration backfills raid sessions correctly
 *   4. Migration is idempotent (already-migrated state is unchanged)
 *   5. Invalid state handling
 *   6. validate catches schema violations
 *   7. preview returns correct pending migrations
 */
const ProfileMigrationEngine = require('../lib/ProfileMigrationEngine');

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

// ── Test 1: getVersion ──────────────────────────────────────────────────────
console.log('\n--- Test: getVersion ---');
const noVerState = { someData: true };
assert(
  ProfileMigrationEngine.getVersion(noVerState) === 0,
  'Unversioned state should return version 0'
);

const v1State = { _migration_version: 1, raidSessions: [] };
assert(
  ProfileMigrationEngine.getVersion(v1State) === 1,
  'State with _migration_version: 1 should return 1'
);

const nullResult = ProfileMigrationEngine.getVersion(null);
assert(nullResult === 0, 'Null state should return version 0');

// ── Test 2: needsMigration ──────────────────────────────────────────────────
console.log('\n--- Test: needsMigration ---');
assert(
  ProfileMigrationEngine.needsMigration(noVerState) === true,
  'Unversioned state needs migration'
);
assert(
  ProfileMigrationEngine.needsMigration(v1State) === true,
  'v1 state needs migration'
);

const currentState = { _migration_version: ProfileMigrationEngine.CURRENT_VERSION, raidSessions: [] };
assert(
  ProfileMigrationEngine.needsMigration(currentState) === false,
  'Current version does not need migration'
);

// ── Test 3: v1→v2 migration ────────────────────────────────────────────────
console.log('\n--- Test: v1→v2 migration ---');
const legacyState = {
  _migration_version: 1,
  depth_record: 55,
  total_worker_dna: 400,
  total_royal_jelly: 5,
  raidSessions: [
    { depth_reached: 30, dna_collected: 50 },
    { depth_reached: 60, dna_collected: 120, boss_defeated: true },
  ],
};

const migrationResult = ProfileMigrationEngine.migrate(legacyState);
const migrated = migrationResult.state;

assert(migrationResult.errors.length === 0, 'Migration should have no errors');
assert(migrationResult.applied.includes('v1\u2192v2'), 'Migration should apply v1\u2192v2');
assert(migrated._migration_version === 2, 'Migrated state version should be 2');

// Check raid session backfill
assert(Array.isArray(migrated.raidSessions), 'Migrated state should have raidSessions array');
assert(migrated.raidSessions.length === 2, 'Should have 2 raid sessions');

const session0 = migrated.raidSessions[0];
assert(!!session0.raid_id, 'Session 0 should have raid_id');
assert(!!session0.created_at, 'Session 0 should have created_at');
assert(typeof session0.completed === 'boolean', 'Session 0 completed should be boolean');
assert(typeof session0.boss_defeated === 'boolean', 'Session 0 boss_defeated should be boolean');

// Session 1 should have boss_defeated = true
assert(migrated.raidSessions[1].boss_defeated === true, 'Session 1 boss_defeated should preserve true');

// depth_record should be migrated to highest_depth_reached
assert(migrated.highest_depth_reached === 55, 'depth_record should migrate to highest_depth_reached=55');
assert(migrated.depth_record === undefined, 'depth_record should be deleted after migration');

// unlocked_tiers should exist
assert(
  migrated.unlocked_tiers && migrated.unlocked_tiers.elasticity === 0,
  'unlocked_tiers should be initialized'
);

// stats block should exist
assert(migrated.stats && migrated.stats.highestDepthReached === 55, 'stats should have highestDepthReached');

// ── Test 4: Idempotent — re-migrating should not change state ──────────────
console.log('\n--- Test: Idempotency ---');
const reMigration = ProfileMigrationEngine.migrate(migrated);
assert(reMigration.applied.length === 0, 'Re-migration should apply 0 migrations');
assert(
  reMigration.state._migration_version === 2,
  'Re-migration should keep version at 2'
);

// ── Test 5: Invalid state handling ─────────────────────────────────────────
console.log('\n--- Test: Invalid state ---');
const nullMigration = ProfileMigrationEngine.migrate(null);
assert(nullMigration.errors.length > 0, 'Null state migration should have errors');
assert(nullMigration.applied.length === 0, 'Null state migration should apply nothing');

const emptyMigration = ProfileMigrationEngine.migrate({});
assert(emptyMigration.applied.length > 0, 'Empty object should be migratable');
assert(
  emptyMigration.state._migration_version === ProfileMigrationEngine.CURRENT_VERSION,
  'Empty object should reach CURRENT_VERSION'
);

// ── Test 6: validate ────────────────────────────────────────────────────────
console.log('\n--- Test: validate ---');
const validResult = ProfileMigrationEngine.validate(migrated);
assert(validResult.valid === true, 'Migrated state should validate');

const invalidResult = ProfileMigrationEngine.validate(null);
assert(invalidResult.valid === false, 'Null state should not validate');
assert(invalidResult.issues.length > 0, 'Null validation should have issues');

const semiValid = ProfileMigrationEngine.validate({ _migration_version: 2 });
const semiResult = ProfileMigrationEngine.validate(semiValid.state || semiValid);
// Just check it runs without crashing
assert(typeof semiResult === 'object', 'Validate should return an object');

// ── Test 7: preview ────────────────────────────────────────────────────────
console.log('\n--- Test: preview ---');
const previewNeeded = ProfileMigrationEngine.preview(v1State);
assert(previewNeeded.wouldApply.length > 0, 'v1 state preview should list migrations');
assert(previewNeeded.warnings.length === 0, 'v1 state preview should have no warnings');

const previewCurrent = ProfileMigrationEngine.preview(currentState);
assert(previewCurrent.wouldApply.length === 0, 'Current state preview should list no migrations');
assert(previewCurrent.warnings.length > 0, 'Current state preview should warn about up-to-date');

// ── Summary ─────────────────────────────────────────────────────────────────
console.log(`\n\u2500${'\u2500'.repeat(48)}`);
console.log(`Results: ${passed} passed, ${failed} failed`);
if (failed > 0) process.exit(1);

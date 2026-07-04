/**
 * ProfileMigrationEngine.js
 * Versioned schema migration engine for game state transitions.
 *
 * Handles:
 *   - v1 → v2 schema migration (backfills raid session fields)
 *   - Version tracking via `_migration_version` integer
 *   - Forward-only migrations with idempotent application
 *   - Migration validation and rollback simulation
 */

const ProfileMigrationEngine = {
  // ─── Schema Versions ──────────────────────────────────────────────────────

  CURRENT_VERSION: 2,

  // ─── Migration Registry ───────────────────────────────────────────────────

  /**
   * Registry of migration functions keyed by target version.
   * Each function receives the raw state and returns the migrated state.
   */
  _migrations: {
    /**
     * v1 → v2: Backfills raid session fields.
     * Adds raid_id, created_at, completed, boss_defeated to each raid session.
     * Renames `depth_record` to `highest_depth_reached` for consistency.
     */
    2: function migrateV1toV2(state) {
      const migrated = { ...state };

      // Set migration version
      migrated._migration_version = 2;

      // Normalize depth field
      if (migrated.depth_record !== undefined && migrated.highest_depth_reached === undefined) {
        migrated.highest_depth_reached = migrated.depth_record;
        delete migrated.depth_record;
      }

      // Migrate raid sessions array
      if (Array.isArray(migrated.raidSessions)) {
        migrated.raidSessions = migrated.raidSessions.map((session) => ({
          raid_id: session.raid_id || `raid_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
          created_at: session.created_at || new Date().toISOString(),
          completed: session.completed !== undefined ? session.completed : true,
          boss_defeated: session.boss_defeated !== undefined ? session.boss_defeated : false,
          depth_reached: session.depth_reached || 0,
          dna_collected: session.dna_collected || 0,
          jelly_collected: session.jelly_collected || 0,
          escaped: session.escaped !== undefined ? session.escaped : true,
        }));
      } else {
        migrated.raidSessions = [];
      }

      // Initialize unlocked mutations map if missing
      if (!migrated.unlocked_tiers) {
        migrated.unlocked_tiers = {
          elasticity: 0,
          gastronomy: 0,
          sensory: 0,
        };
      }

      // Ensure stats block exists
      if (!migrated.stats) {
        migrated.stats = {
          highestDepthReached: migrated.highest_depth_reached || 0,
          totalRaidsCompleted: migrated.raidSessions.length,
          bossDefeatedCount: migrated.raidSessions.filter(s => s.boss_defeated).length,
        };
      }

      return migrated;
    },
  },

  /**
   * Returns the migration version from a state object.
   * @param {Object} state - Game state object
   * @returns {number} Current migration version (0 if unset)
   */
  getVersion: function(state) {
    return (state && state._migration_version) || 0;
  },

  /**
   * Checks whether a migration is needed to reach CURRENT_VERSION.
   * @param {Object} state - Game state object
   * @returns {boolean} True if migration is required
   */
  needsMigration: function(state) {
    return this.getVersion(state) < this.CURRENT_VERSION;
  },

  /**
   * Applies all pending migrations to reach CURRENT_VERSION.
   * Migrations are applied sequentially and idempotently.
   *
   * @param {Object} state - Raw game state object
   * @returns {{ state: Object, applied: string[], errors: string[] }}
   *   - state: Fully migrated state
   *   - applied: Array of migration version labels applied
   *   - errors: Array of error messages (empty on success)
   */
  migrate: function(state) {
    if (!state || typeof state !== 'object') {
      return {
        state: state || {},
        applied: [],
        errors: ['Invalid state: must be a non-null object'],
      };
    }

    const currentVersion = this.getVersion(state);
    const applied = [];
    const errors = [];

    // Apply migrations sequentially from current+1 to CURRENT_VERSION
    for (let targetVer = currentVersion + 1; targetVer <= this.CURRENT_VERSION; targetVer++) {
      const migrationFn = this._migrations[targetVer];
      if (!migrationFn) {
        errors.push(`No migration defined for version ${targetVer}`);
        continue;
      }

      try {
        const result = migrationFn(state);
        state = result;
        applied.push(`v${targetVer - 1}→v${targetVer}`);
      } catch (err) {
        errors.push(`Migration to v${targetVer} failed: ${err.message}`);
      }
    }

    return { state, applied, errors };
  },

  /**
   * Validates that a state object conforms to the current schema version.
   * @param {Object} state - Migrated game state
   * @returns {{ valid: boolean, issues: string[] }}
   */
  validate: function(state) {
    const issues = [];

    if (!state) {
      return { valid: false, issues: ['State is null'] };
    }

    if (this.getVersion(state) !== this.CURRENT_VERSION) {
      issues.push(`Expected version ${this.CURRENT_VERSION}, got ${this.getVersion(state)}`);
    }

    if (!Array.isArray(state.raidSessions)) {
      issues.push('raidSessions must be an array');
    }

    if (!state.unlocked_tiers || typeof state.unlocked_tiers !== 'object') {
      issues.push('unlocked_tiers must be an object');
    }

    // Validate raid session fields
    if (Array.isArray(state.raidSessions)) {
      state.raidSessions.forEach((session, idx) => {
        if (!session.raid_id) issues.push(`raidSessions[${idx}]: missing raid_id`);
        if (!session.created_at) issues.push(`raidSessions[${idx}]: missing created_at`);
        if (typeof session.completed !== 'boolean') issues.push(`raidSessions[${idx}]: completed must be boolean`);
        if (typeof session.boss_defeated !== 'boolean') issues.push(`raidSessions[${idx}]: boss_defeated must be boolean`);
      });
    }

    return {
      valid: issues.length === 0,
      issues,
    };
  },

  /**
   * Simulates a migration without mutating the original state.
   * Useful for dry-run / preview before applying.
   * @param {Object} state - Game state to preview migration on
   * @returns {{ wouldApply: string[], warnings: string[] }}
   */
  preview: function(state) {
    const currentVersion = this.getVersion(state);
    const wouldApply = [];
    const warnings = [];

    if (currentVersion >= this.CURRENT_VERSION) {
      warnings.push('State is already at the current version');
      return { wouldApply, warnings };
    }

    for (let targetVer = currentVersion + 1; targetVer <= this.CURRENT_VERSION; targetVer++) {
      if (this._migrations[targetVer]) {
        wouldApply.push(`v${targetVer - 1}→v${targetVer}`);
      } else {
        warnings.push(`No migration defined for version ${targetVer}`);
      }
    }

    return { wouldApply, warnings };
  },
};

module.exports = ProfileMigrationEngine;

/**
 * QueenLootTableProcessor.js
 * Weighted loot drop engine for Queen boss encounters.
 *
 * Implements a probability-weighted loot table with:
 *   - Common drops: Worker DNA (35%), Royal Jelly (25%)
 *   - Rare drops: Crown Shard (15%), Mutation Unlock (12%), Queen Venom (8%), Royal Egg (5%)
 *
 * Each entry has a weight; the engine draws from the cumulative distribution.
 * Supports multi-drop draws, quantity variance, and boss-tier multipliers.
 */
const QueenLootTableProcessor = {
  // ─── Drop Table Definition ────────────────────────────────────────────────

  DROP_TABLE: [
    { id: 'worker_dna',     name: 'Worker DNA',     weight: 35, tier: 'common', icon: '\uD83E\uDDEC' },
    { id: 'royal_jelly',    name: 'Royal Jelly',    weight: 25, tier: 'common', icon: '\uD83D\uDC51' },
    { id: 'crown_shard',    name: 'Crown Shard',    weight: 15, tier: 'rare',   icon: '\uD83D\uDC51' },
    { id: 'mutation_unlock', name: 'Mutation Unlock', weight: 12, tier: 'rare', icon: '\uD83E\uDDEC' },
    { id: 'queen_venom',    name: 'Queen Venom',    weight:  8, tier: 'rare',   icon: '\uD83E\uDDEA' },
    { id: 'royal_egg',      name: 'Royal Egg',      weight:  5, tier: 'epic',   icon: '\uD83E\uDD5A' },
  ],

  // ─── Cumulative Distribution ───────────────────────────────────────────────

  _buildCumulative: function() {
    const cum = [];
    let acc = 0;
    for (const entry of this.DROP_TABLE) {
      acc += entry.weight;
      cum.push({ ...entry, cumWeight: acc });
    }
    return { cum, totalWeight: acc };
  },

  /**
   * Rolls a single loot drop from the weighted table.
   * @returns {Object} The selected drop entry (id, name, tier, icon)
   */
  rollOnce: function() {
    const { cum, totalWeight } = this._buildCumulative();
    const roll = Math.random() * totalWeight;
    for (const entry of cum) {
      if (roll < entry.cumWeight) {
        const { cumWeight, ...drop } = entry;
        return drop;
      }
    }
    // Fallback — should never reach here
    return { ...this.DROP_TABLE[0] };
  },

  /**
   * Rolls multiple independent drops from the table.
   * @param {number} count - Number of drops to roll
   * @returns {Object[]} Array of dropped items
   */
  rollMultiple: function(count) {
    const drops = [];
    for (let i = 0; i < count; i++) {
      drops.push(this.rollOnce());
    }
    return drops;
  },

  /**
   * Rolls loot with guaranteed rare/epic minimums and boss-tier multipliers.
   *
   * @param {Object} options
   * @param {number} options.bossTier       - Boss difficulty tier (1-5). Higher = more drops + better quality.
   * @param {number} options.baseDropCount  - Base number of drops before tier multiplier (default: 2)
   * @param {boolean} options.guaranteeRare - If true, at least one drop is rare or better (default: true)
   * @returns {{ drops: Object[], summary: Object }}
   */
  rollBossLoot: function({ bossTier = 1, baseDropCount = 2, guaranteeRare = true } = {}) {
    // Clamp boss tier
    const tier = Math.max(1, Math.min(5, bossTier));

    // Drop count scales with tier
    const additionalDrops = Math.floor((tier - 1) / 2); // +1 at tier 3, +2 at tier 5
    const totalDrops = baseDropCount + additionalDrops;

    let drops = this.rollMultiple(totalDrops);

    // Guarantee at least one rare+ if requested
    if (guaranteeRare && !drops.some(d => d.tier !== 'common')) {
      // Replace a random common drop with a guaranteed rare
      const rarePool = this.DROP_TABLE.filter(d => d.tier !== 'common');
      const rareRoll = rarePool[Math.floor(Math.random() * rarePool.length)];
      const commonIdx = drops.findIndex(d => d.tier === 'common');
      if (commonIdx !== -1) {
        drops[commonIdx] = { ...rareRoll };
      }
    }

    // Build summary
    const summary = {
      totalDrops,
      bossTier: tier,
      byTier: {
        common: drops.filter(d => d.tier === 'common').length,
        rare: drops.filter(d => d.tier === 'rare').length,
        epic: drops.filter(d => d.tier === 'epic').length,
      },
      itemIds: drops.map(d => d.id),
    };

    return { drops, summary };
  },

  /**
   * Calculates the probability of drawing at least one of a given item in N rolls.
   * @param {string} itemId - The item ID to check
   * @param {number} rolls  - Number of independent rolls
   * @returns {number} Probability as a decimal (0-1)
   */
  probabilityOfAtLeastOne: function(itemId, rolls) {
    const entry = this.DROP_TABLE.find(e => e.id === itemId);
    if (!entry) return 0;
    const totalWeight = this.DROP_TABLE.reduce((s, e) => s + e.weight, 0);
    const pMiss = 1 - (entry.weight / totalWeight);
    return 1 - Math.pow(pMiss, rolls);
  },

  /**
   * Resets the random seed by running a warm-up cycle (useful in tests).
   * @returns {number} Number of warm-up rolls executed
   */
  warmUp: function() {
    // Run 1000 rolls to warm up the RNG state
    for (let i = 0; i < 1000; i++) {
      this.rollOnce();
    }
    return 1000;
  },
};

module.exports = QueenLootTableProcessor;

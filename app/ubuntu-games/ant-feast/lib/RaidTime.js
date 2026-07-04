/**
 * RaidTime.js
 * Real-time depth tracking, stamina burn, and exponential cave-in risk formulas.
 * 
 * Formulas extracted from the original RaidScreen implementation:
 *   - depth_increment = 5 + floor(random * 5)
 *   - cave-in probability: exponental curve past depth 50m
 *   - stamina_cost = 8 per descend
 */
const RaidTime = {
  /**
   * Calculates real-time depth based on speed and weight drag penalties.
   * @param {number} currentDepth  - Current depth in meters
   * @param {number} baseSpeed     - Base descent speed (default: 6.5)
   * @param {number} larvaeWeight  - Cargo weight imposing drag penalty
   * @returns {number} New depth value
   */
  calculateDepth: function(currentDepth, baseSpeed, larvaeWeight) {
    const dragPenalty = larvaeWeight > 0 ? 0.40 : 1.0; // 60% drag penalty
    const effectiveSpeed = baseSpeed * dragPenalty;
    return currentDepth + (effectiveSpeed * 0.1);
  },

  /**
   * Determines cave-in probability using exponential growth curve based on depth.
   * Original formula: depth += 5 + floor(random * 5), 30% collapse chance per descend.
   * This refines it to a continuous risk model.
   * 
   * @param {number} depth               - Current depth in meters
   * @param {number} structuralIntegrity - Mitigation from upgrades (0 = none)
   * @returns {{ riskPercent: number, triggersCaveIn: boolean }}
   */
  checkCaveInRisk: function(depth, structuralIntegrity) {
    // Safe zone: no risk above 50m
    if (depth < 50) {
      return { riskPercent: 0, triggersCaveIn: false };
    }

    // Risk escalates exponentially past safe depths: (depth/100)^2.5
    const baseRisk = Math.pow(depth / 100, 2.5);
    
    // Each point of structural integrity reduces risk by 15%
    const mitigatedRisk = Math.max(0, baseRisk - (structuralIntegrity * 0.15));
    
    // Cap at 95% — never 100% deterministic
    const riskPercent = Math.min(95, mitigatedRisk);

    const roll = Math.random() * 100;
    const triggersCaveIn = roll < riskPercent;

    return {
      riskPercent: parseFloat(riskPercent.toFixed(2)),
      triggersCaveIn: triggersCaveIn
    };
  },

  /**
   * Calculates stamina cost for descending, accounting for depth penalties.
   * Original: stamina -= 8 per descend.
   * @param {number} currentDepth - Current depth
   * @returns {number} Stamina cost (higher at greater depths)
   */
  calculateStaminaCost: function(currentDepth) {
    const baseCost = 8;
    const depthSurcharge = currentDepth > 80 ? 4 : currentDepth > 50 ? 2 : 0;
    return baseCost + depthSurcharge;
  },

  /**
   * Calculates passive stamina drain per tick at given depth.
   * Original: 6% chance per second to lose 3 stamina.
   * @param {number} depth - Current depth
   * @returns {{ drainAmount: number, drainChance: number }}
   */
  getPassiveDrain: function(depth) {
    const drainAmount = depth > 50 ? 5 : 3;
    const drainChance = depth > 50 ? 0.10 : 0.06; // 10% deep, 6% shallow
    return { drainAmount, drainChance };
  }
};

module.exports = RaidTime;

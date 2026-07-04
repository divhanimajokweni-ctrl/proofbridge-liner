/**
 * PheromoneGuardMath.js
 * Dynamic enemy acceleration vector subsystem using artificial pheromone fields.
 * 
 * Guards sample trail paths left by the player's snout, combining attraction
 * vectors with orbital body configurations to construct a unified motion vector.
 * Maps to Queen's Guard subroutines in the original RaidScreen.
 */
const PheromoneGuardMath = {
  /**
   * Calculates the guard's acceleration vector based on local pheromone networks.
   * 
   * @param {Object} guardPos        - { x, y } position of the guard ant
   * @param {Object} targetPos       - { x, y } position of the player snout
   * @param {Array}  pheromoneGrid   - Collection of tracking points [{ x, y, density, type }]
   * @param {number} basicAggression - Global phase modifier multiplier
   * @returns {{ fx: number, fy: number }} Unbound force acceleration vector
   */
  calculatePheromoneForce: function(guardPos, targetPos, pheromoneGrid, basicAggression) {
    let combinedFx = 0;
    let combinedFy = 0;

    // 1. Direct Target Attractor Vector
    const dx = targetPos.x - guardPos.x;
    const dy = targetPos.y - guardPos.y;
    const directDist = Math.sqrt(dx * dx + dy * dy) || 1;

    // Normalize and scale by base aggression
    combinedFx += (dx / directDist) * 1.5 * basicAggression;
    combinedFy += (dy / directDist) * 1.5 * basicAggression;

    // 2. Diffused Pheromone Field Matrix Samples
    pheromoneGrid.forEach(trail => {
      const tx = trail.x - guardPos.x;
      const ty = trail.y - guardPos.y;
      const trailDist = Math.sqrt(tx * tx + ty * ty) || 1;

      if (trailDist < 120) {
        // Effective localized sensing radius
        const falloff = (120 - trailDist) / 120;
        const weight = trail.density * falloff * (trail.type === 'ATTACK' ? 2.5 : 0.8);

        combinedFx += (tx / trailDist) * weight;
        combinedFy += (ty / trailDist) * weight;
      }
    });

    // 3. Orbital Defense Pattern Friction
    // Enforces boundary containment around the Queen
    const speedLimit = 8.0 * basicAggression;
    const currentVelocityMagnitude = Math.sqrt(combinedFx * combinedFx + combinedFy * combinedFy) || 1;

    if (currentVelocityMagnitude > speedLimit) {
      combinedFx = (combinedFx / currentVelocityMagnitude) * speedLimit;
      combinedFy = (combinedFy / currentVelocityMagnitude) * speedLimit;
    }

    return {
      fx: parseFloat(combinedFx.toFixed(4)),
      fy: parseFloat(combinedFy.toFixed(4)),
    };
  },

  /**
   * Generates a mock pheromone trail for testing purposes.
   * @param {number} x      - X coordinate
   * @param {number} y      - Y coordinate
   * @param {number} density - Trail density (1-10)
   * @param {string} type    - 'ATTACK' or 'SCATTER'
   * @returns {Object} Pheromone grid point
   */
  createPheromonePoint: function(x, y, density, type) {
    return {
      x,
      y,
      density: Math.min(10, Math.max(1, density)),
      type: type === 'ATTACK' ? 'ATTACK' : 'SCATTER',
    };
  },
};

module.exports = PheromoneGuardMath;

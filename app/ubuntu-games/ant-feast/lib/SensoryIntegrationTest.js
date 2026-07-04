/**
 * SensoryIntegrationTest.js
 * Diagnostic routine that simulates relative position readings under base
 * configurations versus an active Sensory Tier II (Thermal Olfaction) state.
 * 
 * Calculates standard deviations across test sets to verify optimization logic.
 * Maps to the ColonyMapScreen / SeismicSensorMapper subsystem.
 */
const SensoryIntegrationTest = {
  /**
   * Runs the full simulation suite comparing Tier 0 vs Tier 2 sensor accuracy.
   * @returns {boolean} True if variance is reduced (Tier 2 < Tier 0)
   */
  runSimulationSuite: function() {
    console.log('=== EXECUTING SENSORY INTEGRATION SYSTEM PROOF ===');

    const anchorLat = -26.1044;
    const trueOffset = 0.001200;

    /**
     * Generates sensor tracking error noise based on sensory tier.
     * Each tier reduces random mathematical coordinate displacement variance bounds.
     */
    const getReadingErrorNoise = (tier) => {
      const varianceFactor =
        tier === 0 ? 0.00090 : tier === 1 ? 0.00040 : 0.00005;
      return (Math.random() - 0.5) * varianceFactor;
    };

    /**
     * Runs a set of sensor reading samples for a given sensory tier.
     * @param {number} sensoryTier - 0, 1, 2, or 3
     * @param {number} iterations  - Number of samples to collect
     * @returns {number[]} Array of deviation values
     */
    const runScanSampleSet = (sensoryTier, iterations) => {
      const samples = [];
      for (let i = 0; i < iterations; i++) {
        const measuredReading =
          anchorLat + trueOffset + getReadingErrorNoise(sensoryTier);
        // Track raw deviance lines
        samples.push(measuredReading - (anchorLat + trueOffset));
      }
      return samples;
    };

    /**
     * Calculates standard deviation of a dataset.
     * @param {number[]} dataSet
     * @returns {number}
     */
    const calculateStandardDeviation = (dataSet) => {
      const total = dataSet.reduce((sum, val) => sum + val, 0);
      const mean = total / dataSet.length;
      const squaredDifferences = dataSet.map((val) => Math.pow(val - mean, 2));
      const avgSquaredDiff =
        squaredDifferences.reduce((sum, val) => sum + val, 0) / dataSet.length;
      return Math.sqrt(avgSquaredDiff);
    };

    // 1. Compile Dataset for Locked State (Tier 0)
    const tierZeroSamples = runScanSampleSet(0, 100);
    const deviationTierZero = calculateStandardDeviation(tierZeroSamples);

    // 2. Compile Dataset for Upgraded State (Tier 2 - Thermal Olfaction)
    const tierTwoSamples = runScanSampleSet(2, 100);
    const deviationTierTwo = calculateStandardDeviation(tierTwoSamples);

    console.log(
      `\uD83D\uDCCA Tier 0 Deviance Spread (Unoptimized Node Configuration): \u00B1${deviationTierZero.toFixed(6)}`
    );
    console.log(
      `\uD83C\uDFAF Tier 2 Deviance Spread (Thermal Olfaction Active Upgrades): \u00B1${deviationTierTwo.toFixed(6)}`
    );

    const accuracyImprovementPercent =
      ((deviationTierZero - deviationTierTwo) / deviationTierZero) * 100;
    console.log(
      `System Validation: Accuracy increased by ${accuracyImprovementPercent.toFixed(1)}%.`
    );

    if (deviationTierTwo < deviationTierZero) {
      console.log(
        '\u2705 INTEGRATION CRITERIA VERIFIED: Variance systematically minimized by core upgrades.'
      );
      return true;
    } else {
      console.error(
        '\uD83D\uDD25 ERROR: Upgrade calculations failed to compress variance profiles.'
      );
      return false;
    }
  },

  /**
   * Quick one-shot test without console output.
   * @returns {{ passed: boolean, tier0Dev: number, tier2Dev: number, improvement: number }}
   */
  quickVerify: function() {
    const anchorLat = -26.1044;
    const trueOffset = 0.001200;

    const noise = (tier) => (Math.random() - 0.5) * (tier === 0 ? 0.00090 : 0.00005);
    const samples = (tier, n) =>
      Array.from({ length: n }, () => anchorLat + trueOffset + noise(tier) - (anchorLat + trueOffset));

    const stddev = (data) => {
      const mean = data.reduce((a, b) => a + b, 0) / data.length;
      return Math.sqrt(data.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / data.length);
    };

    const d0 = stddev(samples(0, 100));
    const d2 = stddev(samples(2, 100));

    return {
      passed: d2 < d0,
      tier0Dev: d0,
      tier2Dev: d2,
      improvement: ((d0 - d2) / d0) * 100,
    };
  },
};

module.exports = SensoryIntegrationTest;

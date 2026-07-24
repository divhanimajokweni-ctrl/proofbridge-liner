/**
 * @license
 * VVU EARTH TECH - Earth Tech UI
 * Copyright (c) 2026 Venture Vision Ubuntu
 *
 * LICENSE: Apache-2.0 (Open Source) OR Commercial (Enterprise)
 * See LICENSE and COMMERCIAL_LICENSE.md for details.
 *
 * This file is part of the VVU EARTH TECH horizontal infrastructure.
 * It contains no product-specific logic (Golden Rule).
 */

// ============================================================================
// VVU EARTH TECH — Earth Tech UI (Barrel Export)
// ============================================================================
//
// UI components for the Epistemic DAG Runtime's spatial visualization,
// noise suppression, and target tracking interfaces.
// All components are self-contained React components using only
// SVG, Tailwind CSS, and pure CSS — NO external charting/mapping
// libraries (except Google Maps via script tag for spatial viz).
// ============================================================================

// Decision 8 — Frontend Architecture: Spatial Network Visualization
export {
  SpatialNetworkVisualization,
  NMBM_SCENARIOS,
  type DeploymentZone,
  type SpatialNetworkVisualizationProps,
} from './spatial-network-visualization';

// Decision 8 — Frontend Architecture: Noise Suppression Matrix
export {
  NoiseSuppressionMatrix,
  NOISE_PROFILES,
  type NoiseProfile,
  type NoiseSuppressionMatrixProps,
} from './noise-suppression-matrix';

// Decision 8 — Frontend Architecture: 500m Target Tracker
export {
  FiveHundredMeterTargetTracker,
  type CredibleIntervalSnapshot,
  type TargetTrackerProps,
} from './500m-target-tracker';

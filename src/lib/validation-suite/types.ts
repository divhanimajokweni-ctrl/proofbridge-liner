/**
 * @license
 * VVU EARTH TECH - AIR Kernel
 * Copyright (c) 2026 Venture Vision Ubuntu
 *
 * LICENSE: Apache-2.0 (Open Source) OR Commercial (Enterprise)
 * See LICENSE and COMMERCIAL_LICENSE.md for details.
 *
 * This file is part of the VVU EARTH TECH horizontal infrastructure.
 * It contains no product-specific logic (Golden Rule).
 */

// ============================================================================
// VVU-VAL-001 Validation Suite — Types
// ============================================================================
//
// Types for the 72-hour validation event system.
// Validation events are versioned INDEPENDENTLY from software releases.
// ============================================================================

/**
 * A single validation phase (P1-P7).
 */
export interface ValidationPhase {
  /** Phase identifier */
  id: string;
  /** Phase name */
  name: string;
  /** Hour range [start, end] */
  hours: [number, number];
  /** Which gate this phase tests */
  gate: string;
  /** Objective of this phase */
  objective: string;
  /** What is injected during this phase */
  injected: {
    type: string;
    /** Detailed injection schedule (varies by type) */
    schedule?: Record<string, unknown>[];
    /** Rate per second (for security injection) */
    rate_per_s?: number;
  };
  /** Expected outcomes */
  expected: Record<string, boolean | string>;
  /** Pass criteria (human-readable) */
  passCriteria: string[];
  /** Severity if this phase fails */
  severityOnFailure: string;
}

/**
 * A milestone event (M00-M72).
 */
export interface ValidationMilestone {
  /** Milestone identifier */
  id: string;
  /** Milestone name */
  name: string;
  /** What triggers this milestone */
  trigger: string;
  /** Actions to take */
  actions: Record<string, boolean>;
}

/**
 * An outreach stage (1-3).
 */
export interface OutreachStage {
  /** Stage number */
  stage: number;
  /** Stage name */
  name: string;
  /** What triggers this stage */
  trigger: string;
  /** Stage description */
  description: string;
  /** Gates that must pass before advancing */
  gates: string[];
  /** Target audiences */
  audiences: string[];
  /** Cooldown in minutes before next stage */
  cooldownMinutes: number;
}

/**
 * A dimension of the Validation Index.
 */
export interface ValidationIndexDimension {
  /** Dimension name */
  name: string;
  /** Weight (sum of all weights = 1.0) */
  weight: number;
  /** How it is measured */
  measurement: string;
}

/**
 * Overall validation result.
 */
export type ValidationResult = 'PASS' | 'FAIL' | 'IN_PROGRESS' | 'NOT_STARTED';

/**
 * Complete validation event status.
 */
export interface ValidationEventStatus {
  /** Event identifier */
  eventId: string;
  /** Protocol version */
  protocolVersion: string;
  /** Software release (set at freeze) */
  softwareRelease: string;
  /** Git commit hash (set at freeze) */
  commitHash: string;
  /** Container image tag (set at freeze) */
  imageTag: string;
  /** Container image digest (set at freeze) */
  imageDigest: string;
  /** Total hours */
  totalHours: number;
  /** All 7 phases */
  phases: ValidationPhase[];
  /** Current phase (null if not started) */
  currentPhase: string | null;
  /** All milestones */
  milestones: ValidationMilestone[];
  /** All outreach stages */
  outreachStages: OutreachStage[];
  /** Validation Index dimensions */
  validationIndexDimensions: ValidationIndexDimension[];
  /** PASS threshold */
  passThreshold: number;
  /** Overall result */
  overallResult: ValidationResult;
  /** Evidence bundles NOT committed to repo — published as GitHub Release assets */
  evidencePolicy: string;
  /** Last updated */
  lastUpdated: string;
}

/**
 * Recipient registry entry.
 */
export interface RecipientAudience {
  /** Audience group name */
  name: string;
  /** Which outreach stage releases to this group */
  releaseStage: number;
  /** Channels or recipients */
  entries: {
    name: string;
    type?: string;
    target?: string;
    personalized?: boolean;
    contact?: string;
    email?: string;
  }[];
}

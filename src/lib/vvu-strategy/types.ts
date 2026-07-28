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
// VVU Resource Acquisition & Partnership Strategy — Types
// ============================================================================
//
// CRITICAL DISTINCTION: This data model distinguishes between:
//   - Strategy: Planned direction and objectives
//   - Active Outreach: Currently being pursued (no outcomes yet)
//   - Confirmed Commitments: Formal agreements executed
//
// Per the user directive: "The key is to present those pathways as
// planned and active initiatives, not as outcomes that have already
// been secured."
// ============================================================================

/**
 * Status classification for each track and support item.
 * This is the core distinction that makes the document stronger.
 */
export type TrackStatus =
  | 'strategy'          // Planned direction, not yet active
  | 'active_outreach'   // Currently being pursued, no outcomes yet
  | 'confirmed_commitment'; // Formal agreement executed, verified

/**
 * The 7 resource acquisition tracks (A through G).
 */
export type TrackId = 'A' | 'B' | 'C' | 'D' | 'E' | 'F' | 'G';

/**
 * A single support item requested under a track.
 */
export interface SupportItem {
  /** What is being requested */
  description: string;
  /** Current status of this specific item */
  status: TrackStatus;
  /** Optional notes */
  notes?: string;
}

/**
 * A resource acquisition track.
 */
export interface ResourceTrack {
  /** Track identifier (A-G) */
  id: TrackId;
  /** Track name */
  name: string;
  /** Strategic objective */
  objective: string;
  /** All support items requested under this track */
  requestedSupport: SupportItem[];
  /** Overall track status */
  status: TrackStatus;
  /** Status detail — human-readable */
  statusDetail: string;
  /** Targets (specific organizations or entities) */
  targets?: string[];
  /** Target support types (for Track E) */
  targetSupport?: string[];
}

/**
 * The complete Resource Acquisition & Partnership Strategy.
 */
export interface ResourceAcquisitionStrategy {
  /** All 7 tracks */
  tracks: ResourceTrack[];
  /** Execution Principle statement */
  executionPrinciple: string;
  /** Communications Policy statement */
  communicationsPolicy: string;
  /** Pilot municipality target */
  pilotMunicipality: string;
  /** Pilot municipality status */
  pilotMunicipalityStatus: TrackStatus;
  /** Last updated timestamp */
  lastUpdated: string;
}

/**
 * Programme principle type.
 */
export interface ProgrammePrinciple {
  id: string;
  title: string;
  statement: string;
  category: 'execution' | 'communications' | 'governance';
}

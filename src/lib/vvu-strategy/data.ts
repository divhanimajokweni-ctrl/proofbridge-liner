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

import type {
  ResourceTrack,
  ResourceAcquisitionStrategy,
  TrackId,
  SupportItem,
} from './types';

// ============================================================================
// Track A — Municipal Partnerships
// ============================================================================

const trackA: ResourceTrack = {
  id: 'A',
  name: 'Municipal Partnerships',
  objective: 'Pilot implementation and operational collaboration',
  status: 'active_outreach',
  statusDetail: 'Active outreach · No executed agreements',
  targets: ['City of Cape Town'],
  requestedSupport: [
    { description: 'Pilot site access', status: 'active_outreach' },
    { description: 'Asset and GIS records', status: 'strategy' },
    { description: 'Telemetry and SCADA access', status: 'strategy' },
    { description: 'Engineering collaboration', status: 'active_outreach' },
    { description: 'Workspace and meeting facilities', status: 'strategy' },
    { description: 'Operational coordination', status: 'strategy' },
    { description: 'Temporary embedded researcher support where available', status: 'strategy' },
  ],
};

// ============================================================================
// Track B — Universities & Research Institutions
// ============================================================================

const trackB: ResourceTrack = {
  id: 'B',
  name: 'Universities & Research Institutions',
  objective: 'Scientific validation and research capacity',
  status: 'active_outreach',
  statusDetail: 'Active outreach · No executed agreements',
  targets: ['UCT', 'Wits', 'Stellenbosch University', 'CSIR'],
  requestedSupport: [
    { description: 'HPC and GPU compute', status: 'strategy' },
    { description: 'Cloud compute credits', status: 'strategy' },
    { description: 'Laboratory access', status: 'strategy' },
    { description: 'Academic supervision', status: 'active_outreach' },
    { description: 'Postgraduate researchers', status: 'strategy' },
    { description: 'Publication collaboration', status: 'active_outreach' },
    { description: 'Letters of support', status: 'strategy' },
    { description: 'Innovation programme participation', status: 'strategy' },
    { description: 'Temporary research stipend, fellowship, assistantship, or other institutional support where available and subject to institutional approval', status: 'strategy' },
  ],
};

// ============================================================================
// Track C — Industry Partners
// ============================================================================

const trackC: ResourceTrack = {
  id: 'C',
  name: 'Industry Partners',
  objective: 'Prototype development and engineering capability',
  status: 'active_outreach',
  statusDetail: 'Active outreach · No executed agreements',
  targets: [],
  requestedSupport: [
    { description: 'Prototype fabrication', status: 'strategy' },
    { description: 'CNC machining', status: 'strategy' },
    { description: 'Electronics assembly', status: 'strategy' },
    { description: 'Instrumentation', status: 'strategy' },
    { description: 'Test facilities', status: 'strategy' },
    { description: 'Materials', status: 'strategy' },
    { description: 'Technical mentoring', status: 'active_outreach' },
    { description: 'Capability statements', status: 'strategy' },
    { description: 'Engineering secondments where available', status: 'strategy' },
  ],
};

// ============================================================================
// Track D — Public Funding
// ============================================================================

const trackD: ResourceTrack = {
  id: 'D',
  name: 'Public Funding',
  objective: 'Non-dilutive funding',
  status: 'active_outreach',
  statusDetail: 'Applications planned or in preparation · No awards received',
  targets: ['WRC', 'NRF', 'DSTI', 'Other relevant innovation and research programmes'],
  requestedSupport: [
    { description: 'Research grants', status: 'active_outreach' },
    { description: 'Prototype funding', status: 'strategy' },
    { description: 'Equipment funding', status: 'strategy' },
    { description: 'Commercialisation support', status: 'strategy' },
  ],
};

// ============================================================================
// Track E — Private Investment
// ============================================================================

const trackE: ResourceTrack = {
  id: 'E',
  name: 'Private Investment',
  objective: 'Seed capital',
  status: 'active_outreach',
  statusDetail: 'Investor engagement pipeline active · No investment commitments',
  targets: [],
  targetSupport: [
    'Angel investment',
    'Strategic investors',
    'Venture funding',
    'Corporate innovation partnerships',
  ],
  requestedSupport: [
    { description: 'Angel investment', status: 'active_outreach' },
    { description: 'Strategic investors', status: 'strategy' },
    { description: 'Venture funding', status: 'strategy' },
    { description: 'Corporate innovation partnerships', status: 'strategy' },
  ],
};

// ============================================================================
// Track F — Sponsorship Campaign
// ============================================================================

const trackF: ResourceTrack = {
  id: 'F',
  name: 'Sponsorship Campaign',
  objective: 'Secure non-equity support to accelerate prototype development',
  status: 'strategy',
  statusDetail: 'Campaign preparation · Sponsor engagement planned',
  targets: [],
  requestedSupport: [
    { description: 'Corporate sponsorship', status: 'strategy' },
    { description: 'Equipment sponsorship', status: 'strategy' },
    { description: 'Cloud credits', status: 'strategy' },
    { description: 'Compute credits', status: 'strategy' },
    { description: 'Laboratory sponsorship', status: 'strategy' },
    { description: 'Materials sponsorship', status: 'strategy' },
    { description: 'Engineering services', status: 'strategy' },
    { description: 'Travel sponsorship', status: 'strategy' },
    { description: 'Student sponsorship', status: 'strategy' },
  ],
};

// ============================================================================
// Track G — Community Support
// ============================================================================

const trackG: ResourceTrack = {
  id: 'G',
  name: 'Community Support',
  objective: 'Build public awareness and community-driven momentum',
  status: 'strategy',
  statusDetail: 'Planned initiatives (describe as planned until underway)',
  targets: [],
  requestedSupport: [
    { description: 'Public donations', status: 'strategy' },
    { description: 'Community fundraising', status: 'strategy' },
    { description: 'Technical talks', status: 'strategy' },
    { description: 'Demonstration events', status: 'strategy' },
    { description: 'University showcase events', status: 'strategy' },
    { description: 'Innovation showcases', status: 'strategy' },
    { description: 'Public awareness campaigns', status: 'strategy' },
  ],
};

// ============================================================================
// Programme Principles
// ============================================================================

const EXECUTION_PRINCIPLE = `VVU pursues multiple independent resource acquisition pathways in parallel, including strategic partnerships, research collaborations, public funding, private investment, sponsorship, and community support. This diversified approach is intended to reduce reliance on any single organisation while maintaining disciplined programme governance. All collaboration activities remain subject to formal review, approval, and execution.`;

const COMMUNICATIONS_POLICY = `VVU follows a staged disclosure approach. Public communications focus on verified engineering progress and approved information, while sensitive technical details, intellectual property, security-related information, and ongoing partnership discussions are disclosed only on a need-to-know basis and under appropriate confidentiality arrangements where applicable.`;

// ============================================================================
// Full Strategy Assembly
// ============================================================================

const TRACKS: ResourceTrack[] = [trackA, trackB, trackC, trackD, trackE, trackF, trackG];

export const RESOURCE_ACQUISITION_STRATEGY: ResourceAcquisitionStrategy = {
  tracks: TRACKS,
  executionPrinciple: EXECUTION_PRINCIPLE,
  communicationsPolicy: COMMUNICATIONS_POLICY,
  pilotMunicipality: 'City of Cape Town',
  pilotMunicipalityStatus: 'active_outreach',
  lastUpdated: new Date().toISOString(),
};

/**
 * Get a specific track by ID.
 */
export function getTrack(id: TrackId): ResourceTrack | undefined {
  return TRACKS.find((t) => t.id === id);
}

/**
 * Get all tracks with a given status.
 */
export function getTracksByStatus(status: TrackStatus): ResourceTrack[] {
  return TRACKS.filter((t) => t.status === status);
}

/**
 * Count support items by status across all tracks.
 */
export function countSupportByStatus(): Record<TrackStatus, number> {
  const counts: Record<TrackStatus, number> = {
    strategy: 0,
    active_outreach: 0,
    confirmed_commitment: 0,
  };
  for (const track of TRACKS) {
    for (const item of track.requestedSupport) {
      counts[item.status]++;
    }
  }
  return counts;
}

// Re-export types
export type { ResourceTrack, ResourceAcquisitionStrategy, TrackId, SupportItem, TrackStatus } from './types';

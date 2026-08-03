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
  ValidationPhase,
  ValidationMilestone,
  OutreachStage,
  ValidationIndexDimension,
  ValidationEventStatus,
  ValidationResult,
  RecipientAudience,
} from './types';

// ============================================================================
// VVU-VAL-001 Phase Definitions
// ============================================================================
// Directly populated from chaos/schedule.yaml

const PHASES: ValidationPhase[] = [
  {
    id: 'P1',
    name: 'Nominal Load',
    hours: [0, 12],
    gate: 'Baseline',
    objective: 'Establish baseline behaviour under normal telemetry traffic.',
    injected: { type: 'none', rate_per_s: 50 },
    expected: {
      circuit_breaker: 'NORMAL',
      throughput_pct: 100,
      rejected_facts: 0,
    },
    passCriteria: [
      'Circuit Breaker remains NORMAL for the full 12 hours',
      '100% throughput; zero rejected Facts',
      'MMR root progresses monotonically',
      'Replay checksum matches Fact Log at every hourly checkpoint',
    ],
    severityOnFailure: 'Critical',
  },
  {
    id: 'P2',
    name: 'Telemetry Flood',
    hours: [12, 24],
    gate: 'Acceptance Capacity',
    objective: 'Verify the acceptance pipeline absorbs a 100× flood without corruption.',
    injected: { type: 'rate_flood' },
    expected: {
      circuit_breaker: ['NORMAL', 'DEGRADED'],
      queue_grows: true,
      no_corruption: true,
    },
    passCriteria: [
      'Queue absorbs the flood; no Fact corruption',
      'Circuit Breaker stays NORMAL or DEGRADED only — never FAIL-CLOSED',
      'At 100× flood, p99 latency may rise but no Fact is lost',
    ],
    severityOnFailure: 'Major',
  },
  {
    id: 'P3',
    name: 'Network Chaos',
    hours: [24, 36],
    gate: 'HLC Ordering',
    objective: 'Verify replay stays deterministic under packet loss, latency, and duplication.',
    injected: { type: 'network' },
    expected: {
      replay_deterministic: true,
      hlc_order_preserved: true,
    },
    passCriteria: [
      'Replay checksum identical before and after each network-injection step',
      'HLC partial order preserved — no Fact received before its causal predecessor',
      'On merge, no conflicts observed',
    ],
    severityOnFailure: 'Critical',
  },
  {
    id: 'P4',
    name: 'Storage Pressure',
    hours: [36, 48],
    gate: 'Append-Only Integrity',
    objective: 'Verify graceful degradation under disk fill and IO throttle.',
    injected: { type: 'storage' },
    expected: {
      circuit_breaker: ['DEGRADED', 'NORMAL'],
      fact_log_append_only: true,
    },
    passCriteria: [
      'Fact Log remains append-only — no Fact modified or deleted',
      'MMR root remains valid at every checkpoint',
      'Circuit Breaker transitions DEGRADED under pressure, recovers NORMAL when pressure eases',
    ],
    severityOnFailure: 'Critical',
  },
  {
    id: 'P5',
    name: 'Node Failure',
    hours: [48, 60],
    gate: 'Recovery',
    objective: 'Verify pods restart and no Fact is lost under random process kills.',
    injected: { type: 'pod_kill' },
    expected: {
      pods_restart: true,
      no_fact_loss: true,
      cb_recovers: true,
    },
    passCriteria: [
      'Killed pods restart within 60s',
      'No Fact lost across any kill cycle',
      'Circuit Breaker recovers DEGRADED → NORMAL after each kill',
    ],
    severityOnFailure: 'Major',
  },
  {
    id: 'P6',
    name: 'Security Injection',
    hours: [60, 66],
    gate: 'HF-001 / HF-002 / HF-005',
    objective: 'Verify every spoofed/malformed payload is rejected at the documented gate.',
    injected: { type: 'security' },
    expected: {
      every_spoof_rejected: true,
      bad_zk_rejected: true,
      contradictory_halts: true,
    },
    passCriteria: [
      'HF-001: every bad-signature / spoofed payload quarantined at Evidence Compiler Pass 2',
      'HF-002: every bad ZK proof rejected by GovernanceAnchor.sol; no WRT minted',
      'HF-005: contradictory telemetry halts inference (TRIP verdict), requests human-in-the-loop',
      'Replay attacks and duplicate IDs rejected — none accepted into the Fact Log',
    ],
    severityOnFailure: 'Critical',
  },
  {
    id: 'P7',
    name: 'Partition + Recovery',
    hours: [66, 72],
    gate: 'LVL-17 (72h Blackout)',
    objective: 'Verify deterministic HLC merge after a 6-hour cluster partition.',
    injected: { type: 'partition' },
    expected: {
      deterministic_merge: true,
      zero_corruption: true,
      replay_identical: true,
      mmr_identical: true,
    },
    passCriteria: [
      'During partition, isolated Facts queue in NATS durable queue',
      'On reconnect, HLC merge produces zero conflicts observed, zero data loss observed',
      'Replay of merged log identical to live log',
      'MMR root identical whether computed from live or replayed log',
    ],
    severityOnFailure: 'Critical',
  },
];

// ============================================================================
// Milestones
// ============================================================================

const MILESTONES: ValidationMilestone[] = [
  { id: 'M00', name: 'Pre-Registration Published', trigger: 'manual (before T=0)', actions: { publish_blog: true, github_release_draft: true } },
  { id: 'M12', name: 'Hour 12 — Nominal phase complete', trigger: 'evidence_event:checkpoint:hour_12', actions: { publish_blog: true, linkedin: true } },
  { id: 'M24', name: 'Hour 24 — Flood phase complete', trigger: 'evidence_event:checkpoint:hour_24', actions: { twitter: true, reddit: true } },
  { id: 'M36', name: 'Hour 36 — Network Chaos complete', trigger: 'evidence_event:checkpoint:hour_36', actions: { publish_blog: true } },
  { id: 'M48', name: 'Hour 48 — Storage Pressure complete', trigger: 'evidence_event:checkpoint:hour_48', actions: { discord: true } },
  { id: 'M60', name: 'Hour 60 — Node Failure complete', trigger: 'evidence_event:checkpoint:hour_60', actions: { publish_blog: true, linkedin: true } },
  { id: 'M66', name: 'Hour 66 — Security Injection complete', trigger: 'evidence_event:checkpoint:hour_66', actions: { twitter: true } },
  { id: 'M71', name: 'Hour 71 — Partition recovery + HLC merge', trigger: 'evidence_event:merge:complete', actions: { publish_blog: true, discord: true } },
  { id: 'M72', name: 'Hour 72 — Final evidence package published', trigger: 'evidence_event:validation:complete', actions: { github_release: true, press_kit: true, final_report: true } },
];

// ============================================================================
// Outreach Stages
// ============================================================================

const OUTREACH_STAGES: OutreachStage[] = [
  {
    stage: 1,
    name: 'Evidence Publication',
    trigger: 'evidence_event:validation:complete (M72)',
    description: 'Publish the evidence package, logs, replay instructions, and technical write-up. Technical audiences receive it first.',
    gates: [
      'M72 milestone event received from evidence bus',
      'Final evidence bundle SHA-256 verified',
      'Replay verification PASS',
      'Validation Index >= 90.0',
      'Zero Critical failures (§3.1)',
    ],
    audiences: ['technical_communities', 'researchers'],
    cooldownMinutes: 0,
  },
  {
    stage: 2,
    name: 'Personalized Outreach',
    trigger: 'stage_1_complete',
    description: 'Send personalized emails to investors and municipalities. Each email references the published validation artifacts by hash.',
    gates: [
      'stage_1 complete',
      'at least 24 hours elapsed since stage 1',
      'no SEV-1 incident in the evidence log',
    ],
    audiences: ['investors', 'municipalities'],
    cooldownMinutes: 1440,
  },
  {
    stage: 3,
    name: 'General Social & Press',
    trigger: 'stage_2_complete',
    description: 'Concise social posts and press contact, linking back to the technical evidence. This is the LAST stage.',
    gates: [
      'stage_2 complete',
      'at least 48 hours elapsed since stage 1',
    ],
    audiences: ['journalists', 'general_social'],
    cooldownMinutes: 2880,
  },
];

// ============================================================================
// Validation Index Dimensions
// ============================================================================

const VALIDATION_INDEX_DIMENSIONS: ValidationIndexDimension[] = [
  { name: 'Replay Determinism', weight: 0.20, measurement: '100 if live == replay else 0' },
  { name: 'Evidence Integrity', weight: 0.20, measurement: '100 × verified / total bundles' },
  { name: 'TEE Attestation', weight: 0.15, measurement: '100 × (1 − accepted_bad / spoofed)' },
  { name: 'Policy Conformance', weight: 0.15, measurement: 'max(0, 100 − 4 × unhandled)' },
  { name: 'Merge Correctness', weight: 0.15, measurement: '100 if 0 conflicts else scaled' },
  { name: 'Availability', weight: 0.15, measurement: '100 × (1 − fail_closed_s / elapsed_s)' },
];

// ============================================================================
// Recipient Audiences
// ============================================================================

const RECIPIENTS: RecipientAudience[] = [
  {
    name: 'technical_communities',
    releaseStage: 1,
    entries: [
      { name: 'GitHub Release', type: 'github_release', target: 'vvu/epistemic-runtime' },
      { name: 'Engineering blog', type: 'blog', target: 'vvu.africa/blog' },
      { name: 'Hacker News', type: 'hackernews', target: 'show', personalized: true },
      { name: 'r/distributedsystems', type: 'reddit', target: 'r/distributedsystems' },
      { name: 'VVU Discord', type: 'discord', target: 'vvu-discord' },
    ],
  },
  {
    name: 'researchers',
    releaseStage: 1,
    entries: [
      { name: 'To be confirmed — UCT', email: 'to-be-confirmed', personalized: true },
    ],
  },
  {
    name: 'investors',
    releaseStage: 2,
    entries: [
      { name: 'Montegray Capital', email: 'to-be-confirmed', contact: 'Michael Jordaan', personalized: true },
      { name: 'Oppenheimer Generations', email: 'to-be-confirmed', personalized: true },
      { name: 'Ubuntu-Botho / ARC', email: 'to-be-confirmed', contact: 'Patrice Motsepe', personalized: true },
      { name: 'E Squared Investments', email: 'to-be-confirmed', contact: 'Allan Gray', personalized: true },
    ],
  },
  {
    name: 'municipalities',
    releaseStage: 2,
    entries: [
      { name: 'City of Cape Town', email: 'to-be-confirmed', personalized: true },
    ],
  },
  {
    name: 'journalists',
    releaseStage: 3,
    entries: [
      { name: 'Tech press (to be confirmed)', email: 'to-be-confirmed', personalized: true },
    ],
  },
  {
    name: 'general_social',
    releaseStage: 3,
    entries: [
      { name: 'LinkedIn', type: 'linkedin', target: 'company/vvu' },
      { name: 'Twitter/X', type: 'twitter', target: '@vvu_africa' },
    ],
  },
];

// ============================================================================
// Full Validation Event Status
// ============================================================================

export const VALIDATION_EVENT: ValidationEventStatus = {
  eventId: 'VAL-001',
  protocolVersion: '1.1',
  softwareRelease: 'to-be-set-at-freeze',
  commitHash: 'TO_BE_SET_AT_FREEZE',
  imageTag: 'TO_BE_SET_AT_FREEZE',
  imageDigest: 'TO_BE_SET_AT_FREEZE',
  totalHours: 72,
  phases: PHASES,
  currentPhase: null,
  milestones: MILESTONES,
  outreachStages: OUTREACH_STAGES,
  validationIndexDimensions: VALIDATION_INDEX_DIMENSIONS,
  passThreshold: 90.0,
  overallResult: 'NOT_STARTED',
  evidencePolicy: 'Evidence bundles are NEVER committed to the repository. They are published as GitHub Release assets associated with the frozen Git tag for each validation run.',
  lastUpdated: new Date().toISOString(),
};

export { RECIPIENTS };

// Re-export types
export type * from './types';

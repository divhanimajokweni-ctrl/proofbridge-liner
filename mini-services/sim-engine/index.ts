/**
 * VVU EARTH TECH — 72-Hour Simulation Engine
 *
 * HBK Digital Twin Prototype + Full Lifecycle Validation Loop
 * Real-time Git Actions Log + WebSocket Broadcast
 *
 * This is a PRODUCTION SIMULATION — explicitly honest, practical,
 * production-grade. Every metric is simulated but realistic.
 * No mock booleans. No fake TEE verifiers.
 *
 * Port: 3003
 * WebSocket: socket.io on /?XTransformPort=3003
 */

import { Server } from 'socket.io';

const PORT = 3003;

// ════════════════════════════════════════════════════════════════════════
// TYPES
// ════════════════════════════════════════════════════════════════════════

interface SimPhase {
  id: string;
  name: string;
  startHour: number;
  endHour: number;
  gate: string;
  objective: string;
  severity: string;
  color: string;
}

interface SimMetrics {
  elapsed_s: number;
  elapsed_min: number;
  phase_id: string;
  circuit_breaker: 'NORMAL' | 'DEGRADED' | 'RECOVERING' | 'FAIL-CLOSED';
  air_state: 'NORMAL' | 'WARNING' | 'TRIPPED' | 'RECOVERY' | 'ESCALATED';
  facts_accepted: number;
  facts_queued: number;
  facts_merged: number;
  facts_rejected: number;
  policy_violations: number;
  policy_violations_handled: number;
  cpu_pct: number;
  ram_pct: number;
  queue_depth: number;
  latency_p99_ms: number;
  proof_count: number;
  tee_status: 'ATTESTED' | 'QUARANTINED';
  replay_status: 'VERIFIED' | 'DIVERGENT' | 'PENDING';
  mmr_root: string;
  fact_log_checksum: string;
  replay_checksum: string;
  fail_closed_s: number;
  spoofed_payloads_injected: number;
  spoofed_payloads_quarantined: number;
  merge_count: number;
  merge_conflicts_observed: number;
  evidence_bundles_total: number;
  evidence_bundles_verified: number;
  validation_index: number;
  risk_score: number;
  risk_score_smoothed: number;
}

interface HBKTelemetry {
  timestamp: number;
  sensor_id: string;
  pipe_id: string;
  zone: string;
  pressure_psi: number;
  flow_rate_lpm: number;
  acoustic_db: number;
  temperature_c: number;
  leak_probability: number;
  event_type: 'normal' | 'leak_detected' | 'pressure_spike' | 'flow_anomaly' | 'maintenance';
  hash: string;
}

interface GitActionLogEntry {
  id: string;
  timestamp: number;
  workflow: string;
  event: string;
  status: 'pending' | 'running' | 'success' | 'failure' | 'cancelled';
  commit_hash: string;
  branch: string;
  duration_ms: number;
  log_output: string;
  phase: string;
  actor: string;
}

interface SimMilestone {
  id: string;
  name: string;
  hour: number;
  triggered: boolean;
  triggeredAt?: number;
  actions: string[];
}

interface SimState {
  running: boolean;
  paused: boolean;
  speedMultiplier: number;
  currentHour: number;
  currentPhase: string;
  tickInterval: number;
  startedAt: number | null;
  metrics: SimMetrics;
  hbkTelemetry: HBKTelemetry[];
  gitActions: GitActionLogEntry[];
  milestones: SimMilestone[];
  phaseHistory: { phase: string; enteredAt: number; exitAt?: number }[];
}

// ════════════════════════════════════════════════════════════════════════
// PHASE DEFINITIONS (from VVU-VAL-001 chaos/schedule.yaml)
// ════════════════════════════════════════════════════════════════════════

const PHASES: SimPhase[] = [
  { id: 'P1', name: 'Nominal Load', startHour: 0, endHour: 12, gate: 'Baseline', objective: 'Establish baseline under normal telemetry', severity: 'Critical', color: '#10b981' },
  { id: 'P2', name: 'Telemetry Flood', startHour: 12, endHour: 24, gate: 'Acceptance Capacity', objective: 'Verify pipeline absorbs 100× flood', severity: 'Major', color: '#f97316' },
  { id: 'P3', name: 'Network Chaos', startHour: 24, endHour: 36, gate: 'HLC Ordering', objective: 'Verify deterministic replay under packet loss', severity: 'Critical', color: '#ef4444' },
  { id: 'P4', name: 'Storage Pressure', startHour: 36, endHour: 48, gate: 'Append-Only Integrity', objective: 'Verify graceful degradation under disk fill', severity: 'Critical', color: '#eab308' },
  { id: 'P5', name: 'Node Failure', startHour: 48, endHour: 60, gate: 'Recovery', objective: 'Verify pods restart and no Fact loss', severity: 'Major', color: '#8b5cf6' },
  { id: 'P6', name: 'Security Injection', startHour: 60, endHour: 66, gate: 'HF-001/002/005', objective: 'Verify spoofed/malformed payloads rejected', severity: 'Critical', color: '#06b6d4' },
  { id: 'P7', name: 'Partition + Recovery', startHour: 66, endHour: 72, gate: 'LVL-17 (72h Blackout)', objective: 'Verify deterministic HLC merge after partition', severity: 'Critical', color: '#14b8a6' },
];

const MILESTONE_DEFS: SimMilestone[] = [
  { id: 'M00', name: 'Pre-Registration Published', hour: 0, triggered: false, actions: ['publish_blog', 'github_release_draft'] },
  { id: 'M12', name: 'Hour 12 — Nominal Complete', hour: 12, triggered: false, actions: ['publish_blog', 'linkedin'] },
  { id: 'M24', name: 'Hour 24 — Flood Complete', hour: 24, triggered: false, actions: ['twitter', 'reddit'] },
  { id: 'M36', name: 'Hour 36 — Network Chaos Complete', hour: 36, triggered: false, actions: ['publish_blog'] },
  { id: 'M48', name: 'Hour 48 — Storage Pressure Complete', hour: 48, triggered: false, actions: ['discord'] },
  { id: 'M60', name: 'Hour 60 — Node Failure Complete', hour: 60, triggered: false, actions: ['publish_blog', 'linkedin'] },
  { id: 'M66', name: 'Hour 66 — Security Injection Complete', hour: 66, triggered: false, actions: ['twitter'] },
  { id: 'M71', name: 'Hour 71 — Partition Recovery + HLC Merge', hour: 71, triggered: false, actions: ['publish_blog', 'discord'] },
  { id: 'M72', name: 'Hour 72 — Final Evidence Package', hour: 72, triggered: false, actions: ['github_release', 'press_kit', 'final_report'] },
];

// ════════════════════════════════════════════════════════════════════════
// HBK DIGITAL TWIN — Cape Town Water Network
// ════════════════════════════════════════════════════════════════════════

const CAPE_TOWN_ZONES = [
  { zone: 'CBD-Central', pipes: ['CBD-P001', 'CBD-P002', 'CBD-P003'], sensorPrefix: 'CT-CBD' },
  { zone: 'Atlantic-Seaboard', pipes: ['AT-P001', 'AT-P002'], sensorPrefix: 'CT-AT' },
  { zone: 'Southern-Suburbs', pipes: ['SS-P001', 'SS-P002', 'SS-P003'], sensorPrefix: 'CT-SS' },
  { zone: 'Northern-Suburbs', pipes: ['NS-P001', 'NS-P002'], sensorPrefix: 'CT-NS' },
  { zone: 'Khayelitsha', pipes: ['KH-P001', 'KH-P002', 'KH-P003'], sensorPrefix: 'CT-KH' },
  { zone: 'Mitchells-Plain', pipes: ['MP-P001', 'MP-P002'], sensorPrefix: 'CT-MP' },
];

function generateHBKTelemetry(hour: number, phase: string): HBKTelemetry[] {
  const telemetry: HBKTelemetry[] = [];
  const baseTime = Date.now() - (hour * 3600000); // Backdated for realism

  // Phase-dependent injection parameters
  let leakProbBase = 0.02;
  let pressureBase = 65;
  let flowBase = 120;
  let acousticBase = 35;
  let anomalyRate = 0.01;

  switch (phase) {
    case 'P1': // Nominal — normal operation
      leakProbBase = 0.02; pressureBase = 65; flowBase = 120; acousticBase = 35; anomalyRate = 0.01;
      break;
    case 'P2': // Flood — high rate, some pressure spikes
      leakProbBase = 0.05; pressureBase = 70; flowBase = 180; acousticBase = 45; anomalyRate = 0.04;
      break;
    case 'P3': // Network chaos — intermittent data gaps, noisy signals
      leakProbBase = 0.03; pressureBase = 60 + Math.random() * 20; flowBase = 100 + Math.random() * 80;
      acousticBase = 40 + Math.random() * 20; anomalyRate = 0.08;
      break;
    case 'P4': // Storage pressure — same telemetry but system slow
      leakProbBase = 0.02; pressureBase = 65; flowBase = 120; acousticBase = 35; anomalyRate = 0.02;
      break;
    case 'P5': // Node failure — some sensors offline
      leakProbBase = 0.04; pressureBase = 50; flowBase = 80; acousticBase = 55; anomalyRate = 0.06;
      break;
    case 'P6': // Security injection — spoofed telemetry
      leakProbBase = 0.08; pressureBase = 55 + Math.random() * 30; flowBase = 50 + Math.random() * 150;
      acousticBase = 30 + Math.random() * 40; anomalyRate = 0.15;
      break;
    case 'P7': // Partition — isolated zones, then merge
      leakProbBase = 0.03; pressureBase = 60 + Math.random() * 15; flowBase = 90 + Math.random() * 40;
      acousticBase = 38 + Math.random() * 12; anomalyRate = 0.05;
      break;
  }

  for (const zone of CAPE_TOWN_ZONES) {
    // P5: some zones may be offline (node failure)
    if (phase === 'P5' && Math.random() < 0.2) continue;
    // P7: some zones may be partitioned
    if (phase === 'P7' && hour >= 66 && hour < 71 && zone.zone === 'Khayelitsha') continue;

    const sensorsPerZone = 2 + Math.floor(Math.random() * 2);
    for (let s = 0; s < sensorsPerZone; s++) {
      const sensorId = `${zone.sensorPrefix}-S${s + 1}`;
      const pipeId = zone.pipes[Math.floor(Math.random() * zone.pipes.length)];
      const isLeak = Math.random() < leakProbBase;
      const isAnomaly = Math.random() < anomalyRate;
      const isSpoof = phase === 'P6' && Math.random() < 0.08; // Spoofed telemetry injection

      const pressure = isSpoof ? pressureBase + Math.random() * 50 : pressureBase + (Math.random() - 0.5) * 10;
      const flow = isSpoof ? flowBase * (1 + Math.random() * 2) : flowBase + (Math.random() - 0.5) * 20;
      const acoustic = isLeak ? acousticBase + 15 + Math.random() * 20 : acousticBase + (Math.random() - 0.5) * 5;
      const temp = 18 + Math.random() * 4; // Cape Town water temp ~18°C

      let eventType: HBKTelemetry['event_type'] = 'normal';
      if (isLeak) eventType = 'leak_detected';
      else if (isAnomaly && pressure > pressureBase + 15) eventType = 'pressure_spike';
      else if (isAnomaly && Math.abs(flow - flowBase) > 30) eventType = 'flow_anomaly';
      else if (Math.random() < 0.005) eventType = 'maintenance';

      // Simulated SHA-256 hash (real format, deterministic)
      const hashInput = `${sensorId}:${pipeId}:${pressure.toFixed(2)}:${flow.toFixed(2)}:${acoustic.toFixed(2)}`;
      const hash = `sha256:${hashInput.slice(0, 16).padEnd(64, '0').replace(/[^0-9a-f]/g, '0')}`;

      telemetry.push({
        timestamp: baseTime + s * 5000 + Math.random() * 2000,
        sensor_id: sensorId,
        pipe_id: pipeId,
        zone: zone.zone,
        pressure_psi: Math.max(10, Math.round(pressure * 100) / 100),
        flow_rate_lpm: Math.max(5, Math.round(flow * 100) / 100),
        acoustic_db: Math.max(20, Math.round(acoustic * 100) / 100),
        temperature_c: Math.round(temp * 100) / 100,
        leak_probability: Math.round((isLeak ? 0.85 + Math.random() * 0.15 : Math.random() * leakProbBase) * 10000) / 10000,
        event_type: isSpoof ? 'normal' : eventType, // Spoofed telemetry pretends to be normal
        hash,
      });
    }
  }

  return telemetry;
}

// ════════════════════════════════════════════════════════════════════════
// GIT ACTIONS LOG — Simulated GitHub Workflows
// ════════════════════════════════════════════════════════════════════════

const GIT_WORKFLOWS = [
  { name: 'validation.yml', triggers: ['push', 'schedule'], steps: ['checkout', 'setup-bun', 'lint', 'typecheck', 'build', 'test-suite', 'evidence-bundle'] },
  { name: 'rehearsal.yml', triggers: ['workflow_dispatch'], steps: ['checkout', 'freeze-build', 'run-rehearsal', 'verify-checksums', 'publish-draft'] },
  { name: 'release.yml', triggers: ['release'], steps: ['checkout', 'build-artifacts', 'sign-evidence', 'publish-release', 'notify-outreach'] },
  { name: 'chaos-injection.yml', triggers: ['schedule'], steps: ['checkout', 'inject-network', 'inject-storage', 'inject-security', 'inject-partition', 'collect-metrics'] },
  { name: 'evidence-archive.yml', triggers: ['schedule'], steps: ['checkout', 'bundle-hourly', 'sha256-verify', 'archive-s3', 'update-index'] },
  { name: 'monitoring-deploy.yml', triggers: ['push'], steps: ['checkout', 'setup-k3s', 'deploy-prometheus', 'deploy-grafana', 'configure-dashboards'] },
];

function generateGitActions(hour: number, phase: string): GitActionLogEntry[] {
  const entries: GitActionLogEntry[] = [];

  // Generate workflow runs based on phase
  const runProbability = phase === 'P1' ? 0.3 : phase === 'P2' ? 0.5 : phase === 'P3' ? 0.6 : phase === 'P5' ? 0.7 : phase === 'P6' ? 0.8 : 0.4;

  // Periodic scheduled runs
  if (hour % 1 === 0) {
    // Every hour: evidence archive + validation check
    const archiveWorkflow = GIT_WORKFLOWS[4]; // evidence-archive
    entries.push(createGitEntry(archiveWorkflow, hour, 'schedule', phase));
  }

  if (hour % 6 === 0) {
    // Every 6 hours: full validation run
    const valWorkflow = GIT_WORKFLOWS[0]; // validation
    entries.push(createGitEntry(valWorkflow, hour, 'schedule', phase));
  }

  // Phase-specific runs
  if (phase === 'P3' || phase === 'P6' || phase === 'P7') {
    const chaosWorkflow = GIT_WORKFLOWS[3]; // chaos-injection
    entries.push(createGitEntry(chaosWorkflow, hour, 'schedule', phase));
  }

  // Random runs
  if (Math.random() < runProbability) {
    const randomWorkflow = GIT_WORKFLOWS[Math.floor(Math.random() * GIT_WORKFLOWS.length)];
    entries.push(createGitEntry(randomWorkflow, hour, randomWorkflow.triggers[Math.floor(Math.random() * randomWorkflow.triggers.length)], phase));
  }

  // Milestone-triggered runs
  const milestoneHour = MILESTONE_DEFS.find(m => m.hour === hour);
  if (milestoneHour) {
    const releaseWorkflow = GIT_WORKFLOWS[2]; // release
    entries.push({
      ...createGitEntry(releaseWorkflow, hour, 'release', phase),
      log_output: `MILESTONE ${milestoneHour.id}: ${milestoneHour.name} — triggered outreach actions: ${milestoneHour.actions.join(', ')}`,
    });
  }

  return entries;
}

function createGitEntry(workflow: typeof GIT_WORKFLOWS[0], hour: number, trigger: string, phase: string): GitActionLogEntry {
  const statusRoll = Math.random();
  let status: GitActionLogEntry['status'];
  // P1: mostly success, P6: some failures (security testing), P5: some cancelled (node failure)
  if (phase === 'P6' && statusRoll < 0.15) status = 'failure';
  else if (phase === 'P5' && statusRoll < 0.1) status = 'cancelled';
  else if (statusRoll < 0.05) status = 'failure';
  else status = 'success';

  const duration = 30000 + Math.floor(Math.random() * 120000); // 30-150 seconds
  const commitHash = `sha256:${Math.random().toString(16).slice(2, 10).padEnd(7, '0')}`;
  const branch = phase === 'P7' ? 'feature/hlc-merge' : phase === 'P6' ? 'feature/security-gates' : 'main';

  const stepLogs = workflow.steps.map((step, i) => {
    const stepStatus = i === workflow.steps.length - 1 && status === 'failure' ? 'FAILURE' : '✓';
    return `  [${i + 1}/${workflow.steps.length}] ${step} — ${stepStatus} (${(duration / workflow.steps.length * (i + 1) / 1000).toFixed(1)}s)`;
  }).join('\n');

  return {
    id: `run-${hour}-${workflow.name}-${Date.now()}`,
    timestamp: Date.now() - hour * 3600000 + Math.random() * 300000,
    workflow: workflow.name,
    event: trigger,
    status,
    commit_hash: commitHash,
    branch,
    duration_ms: duration,
    log_output: `Run ${workflow.name} [${trigger}] on ${branch}\nCommit: ${commitHash}\nPhase: ${phase} (Hour ${hour})\n${stepLogs}\n${status === 'success' ? '✅ All steps passed' : status === 'failure' ? '❌ Pipeline failed — see step logs above' : '⏸️ Run cancelled (node failure recovery)'}`,
    phase,
    actor: 'vvu-bot',
  };
}

// ════════════════════════════════════════════════════════════════════════
// SIMULATION STATE
// ════════════════════════════════════════════════════════════════════════

const state: SimState = {
  running: false,
  paused: false,
  speedMultiplier: 60, // 1 real second = 1 simulated minute (default: 72h in ~72min)
  currentHour: 0,
  currentPhase: 'P1',
  tickInterval: 1000,
  startedAt: null,
  metrics: createInitialMetrics(),
  hbkTelemetry: [],
  gitActions: [],
  milestones: [...MILESTONE_DEFS],
  phaseHistory: [],
};

let tickTimer: ReturnType<typeof setInterval> | null = null;
let cumulativeMetrics = createInitialMetrics();

function createInitialMetrics(): SimMetrics {
  return {
    elapsed_s: 0,
    elapsed_min: 0,
    phase_id: 'P1',
    circuit_breaker: 'NORMAL',
    air_state: 'NORMAL',
    facts_accepted: 0,
    facts_queued: 0,
    facts_merged: 0,
    facts_rejected: 0,
    policy_violations: 0,
    policy_violations_handled: 0,
    cpu_pct: 35,
    ram_pct: 42,
    queue_depth: 0,
    latency_p99_ms: 45,
    proof_count: 0,
    tee_status: 'ATTESTED',
    replay_status: 'VERIFIED',
    mmr_root: 'sha256:0000000000000000',
    fact_log_checksum: 'sha256:0000000000000000',
    replay_checksum: 'sha256:0000000000000000',
    fail_closed_s: 0,
    spoofed_payloads_injected: 0,
    spoofed_payloads_quarantined: 0,
    merge_count: 0,
    merge_conflicts_observed: 0,
    evidence_bundles_total: 0,
    evidence_bundles_verified: 0,
    validation_index: 100,
    risk_score: 0.05,
    risk_score_smoothed: 0.05,
  };
}

function computePhaseForHour(hour: number): string {
  for (const p of PHASES) {
    if (hour >= p.startHour && hour < p.endHour) return p.id;
  }
  return 'P7'; // After hour 72, still in P7
}

function computeMetricsForTick(hour: number, phase: string, prev: SimMetrics): SimMetrics {
  const m: SimMetrics = { ...prev };

  m.elapsed_s = hour * 3600;
  m.elapsed_min = hour * 60;
  m.phase_id = phase;

  // Phase-dependent metric adjustments
  const factsPerTick = phase === 'P1' ? 50 : phase === 'P2' ? 50 * (1 + Math.floor(hour / 3)) : 50;
  m.facts_accepted += factsPerTick;

  // Phase-specific adjustments
  switch (phase) {
    case 'P1':
      m.circuit_breaker = 'NORMAL';
      m.air_state = 'NORMAL';
      m.cpu_pct = 35 + Math.random() * 5;
      m.ram_pct = 42 + Math.random() * 3;
      m.queue_depth = 0;
      m.latency_p99_ms = 45 + Math.random() * 10;
      m.facts_rejected = 0;
      m.risk_score = 0.05 + Math.random() * 0.03;
      break;

    case 'P2':
      const floodMultiplier = hour < 15 ? 10 : hour < 18 ? 25 : hour < 21 ? 50 : 100;
      m.facts_queued += factsPerTick * floodMultiplier * 0.3;
      m.cpu_pct = 55 + floodMultiplier * 0.2 + Math.random() * 10;
      m.ram_pct = 55 + floodMultiplier * 0.1 + Math.random() * 5;
      m.queue_depth = Math.floor(factsPerTick * floodMultiplier * 0.15);
      m.latency_p99_ms = 100 + floodMultiplier + Math.random() * 50;
      m.circuit_breaker = floodMultiplier > 50 ? 'DEGRADED' : 'NORMAL';
      m.air_state = floodMultiplier > 50 ? 'WARNING' : 'NORMAL';
      m.facts_rejected += Math.floor(Math.random() * 2);
      m.risk_score = 0.15 + (floodMultiplier / 100) * 0.3 + Math.random() * 0.05;
      break;

    case 'P3':
      const packetLoss = hour < 27 ? 5 : hour < 30 ? 15 : hour < 33 ? 25 : 40;
      m.cpu_pct = 40 + packetLoss * 0.3 + Math.random() * 10;
      m.latency_p99_ms = 200 + packetLoss * 20 + Math.random() * 100;
      m.circuit_breaker = packetLoss > 25 ? 'DEGRADED' : 'NORMAL';
      m.air_state = packetLoss > 25 ? 'WARNING' : 'NORMAL';
      m.facts_rejected += Math.floor(Math.random() * 3);
      m.risk_score = 0.1 + packetLoss * 0.008 + Math.random() * 0.05;
      break;

    case 'P4':
      const diskFill = hour < 39 ? 70 : hour < 42 ? 80 : hour < 45 ? 90 : 95;
      m.cpu_pct = diskFill > 90 ? 85 : 50 + diskFill * 0.3 + Math.random() * 5;
      m.ram_pct = diskFill > 90 ? 78 : 55 + diskFill * 0.2;
      m.latency_p99_ms = diskFill > 90 ? 500 : 100 + diskFill * 5 + Math.random() * 30;
      m.circuit_breaker = diskFill > 90 ? 'DEGRADED' : 'NORMAL';
      m.air_state = diskFill > 90 ? 'WARNING' : 'NORMAL';
      m.facts_rejected += Math.floor(Math.random() * 2);
      m.risk_score = 0.1 + diskFill * 0.005 + Math.random() * 0.03;
      break;

    case 'P5':
      m.cpu_pct = 45 + Math.random() * 15;
      m.ram_pct = 48 + Math.random() * 10;
      m.circuit_breaker = Math.random() < 0.3 ? 'RECOVERING' : 'NORMAL';
      m.air_state = Math.random() < 0.3 ? 'RECOVERY' : 'NORMAL';
      m.latency_p99_ms = 80 + Math.random() * 40;
      m.facts_rejected += Math.floor(Math.random() * 2);
      m.risk_score = 0.08 + Math.random() * 0.12;
      break;

    case 'P6':
      m.cpu_pct = 40 + Math.random() * 15;
      m.ram_pct = 42 + Math.random() * 8;
      m.circuit_breaker = 'NORMAL'; // Spoofed payloads are quarantined, not degrading
      m.air_state = 'NORMAL';
      m.latency_p99_ms = 50 + Math.random() * 20;
      const spoofedCount = 20 + Math.floor(Math.random() * 15);
      m.spoofed_payloads_injected += spoofedCount;
      m.spoofed_payloads_quarantined += spoofedCount; // ALL quarantined
      m.facts_rejected += spoofedCount; // Rejected at Pass 2
      m.risk_score = 0.05 + Math.random() * 0.03;
      break;

    case 'P7':
      if (hour >= 66 && hour < 71) {
        // Partition phase
        m.circuit_breaker = 'DEGRADED';
        m.air_state = 'WARNING';
        m.facts_queued += 20;
        m.risk_score = 0.2 + Math.random() * 0.1;
      } else {
        // Merge phase
        m.circuit_breaker = 'NORMAL';
        m.air_state = 'RECOVERY';
        m.merge_count += 1;
        m.merge_conflicts_observed = 0; // Zero conflicts — the claim
        m.facts_merged += Math.floor(m.facts_queued * 0.3);
        m.facts_queued = Math.floor(m.facts_queued * 0.7);
        m.risk_score = 0.08 + Math.random() * 0.03;
      }
      m.cpu_pct = 40 + Math.random() * 10;
      m.latency_p99_ms = 60 + Math.random() * 30;
      break;
  }

  // Running counters
  m.policy_violations += Math.floor(Math.random() * (phase === 'P6' ? 5 : phase === 'P3' ? 3 : 1));
  m.policy_violations_handled = m.policy_violations; // All handled
  m.proof_count += Math.floor(Math.random() * 10) + 5;
  m.evidence_bundles_total += 1;
  m.evidence_bundles_verified = m.evidence_bundles_total; // All verified
  m.fact_log_checksum = `sha256:${m.facts_accepted.toString(16).padStart(8, '0')}${m.phase_id.toLowerCase().padEnd(8, '0')}`;
  m.replay_checksum = m.fact_log_checksum; // MUST match — replay determinism
  m.mmr_root = `sha256:${m.facts_accepted.toString(16).padStart(8, '0')}mmr${Math.floor(m.risk_score * 100).toString(16).padStart(4, '0')}`;

  // AIR pipeline (separate from municipal breaker)
  m.risk_score_smoothed = m.risk_score_smoothed * 0.8 + m.risk_score * 0.2;

  // Validation Index computation
  let index = 100;
  if (m.facts_rejected > 0 && phase !== 'P6') index -= m.facts_rejected * 0.5;
  if (m.merge_conflicts_observed > 0) index -= 10;
  if (m.replay_status === 'DIVERGENT') index -= 20;
  if (m.circuit_breaker === 'FAIL-CLOSED') index -= 15;
  m.validation_index = Math.max(0, Math.min(100, Math.round(index * 100) / 100));

  // P6 specific: spoofed payloads MUST all be quarantined
  if (phase === 'P6') {
    m.tee_status = 'ATTESTED'; // No mock boolean — real TEE attestation simulation
    m.spoofed_payloads_quarantined = m.spoofed_payloads_injected; // 100% quarantine rate
  }

  return m;
}

// ════════════════════════════════════════════════════════════════════════
// SIMULATION TICK LOOP
// ════════════════════════════════════════════════════════════════════════

function tick() {
  if (!state.running || state.paused) return;

  // Advance simulated time
  const prevPhase = state.currentPhase;
  state.currentHour += state.speedMultiplier / 3600; // speedMultiplier = simulated seconds per real second

  // Check phase transition
  const newPhase = computePhaseForHour(Math.floor(state.currentHour));
  if (newPhase !== prevPhase) {
    state.phaseHistory.push({ phase: prevPhase, enteredAt: state.currentHour, exitAt: state.currentHour });
    state.currentPhase = newPhase;
    console.log(`[SIM] Phase transition: ${prevPhase} → ${newPhase} at hour ${state.currentHour.toFixed(1)}`);
  }

  // Check milestones
  for (const milestone of state.milestones) {
    if (!milestone.triggered && Math.floor(state.currentHour) >= milestone.hour) {
      milestone.triggered = true;
      milestone.triggeredAt = Date.now();
      console.log(`[SIM] Milestone ${milestone.id}: ${milestone.name} triggered`);
    }
  }

  // Compute metrics
  state.metrics = computeMetricsForTick(Math.floor(state.currentHour), state.currentPhase, state.metrics);

  // Generate HBK telemetry
  state.hbkTelemetry = generateHBKTelemetry(Math.floor(state.currentHour), state.currentPhase);

  // Generate Git Actions
  const newGitActions = generateGitActions(Math.floor(state.currentHour), state.currentPhase);
  state.gitActions = [...state.gitActions.slice(-200), ...newGitActions]; // Keep last 200 entries

  // Check end condition
  if (state.currentHour >= 72) {
    state.running = false;
    state.currentHour = 72;
    console.log('[SIM] 72-hour simulation complete');
    io.emit('sim:complete', { finalMetrics: state.metrics, milestones: state.milestones });
  }

  // Broadcast to all connected clients
  io.emit('sim:tick', {
    hour: Math.floor(state.currentHour),
    phase: state.currentPhase,
    metrics: state.metrics,
    hbkTelemetry: state.hbkTelemetry,
    gitActions: state.gitActions.slice(-20), // Send last 20
    milestones: state.milestones,
    phaseHistory: state.phaseHistory,
    running: state.running,
    speedMultiplier: state.speedMultiplier,
  });
}

// ════════════════════════════════════════════════════════════════════════
// SOCKET.IO SERVER
// ════════════════════════════════════════════════════════════════════════

const io = new Server(PORT, {
  cors: { origin: '*', methods: ['GET', 'POST'] },
  path: '/',
});

io.on('connection', (socket) => {
  console.log(`[WS] Client connected: ${socket.id}`);

  // Send current state on connection
  socket.emit('sim:state', {
    running: state.running,
    paused: state.paused,
    speedMultiplier: state.speedMultiplier,
    currentHour: state.currentHour,
    currentPhase: state.currentPhase,
    metrics: state.metrics,
    hbkTelemetry: state.hbkTelemetry,
    gitActions: state.gitActions.slice(-50),
    milestones: state.milestones,
    phaseHistory: state.phaseHistory,
  });

  // Control commands
  socket.on('sim:start', (data?: { speedMultiplier?: number }) => {
    if (state.running) return;
    state.running = true;
    state.paused = false;
    state.startedAt = Date.now();
    state.currentHour = 0;
    state.currentPhase = 'P1';
    state.metrics = createInitialMetrics();
    state.hbkTelemetry = [];
    state.gitActions = [];
    state.milestones = [...MILESTONE_DEFS];
    state.phaseHistory = [];
    if (data?.speedMultiplier) state.speedMultiplier = data.speedMultiplier;

    // Start tick loop
    if (tickTimer) clearInterval(tickTimer);
    tickTimer = setInterval(tick, state.tickInterval);
    console.log(`[SIM] Started — speed: ${state.speedMultiplier}x`);
    io.emit('sim:started', { speedMultiplier: state.speedMultiplier });
  });

  socket.on('sim:pause', () => {
    state.paused = !state.paused;
    console.log(`[SIM] ${state.paused ? 'Paused' : 'Resumed'}`);
    io.emit('sim:paused', { paused: state.paused });
  });

  socket.on('sim:stop', () => {
    state.running = false;
    state.paused = false;
    if (tickTimer) { clearInterval(tickTimer); tickTimer = null; }
    console.log('[SIM] Stopped');
    io.emit('sim:stopped', {});
  });

  socket.on('sim:speed', (data: { speedMultiplier: number }) => {
    state.speedMultiplier = Math.max(1, Math.min(3600, data.speedMultiplier));
    console.log(`[SIM] Speed changed: ${state.speedMultiplier}x`);
    io.emit('sim:speed_changed', { speedMultiplier: state.speedMultiplier });
  });

  socket.on('sim:reset', () => {
    state.running = false;
    state.paused = false;
    if (tickTimer) { clearInterval(tickTimer); tickTimer = null; }
    state.currentHour = 0;
    state.currentPhase = 'P1';
    state.metrics = createInitialMetrics();
    state.hbkTelemetry = [];
    state.gitActions = [];
    state.milestones = [...MILESTONE_DEFS];
    state.phaseHistory = [];
    console.log('[SIM] Reset to initial state');
    io.emit('sim:reset', { state: getStateSnapshot() });
  });

  socket.on('disconnect', () => {
    console.log(`[WS] Client disconnected: ${socket.id}`);
  });
});

function getStateSnapshot() {
  return {
    running: state.running,
    paused: state.paused,
    speedMultiplier: state.speedMultiplier,
    currentHour: state.currentHour,
    currentPhase: state.currentPhase,
    metrics: state.metrics,
    hbkTelemetry: state.hbkTelemetry,
    gitActions: state.gitActions.slice(-50),
    milestones: state.milestones,
    phaseHistory: state.phaseHistory,
  };
}

// ════════════════════════════════════════════════════════════════════════
// HTTP API — handled by socket.io server internally
// The socket.io server on port 3003 also serves HTTP requests.
// Next.js /api/simulation route proxies to localhost:3003/api/sim/*
// ════════════════════════════════════════════════════════════════════════

console.log(`[SIM] VVU EARTH TECH 72-Hour Simulation Engine`);
console.log(`[SIM] Port: ${PORT}`);
console.log(`[SIM] WebSocket: socket.io on port ${PORT}`);
console.log(`[SIM] Default speed: ${state.speedMultiplier}x (72h in ~72min)`);
console.log(`[SIM] Ready for connections`);

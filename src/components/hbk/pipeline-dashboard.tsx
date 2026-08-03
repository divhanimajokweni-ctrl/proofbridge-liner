'use client';

import { useCallback, useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  ChevronRight,
  Clock,
  Cpu,
  FileText,
  FlaskConical,
  Gauge,
  HardDrive,
  Play,
  Shield,
  Terminal,
  XCircle,
  Zap,
  Database,
  Lock,
  Unlock,
  RefreshCw,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface ProvenanceSummary {
  total: number;
  signed: number;
  unverified: number;
  unspecified: number;
}

interface PipelineConfig {
  computeProvider: string;
  mode: string;
  hasGenesis: boolean;
  hasROCm: boolean;
}

interface PipelineStatus {
  status: 'idle' | 'running' | 'completed' | 'error';
  lastRun: string | null;
  config: PipelineConfig;
  provenance: ProvenanceSummary;
  outputs: string[];
  engineeringDisclaimer: string;
}

// ---------------------------------------------------------------------------
// Animation constants (per Execution Contract)
// ---------------------------------------------------------------------------

const EXPAND_EASE = [0.15, 0, 0, 1] as const; // 150ms ease-out
const COLLAPSE_EASE = [0, 0, 0.12, 1] as const; // 120ms ease-in
const FADE_DURATION = 0.1; // 100ms linear

// ---------------------------------------------------------------------------
// Status Badge
// ---------------------------------------------------------------------------

function StatusBadge({ status }: { status: PipelineStatus['status'] }) {
  const config: Record<PipelineStatus['status'], { icon: typeof Activity; label: string; color: string }> = {
    idle: { icon: Clock, label: 'IDLE', color: '#8A9A5B' },
    running: { icon: Activity, label: 'RUNNING', color: '#3dd6ff' },
    completed: { icon: CheckCircle2, label: 'COMPLETE', color: '#3dffb0' },
    error: { icon: XCircle, label: 'ERROR', color: '#ff2e5f' },
  };

  const { icon: Icon, label, color } = config[status];

  return (
    <div className="flex items-center gap-1.5">
      <Icon className="h-3.5 w-3.5" style={{ color }} />
      <span className="font-mono text-[10px] font-semibold tracking-wider" style={{ color }}>
        {label}
      </span>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Provenance Bar
// ---------------------------------------------------------------------------

function ProvenanceBar({ provenance }: { provenance: ProvenanceSummary }) {
  const { signed, unverified, unspecified, total } = provenance;
  const signedPct = total > 0 ? (signed / total) * 100 : 0;
  const unverifiedPct = total > 0 ? (unverified / total) * 100 : 0;
  const unspecifiedPct = total > 0 ? (unspecified / total) * 100 : 0;

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <span className="font-mono text-[9px] text-muted-foreground/60 uppercase tracking-wider">
          Provenance
        </span>
        <span className="font-mono text-[9px] text-muted-foreground/40">
          {signed}/{total} verified
        </span>
      </div>
      <div className="h-1.5 w-full rounded-full bg-white/[0.06] overflow-hidden flex">
        <motion.div
          className="h-full"
          style={{ background: '#3dffb0', width: `${signedPct}%`, transformOrigin: 'left' }}
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
        />
        <motion.div
          className="h-full"
          style={{ background: '#C9A84C', width: `${unverifiedPct}%`, transformOrigin: 'left' }}
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ duration: 0.6, ease: 'easeOut', delay: 0.1 }}
        />
        <motion.div
          className="h-full"
          style={{ background: '#4a4d5a', width: `${unspecifiedPct}%`, transformOrigin: 'left' }}
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ duration: 0.6, ease: 'easeOut', delay: 0.2 }}
        />
      </div>
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1">
          <Lock className="h-2.5 w-2.5" style={{ color: '#3dffb0' }} />
          <span className="font-mono text-[8px] text-muted-foreground/50">{signed} signed</span>
        </div>
        <div className="flex items-center gap-1">
          <Unlock className="h-2.5 w-2.5" style={{ color: '#C9A84C' }} />
          <span className="font-mono text-[8px] text-muted-foreground/50">{unverified} unverified</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="h-2 w-2 rounded-full" style={{ background: '#4a4d5a' }} />
          <span className="font-mono text-[8px] text-muted-foreground/50">{unspecified} unspecified</span>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Output Artifact List
// ---------------------------------------------------------------------------

function OutputList({ outputs }: { outputs: string[] }) {
  const iconMap: Record<string, typeof FileText> = {
    'results.json': Database,
    'metrics.json': Gauge,
    'system_info.json': Cpu,
    'ledger.json': Lock,
    'provenance.json': Shield,
    'anomaly_model.pt': FlaskConical,
    'HBK_MKII_Submission_Report.md': FileText,
    'submission_data.json': Database,
    'checksums.txt': Shield,
    'manifest.json': FileText,
  };

  return (
    <div className="space-y-1">
      <span className="font-mono text-[9px] text-muted-foreground/60 uppercase tracking-wider">
        Output Artifacts
      </span>
      <div className="space-y-0.5">
        {outputs.map((output) => {
          const Icon = iconMap[output] || FileText;
          return (
            <motion.div
              key={output}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: FADE_DURATION }}
              className="flex items-center gap-2 px-2 py-1 rounded-md hover:bg-white/[0.04] transition-colors"
            >
              <Icon className="h-3 w-3 text-muted-foreground/50" />
              <span className="font-mono text-[10px] text-foreground/70 truncate">
                {output}
              </span>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Phase Roadmap
// ---------------------------------------------------------------------------

const PHASES = [
  {
    id: 'validate',
    label: 'Phase 1: Validate Locally',
    description: 'Run the pipeline in test mode, verify all outputs',
    status: 'current' as const,
    command: 'python run_pipeline.py --mode test',
  },
  {
    id: 'amd-cloud',
    label: 'Phase 2: AMD Cloud',
    description: 'Configure environment variables for cloud compute',
    status: 'pending' as const,
    command: 'COMPUTE_PROVIDER=amd_cloud python run_pipeline.py',
  },
  {
    id: 'replace-synthetic',
    label: 'Phase 3: Replace Synthetic',
    description: 'Route expensive workloads to cloud GPU',
    status: 'pending' as const,
    command: 'Only the compute backend changes',
  },
  {
    id: 'keep-provenance',
    label: 'Phase 4: Keep Provenance',
    description: 'Provenance system stays intact throughout',
    status: 'locked' as const,
    command: 'No changes needed — provenance is architecture',
  },
];

function PhaseRoadmap() {
  return (
    <div className="space-y-1">
      <span className="font-mono text-[9px] text-muted-foreground/60 uppercase tracking-wider">
        Migration Phases
      </span>
      <div className="space-y-1">
        {PHASES.map((phase, idx) => {
          const statusColors = {
            current: { bg: 'bg-emerald-950/30', border: 'border-emerald-500/30', text: 'text-emerald-400', dot: '#3dffb0' },
            pending: { bg: 'bg-white/[0.02]', border: 'border-white/[0.06]', text: 'text-muted-foreground/50', dot: '#4a4d5a' },
            locked: { bg: 'bg-amber-950/20', border: 'border-amber-500/20', text: 'text-amber-400/70', dot: '#C9A84C' },
          };
          const style = statusColors[phase.status];

          return (
            <motion.div
              key={phase.id}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: FADE_DURATION, delay: idx * 0.05 }}
              className={`flex items-start gap-2 px-2 py-1.5 rounded-md border ${style.bg} ${style.border}`}
            >
              <div
                className="mt-1 h-2 w-2 rounded-full flex-none"
                style={{ background: style.dot }}
              />
              <div className="flex-1 min-w-0">
                <div className={`text-[10px] font-semibold ${style.text}`}>
                  {phase.label}
                </div>
                <div className="font-mono text-[8px] text-muted-foreground/40">
                  {phase.description}
                </div>
                {phase.status === 'current' && (
                  <div className="mt-1 font-mono text-[8px] text-emerald-400/60 bg-emerald-950/20 px-1.5 py-0.5 rounded inline-block">
                    $ {phase.command}
                  </div>
                )}
              </div>
              {phase.status === 'locked' && (
                <Lock className="h-3 w-3 text-amber-400/50 flex-none mt-0.5" />
              )}
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

// Static fallback data (used when API is unavailable)
const STATIC_STATUS: PipelineStatus = {
  status: 'idle',
  lastRun: null,
  config: {
    computeProvider: 'local',
    mode: 'test',
    hasGenesis: false,
    hasROCm: false,
  },
  provenance: {
    total: 10,
    signed: 1, // geometry is signed
    unverified: 8, // pressure, materials, safety are unverified
    unspecified: 1, // simulation params
  },
  outputs: [
    'results.json',
    'metrics.json',
    'system_info.json',
    'ledger.json',
    'provenance.json',
    'anomaly_model.pt',
  ],
  engineeringDisclaimer: 'Most engineering values in config.yaml are marked as unverified_placeholder. The pipeline correctly labels them as UNVERIFIED in any generated report. Do not cite unverified values as engineering-correct.',
};

export function HBKPipelineDashboard() {
  const [status, setStatus] = useState<PipelineStatus>(STATIC_STATUS);
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState(true);

  const fetchStatus = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/hbk');
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setStatus(data);
    } catch {
      // API unavailable — use static fallback data
      setStatus(STATIC_STATUS);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStatus();
  }, [fetchStatus]);

  if (loading && !status) {
    return (
      <div className="flex items-center justify-center h-32">
        <div className="flex items-center gap-2 text-muted-foreground/50">
          <RefreshCw className="h-4 w-4 animate-spin" />
          <span className="font-mono text-[10px]">Loading pipeline status…</span>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col" style={{ background: '#0a0a0f' }}>
      {/* Header */}
      <div className="shrink-0 border-b border-white/[0.06] px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FlaskConical className="h-4 w-4" style={{ color: '#C9A84C' }} />
            <span className="text-sm font-semibold text-foreground tracking-wide">
              HBK MK-II Pipeline
            </span>
            {status && <StatusBadge status={status.status} />}
          </div>
          <div className="flex items-center gap-1.5">
            <Button
              variant="ghost"
              size="sm"
              onClick={fetchStatus}
              className="h-6 w-6 p-0 text-muted-foreground/50 hover:text-foreground"
            >
              <RefreshCw className="h-3 w-3" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setExpanded(!expanded)}
              className="h-6 w-6 p-0 text-muted-foreground/50 hover:text-foreground"
            >
              <ChevronRight
                className={`h-3 w-3 transition-transform duration-150 ${expanded ? 'rotate-90' : ''}`}
              />
            </Button>
          </div>
        </div>
      </div>

      {/* Content */}
      <AnimatePresence>
        {expanded && status && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.15, ease: EXPAND_EASE as unknown as number }}
            className="flex-1 overflow-y-auto p-4 space-y-4"
          >
            {/* Config Summary */}
            <div className="grid grid-cols-2 gap-2">
              <div className="flex items-center gap-2 px-2 py-1.5 rounded-md bg-white/[0.03]">
                <Cpu className="h-3 w-3 text-muted-foreground/50" />
                <span className="font-mono text-[9px] text-muted-foreground/50">Provider</span>
                <span className="font-mono text-[9px] text-foreground/70 ml-auto">
                  {status.config.computeProvider}
                </span>
              </div>
              <div className="flex items-center gap-2 px-2 py-1.5 rounded-md bg-white/[0.03]">
                <Terminal className="h-3 w-3 text-muted-foreground/50" />
                <span className="font-mono text-[9px] text-muted-foreground/50">Mode</span>
                <span className="font-mono text-[9px] text-foreground/70 ml-auto">
                  {status.config.mode}
                </span>
              </div>
              <div className="flex items-center gap-2 px-2 py-1.5 rounded-md bg-white/[0.03]">
                <Zap className="h-3 w-3 text-muted-foreground/50" />
                <span className="font-mono text-[9px] text-muted-foreground/50">Genesis</span>
                <span className="font-mono text-[9px] ml-auto" style={{ color: status.config.hasGenesis ? '#3dffb0' : '#4a4d5a' }}>
                  {status.config.hasGenesis ? 'AVAILABLE' : 'UNAVAILABLE'}
                </span>
              </div>
              <div className="flex items-center gap-2 px-2 py-1.5 rounded-md bg-white/[0.03]">
                <HardDrive className="h-3 w-3 text-muted-foreground/50" />
                <span className="font-mono text-[9px] text-muted-foreground/50">ROCm</span>
                <span className="font-mono text-[9px] ml-auto" style={{ color: status.config.hasROCm ? '#3dffb0' : '#4a4d5a' }}>
                  {status.config.hasROCm ? 'DETECTED' : 'NOT FOUND'}
                </span>
              </div>
            </div>

            {/* Provenance */}
            <ProvenanceBar provenance={status.provenance} />

            {/* Output Artifacts */}
            <OutputList outputs={status.outputs} />

            {/* Phase Roadmap */}
            <PhaseRoadmap />

            {/* Engineering Disclaimer */}
            <div className="border border-amber-500/20 bg-amber-950/10 rounded-md px-3 py-2">
              <div className="flex items-start gap-2">
                <AlertTriangle className="h-3.5 w-3.5 text-amber-400/70 flex-none mt-0.5" />
                <div>
                  <span className="font-mono text-[9px] text-amber-400/70 font-semibold uppercase tracking-wider">
                    Engineering Disclaimer
                  </span>
                  <p className="font-mono text-[8px] text-muted-foreground/50 mt-0.5 leading-relaxed">
                    {status.engineeringDisclaimer}
                  </p>
                </div>
              </div>
            </div>

            {/* CLI Quick Reference */}
            <div className="border border-white/[0.06] rounded-md px-3 py-2">
              <span className="font-mono text-[9px] text-muted-foreground/60 uppercase tracking-wider">
                Quick Reference
              </span>
              <div className="mt-1.5 space-y-1 font-mono text-[9px]">
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground/40">$</span>
                  <span className="text-emerald-400/70">cd pipeline</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground/40">$</span>
                  <span className="text-foreground/70">python run_pipeline.py --mode test</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground/40">$</span>
                  <span className="text-foreground/70">python generate_submission.py</span>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

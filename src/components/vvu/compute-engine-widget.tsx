'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Activity,
  Cpu,
  HardDrive,
  ShieldCheck,
  Zap,
  Clock,
} from 'lucide-react';

// ---------------------------------------------------------------------------
// Mock Data — will be replaced by real telemetry feeds
// ---------------------------------------------------------------------------

interface ComputeMetrics {
  activePipelines: number;
  cpuUtilisation: number;
  memoryUsed: number;
  memoryTotal: number;
  trustScore: number;
  eventsProcessed: number;
  uptime: string;
}

const PIPELINE_STAGES = [
  { id: 'collect', label: 'Collect', progress: 100 },
  { id: 'analyze', label: 'Analyze', progress: 78 },
  { id: 'verify', label: 'Verify', progress: 45 },
  { id: 'execute', label: 'Execute', progress: 12 },
] as const;

const MOCK_METRICS: ComputeMetrics = {
  activePipelines: 4,
  cpuUtilisation: 34,
  memoryUsed: 2.7,
  memoryTotal: 8,
  trustScore: 72,
  eventsProcessed: 12847,
  uptime: '14h 32m',
};

// ---------------------------------------------------------------------------
// Metric Cell
// ---------------------------------------------------------------------------

function MetricCell({
  icon: Icon,
  label,
  value,
  color = '#3dffb0',
}: {
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
  label: string;
  value: string;
  color?: string;
}) {
  return (
    <div className="flex flex-col items-center gap-0.5">
      <Icon className="h-3 w-3 text-muted-foreground/50" strokeWidth={1.8} />
      <span
        className="font-mono text-[11px] font-semibold leading-none"
        style={{ color }}
      >
        {value}
      </span>
      <span className="font-mono text-[8px] text-muted-foreground/50 leading-none">
        {label}
      </span>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Pipeline Status Bar
// ---------------------------------------------------------------------------

function PipelineStatusBar() {
  return (
    <div className="flex items-center gap-1 w-full">
      {PIPELINE_STAGES.map((stage, idx) => (
        <div key={stage.id} className="flex items-center gap-1 flex-1">
          <div className="flex flex-col gap-0.5 flex-1">
            <div className="h-1 w-full rounded-full bg-white/[0.06] overflow-hidden">
              <motion.div
                className="h-full rounded-full"
                style={{
                  background:
                    stage.progress === 100
                      ? '#3dffb0'
                      : stage.progress > 50
                        ? '#3dd6ff'
                        : '#C9A84C',
                  width: `${stage.progress}%`,
                  transformOrigin: 'left',
                }}
                initial={{ scaleX: 0 }}
                animate={{ scaleX: 1 }}
                transition={{ duration: 0.8, ease: 'easeOut', delay: idx * 0.15 }}
              />
            </div>
            <span className="font-mono text-[7px] text-muted-foreground/40 leading-none">
              {stage.label}
            </span>
          </div>
          {idx < PIPELINE_STAGES.length - 1 && (
            <div className="h-px w-1.5 bg-white/[0.06] flex-none self-center mt-1" />
          )}
        </div>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Health Gauge (linear arc)
// ---------------------------------------------------------------------------

function HealthGauge({ value }: { value: number }) {
  const clampedValue = Math.max(0, Math.min(100, value));
  const color =
    clampedValue >= 80
      ? '#3dffb0'
      : clampedValue >= 50
        ? '#C9A84C'
        : '#ff2e5f';

  return (
    <div className="flex items-center gap-2">
      <div className="relative h-2 w-16 rounded-full bg-white/[0.06] overflow-hidden">
        <motion.div
          className="absolute inset-y-0 left-0 rounded-full"
          style={{ background: color, width: `${clampedValue}%`, transformOrigin: 'left' }}
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
        />
      </div>
      <span className="font-mono text-[9px] leading-none" style={{ color }}>
        {clampedValue}%
      </span>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Compute Engine Widget
// ---------------------------------------------------------------------------

export function ComputeEngineWidget() {
  const [metrics, setMetrics] = useState<ComputeMetrics>(MOCK_METRICS);
  const [isRunning] = useState(true);

  // Simulated live telemetry tick (slow, no layout shift)
  useEffect(() => {
    const interval = setInterval(() => {
      setMetrics((prev) => ({
        ...prev,
        cpuUtilisation: Math.min(
          100,
          Math.max(5, prev.cpuUtilisation + (Math.random() - 0.5) * 4)
        ),
        eventsProcessed: prev.eventsProcessed + Math.floor(Math.random() * 3),
        memoryUsed: Math.min(
          prev.memoryTotal,
          Math.max(1, prev.memoryUsed + (Math.random() - 0.5) * 0.1)
        ),
      }));
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div
      className="vvu-no-layout-shift relative w-full overflow-hidden"
      style={{ background: '#0a0a0f' }}
    >
      <div className="border-b border-white/[0.04] px-4 py-2.5">
        {/* Header row */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <span
              className="h-2 w-2 rounded-full flex-none"
              style={{
                background: isRunning ? '#3dffb0' : '#4a4d5a',
                boxShadow: isRunning ? '0 0 6px #3dffb080' : undefined,
                animation: isRunning
                  ? 'vvu-live-pulse 2s ease-in-out infinite'
                  : undefined,
              }}
            />
            <span className="text-xs font-semibold text-foreground tracking-wide">
              Compute Engine
            </span>
            <span className="font-mono text-[9px] text-emerald-400/60">
              {isRunning ? 'RUNNING' : 'IDLE'}
            </span>
          </div>
          <HealthGauge value={metrics.trustScore} />
        </div>

        {/* Key metrics grid — 2 rows × 3 cols */}
        <div className="grid grid-cols-3 gap-x-4 gap-y-1.5 mb-2.5">
          <MetricCell
            icon={Zap}
            label="Pipelines"
            value={String(metrics.activePipelines)}
            color="#3dd6ff"
          />
          <MetricCell
            icon={Cpu}
            label="CPU"
            value={`${Math.round(metrics.cpuUtilisation)}%`}
            color={
              metrics.cpuUtilisation > 80
                ? '#ff2e5f'
                : metrics.cpuUtilisation > 50
                  ? '#C9A84C'
                  : '#3dffb0'
            }
          />
          <MetricCell
            icon={HardDrive}
            label="Memory"
            value={`${metrics.memoryUsed.toFixed(1)}/${metrics.memoryTotal}G`}
            color="#3dd6ff"
          />
          <MetricCell
            icon={ShieldCheck}
            label="Trust"
            value={String(metrics.trustScore)}
            color="#3dffb0"
          />
          <MetricCell
            icon={Activity}
            label="Events"
            value={metrics.eventsProcessed.toLocaleString()}
            color="#C9A84C"
          />
          <MetricCell
            icon={Clock}
            label="Uptime"
            value={metrics.uptime}
            color="#8A9A5B"
          />
        </div>

        {/* Pipeline status bar */}
        <PipelineStatusBar />
      </div>
    </div>
  );
}

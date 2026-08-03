'use client';

import { motion } from 'framer-motion';
import {
  Cpu,
  HardDrive,
  ShieldCheck,
  Activity,
  Clock,
  Zap,
  AlertTriangle,
  XCircle,
  CheckCircle2,
  Bot,
} from 'lucide-react';
import { useIDEStore, AUTONOMY_LABELS, AUTONOMY_COLORS, type AutonomyLevel } from './ide-store';

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
    <div className="flex items-center gap-1.5 px-2">
      <Icon className="h-3 w-3 text-[#858585]" strokeWidth={1.5} />
      <span className="font-mono text-[11px] font-semibold" style={{ color }}>
        {value}
      </span>
      <span className="font-mono text-[9px] text-[#555] hidden sm:inline">
        {label}
      </span>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Trust Dial — Lindiwe Autonomy Indicator
// ---------------------------------------------------------------------------

function TrustDial() {
  const autonomyLevel = useIDEStore((s) => s.autonomyLevel);
  const setAutonomyLevel = useIDEStore((s) => s.setAutonomyLevel);
  const circuitBreaker = useIDEStore((s) => s.circuitBreaker);
  const lindiweMode = useIDEStore((s) => s.lindiweMode);

  const color = AUTONOMY_COLORS[autonomyLevel];
  const label = AUTONOMY_LABELS[autonomyLevel];

  const cycleAutonomy = () => {
    const next = ((autonomyLevel) % 3 + 1) as AutonomyLevel;
    setAutonomyLevel(next);
  };

  return (
    <button
      onClick={cycleAutonomy}
      className="flex items-center gap-1.5 px-2 py-0.5 hover:bg-[#2a2d2e] rounded-sm transition-colors group"
      title={`Lindiwe Autonomy: ${label} (Click to cycle)`}
    >
      <Bot className="h-3 w-3" style={{ color }} strokeWidth={1.5} />
      <div
        className="w-2 h-2 rounded-full"
        style={{
          backgroundColor: color,
          boxShadow: circuitBreaker === 'TRIGGERED'
            ? `0 0 8px ${color}`
            : autonomyLevel === 2
              ? `0 0 4px ${color}40`
              : 'none',
        }}
      >
        {/* Pulse animation for Watchdog */}
        {autonomyLevel === 3 && (
          <motion.div
            className="w-full h-full rounded-full"
            style={{ backgroundColor: color }}
            animate={{ scale: [1, 1.8, 1], opacity: [1, 0, 1] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          />
        )}
      </div>
      <span className="font-mono text-[10px] text-[#858585] group-hover:text-[#cccccc] transition-colors">
        L{autonomyLevel}: {label}
      </span>
      <span className="font-mono text-[9px] text-[#555] hidden md:inline">
        [{lindiweMode}]
      </span>
    </button>
  );
}

// ---------------------------------------------------------------------------
// Circuit Breaker Indicator
// ---------------------------------------------------------------------------

function CircuitBreakerIndicator() {
  const circuitBreaker = useIDEStore((s) => s.circuitBreaker);
  const setCircuitBreaker = useIDEStore((s) => s.setCircuitBreaker);

  const handleClick = () => {
    if (circuitBreaker === 'TRIGGERED') {
      // Reset to NORMAL
      setCircuitBreaker('NORMAL');
    }
  };

  return (
    <button
      onClick={handleClick}
      className="flex items-center gap-1.5 px-2 py-0.5 hover:bg-[#2a2d2e] rounded-sm transition-colors"
      title={circuitBreaker === 'TRIGGERED' ? 'Click to reset circuit breaker' : 'Circuit breaker status'}
    >
      {circuitBreaker === 'NORMAL' && (
        <>
          <CheckCircle2 className="h-3 w-3 text-[#3dffb0]" strokeWidth={1.5} />
          <span className="font-mono text-[10px] text-[#3dffb0]">NOMINAL</span>
        </>
      )}
      {circuitBreaker === 'DEGRADED' && (
        <>
          <AlertTriangle className="h-3 w-3 text-[#eab308]" strokeWidth={1.5} />
          <span className="font-mono text-[10px] text-[#eab308]">DEGRADED</span>
        </>
      )}
      {circuitBreaker === 'TRIGGERED' && (
        <>
          <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ duration: 0.8, repeat: Infinity }}>
            <XCircle className="h-3 w-3 text-[#ef4444]" strokeWidth={2} />
          </motion.div>
          <motion.span
            className="font-mono text-[10px] text-[#ef4444]"
            animate={{ opacity: [1, 0.5, 1] }}
            transition={{ duration: 0.8, repeat: Infinity }}
          >
            BREAK
          </motion.span>
        </>
      )}
    </button>
  );
}

// ---------------------------------------------------------------------------
// Status Bar
// ---------------------------------------------------------------------------

export function StatusBar() {
  const computeMetrics = useIDEStore((s) => s.computeMetrics);
  const activeTab = useIDEStore((s) => s.activeTab);
  const activePlugin = useIDEStore((s) => s.activePlugin);

  return (
    <footer
      className="h-[26px] bg-[#1c1c1c] border-t border-[#2d2d2d] flex items-center justify-between px-2 shrink-0 z-50"
      role="status"
      aria-label="Status Bar"
    >
      {/* Left — Compute Engine Metrics */}
      <div className="flex items-center gap-0">
        <MetricCell icon={Zap} label="Pipelines" value={String(computeMetrics.activePipelines)} color="#3dffb0" />
        <MetricCell icon={Cpu} label="CPU" value={`${computeMetrics.cpuUtilisation}%`} color="#3dd6ff" />
        <MetricCell icon={HardDrive} label="Memory" value={`${computeMetrics.memoryUsed}/${computeMetrics.memoryTotal}GB`} color="#C9A84C" />
        <MetricCell icon={ShieldCheck} label="Trust" value={`${computeMetrics.trustScore}/100`} color="#3dffb0" />
        <MetricCell icon={Activity} label="Events" value={computeMetrics.eventsProcessed.toLocaleString()} color="#b23dff" />
        <MetricCell icon={Clock} label="Uptime" value={computeMetrics.uptime} color="#858585" />
      </div>

      {/* Right — Lindiwe + Circuit Breaker + Status */}
      <div className="flex items-center gap-2">
        <CircuitBreakerIndicator />
        <div className="w-px h-3 bg-[#3c3c3c]" />
        <TrustDial />
        <div className="w-px h-3 bg-[#3c3c3c]" />
        <div className="font-mono text-[10px] text-[#555] px-1">
          {activePlugin.replace('_', ' ')} · {activeTab.replace('_', ' ')}
        </div>
      </div>
    </footer>
  );
}

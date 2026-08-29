import { Activity, Eye, EyeOff, LocateFixed, Pause, Play, RotateCcw } from "lucide-react";
import { MAX_CYCLES } from "../lib/engine";
import type { SimStatus } from "../lib/sim";

export interface TopBarProps {
  status: SimStatus;
  cycle: number;
  hash: string;
  protocol72: boolean;
  onToggleProtocol: () => void;
  onResetView: () => void;
  onPrimary: () => void;
}

const STATUS_META: Record<SimStatus, { label: string; dot: string; text: string }> = {
  ready: { label: "READY", dot: "bg-normal", text: "text-normal" },
  running: { label: "SIMULATING", dot: "bg-accent animate-pulse-dot", text: "text-accent" },
  paused: { label: "PAUSED", dot: "bg-candidate", text: "text-candidate" },
  complete: { label: "COMPLETE", dot: "bg-verified", text: "text-verified" },
};

const PRIMARY_META: Record<SimStatus, { label: string; Icon: typeof Play }> = {
  ready: { label: "Simulate", Icon: Play },
  running: { label: "Pause", Icon: Pause },
  paused: { label: "Resume", Icon: Play },
  complete: { label: "Replay", Icon: RotateCcw },
};

export default function TopBar({
  status,
  cycle,
  hash,
  protocol72,
  onToggleProtocol,
  onResetView,
  onPrimary,
}: TopBarProps) {
  const meta = STATUS_META[status];
  const primary = PRIMARY_META[status];
  const PrimaryIcon = primary.Icon;

  return (
    <div className="pointer-events-none absolute left-1/2 top-3 z-[15] w-[calc(100%-6.5rem)] -translate-x-1/2 sm:top-4 lg:w-auto lg:max-w-[42rem]">
      <div className="pointer-events-auto flex w-full flex-wrap items-center justify-center gap-x-4 gap-y-2 rounded-full border border-edge bg-surface/85 px-4 py-2 shadow-xl backdrop-blur-md lg:w-auto">
        {/* Status */}
        <div className="flex items-center gap-2">
          <span className="relative flex h-2.5 w-2.5">
            <span className={`absolute inline-flex h-full w-full rounded-full ${meta.dot} opacity-75`} />
            <span className={`relative inline-flex h-2.5 w-2.5 rounded-full ${meta.dot}`} />
          </span>
          <span className={`text-xs font-semibold tracking-widest ${meta.text}`}>{meta.label}</span>
        </div>

        {/* Cycle counter */}
        <span className="hidden font-mono text-xs text-muted sm:inline">
          cycle {Math.min(cycle, MAX_CYCLES)}/{MAX_CYCLES}
        </span>

        {/* Live audit hash */}
        <div className="hidden items-center gap-1.5 font-mono text-[11px] text-muted md:flex" title="SHA-256 of current network state">
          <Activity className="h-3.5 w-3.5 text-accent" aria-hidden="true" />
          <span>{hash ? hash.slice(0, 12) : "—".repeat(12)}</span>
        </div>

        <div className="mx-1 hidden h-5 w-px bg-edge sm:block" aria-hidden="true" />

        {/* Controls */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onToggleProtocol}
            aria-pressed={protocol72}
            className="flex cursor-pointer items-center gap-1.5 rounded-full border border-edge bg-surface-2 px-2.5 py-1 text-[11px] font-medium text-muted transition-colors duration-200 hover:text-foreground focus-visible:outline-2 focus-visible:outline-accent"
          >
            {protocol72 ? <EyeOff className="h-3.5 w-3.5" aria-hidden="true" /> : <Eye className="h-3.5 w-3.5" aria-hidden="true" />}
            72h Protocol
          </button>
          <button
            type="button"
            onClick={onResetView}
            title="Reset map & subsurface camera"
            aria-label="Reset map and subsurface camera"
            className="flex cursor-pointer items-center gap-1 rounded-full border border-edge bg-surface-2 px-2.5 py-1 text-[11px] font-medium text-muted transition-colors duration-200 hover:text-foreground focus-visible:outline-2 focus-visible:outline-accent"
          >
            <LocateFixed className="h-3.5 w-3.5" aria-hidden="true" />
            <span className="hidden sm:inline">Reset View</span>
          </button>
          <button
            type="button"
            onClick={onPrimary}
            className="flex cursor-pointer items-center gap-1.5 rounded-full bg-accent px-3.5 py-1.5 text-xs font-semibold text-slate-950 shadow-md shadow-accent/25 transition-all duration-150 ease-out hover:bg-accent-strong active:scale-[0.97] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
          >
            <PrimaryIcon className="h-4 w-4" aria-hidden="true" />
            {primary.label}
          </button>
        </div>
      </div>
    </div>
  );
}

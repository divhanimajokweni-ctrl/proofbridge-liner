'use client';

/**
 * Residual Trunk · Study Room · VVU IVE
 * -------------------------------------
 * Interactive vertical diagram of the 8-layer engineering chain that
 * transforms raw municipal water-network signals into an auditable evidence
 * record. Each layer is a horizontal card connected by a vertical "trunk"
 * line — the chain runs from physical sensor → audit hash.
 *
 * Status:
 *   Layers 1–5  green  IMPLEMENTED   (in the demo build)
 *   Layers 6–7  amber  PARTIAL       (HBK + field verification)
 *   Layer  8    dim    FUTURE        (full audit-receipt export)
 *
 * Click any card to expand its detail panel.
 *
 * Self-contained — accepts no props.
 */

import { useState } from 'react';
import {
  AlertTriangle,
  ArrowDown,
  Boxes,
  CheckCircle2,
  ChevronDown,
  Database,
  FileCheck2,
  GitBranch,
  Layers3,
  MapPin,
  Network,
  Radio,
  ScanSearch,
  ShieldCheck,
  type LucideIcon,
} from 'lucide-react';
import { Separator } from '@/components/ui/separator';

type LayerStatus = 'IMPLEMENTED' | 'PARTIAL' | 'FUTURE';

interface LayerDef {
  id: number;
  name: string;
  short: string;
  description: string;
  status: LayerStatus;
  icon: LucideIcon;
  inputs: string[];
  outputs: string[];
  artifact: string;
}

const LAYERS: LayerDef[] = [
  {
    id: 1,
    name: 'Municipal Water Network',
    short: 'The physical system under observation.',
    description:
      'Pipes, valves, pumps, reservoirs, and DMAs (District Metered Areas) of the municipal water-distribution system. Real SCADA telemetry arrives from in-line flow, pressure, level, and pump-status sensors. The network is the ground truth the IVE is trying to characterise — never directly observable in full.',
    status: 'IMPLEMENTED',
    icon: Network,
    inputs: ['Physical flow / pressure / level', 'Pump + valve state'],
    outputs: ['Raw SCADA tags', 'Sensor identities'],
    artifact: 'PHYSICAL_SYSTEM',
  },
  {
    id: 2,
    name: 'Sparse Observations',
    short: 'Flow, pressure, level, pump/valve status.',
    description:
      'Sparse point observations sampled from the network. Each reading carries an 11-field provenance spine (sensor, firmware, calibration, timestamp, location, DMA, environment, processing, attestation, quality, type). The HOM (Hydraulic Observability Model) formalises the observability envelope: which faults these sensors can distinguish.',
    status: 'IMPLEMENTED',
    icon: Radio,
    inputs: ['Raw SCADA tags', 'Provenance metadata'],
    outputs: ['VALID / MISSING observations', '11-field provenance spine'],
    artifact: 'OBSERVATION_SET',
  },
  {
    id: 3,
    name: 'Anomaly Detection',
    short: 'Flow deviation + pressure drop vs baseline.',
    description:
      'Each observation is compared against the minimum-night-flow (MNF) baseline. Flow deviation exceeding the threshold and pressure drop exceeding its threshold raise an ANOMALOUS flag. Pump-state changes are caught here so they cannot masquerade as leaks later in the chain.',
    status: 'IMPLEMENTED',
    icon: AlertTriangle,
    inputs: ['Observation set', 'MNF baselines', 'Calibration thresholds'],
    outputs: ['ANOMALOUS flag', 'Pump-state context flag'],
    artifact: 'ANOMALY_FLAGS',
  },
  {
    id: 4,
    name: 'Evidence Correlation',
    short: 'Link related observations across sensors + time.',
    description:
      'Observations that share a sensor identity, time window, or geographic cluster are flagged as CORRELATED. The correlation window (configurable per DMA, 1–1440 min) bounds which observations can plausibly corroborate each other. The output is a graph of related observations ready for independence assessment.',
    status: 'IMPLEMENTED',
    icon: GitBranch,
    inputs: ['ANOMALOUS observations', 'Correlation time window'],
    outputs: ['CORRELATED clusters', 'Cross-sensor links'],
    artifact: 'CORRELATION_GRAPH',
  },
  {
    id: 5,
    name: 'Independence Assessment',
    short: 'EIS v1.0 — are corroborating observations independent?',
    description:
      'The Evidence Independence Scoring engine (EIS v1.0) classifies each observation as VALID / MISSING / ANOMALOUS / CORRELATED / INDEPENDENT / INSUFFICIENT and computes the weighted score: PRIMARY(0.3) + CORRELATED(0.2) + INDEPENDENT(0.4), threshold 0.8. This step refuses to inflate evidence: five agreeing sensors through correlated channels count as one PRIMARY + one CORRELATED, not five independent proofs.',
    status: 'IMPLEMENTED',
    icon: ShieldCheck,
    inputs: ['Correlation graph', 'EIS classification rules'],
    outputs: ['INDEPENDENT observations', 'EIS score + verdict'],
    artifact: 'EIS_VERDICT',
  },
  {
    id: 6,
    name: 'Candidate Location Inference',
    short: 'HBK — narrow the search zone.',
    description:
      'The Hydro-Bayesian Kernel (HBK) takes the verified-IND observations and runs sequential Bayesian inference over a 32×32 grid. Each new observation updates the posterior. The MAP estimate locates the most likely leak cell; the 95% credible radius bounds the search area. Mixture-noise handling widens σ during transient disturbances rather than discarding samples.',
    status: 'PARTIAL',
    icon: ScanSearch,
    inputs: ['INDEPENDENT observations', 'Sensor geometry', 'Forward model'],
    outputs: ['MAP cell', '95% credible radius'],
    artifact: 'HBK_POSTERIOR',
  },
  {
    id: 7,
    name: 'Field Verification',
    short: 'Human confirms or rejects the candidate.',
    description:
      'A field crew dispatched to the HBK-localized cell confirms or rejects the candidate leak via acoustic survey, visual inspection, or correlation measurement. The field report becomes a new INDEPENDENT observation feeding back into Layer 5. If the crew finds no leak, the verdict is REJECTED — the audit trail records both outcomes honestly.',
    status: 'PARTIAL',
    icon: MapPin,
    inputs: ['MAP cell + credible radius', 'Field crew dispatch'],
    outputs: ['CONFIRMED / REJECTED report', 'New INDEPENDENT observation'],
    artifact: 'FIELD_REPORT',
  },
  {
    id: 8,
    name: 'Auditable Evidence Record',
    short: '11-field provenance + SHA-256 hash.',
    description:
      'Every observation, anomaly flag, correlation link, EIS verdict, HBK posterior, and field report is serialised into an immutable audit receipt with full 11-field provenance per observation. The receipt body is hashed (SHA-256 over a canonical JSON form) so any downstream analyst can verify reproducibility: same input → same hash.',
    status: 'FUTURE',
    icon: FileCheck2,
    inputs: ['All upstream artifacts', 'Canonical serialiser'],
    outputs: ['Audit receipt JSON', 'SHA-256 receipt hash'],
    artifact: 'AUDIT_RECEIPT',
  },
];

const STATUS_META: Record<
  LayerStatus,
  { color: string; bg: string; border: string; label: string }
> = {
  IMPLEMENTED: {
    color: 'var(--k-green-bright)',
    bg: 'rgba(0,255,136,0.06)',
    border: 'rgba(0,255,136,0.35)',
    label: 'IMPLEMENTED',
  },
  PARTIAL: {
    color: 'var(--k-amber-bright)',
    bg: 'rgba(255,184,0,0.06)',
    border: 'rgba(255,184,0,0.35)',
    label: 'PARTIAL',
  },
  FUTURE: {
    color: 'var(--k-dim)',
    bg: 'rgba(91,114,128,0.05)',
    border: 'rgba(91,114,128,0.30)',
    label: 'FUTURE',
  },
};

export default function ResidualTrunk() {
  const [expanded, setExpanded] = useState<number | null>(5);

  const toggle = (id: number) => {
    setExpanded((prev) => (prev === id ? null : id));
  };

  return (
    <div className="flex flex-col h-full min-h-0 bg-[var(--k-bg)] k-grid-bg">
      {/* Header */}
      <header className="px-4 sm:px-6 lg:px-8 py-4 border-b border-[var(--k-line)] bg-[var(--k-panel)]">
        <div className="flex items-center gap-2 mb-1.5">
          <Layers3 className="h-4 w-4 k-cyan" />
          <h2 className="text-sm font-bold k-fg-bright uppercase tracking-wider">
            Residual Trunk
          </h2>
          <span className="k-badge k-badge-process">8 LAYERS</span>
        </div>
        <p className="text-[11px] k-dim">
          The 8-layer engineering chain from municipal water network to
          auditable evidence record. Click any layer to expand its detail.
        </p>
        {/* Legend */}
        <div className="flex flex-wrap items-center gap-3 mt-3">
          <LegendDot color="var(--k-green-bright)" label="IMPLEMENTED · 1–5" />
          <LegendDot color="var(--k-amber-bright)" label="PARTIAL · 6–7" />
          <LegendDot color="var(--k-dim)" label="FUTURE · 8" />
          <span className="ml-auto text-[10px] k-dim uppercase tracking-widest hidden sm:inline">
            Physical → Observation → Anomaly → Correlation → Independence →
            Inference → Verification → Audit
          </span>
        </div>
      </header>

      {/* Trunk scroll area */}
      <div className="flex-1 min-h-0 overflow-y-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="relative max-w-3xl mx-auto">
          {/* Vertical trunk line — runs behind all cards */}
          <div
            aria-hidden
            className="absolute left-[27px] sm:left-[35px] top-2 bottom-2 w-px bg-gradient-to-b from-[var(--k-cyan-bright)]/60 via-[var(--k-amber-bright)]/40 to-[var(--k-dim)]/30"
          />

          <div className="flex flex-col gap-2">
            {LAYERS.map((layer, idx) => {
              const isExpanded = expanded === layer.id;
              const isLast = idx === LAYERS.length - 1;
              return (
                <div key={layer.id} className="relative">
                  <LayerCard
                    layer={layer}
                    isExpanded={isExpanded}
                    onToggle={() => toggle(layer.id)}
                  />
                  {!isLast && (
                    <div
                      aria-hidden
                      className="flex justify-center py-0.5"
                    >
                      <ArrowDown className="h-3.5 w-3.5 k-dim" />
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* End-of-trunk marker */}
          <div className="flex items-center justify-center gap-2 mt-6 pt-4 border-t border-dashed border-[var(--k-line-strong)]">
            <Database className="h-4 w-4 k-pass" />
            <span className="text-[10px] k-pass uppercase tracking-widest font-bold">
              AUDIT RECEIPT · SHA-256 · IMMUTABLE
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Layer card ───────────────────────────────────────────────────────

function LayerCard({
  layer,
  isExpanded,
  onToggle,
}: {
  layer: LayerDef;
  isExpanded: boolean;
  onToggle: () => void;
}) {
  const status = STATUS_META[layer.status];
  const Icon = layer.icon;
  const num = String(layer.id).padStart(2, '0');

  return (
    <button
      type="button"
      onClick={onToggle}
      aria-expanded={isExpanded}
      className="block w-full text-left group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--k-cyan-bright)] rounded-md"
    >
      <div
        className="relative pl-12 sm:pl-16 pr-3 py-3 rounded-md border bg-[var(--k-panel)] transition-all group-hover:bg-[var(--k-panel-2)]"
        style={{
          borderColor: isExpanded ? status.color : 'var(--k-line-strong)',
          boxShadow: isExpanded
            ? `0 0 0 1px ${status.border}, 0 0 16px ${status.bg}`
            : 'none',
        }}
      >
        {/* Layer number badge on the trunk */}
        <span
          aria-hidden
          className="absolute left-0 top-1/2 -translate-y-1/2 flex items-center justify-center w-12 sm:w-16"
        >
          <span
            className="flex items-center justify-center w-7 h-7 sm:w-9 sm:h-9 rounded-full border-2 bg-[var(--k-bg-elevated)] font-mono font-bold text-xs sm:text-sm"
            style={{
              color: status.color,
              borderColor: status.color,
              boxShadow: `0 0 8px ${status.bg}`,
            }}
          >
            {num}
          </span>
        </span>

        {/* Header row */}
        <div className="flex items-start gap-3">
          <div
            className="flex items-center justify-center w-9 h-9 rounded-md border shrink-0"
            style={{
              borderColor: status.border,
              backgroundColor: status.bg,
            }}
          >
            <Icon
              className="h-4 w-4"
              style={{ color: status.color }}
            />
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 mb-0.5">
              <h3 className="text-sm sm:text-base font-bold k-fg-bright uppercase tracking-wide leading-tight truncate">
                {layer.name}
              </h3>
              {layer.status === 'IMPLEMENTED' ? (
                <CheckCircle2 className="h-3.5 w-3.5 k-pass shrink-0" />
              ) : layer.status === 'PARTIAL' ? (
                <AlertTriangle className="h-3.5 w-3.5 k-warn shrink-0" />
              ) : (
                <Boxes className="h-3.5 w-3.5 k-dim shrink-0" />
              )}
            </div>
            <p className="text-[11px] k-dim leading-snug">
              {layer.short}
            </p>
          </div>

          <div className="flex flex-col items-end gap-1 shrink-0">
            <span
              className="text-[9px] uppercase tracking-widest font-bold px-1.5 py-0.5 rounded"
              style={{
                color: status.color,
                backgroundColor: status.bg,
                border: `1px solid ${status.border}`,
              }}
            >
              {status.label}
            </span>
            <ChevronDown
              className={`h-3.5 w-3.5 k-dim transition-transform ${
                isExpanded ? 'rotate-180' : ''
              }`}
            />
          </div>
        </div>

        {/* Expanded detail panel */}
        {isExpanded && (
          <div className="mt-3 pl-12 sm:pl-16 pr-1 pb-1">
            <Separator className="bg-[var(--k-line-strong)] mb-3" />
            <p className="text-xs k-fg leading-relaxed font-mono mb-3">
              {layer.description}
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-3">
              <div className="rounded-md border border-[var(--k-line)] bg-[var(--k-bg-elevated)] px-2.5 py-1.5">
                <div className="text-[9px] uppercase tracking-widest k-dim mb-1">
                  Inputs
                </div>
                <ul className="space-y-0.5">
                  {layer.inputs.map((inp) => (
                    <li
                      key={inp}
                      className="text-[10px] k-cyan font-mono flex items-start gap-1"
                    >
                      <ArrowDown className="h-2.5 w-2.5 mt-0.5 rotate-[-90deg] shrink-0 opacity-60" />
                      <span>{inp}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="rounded-md border border-[var(--k-line)] bg-[var(--k-bg-elevated)] px-2.5 py-1.5">
                <div className="text-[9px] uppercase tracking-widest k-dim mb-1">
                  Outputs
                </div>
                <ul className="space-y-0.5">
                  {layer.outputs.map((out) => (
                    <li
                      key={out}
                      className="text-[10px] k-pass font-mono flex items-start gap-1"
                    >
                      <ArrowDown className="h-2.5 w-2.5 mt-0.5 rotate-90 shrink-0 opacity-60" />
                      <span>{out}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
            <div className="flex items-center gap-2 text-[10px] uppercase tracking-widest">
              <span className="k-dim">ARTIFACT:</span>
              <code className="k-cyan font-mono text-[10px] font-bold">
                {layer.artifact}
              </code>
            </div>
          </div>
        )}
      </div>
    </button>
  );
}

// ─── Legend dot ────────────────────────────────────────────────────────

function LegendDot({ color, label }: { color: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-[10px] uppercase tracking-widest k-dim">
      <span
        className="inline-block w-2 h-2 rounded-full"
        style={{ backgroundColor: color, boxShadow: `0 0 6px ${color}` }}
      />
      {label}
    </span>
  );
}

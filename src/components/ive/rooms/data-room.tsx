'use client';

/**
 * Data Room · VVU IVE
 * -------------------
 * The Data Room is one of the rooms in the VVU Immersive Virtual Environment
 * (per DWS briefs 03a / 04b). It hosts 5 activities:
 *
 *   1. EIS v1.0 Evidence Analysis  (EXISTS — main workspace)
 *   2. HBK Localization             (EXISTS — main workspace)
 *   3. NMBM Data Sandbox            (PARTIAL → renders NmbmSandbox)
 *   4. AIR Runtime                  (EXISTS → renders AirRuntime)
 *   5. Field Evidence               (EXISTS → renders FieldEvidence)
 *
 * The component renders a grid of activity cards by default. Clicking a card
 * sets the selected activity (local state) and renders it full-screen with a
 * back button to return to the grid.
 *
 * For the EIS and HBK cards, the full-screen view shows a compact summary
 * panel that points users to the top-level EIS WORKSPACE / HBK LOCALIZATION
 * view toggle (the orchestrator will later wire the actual content). The
 * other three cards render their respective activity components.
 *
 * Self-contained — accepts no props. Uses the kernel-theme CSS variables
 * and utility classes defined in src/app/globals.css.
 */

import { useState } from 'react';
import {
  ArrowLeft,
  Database,
  Layers3,
  TerminalSquare,
  Radio,
  Camera,
  type LucideIcon,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import NmbmSandbox from '@/components/ive/data-room/nmbm-sandbox';
import AirRuntime from '@/components/ive/data-room/air-runtime';
import FieldEvidence from '@/components/ive/data-room/field-evidence';
import EisWorkspace from '@/components/ive/data-room/eis-workspace';
import HBKPanel from '@/components/evidence/hbk-panel';

type Status = 'EXISTS' | 'PARTIAL';

interface ActivityDef {
  id: string;
  title: string;
  subtitle: string;
  desc: string;
  icon: LucideIcon;
  status: Status;
  priority?: boolean;
  meta: { label: string; value: string }[];
  /** Component rendered full-screen when this card is opened. */
  Component?: React.ComponentType;
  /** Compact summary shown in the card body (and full-screen for EIS/HBK). */
  summary: {
    spec: string;
    rows: Array<{ label: string; value: string; color?: string }>;
  };
  /** If true, full-screen view shows the summary-only placeholder panel. */
  summaryOnly?: boolean;
}

const ACTIVITIES: ActivityDef[] = [
  {
    id: 'eis',
    title: 'EIS v1.0 Evidence Analysis',
    subtitle: 'Evidence Independence Scoring · 10-step Replay',
    desc:
      'Hydraulic incident replay against EIS v1.0 — the Evidence Independence Scoring engine that prevents evidence inflation by classifying observations as PRIMARY, CORRELATED, INDEPENDENT, DERIVED, or CONTEXTUAL.',
    icon: Database,
    status: 'EXISTS',
    priority: true,
    meta: [
      { label: 'STEPS', value: '10' },
      { label: 'THRESHOLD', value: '0.80' },
      { label: 'VERDICT', value: 'VERIFIED' },
    ],
    summary: {
      spec: '02c_EVIDENCE_INDEPENDENCE_SPEC_EIS_v1.md',
      rows: [
        {
          label: 'Score formula',
          value: 'PRIMARY(0.3) + CORRELATED(0.2) + INDEPENDENT(0.4)',
          color: 'k-cyan',
        },
        { label: 'Verdict threshold', value: '≥ 0.80 → VERIFIED_CANDIDATE' },
        {
          label: 'Reject rule',
          value: 'PRIMARY ∧ pump-context ⇒ REJECTED_FALSE_POSITIVE',
          color: 'k-warn',
        },
        { label: 'Quality flags', value: 'VALID · MISSING · IMPOSSIBLE_PHYSICS · UNDEFINED' },
        { label: 'Pipeline passes', value: 'Collect → Boundaries → Baseline → EIS → Export' },
      ],
    },
    Component: EisWorkspace,
  },
  {
    id: 'hbk',
    title: 'HBK Localization',
    subtitle: 'Hydro-Bayesian Kernel · 3D Posterior',
    desc:
      'Three-dimensional Bayesian leak localization. Combines the EIS verdict with a sensor-geometry prior to produce a posterior probability field over the DMA, highlighting the most likely leak locus as a heat-map overlay.',
    icon: Layers3,
    status: 'EXISTS',
    meta: [
      { label: 'KERNEL', value: 'HBK v1' },
      { label: 'METHOD', value: 'BETA-BINOMIAL' },
      { label: 'DIM', value: '3D' },
    ],
    summary: {
      spec: '01b_TECHNICAL_DEMONSTRATION_BRIEF.md',
      rows: [
        {
          label: 'Posterior',
          value: 'p(leak | obs) ∝ p(obs | leak) × p(leak)',
          color: 'k-cyan',
        },
        { label: 'Prior', value: 'Beta(α=2, β=2) per sensor cell' },
        { label: 'Update', value: 'Bayesian fold across N independent observations' },
        { label: 'Output', value: '3D posterior field + MAP locus + 95% CI' },
        { label: 'Engine', value: 'src/lib/evidence/HydroBayesianKernel.ts' },
      ],
    },
    Component: HBKPanel,
  },
  {
    id: 'nmbm-sandbox',
    title: 'NMBM Data Sandbox',
    subtitle: 'Pipeline Runner · setup.sh + run.sh',
    desc:
      'Synthetic NMBM sandbox runner that simulates setup.sh + run.sh against a placeholder DMA-7 baseline. Emits a 5-pass audit receipt with 11-field provenance per observation. Every data item carries an explicit SIMULATION / DERIVED / PLACEHOLDER label.',
    icon: TerminalSquare,
    status: 'PARTIAL',
    meta: [
      { label: 'PASSES', value: '5' },
      { label: 'DATA ROWS', value: '8' },
      { label: 'OBS', value: '5' },
    ],
    summary: {
      spec: '08-NMBM-DATA-SANDBOX-SPECIFICATION.md',
      rows: [
        { label: 'Setup', value: 'Creates /sandbox/{data,pipeline,evidence}' },
        { label: 'Pipeline', value: 'Collect → Boundaries → MNF → EIS → Export' },
        { label: 'Receipt', value: 'leak_candidate_audit.json (SHA-256)' },
        { label: 'Classification', value: 'VERIFIED_CANDIDATE · score 1.00' },
        { label: 'Data label', value: 'SIMULATION — NOT MUNICIPAL OPERATIONAL DATA' },
      ],
    },
    Component: NmbmSandbox,
  },
  {
    id: 'air-runtime',
    title: 'AIR Runtime',
    subtitle: 'Audit Integrity Runtime · Live Stream',
    desc:
      'Live event stream + evidence decay tracker. A scrolling log of real-time observations with a half-life indicator (60s) for evidence freshness. Color-coded levels: OBS / ALERT / EIS / ERROR.',
    icon: Radio,
    status: 'EXISTS',
    meta: [
      { label: 'HALF-LIFE', value: '60s' },
      { label: 'EVENTS', value: '~0.5/s' },
      { label: 'EVIDENCE', value: '5' },
    ],
    summary: {
      spec: 'AIR KERNEL Evidence Console (reference)',
      rows: [
        { label: 'Stream', value: 'Real-time observations @ 2s interval' },
        { label: 'Decay model', value: 'Linear freshness 0→0 at 60s' },
        { label: 'Levels', value: 'OBS (cyan) · ALERT (amber) · EIS (green) · ERROR (red)' },
        { label: 'Stats', value: 'events/sec · total · active · avg trust' },
        { label: 'Data label', value: 'SIMULATION STREAM — NOT REAL TELEMETRY' },
      ],
    },
    Component: AirRuntime,
  },
  {
    id: 'field-evidence',
    title: 'Field Evidence',
    subtitle: 'Construction Photos + Vision Pass',
    desc:
      'Construction-site photo gallery with synthetic vision analysis. Each photo carries detected features (surface moisture, corrosion, joint integrity, ground discoloration) with confidence %, correlation to EIS evidence, and a SHA-256 attestation hash.',
    icon: Camera,
    status: 'EXISTS',
    meta: [
      { label: 'PHOTOS', value: '6' },
      { label: 'FEATURES', value: '4/photo' },
      { label: 'VISION', value: 'VVU-FIELD-v0.1' },
    ],
    summary: {
      spec: '04a_WATER_INFRASTRUCTURE_EVIDENCE_LEAKAGE_VALIDATION_BRIEF.md',
      rows: [
        { label: 'Photos', value: '6 inline-SVG placeholders (offline)' },
        { label: 'Features', value: 'moisture · corrosion · joint · discoloration' },
        { label: 'Correlation', value: 'Links photo to EIS evidence chain' },
        { label: 'Attestation', value: 'SHA-256 hash per photo' },
        { label: 'Data label', value: 'SYNTHETIC — NOT REAL VISION PASS' },
      ],
    },
    Component: FieldEvidence,
  },
];

const STATUS_BADGE: Record<Status, string> = {
  EXISTS: 'k-badge-pass',
  PARTIAL: 'k-badge-warn',
};

export default function DataRoom() {
  const [selectedId, setSelectedId] = useState<string | null>(null);

  // ─── Full-screen activity view ─────────────────────────────────────
  if (selectedId) {
    const activity = ACTIVITIES.find((a) => a.id === selectedId);
    if (!activity) {
      setSelectedId(null);
      return null;
    }
    const Icon = activity.icon;
    const ActivityComponent = activity.Component;

    return (
      <div className="kernel-theme min-h-screen flex flex-col k-grid-bg">
        <header className="flex items-center gap-3 px-4 py-3 border-b border-[var(--k-line)] bg-[var(--k-panel)]/80 backdrop-blur sticky top-0 z-30">
          <Button
            variant="outline"
            onClick={() => setSelectedId(null)}
            className="border-[var(--k-line-strong)] text-[var(--k-fg-bright)] hover:bg-[var(--k-panel-2)] hover:text-[var(--k-cyan-bright)]"
            aria-label="Back to activity grid"
          >
            <ArrowLeft className="h-4 w-4 mr-1.5" /> BACK
          </Button>
          <Separator
            orientation="vertical"
            className="h-6 bg-[var(--k-line-strong)]"
          />
          <div className="flex items-center gap-2 min-w-0">
            <Icon className="h-5 w-5 k-cyan shrink-0" />
            <div className="min-w-0">
              <h2 className="text-sm font-bold k-fg-bright uppercase tracking-wider truncate">
                {activity.title}
              </h2>
              <p className="text-[10px] k-dim uppercase tracking-widest truncate">
                {activity.subtitle}
              </p>
            </div>
          </div>
          <div className="ml-auto flex items-center gap-2 flex-wrap">
            <span className={`k-badge ${STATUS_BADGE[activity.status]}`}>
              {activity.status}
            </span>
            {activity.priority && (
              <span className="k-badge k-badge-process">PRIORITY</span>
            )}
            {activity.meta.map((m) => (
              <span
                key={m.label}
                className="k-badge k-badge-dim hidden md:inline-flex"
              >
                {m.label} · {m.value}
              </span>
            ))}
          </div>
        </header>
        <main className="flex-1 min-h-0">
          {ActivityComponent ? (
            <ActivityComponent />
          ) : (
            <SummaryPlaceholder activity={activity} />
          )}
        </main>
        <footer className="mt-auto px-4 py-2 border-t border-[var(--k-line)] bg-[var(--k-panel)] text-center">
          <span className="text-[10px] k-dim uppercase tracking-widest">
            VVU IVE · DATA ROOM · {activity.title.toUpperCase()} · SIMULATION
            DATA · NOT FOR PRODUCTION USE
          </span>
        </footer>
      </div>
    );
  }

  // ─── Activity grid (default view) ──────────────────────────────────
  return (
    <div className="kernel-theme min-h-screen flex flex-col k-grid-bg">
      {/* Header */}
      <header className="px-4 sm:px-6 lg:px-8 py-6 border-b border-[var(--k-line)] bg-[var(--k-panel)]/60 backdrop-blur">
        <div className="flex items-center gap-3 mb-1 flex-wrap">
          <Database className="h-6 w-6 k-cyan" />
          <h1 className="text-xl sm:text-2xl font-bold k-cyan uppercase tracking-wider">
            Data Room
          </h1>
          <span className="k-badge k-badge-process ml-1">VVU IVE</span>
        </div>
        <p className="text-xs sm:text-sm k-dim max-w-3xl">
          Immersive Virtual Environment · evidence ingestion, scoring,
          localization, runtime monitoring, and field verification activities
          for the NMBM water-infrastructure domain. All data is SIMULATION or
          PLACEHOLDER per the Zero Fabrication Mandate.
        </p>
      </header>

      {/* Activity grid */}
      <main className="flex-1 px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 max-w-7xl mx-auto">
          {ACTIVITIES.map((activity) => {
            const Icon = activity.icon;
            return (
              <button
                key={activity.id}
                onClick={() => setSelectedId(activity.id)}
                className={`k-card text-left group transition-all hover:translate-y-[-2px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--k-cyan-bright)] ${
                  activity.priority ? 'k-glow-cyan' : ''
                }`}
                aria-label={`Open ${activity.title} activity`}
              >
                {/* Card header */}
                <div className="flex items-start justify-between mb-3">
                  <div
                    className={`flex items-center justify-center w-12 h-12 rounded-md border ${
                      activity.priority
                        ? 'border-[var(--k-cyan-bright)] bg-[rgba(0,212,255,0.06)]'
                        : 'border-[var(--k-line-strong)] bg-[var(--k-bg-elevated)]'
                    }`}
                  >
                    <Icon
                      className={`h-6 w-6 ${
                        activity.priority ? 'k-cyan' : 'k-fg-bright'
                      }`}
                    />
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <span className={`k-badge ${STATUS_BADGE[activity.status]}`}>
                      {activity.status}
                    </span>
                    {activity.priority && (
                      <span className="k-badge k-badge-process">PRIORITY</span>
                    )}
                    {activity.summaryOnly && (
                      <span className="k-badge k-badge-dim">MAIN WORKSPACE</span>
                    )}
                  </div>
                </div>

                {/* Title + subtitle */}
                <h3 className="text-base font-bold k-fg-bright uppercase tracking-wide mb-0.5">
                  {activity.title}
                </h3>
                <p className="text-[10px] k-cyan uppercase tracking-widest mb-2">
                  {activity.subtitle}
                </p>

                {/* Description */}
                <p className="text-xs k-dim leading-relaxed mb-3 min-h-[6rem]">
                  {activity.desc}
                </p>

                {/* Summary chips */}
                <div className="space-y-1 mb-3">
                  {activity.summary.rows.slice(0, 3).map((row) => (
                    <div
                      key={row.label}
                      className="flex items-center justify-between text-[10px] gap-2"
                    >
                      <span className="k-dim uppercase tracking-wider shrink-0">
                        {row.label}
                      </span>
                      <span
                        className={`font-mono text-right truncate ${
                          row.color ?? 'k-fg'
                        }`}
                        title={row.value}
                      >
                        {row.value}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Footer chips */}
                <div className="flex items-center justify-between pt-3 border-t border-[var(--k-line)]">
                  <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider k-dim flex-wrap">
                    {activity.meta.map((m, i) => (
                      <span key={m.label} className="flex items-center gap-1">
                        {i > 0 && <span>·</span>}
                        <span>{m.label}</span>
                        <span className="k-fg-bright font-bold">{m.value}</span>
                      </span>
                    ))}
                  </div>
                  <span className="text-[10px] k-cyan uppercase tracking-widest font-bold group-hover:translate-x-1 transition-transform">
                    ENTER →
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </main>

      {/* Sticky footer with SIMULATION data label */}
      <footer className="mt-auto px-4 py-2 border-t border-[var(--k-line)] bg-[var(--k-panel)] text-center">
        <span className="text-[10px] k-dim uppercase tracking-widest">
          VVU IVE · DATA ROOM · 5 ACTIVITIES · SIMULATION DATA · NOT FOR
          PRODUCTION USE
        </span>
      </footer>
    </div>
  );
}

// ─── Summary Placeholder (used for EIS + HBK cards) ───────────────────

function SummaryPlaceholder({ activity }: { activity: ActivityDef }) {
  const Icon = activity.icon;
  return (
    <div className="p-4">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 max-w-7xl mx-auto">
        <div className="k-card k-glow-cyan">
          <div className="k-card-title">
            <Icon className="h-4 w-4" /> {activity.title.toUpperCase()} ·
            SUMMARY
          </div>
          <Separator className="mb-3" />
          <p className="text-xs k-dim mb-4 leading-relaxed">{activity.desc}</p>

          <p className="text-[10px] k-dim uppercase tracking-widest mb-2">
            Spec reference
          </p>
          <code className="block text-xs k-cyan font-mono mb-4 p-2 bg-[var(--k-bg-elevated)] border border-[var(--k-line)] rounded break-all">
            {activity.summary.spec}
          </code>

          <p className="text-[10px] k-dim uppercase tracking-widest mb-2">
            Key properties
          </p>
          <div className="space-y-1.5">
            {activity.summary.rows.map((row) => (
              <div
                key={row.label}
                className="flex items-start justify-between gap-3 p-2 bg-[var(--k-bg-elevated)] border border-[var(--k-line)] rounded"
              >
                <span className="text-[10px] k-dim uppercase tracking-wider shrink-0 mt-0.5">
                  {row.label}
                </span>
                <span
                  className={`text-[11px] font-mono text-right break-all ${
                    row.color ?? 'k-fg-bright'
                  }`}
                >
                  {row.value}
                </span>
              </div>
            ))}
          </div>

          <Separator className="my-4" />
          <div className="flex items-center justify-center p-3 border border-[var(--k-amber-bright)]/40 bg-[rgba(255,184,0,0.06)] rounded-md">
            <p className="text-xs k-warn text-center leading-relaxed">
              <span className="font-bold uppercase tracking-wider">
                See main workspace →
              </span>
              <br />
              This activity is rendered in the top-level {activity.title} view
              toggle (EIS WORKSPACE / HBK LOCALIZATION). The Data Room card
              provides this summary reference; the orchestrator wires the
              full-screen integration.
            </p>
          </div>
        </div>

        <div className="k-card">
          <div className="k-card-title">
            <Database className="h-4 w-4" /> ACTIVITY METADATA
          </div>
          <Separator className="mb-3" />
          <div className="grid grid-cols-3 gap-2 mb-4">
            {activity.meta.map((m) => (
              <div
                key={m.label}
                className="flex flex-col items-center justify-center py-2 px-1 rounded border border-[var(--k-line)] bg-[var(--k-bg-elevated)]"
              >
                <span className="text-[9px] k-dim uppercase tracking-widest">
                  {m.label}
                </span>
                <span className="text-base font-bold k-fg-bright">{m.value}</span>
              </div>
            ))}
          </div>

          <p className="text-[10px] k-dim uppercase tracking-widest mb-2">
            Status
          </p>
          <div className="flex items-center gap-2 mb-4">
            <span className={`k-badge ${STATUS_BADGE[activity.status]}`}>
              {activity.status}
            </span>
            {activity.priority && (
              <span className="k-badge k-badge-process">PRIORITY</span>
            )}
            <span className="k-badge k-badge-dim">MAIN WORKSPACE</span>
          </div>

          <Separator className="my-3" />
          <ScrollArea className="max-h-72">
            <pre className="font-mono text-[10px] k-fg leading-relaxed whitespace-pre-wrap">
{`// ─── Engine source ────────────────────────────────
src/lib/evidence/${activity.id === 'eis' ? 'EISv1Engine' : 'HydroBayesianKernel'}.ts

// ─── API route ─────────────────────────────────────
src/app/api/evidence/compute/route.ts

// ─── Data label ────────────────────────────────────
SIMULATION — NOT MUNICIPAL OPERATIONAL DATA

// ─── Zero Fabrication Mandate ──────────────────────
No missing data is ever guessed. Missing fields
are flagged UNDEFINED and dropped from the
observation count, but preserved in the audit trail.
`}
            </pre>
          </ScrollArea>
        </div>
      </div>
    </div>
  );
}

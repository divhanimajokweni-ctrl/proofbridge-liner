'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Crosshair,
  Download,
  Fingerprint,
  Gauge,
  Layers,
  Layers3,
  Pause,
  Play,
  RotateCcw,
  Settings2,
  ShieldCheck,
  SkipForward,
  Terminal,
  Zap,
} from 'lucide-react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  type DMACalibration,
  type EISVerdict,
  type PipelinePass,
  type CorrelatedObservation,
  DEFAULT_CALIBRATION,
} from '@/lib/evidence/EISv1Engine';
import {
  REPLAY_STEPS,
  SCADA_TABLE,
  DMA_ID,
  SEGMENT_ID,
  SCENARIO_DATE,
  type ReplayStep,
} from '@/lib/evidence/hydraulicScenario';
import HBKPanel from '@/components/evidence/hbk-panel';

// ─── API contract ────────────────────────────────────────────────────────

interface ComputeResponse {
  verdict: Omit<EISVerdict, 'observations'>;
  pipeline: PipelinePass[];
  observations: CorrelatedObservation[];
  auditHash: string;
  auditShortHash: string;
  generatedAtUtc: string;
  classification: string;
  calibration: DMACalibration;
  dmaId: string;
}

type View = 'eis' | 'hbk';

// ─── Page ────────────────────────────────────────────────────────────────

export default function Home() {
  const [view, setView] = useState<View>('eis');
  const [calibration, setCalibration] = useState<DMACalibration>(DEFAULT_CALIBRATION);
  const [stepIdx, setStepIdx] = useState(0); // start at BASELINE (index 0)
  const [playing, setPlaying] = useState(false);
  const [pumpSim, setPumpSim] = useState(false); // false-positive toggle
  const [resp, setResp] = useState<ComputeResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const currentStep: ReplayStep = REPLAY_STEPS[stepIdx] ?? REPLAY_STEPS[1];

  // Compute EIS via API whenever calibration, replay step, or pump sim changes.
  const compute = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/evidence/compute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          calibration,
          includeAnomaly: currentStep.includeAnomaly,
          includeField: currentStep.includeField,
          includeAcoustic: currentStep.includeAcoustic,
          includeContext: currentStep.includeContext,
          pumpStateChanged: pumpSim,
        }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = (await res.json()) as ComputeResponse;
      setResp(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Compute failed');
    } finally {
      setLoading(false);
    }
  }, [calibration, currentStep, pumpSim]);

  useEffect(() => {
    void compute();
  }, [compute]);

  // Auto-play the 10-step replay
  useEffect(() => {
    if (!playing) return;
    const id = setInterval(() => {
      setStepIdx((prev) => {
        if (prev >= REPLAY_STEPS.length - 1) {
          setPlaying(false);
          return prev;
        }
        return prev + 1;
      });
    }, 1800);
    return () => clearInterval(id);
  }, [playing]);

  const step = (delta: number) => {
    setStepIdx((prev) =>
      Math.max(0, Math.min(REPLAY_STEPS.length - 1, prev + delta)),
    );
  };

  const reset = () => {
    setPlaying(false);
    setStepIdx(0);
    setPumpSim(false);
    setCalibration(DEFAULT_CALIBRATION);
  };

  const exportAudit = async () => {
    const res = await fetch('/api/evidence/audit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        calibration,
        includeAnomaly: currentStep.includeAnomaly,
        includeField: currentStep.includeField,
        includeAcoustic: currentStep.includeAcoustic,
        includeContext: currentStep.includeContext,
        pumpStateChanged: pumpSim,
      }),
    });
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `leak_candidate_audit_${DMA_ID}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="kernel-theme min-h-screen flex flex-col k-grid-bg">
      <HeaderBar
        view={view}
        onViewChange={setView}
        stepIdx={stepIdx}
        totalSteps={REPLAY_STEPS.length}
        auditShortHash={resp?.auditShortHash ?? '——————'}
        loading={loading}
      />

      <main className="flex-1 px-3 sm:px-6 pb-8 max-w-[1600px] w-full mx-auto">
        {view === 'hbk' ? (
          <HBKPanel />
        ) : (
          <>
            {/* Replay timeline */}
            <ReplayTimeline
              steps={REPLAY_STEPS}
              currentIdx={stepIdx}
              onSelect={(i) => setStepIdx(i)}
            />

            {/* Control bar */}
            <ControlBar
              playing={playing}
              onPlay={() => setPlaying(true)}
              onPause={() => setPlaying(false)}
              onStepFwd={() => step(1)}
              onStepBack={() => step(-1)}
              onReset={reset}
              pumpSim={pumpSim}
              onPumpSimChange={setPumpSim}
              onExport={exportAudit}
              currentStep={currentStep}
            />

            {error && (
              <div className="k-card k-glow-red mt-4 text-sm">
                <span className="k-danger">[ERROR]</span>{' '}
                <span className="k-fg">{error}</span>
              </div>
            )}

            {/* Main grid: 2 columns on lg, 1 col on mobile */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 mt-4">
              {/* Left column: pipeline + calibration */}
              <div className="lg:col-span-4 flex flex-col gap-4">
                <PipelinePanel pipeline={resp?.pipeline ?? []} />
                <CalibrationPanel
                  calibration={calibration}
                  onChange={setCalibration}
                />
              </div>

              {/* Middle column: trust gauge + evidence chain */}
              <div className="lg:col-span-4 flex flex-col gap-4">
                <TrustGaugePanel verdict={resp?.verdict ?? null} loading={loading} />
                <EvidenceChainPanel
                  observations={resp?.observations ?? []}
                  pumpSim={pumpSim}
                />
              </div>

              {/* Right column: SCADA telemetry + audit */}
              <div className="lg:col-span-4 flex flex-col gap-4">
                <ScadaPanel stepIdx={stepIdx} />
                <AuditPanel
                  resp={resp}
                  onExport={exportAudit}
                />
              </div>
            </div>

            {/* Provenance + classification section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-4">
              <ProvenancePanel
                observations={resp?.observations ?? []}
                auditHash={resp?.auditHash ?? '——————'}
                generatedAt={resp?.generatedAtUtc ?? '——————'}
              />
              <ClassificationPanel />
            </div>
          </>
        )}
      </main>

      <FooterBar
        auditShortHash={resp?.auditShortHash ?? '——————'}
        generatedAt={resp?.generatedAtUtc ?? '——————'}
      />
    </div>
  );
}

// ─── Header ───────────────────────────────────────────────────────────────

function HeaderBar({
  view,
  onViewChange,
  stepIdx,
  totalSteps,
  auditShortHash,
  loading,
}: {
  view: View;
  onViewChange: (v: View) => void;
  stepIdx: number;
  totalSteps: number;
  auditShortHash: string;
  loading: boolean;
}) {
  return (
    <header className="border-b border-[var(--k-line)] bg-gradient-to-r from-[rgba(0,212,255,0.08)] via-transparent to-transparent">
      <div className="max-w-[1600px] mx-auto px-3 sm:px-6 py-4">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-md border border-[var(--k-cyan-bright)] flex items-center justify-center k-glow-cyan">
              <Terminal className="w-5 h-5 text-[var(--k-cyan-bright)]" />
            </div>
            <div>
              <h1 className="text-[var(--k-cyan-bright)] font-bold tracking-[0.18em] text-sm sm:text-base uppercase">
                VVU AIR KERNEL
              </h1>
              <p className="text-[var(--k-dim)] text-xs mt-0.5">
                HYDRAULIC VALIDATION UTILITY · {view === 'hbk' ? 'HBK LOCALIZATION' : 'EIS v1.0'} · {DMA_ID}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 text-xs flex-wrap">
            {/* View toggle: EIS Workspace ↔ HBK Localization */}
            <div className="flex items-center gap-0 p-0.5 rounded-md border border-[var(--k-line)] bg-[var(--k-bg-elevated)]">
              <button
                type="button"
                onClick={() => onViewChange('eis')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-[5px] text-[11px] font-bold tracking-wider transition-all ${
                  view === 'eis'
                    ? 'bg-[var(--k-cyan-bright)] text-black'
                    : 'text-[var(--k-dim)] hover:text-[var(--k-fg)]'
                }`}
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                EIS WORKSPACE
              </button>
              <button
                type="button"
                onClick={() => onViewChange('hbk')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-[5px] text-[11px] font-bold tracking-wider transition-all ${
                  view === 'hbk'
                    ? 'bg-[var(--k-cyan-bright)] text-black'
                    : 'text-[var(--k-dim)] hover:text-[var(--k-fg)]'
                }`}
              >
                <Crosshair className="w-3.5 h-3.5" />
                HBK LOCALIZATION
              </button>
            </div>
            {view === 'eis' && (
              <>
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-md border border-[var(--k-line)] bg-[var(--k-bg-elevated)]">
                  <Clock className="w-3.5 h-3.5 text-[var(--k-dim)]" />
                  <span className="text-[var(--k-dim)]">SCENARIO:</span>
                  <span className="text-[var(--k-fg-bright)]">{SCENARIO_DATE}</span>
                </div>
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-md border border-[var(--k-line)] bg-[var(--k-bg-elevated)]">
                  <span className="text-[var(--k-dim)]">STEP</span>
                  <span className="text-[var(--k-cyan-bright)] font-bold">
                    {String(stepIdx + 1).padStart(2, '0')}/{String(totalSteps).padStart(2, '0')}
                  </span>
                </div>
              </>
            )}
            <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-md border border-[var(--k-line)] bg-[var(--k-bg-elevated)]">
              <Fingerprint className="w-3.5 h-3.5 text-[var(--k-green-bright)]" />
              <span className="text-[var(--k-dim)]">RECEIPT</span>
              <span className="text-[var(--k-green-bright)] font-mono">
                0x{auditShortHash}
              </span>
              {loading && (
                <span className="k-cursor text-[var(--k-cyan-bright)] ml-1"></span>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}

// ─── Replay timeline ──────────────────────────────────────────────────────

function ReplayTimeline({
  steps,
  currentIdx,
  onSelect,
}: {
  steps: ReplayStep[];
  currentIdx: number;
  onSelect: (i: number) => void;
}) {
  return (
    <Card className="k-card border-[var(--k-line)] bg-[var(--k-panel)]">
      <CardHeader className="pb-2">
        <CardTitle className="k-card-title">
          <Layers className="w-4 h-4" />
          Hydraulic Incident Replay · 10-Step Sequence
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex gap-1 overflow-x-auto pb-2">
          {steps.map((s, arrayIdx) => {
            const active = arrayIdx === currentIdx;
            const passed = arrayIdx < currentIdx;
            return (
              <button
                key={s.id}
                onClick={() => onSelect(arrayIdx)}
                className={`group flex-shrink-0 flex flex-col items-center gap-1 px-2 py-2 rounded-md border transition-all min-w-[64px] ${
                  active
                    ? 'border-[var(--k-cyan-bright)] k-glow-cyan bg-[rgba(0,212,255,0.06)]'
                    : passed
                      ? 'border-[var(--k-green-bright)]/40 bg-[rgba(0,255,136,0.04)] hover:border-[var(--k-green-bright)]'
                      : 'border-[var(--k-line)] bg-[var(--k-bg-elevated)] hover:border-[var(--k-cyan)]'
                }`}
                title={s.title}
              >
                <span
                  className={`text-[10px] font-bold ${
                    active
                      ? 'text-[var(--k-cyan-bright)]'
                      : passed
                        ? 'text-[var(--k-green-bright)]'
                        : 'text-[var(--k-dim)]'
                  }`}
                >
                  {String(s.id).padStart(2, '0')}
                </span>
                <span
                  className={`text-[9px] uppercase tracking-wider text-center ${
                    active
                      ? 'text-[var(--k-fg-bright)]'
                      : passed
                        ? 'text-[var(--k-green)]'
                        : 'text-[var(--k-dim)]'
                  }`}
                >
                  {s.key}
                </span>
              </button>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Control bar ─────────────────────────────────────────────────────────

function ControlBar({
  playing,
  onPlay,
  onPause,
  onStepFwd,
  onStepBack,
  onReset,
  pumpSim,
  onPumpSimChange,
  onExport,
  currentStep,
}: {
  playing: boolean;
  onPlay: () => void;
  onPause: () => void;
  onStepFwd: () => void;
  onStepBack: () => void;
  onReset: () => void;
  pumpSim: boolean;
  onPumpSimChange: (v: boolean) => void;
  onExport: () => void;
  currentStep: ReplayStep;
}) {
  return (
    <div className="k-card mt-4">
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-1">
          <Button
            size="sm"
            variant="outline"
            onClick={onStepBack}
            disabled={playing}
            className="border-[var(--k-line)] bg-[var(--k-bg-elevated)] text-[var(--k-fg)] hover:bg-[var(--k-panel-2)] hover:text-[var(--k-cyan-bright)]"
          >
            <SkipForward className="w-3.5 h-3.5 rotate-180" /> Back
          </Button>
          {playing ? (
            <Button
              size="sm"
              onClick={onPause}
              className="bg-[var(--k-amber-bright)] text-black hover:bg-[var(--k-amber)]"
            >
              <Pause className="w-3.5 h-3.5" /> Pause
            </Button>
          ) : (
            <Button
              size="sm"
              onClick={onPlay}
              className="bg-[var(--k-green-bright)] text-black hover:bg-[var(--k-green)]"
            >
              <Play className="w-3.5 h-3.5" /> Play
            </Button>
          )}
          <Button
            size="sm"
            variant="outline"
            onClick={onStepFwd}
            disabled={playing}
            className="border-[var(--k-line)] bg-[var(--k-bg-elevated)] text-[var(--k-fg)] hover:bg-[var(--k-panel-2)] hover:text-[var(--k-cyan-bright)]"
          >
            Next <SkipForward className="w-3.5 h-3.5" />
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={onReset}
            className="border-[var(--k-line)] bg-[var(--k-bg-elevated)] text-[var(--k-fg)] hover:bg-[var(--k-panel-2)] hover:text-[var(--k-red-bright)]"
          >
            <RotateCcw className="w-3.5 h-3.5" /> Reset
          </Button>
        </div>

        <Separator orientation="vertical" className="h-6 bg-[var(--k-line)]" />

        <div className="flex items-center gap-2">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex items-center gap-2">
                  <Switch
                    checked={pumpSim}
                    onCheckedChange={onPumpSimChange}
                  />
                  <Label className="text-xs cursor-pointer text-[var(--k-fg)]">
                    <Zap className="w-3 h-3 inline mr-1 text-[var(--k-amber-bright)]" />
                    Inject pump event
                  </Label>
                </div>
              </TooltipTrigger>
              <TooltipContent className="bg-[var(--k-panel)] border-[var(--k-line)] text-[var(--k-fg)]">
                <p className="text-xs">
                  Toggles a pump-status change in the operating context.
                  <br />
                  EIS rule: PRIMARY + pump_context → REJECTED_FALSE_POSITIVE.
                </p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>

        <Separator orientation="vertical" className="h-6 bg-[var(--k-line)]" />

        <div className="flex-1 min-w-[200px]">
          <div className="text-[10px] uppercase tracking-wider text-[var(--k-dim)] mb-1">
            Current step
          </div>
          <div className="text-xs text-[var(--k-fg-bright)] truncate">
            <span className="k-cyan">[{currentStep.key}]</span>{' '}
            {currentStep.title.replace(/^\d+\.\s*/, '')}
          </div>
        </div>

        <Button
          size="sm"
          onClick={onExport}
          className="bg-[var(--k-cyan-bright)] text-black hover:bg-[var(--k-cyan)]"
        >
          <Download className="w-3.5 h-3.5" /> Export audit receipt
        </Button>
      </div>
      <div className="mt-3 pt-3 border-t border-[var(--k-line)]">
        <div className="text-xs text-[var(--k-fg)]">
          <span className="k-dim">{'// '}</span>
          {currentStep.description}
        </div>
        <div className="text-[10px] mt-1 text-[var(--k-green-bright)]">
          ▸ {currentStep.annotation}
        </div>
      </div>
    </div>
  );
}

// ─── Pipeline panel ──────────────────────────────────────────────────────

function PipelinePanel({ pipeline }: { pipeline: PipelinePass[] }) {
  return (
    <Card className="k-card border-[var(--k-line)] bg-[var(--k-panel)]">
      <CardHeader className="pb-2">
        <CardTitle className="k-card-title">
          <Activity className="w-4 h-4" />
          5-Pass Validation Pipeline
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {pipeline.map((p) => {
          const badge =
            p.status === 'pass' ? (
              <Badge className="k-badge k-badge-pass">
                <CheckCircle2 className="w-2.5 h-2.5" /> PASS
              </Badge>
            ) : p.status === 'process' ? (
              <Badge className="k-badge k-badge-process">
                <Activity className="w-2.5 h-2.5" /> RUNNING
              </Badge>
            ) : p.status === 'fail' ? (
              <Badge className="k-badge k-badge-danger">
                <AlertTriangle className="w-2.5 h-2.5" /> FAIL
              </Badge>
            ) : (
              <Badge className="k-badge k-badge-dim">PENDING</Badge>
            );
          return (
            <div
              key={p.id}
              className={`flex items-start gap-3 p-2 rounded-md border transition-all ${
                p.status === 'pass'
                  ? 'border-[var(--k-green-bright)]/30 bg-[rgba(0,255,136,0.04)]'
                  : p.status === 'process'
                    ? 'border-[var(--k-cyan-bright)]/40 bg-[rgba(0,212,255,0.05)]'
                    : p.status === 'fail'
                      ? 'border-[var(--k-red-bright)]/40 bg-[rgba(255,77,77,0.05)]'
                      : 'border-[var(--k-line)] bg-[var(--k-bg-elevated)]'
              }`}
            >
              <div className="text-xs font-bold w-6 text-center text-[var(--k-dim)]">
                {p.id}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-semibold text-[var(--k-fg-bright)]">
                    {p.name}
                  </span>
                  {badge}
                </div>
                <div className="text-[10px] text-[var(--k-dim)] mt-1 leading-snug">
                  {p.description}
                </div>
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}

// ─── Calibration panel ───────────────────────────────────────────────────

function CalibrationPanel({
  calibration,
  onChange,
}: {
  calibration: DMACalibration;
  onChange: (c: DMACalibration) => void;
}) {
  const update = (patch: Partial<DMACalibration>) =>
    onChange({ ...calibration, ...patch });

  return (
    <Card className="k-card border-[var(--k-line)] bg-[var(--k-panel)]">
      <CardHeader className="pb-2">
        <CardTitle className="k-card-title">
          <Settings2 className="w-4 h-4" />
          DMA Calibration (live)
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <CalibSlider
          label="Flow Deviation Threshold"
          value={calibration.flowDeviationThresholdPct}
          min={1}
          max={50}
          step={1}
          unit="%"
          hint="Minimum flow deviation to flag anomaly (default 10%)"
          onChange={(v) => update({ flowDeviationThresholdPct: v })}
        />
        <CalibSlider
          label="Pressure Drop Threshold"
          value={calibration.pressureDropThresholdPct}
          min={1}
          max={30}
          step={1}
          unit="%"
          hint="Minimum pressure drop to correlate (default 5%)"
          onChange={(v) => update({ pressureDropThresholdPct: v })}
        />
        <CalibSlider
          label="Correlation Time Window"
          value={calibration.correlationTimeWindowMin}
          min={1}
          max={1440}
          step={5}
          unit="min"
          hint="Max time gap for correlation (default 60 min)"
          onChange={(v) => update({ correlationTimeWindowMin: v })}
        />
        <div className="flex items-center justify-between pt-2 border-t border-[var(--k-line)]">
          <Label className="text-xs text-[var(--k-fg)]">
            Reject on pump context match
          </Label>
          <Switch
            checked={calibration.rejectOnPumpContextMatch}
            onCheckedChange={(v) => update({ rejectOnPumpContextMatch: v })}
          />
        </div>
        <div className="text-[10px] text-[var(--k-dim)] pt-1">
          EIS rule: if PRIMARY + pump_context → REJECTED_FALSE_POSITIVE.
          Parameters serialized into audit receipt for reproducibility.
        </div>
      </CardContent>
    </Card>
  );
}

function CalibSlider({
  label,
  value,
  min,
  max,
  step,
  unit,
  hint,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  unit: string;
  hint: string;
  onChange: (v: number) => void;
}) {
  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <Label className="text-xs text-[var(--k-fg)]">{label}</Label>
        <span className="text-xs font-mono k-cyan font-bold">
          {value}
          <span className="text-[var(--k-dim)] ml-0.5">{unit}</span>
        </span>
      </div>
      <Slider
        value={[value]}
        min={min}
        max={max}
        step={step}
        onValueChange={(v) => onChange(v[0] ?? value)}
        className="[&_[role=slider]]:bg-[var(--k-cyan-bright)] [&_[role=slider]]:border-[var(--k-cyan-bright)] [&_.bg-primary]:bg-[var(--k-cyan-bright)]"
      />
      <div className="text-[10px] text-[var(--k-dim)] mt-1">{hint}</div>
    </div>
  );
}

// ─── Trust gauge ─────────────────────────────────────────────────────────

function TrustGaugePanel({
  verdict,
  loading,
}: {
  verdict: Omit<EISVerdict, 'observations'> | null;
  loading: boolean;
}) {
  const score = verdict?.score ?? 0;
  const threshold = verdict?.threshold ?? 0.8;
  const pct = Math.round(score * 100);
  const thresholdPct = Math.round(threshold * 100);

  const verdictLabel = verdict?.verdict ?? 'INSUFFICIENT_EVIDENCE';
  const verdictClass =
    verdictLabel === 'VERIFIED_CANDIDATE'
      ? 'k-pass'
      : verdictLabel === 'REJECTED_FALSE_POSITIVE'
        ? 'k-danger'
        : 'k-warn';
  const verdictIcon =
    verdictLabel === 'VERIFIED_CANDIDATE' ? (
      <ShieldCheck className="w-4 h-4" />
    ) : verdictLabel === 'REJECTED_FALSE_POSITIVE' ? (
      <AlertTriangle className="w-4 h-4" />
    ) : (
      <Gauge className="w-4 h-4" />
    );

  return (
    <Card
      className={`k-card border-[var(--k-line)] bg-[var(--k-panel)] ${
        verdictLabel === 'VERIFIED_CANDIDATE'
          ? 'k-glow-green'
          : verdictLabel === 'REJECTED_FALSE_POSITIVE'
            ? 'k-glow-red'
            : ''
      }`}
    >
      <CardHeader className="pb-2">
        <CardTitle className="k-card-title">
          <Gauge className="w-4 h-4" />
          EIS v1.0 Trust Score
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="k-trust-bar">
          <div
            className="k-trust-bar-fill"
            style={{ width: `${pct}%` }}
          />
          <div
            className="k-trust-bar-threshold"
            style={{ left: `${thresholdPct}%` }}
            title={`Threshold ${thresholdPct}%`}
          />
          <div className="absolute inset-0 flex items-center justify-center text-xs font-bold text-[var(--k-fg-bright)]">
            {loading ? (
              <span className="k-cursor text-[var(--k-cyan-bright)]"></span>
            ) : (
              score.toFixed(2)
            )}
          </div>
        </div>
        <div className="flex justify-between text-[10px] text-[var(--k-dim)] mt-1">
          <span>0.00</span>
          <span className="text-[var(--k-amber-bright)]">
            ▲ threshold {threshold.toFixed(2)}
          </span>
          <span>1.00</span>
        </div>

        <div className="mt-4 flex items-center justify-center gap-2">
          <span className={verdictClass}>{verdictIcon}</span>
          <span className={`text-sm font-bold tracking-wider ${verdictClass}`}>
            {verdictLabel}
          </span>
        </div>

        {/* Weight breakdown */}
        <div className="mt-4 pt-3 border-t border-[var(--k-line)] space-y-1.5">
          <WeightRow
            label="PRIMARY (flow)"
            weight={0.3}
            active={!!verdict?.hasPrimary}
          />
          <WeightRow
            label="CORRELATED (pressure)"
            weight={0.2}
            active={!!verdict?.hasCorrelated}
          />
          <WeightRow
            label="INDEPENDENT (field+acoustic)"
            weight={0.5}
            active={!!verdict?.hasIndependent}
            cap
          />
          <WeightRow
            label="CONTEXTUAL (pump/valve)"
            weight={0}
            active={!!verdict?.hasContextual}
            neutral
          />
        </div>

        {verdict?.rejectedReason && (
          <div className="mt-3 pt-3 border-t border-[var(--k-line)]">
            <div className="text-[10px] uppercase tracking-wider text-[var(--k-dim)] mb-1">
              {verdict.verdict === 'VERIFIED_CANDIDATE'
                ? 'Result'
                : 'Rejection reason'}
            </div>
            <div className={`text-xs ${verdictClass}`}>
              {verdict.rejectedReason}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function WeightRow({
  label,
  weight,
  active,
  cap,
  neutral,
}: {
  label: string;
  weight: number;
  active: boolean;
  cap?: boolean;
  neutral?: boolean;
}) {
  return (
    <div className="flex items-center justify-between text-xs">
      <div className="flex items-center gap-2">
        <span
          className={`w-1.5 h-1.5 rounded-full ${
            active
              ? neutral
                ? 'bg-[var(--k-amber-bright)]'
                : 'bg-[var(--k-green-bright)]'
              : 'bg-[var(--k-dim)]'
          }`}
        />
        <span className={active ? 'text-[var(--k-fg-bright)]' : 'text-[var(--k-dim)]'}>
          {label}
        </span>
      </div>
      <span
        className={`font-mono font-bold ${
          active
            ? neutral
              ? 'text-[var(--k-amber-bright)]'
              : 'text-[var(--k-green-bright)]'
            : 'text-[var(--k-dim)]'
        }`}
      >
        {active ? `+${weight.toFixed(2)}${cap ? ' (cap)' : ''}` : '0.00'}
      </span>
    </div>
  );
}

// ─── Evidence chain panel ────────────────────────────────────────────────

function EvidenceChainPanel({
  observations,
  pumpSim,
}: {
  observations: CorrelatedObservation[];
  pumpSim: boolean;
}) {
  return (
    <Card className="k-card border-[var(--k-line)] bg-[var(--k-panel)]">
      <CardHeader className="pb-2">
        <CardTitle className="k-card-title">
          <ShieldCheck className="w-4 h-4" />
          Corroborating Evidence
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="max-h-[420px] pr-2">
          <div className="space-y-2">
            {observations.length === 0 && (
              <div className="text-xs text-[var(--k-dim)] italic">
                No observations loaded — step the replay to introduce evidence.
              </div>
            )}
            {observations.map((o, i) => (
              <EvidenceItem key={`${o.observation.provenance.sensorId}-${i}`} o={o} />
            ))}
            {pumpSim && (
              <div className="text-xs k-danger border border-[var(--k-red-bright)]/30 bg-[rgba(255,77,77,0.05)] rounded-md p-2">
                <AlertTriangle className="w-3 h-3 inline mr-1" />
                Pump status change detected — false-positive rule fired.
              </div>
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}

function EvidenceItem({ o }: { o: CorrelatedObservation }) {
  const cls = o.evidenceClass;
  const badgeClass =
    cls === 'PRIMARY'
      ? 'k-badge-process'
      : cls === 'CORRELATED'
        ? 'k-badge-warn'
        : cls === 'INDEPENDENT'
          ? 'k-badge-pass'
          : cls === 'CONTEXTUAL'
            ? 'k-badge-dim'
            : 'k-badge-dim';
  return (
    <div className="border border-[var(--k-line)] bg-[var(--k-bg-elevated)] rounded-md p-2 hover:border-[var(--k-cyan)]/50 transition-colors">
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-bold text-[var(--k-fg-bright)]">
          {o.observation.provenance.measurementType}
        </span>
        <Badge className={`k-badge ${badgeClass}`}>{cls}</Badge>
      </div>
      <div className="text-[10px] text-[var(--k-dim)] mt-1 font-mono">
        {o.observation.provenance.sensorId}
      </div>
      <div className="text-[11px] text-[var(--k-fg)] mt-1">
        <span className="k-dim">value:</span>{' '}
        <span className="text-[var(--k-cyan-bright)] font-mono">
          {o.observation.value === null
            ? 'UNDEFINED'
            : `${o.observation.value} ${o.observation.unit}`}
        </span>
        {o.observation.baseline !== null &&
          o.observation.baseline !== undefined && (
            <>
              {' '}
              <span className="k-dim">| baseline:</span>{' '}
              <span className="text-[var(--k-dim)] font-mono">
                {o.observation.baseline} {o.observation.unit}
              </span>
            </>
          )}
      </div>
      {o.anomaly.isAnomalous && (
        <div className="text-[10px] k-warn mt-1">▸ {o.anomaly.signature}</div>
      )}
      <div className="text-[10px] text-[var(--k-dim)] mt-1 italic leading-snug">
        {o.rationale}
      </div>
      <div className="text-[10px] text-[var(--k-dim)] mt-1 font-mono">
        attn: {o.observation.provenance.attestationHash}
      </div>
    </div>
  );
}

// ─── SCADA panel ─────────────────────────────────────────────────────────

function ScadaPanel({ stepIdx }: { stepIdx: number }) {
  // Show all SCADA rows; highlight rows up to current replay step.
  // stepIdx is 0-based array index (0 = BASELINE, 1 = ANOMALY, etc.)
  // stepIdx 0 (BASELINE) shows rows 0-3 (00:00-03:00)
  // stepIdx 1+ (ANOMALY) shows rows 0-6 (incl. 04:00-06:00 anomaly)
  // stepIdx 3+ shows the full table including IMPOSSIBLE/MISSING
  const visibleRows = stepIdx >= 1 ? SCADA_TABLE : SCADA_TABLE.slice(0, 4);
  const showQualityCases = stepIdx >= 3;

  return (
    <Card className="k-card border-[var(--k-line)] bg-[var(--k-panel)]">
      <CardHeader className="pb-2">
        <CardTitle className="k-card-title">
          <Activity className="w-4 h-4" />
          SCADA Telemetry ({DMA_ID})
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="text-left text-[var(--k-dim)] border-b border-[var(--k-line)]">
                <th className="py-1.5 pr-3 font-normal uppercase tracking-wider text-[10px]">Time</th>
                <th className="py-1.5 pr-3 font-normal uppercase tracking-wider text-[10px]">Flow (L/s)</th>
                <th className="py-1.5 pr-3 font-normal uppercase tracking-wider text-[10px]">Pressure (m)</th>
                <th className="py-1.5 font-normal uppercase tracking-wider text-[10px]">Status</th>
              </tr>
            </thead>
            <tbody>
              {visibleRows.map((row) => {
                let statusClass = 'k-pass';
                let statusLabel = row.status;
                if (row.status === 'ANOMALY') {
                  statusClass = 'k-warn';
                } else if (row.status === 'IMPOSSIBLE') {
                  statusClass = 'k-danger';
                } else if (row.status === 'MISSING') {
                  statusClass = 'k-dim';
                }
                return (
                  <tr
                    key={row.timeUtc}
                    className="border-b border-[var(--k-line)]/50 hover:bg-[var(--k-bg-elevated)]"
                  >
                    <td className="py-1.5 pr-3 font-mono text-[var(--k-fg-bright)]">
                      {row.timeUtc}
                    </td>
                    <td className="py-1.5 pr-3 font-mono">
                      {row.flow === null ? (
                        <span className="k-dim italic">UNDEFINED</span>
                      ) : row.flow < 0 ? (
                        <span className={statusClass}>{row.flow.toFixed(1)}</span>
                      ) : (
                        <span className="text-[var(--k-fg)]">
                          {row.flow.toFixed(1)}
                        </span>
                      )}
                    </td>
                    <td className="py-1.5 pr-3 font-mono text-[var(--k-fg)]">
                      {row.pressure.toFixed(1)}
                    </td>
                    <td className={`py-1.5 font-bold ${statusClass}`}>
                      {statusLabel}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {showQualityCases && (
          <div className="mt-3 pt-3 border-t border-[var(--k-line)]">
            <div className="text-[10px] uppercase tracking-wider k-dim mb-1.5">
              Zero Fabrication Rule
            </div>
            <div className="text-[11px] text-[var(--k-fg)] leading-snug">
              <span className="k-danger">07:00 → IMPOSSIBLE_PHYSICS</span>{' '}
              (-999 L/s) rejected by quality gate.
              <br />
              <span className="k-dim">08:00 → MISSING</span>{' '}
              preserved as UNDEFINED, never guessed.
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ─── Audit panel ─────────────────────────────────────────────────────────

function AuditPanel({
  resp,
  onExport,
}: {
  resp: ComputeResponse | null;
  onExport: () => void;
}) {
  return (
    <Card className="k-card border-[var(--k-line)] bg-[var(--k-panel)]">
      <CardHeader className="pb-2">
        <CardTitle className="k-card-title">
          <Fingerprint className="w-4 h-4" />
          Audit Receipt (SHA-256)
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2 text-xs">
          <AuditRow
            label="DMA"
            value={resp?.dmaId ?? DMA_ID}
          />
          <AuditRow
            label="Generated (UTC)"
            value={resp?.generatedAtUtc ?? '——————'}
          />
          <AuditRow
            label="Verdict"
            value={resp?.verdict.verdict ?? '——————'}
            highlight={
              resp?.verdict.verdict === 'VERIFIED_CANDIDATE'
                ? 'pass'
                : resp?.verdict.verdict === 'REJECTED_FALSE_POSITIVE'
                  ? 'fail'
                  : 'warn'
            }
          />
          <AuditRow
            label="Score"
            value={(resp?.verdict.score ?? 0).toFixed(2)}
            highlight="cyan"
          />
          <AuditRow
            label="Threshold"
            value={(resp?.verdict.threshold ?? 0.8).toFixed(2)}
          />
          <AuditRow
            label="Observations"
            value={String(resp?.observations.length ?? 0)}
          />
          <div className="pt-2 border-t border-[var(--k-line)]">
            <div className="text-[10px] uppercase tracking-wider k-dim mb-1">
              Receipt hash
            </div>
            <div className="font-mono text-[11px] text-[var(--k-green-bright)] break-all k-glow-green p-2 rounded-md border border-[var(--k-green-bright)]/20 bg-[rgba(0,255,136,0.03)]">
              0x{resp?.auditHash ?? '——————————————————————————————————————————————————'}
            </div>
          </div>
          <Button
            size="sm"
            onClick={onExport}
            className="w-full mt-2 bg-[var(--k-cyan-bright)] text-black hover:bg-[var(--k-cyan)]"
          >
            <Download className="w-3.5 h-3.5 mr-1" /> Download JSON receipt
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function AuditRow({
  label,
  value,
  highlight,
}: {
  label: string;
  value: string;
  highlight?: 'pass' | 'fail' | 'warn' | 'cyan';
}) {
  const color =
    highlight === 'pass'
      ? 'k-pass'
      : highlight === 'fail'
        ? 'k-danger'
        : highlight === 'warn'
          ? 'k-warn'
          : highlight === 'cyan'
            ? 'k-cyan'
            : 'text-[var(--k-fg-bright)]';
  return (
    <div className="flex items-center justify-between gap-2">
      <span className="k-dim">{label}</span>
      <span className={`font-mono ${color}`}>{value}</span>
    </div>
  );
}

// ─── Provenance panel ────────────────────────────────────────────────────

function ProvenancePanel({
  observations,
  auditHash,
  generatedAt,
}: {
  observations: CorrelatedObservation[];
  auditHash: string;
  generatedAt: string;
}) {
  return (
    <Card className="k-card border-[var(--k-line)] bg-[var(--k-panel)]">
      <CardHeader className="pb-2">
        <CardTitle className="k-card-title">
          <Layers className="w-4 h-4" />
          Provenance Chain · 11-Field Spine
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="max-h-[320px] pr-2">
          <div className="space-y-3">
            {observations.length === 0 && (
              <div className="text-xs text-[var(--k-dim)] italic">
                No provenance records — step the replay to introduce observations.
              </div>
            )}
            {observations.map((o, i) => {
              const p = o.observation.provenance;
              return (
                <div
                  key={`${p.sensorId}-${i}`}
                  className="border-l-2 border-[var(--k-green-bright)]/50 pl-3"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-[var(--k-fg-bright)]">
                      {p.sensorId}
                    </span>
                    <Badge className="k-badge k-badge-dim">{p.measurementType}</Badge>
                  </div>
                  <div className="grid grid-cols-2 gap-x-3 gap-y-0.5 text-[10px] mt-1.5 font-mono">
                    <ProvenanceField k="01 sensorId" v={p.sensorId} />
                    <ProvenanceField k="02 firmware" v={p.firmwareVersion} />
                    <ProvenanceField k="03 calEpoch" v={p.calibrationEpoch} />
                    <ProvenanceField k="04 tsUtc" v={p.timestampUtc} />
                    <ProvenanceField k="05 location" v={p.location} />
                    <ProvenanceField k="06 dmaId" v={p.dmaId} />
                    <ProvenanceField
                      k="07 temp"
                      v={`${p.environmentalContext.temperatureC ?? 'null'} °C`}
                    />
                    <ProvenanceField
                      k="08 rain"
                      v={`${p.environmentalContext.rainfallMm ?? 'null'} mm`}
                    />
                    <ProvenanceField
                      k="09 ground"
                      v={p.environmentalContext.groundCondition ?? 'null'}
                    />
                    <ProvenanceField k="10 pipeline" v={p.processingPipeline} />
                    <ProvenanceField k="11 quality" v={p.qualityFlag} />
                  </div>
                  <div className="text-[10px] k-dim font-mono mt-1">
                    attn: <span className="text-[var(--k-green-bright)]">{p.attestationHash}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </ScrollArea>
        <div className="mt-3 pt-3 border-t border-[var(--k-line)] text-[10px] k-dim">
          Receipt {auditHash.slice(0, 24)}… · generated {generatedAt}
        </div>
      </CardContent>
    </Card>
  );
}

function ProvenanceField({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex gap-2">
      <span className="k-dim shrink-0">{k}</span>
      <span className="text-[var(--k-fg)] truncate">{v}</span>
    </div>
  );
}

// ─── Classification panel ────────────────────────────────────────────────

function ClassificationPanel() {
  return (
    <Card className="k-card border-[var(--k-line)] bg-[var(--k-panel)]">
      <CardHeader className="pb-2">
        <CardTitle className="k-card-title">
          <AlertTriangle className="w-4 h-4" />
          Data Classification & Honest Position
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 text-xs">
        <div className="border border-[var(--k-amber-bright)]/30 bg-[rgba(255,184,0,0.05)] rounded-md p-2.5">
          <div className="font-bold k-warn uppercase tracking-wider text-[10px] mb-1">
            Classification
          </div>
          <div className="text-[11px] text-[var(--k-fg)] leading-snug">
            SIMULATION — NOT MUNICIPAL OPERATIONAL DATA.
            <br />
            All observations in this demonstration are VVU-generated synthetic
            hydraulic time series for the {DMA_ID} demo. No real DWS / NMBM data
            has been provided or processed.
          </div>
        </div>

        <div className="border border-[var(--k-line)] bg-[var(--k-bg-elevated)] rounded-md p-2.5">
          <div className="font-bold k-cyan uppercase tracking-wider text-[10px] mb-1.5">
            Evidence States (EIS v1.0)
          </div>
          <div className="grid grid-cols-2 gap-1.5 text-[11px]">
            <StateRow color="pass" label="VALID" desc="Within physical range" />
            <StateRow color="dim" label="MISSING" desc="≥17 min gap → UNDEFINED" />
            <StateRow color="danger" label="ANOMALOUS" desc="Impossible physics" />
            <StateRow color="warn" label="CORRELATED" desc="Same DMA + type + window" />
            <StateRow color="pass" label="INDEPENDENT" desc="Different principle" />
            <StateRow color="dim" label="INSUFFICIENT" desc="Below threshold" />
          </div>
        </div>

        <div className="border border-[var(--k-line)] bg-[var(--k-bg-elevated)] rounded-md p-2.5">
          <div className="font-bold k-cyan uppercase tracking-wider text-[10px] mb-1.5">
            What this demo is — and is not
          </div>
          <ul className="space-y-1 text-[11px] text-[var(--k-fg)]">
            <li>
              <span className="k-pass">✓</span> Evidence-verification layer for sparse observations
            </li>
            <li>
              <span className="k-pass">✓</span> Independence scoring (prevents evidence inflation)
            </li>
            <li>
              <span className="k-pass">✓</span> 11-field provenance + SHA-256 audit trail
            </li>
            <li>
              <span className="k-danger">✗</span> NOT a SCADA replacement
            </li>
            <li>
              <span className="k-danger">✗</span> NOT an autonomous leak detector
            </li>
            <li>
              <span className="k-danger">✗</span> NOT validated against municipal operational data
            </li>
          </ul>
        </div>

        <div className="text-[10px] k-dim italic border-t border-[var(--k-line)] pt-2">
          Reference: 01a executive brief · 02c EIS v1.0 spec · 04a validation brief ·{' '}
          10 72-hour protocol. DMA = {DMA_ID} · Segment = {SEGMENT_ID}.
        </div>
      </CardContent>
    </Card>
  );
}

function StateRow({
  color,
  label,
  desc,
}: {
  color: 'pass' | 'warn' | 'danger' | 'dim';
  label: string;
  desc: string;
}) {
  const cls =
    color === 'pass'
      ? 'k-pass'
      : color === 'warn'
        ? 'k-warn'
        : color === 'danger'
          ? 'k-danger'
          : 'k-dim';
  return (
    <div className="flex flex-col gap-0.5">
      <span className={`font-bold ${cls}`}>{label}</span>
      <span className="text-[10px] k-dim">{desc}</span>
    </div>
  );
}

// ─── Footer (sticky) ─────────────────────────────────────────────────────

function FooterBar({
  auditShortHash,
  generatedAt,
}: {
  auditShortHash: string;
  generatedAt: string;
}) {
  return (
    <footer className="mt-auto border-t border-[var(--k-line)] bg-[var(--k-bg-elevated)]">
      <div className="max-w-[1600px] mx-auto px-3 sm:px-6 py-3 flex flex-wrap items-center justify-between gap-2 text-[10px]">
        <div className="flex items-center gap-3 flex-wrap">
          <span className="k-warn font-bold uppercase tracking-wider">
            [SIMULATION — NOT MUNICIPAL OPERATIONAL DATA]
          </span>
          <span className="k-dim">|</span>
          <span className="k-dim">Zero Fabrication Rule active</span>
          <span className="k-dim">|</span>
          <span className="k-dim">
            Audit: <span className="text-[var(--k-green-bright)] font-mono">0x{auditShortHash}</span>
          </span>
        </div>
        <div className="k-dim">
          VVU AIR KERNEL · EIS v1.0 · {generatedAt.slice(0, 19)}Z · DMA {DMA_ID}
        </div>
      </div>
    </footer>
  );
}

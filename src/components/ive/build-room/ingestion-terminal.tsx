'use client';

/**
 * Ingestion Terminal — drag-drop file ingestion + DRC table + 5-pass pipeline
 * ---------------------------------------------------------------------------
 * A simplified simulation of the VRES ingestion flow:
 *
 * 1. User drops a file (any) onto the drop zone.
 * 2. Terminal log emits [INFO]/[OK]/[PASS1..5]/[DONE] lines.
 * 3. 5 mock observations are generated (random sensor IDs, VALID / MISSING /
 *    ANOMALY quality flags) and appended to the DRC table.
 * 4. "RUN PIPELINE" button runs the 5-pass validation pipeline
 *    (Collect → Boundaries → Baseline → EIS → Export) with a progress bar.
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Upload,
  Terminal as TerminalIcon,
  Database,
  ShieldCheck,
  Play,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  XCircle,
} from 'lucide-react';

// ─── Types ─────────────────────────────────────────────────────────────

type QualityFlag = 'VALID' | 'MISSING' | 'ANOMALY';
type LineLevel = 'INFO' | 'OK' | 'PASS' | 'WARN' | 'DONE' | 'ERR';

interface TerminalLine {
  level: LineLevel;
  text: string;
  ts: number;
}

interface Observation {
  id: string;
  sensor: string;
  type: string;
  quality: QualityFlag;
  status: 'INGESTED' | 'QUEUED';
}

interface PipelineStage {
  id: number;
  name: string;
  description: string;
}

// ─── Static data ───────────────────────────────────────────────────────

const SENSOR_POOL = ['FLOW_001', 'PRESS_002', 'BR_N_003', 'BR_S_004', 'ACO_005', 'FLD_006'];
const TYPE_POOL = ['SCADA_FLOW', 'SCADA_PRESS', 'ACOUSTIC', 'FIELD_INSPECTION', 'PUMP_STATUS'];

const PIPELINE_STAGES: PipelineStage[] = [
  { id: 1, name: 'Collect', description: 'Collect & Normalize timestamps' },
  { id: 2, name: 'Boundaries', description: 'Physical boundary checks (Q-gate ≥ 0.7)' },
  { id: 3, name: 'Baseline', description: 'MNF baseline subtraction (00:00–04:00)' },
  { id: 4, name: 'EIS', description: 'Evidence Independence Scoring v1.0' },
  { id: 5, name: 'Export', description: 'Audit receipt SHA-256 + JSON export' },
];

const LEVEL_COLOR: Record<LineLevel, string> = {
  INFO: 'k-dim',
  OK: 'k-pass',
  PASS: 'k-cyan',
  WARN: 'k-warn',
  DONE: 'k-pass',
  ERR: 'k-danger',
};

const QUALITY_BADGE: Record<QualityFlag, { cls: string; icon: typeof CheckCircle2 }> = {
  VALID: { cls: 'k-badge-pass', icon: CheckCircle2 },
  MISSING: { cls: 'k-badge-warn', icon: AlertTriangle },
  ANOMALY: { cls: 'k-badge-danger', icon: XCircle },
};

// ─── Component ─────────────────────────────────────────────────────────

export default function IngestionTerminal() {
  const [lines, setLines] = useState<TerminalLine[]>([
    { level: 'INFO', text: 'Ingestion terminal online. Awaiting file drop...', ts: Date.now() },
  ]);
  const [observations, setObservations] = useState<Observation[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [pipelineRunning, setPipelineRunning] = useState(false);
  const [pipelineProgress, setPipelineProgress] = useState(0);
  const [pipelineStage, setPipelineStage] = useState<string>('IDLE');
  const [pipelineDone, setPipelineDone] = useState(false);

  const terminalEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll the terminal to the bottom whenever lines change
  useEffect(() => {
    terminalEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [lines]);

  const pushLine = useCallback((level: LineLevel, text: string) => {
    setLines((prev) => [...prev, { level, text, ts: Date.now() }].slice(-200));
  }, []);

  // ─── File drop handler ──────────────────────────────────────────────
  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const files = Array.from(e.dataTransfer.files);
      if (files.length === 0) {
        // Fallback — simulate a fake drop for the demo even with no actual file
        const fakeName = `observation_${Date.now() % 10000}.csv`;
        const fakeSize = 1024 + Math.floor(Math.random() * 4096);
        pushLine('OK', `${fakeName} received (${fakeSize} bytes)`);
        spawnObservations(pushLine, setObservations);
        return;
      }
      files.forEach((file) => {
        pushLine('OK', `${file.name} received (${file.size} bytes)`);
      });
      spawnObservations(pushLine, setObservations);
    },
    [pushLine],
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  // ─── Run pipeline (5 passes with simulated delays + progress) ───────
  const runPipeline = useCallback(async () => {
    if (pipelineRunning) return;
    if (observations.length === 0) {
      pushLine('WARN', 'No observations to process — drop a file first.');
      return;
    }
    setPipelineRunning(true);
    setPipelineDone(false);
    setPipelineProgress(0);
    pushLine('INFO', 'Pipeline initiated — 5-pass validation starting...');

    for (let i = 0; i < PIPELINE_STAGES.length; i++) {
      const stage = PIPELINE_STAGES[i];
      setPipelineStage(stage.name.toUpperCase());
      pushLine('PASS', `Pass ${stage.id} — ${stage.name}: ${stage.description}`);
      // Simulate stage work — animate progress bar in small increments
      const stageStart = (i / PIPELINE_STAGES.length) * 100;
      const stageEnd = ((i + 1) / PIPELINE_STAGES.length) * 100;
      const steps = 6;
      for (let s = 0; s < steps; s++) {
        const t = stageStart + ((stageEnd - stageStart) * (s + 1)) / steps;
        setPipelineProgress(Math.min(100, t));
        await sleep(120);
      }
      // Mark each observation as processed through this pass
      setObservations((prev) =>
        prev.map((o) =>
          o.status === 'QUEUED' ? { ...o, status: 'INGESTED' as const } : o,
        ),
      );
    }

    setPipelineProgress(100);
    setPipelineStage('DONE');
    setPipelineDone(true);
    pushLine('DONE', `${observations.length} observations processed through EIS v1.0`);
    pushLine('DONE', `Audit receipt exported · SHA-256 hash 0x${randomHash(16)}`);
    pushLine('INFO', 'Pipeline complete. Ready for next ingestion cycle.');
    setPipelineRunning(false);
  }, [observations.length, pipelineRunning, pushLine]);

  const handleReset = useCallback(() => {
    setObservations([]);
    setPipelineProgress(0);
    setPipelineStage('IDLE');
    setPipelineDone(false);
    setPipelineRunning(false);
    setLines([
      {
        level: 'INFO',
        text: 'Ingestion terminal reset. Awaiting file drop...',
        ts: Date.now(),
      },
    ]);
  }, []);

  const validCount = observations.filter((o) => o.quality === 'VALID').length;
  const anomalyCount = observations.filter((o) => o.quality === 'ANOMALY').length;
  const missingCount = observations.filter((o) => o.quality === 'MISSING').length;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_1fr] gap-4 p-4 h-full">
      {/* Left: drop zone + terminal output */}
      <div className="flex flex-col gap-4 min-h-[600px]">
        {/* Drop zone */}
        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          className={`k-card border-dashed transition-colors cursor-pointer text-center py-10 ${
            isDragging
              ? 'border-[var(--k-cyan-bright)] bg-[rgba(0,212,255,0.06)]'
              : 'border-[var(--k-line-strong)]'
          }`}
          role="button"
          tabIndex={0}
          aria-label="Drop files to ingest"
          onClick={() => {
            // Synthetic drop — simulate a file arriving so keyboard / click
            // users can also trigger ingestion (real drops go through onDrop).
            handleDrop({
              preventDefault: () => {},
              dataTransfer: { files: [] },
            } as unknown as React.DragEvent);
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              handleDrop({
                preventDefault: () => {},
                dataTransfer: { files: [] },
              } as unknown as React.DragEvent);
            }
          }}
        >
          <Upload
            className={`h-10 w-10 mx-auto mb-3 ${isDragging ? 'k-cyan' : 'k-dim'}`}
          />
          <div className="k-card-title justify-center mb-1">
            <span className="text-base normal-case tracking-normal text-[var(--k-fg-bright)]">
              {isDragging ? 'DROP TO INGEST' : 'DROP ZONE'}
            </span>
          </div>
          <p className="text-xs k-dim">
            Drag any file here, or click / press Enter to simulate a drop.
          </p>
          <p className="text-[10px] k-dim mt-2 uppercase tracking-widest">
            Accepted: CSV · JSON · PARQUET · TXT · WAV
          </p>
        </div>

        {/* Terminal output */}
        <div className="k-card flex-1 flex flex-col min-h-[280px]">
          <div className="k-card-title">
            <TerminalIcon className="h-4 w-4" /> TERMINAL OUTPUT
          </div>
          <Separator className="mb-2" />
          <ScrollArea className="flex-1 max-h-72 lg:max-h-96">
            <div className="font-mono text-xs leading-relaxed space-y-0.5 pr-2">
              {lines.map((line, i) => (
                <div key={i} className="flex gap-2">
                  <span className="k-dim select-none">
                    {new Date(line.ts).toISOString().slice(11, 19)}
                  </span>
                  <span className={`font-bold ${LEVEL_COLOR[line.level]}`}>
                    [{line.level}]
                  </span>
                  <span className={LEVEL_COLOR[line.level]}>{line.text}</span>
                </div>
              ))}
              <div ref={terminalEndRef} className="k-cursor" />
            </div>
          </ScrollArea>
        </div>
      </div>

      {/* Right: DRC table + pipeline control */}
      <div className="flex flex-col gap-4 min-h-[600px]">
        {/* Pipeline control */}
        <div className="k-card">
          <div className="k-card-title">
            <ShieldCheck className="h-4 w-4" /> 5-PASS VALIDATION PIPELINE
          </div>

          <div className="flex items-center justify-between mb-3">
            <span className="text-xs k-dim uppercase tracking-wider">Stage</span>
            <span
              className={`text-xs font-bold ${
                pipelineDone
                  ? 'k-pass'
                  : pipelineRunning
                    ? 'k-cyan'
                    : 'k-dim'
              }`}
            >
              {pipelineStage}
            </span>
          </div>

          <Progress
            value={pipelineProgress}
            className="h-3 bg-[var(--k-bg-elevated)] border border-[var(--k-line)]"
          />
          <div className="flex justify-between mt-1.5">
            <span className="text-[10px] k-dim">{pipelineProgress.toFixed(0)}%</span>
            <span className="text-[10px] k-dim">
              {pipelineDone
                ? 'COMPLETE'
                : pipelineRunning
                  ? 'PROCESSING…'
                  : 'IDLE'}
            </span>
          </div>

          <Separator className="my-3" />

          {/* Pipeline stage chips */}
          <div className="grid grid-cols-5 gap-1.5">
            {PIPELINE_STAGES.map((s) => {
              const stageProg =
                pipelineProgress >= (s.id / PIPELINE_STAGES.length) * 100;
              return (
                <div
                  key={s.id}
                  className={`flex flex-col items-center gap-1 py-1.5 px-1 rounded border text-center ${
                    stageProg
                      ? 'border-[var(--k-green-bright)] bg-[rgba(0,255,136,0.06)]'
                      : 'border-[var(--k-line)]'
                  }`}
                >
                  <span
                    className={`text-[10px] font-bold ${
                      stageProg ? 'k-pass' : 'k-dim'
                    }`}
                  >
                    P{s.id}
                  </span>
                  <span
                    className={`text-[9px] uppercase tracking-wide ${
                      stageProg ? 'k-fg-bright' : 'k-dim'
                    }`}
                  >
                    {s.name}
                  </span>
                </div>
              );
            })}
          </div>

          <div className="grid grid-cols-2 gap-2 mt-3">
            <Button
              onClick={runPipeline}
              disabled={pipelineRunning}
              className="bg-[var(--k-cyan-bright)] text-[var(--k-bg)] hover:bg-[var(--k-cyan)] font-bold tracking-wide"
            >
              <Play className="h-4 w-4 mr-1.5" /> RUN PIPELINE
            </Button>
            <Button
              variant="outline"
              onClick={handleReset}
              disabled={pipelineRunning}
              className="border-[var(--k-line-strong)] text-[var(--k-fg-bright)] hover:bg-[var(--k-panel-2)] hover:text-[var(--k-cyan-bright)]"
            >
              <RotateCcw className="h-4 w-4 mr-1.5" /> RESET
            </Button>
          </div>
        </div>

        {/* DRC table */}
        <div className="k-card flex-1 flex flex-col min-h-[300px]">
          <div className="k-card-title">
            <Database className="h-4 w-4" /> DRC · OBSERVATION REGISTRY
          </div>

          {/* Stats strip */}
          <div className="grid grid-cols-4 gap-2 mb-3">
            <StatChip label="TOTAL" value={observations.length} cls="k-badge-dim" />
            <StatChip label="VALID" value={validCount} cls="k-badge-pass" />
            <StatChip label="MISSING" value={missingCount} cls="k-badge-warn" />
            <StatChip label="ANOMALY" value={anomalyCount} cls="k-badge-danger" />
          </div>

          <Separator className="mb-2" />

          <ScrollArea className="flex-1 max-h-72">
            <table className="w-full text-xs">
              <thead>
                <tr className="text-left k-dim border-b border-[var(--k-line)]">
                  <th className="py-2 px-2 font-semibold uppercase tracking-wider">Obs ID</th>
                  <th className="py-2 px-2 font-semibold uppercase tracking-wider">Sensor</th>
                  <th className="py-2 px-2 font-semibold uppercase tracking-wider">Type</th>
                  <th className="py-2 px-2 font-semibold uppercase tracking-wider">Quality</th>
                  <th className="py-2 px-2 font-semibold uppercase tracking-wider">Status</th>
                </tr>
              </thead>
              <tbody>
                {observations.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-6 text-center k-dim">
                      No observations ingested — drop a file to begin.
                    </td>
                  </tr>
                ) : (
                  observations.map((o) => {
                    const q = QUALITY_BADGE[o.quality];
                    const Icon = q.icon;
                    return (
                      <tr
                        key={o.id}
                        className="border-b border-[var(--k-line)]/40 hover:bg-[var(--k-panel-2)]/40"
                      >
                        <td className="py-2 px-2 font-mono k-cyan">{o.id}</td>
                        <td className="py-2 px-2 k-fg-bright">{o.sensor}</td>
                        <td className="py-2 px-2 k-dim">{o.type}</td>
                        <td className="py-2 px-2">
                          <span className={`k-badge ${q.cls}`}>
                            <Icon className="h-3 w-3" />
                            {o.quality}
                          </span>
                        </td>
                        <td className="py-2 px-2">
                          <span
                            className={`k-badge ${
                              o.status === 'INGESTED'
                                ? 'k-badge-pass'
                                : 'k-badge-process'
                            }`}
                          >
                            {o.status}
                          </span>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
              {observations.length > 0 && (
                <tfoot>
                  <tr className="border-t border-[var(--k-line-strong)]">
                    <td colSpan={5} className="py-2 px-2 text-right text-[10px] k-dim uppercase tracking-wider">
                      TOTAL: {observations.length} · VALID: {validCount} ·
                      ANOMALY: {anomalyCount} · MISSING: {missingCount}
                    </td>
                  </tr>
                </tfoot>
              )}
            </table>
          </ScrollArea>
        </div>
      </div>
    </div>
  );
}

// ─── Sub-components ────────────────────────────────────────────────────

function StatChip({
  label,
  value,
  cls,
}: {
  label: string;
  value: number;
  cls: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-2 px-1 rounded border border-[var(--k-line)] bg-[var(--k-bg-elevated)]">
      <span className={`k-badge ${cls} mb-1`}>{label}</span>
      <span className="text-lg font-bold k-fg-bright tabular-nums">{value}</span>
    </div>
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────

function sleep(ms: number): Promise<void> {
  return new Promise((res) => setTimeout(res, ms));
}

function randomHash(len: number): string {
  const chars = '0123456789abcdef';
  let out = '';
  for (let i = 0; i < len; i++) {
    out += chars[Math.floor(Math.random() * chars.length)];
  }
  return out;
}

function spawnObservations(
  pushLine: (level: LineLevel, text: string) => void,
  setObservations: React.Dispatch<React.SetStateAction<Observation[]>>,
) {
  pushLine('PASS', 'Normalizing timestamps (ISO-8601 UTC)...');
  pushLine('PASS', 'Quality gate: VALID (5 observations accepted)');

  const newObs: Observation[] = [];
  const qualities: QualityFlag[] = ['VALID', 'VALID', 'VALID', 'MISSING', 'ANOMALY'];
  for (let i = 0; i < 5; i++) {
    newObs.push({
      id: `OBS-${Date.now().toString(36).toUpperCase()}-${(i + 1).toString().padStart(3, '0')}`,
      sensor: SENSOR_POOL[Math.floor(Math.random() * SENSOR_POOL.length)],
      type: TYPE_POOL[Math.floor(Math.random() * TYPE_POOL.length)],
      quality: qualities[i % qualities.length],
      status: 'QUEUED',
    });
  }
  setObservations((prev) => [...prev, ...newObs]);
  pushLine('DONE', `${newObs.length} observations ingested · awaiting pipeline run`);
}

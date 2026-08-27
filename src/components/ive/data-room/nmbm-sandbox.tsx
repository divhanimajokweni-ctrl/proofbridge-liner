'use client';

/**
 * NMBM Data Sandbox — Data Room · VVU IVE
 * ----------------------------------------
 * Pipeline runner simulating the NMBM sandbox spec (08-NMBM-DATA-SANDBOX-
 * SPECIFICATION.md). Runs `setup.sh` + `run.sh` against a synthetic DMA-7
 * baseline and emits a 5-pass audit receipt.
 *
 * Panels:
 *   1. Data Status Table   — 8-row SIMULATION / DERIVED / PLACEHOLDER ledger
 *   2. Pipeline Runner     — RUN SETUP → RUN PIPELINE → VIEW EVIDENCE buttons
 *                            + terminal output (monospace, auto-scroll)
 *   3. File Tree           — sidebar showing the /sandbox structure
 *   4. Audit Receipt       — JSON code block, mock 11-field provenance per obs
 *
 * All data is explicitly labelled SIMULATION or PLACEHOLDER per the Zero
 * Fabrication Mandate. No real municipal operational data is referenced.
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Button,
} from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Database,
  Terminal as TerminalIcon,
  Play,
  FileJson,
  FolderTree,
  CheckCircle2,
  RotateCcw,
  ChevronRight,
  FileCode2,
  FileText,
  Folder,
} from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────

type LineLevel = 'CMD' | 'SETUP' | 'PASS' | 'DONE' | 'INFO' | 'WARN';

interface TerminalLine {
  level: LineLevel;
  text: string;
  ts: number;
}

type DataStatus = 'SIMULATION' | 'DERIVED' | 'PLACEHOLDER';

interface DataRow {
  item: string;
  status: DataStatus;
  source: string;
  label: string;
}

type Phase = 'IDLE' | 'SETUP' | 'PIPELINE' | 'DONE';

// ─── Static data ──────────────────────────────────────────────────────

const DATA_ROWS: DataRow[] = [
  {
    item: 'DMA-7 flow time series',
    status: 'SIMULATION',
    source: 'VVU-generated',
    label: 'SIMULATION — NOT MUNICIPAL OPERATIONAL DATA',
  },
  {
    item: 'DMA-7 pressure time series',
    status: 'SIMULATION',
    source: 'VVU-generated',
    label: 'SIMULATION — NOT MUNICIPAL OPERATIONAL DATA',
  },
  {
    item: 'Night-flow minimum',
    status: 'DERIVED',
    source: 'Computed from sim flow',
    label: 'DERIVED FROM SIMULATION DATA',
  },
  {
    item: 'Field observation (ground moisture)',
    status: 'SIMULATION',
    source: 'VVU-generated',
    label: 'SIMULATION — NOT REAL FIELD REPORT',
  },
  {
    item: 'Acoustic signal',
    status: 'SIMULATION',
    source: 'VVU-generated',
    label: 'SIMULATION — NOT REAL ACOUSTIC DATA',
  },
  {
    item: 'Pump/valve status log',
    status: 'SIMULATION',
    source: 'VVU-generated',
    label: 'SIMULATION — NOT OPERATIONAL DATA',
  },
  {
    item: 'Asset metadata (pipe material, diameter)',
    status: 'PLACEHOLDER',
    source: 'Hypothetical',
    label: 'PLACEHOLDER — NOT REAL ASSET DATA',
  },
  {
    item: 'Failure register',
    status: 'PLACEHOLDER',
    source: 'Hypothetical',
    label: 'PLACEHOLDER — NOT REAL FAILURE RECORD',
  },
];

const STATUS_BADGE: Record<DataStatus, string> = {
  SIMULATION: 'k-badge-process',
  DERIVED: 'k-badge-pass',
  PLACEHOLDER: 'k-badge-warn',
};

const LEVEL_COLOR: Record<LineLevel, string> = {
  CMD: 'k-fg-bright',
  SETUP: 'k-cyan',
  PASS: 'k-cyan',
  DONE: 'k-pass',
  INFO: 'k-dim',
  WARN: 'k-warn',
};

// ─── Audit receipt builder ────────────────────────────────────────────

function buildAuditReceipt() {
  const now = new Date().toISOString();
  const observations = [
    {
      obsId: 'OBS-FLOW-DMA07-INLET',
      sensorId: 'FLOW-DMA07-INLET',
      measurementType: 'FLOW',
      timestamp: '2026-08-12T04:00:00Z',
      value: 111.0,
      unit: 'L/s',
      qualityFlag: 'VALID',
      evidenceClass: 'PRIMARY',
      weight: 0.3,
      source: 'SIMULATION',
      provenanceHash: '0x' + randomHash(40),
      isIndependenceVerified: true,
    },
    {
      obsId: 'OBS-PRESS-DMA07-P14',
      sensorId: 'PRESS-DMA07-P14',
      measurementType: 'PRESSURE',
      timestamp: '2026-08-12T04:02:00Z',
      value: 46.1,
      unit: 'm',
      qualityFlag: 'VALID',
      evidenceClass: 'CORRELATED',
      weight: 0.2,
      source: 'SIMULATION',
      provenanceHash: '0x' + randomHash(40),
      isIndependenceVerified: true,
    },
    {
      obsId: 'OBS-MNF-DMA07-BASELINE',
      sensorId: 'MNF-DMA07',
      measurementType: 'FLOW',
      timestamp: '2026-08-12T02:30:00Z',
      value: 97.0,
      unit: 'L/s',
      qualityFlag: 'VALID',
      evidenceClass: 'DERIVED',
      weight: 0.0,
      source: 'DERIVED',
      provenanceHash: '0x' + randomHash(40),
      isIndependenceVerified: true,
    },
    {
      obsId: 'OBS-ACOUSTIC-S142',
      sensorId: 'ACOUSTIC-07',
      measurementType: 'ACOUSTIC',
      timestamp: '2026-08-12T04:15:00Z',
      value: 1,
      unit: 'flag',
      qualityFlag: 'VALID',
      evidenceClass: 'INDEPENDENT',
      weight: 0.25,
      source: 'SIMULATION',
      provenanceHash: '0x' + randomHash(40),
      isIndependenceVerified: true,
    },
    {
      obsId: 'OBS-FIELD-S142-MOISTURE',
      sensorId: 'FIELD-REPORT-S142',
      measurementType: 'FIELD_VISUAL',
      timestamp: '2026-08-12T05:10:00Z',
      value: 1,
      unit: 'flag',
      qualityFlag: 'VALID',
      evidenceClass: 'INDEPENDENT',
      weight: 0.25,
      source: 'SIMULATION',
      provenanceHash: '0x' + randomHash(40),
      isIndependenceVerified: true,
    },
  ];

  return {
    schema: 'nmbm.leak-candidate-audit.v1',
    dmaId: 'DMA-07',
    classification: 'VERIFIED_CANDIDATE',
    verdict: 'VERIFIED_CANDIDATE',
    score: 1.0,
    threshold: 0.8,
    receiptHash: '0x' + randomHash(64),
    hashAlgorithm: 'SHA-256',
    generatedAt: now,
    baselineMnfLps: 97.0,
    observationCount: observations.length,
    observations,
    provenanceFields: [
      'obsId',
      'sensorId',
      'measurementType',
      'timestamp',
      'value',
      'unit',
      'qualityFlag',
      'evidenceClass',
      'weight',
      'source',
      'provenanceHash',
    ],
    pipeline: [
      { pass: 1, name: 'Collect & Normalize', status: 'pass' },
      { pass: 2, name: 'Physical Boundary Checks', status: 'pass' },
      { pass: 3, name: 'MNF Baseline (median)', status: 'pass' },
      { pass: 4, name: 'EIS v1.0 Independence', status: 'pass' },
      { pass: 5, name: 'Evidence Log Export', status: 'pass' },
    ],
    classificationLabel: 'SIMULATION — NOT MUNICIPAL OPERATIONAL DATA',
  };
}

// ─── File tree (mock structure) ───────────────────────────────────────

interface FileNode {
  name: string;
  type: 'folder' | 'shell' | 'csv' | 'json' | 'sh';
  depth: number;
  highlight?: boolean;
}

const FILE_TREE: FileNode[] = [
  { name: '/sandbox/', type: 'folder', depth: 0 },
  { name: 'data/', type: 'folder', depth: 1 },
  { name: 'nmbm_placeholder_baseline.csv', type: 'csv', depth: 2 },
  { name: 'pipeline/', type: 'folder', depth: 1 },
  { name: 'run.sh', type: 'sh', depth: 2 },
  { name: 'evidence/', type: 'folder', depth: 1 },
  { name: 'leak_candidate_audit.json', type: 'json', depth: 2, highlight: true },
  { name: 'setup.sh', type: 'sh', depth: 1 },
];

function FileIcon({ type }: { type: FileNode['type'] }) {
  if (type === 'folder') return <Folder className="h-3.5 w-3.5 k-amber" />;
  if (type === 'shell' || type === 'sh')
    return <FileCode2 className="h-3.5 w-3.5 k-cyan" />;
  if (type === 'csv') return <FileText className="h-3.5 w-3.5 k-fg-bright" />;
  if (type === 'json')
    return <FileJson className="h-3.5 w-3.5 k-pass" />;
  return <FileText className="h-3.5 w-3.5 k-dim" />;
}

// ─── Component ────────────────────────────────────────────────────────

export default function NmbmSandbox() {
  const [lines, setLines] = useState<TerminalLine[]>([
    {
      level: 'INFO',
      text: 'NMBM Sandbox terminal online. Press RUN SETUP to begin.',
      ts: Date.now(),
    },
  ]);
  const [phase, setPhase] = useState<Phase>('IDLE');
  const [setupDone, setSetupDone] = useState(false);
  const [pipelineDone, setPipelineDone] = useState(false);
  const [auditReceipt, setAuditReceipt] = useState<ReturnType<
    typeof buildAuditReceipt
  > | null>(null);
  const [showEvidence, setShowEvidence] = useState(false);
  const terminalEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll terminal to bottom
  useEffect(() => {
    terminalEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [lines]);

  const pushLine = useCallback((level: LineLevel, text: string) => {
    setLines((prev) => [...prev, { level, text, ts: Date.now() }].slice(-300));
  }, []);

  // ─── RUN SETUP ─────────────────────────────────────────────────────
  const runSetup = useCallback(async () => {
    if (phase === 'SETUP' || phase === 'PIPELINE') return;
    setPhase('SETUP');
    setSetupDone(false);
    setPipelineDone(false);
    setShowEvidence(false);
    setAuditReceipt(null);
    setLines([
      { level: 'CMD', text: '$ ./setup.sh', ts: Date.now() },
    ]);

    const setupSteps: Array<[LineLevel, string]> = [
      ['SETUP', '[SETUP] Creating /sandbox/data/'],
      ['SETUP', '[SETUP] Creating /sandbox/pipeline/'],
      ['SETUP', '[SETUP] Creating /sandbox/evidence/'],
      ['SETUP', '[SETUP] Generating nmbm_placeholder_baseline.csv (7 rows)'],
      ['SETUP', '[SETUP] Writing synthetic DMA-7 flow series (24 h @ 1 min)'],
      ['SETUP', '[SETUP] Writing synthetic DMA-7 pressure series (24 h @ 1 min)'],
      ['SETUP', '[SETUP] Writing placeholder asset_metadata.json'],
      ['SETUP', '[SETUP] Writing placeholder failure_register.json'],
      ['DONE', '[SETUP] Done.'],
      ['INFO', ''],
    ];

    for (const [lvl, text] of setupSteps) {
      pushLine(lvl, text);
      await sleep(180);
    }

    setSetupDone(true);
    setPhase('IDLE');
  }, [phase, pushLine]);

  // ─── RUN PIPELINE ──────────────────────────────────────────────────
  const runPipeline = useCallback(async () => {
    if (phase === 'SETUP' || phase === 'PIPELINE') return;
    if (!setupDone) {
      pushLine('WARN', 'Run SETUP first — no baseline data available.');
      return;
    }
    setPhase('PIPELINE');
    setPipelineDone(false);
    setShowEvidence(false);
    pushLine('CMD', '$ cd pipeline && ./run.sh');

    const pipelineSteps: Array<[LineLevel, string]> = [
      ['PASS', '[PASS1] Collect & Normalize... ✓'],
      ['PASS', '[PASS2] Physical Boundary Checks... ✓ (1 IMPOSSIBLE rejected)'],
      ['PASS', '[PASS3] MNF Baseline (median)... ✓ baseline=97.0 L/s'],
      ['PASS', '[PASS4] EIS v1.0 Independence... ✓ score=1.00 VERIFIED_CANDIDATE'],
      ['PASS', '[PASS5] Evidence Log Export... ✓'],
      ['DONE', '[DONE] Evidence written to /evidence/leak_candidate_audit.json'],
      ['INFO', ''],
    ];

    for (const [lvl, text] of pipelineSteps) {
      pushLine(lvl, text);
      await sleep(420);
    }

    setAuditReceipt(buildAuditReceipt());
    setPipelineDone(true);
    setPhase('DONE');
  }, [phase, setupDone, pushLine]);

  // ─── VIEW EVIDENCE ─────────────────────────────────────────────────
  const viewEvidence = useCallback(() => {
    if (!auditReceipt) return;
    setShowEvidence((prev) => !prev);
  }, [auditReceipt]);

  const handleReset = useCallback(() => {
    setLines([
      {
        level: 'INFO',
        text: 'NMBM Sandbox terminal reset. Press RUN SETUP to begin.',
        ts: Date.now(),
      },
    ]);
    setPhase('IDLE');
    setSetupDone(false);
    setPipelineDone(false);
    setAuditReceipt(null);
    setShowEvidence(false);
  }, []);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[260px_1fr] gap-4 p-4">
      {/* Left: file tree */}
      <div className="flex flex-col gap-4">
        <div className="k-card">
          <div className="k-card-title">
            <FolderTree className="h-4 w-4" /> FILE TREE
          </div>
          <Separator className="mb-3" />
          <div className="font-mono text-xs space-y-0.5">
            {FILE_TREE.map((node, i) => (
              <div
                key={i}
                className={`flex items-center gap-1.5 py-0.5 px-1 rounded ${
                  node.highlight
                    ? 'bg-[rgba(0,255,136,0.08)] border border-[var(--k-green-bright)]/30'
                    : ''
                }`}
                style={{ paddingLeft: `${node.depth * 14 + 4}px` }}
              >
                <FileIcon type={node.type} />
                <span
                  className={
                    node.type === 'folder'
                      ? 'k-amber'
                      : node.highlight
                        ? 'k-pass font-bold'
                        : 'k-fg'
                  }
                >
                  {node.name}
                </span>
                {node.highlight && pipelineDone && (
                  <span className="ml-auto k-badge k-badge-pass text-[9px]">
                    NEW
                  </span>
                )}
              </div>
            ))}
          </div>
          <Separator className="my-3" />
          <p className="text-[10px] k-dim uppercase tracking-widest">
            /sandbox is a synthetic workspace — no real NMBM data is read or
            written.
          </p>
        </div>

        {/* Phase indicator */}
        <div className="k-card">
          <div className="k-card-title">
            <Database className="h-4 w-4" /> PIPELINE STATE
          </div>
          <div className="space-y-1.5">
            <StateRow label="SETUP" done={setupDone} active={phase === 'SETUP'} />
            <StateRow
              label="PIPELINE"
              done={pipelineDone}
              active={phase === 'PIPELINE'}
            />
            <StateRow
              label="EVIDENCE"
              done={showEvidence}
              active={false}
            />
          </div>
        </div>
      </div>

      {/* Right: main content */}
      <div className="flex flex-col gap-4 min-w-0">
        {/* Data Status Table */}
        <div className="k-card">
          <div className="k-card-title">
            <Database className="h-4 w-4" /> DATA STATUS · SECTION 5 LEDGER
          </div>
          <p className="text-[11px] k-dim mb-2">
            Per 08-NMBM-DATA-SANDBOX-SPECIFICATION.md §5. Every data item
            carries an explicit SIMULATION / DERIVED / PLACEHOLDER label.
          </p>
          <ScrollArea className="max-h-72">
            <Table>
              <TableHeader>
                <TableRow className="border-[var(--k-line)] hover:bg-transparent">
                  <TableHead className="text-[10px] uppercase tracking-wider k-dim font-bold">
                    Data Item
                  </TableHead>
                  <TableHead className="text-[10px] uppercase tracking-wider k-dim font-bold">
                    Status
                  </TableHead>
                  <TableHead className="text-[10px] uppercase tracking-wider k-dim font-bold hidden sm:table-cell">
                    Source
                  </TableHead>
                  <TableHead className="text-[10px] uppercase tracking-wider k-dim font-bold">
                    Label
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {DATA_ROWS.map((row) => (
                  <TableRow
                    key={row.item}
                    className="border-[var(--k-line)]/40 hover:bg-[var(--k-panel-2)]/40"
                  >
                    <TableCell className="text-xs k-fg-bright font-medium">
                      {row.item}
                    </TableCell>
                    <TableCell>
                      <span className={`k-badge ${STATUS_BADGE[row.status]}`}>
                        {row.status}
                      </span>
                    </TableCell>
                    <TableCell className="text-xs k-dim hidden sm:table-cell">
                      {row.source}
                    </TableCell>
                    <TableCell className="text-[10px] k-dim font-mono">
                      {row.label}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </ScrollArea>
        </div>

        {/* Pipeline Runner */}
        <div className="k-card">
          <div className="k-card-title">
            <TerminalIcon className="h-4 w-4" /> PIPELINE RUNNER
          </div>

          <div className="flex flex-wrap gap-2 mb-3">
            <Button
              onClick={runSetup}
              disabled={phase === 'SETUP' || phase === 'PIPELINE'}
              className="bg-[var(--k-cyan-bright)] text-[var(--k-bg)] hover:bg-[var(--k-cyan)] font-bold tracking-wide"
            >
              <Play className="h-4 w-4 mr-1.5" /> RUN SETUP
            </Button>
            <Button
              onClick={runPipeline}
              disabled={phase === 'SETUP' || phase === 'PIPELINE' || !setupDone}
              className="bg-[var(--k-green-bright)] text-[var(--k-bg)] hover:bg-[var(--k-green)] font-bold tracking-wide disabled:opacity-50"
            >
              <Play className="h-4 w-4 mr-1.5" /> RUN PIPELINE
            </Button>
            <Button
              onClick={viewEvidence}
              disabled={!auditReceipt}
              variant="outline"
              className="border-[var(--k-line-strong)] text-[var(--k-fg-bright)] hover:bg-[var(--k-panel-2)] hover:text-[var(--k-cyan-bright)] disabled:opacity-50"
            >
              <FileJson className="h-4 w-4 mr-1.5" />
              {showEvidence ? 'HIDE EVIDENCE' : 'VIEW EVIDENCE'}
            </Button>
            <Button
              onClick={handleReset}
              variant="outline"
              disabled={phase === 'SETUP' || phase === 'PIPELINE'}
              className="border-[var(--k-line-strong)] text-[var(--k-fg-bright)] hover:bg-[var(--k-panel-2)] hover:text-[var(--k-cyan-bright)] ml-auto"
            >
              <RotateCcw className="h-4 w-4 mr-1.5" /> RESET
            </Button>
          </div>

          {/* Terminal output */}
          <div className="bg-[var(--k-bg-elevated)] border border-[var(--k-line)] rounded-md">
            <div className="flex items-center justify-between px-3 py-1.5 border-b border-[var(--k-line)]">
              <span className="text-[10px] uppercase tracking-widest k-dim">
                /sandbox · bash
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-[var(--k-red-bright)]/70" />
                <span className="w-2 h-2 rounded-full bg-[var(--k-amber-bright)]/70" />
                <span className="w-2 h-2 rounded-full bg-[var(--k-green-bright)]/70" />
              </span>
            </div>
            <ScrollArea className="max-h-80">
              <div className="font-mono text-xs leading-relaxed p-3 space-y-0.5">
                {lines.map((line, i) => (
                  <div key={i} className="flex gap-2">
                    <span className="k-dim select-none shrink-0">
                      {line.ts
                        ? new Date(line.ts)
                            .toISOString()
                            .slice(11, 19)
                        : '--:--:--'}
                    </span>
                    <span className={`flex-1 ${LEVEL_COLOR[line.level]}`}>
                      {line.text || '\u00a0'}
                    </span>
                  </div>
                ))}
                <div ref={terminalEndRef} className="k-cursor" />
              </div>
            </ScrollArea>
          </div>

          {/* Audit receipt viewer */}
          {showEvidence && auditReceipt && (
            <div className="mt-3">
              <div className="k-card-title">
                <FileJson className="h-4 w-4" /> EVIDENCE ·{' '}
                <span className="k-pass normal-case tracking-normal">
                  leak_candidate_audit.json
                </span>
              </div>
              <Separator className="mb-2" />
              <ScrollArea className="max-h-96">
                <pre className="font-mono text-[11px] leading-relaxed k-fg whitespace-pre-wrap break-all p-3 bg-[var(--k-bg-elevated)] border border-[var(--k-line)] rounded-md">
                  {JSON.stringify(auditReceipt, null, 2)}
                </pre>
              </ScrollArea>
              <div className="flex flex-wrap gap-2 mt-2">
                <span className="k-badge k-badge-pass">
                  <CheckCircle2 className="h-3 w-3" /> VERIFIED_CANDIDATE
                </span>
                <span className="k-badge k-badge-process">
                  SCORE · {auditReceipt.score.toFixed(2)}
                </span>
                <span className="k-badge k-badge-dim">
                  OBS · {auditReceipt.observationCount}
                </span>
                <span className="k-badge k-badge-dim">
                  HASH · {auditReceipt.receiptHash.slice(0, 18)}…
                </span>
                <span className="k-badge k-badge-warn">
                  SIMULATION · NOT MUNICIPAL OPERATIONAL DATA
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────

function StateRow({
  label,
  done,
  active,
}: {
  label: string;
  done: boolean;
  active: boolean;
}) {
  return (
    <div className="flex items-center gap-2 text-xs">
      <ChevronRight className="h-3 w-3 k-dim" />
      <span
        className={
          done ? 'k-pass' : active ? 'k-cyan' : 'k-dim'
        }
      >
        {label}
      </span>
      <span className="ml-auto">
        {done ? (
          <span className="k-badge k-badge-pass text-[9px]">DONE</span>
        ) : active ? (
          <span className="k-badge k-badge-process text-[9px]">RUN</span>
        ) : (
          <span className="k-badge k-badge-dim text-[9px]">IDLE</span>
        )}
      </span>
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

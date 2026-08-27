'use client';

/**
 * NMBM Budget Sandbox · Finance Room · VVU IVE
 * ----------------------------------------------
 * Budget allocation simulator for the Nelson Mandela Bay Municipality (NMBM)
 * water-infrastructure maintenance budget. The user drags 6 sliders (one per
 * department) to allocate ZAR out of each department's capped slice. The total
 * budget is R 12,500,000; the sum of departmental caps exceeds the total so the
 * user must trade off.
 *
 * Live outputs:
 *   - Total Allocated + Remaining (red if over-budget)
 *   - NRW Reduction Estimate (formula-capped at 45%)
 *   - Validate Allocation button → toast confirming balanced allocation
 *   - Spend vs Actual table → Budgeted column tracks the live sliders
 *
 * Self-contained — accepts no props. All amounts in ZAR (R prefix).
 *
 * NO ANTPAY · NO PAYMENT PROCESSING · budgeting simulation only.
 */

import { useMemo, useState } from 'react';
import { toast } from 'sonner';
import {
  AlertTriangle,
  Banknote,
  Calculator,
  CheckCircle2,
  Droplets,
  Gauge,
  PieChart,
  RotateCcw,
  ShieldAlert,
  ShieldCheck,
  TrendingDown,
  TrendingUp,
  Wrench,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Separator } from '@/components/ui/separator';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

// ─── Types ────────────────────────────────────────────────────────────

type DeptId = 'leak' | 'pipe' | 'pressure' | 'valve' | 'meter' | 'reserve';

interface Department {
  id: DeptId;
  name: string;
  icon: typeof Droplets;
  /** Cap for this department's slice (ZAR). */
  max: number;
  /** Initial allocated ZAR. */
  initial: number;
  /** NRW reduction coefficient (only non-reserve depts contribute). */
  nrwWeight: number;
  /** Spent YTD (historical, fixed). */
  spentYtd: number;
  /** Short tag for slider UI. */
  tag: string;
}

// ─── Constants ─────────────────────────────────────────────────────────

const TOTAL_BUDGET = 12_500_000; // R 12.5M
const NRW_CAP = 45; // % cap

const DEPARTMENTS: Department[] = [
  {
    id: 'leak',
    name: 'Leak Detection',
    icon: Droplets,
    max: 3_000_000,
    initial: 2_400_000,
    nrwWeight: 15,
    spentYtd: 1_850_000,
    tag: 'ACOUSTIC + SCADA',
  },
  {
    id: 'pipe',
    name: 'Pipe Replacement',
    icon: Wrench,
    max: 4_500_000,
    initial: 3_100_000,
    nrwWeight: 20,
    spentYtd: 2_900_000,
    tag: 'CAPEX',
  },
  {
    id: 'pressure',
    name: 'Pressure Management',
    icon: Gauge,
    max: 1_500_000,
    initial: 900_000,
    nrwWeight: 8,
    spentYtd: 850_000,
    tag: 'PRV + ALTITUDE',
  },
  {
    id: 'valve',
    name: 'Valve Maintenance',
    icon: Wrench,
    max: 2_000_000,
    initial: 1_200_000,
    nrwWeight: 7,
    spentYtd: 1_100_000,
    tag: 'ISOLATION + AIR',
  },
  {
    id: 'meter',
    name: 'Meter Replacement',
    icon: Calculator,
    max: 1_500_000,
    initial: 600_000,
    nrwWeight: 5,
    spentYtd: 420_000,
    tag: 'BULK + DOMESTIC',
  },
  {
    id: 'reserve',
    name: 'Emergency Reserve',
    icon: ShieldAlert,
    max: 2_000_000,
    initial: 0,
    nrwWeight: 0,
    spentYtd: 0,
    tag: 'CONTINGENCY',
  },
];

const SLIDER_STEP = 50_000;

// ─── Helpers ──────────────────────────────────────────────────────────

function zar(amount: number): string {
  const sign = amount < 0 ? '-' : '';
  return sign + 'R ' + Math.abs(amount).toLocaleString('en-US', {
    maximumFractionDigits: 0,
  });
}

// ─── Initial state ────────────────────────────────────────────────────

const INITIAL_ALLOCATIONS: Record<DeptId, number> = DEPARTMENTS.reduce(
  (acc, d) => {
    acc[d.id] = d.initial;
    return acc;
  },
  {} as Record<DeptId, number>,
);

// ─── Component ─────────────────────────────────────────────────────────

export default function NmbmBudget() {
  const [allocations, setAllocations] = useState<Record<DeptId, number>>(
    INITIAL_ALLOCATIONS,
  );

  // ── Derived: total allocated + remaining ─────────────────────────────
  const allocated = useMemo(
    () => (Object.values(allocations) as number[]).reduce((a, b) => a + b, 0),
    [allocations],
  );
  const remaining = TOTAL_BUDGET - allocated;
  const allocatedPct = Math.round((allocated / TOTAL_BUDGET) * 100);
  const overBudget = remaining < 0;

  // ── Derived: NRW reduction estimate (formula per spec, capped at 45%) ──
  const nrwEstimate = useMemo(() => {
    let raw = 0;
    for (const d of DEPARTMENTS) {
      if (d.nrwWeight > 0) {
        raw += (allocations[d.id] / d.max) * d.nrwWeight;
      }
    }
    return Math.min(NRW_CAP, Math.round(raw * 10) / 10);
  }, [allocations]);

  // ── Derived: per-department validation flags ─────────────────────────
  const validation = useMemo(() => {
    const failing: string[] = [];
    for (const d of DEPARTMENTS) {
      const pct = allocations[d.id] / d.max;
      const threshold = d.id === 'reserve' ? 0.5 : 0.2;
      const label = d.id === 'reserve' ? '≥ 50%' : '≥ 20%';
      if (pct < threshold) {
        failing.push(`${d.name} (${label})`);
      }
    }
    return { balanced: failing.length === 0, failing };
  }, [allocations]);

  // ── Handlers ────────────────────────────────────────────────────────
  const handleSlider = (id: DeptId, value: number) => {
    setAllocations((prev) => ({ ...prev, [id]: value }));
  };

  const handleValidate = () => {
    if (validation.balanced) {
      toast.success('Allocation Balanced', {
        description:
          `All departments ≥ 20% of cap · Emergency Reserve ≥ 50% · NRW projection ${nrwEstimate}%`,
      });
    } else {
      toast.error('Allocation Not Balanced', {
        description: `Below threshold: ${validation.failing.join(', ')}`,
      });
    }
  };

  const handleReset = () => {
    setAllocations(INITIAL_ALLOCATIONS);
    toast('Budget Reset', {
      description: 'Allocations restored to NMBM baseline 2026/08.',
    });
  };

  return (
    <div className="flex flex-col h-full min-h-0 bg-[var(--k-bg)] k-grid-bg">
      {/* Header */}
      <header className="px-4 sm:px-6 lg:px-8 py-4 border-b border-[var(--k-line)] bg-[var(--k-panel)]">
        <div className="flex flex-wrap items-center gap-2 mb-1.5">
          <Calculator className="h-4 w-4 k-cyan" />
          <h2 className="text-sm font-bold k-fg-bright uppercase tracking-wider">
            NMBM Budget Sandbox
          </h2>
          <span className="k-badge k-badge-process">FY 2026/08</span>
          <span className="k-badge k-badge-pass hidden sm:inline-flex">
            NRW PROJECTION LIVE
          </span>
        </div>
        <p className="text-[11px] k-dim">
          Allocate the Nelson Mandela Bay Municipality water-infrastructure
          maintenance budget across 6 departments. Each slider drives a
          department&apos;s allocation up to its cap; the total budget cap is{' '}
          <span className="k-cyan">{zar(TOTAL_BUDGET)}</span>. Drag to see live
          NRW reduction projection and balance validation.
        </p>
      </header>

      {/* Body */}
      <div className="flex-1 min-h-0 overflow-y-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="max-w-7xl mx-auto flex flex-col gap-4 sm:gap-6">
          {/* ── Budget Overview ─────────────────────────────────────────── */}
          <section className="k-card k-glow-cyan" aria-label="Budget Overview">
            <div className="k-card-title">
              <PieChart className="h-3.5 w-3.5" />
              Budget Overview
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <BudgetStat
                label="Total Budget"
                value={zar(TOTAL_BUDGET)}
                icon={Banknote}
                color="var(--k-cyan-bright)"
                sublabel="NMBM FY 2026/08 · water infrastructure"
              />
              <BudgetStat
                label="Allocated"
                value={zar(allocated)}
                icon={TrendingUp}
                color="var(--k-amber-bright)"
                sublabel={`${allocatedPct}% of total cap`}
                progressPct={allocatedPct}
              />
              <BudgetStat
                label="Remaining"
                value={zar(remaining)}
                icon={overBudget ? AlertTriangle : TrendingDown}
                color={overBudget ? 'var(--k-red-bright)' : 'var(--k-green-bright)'}
                sublabel={overBudget ? 'OVER BUDGET' : `${100 - allocatedPct}% unallocated`}
                warn={overBudget}
              />
            </div>
          </section>

          {/* ── Allocation sliders + NRW panel (2-col on lg) ─────────────── */}
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 sm:gap-6">
            {/* Allocation sliders */}
            <section className="k-card lg:col-span-3" aria-label="Allocation Sliders">
              <div className="k-card-title">
                <Wrench className="h-3.5 w-3.5" />
                Allocation Sliders · 6 Departments
              </div>
              <div className="flex flex-col gap-4">
                {DEPARTMENTS.map((d) => {
                  const Icon = d.icon;
                  const value = allocations[d.id];
                  const pct = Math.round((value / d.max) * 100);
                  const threshold = d.id === 'reserve' ? 50 : 20;
                  const meetsThreshold = pct >= threshold;
                  return (
                    <div
                      key={d.id}
                      className="rounded-md border border-[var(--k-line)] bg-[var(--k-bg-elevated)] p-3"
                    >
                      <div className="flex items-start justify-between gap-3 mb-2">
                        <div className="flex items-center gap-2 min-w-0">
                          <div className="flex items-center justify-center w-8 h-8 rounded-md border border-[var(--k-line-strong)] bg-[var(--k-panel-2)] shrink-0">
                            <Icon className="h-4 w-4 k-cyan" />
                          </div>
                          <div className="min-w-0">
                            <div className="text-sm font-bold k-fg-bright leading-tight">
                              {d.name}
                            </div>
                            <div className="text-[9px] uppercase tracking-widest k-dim">
                              {d.tag} · cap {zar(d.max)}
                            </div>
                          </div>
                        </div>
                        <div className="flex flex-col items-end shrink-0">
                          <span className="font-mono text-sm font-bold k-cyan">
                            {zar(value)}
                          </span>
                          <span
                            className={`text-[10px] uppercase tracking-widest font-bold ${
                              meetsThreshold ? 'k-pass' : 'k-warn'
                            }`}
                          >
                            {pct}% · {meetsThreshold ? 'OK' : `MIN ${threshold}%`}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="flex-1">
                          <Slider
                            value={[value]}
                            min={0}
                            max={d.max}
                            step={SLIDER_STEP}
                            onValueChange={(v) => handleSlider(d.id, v[0] ?? 0)}
                            aria-label={`${d.name} allocation`}
                          />
                        </div>
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <span className="font-mono text-[10px] k-dim uppercase tracking-widest shrink-0 cursor-help border border-[var(--k-line)] rounded px-1.5 py-0.5">
                                max {zar(d.max)}
                              </span>
                            </TooltipTrigger>
                            <TooltipContent>
                              Slide to allocate ZAR out of this department&apos;s cap.
                              Min threshold: {threshold}%.
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="mt-4 pt-3 border-t border-[var(--k-line)] flex flex-wrap items-center gap-2">
                <Button
                  onClick={handleValidate}
                  className={`border ${
                    validation.balanced
                      ? 'border-[var(--k-green-bright)] bg-[rgba(0,255,136,0.06)] text-[var(--k-green-bright)] hover:bg-[rgba(0,255,136,0.12)] hover:text-[var(--k-green-bright)]'
                      : 'border-[var(--k-amber-bright)] bg-[rgba(255,184,0,0.06)] text-[var(--k-amber-bright)] hover:bg-[rgba(255,184,0,0.12)] hover:text-[var(--k-amber-bright)]'
                  }`}
                  variant="outline"
                >
                  {validation.balanced ? (
                    <>
                      <ShieldCheck className="h-4 w-4" />
                      Validate Allocation
                    </>
                  ) : (
                    <>
                      <AlertTriangle className="h-4 w-4" />
                      Validate Allocation
                    </>
                  )}
                </Button>
                <Button
                  onClick={handleReset}
                  variant="ghost"
                  className="text-[var(--k-dim)] hover:text-[var(--k-cyan-bright)]"
                >
                  <RotateCcw className="h-4 w-4" />
                  Reset Baseline
                </Button>
                <span className="ml-auto text-[10px] uppercase tracking-widest k-dim hidden sm:inline">
                  Validation rule: each dept ≥ 20% of cap · reserve ≥ 50%
                </span>
              </div>
            </section>

            {/* NRW Reduction Estimate */}
            <section
              className="k-card lg:col-span-2 flex flex-col"
              aria-label="NRW Reduction Estimate"
            >
              <div className="k-card-title">
                <TrendingDown className="h-3.5 w-3.5" />
                NRW Reduction Estimate
              </div>

              {/* Big % readout */}
              <div
                className="rounded-md border border-[var(--k-green-bright)]/40 bg-[rgba(0,255,136,0.04)] p-4 mb-3"
              >
                <div className="flex items-baseline gap-2">
                  <span
                    className="text-5xl font-bold k-pass leading-none"
                    style={{ textShadow: '0 0 16px rgba(0,255,136,0.4)' }}
                  >
                    {nrwEstimate}
                  </span>
                  <span className="text-2xl k-pass font-bold">%</span>
                </div>
                <div className="text-[10px] uppercase tracking-widest k-dim mt-2">
                  Projected non-revenue water reduction · capped at {NRW_CAP}%
                </div>
                <div className="mt-3">
                  <div className="k-trust-bar h-3">
                    <div
                      className="k-trust-bar-fill"
                      style={{ width: `${(nrwEstimate / NRW_CAP) * 100}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-[9px] uppercase tracking-widest k-dim mt-1">
                    <span>0%</span>
                    <span>{nrwEstimate}% / {NRW_CAP}% cap</span>
                  </div>
                </div>
              </div>

              {/* Formula breakdown */}
              <div className="rounded-md border border-[var(--k-line)] bg-[var(--k-bg-elevated)] p-3 mb-3">
                <div className="text-[10px] uppercase tracking-widest k-dim mb-2">
                  Formula Contribution Breakdown
                </div>
                <ul className="space-y-1.5">
                  {DEPARTMENTS.filter((d) => d.nrwWeight > 0).map((d) => {
                    const ratio = allocations[d.id] / d.max;
                    const contribution = Math.round(ratio * d.nrwWeight * 10) / 10;
                    const capPct = Math.round((d.nrwWeight / NRW_CAP) * 100);
                    return (
                      <li
                        key={d.id}
                        className="flex items-center justify-between gap-2"
                      >
                        <span className="text-[11px] k-fg-bright">
                          {d.name}
                        </span>
                        <div className="flex items-center gap-2 flex-1 max-w-[160px]">
                          <div className="flex-1 h-1.5 bg-[var(--k-panel-2)] rounded-full overflow-hidden">
                            <div
                              className="h-full bg-[var(--k-green-bright)]"
                              style={{ width: `${ratio * 100}%` }}
                            />
                          </div>
                          <span className="font-mono text-[11px] k-pass w-12 text-right">
                            +{contribution}%
                          </span>
                          <span className="font-mono text-[9px] k-dim w-10 text-right">
                            /{d.nrwWeight}
                          </span>
                        </div>
                      </li>
                    );
                  })}
                </ul>
                <Separator className="bg-[var(--k-line)] my-2" />
                <div className="flex items-center justify-between">
                  <span className="text-[10px] uppercase tracking-widest k-dim">
                    Sum (pre-cap)
                  </span>
                  <span className="font-mono text-xs k-cyan font-bold">
                    {(() => {
                      let raw = 0;
                      for (const d of DEPARTMENTS) {
                        if (d.nrwWeight > 0) {
                          raw += (allocations[d.id] / d.max) * d.nrwWeight;
                        }
                      }
                      return Math.round(raw * 10) / 10;
                    })()}%
                  </span>
                </div>
              </div>

              <p className="text-[9px] k-dim uppercase tracking-widest">
                Formula: Σ (allocated / max × weight) · capped at {NRW_CAP}% ·
                Emergency Reserve carries no NRW weight.
              </p>
            </section>
          </div>

          {/* ── Spend vs Actual table ─────────────────────────────────── */}
          <section className="k-card" aria-label="Spend vs Actual">
            <div className="k-card-title">
              <Banknote className="h-3.5 w-3.5" />
              Spend vs Actual · YTD 2026/08
            </div>
            <div className="overflow-x-auto -mx-1 px-1">
              <Table>
                <TableHeader>
                  <TableRow className="border-[var(--k-line)] hover:bg-transparent">
                    <TableHead className="text-[10px] uppercase tracking-widest k-dim">Department</TableHead>
                    <TableHead className="text-right text-[10px] uppercase tracking-widest k-dim">Budgeted</TableHead>
                    <TableHead className="text-right text-[10px] uppercase tracking-widest k-dim">Spent YTD</TableHead>
                    <TableHead className="text-right text-[10px] uppercase tracking-widest k-dim">Variance</TableHead>
                    <TableHead className="text-[10px] uppercase tracking-widest k-dim hidden sm:table-cell">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {DEPARTMENTS.filter((d) => d.id !== 'reserve').map((d) => {
                    const budgeted = allocations[d.id];
                    const spent = d.spentYtd;
                    const variance = spent - budgeted;
                    const favorable = variance <= 0;
                    return (
                      <TableRow
                        key={d.id}
                        className="border-[var(--k-line)] hover:bg-[rgba(0,212,255,0.04)]"
                      >
                        <TableCell className="font-bold text-sm k-fg-bright">
                          {d.name}
                        </TableCell>
                        <TableCell className="text-right font-mono text-sm k-cyan">
                          {zar(budgeted)}
                        </TableCell>
                        <TableCell className="text-right font-mono text-sm k-fg-bright">
                          {zar(spent)}
                        </TableCell>
                        <TableCell
                          className={`text-right font-mono text-sm font-bold ${
                            favorable ? 'k-pass' : 'k-danger'
                          }`}
                        >
                          {variance === 0 ? 'R 0' : zar(variance)}
                        </TableCell>
                        <TableCell className="hidden sm:table-cell">
                          {variance === 0 ? (
                            <span className="k-badge k-badge-dim">ON TRACK</span>
                          ) : favorable ? (
                            <span className="k-badge k-badge-pass">
                              <CheckCircle2 className="h-3 w-3" />
                              UNDER
                            </span>
                          ) : (
                            <span className="k-badge k-badge-danger">
                              <AlertTriangle className="h-3 w-3" />
                              OVER
                            </span>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
            <div className="mt-3 pt-3 border-t border-[var(--k-line)] grid grid-cols-2 sm:grid-cols-4 gap-3 text-[10px] uppercase tracking-widest k-dim">
              <Stat
                label="Total Budgeted"
                value={zar(
                  DEPARTMENTS.filter((d) => d.id !== 'reserve').reduce(
                    (a, d) => a + allocations[d.id],
                    0,
                  ),
                )}
                color="k-cyan"
              />
              <Stat
                label="Total Spent"
                value={zar(
                  DEPARTMENTS.filter((d) => d.id !== 'reserve').reduce(
                    (a, d) => a + d.spentYtd,
                    0,
                  ),
                )}
                color="k-fg-bright"
              />
              <Stat
                label="Total Variance"
                value={zar(
                  DEPARTMENTS.filter((d) => d.id !== 'reserve').reduce(
                    (a, d) => a + (d.spentYtd - allocations[d.id]),
                    0,
                  ),
                )}
                color={
                  DEPARTMENTS.filter((d) => d.id !== 'reserve').reduce(
                    (a, d) => a + (d.spentYtd - allocations[d.id]),
                    0,
                  ) <= 0
                    ? 'k-pass'
                    : 'k-danger'
                }
              />
              <Stat
                label="Emergency Reserve"
                value={zar(allocations.reserve)}
                color="k-warn"
              />
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────

function BudgetStat({
  label,
  value,
  icon: Icon,
  color,
  sublabel,
  progressPct,
  warn,
}: {
  label: string;
  value: string;
  icon: typeof Banknote;
  color: string;
  sublabel: string;
  progressPct?: number;
  warn?: boolean;
}) {
  return (
    <div
      className="rounded-md border bg-[var(--k-bg-elevated)] p-3"
      style={{
        borderColor: warn ? 'var(--k-red-bright)' : 'var(--k-line)',
        boxShadow: warn ? '0 0 0 1px rgba(255,77,77,0.3)' : 'none',
      }}
    >
      <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-widest k-dim mb-1">
        <Icon className="h-3 w-3" style={{ color }} />
        {label}
      </div>
      <div
        className="text-2xl sm:text-3xl font-bold leading-none"
        style={{ color }}
      >
        {value}
      </div>
      <div className="text-[10px] uppercase tracking-widest k-dim mt-2">
        {sublabel}
      </div>
      {progressPct !== undefined && (
        <div className="mt-2">
          <div className="k-trust-bar h-1.5">
            <div
              className="k-trust-bar-fill"
              style={{ width: `${Math.min(100, progressPct)}%` }}
            />
          </div>
        </div>
      )}
    </div>
  );
}

function Stat({
  label,
  value,
  color,
}: {
  label: string;
  value: string;
  color: string;
}) {
  return (
    <div className="flex flex-col gap-0.5">
      <span>{label}</span>
      <span className={`font-mono font-bold text-sm ${color}`}>{value}</span>
    </div>
  );
}

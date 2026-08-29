import { memo } from "react";
import {
  Activity,
  CheckCircle2,
  RotateCcw,
  ShieldAlert,
  ShieldCheck,
  Waves,
  X,
} from "lucide-react";
import type { Pipe, SimStats } from "../lib/engine";
import {
  confidenceInterval,
  findLeakPipe,
  MAX_CYCLES,
  NAIVE_THRESHOLD,
  VERIFIED_THRESHOLD,
} from "../lib/engine";
import type { SimStatus } from "../lib/sim";

export interface SidebarProps {
  open: boolean;
  onClose: () => void;
  pipes: Pipe[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  status: SimStatus;
  protocol72: boolean;
  stats: SimStats;
  onReset: () => void;
}

const pct = (p: number) => `${(p * 100).toFixed(1)}%`;

export default function Sidebar({
  open,
  onClose,
  pipes,
  selectedId,
  onSelect,
  status,
  protocol72,
  stats,
  onReset,
}: SidebarProps) {
  const sorted = [...pipes].sort((a, b) => b.posterior - a.posterior);
  const topPipe = sorted[0];
  const selectedPipe = selectedId ? pipes.find((p) => p.id === selectedId) : undefined;
  const leakId = findLeakPipe(pipes).id;

  return (
    <>
      {/* Mobile scrim */}
      <div
        onClick={onClose}
        aria-hidden="true"
        className={`fixed inset-0 z-[19] bg-black/50 transition-opacity duration-200 lg:hidden ${
          open ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
      />

      <aside
        aria-label="Network analysis panel"
        className={`fixed inset-y-0 left-0 z-20 flex w-[340px] max-w-[86vw] flex-col border-r border-edge bg-background/95 backdrop-blur-md transition-transform duration-300 ease-out lg:translate-x-0 ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Header */}
        <header className="flex items-center gap-3 border-b border-edge px-4 py-3">
          <div className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-accent/15 text-accent">
            <Waves className="h-5 w-5" aria-hidden="true" />
          </div>
          <div className="min-w-0 flex-1">
            <h1 className="truncate text-sm font-bold tracking-tight text-foreground">SEARM1</h1>
            <p className="truncate text-[11px] text-muted">Water Network Leak Detection</p>
          </div>
          <button
            type="button"
            onClick={onReset}
            title="Reset simulation"
            aria-label="Reset simulation"
            className="grid h-8 w-8 cursor-pointer place-items-center rounded-md border border-edge bg-surface-2 text-muted transition-colors duration-150 hover:text-accent focus-visible:outline-2 focus-visible:outline-accent"
          >
            <RotateCcw className="h-4 w-4" aria-hidden="true" />
          </button>
          <button
            type="button"
            onClick={onClose}
            title="Close panel"
            aria-label="Close panel"
            className="grid h-8 w-8 cursor-pointer place-items-center rounded-md border border-edge bg-surface-2 text-muted transition-colors duration-150 hover:text-accent focus-visible:outline-2 focus-visible:outline-accent lg:hidden"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        </header>

        <div className="flex min-h-0 flex-1 flex-col overflow-y-auto app-scroll">
          {/* EIS badge */}
          <section className="border-b border-edge px-4 py-3">
            <div className="flex items-center justify-between">
              <span className="section-label">EIS Badge · Top Pipe</span>
              {topPipe.isLeak && <LeakChip />}
            </div>
            <div className="mt-2 flex items-end justify-between rounded-lg border border-edge bg-surface-2 px-3 py-2.5">
              <div>
                <div className="text-[10px] uppercase tracking-wider text-muted">Evidence Indep. Score</div>
                <div className="font-mono text-2xl font-semibold leading-tight text-accent">
                  {topPipe.eis.toFixed(3)}
                </div>
              </div>
              <div className="text-right">
                <span className={`grade-badge grade-${topPipe.eisGrade.toLowerCase()}`}>
                  {topPipe.eisGrade}
                </span>
                <div className="mt-1.5 font-mono text-[11px] text-muted">{topPipe.id}</div>
                <div className="font-mono text-[11px] font-medium text-foreground">
                  {pct(topPipe.posterior)} P(leak)
                </div>
              </div>
            </div>
            <div
              className="mt-2 h-1.5 overflow-hidden rounded-full bg-edge"
              role="progressbar"
              aria-valuenow={Math.round(topPipe.eis * 100)}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label="EIS score"
            >
              <div
                className="h-full rounded-full bg-gradient-to-r from-accent to-verified transition-all duration-300"
                style={{ width: `${topPipe.eis * 100}%` }}
              />
            </div>
          </section>

          {/* Pipe list */}
          <section className="flex min-h-0 flex-1 flex-col border-b border-edge">
            <div className="flex items-center justify-between px-4 pb-2 pt-3">
              <span className="section-label">Pipe List</span>
              <span className="font-mono text-[11px] text-muted">{pipes.length} segments</span>
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto px-2 pb-2">
              {sorted.map((p) => (
                <PipeRow key={p.id} pipe={p} selected={p.id === selectedId} onSelect={onSelect} />
              ))}
            </div>
          </section>

          {/* Audit trail */}
          <section className="border-b border-edge px-4 py-3">
            <span className="section-label">Audit Trail</span>
            {protocol72 ? (
              <div className="mt-2 rounded-lg border border-candidate/30 bg-candidate/10 p-3 text-xs text-candidate">
                <div className="flex items-center gap-2 font-semibold">
                  <ShieldAlert className="h-4 w-4" aria-hidden="true" />
                  72h Blind-Test Protocol active
                </div>
                <p className="mt-1 leading-relaxed text-candidate/90">
                  Operator details are withheld until the protocol window closes. Pipes stay
                  coloured by their current assessment.
                </p>
              </div>
            ) : selectedPipe ? (
              <AuditDetail pipe={selectedPipe} />
            ) : (
              <div className="mt-2 rounded-lg border border-edge bg-surface-2 p-3 text-xs leading-relaxed text-muted">
                Select any pipe on the map or in the list to inspect its evidence trail — posterior,
                confidence interval, EIS and category transitions.
              </div>
            )}
          </section>

          {/* Comparative analysis */}
          <section className="px-4 py-3">
            <span className="section-label">Comparative Analysis</span>
            <p className="mt-1 text-[11px] leading-snug text-muted">
              Pipes flagged at any point during the run (peak posterior).
            </p>
            <div className="mt-2 grid grid-cols-2 gap-2">
              <MethodCard
                name="VVU-IVE · EIS"
                threshold={`≥ ${VERIFIED_THRESHOLD}`}
                count={stats.vvuCount}
                falsePositives={stats.vvuFalsePositives}
                tone="verified"
              />
              <MethodCard
                name="Naive"
                threshold={`> ${NAIVE_THRESHOLD}`}
                count={stats.naiveCount}
                falsePositives={stats.naiveFalsePositives}
                tone="warn"
              />
            </div>
            <Verdict stats={stats} />
            <div className="mt-2 flex items-center justify-between rounded-md border border-edge bg-surface-2 px-2.5 py-1.5">
              <span className="text-[11px] text-muted">True leak (simulated)</span>
              <span className="font-mono text-[11px] font-semibold text-accent">{leakId}</span>
            </div>
          </section>
        </div>

        <footer className="border-t border-edge px-4 py-2 text-[10px] text-muted/70">
          Simulated network · {MAX_CYCLES} cycles · {status.toLowerCase()}
        </footer>
      </aside>
    </>
  );
}

function LeakChip() {
  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-accent/40 bg-accent/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-accent">
      <Activity className="h-3 w-3" aria-hidden="true" />
      Leak
    </span>
  );
}

const PipeRow = memo(function PipeRow({
  pipe,
  selected,
  onSelect,
}: {
  pipe: Pipe;
  selected: boolean;
  onSelect: (id: string) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onSelect(pipe.id)}
      aria-pressed={selected}
      className={`group flex w-full cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-left transition-colors duration-150 focus-visible:outline-2 focus-visible:outline-accent ${
        selected ? "bg-accent/10 ring-1 ring-inset ring-accent/40" : "hover:bg-surface-2"
      }`}
    >
      <span className="w-11 shrink-0 font-mono text-[11px] text-muted">{pipe.id}</span>
      <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-edge">
        <span
          className="block h-full rounded-full transition-all duration-300"
          style={{
            width: `${Math.min(100, pipe.posterior * 100)}%`,
            backgroundColor: pipeColorCss(pipe),
          }}
        />
      </span>
      <span className="w-12 shrink-0 text-right font-mono text-[11px] text-foreground">
        {pct(pipe.posterior)}
      </span>
      <CategoryTag category={pipe.category} />
    </button>
  );
});

function pipeColorCss(pipe: Pipe): string {
  if (pipe.category === "VERIFIED") return "#34d399";
  if (pipe.category === "CANDIDATE") return "#fbbf24";
  return "#64748b";
}

function CategoryTag({ category }: { category: Pipe["category"] }) {
  const styles: Record<Pipe["category"], string> = {
    INSUFFICIENT: "border-edge bg-surface-2 text-muted",
    CANDIDATE: "border-candidate/40 bg-candidate/10 text-candidate",
    VERIFIED: "border-verified/40 bg-verified/10 text-verified",
  };
  return (
    <span
      className={`inline-flex shrink-0 items-center rounded-full border px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wider ${styles[category]}`}
    >
      {category === "VERIFIED" ? (
        <CheckCircle2 className="mr-0.5 h-3 w-3" aria-hidden="true" />
      ) : category === "CANDIDATE" ? (
        <ShieldAlert className="mr-0.5 h-3 w-3" aria-hidden="true" />
      ) : (
        <ShieldCheck className="mr-0.5 h-3 w-3" aria-hidden="true" />
      )}
      {category}
    </span>
  );
}

function AuditDetail({ pipe }: { pipe: Pipe }) {
  const ci = confidenceInterval(pipe);
  const narrow = ci.high - ci.low < 0.3;
  return (
    <div className="mt-2 rounded-lg border border-edge bg-surface-2 p-3">
      <div className="flex items-start justify-between gap-2">
        <div>
          <div className="text-[10px] uppercase tracking-wider text-muted">P(Leak)</div>
          <div className={`font-mono text-2xl font-semibold ${narrow ? "text-verified" : "text-warn"}`}>
            {pct(pipe.posterior)}
          </div>
        </div>
        <div className="text-right">
          <div className="text-[10px] uppercase tracking-wider text-muted">95% CI</div>
          <div className={`font-mono text-xs ${narrow ? "text-verified" : "text-warn"}`}>
            [{pct(ci.low)} · {pct(ci.high)}]
          </div>
        </div>
      </div>
      <dl className="mt-3 grid grid-cols-2 gap-x-3 gap-y-2 text-[11px]">
        <Stat label="Observations" value={String(pipe.obs)} />
        <Stat label="Hits" value={String(pipe.hits)} />
        <Stat label="α / β" value={`${pipe.alpha.toFixed(1)} / ${pipe.beta.toFixed(1)}`} />
        <Stat label="EIS" value={`${pipe.eis.toFixed(3)} · ${pipe.eisGrade}`} />
      </dl>
      {pipe.history.length > 0 && (
        <div className="mt-3">
          <div className="text-[10px] uppercase tracking-wider text-muted">Transitions</div>
          <div className="mt-1 flex flex-wrap gap-1">
            {pipe.history.map((t) => (
              <span
                key={t.cycle}
                className="rounded border border-edge bg-background px-1.5 py-0.5 font-mono text-[10px] text-muted"
              >
                c{t.cycle} → {t.category}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-2 rounded border border-edge/60 bg-background px-2 py-1">
      <dt className="text-muted">{label}</dt>
      <dd className="font-mono font-medium text-foreground">{value}</dd>
    </div>
  );
}

function MethodCard({
  name,
  threshold,
  count,
  falsePositives,
  tone,
}: {
  name: string;
  threshold: string;
  count: number;
  falsePositives: number;
  tone: "verified" | "warn";
}) {
  const accent = tone === "verified" ? "text-verified" : "text-warn";
  const bar = tone === "verified" ? "bg-verified" : "bg-warn";
  return (
    <div className="rounded-lg border border-edge bg-surface-2 p-2.5">
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-semibold text-foreground">{name}</span>
        <span className="font-mono text-[10px] text-muted">{threshold}</span>
      </div>
      <div className={`mt-1 font-mono text-2xl font-semibold ${accent}`}>{count}</div>
      <div className="text-[10px] text-muted">pipes flagged</div>
      <div className="mt-2 h-1 overflow-hidden rounded-full bg-edge">
        <div className={`h-full ${bar}`} style={{ width: `${Math.min(100, count * 3)}%` }} />
      </div>
      <div className={`mt-1.5 font-mono text-[10px] ${falsePositives > 0 ? "text-warn" : "text-verified"}`}>
        {falsePositives > 0
          ? `${falsePositives} false positive${falsePositives === 1 ? "" : "s"}`
          : "0 false positives"}
      </div>
    </div>
  );
}

function Verdict({ stats }: { stats: SimStats }) {
  const vvuClean = stats.vvuFalsePositives === 0;
  return (
    <div className="mt-2 flex items-start gap-2 rounded-lg border border-edge bg-surface-2 px-2.5 py-2 text-[11px] leading-relaxed">
      <span className="mt-0.5 text-accent">
        <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />
      </span>
      <p className="text-muted">
        {vvuClean ? (
          <>
            The EIS method found <b className="text-foreground">{stats.vvuCount}</b> confirmed
            pipe{stats.vvuCount === 1 ? "" : "s"} with{" "}
            <b className="text-verified">no false positives</b>, while the naive threshold flagged{" "}
            <b className="text-foreground">{stats.naiveCount}</b> — including{" "}
            <b className="text-warn">{stats.naiveFalsePositives}</b> that weren't the leak.
          </>
        ) : (
          <>
            VVU-IVE flagged <b className="text-foreground">{stats.vvuCount}</b> pipe
            {stats.vvuCount === 1 ? "" : "s"} vs.{" "}
            <b className="text-foreground">{stats.naiveCount}</b> for the naive threshold. Inspect
            the audit trail to see why each pipe was flagged.
          </>
        )}
      </p>
    </div>
  );
}

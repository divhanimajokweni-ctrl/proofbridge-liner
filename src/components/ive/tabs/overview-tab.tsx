"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Gauge,
  ShieldCheck,
  Hourglass,
  Scroll,
  Activity,
  Cpu,
  Layers,
  Bot,
  Lock,
  Zap,
  TrendingUp,
  TrendingDown,
  Minus,
} from "lucide-react";
import {
  KPIS,
  WATCHDOG_GATES,
  AIR_EVENTS,
  gateOverallScore,
} from "@/lib/ive/data";
import { ParticleField } from "../particle-field";
import { HoloSigil } from "../holo-sigil";

const ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  Gauge,
  ShieldCheck,
  Hourglass,
  Scroll,
};

const ACCENT_MAP = {
  gold: { text: "ive-text-gold", bar: "from-amber-500 to-yellow-400", glow: "ive-glow-gold" },
  emerald: { text: "ive-text-emerald", bar: "from-emerald-500 to-teal-400", glow: "ive-glow-emerald" },
  rose: { text: "ive-text-rose", bar: "from-rose-500 to-red-400", glow: "ive-glow-rose" },
  jade: { text: "ive-text-jade", bar: "from-green-500 to-emerald-500", glow: "ive-glow-emerald" },
};

const TREND_ICON = {
  up: TrendingUp,
  down: TrendingDown,
  flat: Minus,
};

export function OverviewTab({
  onJump,
}: {
  onJump: (tab: string) => void;
}) {
  const score = gateOverallScore();

  return (
    <div className="space-y-6">
      {/* Hero / mission banner */}
      <Card className="relative overflow-hidden border-border/60 ive-glass-gold">
        <ParticleField density={50} />
        <div className="relative grid gap-6 p-6 md:grid-cols-[1.4fr_1fr] md:p-8">
          <div className="space-y-4">
            <Badge
              variant="outline"
              className="border-[oklch(0.82_0.16_75/40%)] ive-text-gold"
            >
              Genesis → Hydro-Bayesian Mk-II
            </Badge>
            <h2 className="font-mono text-2xl font-semibold leading-tight md:text-3xl">
              From{" "}
              <span className="ive-text-gold">silence</span>, we proceed —
              bridging architectural hypotheses with{" "}
              <span className="ive-text-emerald">empirically validated</span>{" "}
              mechanical claims.
            </h2>
            <p className="max-w-2xl text-sm text-muted-foreground">
              The Immersive Virtual Environment coordinates Facilitator agents,
              agnostic CAD/GIS integration, and a model-driven V-design loop.
              The HBK Mk-II upgrade replaces MCMC with supervised random Fourier
              basis functions, cutting inference time by 85–96% while keeping
              physics-informed priors intact.
            </p>
            <div className="flex flex-wrap gap-2 pt-2">
              <button
                onClick={() => onJump("hbk")}
                className="rounded-md border ive-border-gold bg-primary/10 px-3 py-1.5 font-mono text-xs uppercase tracking-widest ive-text-gold transition hover:bg-primary/20"
              >
                Inspect Kernel
              </button>
              <button
                onClick={() => onJump("facilitator")}
                className="rounded-md border border-border bg-secondary/40 px-3 py-1.5 font-mono text-xs uppercase tracking-widest text-foreground transition hover:bg-secondary"
              >
                Talk to Facilitator
              </button>
              <button
                onClick={() => onJump("crypto")}
                className="rounded-md border border-border bg-secondary/40 px-3 py-1.5 font-mono text-xs uppercase tracking-widest text-foreground transition hover:bg-secondary"
              >
                Governance Artifacts
              </button>
            </div>
          </div>

          <div className="relative flex items-center justify-center">
            <HoloSigil size={180} />
            <div className="absolute bottom-0 right-0 rounded-md ive-glass px-3 py-2 text-right">
              <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                Watchdog Maturity
              </div>
              <div className="font-mono text-2xl font-bold ive-text-gold">
                {score}%
              </div>
              <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                Production-ready for demo
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* KPI grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {KPIS.map((k) => {
          const Icon = ICONS[k.icon] ?? Activity;
          const accent = ACCENT_MAP[k.accent];
          const Trend = TREND_ICON[k.trend];
          return (
            <Card
              key={k.id}
              className={`relative overflow-hidden border-border/60 ive-glass ${accent.glow}`}
            >
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardDescription className="font-mono text-[10px] uppercase tracking-widest">
                  {k.label}
                </CardDescription>
                <Icon className={`h-4 w-4 ${accent.text}`} />
              </CardHeader>
              <CardContent className="space-y-1.5">
                <div className="font-mono text-2xl font-bold">{k.value}</div>
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Trend className={`h-3 w-3 ${accent.text}`} />
                  <span className={accent.text}>{k.delta}</span>
                  <span>vs prior epoch</span>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Watchdog gates + AIR feed */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card className="border-border/60 ive-glass">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 font-mono text-sm uppercase tracking-widest">
              <ShieldCheck className="h-4 w-4 ive-text-gold" />
              Watchdog Gate Engine
            </CardTitle>
            <CardDescription className="text-xs">
              Five release gates. Soak &amp; kill-switch drills pending
              green-light from AIR evidence decay tracker.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {WATCHDOG_GATES.map((g) => {
              const tone =
                g.status === "PASS"
                  ? "ive-text-emerald"
                  : g.status === "PENDING"
                  ? "ive-text-gold"
                  : g.status === "FAIL"
                  ? "ive-text-rose"
                  : "text-muted-foreground";
              return (
                <div key={g.id} className="space-y-1.5">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-[10px] text-muted-foreground">
                        {g.id}
                      </span>
                      <span className="font-mono text-xs font-medium">
                        {g.label}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`font-mono text-xs ${tone}`}>
                        {g.status.replace("_", " ")}
                      </span>
                      <span className="font-mono text-xs font-semibold ive-text-gold">
                        {g.score}%
                      </span>
                    </div>
                  </div>
                  <Progress
                    value={g.score}
                    className="h-1.5"
                    // visually adjust via className using primary var
                  />
                  <p className="text-[11px] text-muted-foreground">{g.detail}</p>
                </div>
              );
            })}
          </CardContent>
        </Card>

        <Card className="border-border/60 ive-glass">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 font-mono text-sm uppercase tracking-widest">
              <Activity className="h-4 w-4 ive-text-emerald" />
              AIR Runtime Live Feed
            </CardTitle>
            <CardDescription className="text-xs">
              Autonomous Infrastructure Runtime — observes execution states and
              intervenes in real time without touching application logic.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="ive-scrollbar max-h-80 space-y-2 overflow-y-auto pr-1">
              {AIR_EVENTS.map((e) => {
                const tone =
                  e.severity === "critical"
                    ? "ive-text-rose"
                    : e.severity === "warn"
                    ? "ive-text-gold"
                    : "ive-text-emerald";
                const dot =
                  e.severity === "critical"
                    ? "bg-rose-500"
                    : e.severity === "warn"
                    ? "bg-amber-500"
                    : "bg-emerald-500";
                return (
                  <div
                    key={e.id}
                    className="rounded-md border border-border/40 bg-secondary/30 p-2.5"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className={`h-1.5 w-1.5 rounded-full ${dot}`} />
                        <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                          {e.ts} · {e.layer}
                        </span>
                      </div>
                      <span className={`font-mono text-[10px] uppercase tracking-widest ${tone}`}>
                        {e.severity}
                      </span>
                    </div>
                    <p className="mt-1 text-xs leading-relaxed">{e.message}</p>
                    {e.action && (
                      <div className="mt-1.5 inline-flex items-center gap-1 rounded bg-primary/10 px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-widest ive-text-gold">
                        <Zap className="h-3 w-3" />
                        intervention: {e.action}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Layer map */}
      <Card className="border-border/60 ive-glass">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 font-mono text-sm uppercase tracking-widest">
            <Layers className="h-4 w-4 ive-text-gold" />
            IVE Layer Stack
          </CardTitle>
          <CardDescription className="text-xs">
            Four interwoven layers manage increasing system complexity — from
            agnostic data fusion to traceable governance.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            {[
              {
                icon: Layers,
                title: "L1 · Agnostic Integration",
                body: "CAD DWG, GIS SHP, BIM RVT, IoT MQTT unified into a single platform — no manual data transfers.",
                accent: "gold",
              },
              {
                icon: Bot,
                title: "L2 · Facilitator Agent",
                body: "Tracks agendas, captures ad-hoc decisions, co-authors meeting notes, schedules follow-ups.",
                accent: "emerald",
              },
              {
                icon: Cpu,
                title: "L3 · HBK Mk-II Kernel",
                body: "Supervised random Fourier basis replaces MCMC. 85–96% faster on large exposure datasets.",
                accent: "gold",
              },
              {
                icon: Lock,
                title: "L4 · zipenc + Governance",
                body: "AES-256 .enc vault, OmniClass maps, minted compliance exports for SOC2/FICA/HPCSA/SAICA/NSC/Constitution.",
                accent: "jade",
              },
            ].map((l) => {
              const Icon = l.icon;
              const tone =
                l.accent === "gold"
                  ? "ive-text-gold"
                  : l.accent === "emerald"
                  ? "ive-text-emerald"
                  : "ive-text-jade";
              return (
                <div
                  key={l.title}
                  className="rounded-lg border border-border/40 bg-secondary/30 p-3"
                >
                  <div className="flex items-center gap-2">
                    <Icon className={`h-4 w-4 ${tone}`} />
                    <h3 className="font-mono text-xs uppercase tracking-widest">
                      {l.title}
                    </h3>
                  </div>
                  <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                    {l.body}
                  </p>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

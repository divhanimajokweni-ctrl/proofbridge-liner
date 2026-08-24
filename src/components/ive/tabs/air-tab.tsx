"use client";

import { useEffect, useState } from "react";
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
  Activity,
  Hourglass,
  ShieldCheck,
  Zap,
  AlertTriangle,
  Cpu,
  Network,
  ScrollText,
} from "lucide-react";
import { AIR_EVENTS, EVIDENCE_ITEMS } from "@/lib/ive/data";

const EVIDENCE_TONES = {
  verified: "ive-text-emerald",
  stale: "ive-text-gold",
  decayed: "ive-text-rose",
  conjecture: "text-muted-foreground",
};

const SEVERITY_TONES = {
  info: "ive-text-emerald",
  warn: "ive-text-gold",
  critical: "ive-text-rose",
};

const SEVERITY_DOTS = {
  info: "bg-emerald-500",
  warn: "bg-amber-500",
  critical: "bg-rose-500",
};

export function AirTab() {
  const [events, setEvents] = useState(AIR_EVENTS);

  // Simulated live event stream: append a synthetic AIR observation every
  // 1.8s. State update happens inside the interval callback (not in the
  // effect body), avoiding cascading renders.
  useEffect(() => {
    let counter = 0;
    const samples = [
      {
        layer: "serving" as const,
        severity: "info" as const,
        message: () => `HBK inference served batch #${4200 + counter} (38ms).`,
      },
      {
        layer: "evidence" as const,
        severity: "info" as const,
        message: () => "Decay tracker recomputed temporal accountability.",
      },
      {
        layer: "intervention" as const,
        severity: "warn" as const,
        message: () => "Stale assumption detected — re-verification queued.",
        action: "queue_reverify",
      },
    ];
    const id = setInterval(() => {
      counter += 1;
      const e = samples[counter % samples.length];
      const ts = new Date().toLocaleTimeString("en-GB", { hour12: false });
      setEvents((prev) =>
        [
          {
            id: `live-${counter}`,
            ts,
            layer: e.layer,
            severity: e.severity,
            message: e.message(),
            action: e.action,
          },
          ...prev,
        ].slice(0, 12)
      );
    }, 1800);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="space-y-6">
      {/* Hero row */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="ive-glass-gold">
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-widest">
              <Activity className="h-3 w-3 ive-text-gold" />
              AIR Runtime
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="font-mono text-lg font-bold ive-text-gold">
              Autonomous Infrastructure Runtime
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              Execution-time control layer between agent orchestration and
              model serving. Observes states and intervenes in real time without
              touching application logic.
            </p>
          </CardContent>
        </Card>
        <Card className="ive-glass">
          <CardHeader className="pb-2">
            <CardDescription className="font-mono text-[10px] uppercase tracking-widest">
              Active Interventions
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="font-mono text-4xl font-bold ive-text-rose">2</div>
            <p className="mt-1 text-xs text-muted-foreground">
              1 conjecture block · 1 stale re-verification queue.
            </p>
          </CardContent>
        </Card>
        <Card className="ive-glass">
          <CardHeader className="pb-2">
            <CardDescription className="font-mono text-[10px] uppercase tracking-widest">
              Trust Inflation Guard
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-8 w-8 ive-text-emerald" />
              <div>
                <div className="font-mono text-lg font-bold ive-text-emerald">
                  ARMED
                </div>
                <p className="text-xs text-muted-foreground">
                  Distinguishes conjecture from verified knowledge.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* AIR architecture pipeline */}
      <Card className="ive-glass">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 font-mono text-sm uppercase tracking-widest">
            <Cpu className="h-4 w-4 ive-text-gold" />
            AIR Layered Pipeline
          </CardTitle>
          <CardDescription className="text-xs">
            Four interwoven layers — orchestration → serving → intervention →
            evidence.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 md:grid-cols-4">
            {[
              {
                icon: Network,
                name: "Orchestration",
                body: "Facilitator agent + workflow coordination.",
              },
              {
                icon: Cpu,
                name: "Serving",
                body: "HBK Mk-II inference + GP regression.",
              },
              {
                icon: Zap,
                name: "Intervention",
                body: "Real-time blockers, re-verify queues.",
              },
              {
                icon: ScrollText,
                name: "Evidence",
                body: "Decay tracker + temporal accountability.",
              },
            ].map((l, i) => {
              const Icon = l.icon;
              return (
                <div key={l.name} className="relative">
                  <div className="rounded-lg border border-border/40 bg-secondary/30 p-3">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                        L{i + 1}
                      </span>
                      <Icon className="h-4 w-4 ive-text-gold" />
                    </div>
                    <div className="mt-1 font-mono text-sm font-medium">
                      {l.name}
                    </div>
                    <p className="text-xs text-muted-foreground">{l.body}</p>
                  </div>
                  {i < 3 && (
                    <div className="absolute -right-3 top-1/2 hidden -translate-y-1/2 text-muted-foreground md:block">
                      →
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Live event stream + evidence decay */}
      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="ive-glass">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 font-mono text-sm uppercase tracking-widest">
              <Activity className="h-4 w-4 ive-text-emerald" />
              Live AIR Event Stream
            </CardTitle>
            <CardDescription className="text-xs">
              Real-time observations + interventions. Streams update every
              ~1.8s.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="ive-scrollbar max-h-[420px] space-y-2 overflow-y-auto pr-1">
              {events.map((e) => {
                const tone = SEVERITY_TONES[e.severity];
                const dot = SEVERITY_DOTS[e.severity];
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

        <Card className="ive-glass">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 font-mono text-sm uppercase tracking-widest">
              <Hourglass className="h-4 w-4 ive-text-gold" />
              Evidence Decay Tracker
            </CardTitle>
            <CardDescription className="text-xs">
              Temporal accountability for every claim. Stale architectural
              assumptions surface before they cause failures.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2.5">
              {EVIDENCE_ITEMS.map((e) => {
                const tone = EVIDENCE_TONES[e.state];
                return (
                  <div
                    key={e.id}
                    className="rounded-lg border border-border/40 bg-secondary/30 p-3"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                        {e.id}
                      </span>
                      <Badge
                        variant="outline"
                        className={`font-mono text-[10px] uppercase tracking-widest ${tone}`}
                      >
                        {e.state}
                      </Badge>
                    </div>
                    <p className="mt-1 text-xs font-medium">{e.claim}</p>
                    <div className="mt-2 flex items-center justify-between font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                      <span>src · {e.source}</span>
                      <span>decay · {e.decayed}d</span>
                    </div>
                    <div className="mt-2">
                      <div className="mb-1 flex items-center justify-between font-mono text-[10px] uppercase tracking-widest">
                        <span className="text-muted-foreground">confidence</span>
                        <span className={tone}>{Math.round(e.confidence * 100)}%</span>
                      </div>
                      <Progress value={e.confidence * 100} className="h-1.5" />
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="mt-3 rounded-md border border-[oklch(0.65_0.21_22/30%)] bg-rose-500/5 p-3">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-3.5 w-3.5 ive-text-rose" />
                <span className="font-mono text-[10px] uppercase tracking-widest ive-text-rose">
                  Auto-decay surfaced 1 conjecture
                </span>
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                e4 (VR nausea threshold) blocked publication of governance
                artifact GA-114 until measurement is captured.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Boxes, Bot, Activity, Cpu, Network, Zap } from "lucide-react";
import AntonVVU from "../anton-vvu";
import AntonGame from "../anton-game";

type Mode = "build" | "arena";

/**
 * Accretion Sandbox tab — interactive demonstration of IVE concepts.
 *
 * Two interchangeable modes:
 *  - Build-Layer (AntonVVU): node editor + live accretion-disk arena.
 *    Demonstrates agnostic integration (spatial triggers as CAD/GIS layers),
 *    model-driven V-design (each wire = requirement ↔ verification pair),
 *    and AIR runtime intervention (live logic execution without restart).
 *  - Classic Arena (AntonGame): survival shooter variant. Pilot Anton the
 *    Ant against escalating waves around a black-hole singularity, using
 *    Time Dilate / Mag Pulse / Grav Fusion abilities.
 */
export function SandboxTab() {
  const [mode, setMode] = useState<Mode>("build");

  return (
    <div className="space-y-4">
      {/* Intro card */}
      <Card className="ive-glass-gold">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 font-mono text-sm uppercase tracking-widest">
            <Boxes className="h-4 w-4 ive-text-gold" />
            Accretion Disk Sandbox · Live IVE Demonstration
          </CardTitle>
          <CardDescription className="text-xs">
            Interactive demonstration of the IVE usage-model pillars. The
            black-hole accretion disk visualizes the convergence of CAD/GIS
            spatial layers; the node editor enacts model-driven V-design; the
            runtime logic layer enacts AIR intervention without touching
            application code.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {[
              {
                icon: Network,
                title: "Agnostic Integration",
                body: "Spatial trigger radii act like CAD/GIS layers — every entity_enter zone is a coordinate-anchored feature class.",
                tone: "ive-text-gold",
              },
              {
                icon: Cpu,
                title: "Model-Driven V-Design",
                body: "Wires map requirements (trigger tiles) to verification (action tiles) — bidirectional and traceable.",
                tone: "ive-text-emerald",
              },
              {
                icon: Activity,
                title: "AIR Runtime",
                body: "LogicTileSystem evaluates triggers every tick and propagates execution — no application restart.",
                tone: "ive-text-jade",
              },
              {
                icon: Zap,
                title: "Real-Time Intervention",
                body: "Hazard payloads (pheromone_lure, trail_fire) re-vector agents mid-simulation — observable impact.",
                tone: "ive-text-rose",
              },
            ].map((l) => {
              const Icon = l.icon;
              return (
                <div
                  key={l.title}
                  className="rounded-lg border border-border/40 bg-secondary/30 p-3"
                >
                  <div className="flex items-center gap-2">
                    <Icon className={`h-4 w-4 ${l.tone}`} />
                    <h3 className="font-mono text-[11px] uppercase tracking-widest">
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

      {/* Mode switcher */}
      <div className="vvu-mode-switch" role="tablist" aria-label="Sandbox mode">
        <button
          type="button"
          role="tab"
          aria-selected={mode === "build"}
          data-active={mode === "build"}
          className="vvu-mode-btn"
          onClick={() => setMode("build")}
        >
          <span className="mr-1.5">◈</span> Build-Layer · Node Editor + Arena
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={mode === "arena"}
          data-active={mode === "arena"}
          className="vvu-mode-btn"
          onClick={() => setMode("arena")}
        >
          <span className="mr-1.5">⟁</span> Classic Arena · Survival Shooter
        </button>
        <Badge
          variant="outline"
          className="ml-auto self-center border-[oklch(0.82_0.16_75/40%)] ive-text-gold"
        >
          <Bot className="mr-1 h-3 w-3" />
          Pilot · Anton the Ant
        </Badge>
      </div>

      {/* Mode content */}
      {mode === "build" ? <AntonVVU /> : <AntonGame />}

      {/* Controls hint */}
      <Card className="ive-glass">
        <CardContent className="p-4">
          <div className="grid gap-3 text-xs md:grid-cols-2">
            <div>
              <div className="mb-1.5 font-mono text-[10px] uppercase tracking-widest ive-text-gold">
                Movement
              </div>
              <ul className="space-y-1 text-muted-foreground">
                <li>
                  <code className="rounded bg-secondary/60 px-1.5 py-0.5 font-mono text-[11px]">W A S D</code>{" "}
                  or{" "}
                  <code className="rounded bg-secondary/60 px-1.5 py-0.5 font-mono text-[11px]">↑ ↓ ← →</code>{" "}
                  — pilot Anton through the accretion disk
                </li>
                <li>
                  <code className="rounded bg-secondary/60 px-1.5 py-0.5 font-mono text-[11px]">Mouse</code>{" "}
                  — aim; <code className="rounded bg-secondary/60 px-1.5 py-0.5 font-mono text-[11px]">click / hold</code>{" "}
                  — fire plasma
                </li>
              </ul>
            </div>
            <div>
              <div className="mb-1.5 font-mono text-[10px] uppercase tracking-widest ive-text-emerald">
                Abilities (Classic Arena)
              </div>
              <ul className="space-y-1 text-muted-foreground">
                <li>
                  <code className="rounded bg-secondary/60 px-1.5 py-0.5 font-mono text-[11px]">Q</code>{" "}
                  — Time Dilate (slow-mo, leaves a trail echo)
                </li>
                <li>
                  <code className="rounded bg-secondary/60 px-1.5 py-0.5 font-mono text-[11px]">E</code>{" "}
                  — Mag Pulse (stuns enemies in expanding ring)
                </li>
                <li>
                  <code className="rounded bg-secondary/60 px-1.5 py-0.5 font-mono text-[11px]">R</code>{" "}
                  — Grav Fusion Bomb (pulls + detonates at cursor)
                </li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

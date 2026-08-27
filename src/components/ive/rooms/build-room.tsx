'use client';

/**
 * BUILD ROOM · VVU IVE
 * -------------------
 * The Build Room is one of the rooms in the VVU Immersive Virtual
 * Environment (per DWS briefs 01b / 03a). It hosts four build activities:
 *
 *   1. HBK MKII        (priority — green EXISTS)    13-part exploded hardware
 *   2. Villa Ravine    (amber PARTIAL)              procedural villa · 11 cameras
 *   3. Ingestion        (green EXISTS)                drag-drop file ingestion + DRC
 *   4. 3D Mechanics     (green EXISTS)               4-body kinematic scene
 *
 * The component renders a grid of activity cards by default. Clicking a
 * card sets the selected activity (local state) and renders it full-screen
 * with a back button to return to the grid.
 *
 * Self-contained — accepts no props. Uses the kernel-theme CSS variables
 * and utility classes defined in src/app/globals.css.
 */

import { useState } from 'react';
import {
  ArrowLeft,
  Boxes,
  Camera,
  Cpu,
  Layers3,
  Upload,
  type LucideIcon,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import HbkMkiiViewport from '@/components/ive/build-room/hbk-mkii-viewport';
import VillaRavine from '@/components/ive/build-room/villa-ravine';
import IngestionTerminal from '@/components/ive/build-room/ingestion-terminal';
import Mechanics3D from '@/components/ive/build-room/mechanics-3d';

type Status = 'EXISTS' | 'PARTIAL';

interface ActivityDef {
  id: string;
  title: string;
  subtitle: string;
  desc: string;
  icon: LucideIcon;
  status: Status;
  priority?: boolean;
  parts: string;
  triangles: string;
  Component: React.ComponentType;
}

const ACTIVITIES: ActivityDef[] = [
  {
    id: 'hbk-mkii',
    title: 'HBK MKII',
    subtitle: 'Exploded Hardware Assembly',
    desc: '3D exploded view of the Hydro-Bayesian Kernel Mark II housing — 13 parts, 327k triangles. Sensor mounts, PCBs, antennas, battery, display. Click-to-inspect + DRC table.',
    icon: Cpu,
    status: 'EXISTS',
    priority: true,
    parts: '13',
    triangles: '327k',
    Component: HbkMkiiViewport,
  },
  {
    id: 'villa-ravine',
    title: 'Villa Ravine',
    subtitle: 'Procedural 3D Scene',
    desc: 'Procedural villa on a ravine with displaced terrain, box-house, cone roof, 2–3 trees, and a lowered ravine strip. 11 camera presets: day / night / section / floor plan + 7 cinematic angles.',
    icon: Camera,
    status: 'PARTIAL',
    parts: '11',
    triangles: '128k',
    Component: VillaRavine,
  },
  {
    id: 'ingestion',
    title: 'Ingestion',
    subtitle: 'File Drop · DRC · Pipeline',
    desc: 'Drag-drop file ingestion with live terminal output, observation registry (DRC table), and a 5-pass validation pipeline (Collect → Boundaries → Baseline → EIS → Export) with progress bar.',
    icon: Upload,
    status: 'EXISTS',
    parts: '5',
    triangles: '—',
    Component: IngestionTerminal,
  },
  {
    id: 'mechanics-3d',
    title: '3D Mechanics',
    subtitle: '4-Body Kinematic Scene',
    desc: 'Four coloured bodies connected by line joints. Explode, Yaw, Pitch, Zoom sliders, Auto-orbit toggle, OrbitControls always-on for free rotate/zoom.',
    icon: Boxes,
    status: 'EXISTS',
    parts: '4',
    triangles: '12k',
    Component: Mechanics3D,
  },
];

const STATUS_BADGE: Record<Status, string> = {
  EXISTS: 'k-badge-pass',
  PARTIAL: 'k-badge-warn',
};

export default function BuildRoom() {
  const [selectedId, setSelectedId] = useState<string | null>(null);

  // ─── Full-screen activity view ─────────────────────────────────────
  if (selectedId) {
    const activity = ACTIVITIES.find((a) => a.id === selectedId);
    if (!activity) {
      setSelectedId(null);
      return null;
    }
    const ActivityComponent = activity.Component;
    const Icon = activity.icon;
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
          <Separator orientation="vertical" className="h-6 bg-[var(--k-line-strong)]" />
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
          <div className="ml-auto flex items-center gap-2">
            <span className={`k-badge ${STATUS_BADGE[activity.status]}`}>
              {activity.status}
            </span>
            {activity.priority && (
              <span className="k-badge k-badge-process">PRIORITY</span>
            )}
            <span className="k-badge k-badge-dim hidden sm:inline-flex">
              PARTS · {activity.parts}
            </span>
            <span className="k-badge k-badge-dim hidden sm:inline-flex">
              TRI · {activity.triangles}
            </span>
          </div>
        </header>
        <main className="flex-1 min-h-0">
          <ActivityComponent />
        </main>
        <footer className="mt-auto px-4 py-2 border-t border-[var(--k-line)] bg-[var(--k-panel)] text-center">
          <span className="text-[10px] k-dim uppercase tracking-widest">
            VVU IVE · BUILD ROOM · {activity.title} · SIMULATION DATA · NOT FOR PRODUCTION USE
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
        <div className="flex items-center gap-3 mb-1">
          <Layers3 className="h-6 w-6 k-cyan" />
          <h1 className="text-xl sm:text-2xl font-bold k-cyan uppercase tracking-wider">
            Build Room
          </h1>
          <span className="k-badge k-badge-process ml-1">VVU IVE</span>
        </div>
        <p className="text-xs sm:text-sm k-dim max-w-2xl">
          Immersive Virtual Environment · build &amp; inspect subsystems for the
          VVU AIR KERNEL evidence pipeline. Select an activity below to enter
          its dedicated viewport.
        </p>
      </header>

      {/* Activity grid */}
      <main className="flex-1 px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-4 gap-4 sm:gap-6">
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
                <p className="text-xs k-dim leading-relaxed mb-3 min-h-[5.5rem]">
                  {activity.desc}
                </p>

                {/* Footer chips */}
                <div className="flex items-center justify-between pt-3 border-t border-[var(--k-line)]">
                  <div className="flex items-center gap-2 text-[10px] uppercase tracking-wider k-dim">
                    <span>PARTS</span>
                    <span className="k-fg-bright font-bold">{activity.parts}</span>
                    <span>·</span>
                    <span>TRI</span>
                    <span className="k-fg-bright font-bold">{activity.triangles}</span>
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
          VVU IVE · BUILD ROOM · 4 ACTIVITIES · SIMULATION DATA · NOT FOR PRODUCTION USE
        </span>
      </footer>
    </div>
  );
}

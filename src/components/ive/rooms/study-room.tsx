'use client';

/**
 * STUDY ROOM · VVU IVE
 * --------------------
 * The Study Room is one of the rooms in the VVU Immersive Virtual
 * Environment (per DWS briefs 01b / 03a). It hosts three learning activities:
 *
 *   1. Facilitator Agent   (LLM domain expert on EIS / HBK / HOM / 72h)
 *   2. Lesson Stepper      (9-step interactive lesson, 3/9 done per 03a)
 *   3. Residual Trunk      (8-layer engineering chain: Network → Audit)
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
  Bot,
  GraduationCap,
  Layers3,
  type LucideIcon,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import FacilitatorAgent from '@/components/ive/study-room/facilitator-agent';
import LessonStepper from '@/components/ive/study-room/lesson-stepper';
import ResidualTrunk from '@/components/ive/study-room/residual-trunk';

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
  Component: React.ComponentType;
}

const ACTIVITIES: ActivityDef[] = [
  {
    id: 'facilitator',
    title: 'Facilitator Agent',
    subtitle: 'LLM Domain Expert',
    desc: 'Chat with the VVU IVE Facilitator — a domain expert on EIS v1.0, HBK, HOM, the 72-hour protocol, and the Zero Fabrication Mandate. Suggested-question chips seed the conversation; auto-scroll keeps the transcript readable.',
    icon: Bot,
    status: 'EXISTS',
    priority: true,
    meta: [
      { label: 'MODEL', value: 'GLM-4-FLASH' },
      { label: 'STATUS', value: 'ONLINE' },
    ],
    Component: FacilitatorAgent,
  },
  {
    id: 'lessons',
    title: 'Lesson Stepper',
    subtitle: '9-Step Interactive Lesson',
    desc: 'Walk the 9 core VVU IVE lessons — HOM sparse sensors, EIS states + scoring, anomaly signatures, the 11-field provenance spine, Zero Fabrication, HBK localization, and the 72h protocol. Play/Pause/Step/Reset controls with a 4s auto-advance.',
    icon: GraduationCap,
    status: 'PARTIAL',
    meta: [
      { label: 'STEPS', value: '9' },
      { label: 'DONE', value: '3/9' },
    ],
    Component: LessonStepper,
  },
  {
    id: 'trunk',
    title: 'Residual Trunk',
    subtitle: '8-Layer Engineering Chain',
    desc: 'Interactive vertical diagram of the engineering chain from municipal water network to auditable evidence record. 8 layers: Network → Observations → Anomaly → Correlation → Independence → Inference → Verification → Audit.',
    icon: Layers3,
    status: 'PARTIAL',
    meta: [
      { label: 'LAYERS', value: '8' },
      { label: 'IMPL', value: '5/8' },
    ],
    Component: ResidualTrunk,
  },
];

const STATUS_BADGE: Record<Status, string> = {
  EXISTS: 'k-badge-pass',
  PARTIAL: 'k-badge-warn',
};

export default function StudyRoom() {
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
          <div className="ml-auto flex items-center gap-2">
            <span className={`k-badge ${STATUS_BADGE[activity.status]}`}>
              {activity.status}
            </span>
            {activity.priority && (
              <span className="k-badge k-badge-process">PRIORITY</span>
            )}
            {activity.meta.map((m) => (
              <span
                key={m.label}
                className="k-badge k-badge-dim hidden sm:inline-flex"
              >
                {m.label} · {m.value}
              </span>
            ))}
          </div>
        </header>
        <main className="flex-1 min-h-0">
          <ActivityComponent />
        </main>
        <footer className="mt-auto px-4 py-2 border-t border-[var(--k-line)] bg-[var(--k-panel)] text-center">
          <span className="text-[10px] k-dim uppercase tracking-widest">
            VVU IVE · STUDY ROOM · {activity.title.toUpperCase()} · SIMULATION
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
        <div className="flex items-center gap-3 mb-1">
          <GraduationCap className="h-6 w-6 k-cyan" />
          <h1 className="text-xl sm:text-2xl font-bold k-cyan uppercase tracking-wider">
            Study Room
          </h1>
          <span className="k-badge k-badge-process ml-1">VVU IVE</span>
        </div>
        <p className="text-xs sm:text-sm k-dim max-w-2xl">
          Immersive Virtual Environment · learn the VVU AIR KERNEL
          evidence-verification stack. Chat with the facilitator, walk the
          9-step lesson, or trace the 8-layer residual trunk from physical
          network to auditable record.
        </p>
      </header>

      {/* Activity grid */}
      <main className="flex-1 px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
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
                <p className="text-xs k-dim leading-relaxed mb-3 min-h-[6rem]">
                  {activity.desc}
                </p>

                {/* Footer chips */}
                <div className="flex items-center justify-between pt-3 border-t border-[var(--k-line)]">
                  <div className="flex items-center gap-2 text-[10px] uppercase tracking-wider k-dim">
                    {activity.meta.map((m, i) => (
                      <span key={m.label} className="flex items-center gap-1.5">
                        {i > 0 && <span>·</span>}
                        <span>{m.label}</span>
                        <span className="k-fg-bright font-bold">
                          {m.value}
                        </span>
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
          VVU IVE · STUDY ROOM · 3 ACTIVITIES · SIMULATION DATA · NOT FOR
          PRODUCTION USE
        </span>
      </footer>
    </div>
  );
}

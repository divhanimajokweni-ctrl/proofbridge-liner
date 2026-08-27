'use client';

/**
 * VVU IVE — World Container
 * =========================
 * Top-level navigation shell implementing the World → Room → Activity → Interaction
 * architecture from the DWS docs (02d architecture figure).
 *
 * 4 rooms: Build / Study / Data / Finance
 * - NO Game Room (excluded per user request)
 * - NO ANTPAY / premium tiers (excluded per user request)
 *
 * Each room component is self-contained: it renders an activity grid, and
 * when an activity is selected, renders it full-screen with a back button.
 * The World container provides the room tab bar + the sticky footer.
 */

import { useState } from 'react';
import {
  Boxes,
  BookOpen,
  Database,
  Wallet,
  Terminal,
  Fingerprint,
} from 'lucide-react';
import BuildRoom from '@/components/ive/rooms/build-room';
import StudyRoom from '@/components/ive/rooms/study-room';
import DataRoom from '@/components/ive/rooms/data-room';
import FinanceRoom from '@/components/ive/rooms/finance-room';

type RoomId = 'build' | 'study' | 'data' | 'finance';

interface RoomDef {
  id: RoomId;
  label: string;
  subtitle: string;
  icon: typeof Boxes;
  activities: number;
}

const ROOMS: RoomDef[] = [
  { id: 'build',   label: 'Build',   subtitle: '3D Hardware · Ingestion · Mechanics', icon: Boxes,    activities: 4 },
  { id: 'study',   label: 'Study',   subtitle: 'Lessons · Facilitator · Trunk',      icon: BookOpen, activities: 3 },
  { id: 'data',    label: 'Data',     subtitle: 'EIS · HBK · Sandbox · AIR · Field',  icon: Database, activities: 5 },
  { id: 'finance', label: 'Finance', subtitle: 'Ubuntu Pool · NMBM Budget',           icon: Wallet,   activities: 2 },
];

export default function Home() {
  const [room, setRoom] = useState<RoomId>('data');

  const currentRoom = ROOMS.find((r) => r.id === room) ?? ROOMS[2];
  const totalActivities = ROOMS.reduce((sum, r) => sum + r.activities, 0);

  return (
    <div className="kernel-theme min-h-screen flex flex-col k-grid-bg">
      {/* ─── World Header ─── */}
      <header className="border-b border-[var(--k-line)] bg-gradient-to-r from-[rgba(0,212,255,0.08)] via-transparent to-transparent sticky top-0 z-40 backdrop-blur-sm">
        <div className="max-w-[1600px] mx-auto px-3 sm:px-6 py-3">
          <div className="flex items-center justify-between flex-wrap gap-3">
            {/* Logo + title */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-md border border-[var(--k-cyan-bright)] flex items-center justify-center k-glow-cyan">
                <Terminal className="w-5 h-5 text-[var(--k-cyan-bright)]" />
              </div>
              <div>
                <h1 className="text-[var(--k-cyan-bright)] font-bold tracking-[0.18em] text-sm sm:text-base uppercase">
                  VVU IVE
                </h1>
                <p className="text-[var(--k-dim)] text-[10px] mt-0.5 uppercase tracking-widest">
                  Immersive Virtual Environment · {totalActivities} Activities · 4 Rooms
                </p>
              </div>
            </div>

            {/* Room tabs */}
            <nav className="flex items-center gap-1 p-1 rounded-md border border-[var(--k-line)] bg-[var(--k-bg-elevated)]">
              {ROOMS.map((r) => {
                const Icon = r.icon;
                const active = r.id === room;
                return (
                  <button
                    key={r.id}
                    type="button"
                    onClick={() => setRoom(r.id)}
                    className={`flex items-center gap-1.5 px-3 sm:px-4 py-2 rounded-[5px] text-[11px] font-bold tracking-wider transition-all uppercase ${
                      active
                        ? 'bg-[var(--k-cyan-bright)] text-black'
                        : 'text-[var(--k-dim)] hover:text-[var(--k-fg-bright)] hover:bg-[var(--k-panel-2)]'
                    }`}
                    title={r.subtitle}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">{r.label}</span>
                  </button>
                );
              })}
            </nav>
          </div>
        </div>
      </header>

      {/* ─── Room content ─── */}
      <main className="flex-1">
        {room === 'build' && <BuildRoom />}
        {room === 'study' && <StudyRoom />}
        {room === 'data' && <DataRoom />}
        {room === 'finance' && <FinanceRoom />}
      </main>

      {/* ─── Sticky footer ─── */}
      <footer className="mt-auto border-t border-[var(--k-line)] bg-[var(--k-bg-elevated)]">
        <div className="max-w-[1600px] mx-auto px-3 sm:px-6 py-2.5 flex flex-wrap items-center justify-between gap-2 text-[10px]">
          <div className="flex items-center gap-3 flex-wrap">
            <span className="k-warn font-bold uppercase tracking-wider">
              [SIMULATION — NOT MUNICIPAL OPERATIONAL DATA]
            </span>
            <span className="k-dim hidden sm:inline">|</span>
            <span className="k-dim hidden sm:inline">Zero Fabrication Rule active</span>
            <span className="k-dim hidden md:inline">|</span>
            <span className="k-dim hidden md:inline flex items-center gap-1">
              <Fingerprint className="w-3 h-3" />
              11-field provenance · SHA-256 audit
            </span>
          </div>
          <div className="k-dim uppercase tracking-widest">
            VVU IVE · {currentRoom.label} Room · NMBM-DMA-07 · v1.0
          </div>
        </div>
      </footer>
    </div>
  );
}

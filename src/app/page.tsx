'use client';

import { ArrowRight, Satellite, BookOpen } from 'lucide-react';

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-slate-100">
      <header className="flex-1 flex flex-col items-center justify-center px-6 py-16 sm:py-24 text-center">
        {/* Logo */}
        <div className="mb-8">
          <svg viewBox="0 0 100 100" fill="none" className="w-20 h-20 sm:w-24 sm:h-24">
            <circle cx="35" cy="40" r="16" stroke="#22d3ee" strokeWidth="4" className="animate-pulse" />
            <circle cx="65" cy="40" r="16" stroke="#38bdf8" strokeWidth="4" className="animate-pulse" style={{ animationDelay: '0.5s' }} />
            <circle cx="50" cy="64" r="16" stroke="#22d3ee" strokeWidth="4" className="animate-pulse" style={{ animationDelay: '1s' }} />
          </svg>
        </div>

        {/* Brand */}
        <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-cyan-500/30 bg-cyan-500/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-widest text-cyan-300">
          <Satellite className="w-3.5 h-3.5" />
          Venture Vision Ubuntu
        </div>

        <h1 className="mb-4 text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight bg-gradient-to-r from-cyan-300 via-sky-300 to-cyan-400 bg-clip-text text-transparent">
          Verification Layer
        </h1>

        <p className="max-w-xl text-base sm:text-lg text-slate-400 leading-relaxed mb-2">
          Real-time 3D spatial intelligence for water infrastructure.
          YOLO edge detection, Sentinel-2 remote sensing, and cryptographic
          provenance — unified in one operational view.
        </p>
        <p className="text-xs text-slate-500 uppercase tracking-widest mb-12">
          SANS 10112 / EIS v1.0 · Zero Fabrication Mandate
        </p>

        {/* ─── THE primary tool — one card, full width ─── */}
        <div className="w-full max-w-2xl">
          <a
            href="/vvu-gis-bench.html"
            className="group relative flex flex-col items-center text-center p-8 rounded-2xl border-2 border-cyan-500/40 hover:border-cyan-400 bg-slate-900/60 backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl hover:shadow-cyan-500/20"
          >
            <div className="mb-4 flex items-center justify-center w-16 h-16 rounded-xl border border-cyan-500/40 text-cyan-300 bg-slate-950/80">
              <Satellite className="w-8 h-8" />
            </div>
            <h2 className="text-2xl font-bold text-slate-100 mb-1">GIS Bench</h2>
            <p className="text-xs uppercase tracking-wider mb-3 text-cyan-300">Verification Layer · v2.2.0</p>
            <p className="text-sm text-slate-400 leading-relaxed mb-5 max-w-md">
              Live 3D terrain with YOLO volumetric tracking, dead-reckoning
              extrapolation, Terrarium DEM elevation, neon pipeline beams,
              and WebSocket gateway support. The one tool for the pilot.
            </p>
            <div className="inline-flex items-center gap-2 text-base font-semibold text-cyan-300 group-hover:gap-3 transition-all">
              Launch Bench
              <ArrowRight className="w-5 h-5" />
            </div>
          </a>
        </div>

        {/* Secondary link — small, unobtrusive */}
        <div className="mt-8">
          <a
            href="/ive"
            className="inline-flex items-center gap-2 text-xs font-semibold text-slate-500 hover:text-slate-300 transition-colors"
          >
            <BookOpen className="w-3.5 h-3.5" />
            IVE Shell (4 rooms, 14 activities)
          </a>
        </div>

        {/* Compliance badge */}
        <div className="mt-12">
          <span className="rounded-md border border-amber-500/30 bg-amber-500/5 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-amber-400/80">
            [SIMULATION — NOT MUNICIPAL OPERATIONAL DATA]
          </span>
        </div>
      </header>

      {/* ─── Sticky footer ─── */}
      <footer className="mt-auto border-t border-slate-800 bg-slate-950/80 backdrop-blur-sm">
        <div className="max-w-5xl mx-auto px-6 py-4 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-400">Vaguely Vanity LLC (Pty) Ltd</span>
            <span className="hidden sm:inline">·</span>
            <span className="hidden sm:inline">Reg. 2026/259053/07</span>
          </div>
          <div className="flex items-center gap-3">
            <span>14 Bird Street, Gqeberha, 6001</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

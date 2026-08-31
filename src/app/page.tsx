'use client';

import { ArrowRight, BarChart3, Boxes, Fingerprint, GitBranch, ShieldCheck, Sparkles } from 'lucide-react';

const DESTINATIONS = [
  { href: '/ive', title: 'IVE Shell', subtitle: 'Immersive Virtual Environment', description: '4-room interactive workspace: Build (3D hardware), Study (lessons), Data (EIS, HBK, sandbox, AIR, field), Finance (Ubuntu Pool, NMBM budget). 14 activities total.', icon: Boxes, accent: 'text-cyan-300', border: 'border-cyan-500/40 hover:border-cyan-400', glow: 'hover:shadow-cyan-500/20', cta: 'Enter IVE' },
  { href: '/vvu-e2e-suite.html', title: 'B2B Suite', subtitle: 'Gate 1 Integration, Evidence Workspace', description: 'SANS 10112 / EIS v1.0 evidence analysis workspace with live SCADA ingestion, DMA calibration sliders, EIS verdict engine, and signed audit JSON export.', icon: BarChart3, accent: 'text-amber-300', border: 'border-amber-500/40 hover:border-amber-400', glow: 'hover:shadow-amber-500/20', cta: 'Open Workspace' },
  { href: '/vvu-trust-dashboard.html', title: 'Trust Dashboard', subtitle: 'SEARM1, 3D Scene + B2B Pipeline', description: '4-panel 3D trust dashboard: Scene (Ward 42 3D visualization with leak/reset/focus/underground/demolish controls), One-Pager, Architecture, Pilot proposal form.', icon: ShieldCheck, accent: 'text-emerald-300', border: 'border-emerald-500/40 hover:border-emerald-400', glow: 'hover:shadow-emerald-500/20', cta: 'View Dashboard' },
  { href: '/vvu-secure-activation.html', title: 'Secure Activation', subtitle: 'BLE + TOTP Handshake, Field Onboarding', description: 'On-site HBK Mk-II node activation. Scan the VVU Field Onboarding Card QR with Google Authenticator, submit the 6-digit TOTP code over encrypted BLE, provision with HMAC-SHA-256 audit anchor.', icon: Fingerprint, accent: 'text-rose-300', border: 'border-rose-500/40 hover:border-rose-400', glow: 'hover:shadow-rose-500/20', cta: 'Activate Node' },
  { href: '/vvu-deployment-console.html', title: 'Deployment Console', subtitle: 'Gate 1 Master Release, CI/CD Pipeline', description: 'Complete compiled codebase and engineering manifest: 24 deliverables index, CI/CD pipeline visualization, 9-target R89.5M commercial pipeline, 8-vector security posture.', icon: GitBranch, accent: 'text-violet-300', border: 'border-violet-500/40 hover:border-violet-400', glow: 'hover:shadow-violet-500/20', cta: 'View Console' },
];

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-slate-100">
      <header className="flex-1 flex flex-col items-center justify-center px-6 py-16 sm:py-24 text-center">
        <div className="mb-8 flex items-center justify-center">
          <svg viewBox="0 0 100 100" fill="none" className="w-20 h-20 sm:w-24 sm:h-24">
            <circle cx="35" cy="40" r="16" stroke="#22d3ee" strokeWidth="4" className="animate-pulse" />
            <circle cx="65" cy="40" r="16" stroke="#fbbf24" strokeWidth="4" className="animate-pulse" style={{ animationDelay: '0.5s' }} />
            <circle cx="50" cy="64" r="16" stroke="#34d399" strokeWidth="4" className="animate-pulse" style={{ animationDelay: '1s' }} />
          </svg>
        </div>
        <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-cyan-500/30 bg-cyan-500/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-widest text-cyan-300">
          <Sparkles className="w-3.5 h-3.5" />
          Venture Vision Ubuntu
        </div>
        <h1 className="mb-4 text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight bg-gradient-to-r from-cyan-300 via-amber-200 to-emerald-300 bg-clip-text text-transparent">
          We Serve Trust
        </h1>
        <p className="max-w-2xl text-base sm:text-lg text-slate-400 leading-relaxed mb-2">
          Evidence-verification platform for water infrastructure validation.
          SANS 10112 / EIS v1.0 compliant. Zero Fabrication Mandate active.
        </p>
        <p className="text-xs text-slate-500 uppercase tracking-widest mb-12">
          5 destinations, pick one to begin
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 w-full max-w-6xl">
          {DESTINATIONS.map((d) => {
            const Icon = d.icon;
            return (
              <a key={d.href} href={d.href} className={`group relative flex flex-col items-start text-left p-6 rounded-xl border bg-slate-900/60 backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl ${d.border} ${d.glow}`}>
                <div className={`mb-4 flex items-center justify-center w-12 h-12 rounded-lg border ${d.border} ${d.accent} bg-slate-950/80`}>
                  <Icon className="w-6 h-6" />
                </div>
                <h2 className="text-lg font-bold text-slate-100 mb-0.5">{d.title}</h2>
                <p className={`text-xs uppercase tracking-wider mb-3 ${d.accent}`}>{d.subtitle}</p>
                <p className="text-sm text-slate-400 leading-relaxed mb-5 flex-1">{d.description}</p>
                <div className={`inline-flex items-center gap-1.5 text-sm font-semibold ${d.accent} group-hover:gap-2.5 transition-all`}>
                  {d.cta}
                  <ArrowRight className="w-4 h-4" />
                </div>
              </a>
            );
          })}
        </div>
        <div className="mt-12 flex flex-wrap items-center justify-center gap-3 text-xs text-slate-500">
          <span className="rounded-md border border-amber-500/30 bg-amber-500/5 px-3 py-1.5 font-semibold uppercase tracking-wider text-amber-400/80">
            [SIMULATION - NOT MUNICIPAL OPERATIONAL DATA]
          </span>
          <span className="hidden sm:inline">.</span>
          <span className="text-slate-500">Zero Fabrication Rule active</span>
        </div>
      </header>
      <footer className="mt-auto border-t border-slate-800 bg-slate-950/80 backdrop-blur-sm">
        <div className="max-w-5xl mx-auto px-6 py-4 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-400">Vaguely Vanity LLC (Pty) Ltd</span>
            <span className="hidden sm:inline">.</span>
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

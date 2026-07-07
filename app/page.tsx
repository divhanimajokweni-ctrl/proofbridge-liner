'use client';
import React, { useState, useEffect, useRef } from 'react';

type Role = 'guest' | 'operator' | 'admin' | 'compliance';

export default function EnterpriseControlPlane() {
  const [currentRole, setCurrentRole] = useState<Role>('guest');
  const [searchQuery, setSearchQuery] = useState('');
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // ⚠ SIMULATED METRICS — replace with /api/metrics/gate-* endpoints when deployed
  // These values are client-side synthetic data for UI demonstration only.
  // Production telemetry is available via /api/metrics/gate-a (Gate A queue metrics),
  // /api/metrics/gate-b (Gate B propagation), and /api/metrics/gate-c (Gate C attestation).
  const [metrics, setMetrics] = useState({ tps: 42.1, latency: 112, successRate: 99.98 });
  useEffect(() => {
    const interval = setInterval(() => {
      setMetrics({
        tps: parseFloat((40 + Math.random() * 5).toFixed(1)),
        latency: Math.floor(105 + Math.random() * 15),
        successRate: parseFloat((99.95 + Math.random() * 0.04).toFixed(2)),
      });
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  // Animated Pipeline (Canvas-based)
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let offset = 0;

    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Draw background track line
      ctx.strokeStyle = '#1f2937';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(20, canvas.height / 2);
      ctx.lineTo(canvas.width - 20, canvas.height / 2);
      ctx.stroke();

      // Draw moving data pulses
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 4;
      ctx.setLineDash([15, 30]);
      ctx.lineDashOffset = -offset;
      ctx.beginPath();
      ctx.moveTo(20, canvas.height / 2);
      ctx.lineTo(canvas.width - 20, canvas.height / 2);
      ctx.stroke();

      offset += 1;
      animationFrameId = requestAnimationFrame(render);
    };
    render();
    return () => cancelAnimationFrame(animationFrameId);
  }, []);

  // Role toggles
  const roleCycle: Role[] = ['guest', 'operator', 'admin', 'compliance'];

  return (
    <div className="min-h-screen bg-[#090d16] text-slate-100 font-sans selection:bg-sky-500/30">
      {/* Top Header & Role Switcher */}
      <header className="border-b border-slate-800 bg-[#0d1527]/80 backdrop-blur sticky top-0 z-50 px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="h-3 w-3 rounded-full bg-emerald-500 animate-pulse" />
          <h1 className="text-xl font-bold tracking-tight text-white">Foundry // ControlPlane</h1>
        </div>

        {/* Role Switcher Controls */}
        <div className="flex items-center bg-slate-900/90 p-1 rounded-lg border border-slate-800">
          {roleCycle.map((role) => (
            <button
              key={role}
              onClick={() => setCurrentRole(role)}
              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') setCurrentRole(role); }}
              aria-pressed={currentRole === role}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md capitalize transition-all ${
                currentRole === role
                  ? 'bg-sky-600 text-white shadow'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {role}
            </button>
          ))}
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-12 space-y-12">
        {/* Simulated Data Banner */}
        <div role="alert" className="bg-amber-950/40 border border-amber-600/30 text-amber-400 text-xs text-center px-4 py-2 rounded-lg">
          ⚠ Dashboard metrics are simulated for UI demonstration. Connect to live /api/metrics/gate-* endpoints in production.
        </div>

        {/* Hero Section */}
        <section aria-label="System status overview" className="text-center py-8 space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-sky-500/10 border border-sky-500/20 text-sky-400 text-xs font-medium">
            Active Authorization Context: <span className="uppercase font-bold">{currentRole}</span>
          </div>
          <h2 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-white max-w-3xl mx-auto">
            Decentralized Intelligence & Hardware Attestation
          </h2>
          <p className="text-slate-400 max-w-2xl mx-auto text-base sm:text-lg">
            Monitored environments processing secure zero-knowledge execution loops through verifiable hardware boundaries.
          </p>
        </section>

        {/* Live Metrics Dashboard Section — SIMULATED DATA */}
        <section aria-label="System performance metrics" className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div role="status" aria-label={`System throughput: ${metrics.tps} transactions per second`} className="bg-[#0e1726] border border-slate-800 p-6 rounded-xl shadow-xl">
            <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">System Throughput (simulated)</p>
            <p className="text-3xl font-mono font-bold text-white mt-2" aria-live="polite">{metrics.tps} <span className="text-sm font-normal text-slate-500">TPS</span></p>
          </div>
          <div role="status" aria-label={`TEE attestation latency: ${metrics.latency} milliseconds`} className="bg-[#0e1726] border border-slate-800 p-6 rounded-xl shadow-xl">
            <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">TEE Attestation Latency (simulated)</p>
            <p className="text-3xl font-mono font-bold text-sky-400 mt-2" aria-live="polite">{metrics.latency} <span className="text-sm font-normal text-slate-500">ms</span></p>
          </div>
          <div role="status" aria-label={`Execution success rate: ${metrics.successRate} percent`} className="bg-[#0e1726] border border-slate-800 p-6 rounded-xl shadow-xl">
            <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">Execution Success Rate (simulated)</p>
            <p className="text-3xl font-mono font-bold text-emerald-400 mt-2" aria-live="polite">{metrics.successRate}%</p>
          </div>
        </section>

        {/* Animated Pipeline Display — Visual Decoration Only */}
        <section aria-label="Pipeline visualization" className="bg-[#0e1726] border border-slate-800 p-6 rounded-xl space-y-4">
          <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wider">Live Pipeline Synchronization</h3>
          <canvas ref={canvasRef} width={800} height={40} className="w-full bg-slate-950 rounded-lg border border-slate-900" aria-hidden="true" />
        </section>

        {/* Global Search Functionality Component */}
        <section aria-label="Search deployments and transactions" className="max-w-xl mx-auto">
          <div className="relative">
            <label htmlFor="global-search" className="sr-only">Search deployments, transactions, or TEE keys</label>
            <input
              id="global-search"
              type="text"
              placeholder="Search active deployment indices, transaction hashes, or TEE keys..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-4 pr-12 py-3 text-sm focus:outline-none focus:border-sky-500 font-mono transition-colors text-slate-200"
              aria-describedby="search-shortcut-hint"
            />
            <div id="search-shortcut-hint" className="absolute right-4 top-3 text-xs font-mono text-slate-600" aria-hidden="true">/</div>
          </div>
        </section>

        {/* FAQ Section */}
        <section aria-label="Frequently asked questions" className="border-t border-slate-800/60 pt-12 space-y-6">
          <h3 className="text-2xl font-bold text-white text-center">Frequently Asked Questions</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
            <article className="space-y-2">
              <h4 className="font-semibold text-slate-200">How is hardware attestation validated?</h4>
              <p className="text-sm text-slate-400">AMD SEV-SNP cryptographic measurements are cross-checked via native contract calls on-chain before execution keys deploy.</p>
            </article>
            <article className="space-y-2">
              <h4 className="font-semibold text-slate-200">What does the role switcher dictate?</h4>
              <p className="text-sm text-slate-400">It filters view-level administrative parameters, protecting critical consensus updates from unauthorized profiles.</p>
            </article>
            <article className="space-y-2">
              <h4 className="font-semibold text-slate-200">Which networks are currently supported?</h4>
              <p className="text-sm text-slate-400">Polygon Amoy (testnet) with EVM RWA token sandbox. Mainnet deployment gated behind full behavioral coverage pass.</p>
            </article>
            <article className="space-y-2">
              <h4 className="font-semibold text-slate-200">How does the circuit breaker work?</h4>
              <p className="text-sm text-slate-400">A global on-chain trip switch halts all gated transfers when oracle detects anomalous activity. Owner-gated reset with cooldown.</p>
            </article>
          </div>
        </section>

        {/* Call to Action (CTA) Section */}
        <section aria-label="Production deployment call to action" className="bg-gradient-to-r from-sky-950/40 to-slate-900/40 border border-sky-500/20 rounded-2xl p-8 text-center space-y-4">
          <h3 className="text-xl font-bold text-white">Initialize Production Integration</h3>
          <p className="text-sm text-slate-400 max-w-md mx-auto">Lock runtime environments, spin up localized node architectures, and test full pipelines.</p>
          <button aria-label="Launch deployment loop" className="bg-sky-600 hover:bg-sky-500 text-white font-medium text-sm px-6 py-2.5 rounded-lg shadow transition-all focus:outline-none focus:ring-2 focus:ring-sky-400 focus:ring-offset-2 focus:ring-offset-slate-900">
            Launch Deployment Loop
          </button>
        </section>
      </main>
    </div>
  );
}

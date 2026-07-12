'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';

function AntLoader({ onComplete }: { onComplete: () => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d')!;
    let raf: number;

    const resize = () => {
      const dpr = window.devicePixelRatio || 1;
      canvas.width = window.innerWidth * dpr;
      canvas.height = window.innerHeight * dpr;
      canvas.style.width = window.innerWidth + 'px';
      canvas.style.height = window.innerHeight + 'px';
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    window.addEventListener('resize', resize);

    const W = () => window.innerWidth;
    const H = () => window.innerHeight;

    interface Ant {
      x: number; y: number;
      tx: number; ty: number;
      speed: number;
      carrying: boolean;
      phase: number;
      size: number;
    }

    const COLONY_X = () => W() * 0.5;
    const COLONY_Y = () => H() * 0.52;
    const COLONY_R = 6;

    const ants: Ant[] = [];
    const NUM_ANTS = 28;

    for (let i = 0; i < NUM_ANTS; i++) {
      const angle = (Math.PI * 2 * i) / NUM_ANTS + (Math.random() - 0.5) * 0.4;
      const dist = 140 + Math.random() * 200;
      ants.push({
        x: COLONY_X() + Math.cos(angle) * dist,
        y: COLONY_Y() + Math.sin(angle) * dist,
        tx: COLONY_X() + (Math.random() - 0.5) * COLONY_R * 2,
        ty: COLONY_Y() + (Math.random() - 0.5) * COLONY_R * 2,
        speed: 0.3 + Math.random() * 0.5,
        carrying: Math.random() > 0.3,
        phase: Math.random() * Math.PI * 2,
        size: 2 + Math.random() * 1.5,
      });
    }

    let elapsed = 0;
    const FADE_DURATION = 3200;

    const tick = (now: number) => {
      const dt = 16;
      elapsed += dt;

      ctx.clearRect(0, 0, W(), H());

      const cx = COLONY_X();
      const cy = COLONY_Y();

      // Colony glow
      const glowR = 50 + Math.sin(now * 0.002) * 8;
      const grd = ctx.createRadialGradient(cx, cy, 0, cx, cy, glowR);
      grd.addColorStop(0, 'rgba(200,168,74,0.15)');
      grd.addColorStop(1, 'rgba(200,168,74,0)');
      ctx.fillStyle = grd;
      ctx.beginPath();
      ctx.arc(cx, cy, glowR, 0, Math.PI * 2);
      ctx.fill();

      // Colony core
      ctx.fillStyle = '#C9A84C';
      ctx.shadowColor = '#C9A84C';
      ctx.shadowBlur = 12;
      ctx.beginPath();
      ctx.arc(cx, cy, COLONY_R, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;

      // Ants
      for (const ant of ants) {
        const dx = ant.tx - ant.x;
        const dy = ant.ty - ant.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < 8) {
          // Reached colony — send back out
          const angle = Math.random() * Math.PI * 2;
          const d = 100 + Math.random() * 250;
          ant.tx = cx + Math.cos(angle) * d;
          ant.ty = cy + Math.sin(angle) * d;
          ant.carrying = Math.random() > 0.25;
        }

        ant.x += (dx / dist) * ant.speed;
        ant.y += (dy / dist) * ant.speed;
        ant.phase += 0.08;

        // Draw ant body
        const angle = Math.atan2(dy, dx);
        ctx.save();
        ctx.translate(ant.x, ant.y);
        ctx.rotate(angle);

        // Body segments
        ctx.fillStyle = '#8B7355';
        ctx.beginPath();
        ctx.ellipse(-2, 0, ant.size * 0.7, ant.size * 0.4, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.ellipse(2, 0, ant.size * 0.5, ant.size * 0.35, 0, 0, Math.PI * 2);
        ctx.fill();

        // Head
        ctx.fillStyle = '#6B5B3F';
        ctx.beginPath();
        ctx.arc(ant.size, 0, ant.size * 0.3, 0, Math.PI * 2);
        ctx.fill();

        // Leaf if carrying
        if (ant.carrying) {
          ctx.fillStyle = 'rgba(62,207,142,0.7)';
          ctx.beginPath();
          ctx.ellipse(-ant.size * 1.2, -ant.size * 0.3 + Math.sin(ant.phase) * 1.5, 3, 2, 0.3, 0, Math.PI * 2);
          ctx.fill();
        }

        // Legs
        ctx.strokeStyle = '#6B5B3F';
        ctx.lineWidth = 0.5;
        for (let l = 0; l < 3; l++) {
          const lx = -1 + l * 1.5;
          const legOff = Math.sin(ant.phase + l) * 2;
          ctx.beginPath();
          ctx.moveTo(lx, 0);
          ctx.lineTo(lx - 1, ant.size * 0.5 + legOff);
          ctx.stroke();
          ctx.beginPath();
          ctx.moveTo(lx, 0);
          ctx.lineTo(lx - 1, -ant.size * 0.5 - legOff);
          ctx.stroke();
        }

        ctx.restore();
      }

      // Fade overlay
      const fadeProgress = Math.min(elapsed / FADE_DURATION, 1);
      if (fadeProgress >= 1) {
        onComplete();
        return;
      }

      ctx.fillStyle = `rgba(7,9,12,${1 - fadeProgress})`;
      ctx.fillRect(0, 0, W(), H());

      // Text
      const textAlpha = elapsed < FADE_DURATION * 0.7 ? 1 : 1 - (elapsed - FADE_DURATION * 0.7) / (FADE_DURATION * 0.3);
      if (textAlpha > 0) {
        ctx.globalAlpha = Math.max(0, textAlpha);
        ctx.fillStyle = '#C9A84C';
        ctx.font = '600 13px "IBM Plex Mono", monospace';
        ctx.textAlign = 'center';
        ctx.fillText('The individual contributes to the colony.', cx, cy + 90);
        ctx.globalAlpha = 1;
      }

      raf = requestAnimationFrame(tick);
    };

    raf = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', resize);
    };
  }, [onComplete]);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        background: '#07090C',
      }}
    />
  );
}

function TrustSphereHero() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    if (el.hasAttribute('data-vvu-sphere-init')) return;
    el.setAttribute('data-vvu-sphere-init', '1');

    const canvas = el.querySelector('canvas') as HTMLCanvasElement;
    if (!canvas) return;
    const ctx = canvas.getContext('2d')!;

    const STATES = ['unknown', 'identity', 'contribution', 'receipt', 'hash', 'zk', 'trust'] as const;
    type State = typeof STATES[number];
    const STATE_COLORS: Record<State, string> = {
      unknown: '#2a2d3a', identity: '#3d6bff', contribution: '#3dd6ff',
      receipt: '#3dffb0', hash: '#c9a84c', zk: '#b23dff', trust: '#ff2e5f'
    };

    interface Point {
      x: number; y: number; z: number;
      state: State; stateT: number;
      isSelf: boolean; ripple: number;
      _jit?: number;
    }

    const N = 420;
    function fibonacciSphere(n: number): Point[] {
      const pts: Point[] = [];
      const golden = Math.PI * (3 - Math.sqrt(5));
      for (let i = 0; i < n; i++) {
        const y = 1 - (i / (n - 1)) * 2;
        const r = Math.sqrt(1 - y * y);
        const theta = golden * i;
        pts.push({
          x: Math.cos(theta) * r, y, z: Math.sin(theta) * r,
          state: 'unknown', stateT: Math.random() * 8000,
          isSelf: false, ripple: 0
        });
      }
      return pts;
    }

    const points = fibonacciSphere(N);
    points[7].isSelf = true;
    points[7].state = 'trust';

    const STATE_DURATION = 3200;
    let rotY = 0, rotX = 0;
    const angVelY = 0.00028, angVelX = 0.00011;
    let W: number, H: number, DPR: number;

    function resize() {
      DPR = window.devicePixelRatio || 1;
      W = el!.clientWidth;
      H = el!.clientHeight;
      canvas.width = W * DPR;
      canvas.height = H * DPR;
      canvas.style.width = W + 'px';
      canvas.style.height = H + 'px';
      ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    }
    window.addEventListener('resize', resize);
    resize();

    function project(p: Point) {
      let x = p.x * Math.cos(rotY) - p.z * Math.sin(rotY);
      let z = p.x * Math.sin(rotY) + p.z * Math.cos(rotY);
      let y = p.y;
      let y2 = y * Math.cos(rotX) - z * Math.sin(rotX);
      let z2 = y * Math.sin(rotX) + z * Math.cos(rotX);
      const scale = Math.min(W, H) * 0.34;
      const persp = 2.6 / (2.6 + z2);
      return { sx: W / 2 + x * scale * persp, sy: H / 2 + y2 * scale * persp, depth: z2, persp };
    }

    let lastTime = performance.now();
    let raf: number;

    function tick(now: number) {
      const dt = now - lastTime;
      lastTime = now;
      rotY += angVelY * dt;
      rotX += angVelX * dt;

      for (const p of points) {
        p.stateT += dt;
        if (p.stateT > STATE_DURATION + (p._jit || (p._jit = Math.random() * 4000))) {
          const idx = STATES.indexOf(p.state);
          if (idx < STATES.length - 1) { p.state = STATES[idx + 1]; p.ripple = 1 }
          p.stateT = 0;
        }
        if (p.ripple > 0) p.ripple = Math.max(0, p.ripple - dt / 900);
      }

      ctx.clearRect(0, 0, W, H);
      const proj = points.map(p => ({ p, ...project(p) }));
      proj.sort((a, b) => a.depth - b.depth);

      ctx.lineWidth = 0.5;
      for (let i = 0; i < proj.length; i++) {
        const a = proj[i];
        if (STATES.indexOf(a.p.state) < 2) continue;
        for (let j = i + 1; j < Math.min(i + 6, proj.length); j++) {
          const b = proj[j];
          if (STATES.indexOf(b.p.state) < 2) continue;
          const dx = a.sx - b.sx, dy = a.sy - b.sy;
          const d = Math.sqrt(dx * dx + dy * dy);
          if (d < 46) {
            const alpha = (1 - d / 46) * 0.12 * Math.min(a.persp, b.persp);
            ctx.strokeStyle = `rgba(201,168,76,${alpha})`;
            ctx.beginPath(); ctx.moveTo(a.sx, a.sy); ctx.lineTo(b.sx, b.sy); ctx.stroke();
          }
        }
      }

      for (const item of proj) {
        const { p, sx, sy, persp } = item;
        let r = 2.0 * persp + 0.6;
        let color = STATE_COLORS[p.state];
        let alpha = 0.55 + 0.45 * persp;

        if (p.isSelf) { color = '#ff2e5f'; r *= 2.4; alpha = 1 }

        if (p.ripple > 0) {
          ctx.beginPath();
          ctx.arc(sx, sy, r + p.ripple * 10, 0, Math.PI * 2);
          ctx.strokeStyle = `rgba(201,168,76,${p.ripple * 0.5})`;
          ctx.lineWidth = 1;
          ctx.stroke();
        }

        ctx.beginPath();
        ctx.arc(sx, sy, r, 0, Math.PI * 2);
        ctx.fillStyle = color;
        ctx.globalAlpha = alpha;
        ctx.shadowColor = color;
        ctx.shadowBlur = p.isSelf ? 14 : 4 * persp;
        ctx.fill();
        ctx.shadowBlur = 0;
        ctx.globalAlpha = 1;
      }

      raf = requestAnimationFrame(tick);
    }

    raf = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', resize);
    };
  }, []);

  return (
    <div ref={containerRef} style={{ position: 'absolute', inset: 0 }}>
      <canvas style={{ width: '100%', height: '100%' }} />
    </div>
  );
}

const sections = [
  {
    id: 'why-trust',
    tag: 'PHILOSOPHY',
    title: 'Why Trust Exists',
    body: `Before software. Before blockchain. Before AI. There was Ubuntu.\n\nI am because we are. Trust is not a feature — it is the foundation. Every community savings circle, every stokvel, every mutual aid network runs on the same principle: the individual contributes to the colony.\n\nVVU builds the infrastructure that makes this trust verifiable.`,
    accent: 'var(--color-gold)',
  },
  {
    id: 'proofbridge',
    tag: 'PROOFBRIDGE',
    title: 'ProofBridge',
    body: `ProofBridge is the attestation layer. It anchors deeds, contributions, and commitments on-chain — creating a tamper-proof record of who did what, when, and why.\n\nEvery proof is cryptographically signed. Every receipt is verifiable. Every hash links back to the colony.`,
    accent: 'var(--color-cyan)',
    metrics: [
      { label: 'Attestation types', value: '7' },
      { label: 'Chain', value: 'Polygon Amoy' },
      { label: 'Verification', value: 'Ed25519' },
    ],
  },
  {
    id: 'safekrypte',
    tag: 'SAFEKYPTE',
    title: 'SafeKrypte',
    body: `SafeKrypte is the key management layer. Threshold encryption, HSM-backed key custody, and tiered access control ensure that sensitive data remains sovereign.\n\nYour keys. Your data. Your rules. Encrypted at rest, verified in transit.`,
    accent: 'var(--color-purple)',
    metrics: [
      { label: 'HSM tiers', value: '3' },
      { label: 'Threshold', value: 'Shamir' },
      { label: 'Encryption', value: 'AES-256-GCM' },
    ],
  },
  {
    id: 'ubuntu-pools',
    tag: 'UBUNTU POOLS',
    title: 'Ubuntu Pools',
    body: `Community savings circles — reimagined for the verifiable age.\n\nUbuntu Pools connects stokvels, burial societies, and savings groups with Stitch InstantEFT payments, on-chain receipt generation, and transparent ledger views. Every contribution is witnessed. Every distribution is attested.`,
    accent: 'var(--color-green)',
    metrics: [
      { label: 'Payment rail', value: 'Stitch InstantEFT' },
      { label: 'Receipt', value: 'On-chain' },
      { label: 'Ledger', value: 'Transparent' },
    ],
  },
  {
    id: 'trust-runtime',
    tag: 'TRUST RUNTIME',
    title: 'The Trust Runtime',
    body: `The kernel that ties it all together.\n\nThe Trust Runtime processes evidence through a five-phase pipeline: ingest, verify, attest, sign, commit. Every cycle produces a verifiable receipt. The Bayesian posterior rises as trust accumulates.\n\nWatch the simulation. See trust form in real time.`,
    accent: 'var(--color-crimson-bright)',
  },
];

export default function Home() {
  const [loaded, setLoaded] = useState(false);
  const [showContent, setShowContent] = useState(false);

  useEffect(() => {
    if (loaded) {
      const t = setTimeout(() => setShowContent(true), 100);
      return () => clearTimeout(t);
    }
  }, [loaded]);

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=IBM+Plex+Mono:wght@400;500&family=DM+Sans:wght@400;500;600&display=swap');

        .landing-root {
          min-height: 100vh;
          background: #07090C;
          color: #DCE2EA;
          font-family: 'DM Sans', sans-serif;
          overflow-x: hidden;
        }

        .hero-section {
          position: relative;
          width: 100%;
          height: 100vh;
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          overflow: hidden;
        }

        .hero-content {
          position: relative;
          z-index: 2;
          text-align: center;
          pointer-events: none;
        }

        .hero-brand {
          font-family: 'Syne', sans-serif;
          font-weight: 800;
          font-size: clamp(2rem, 5vw, 3.5rem);
          letter-spacing: -0.02em;
          color: #DCE2EA;
          margin-bottom: 8px;
        }

        .hero-brand span {
          color: #C9A84C;
        }

        .hero-sub {
          font-family: 'IBM Plex Mono', monospace;
          font-size: clamp(0.65rem, 1.2vw, 0.85rem);
          color: #6A8099;
          letter-spacing: 0.06em;
          text-transform: uppercase;
          margin-bottom: 32px;
        }

        .hero-cta {
          pointer-events: auto;
          display: inline-flex;
          align-items: center;
          gap: 8px;
          font-family: 'IBM Plex Mono', monospace;
          font-size: 0.8rem;
          color: #C9A84C;
          border: 1px solid rgba(200,168,74,0.3);
          padding: 10px 24px;
          border-radius: 6px;
          text-decoration: none;
          transition: all 0.2s;
          background: rgba(200,168,74,0.06);
          cursor: pointer;
        }

        .hero-cta:hover {
          border-color: #C9A84C;
          background: rgba(200,168,74,0.12);
          box-shadow: 0 0 20px rgba(200,168,74,0.15);
        }

        .scroll-hint {
          position: absolute;
          bottom: 32px;
          left: 50%;
          transform: translateX(-50%);
          z-index: 2;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 8px;
          animation: float 2.5s ease-in-out infinite;
        }

        .scroll-hint span {
          font-family: 'IBM Plex Mono', monospace;
          font-size: 0.65rem;
          color: #334658;
          letter-spacing: 0.1em;
          text-transform: uppercase;
        }

        .scroll-arrow {
          width: 16px;
          height: 16px;
          border-right: 1.5px solid #334658;
          border-bottom: 1.5px solid #334658;
          transform: rotate(45deg);
        }

        @keyframes float {
          0%, 100% { transform: translateX(-50%) translateY(0); }
          50% { transform: translateX(-50%) translateY(8px); }
        }

        .narrative-section {
          position: relative;
          min-height: 80vh;
          display: flex;
          align-items: center;
          padding: 80px 24px;
        }

        .narrative-inner {
          max-width: 640px;
          margin: 0 auto;
          width: 100%;
        }

        .narrative-tag {
          font-family: 'IBM Plex Mono', monospace;
          font-size: 0.65rem;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          margin-bottom: 16px;
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .narrative-tag::before {
          content: '';
          display: inline-block;
          width: 24px;
          height: 1px;
        }

        .narrative-title {
          font-family: 'Syne', sans-serif;
          font-weight: 700;
          font-size: clamp(1.6rem, 3.5vw, 2.4rem);
          letter-spacing: -0.02em;
          color: #DCE2EA;
          margin-bottom: 24px;
          line-height: 1.2;
        }

        .narrative-body {
          font-size: clamp(0.9rem, 1.3vw, 1.05rem);
          line-height: 1.75;
          color: #6A8099;
          white-space: pre-line;
        }

        .narrative-metrics {
          display: flex;
          gap: 24px;
          margin-top: 32px;
          padding-top: 24px;
          border-top: 1px solid #1C2A38;
          flex-wrap: wrap;
        }

        .metric-item {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .metric-label {
          font-family: 'IBM Plex Mono', monospace;
          font-size: 0.6rem;
          color: #334658;
          letter-spacing: 0.08em;
          text-transform: uppercase;
        }

        .metric-value {
          font-family: 'Syne', sans-serif;
          font-weight: 700;
          font-size: 1rem;
          color: #DCE2EA;
        }

        .cta-section {
          min-height: 60vh;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 80px 24px;
          text-align: center;
        }

        .cta-title {
          font-family: 'Syne', sans-serif;
          font-weight: 800;
          font-size: clamp(1.8rem, 4vw, 2.8rem);
          color: #DCE2EA;
          margin-bottom: 16px;
        }

        .cta-sub {
          font-size: 1rem;
          color: #6A8099;
          margin-bottom: 40px;
          max-width: 420px;
        }

        .cta-button {
          display: inline-flex;
          align-items: center;
          gap: 10px;
          font-family: 'IBM Plex Mono', monospace;
          font-size: 0.85rem;
          color: #07090C;
          background: #C9A84C;
          padding: 14px 32px;
          border-radius: 6px;
          text-decoration: none;
          font-weight: 500;
          transition: all 0.2s;
          border: none;
          cursor: pointer;
        }

        .cta-button:hover {
          background: #E4C86A;
          box-shadow: 0 0 30px rgba(200,168,74,0.3);
        }

        .landing-footer {
          padding: 32px 24px;
          text-align: center;
          font-family: 'IBM Plex Mono', monospace;
          font-size: 0.6rem;
          color: #334658;
          letter-spacing: 0.06em;
          border-top: 1px solid #1C2A38;
        }

        .landing-nav {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          z-index: 50;
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 16px 28px;
          background: rgba(7,9,12,0.7);
          backdrop-filter: blur(12px);
          border-bottom: 1px solid rgba(28,42,56,0.4);
          transition: opacity 0.3s;
        }

        .nav-brand {
          font-family: 'Syne', sans-serif;
          font-weight: 700;
          font-size: 0.85rem;
          color: #DCE2EA;
          letter-spacing: 0.02em;
        }

        .nav-brand span {
          color: #C9A84C;
        }

        .nav-links {
          display: flex;
          gap: 24px;
          align-items: center;
        }

        .nav-link {
          font-family: 'IBM Plex Mono', monospace;
          font-size: 0.7rem;
          color: #6A8099;
          text-decoration: none;
          letter-spacing: 0.04em;
          transition: color 0.15s;
        }

        .nav-link:hover {
          color: #C9A84C;
        }

        .section-divider {
          width: 100%;
          max-width: 640px;
          margin: 0 auto;
          height: 1px;
          background: linear-gradient(90deg, transparent, #1C2A38, transparent);
        }

        .content-fade {
          opacity: 0;
          transform: translateY(20px);
          transition: opacity 0.6s ease, transform 0.6s ease;
        }

        .content-fade.visible {
          opacity: 1;
          transform: translateY(0);
        }
      `}</style>

      {!loaded && <AntLoader onComplete={() => setLoaded(true)} />}

      {showContent && (
        <div className="landing-root">
          <nav className="landing-nav">
            <div className="nav-brand">VVU<span>.</span></div>
            <div className="nav-links">
              <a href="#why-trust" className="nav-link">Trust</a>
              <a href="#proofbridge" className="nav-link">ProofBridge</a>
              <a href="#safekrypte" className="nav-link">SafeKrypte</a>
              <a href="#ubuntu-pools" className="nav-link">Pools</a>
              <Link href="/login" className="nav-link" style={{ color: '#C9A84C' }}>Sign In</Link>
            </div>
          </nav>

          <section className="hero-section">
            <TrustSphereHero />
            <div className="hero-content">
              <div className="hero-brand">Venture Vision <span>Ubuntu</span></div>
              <div className="hero-sub">Trust infrastructure for the verifiable age</div>
              <a href="#why-trust" className="hero-cta">
                Explore the colony ↓
              </a>
            </div>
            <div className="scroll-hint">
              <span>Scroll</span>
              <div className="scroll-arrow" />
            </div>
          </section>

          {sections.map((s, i) => (
            <div key={s.id}>
              <div className="section-divider" />
              <section id={s.id} className="narrative-section">
                <div className="narrative-inner">
                  <div className="narrative-tag" style={{ color: s.accent }}>
                    <span style={{ background: s.accent }} />
                    {s.tag}
                  </div>
                  <h2 className="narrative-title">{s.title}</h2>
                  <div className="narrative-body">{s.body}</div>
                  {s.metrics && (
                    <div className="narrative-metrics">
                      {s.metrics.map((m) => (
                        <div key={m.label} className="metric-item">
                          <span className="metric-label">{m.label}</span>
                          <span className="metric-value">{m.value}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </section>
            </div>
          ))}

          <div className="section-divider" />

          <section className="cta-section">
            <h2 className="cta-title">Join the colony</h2>
            <p className="cta-sub">
              Trust is not a feature. It is the foundation. Begin contributing.
            </p>
            <Link href="/login" className="cta-button">
              Sign In →
            </Link>
          </section>

          <footer className="landing-footer">
            VENTURE VISION UBUNTU · TRUST RUNTIME · {new Date().getFullYear()}
          </footer>
        </div>
      )}
    </>
  );
}

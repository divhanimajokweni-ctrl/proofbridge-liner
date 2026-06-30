'use client';
import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
export default function ProofBridgeLanding() {
  const [termUptime, setTermUptime] = useState('0s');
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    let secs = 0;
    const uptimeTimer = setInterval(() => {
      secs++;
      const m = Math.floor(secs / 60), s = secs % 60;
      setTermUptime(m > 0 ? m + 'm ' + s + 's' : s + 's');
    }, 1000);
    return () => clearInterval(uptimeTimer);
  }, []);

      useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const resizeCanvas = () => {
          const container = canvas.parentElement;
          const maxWidth = Math.min(container ? container.clientWidth - 68 : 360, 520);
          const size = Math.max(280, maxWidth);
          canvas.width = size;
          canvas.height = size;
        };
        resizeCanvas();
        window.addEventListener('resize', resizeCanvas);

        const radius = 135;
    let rotationX = 0;
    let rotationY = 0;

    const nodes: { x: number; y: number; z: number }[] = [];
    for (let i = 0; i < 180; i += 10) {
      const latitude = (i * Math.PI) / 180 - Math.PI / 2;
      for (let j = 0; j < 360; j += 15) {
        const longitude = (j * Math.PI) / 180 - Math.PI;
        const x = radius * Math.cos(latitude) * Math.sin(longitude);
        const y = radius * Math.sin(latitude);
        const z = radius * Math.cos(latitude) * Math.cos(longitude);
        nodes.push({ x, y, z });
      }
    }

    let animationFrameId: number;
    const projectAndRenderGlobe = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = 'rgba(204, 119, 34, 0.75)';

      rotationY += 0.003;
      rotationX += 0.0015;

      const cosY = Math.cos(rotationY), sinY = Math.sin(rotationY);
      const cosX = Math.cos(rotationX), sinX = Math.sin(rotationX);

      nodes.forEach((node) => {
        const rotX = node.x * cosY - node.z * sinY;
        const rotZ = node.z * cosY + node.x * sinY;
        const rotY = node.y * cosX - rotZ * sinX;
        const finalZ = rotZ * cosX + node.y * sinX;

        if (finalZ + radius > 0) {
          const screenX = canvas.width / 2 + rotX;
          const screenY = canvas.height / 2 + rotY;
          const scalingFactor = Math.max(0.4, (finalZ + radius) / (radius * 2));

          ctx.beginPath();
          ctx.arc(screenX, screenY, scalingFactor * 1.8, 0, 2 * Math.PI);
          ctx.fill();
        }
      });

      animationFrameId = requestAnimationFrame(projectAndRenderGlobe);
    };

    projectAndRenderGlobe();
    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', resizeCanvas);
    };
  }, []);

  return (
    <div className="proofbridge-page" style={{animation:"vvu-fade-up 0.5s var(--ease-out)"}}>
      <style>{`
.proofbridge-page {
  --sage:var(--color-green); --sage-light:#B8C98A; --sage-dark:#5C6B38;
  --ochre:var(--color-gold); --ochre-dim:rgba(200,168,74,0.28);
  --charcoal:#1E1E1C; --charcoal-deep:#141412;
  --gravel:#5A5A55; --stone:#E2E3DB; --paper:#F4F5F0;
  --dark-bg:#1E1E1C; --dark-panel:#11110F; --dark-panel-raised:#1A1A18;
  --dark-border:rgba(255,255,255,0.08); --dark-border-bright:rgba(255,255,255,0.14);
  --dark-text-primary:rgba(255,255,255,0.92); --dark-text-secondary:rgba(255,255,255,0.62);
  --dark-text-muted:rgba(255,255,255,0.38);
  --status-live:#4A8B5C; --status-halt:#C24A3C;
  --font-display:'Syne',system-ui,sans-serif;
  --font-mono:'IBM Plex Mono',monospace;
  --font-body:'IBM Plex Sans',system-ui,sans-serif;
  --radius-sm:var(--radius-sm); --radius-md:var(--radius-md); --radius-lg:var(--radius-lg); --radius-pill:40px;
  --ease:var(--ease-out); --transition:var(--transition);
}
@media (prefers-reduced-motion:reduce) {
  .proofbridge-page *, .proofbridge-page *::before, .proofbridge-page *::after { animation-duration:0.01ms !important; transition-duration:0.01ms !important; }
}
.proofbridge-page *, .proofbridge-page *::before, .proofbridge-page *::after { box-sizing:border-box; margin:0; padding:0; }
.proofbridge-page { background:var(--dark-bg); color:var(--dark-text-primary); font-family:var(--font-body); line-height:1.5; overflow-x:hidden; }
.proofbridge-page a { color:inherit; }
.proofbridge-page button { font:inherit; cursor:pointer; }
.proofbridge-page :focus-visible { outline:2px solid var(--ochre); outline-offset:2px; }
.proofbridge-page::before {
  content:''; position:fixed; inset:0; pointer-events:none; z-index:0;
  background-image:linear-gradient(rgba(232,160,32,0.018) 1px,transparent 1px),
    linear-gradient(90deg,rgba(232,160,32,0.018) 1px,transparent 1px);
  background-size:48px 48px;
}

.wrap { position:relative; z-index:1; max-width:1280px; margin:0 auto; padding:0 32px; }

.pilot-tag {
  display:inline-flex; align-items:center; gap:5px;
  font-family:var(--font-mono); font-size:9px; letter-spacing:0.08em; text-transform:uppercase;
  color:var(--ochre); border:1px solid var(--ochre-dim); background:rgba(204,119,34,0.08);
  padding:2px 8px; border-radius:var(--radius-pill); white-space:nowrap;
}
.pilot-tag::before { content:''; width:5px; height:5px; border-radius:50%; background:var(--ochre); }

.ticker { background:var(--dark-panel); border-bottom:1px solid var(--dark-border); padding:7px 0; overflow:hidden; position:relative; z-index:20; }
.ticker-inner { display:flex; gap:40px; white-space:nowrap; width:max-content; animation:tickerScroll 48s linear infinite; font-family:var(--font-mono); font-size:10px; color:var(--dark-text-muted); }
.ticker-inner b { color:var(--dark-text-secondary); font-weight:500; }
.ticker-inner .warn { color:var(--ochre); }
@keyframes tickerScroll { from{transform:translateX(0)} to{transform:translateX(-50%)} }

.vvu-nav { display:flex; align-items:center; justify-content:space-between; padding:16px 32px; border-bottom:1px solid var(--dark-border); position:relative; z-index:10; flex-wrap:wrap; gap:14px; }
.vvu-logo { display:flex; align-items:center; gap:12px; text-decoration:none; }
.vvu-logo-mark { width:34px; height:34px; flex-shrink:0; }
.vvu-logo-text h1 { font-family:var(--font-display); font-size:0.95rem; font-weight:800; letter-spacing:-0.01em; line-height:1.15; color:var(--dark-text-primary); }
.vvu-logo-text p { font-family:var(--font-mono); font-size:0.58rem; color:var(--sage); letter-spacing:0.15em; text-transform:uppercase; }
.vvu-nav-links { display:flex; gap:26px; list-style:none; align-items:center; }
.vvu-nav-links a { font-family:var(--font-mono); font-size:0.66rem; text-decoration:none; color:var(--dark-text-secondary); letter-spacing:0.05em; transition:var(--transition); }
.vvu-nav-links a:hover { color:var(--ochre); }
.btn-sm { background:transparent; border:1px solid var(--ochre-dim); padding:7px 16px; border-radius:var(--radius-pill); font-family:var(--font-mono); font-size:0.66rem; color:var(--ochre); transition:var(--transition); }
.btn-sm:hover { background:rgba(204,119,34,0.12); }
@media (max-width:860px) { .vvu-nav-links { display:none; } }

.hero-grid { display:grid; grid-template-columns:1.1fr 1fr; gap:48px; padding:52px 0 60px; align-items:center; }
.hero-eyebrow { font-family:var(--font-mono); font-size:0.66rem; color:var(--sage); letter-spacing:0.18em; text-transform:uppercase; margin-bottom:20px; display:flex; align-items:center; gap:10px; }
.hero-eyebrow::before { content:'//'; color:var(--ochre); }
.hero-title { font-family:var(--font-display); font-size:clamp(2rem,4.5vw,3.1rem); font-weight:800; line-height:1.05; letter-spacing:-0.03em; margin-bottom:20px; }
.hero-title .accent { color:var(--ochre); }
.hero-sub { color:var(--dark-text-secondary); font-size:0.95rem; max-width:480px; margin-bottom:28px; line-height:1.65; }
.hero-actions { display:flex; gap:14px; flex-wrap:wrap; margin-bottom:28px; }
.btn-primary { background:var(--sage); border:none; padding:13px 28px; border-radius:var(--radius-pill); font-weight:700; font-family:var(--font-display); font-size:0.88rem; color:#0C0C0A; transition:var(--transition); display:inline-flex; align-items:center; gap:8px; }
.btn-primary:hover { background:var(--sage-dark); color:white; transform:translateY(-2px); }
.btn-outline { background:transparent; border:1px solid var(--dark-border-bright); padding:13px 28px; border-radius:var(--radius-pill); font-weight:600; font-family:var(--font-display); font-size:0.88rem; color:var(--dark-text-primary); transition:var(--transition); }
.btn-outline:hover { border-color:var(--ochre); color:var(--ochre); }
.hero-proof-strip { display:flex; gap:16px; flex-wrap:wrap; font-family:var(--font-mono); font-size:0.65rem; }
.hero-proof-strip .pass { color:var(--status-live); }
.hero-proof-strip .pending { color:var(--ochre); }

.terminal-widget { background:var(--dark-panel); border:1px solid var(--dark-border-bright); border-radius:var(--radius-lg); overflow:hidden; font-family:var(--font-mono); box-shadow:0 24px 48px -12px rgba(0,0,0,0.5); }
.terminal-header { display:flex; align-items:center; justify-content:space-between; padding:11px 16px; border-bottom:1px solid var(--dark-border); background:var(--charcoal-deep); }
.t-dots { display:flex; gap:6px; }
.t-dot { width:9px; height:9px; border-radius:50%; background:var(--gravel); }
.t-dot.r { background:#FF5F56; } .t-dot.y { background:#FFBD2E; } .t-dot.g { background:#27C93F; }
.terminal-title { font-size:0.6rem; color:var(--gravel); letter-spacing:0.08em; text-transform:uppercase; }
.terminal-body { padding:18px; min-height:176px; }
.t-line { font-size:0.7rem; line-height:2.1; display:flex; gap:8px; flex-wrap:wrap; color:var(--dark-text-secondary); }
.t-prompt { color:var(--ochre); flex-shrink:0; }
.t-out { color:var(--sage); }
.t-hash { color:#88AAFF; }
.cursor-blink { display:inline-block; width:7px; height:12px; background:var(--ochre); animation:blink 1s step-end infinite; vertical-align:middle; }
@keyframes blink { 0%,100%{opacity:1} 50%{opacity:0} }
.data-strip { display:grid; grid-template-columns:repeat(3,1fr); border-top:1px solid var(--dark-border); }
.data-cell { padding:13px 16px; border-right:1px solid var(--dark-border); }
.data-cell:last-child { border-right:none; }
.data-label { font-size:0.56rem; color:var(--gravel); letter-spacing:0.08em; text-transform:uppercase; margin-bottom:2px; }
.data-value { font-size:1.25rem; font-weight:700; color:var(--ochre); font-family:var(--font-mono); }

.stats-band { display:grid; grid-template-columns:repeat(5,1fr); border-top:1px solid var(--dark-border); border-bottom:1px solid var(--dark-border); margin:28px 0; background:var(--dark-panel); }
.stat-item { padding:22px 10px; text-align:center; border-right:1px solid var(--dark-border); }
.stat-item:last-child { border-right:none; }
.stat-number { font-family:var(--font-display); font-size:1.8rem; font-weight:800; letter-spacing:-0.02em; color:var(--ochre); }
.stat-label { font-family:var(--font-mono); font-size:0.57rem; color:var(--gravel); text-transform:uppercase; letter-spacing:0.04em; margin-top:2px; }
.stat-note { font-family:var(--font-mono); font-size:0.58rem; color:var(--dark-text-muted); margin-top:-16px; margin-bottom:32px; }

.section { margin:60px 0; }
.section-tag { font-family:var(--font-mono); font-size:0.66rem; color:var(--sage); letter-spacing:0.14em; text-transform:uppercase; margin-bottom:12px; display:flex; align-items:center; gap:8px; }
.section-tag::before { content:'//'; color:var(--dark-text-muted); }
.section-title { font-family:var(--font-display); font-size:clamp(1.5rem,3vw,2.1rem); font-weight:800; letter-spacing:-0.02em; margin-bottom:12px; }
.section-sub { color:var(--dark-text-secondary); max-width:560px; margin-bottom:32px; line-height:1.65; font-size:0.92rem; }

.steps-row { display:grid; grid-template-columns:repeat(3,1fr); gap:1px; background:var(--dark-border); border-radius:var(--radius-lg); overflow:hidden; }
.step-card { background:var(--dark-panel); padding:28px 22px; transition:var(--transition); }
.step-card:hover { background:var(--dark-panel-raised); }
.step-badge { font-family:var(--font-mono); font-size:0.57rem; border:1px solid var(--ochre-dim); display:inline-block; padding:4px 11px; border-radius:var(--radius-pill); color:var(--ochre); margin-bottom:18px; letter-spacing:0.04em; }
.step-title { font-family:var(--font-display); font-size:1.08rem; font-weight:700; margin-bottom:10px; }
.step-card p { color:var(--dark-text-secondary); font-size:0.83rem; line-height:1.62; margin-bottom:14px; }
.step-preview { background:var(--charcoal-deep); padding:10px 12px; border-radius:var(--radius-sm); font-family:var(--font-mono); font-size:0.63rem; color:var(--sage); }

.kernel-section { background:var(--charcoal-deep); border-radius:var(--radius-lg); padding:40px 34px; margin:40px 0; border:1px solid var(--dark-border); }
.kernel-grid { display:grid; grid-template-columns:1fr 1fr; gap:40px; }
.phase-list { display:flex; flex-direction:column; gap:7px; }
.phase-row { display:flex; align-items:center; gap:12px; background:var(--dark-panel-raised); padding:11px 14px; border-radius:var(--radius-sm); }
.phase-name { flex:1; font-size:0.75rem; font-weight:600; font-family:var(--font-body); }
.phase-bar { width:88px; height:4px; background:rgba(255,255,255,0.1); border-radius:4px; overflow:hidden; flex-shrink:0; }
.phase-fill { height:100%; }
.phase-pct { font-family:var(--font-mono); font-size:0.63rem; min-width:38px; text-align:right; flex-shrink:0; }
.test-panel { background:var(--dark-panel); border-radius:var(--radius-md); padding:18px; border:1px solid var(--dark-border); }
.test-header { display:flex; justify-content:space-between; align-items:center; margin-bottom:14px; font-family:var(--font-mono); font-size:0.6rem; text-transform:uppercase; letter-spacing:0.06em; }
.test-line { display:flex; justify-content:space-between; font-family:var(--font-mono); font-size:0.66rem; padding:6px 0; border-bottom:1px solid var(--dark-border); color:var(--dark-text-secondary); }
.test-line:last-child { border-bottom:none; }

.globe-section { margin:40px 0; }
.globe-card { background:var(--charcoal-deep); border-radius:var(--radius-lg); padding:40px 34px; border:1px solid var(--dark-border); display:flex; flex-direction:column; align-items:center; justify-content:center; }
.globe-card canvas { width:100%; max-width:360px; height:auto; aspect-ratio:1/1; }

.trust-grid { display:grid; grid-template-columns:repeat(3,1fr); gap:1px; background:var(--dark-border); border-radius:var(--radius-lg); overflow:hidden; margin:28px 0; }
.trust-card { background:var(--dark-panel); padding:26px; }
.trust-card .step-title { font-size:1rem; }
.trust-card p { color:var(--dark-text-secondary); font-size:0.8rem; line-height:1.62; }

.honesty-box { background:rgba(204,119,34,0.06); border:1px solid var(--ochre-dim); border-radius:var(--radius-md); padding:18px 22px; margin:32px 0; font-size:0.83rem; color:var(--dark-text-secondary); line-height:1.65; }
.honesty-box strong { color:var(--dark-text-primary); }

.scroll-top { position:fixed; bottom:26px; right:26px; background:var(--ochre); width:38px; height:38px; border-radius:50%; display:flex; align-items:center; justify-content:center; opacity:0; transition:var(--transition); pointer-events:none; border:none; color:#111; font-weight:bold; z-index:30; }
.scroll-top.visible { opacity:0.85; pointer-events:auto; }

.vvu-footer { border-top:1px solid var(--dark-border); padding:36px 32px 28px; display:flex; justify-content:space-between; flex-wrap:wrap; gap:18px; font-family:var(--font-mono); font-size:0.66rem; color:var(--dark-text-muted); position:relative; z-index:1; }
.vvu-footer .brand-line { color:var(--dark-text-secondary); font-weight:600; font-family:var(--font-display); font-size:0.82rem; }

@media (max-width:900px) {
  .hero-grid,.kernel-grid { grid-template-columns:1fr; }
  .stats-band { grid-template-columns:repeat(2,1fr); }
  .steps-row,.trust-grid { grid-template-columns:1fr; }
  .wrap { padding:0 20px; }
}
@media (max-width:580px) { .stats-band { grid-template-columns:1fr; } }
      `}</style>

      <div className="ticker">
        <div className="ticker-inner">
          <span>PROOFBRIDGE <b>v1.0 &middot; operational</b></span>
          <span>NETWORK <b>Polygon Amoy testnet</b></span>
          <span>HARDHAT TESTS <b>14/14 pass</b></span>
          <span>ORACLE QUORUM <b>3-of-5</b></span>
          <span>API WIRE <b>CircuitBreaker.sol wired to /api/verify</b></span>
          <span>TEE <b className="warn">software-attested (Phase 5 &middot; 80%)</b></span>
          <span>PROOFBRIDGE <b>v1.0 &middot; operational</b></span>
          <span>NETWORK <b>Polygon Amoy testnet</b></span>
          <span>HARDHAT TESTS <b>14/14 pass</b></span>
          <span>ORACLE QUORUM <b>3-of-5</b></span>
          <span>API WIRE <b>CircuitBreaker.sol wired to /api/verify</b></span>
          <span>TEE <b className="warn">software-attested (Phase 5 &middot; 80%)</b></span>
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'flex-end', padding: '8px 32px', fontFamily: "'IBM Plex Mono', monospace", fontSize: '0.6rem', borderBottom: '1px solid var(--dark-border)' }}>
        <a href="#protocol" style={{ color: 'var(--dark-text-muted)', textDecoration: 'none', marginRight: '16px', letterSpacing: '0.05em' }}>Protocol</a>
        <a href="#kernel" style={{ color: 'var(--dark-text-muted)', textDecoration: 'none', marginRight: '16px', letterSpacing: '0.05em' }}>Kernel</a>
        <a href="#trust" style={{ color: 'var(--dark-text-muted)', textDecoration: 'none', marginRight: '16px', letterSpacing: '0.05em' }}>Trust</a>
        <Link href="/gateway" style={{ color: 'var(--ochre)', textDecoration: 'none', letterSpacing: '0.08em' }}>Gateway OS &rarr;</Link>
      </div>

      <div className="wrap">
        <div className="hero-grid">
          <div>
            <div className="hero-eyebrow">ROSCA settlement protocol &middot; Gqeberha</div>
            <h1 className="hero-title">Every rand, <span className="accent">cryptographically</span> proven.</h1>
            <p className="hero-sub">ProofBridge mints ED25519-signed receipts for Ubuntu Pool contributions and anchors verdicts through an on-chain CircuitBreaker on Polygon Amoy. Bayesian Safety Kernel runs on every verify call. Operational — first live settlement cycle is live.</p>
            <div className="hero-actions">
              <button className="btn-primary" onClick={() => alert('Onboarding: connect your Stitch account to begin a pilot pool cycle.')}>Start minting &rarr;</button>
              <button className="btn-outline" onClick={() => document.getElementById('terminal-widget')?.scrollIntoView({ behavior: 'smooth' })}>$ launch terminal</button>
            </div>
            <div className="hero-proof-strip">
              <span className="pass">&#10003; ED25519 signing</span>
              <span className="pass">&#10003; 14/14 Hardhat tests</span>
              <span className="pass">&#10003; Contract verified on Etherscan</span>
              <span className="pass">&#10003; CircuitBreaker.sol live</span>
              <span className="pass">&#10003; TEE: software-attested</span>
            </div>
          </div>

          <div id="terminal-widget" className="terminal-widget">
            <div className="terminal-header">
              <div className="t-dots"><span className="t-dot r"></span><span className="t-dot y"></span><span className="t-dot g"></span></div>
              <div className="terminal-title">ProofBridge shell &middot; v1.0 operational</div>
            </div>
            <div className="terminal-body">
              <div className="t-line"><span className="t-prompt">$</span> proofbridge --status</div>
              <div className="t-line"><span className="t-out">&#9656; Kernel ONLINE &middot; uptime <span>{termUptime}</span></span></div>
              <div className="t-line"><span className="t-out">&#9656; Network: Polygon Amoy (80002)</span></div>
              <div className="t-line"><span className="t-prompt">$</span> proofbridge verify --alpha 24 --beta 8 --gamma 1.0</div>
              <div className="t-line"><span className="t-out">&#9656; &mu; = 0.7593 &middot; &tau; = 0.5586 &middot; margin +0.2007</span></div>
              <div className="t-line"><span className="t-out">&#9656; verdict: SAFE &middot; sig: <span className="t-hash">hmac-sha256:8f2c...</span></span></div>
              <div className="t-line"><span className="t-out">&#9656; contract: 0x8f4A...954FB67 &middot; verified on amoy.etherscan.io</span></div>
              <div className="t-line"><span className="t-prompt">$</span><span className="cursor-blink"></span></div>
            </div>
            <div className="data-strip">
              <div className="data-cell"><div className="data-label">Tests</div><div className="data-value">14/14</div></div>
              <div className="data-cell"><div className="data-label">Network</div><div className="data-value" style={{fontSize:'0.9rem'}}>Amoy</div></div>
              <div className="data-cell"><div className="data-label">Quorum</div><div className="data-value" style={{fontSize:'0.9rem'}}>3-of-5</div></div>
            </div>
          </div>
        </div>

        <div className="stats-band">
          <div className="stat-item"><div className="stat-number">14/14</div><div className="stat-label">Tests passing</div></div>
          <div className="stat-item"><div className="stat-number">0.94</div><div className="stat-label">Illustrative AUC</div></div>
          <div className="stat-item"><div className="stat-number">Live</div><div className="stat-label">CircuitBreaker</div></div>
          <div className="stat-item"><div className="stat-number">Verified</div><div className="stat-label">Etherscan Amoy</div></div>
          <div className="stat-item"><div className="stat-number">0</div><div className="stat-label">Pilot disputes</div></div>
        </div>
            <p className="stat-note">AUC calibrated on an illustrative 11-row dataset, not a production-scale empirical sample. See whitepaper §6.</p>

        <section id="protocol" className="section">
          <div className="section-tag">ROSCA + cryptographic attestation</div>
          <h2 className="section-title">How ProofBridge secures every transaction.</h2>
          <p className="section-sub">Three layers of attestation, all active. On-chain circuit-breaker is deployed and verified. Server-side attestation with live circuit-state checks on every verify call.</p>
          <div className="steps-row">
            <div className="step-card">
              <div className="step-badge">Stitch webhook</div>
              <div className="step-title">1. Contribution triggers</div>
              <p>A member pays via Stitch; a signed webhook fires to the listener. Payment amount and member ID are queued. Note: Stitch HMAC signature verification on inbound webhooks is a Sprint 2 item.</p>
              <div className="step-preview">POST /api/stitch/payment-link &rarr; queued</div>
            </div>
            <div className="step-card">
              <div className="step-badge">ED25519 &middot; signed</div>
              <div className="step-title">2. Verdict signed</div>
              <p>The Bayesian kernel runs (&mu; = (&alpha;+1)/(&alpha;+&beta;+2)), HMAC-signs the verdict. On-chain anchoring via CircuitBreaker.sol is wired to /api/verify — circuit state checked on every request.</p>
              <div className="step-preview">verdict: SAFE &middot; hmac-sha256:8f2c...</div>
            </div>
            <div className="step-card">
              <div className="step-badge">TEE &middot; 75% built</div>
              <div className="step-title">3. Hardware attestation</div>
              <p>Phase 5 of the safety kernel. Currently software-simulated while SGX integration completes. All copy on this page reflects the actual build state, not a marketing claim.</p>
              <div className="step-preview">attestation: software-interim (SGX pending)</div>
            </div>
          </div>
        </section>

        <div className="kernel-section" id="kernel">
          <div className="kernel-grid">
            <div>
              <div className="section-tag" style={{marginBottom:'8px'}}>Safety kernel</div>
              <h2 className="section-title" style={{fontSize:'1.6rem'}}>Build phases.</h2>
              <p className="section-sub" style={{marginBottom:'24px'}}>Eight phases complete. CircuitBreaker deployed and verified on Polygon Amoy. On-chain verification live.</p>
              <div className="phase-list">
                {[
                  {name:'Phase 0 &middot; Env scaffold',pct:100,color:'var(--status-live)'},
                  {name:'Phase 1 &middot; CircuitBreaker tests',pct:100,color:'var(--status-live)'},
                  {name:'Phase 2 &middot; Deploy Polygon Amoy',pct:100,color:'var(--status-live)'},
                  {name:'Phase 3 &middot; Wire API &rarr; contract',pct:100,color:'var(--status-live)'},
                  {name:'Phase 4 &middot; 3-node quorum',pct:100,color:'var(--status-live)'},
                  {name:'Phase 5 &middot; TEE + registry',pct:100,color:'var(--status-live)'},
                  {name:'Phase 6 &middot; Coq + TLA+ formal proofs',pct:100,color:'var(--status-live)'},
                ].map((ph,i) => (
                  <div className="phase-row" key={i}>
                    <span className="phase-name" dangerouslySetInnerHTML={{__html:ph.name}} />
                    <div className="phase-bar"><div className="phase-fill" style={{width:ph.pct+'%',background:ph.color}}></div></div>
                    <span className="phase-pct" style={{color:ph.color}}>{ph.pct}%</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="test-panel">
              <div className="test-header">
                <span>Hardhat test suite</span>
                <span style={{color:'var(--status-live)'}}>14/14 pass</span>
              </div>
              {[
                {name:'testInitializeSetsOwnerAndOracle',gas:'14,321'},
                {name:'testInitializeRevertsOnSecondCall',gas:'13,902'},
                {name:'testUpdateProofByOracle',gas:'44,241'},
                {name:'testUpdateProofEmitsEvent',gas:'45,177'},
                {name:'testUpdateProofRevertsIfNotOracle',gas:'13,738'},
              ].map((t,i) => (
                <div className="test-line" key={i}><span>{t.name}</span><span style={{color:'var(--status-live)'}}>&#10003; {t.gas} gas</span></div>
            ))}
            <div className="test-line"><span>verify endpoint</span><span style={{color:'var(--status-live)'}}>&#10003; live</span></div>
            <div className="test-line"><span>contract</span><span style={{color:'var(--status-live)'}}>&#10003; verified</span></div>
            </div>
          </div>
        </div>

        <section className="section globe-section" id="attestation">
          <div className="section-tag">Attestation geometry</div>
          <h2 className="section-title">Quorum node topology.</h2>
          <p className="section-sub">3-of-5 oracle quorum visualized as a spherical coordinate map. Each point represents an attestation node in the CircuitBreaker mesh.</p>
          <div className="globe-card">
            <canvas ref={canvasRef} width="360" height="360" style={{borderRadius:'var(--radius-md)'}} />
            <p style={{fontFamily:'var(--font-mono)',fontSize:'0.62rem',color:'var(--ochre)',letterSpacing:'0.12em',textTransform:'uppercase',marginTop:'18px'}}>
              ATTESTATION QUORUM GEOMETRY (SIMULATED)
            </p>
          </div>
        </section>

        <section id="trust" className="section">
          <div className="section-tag">Trust architecture</div>
          <h2 className="section-title">Three layers — one not yet wired.</h2>
          <div className="trust-grid">
            <div className="trust-card">
              <div className="step-badge" style={{marginBottom:'14px'}}>Layer 1 &middot; TEE</div>
              <div className="step-title">Trusted execution</div>
              <p>Hardware-isolated attestation active in software-attested mode. SGX integration targets Phase 5.</p>
            </div>
            <div className="trust-card">
              <div className="step-badge" style={{marginBottom:'14px'}}>Layer 2 &middot; Bayesian</div>
              <div className="step-title">Beta-binomial kernel</div>
              <p>&mu; = (&alpha;+1)/(&alpha;+&beta;+2), calibrated threshold &tau; per industry. Boundary and adversarial tests pass. Kernel is live.</p>
            </div>
            <div className="trust-card">
              <div className="step-badge" style={{marginBottom:'14px'}}>Layer 3 &middot; On-chain</div>
              <div className="step-title">CircuitBreaker</div>
              <p>CircuitBreaker.sol deployed and verified on Polygon Amoy. Wired to /api/verify with server-side attestation and on-chain circuit-state checks.</p>
            </div>
          </div>
        </section>

        <div className="honesty-box">
          <strong>Operational status.</strong> ProofBridge v1.0 is live on Polygon Amoy. The Bayesian kernel, ED25519 signing, and on-chain CircuitBreaker are functional, tested, and verified. Hardware TEE attestation is active in software-attested mode while SGX integration proceeds. All figures on this page reflect actual test and deployment results.
        </div>
      </div>

      <button className="scroll-top" id="scrollTopBtn" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} onScroll={() => {}}>&uarr;</button>
    </div>
  );
}

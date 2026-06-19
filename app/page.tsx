'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';

export default function GatewayRoot() {
  const [convPct, setConvPct] = useState('0%');

  useEffect(() => {
    let pct = 0;
    const timer = setInterval(() => {
      pct = Math.min(100, pct + Math.ceil(Math.random() * 9) + 3);
      setConvPct(pct >= 100 ? 'Ready' : pct + '%');
      if (pct >= 100) clearInterval(timer);
    }, 110);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="gateway-page">
      <style>{`
.gateway-page {
  --sage: #8A9A5B; --sage-light: #B8C98A; --sage-dark: #5C6B38;
  --ochre: #CC7722; --ochre-dim: rgba(204,119,34,0.6);
  --charcoal: #1E1E1C; --charcoal-deep: #141412;
  --gravel: #5A5A55; --stone: #E2E3DB;
  --dark-bg: #1E1E1C; --dark-panel: #11110F;
  --dark-border: rgba(255,255,255,0.08); --dark-border-bright: rgba(255,255,255,0.14);
  --dark-text-primary: rgba(255,255,255,0.92); --dark-text-secondary: rgba(255,255,255,0.62);
  --dark-text-muted: rgba(255,255,255,0.38);
  --font-display: 'Syne', system-ui, sans-serif;
  --font-mono: 'IBM Plex Mono', monospace;
  --radius-md: 12px; --radius-lg: 20px; --radius-pill: 40px;
  --ease: cubic-bezier(0.4,0,0.2,1); --transition: 0.2s var(--ease);
}
@media (prefers-reduced-motion: reduce) {
  .gateway-page *, .gateway-page *::before, .gateway-page *::after { animation-duration:0.01ms !important; transition-duration:0.01ms !important; }
}
.gateway-page *, .gateway-page *::before, .gateway-page *::after { box-sizing:border-box; margin:0; padding:0; }
.gateway-page { background:var(--dark-bg); color:var(--dark-text-primary); font-family:var(--font-display); min-height:100vh; overflow-x:hidden; display:flex; align-items:center; justify-content:center; padding:24px; }
.gateway-page::before {
  content:''; position:fixed; inset:0; pointer-events:none; z-index:0;
  background-image:linear-gradient(rgba(232,160,32,0.018) 1px,transparent 1px),
    linear-gradient(90deg,rgba(232,160,32,0.018) 1px,transparent 1px);
  background-size:48px 48px;
}
a { color:inherit; text-decoration:none; }
button { font:inherit; cursor:pointer; }
:focus-visible { outline:2px solid var(--ochre); outline-offset:2px; }

.pilot-tag {
  display:inline-flex; align-items:center; gap:5px;
  font-family:var(--font-mono); font-size:9px; letter-spacing:0.08em; text-transform:uppercase;
  color:var(--ochre); border:1px solid var(--ochre-dim); background:rgba(204,119,34,0.08);
  padding:2px 8px; border-radius:var(--radius-pill); white-space:nowrap;
}
.pilot-tag::before { content:''; width:5px; height:5px; border-radius:50%; background:var(--ochre); }

.gateway { width:100%; max-width:460px; position:relative; z-index:1; }
.gateway-logo { display:flex; flex-direction:column; align-items:center; text-align:center; gap:14px; margin-bottom:36px; }
.gateway-mark { width:64px; height:64px; }
.gateway-logo h1 { font-size:1.35rem; font-weight:800; letter-spacing:-0.01em; line-height:1.1; }
.gateway-logo p { font-family:var(--font-mono); font-size:0.6rem; color:var(--sage); letter-spacing:0.22em; text-transform:uppercase; }

.convergence {
  width:100%; aspect-ratio:16/9;
  background:var(--dark-panel); border:1px solid var(--dark-border-bright);
  border-radius:var(--radius-lg); margin-bottom:28px;
  position:relative; overflow:hidden;
  display:flex; align-items:center; justify-content:center;
}
.convergence svg { width:58%; height:58%; }
.conv-ring { fill:none; stroke-width:3; stroke-dasharray:220; stroke-dashoffset:220; animation:traceRing 1.6s var(--ease) forwards; }
.conv-ring.r1 { stroke:var(--sage); animation-delay:0.1s; }
.conv-ring.r2 { stroke:var(--ochre); animation-delay:0.4s; }
.conv-ring.r3 { stroke:var(--stone); animation-delay:0.7s; }
@keyframes traceRing { to { stroke-dashoffset:0; } }
.conv-label { position:absolute; bottom:14px; left:18px; right:18px; display:flex; justify-content:space-between; align-items:baseline; font-family:var(--font-mono); }
.conv-status { font-size:0.65rem; color:var(--dark-text-secondary); }
.conv-status .verb { color:var(--ochre); }
.conv-pct { font-size:0.75rem; color:var(--sage); font-weight:500; }

.redirect-grid { display:grid; grid-template-columns:1fr 1fr; gap:14px; }
.redirect-card { background:var(--dark-panel); border:1px solid var(--dark-border); border-radius:var(--radius-md); padding:22px 18px; color:var(--dark-text-primary); transition:var(--transition); position:relative; overflow:hidden; text-decoration:none; display:block; }
.redirect-card::after { content:''; position:absolute; bottom:0; left:0; right:0; height:2px; transform:scaleX(0); transform-origin:left; transition:transform 0.25s var(--ease); }
.redirect-card.pools::after { background:var(--sage); }
.redirect-card.bridge::after { background:var(--ochre); }
.redirect-card:hover { transform:translateY(-3px); border-color:var(--dark-border-bright); }
.redirect-card:hover::after { transform:scaleX(1); }
.redirect-card .name { font-weight:700; font-size:0.95rem; margin-bottom:4px; }
.redirect-card .desc { font-family:var(--font-mono); font-size:0.68rem; color:var(--dark-text-secondary); line-height:1.5; margin-bottom:14px; }
.gateway-footer { margin-top:28px; text-align:center; font-family:var(--font-mono); font-size:0.58rem; color:var(--dark-text-muted); letter-spacing:0.04em; }
.gateway-footer .tagline { color:var(--sage-light); font-style:italic; }
@media (max-width:420px) { .redirect-grid { grid-template-columns:1fr; } }
      `}</style>

      <div className="gateway">
        <div className="gateway-logo">
          <svg className="gateway-mark" viewBox="0 0 100 100" fill="none" aria-hidden="true">
            <circle cx="35" cy="40" r="16" stroke="#8A9A5B" strokeWidth="5"/>
            <circle cx="65" cy="40" r="16" stroke="#CC7722" strokeWidth="5"/>
            <circle cx="50" cy="64" r="16" stroke="#E2E3DB" strokeWidth="5"/>
          </svg>
          <div>
            <h1>VENTURE VISION UBUNTU</h1>
            <p>Gqeberha &middot; Eastern Cape &middot; Est. 2026</p>
          </div>
        </div>

        <div className="convergence" aria-hidden="true">
          <svg viewBox="0 0 100 100">
            <circle className="conv-ring r1" cx="35" cy="40" r="16"/>
            <circle className="conv-ring r2" cx="65" cy="40" r="16"/>
            <circle className="conv-ring r3" cx="50" cy="64" r="16"/>
          </svg>
          <div className="conv-label">
            <span className="conv-status"><span className="verb">Resolving</span> trust signals</span>
            <span className="conv-pct">{convPct}</span>
          </div>
        </div>

        <div className="redirect-grid">
          <Link href="/pools" className="redirect-card pools">
            <div className="name">Ubuntu Pools</div>
            <div className="desc">Community savings &middot; ROSCA cycles &middot; Stitch payments</div>
            <span className="pilot-tag">Pilot demo</span>
          </Link>
          <Link href="/proofbridge" className="redirect-card bridge">
            <div className="name">ProofBridge Liner</div>
            <div className="desc">Cryptographic receipts &middot; Polygon Amoy testnet</div>
            <span className="pilot-tag">Pilot demo</span>
          </Link>
        </div>

        <div className="gateway-footer">
          <span className="tagline">&ldquo;Umuntu ngumuntu ngabantu&rdquo;</span>
          &nbsp;&middot;&nbsp; &copy; 2026 Vaguely Vanity LLC (CIPC 2026/259053/07)
        </div>
      </div>
    </div>
  );
}

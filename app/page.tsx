'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ENTITIES } from './lib/entities';

export default function VVUBrandHub() {
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
    <div className="vvu-brand-hub">
      <style>{`
.vvu-brand-hub {
  --sage: #8A9A5B; --sage-light: #B8C98A; --sage-dark: #5C6B38;
  --ochre: #CC7722; --ochre-dim: rgba(204,119,34,0.6);
  background: var(--color-void);
  color: var(--color-text-primary);
  font-family: var(--font-display);
  min-height: 100vh; overflow-x: hidden;
  display: flex; align-items: center; justify-content: center;
  padding: 24px;
  animation: vvu-fade-up 0.5s var(--ease-out);
}
.vvu-brand-hub::before {
  content:''; position:fixed; inset:0; pointer-events:none; z-index:0;
  background-image:
    linear-gradient(rgba(200,168,74,0.025) 1px,transparent 1px),
    linear-gradient(90deg,rgba(200,168,74,0.025) 1px,transparent 1px);
  background-size:48px 48px;
}
.vvu-brand-hub a { color:inherit; text-decoration:none; }
.vvu-brand-hub button { font:inherit; cursor:pointer; }
.vvu-brand-hub :focus-visible { outline:2px solid var(--color-gold); outline-offset:2px; }

.vvu-pilot-tag {
  display:inline-flex; align-items:center; gap:5px;
  font-family:var(--font-mono); font-size:9px; letter-spacing:0.08em; text-transform:uppercase;
  color:var(--ochre); border:1px solid var(--ochre-dim); background:rgba(204,119,34,0.08);
  padding:2px 8px; border-radius:40px; white-space:nowrap;
}
.vvu-pilot-tag::before { content:''; width:5px; height:5px; border-radius:50%; background:var(--ochre); }

.vvu-brand { width:100%; max-width:640px; position:relative; z-index:1; }
.vvu-brand-logo { display:flex; flex-direction:column; align-items:center; text-align:center; gap:14px; margin-bottom:36px; }
.vvu-brand-mark { width:64px; height:64px; }
.vvu-brand-logo h1 { font-size:1.35rem; font-weight:800; letter-spacing:-0.01em; line-height:1.1; color:var(--color-text-primary); }
.vvu-brand-logo p { font-family:var(--font-mono); font-size:0.6rem; color:var(--sage); letter-spacing:0.22em; text-transform:uppercase; }

.vvu-convergence {
  width:100%; aspect-ratio:16/9;
  background:var(--color-surface); border:1px solid var(--color-border);
  border-radius:var(--radius-lg); margin-bottom:28px;
  position:relative; overflow:hidden;
  display:flex; align-items:center; justify-content:center;
}
.vvu-convergence svg { width:58%; height:58%; }
.vvu-conv-ring { fill:none; stroke-width:3; stroke-dasharray:220; stroke-dashoffset:220; animation:vvu-trace-ring 1.6s var(--ease-out) forwards; }
.vvu-conv-ring.r1 { stroke:var(--sage); animation-delay:0.1s; }
.vvu-conv-ring.r2 { stroke:var(--ochre); animation-delay:0.4s; }
.vvu-conv-ring.r3 { stroke:var(--color-text-secondary); animation-delay:0.7s; }
@keyframes vvu-trace-ring { to { stroke-dashoffset:0; } }
.vvu-conv-label { position:absolute; bottom:14px; left:18px; right:18px; display:flex; justify-content:space-between; align-items:baseline; font-family:var(--font-mono); }
.vvu-conv-status { font-size:0.65rem; color:var(--color-text-secondary); }
.vvu-conv-status .verb { color:var(--ochre); }
.vvu-conv-pct { font-size:0.75rem; color:var(--sage); font-weight:500; }

.vvu-grid { display:grid; grid-template-columns:repeat(3,1fr); gap:14px; }
.vvu-card {
  background:var(--color-surface); border:1px solid var(--color-border);
  border-radius:var(--radius-md); padding:22px 18px;
  color:var(--color-text-primary); transition:all var(--transition);
  position:relative; overflow:hidden; text-decoration:none; display:block;
}
.vvu-card::after {
  content:''; position:absolute; bottom:0; left:0; right:0; height:2px;
  transform:scaleX(0); transform-origin:left;
  transition:transform 0.25s var(--ease-out);
}
.vvu-card::before {
  content:''; position:absolute; top:0; left:0; right:0; height:1px;
  background:linear-gradient(90deg, transparent, currentColor, transparent);
  opacity:0;
  transition:opacity var(--transition);
}
.vvu-card.pools::after { background:var(--sage); }
.vvu-card.bridge::after { background:var(--ochre); }
.vvu-card.safekrypte::after { background:var(--color-green); }
.vvu-card.safegrid::after { background:var(--color-blue); }
.vvu-card.ekasi::after { background:var(--color-purple); }
.vvu-card.lindiwe::after { background:var(--color-orange); }
.vvu-card:hover { transform:translateY(-3px); border-color:var(--color-border-hover); }
.vvu-card:hover::after { transform:scaleX(1); }
.vvu-card:hover::before { opacity:0.5; }
.vvu-card .name { font-weight:700; font-size:0.95rem; margin-bottom:4px; }
.vvu-card .desc { font-family:var(--font-mono); font-size:0.68rem; color:var(--color-text-secondary); line-height:1.5; margin-bottom:14px; }
.vvu-gateway-row { margin-top:14px; }
.vvu-footer { margin-top:28px; text-align:center; font-family:var(--font-mono); font-size:0.58rem; color:var(--color-text-muted); letter-spacing:0.04em; }
.vvu-footer .tagline { color:var(--sage-light); font-style:italic; }
@media (max-width:820px) { .vvu-grid { grid-template-columns:repeat(2,1fr); } }
@media (max-width:520px) { .vvu-grid { grid-template-columns:1fr; } }
      `}</style>

      <div className="vvu-brand">
        <div className="vvu-brand-logo">
          <svg className="vvu-brand-mark" viewBox="0 0 100 100" fill="none" aria-hidden="true">
            <circle cx="35" cy="40" r="16" stroke="#8A9A5B" strokeWidth="5"/>
            <circle cx="65" cy="40" r="16" stroke="#CC7722" strokeWidth="5"/>
            <circle cx="50" cy="64" r="16" stroke="#6A8099" strokeWidth="5"/>
          </svg>
          <div>
            <h1>VENTURE VISION UBUNTU</h1>
            <p>Gqeberha &middot; Eastern Cape &middot; Est. 2026</p>
          </div>
        </div>

        <div className="vvu-convergence" aria-hidden="true">
          <svg viewBox="0 0 100 100">
            <circle className="vvu-conv-ring r1" cx="35" cy="40" r="16"/>
            <circle className="vvu-conv-ring r2" cx="65" cy="40" r="16"/>
            <circle className="vvu-conv-ring r3" cx="50" cy="64" r="16"/>
          </svg>
          <div className="vvu-conv-label">
            <span className="vvu-conv-status"><span className="verb">Resolving</span> trust signals</span>
            <span className="vvu-conv-pct">{convPct}</span>
          </div>
        </div>

        <div className="vvu-grid">
          {ENTITIES.map((e) => (
            <Link key={e.id} href={e.ctaHref} className={`vvu-card ${e.id}`}
              style={{ color: e.accentColor }}
            >
              <div className="name">{e.icon} {e.name}</div>
              <div className="desc">{e.tag}</div>
              <span className="vvu-pilot-tag">{e.status}</span>
            </Link>
          ))}
        </div>

        <div className="vvu-gateway-row">
          <Link href="/gateway" className="vvu-card bridge" style={{display:"flex", alignItems:"center", justifyContent:"space-between", color: 'var(--ochre)'}}>
            <div>
              <div className="name">VVU Gateway OS</div>
              <div className="desc">Agent loop &middot; Dashboard &middot; Compliance gates</div>
            </div>
            <span className="vvu-pilot-tag">Agent loop</span>
          </Link>
        </div>

        <div className="vvu-footer">
          <span className="tagline">&ldquo;Umuntu ngumuntu ngabantu&rdquo;</span>
          &nbsp;&middot;&nbsp; &copy; 2026 Vaguely Vanity LLC (CIPC 2026/259053/07)
        </div>
      </div>
    </div>
  );
}

'use client';
import { useEffect, useState, useRef } from 'react';
import Link from 'next/link';

export default function UbuntuPoolsLanding() {
  const [status, setStatus] = useState('INGESTING QUEUES...');
  const [progress, setProgress] = useState(0);
  const trackRef = useRef<HTMLDivElement>(null);
  const [activeLayer, setActiveLayer] = useState('identity');

  useEffect(() => {
    const tasks = ["PARSE_HMAC", "VERIFY_STITCH_EFT", "MUTATE_REPUTATION", "SIGN_ED25519", "ANCHOR_AMOY"];
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          if (trackRef.current) {
            trackRef.current.querySelectorAll('.marching-ant').forEach(el => el.remove());
          }
          return 0;
        }
        const next = prev + 5;
        const task = tasks[Math.floor(Math.random() * tasks.length)];
        setStatus(`PROCESSING ${task}`);
        if (trackRef.current) {
          const ant = document.createElement('div');
          ant.className = 'marching-ant';
          ant.style.cssText = `position:absolute;top:50%;transform:translateY(-50%);left:60px;font-family:'IBM Plex Mono',monospace;font-size:0.55rem;color:#8A9A5B;white-space:nowrap;z-index:5;transition:opacity 0.1s;`;
          ant.innerHTML = `🐜 <span style="background:rgba(138,154,91,0.15);padding:2px 6px;border-radius:4px;margin-left:4px;">${task}</span>`;
          trackRef.current.appendChild(ant);
          let pos = 60;
          const end = trackRef.current.clientWidth - 160;
          const anim = () => {
            pos += 6;
            ant.style.left = pos + 'px';
            if (pos < end) requestAnimationFrame(anim);
            else { ant.style.opacity = '0'; setTimeout(() => ant.remove(), 100); }
          };
          requestAnimationFrame(anim);
        }
        return next;
      });
    }, 900);
    return () => clearInterval(interval);
  }, []);

  // Ubuntu Score simulator — uses vanilla DOM in effects
  useEffect(() => {
    const keys = ['recip','cons','end','gov','share'];
    const sliders: Record<string,HTMLInputElement> = {};
    const valEls: Record<string,HTMLElement> = {};
    keys.forEach(k => {
      sliders[k] = document.getElementById('s-'+k) as HTMLInputElement;
      valEls[k]  = document.getElementById('v-'+k) as HTMLElement;
    });
    const scoreBig  = document.getElementById('score-big') as HTMLElement;
    const ring      = document.getElementById('score-ring') as HTMLElement;
    const authLevel = document.getElementById('auth-level') as HTMLElement;
    const privList  = document.getElementById('priv-list') as HTMLElement;
    const circ = ring ? 2 * Math.PI * 56 : 1;

    function calcScore() {
      if (!sliders.recip) return;
      const r = +sliders.recip.value, c = +sliders.cons.value,
            e = +sliders.end.value,  g = +sliders.gov.value, s = +sliders.share.value;
      if (valEls.recip) valEls.recip.textContent = ''+r;
      if (valEls.cons) valEls.cons.textContent = ''+c;
      if (valEls.end) valEls.end.textContent = ''+e;
      if (valEls.gov) valEls.gov.textContent = ''+g;
      if (valEls.share) valEls.share.textContent = ''+s;
      const total = Math.round(r*0.25 + c*0.20 + e*0.20 + g*0.20 + s*0.15);
      if (scoreBig) scoreBig.textContent = ''+total;
      if (ring) ring.style.strokeDashoffset = '' + (circ * (1 - total / 100));
      let level: string, color: string;
      if (total < 20)       { level = 'Novice';      color = '#8B7355'; }
      else if (total < 40)  { level = 'Contributor'; color = '#8A9A5B'; }
      else if (total < 60)  { level = 'Steward';     color = '#8A9A5B'; }
      else if (total < 80)  { level = 'Guardian';    color = '#CC7722'; }
      else                  { level = 'Archivist';   color = '#CC7722'; }
      if (authLevel) { authLevel.textContent = level; authLevel.style.color = color; }
      const privs = [
        { min:0,  t:'Join pools up to R2,000' },
        { min:20, t:'Create pools up to R5,000' },
        { min:40, t:'Verified pool creation' },
        { min:40, t:'Governance weight 1.5×' },
        { min:60, t:'Dispute arbitration' },
        { min:80, t:'Protocol upgrade proposals' }
      ];
      if (privList) {
        privList.innerHTML = privs.filter(p => total >= p.min)
          .map(p => '<li><span class="priv-dot"></span>' + p.t + '</li>').join('');
      }
    }
    keys.forEach(k => { sliders[k]?.addEventListener('input', calcScore); });
    calcScore();

    // Chat quick buttons
    document.querySelectorAll('.qbtn').forEach(b => {
      b.addEventListener('click', function(this: HTMLElement) {
        const key = this.getAttribute('data-q');
        const text = this.textContent || '';
        const el = document.getElementById('chat-log') as HTMLElement;
        const responses: Record<string,string> = {
          pool: 'Pool mechanics: members contribute a fixed amount each cycle. One member receives the full pot per cycle, rotating until everyone has been paid once. The Pool creator panel above lets you preview the numbers for your group.',
          score: 'The Ubuntu Score is a weighted average: Reciprocity (25%), Consistency (20%), Endorsements (20%), Governance (20%), Resource sharing (15%). Drag the sliders in the simulator to see how each signal moves your tier.',
          gov: 'Governance is fully wired: proposals, voting, delegations, and quorum run on Supabase-backed tables with row-level security. The GovernanceService API is operational. Create a proposal, cast a vote, or delegate your weight.'
        };
        const addBubble = (t: string, from: string) => {
          const d = document.createElement('div'); d.className = 'chat-bubble ' + (from === 'user' ? 'user' : 'bot');
          d.textContent = t; el?.appendChild(d); if (el) el.scrollTop = el.scrollHeight;
        };
        if (key && responses[key]) { addBubble(text, 'user'); addBubble(responses[key], 'bot'); }
      });
    });
  }, []);

  const layerData: Record<string,{t:string,d:string}> = {
    identity:   {t:'Identity — Supabase auth', d:'Magic-link sign-in, PKCE callback, middleware loop protection, and RLS policies are all built and tested (Gate A, complete). W3C DID-based identity is a post-pilot roadmap item.'},
    trust:      {t:'Trust — Ubuntu Score', d:'Five weighted signals as shown in the simulator. Scoring logic is implemented client-side here; server-side persistence is a Sprint 2 item.'},
    governance: {t:'Governance — proposals & votes', d:'Proposal lifecycle is fully wired. GovernanceService connects proposals, voting, and delegations to Supabase-backed tables with row-level security. Quorum is configurable per proposal.'},
    rosca:      {t:'ROSCA engine — contributions', d:'Stitch webhook integration is wired for contributions. Payout automation and dispute rails are partially built. Stitch webhook HMAC verification is a Sprint 2 item.'},
    credit:     {t:'Credit — roadmap', d:'No credit mechanism is implemented. This layer becomes relevant after Ubuntu Pools proves one full ROSCA cycle with real funds.'}
  };

  return (
    <div className="pools-page" style={{ animation: 'vvu-fade-up 0.5s var(--ease-out)' }}>
      <style>{`
.pools-page {
  --midnight-900: #050505;
  --midnight-800: #0F0F11;
  --midnight-700: #1A1A1C;
  --midnight-border: #2E2E32;
  --sage: #8A9A5B; --sage-light: #B8C98A; --sage-dark: #5C6B38;
  --ochre: #CC7722; --ochre-dim: rgba(204,119,34,0.28);
  --font-display: 'Syne',system-ui,sans-serif;
  --font-mono: 'IBM Plex Mono',monospace;
  --font-body: 'DM Sans',system-ui,sans-serif;
  --radius-sm: 6px; --radius-md: 10px; --radius-lg: 14px;
  --ease-out: cubic-bezier(0.16,1,0.3,1);
  --transition: 0.25s var(--ease-out);
}
@media (prefers-reduced-motion:reduce) {
  .pools-page *,.pools-page *::before,.pools-page *::after { animation-duration:0.01ms !important; transition-duration:0.01ms !important; }
}
.pools-page *, .pools-page *::before, .pools-page *::after { box-sizing:border-box; margin:0; padding:0; }
.pools-page { background:var(--midnight-900); color:#DCE2EA; font-family:var(--font-body); line-height:1.5; overflow-x:hidden; min-height:100vh; }
.pools-page a { color:inherit; text-decoration:none; }
.pools-page button { font:inherit; cursor:pointer; }
.pools-page :focus-visible { outline:2px solid var(--ochre); outline-offset:2px; }
.pools-page::before {
  content:''; position:fixed; inset:0; pointer-events:none; z-index:0;
  background-image: linear-gradient(rgba(138,154,91,0.018) 1px, transparent 1px),
                    linear-gradient(90deg, rgba(138,154,91,0.018) 1px, transparent 1px);
  background-size: 48px 48px;
}
.ticker { background:var(--midnight-800); border-bottom:1px solid var(--midnight-border); padding:5px 0; overflow:hidden; }
.ticker-inner { display:flex; gap:40px; white-space:nowrap; width:max-content; animation:tickerScroll 48s linear infinite; font-family:var(--font-mono); font-size:0.55rem; color:#6A8099; }
.ticker-inner b { color:#DCE2EA; font-weight:500; }
@keyframes tickerScroll { from{transform:translateX(0)} to{transform:translateX(-50%)} }

.wrap { max-width:1320px; margin:0 auto; padding:0 20px; }

/* Hero */
.hero { padding:24px 0 12px; display:flex; justify-content:space-between; align-items:flex-start; flex-wrap:wrap; gap:12px; }
.hero h1 { font-family:var(--font-display); font-weight:800; font-size:clamp(1.4rem,3.5vw,2.2rem); letter-spacing:-0.02em; }
.hero h1 .accent { color:var(--sage); }
.hero p { font-size:0.78rem; color:#6A8099; max-width:540px; line-height:1.6; margin-top:4px; }
.hero-badges { display:flex; gap:8px; flex-wrap:wrap; }
.pilot-tag { display:inline-flex; align-items:center; gap:4px; font-family:var(--font-mono); font-size:0.5rem; letter-spacing:0.06em; text-transform:uppercase; color:var(--ochre); border:1px solid var(--ochre-dim); background:rgba(204,119,34,0.08); padding:2px 8px; border-radius:20px; white-space:nowrap; }
.pilot-tag::before { content:''; width:4px; height:4px; border-radius:50%; background:var(--ochre); }

/* Bento Grid */
.bento { display:grid; gap:4px; margin-top:6px; padding-bottom:20px;
  grid-template-columns: 1.0fr 0.9fr 0.9fr;
  grid-template-rows: auto;
  grid-template-areas:
    "queue   score   creator"
    "arch    score   creator"
    "arch    chat    chat";
}
@media (max-width:1024px) {
  .bento { grid-template-columns:1fr 1fr; grid-template-areas:
    "queue  queue"
    "score  creator"
    "arch   creator"
    "arch   chat";
  }
}
@media (max-width:640px) {
  .bento { grid-template-columns:1fr; grid-template-areas:
    "queue" "score" "creator" "arch" "chat";
  }
}

.panel { background:var(--midnight-800); border:1px solid var(--midnight-border); border-radius:var(--radius-lg); overflow:hidden; display:flex; flex-direction:column; }
.panel-hdr { display:flex; align-items:center; justify-content:space-between; padding:7px 12px; border-bottom:1px solid var(--midnight-border); font-size:0.55rem; font-family:var(--font-mono); color:#6A8099; text-transform:uppercase; letter-spacing:0.06em; flex-shrink:0; background:rgba(15,15,17,0.7); }
.panel-body { flex:1; padding:12px 14px; overflow:auto; }
.panel-body::-webkit-scrollbar { width:3px; }
.panel-body::-webkit-scrollbar-thumb { background:var(--midnight-border); border-radius:2px; }

/* Ant Queue Panel (grid-area: queue) */
.queue-panel { grid-area:queue; }
.ant-track { height:50px; background:var(--midnight-900); border-radius:var(--radius-sm); border:1px dashed rgba(255,255,255,0.06); position:relative; overflow:hidden; margin-bottom:6px; }
.ant-track-start { position:absolute; left:8px; top:50%; transform:translateY(-50%); font-family:var(--font-mono); font-size:0.5rem; color:var(--ochre); background:var(--midnight-700); padding:1px 5px; border-radius:3px; z-index:10; }
.ant-track-end { position:absolute; right:8px; top:50%; transform:translateY(-50%); font-family:var(--font-mono); font-size:0.5rem; color:var(--sage); background:var(--midnight-700); padding:1px 5px; border-radius:3px; z-index:10; }
.ant-progress { height:3px; background:rgba(255,255,255,0.04); border-radius:2px; overflow:hidden; }
.ant-progress-fill { height:100%; background:linear-gradient(90deg, var(--ochre), var(--sage)); transition:width 0.1s linear; }
.ant-status { font-family:var(--font-mono); font-size:0.55rem; color:var(--sage); }

/* Score Panel (grid-area: score) */
.score-panel { grid-area:score; }
.score-layout { display:grid; grid-template-columns:100px 1fr; gap:14px; align-items:center; }
@media (max-width:480px) { .score-layout { grid-template-columns:1fr; } }
.ring-wrap { position:relative; width:100px; height:100px; }
.ring-wrap svg { width:100%; height:100%; }
.ring-bg { stroke:var(--midnight-border); }
.ring-fg { stroke:var(--ochre); transition:stroke-dashoffset 0.55s ease; transform:rotate(-90deg); transform-origin:50% 50%; }
.score-center { position:absolute; inset:0; display:flex; flex-direction:column; align-items:center; justify-content:center; }
.score-num { font-family:var(--font-display); font-weight:800; font-size:1.6rem; line-height:1; color:#DCE2EA; }
.score-denom { font-family:var(--font-mono); font-size:0.5rem; color:#6A8099; }
.tier-label { text-align:right; }
.tier-label .k { font-size:0.55rem; color:#6A8099; text-transform:uppercase; letter-spacing:0.04em; }
.tier-label .v { font-family:var(--font-display); font-weight:700; font-size:1rem; }
.slider-row { margin-bottom:8px; }
.slider-label { display:flex; justify-content:space-between; font-size:0.65rem; margin-bottom:2px; color:#DCE2EA; }
.slider-label .weight { color:#6A8099; }
.slider-val { font-family:var(--font-mono); font-size:0.7rem; color:var(--sage); }
input[type="range"] { -webkit-appearance:none; width:100%; height:4px; background:var(--midnight-border); border-radius:4px; outline:none; }
input[type="range"]::-webkit-slider-thumb { -webkit-appearance:none; width:12px; height:12px; border-radius:50%; background:var(--ochre); border:2px solid var(--midnight-800); cursor:pointer; }
.priv-list { list-style:none; display:grid; grid-template-columns:1fr 1fr; gap:3px; margin-top:10px; }
.priv-list li { display:flex; align-items:center; gap:5px; font-size:0.65rem; color:#6A8099; }
.priv-dot { width:4px; height:4px; border-radius:50%; background:var(--ochre); flex-shrink:0; }
.score-quote { margin-top:8px; font-size:0.6rem; color:#6A8099; font-style:italic; }

/* Creator Panel (grid-area: creator) */
.creator-panel { grid-area:creator; }
.field { margin-bottom:8px; }
.field label { font-size:0.6rem; color:#6A8099; display:block; margin-bottom:2px; text-transform:uppercase; letter-spacing:0.04em; }
.field input,.field select { width:100%; padding:6px 10px; border-radius:var(--radius-sm); border:1px solid var(--midnight-border); background:var(--midnight-700); font-family:var(--font-body); font-size:0.75rem; outline:none; color:#DCE2EA; }
.field input:focus,.field select:focus { border-color:var(--ochre); }
.field-pair { display:grid; grid-template-columns:1fr 1fr; gap:8px; }
.btn-sage { width:100%; padding:9px; border:none; border-radius:var(--radius-md); background:var(--sage); color:white; font-weight:600; font-family:var(--font-display); font-size:0.8rem; transition:var(--transition); }
.btn-sage:hover { background:var(--sage-dark); }
.pool-output { margin-top:10px; padding:10px; border-radius:var(--radius-md); border:1px solid var(--midnight-border); background:var(--midnight-700); display:none; }
.pool-output.visible { display:block; }
.pool-output-name { font-family:var(--font-display); font-weight:600; font-size:0.8rem; margin-bottom:2px; }
.pool-output-hash { font-family:var(--font-mono); font-size:0.55rem; color:#6A8099; word-break:break-all; margin-bottom:6px; }
.pool-output-stats { display:grid; grid-template-columns:1fr 1fr 1fr; gap:6px; text-align:center; }
.pos { background:var(--midnight-700); border:1px solid var(--midnight-border); border-radius:var(--radius-sm); padding:6px; }
.pos .k { font-size:0.5rem; color:#6A8099; }
.pos .v { font-family:var(--font-mono); font-weight:600; font-size:0.7rem; }

/* Architecture Panel (grid-area: arch) */
.arch-panel { grid-area:arch; }
.arch-layer { border:1px solid var(--midnight-border); border-radius:var(--radius-sm); padding:7px 10px; display:flex; align-items:center; justify-content:space-between; cursor:pointer; transition:var(--transition); background:var(--midnight-700); margin-bottom:4px; }
.arch-layer.active,.arch-layer:hover { border-color:var(--ochre); box-shadow:0 0 0 1px rgba(204,119,34,0.15); }
.arch-layer-left { display:flex; align-items:center; gap:7px; }
.arch-num { width:18px; height:18px; border-radius:4px; display:flex; align-items:center; justify-content:center; font-family:var(--font-mono); font-size:0.55rem; color:white; flex-shrink:0; }
.arch-name { font-size:0.7rem; font-weight:500; }
.arch-meta { font-size:0.55rem; color:#6A8099; font-family:var(--font-mono); }
.arch-desc { padding:8px 10px; border-radius:var(--radius-sm); background:var(--midnight-700); border:1px solid var(--midnight-border); margin-top:4px; min-height:50px; }
.arch-desc-title { font-family:var(--font-display); font-weight:600; font-size:0.75rem; margin-bottom:3px; }
.arch-desc-text { font-size:0.65rem; color:#6A8099; line-height:1.5; }

/* Chat / Assistant Panel (grid-area: chat) */
.chat-panel { grid-area:chat; }
.chat-grid { display:grid; grid-template-columns:200px 1fr; }
@media (max-width:640px) { .chat-grid { grid-template-columns:1fr; } }
.chat-side { border-right:1px solid var(--midnight-border); padding:12px; background:var(--midnight-700); }
.chat-avatar { width:26px; height:26px; border-radius:6px; background:var(--sage); color:white; display:flex; align-items:center; justify-content:center; font-weight:700; font-family:var(--font-display); font-size:0.75rem; margin-bottom:6px; }
.chat-side h3 { font-family:var(--font-display); font-weight:700; font-size:0.75rem; margin-bottom:3px; }
.chat-side p { font-size:0.6rem; color:#6A8099; line-height:1.5; margin-bottom:8px; }
.qbtn-row { display:flex; flex-wrap:wrap; gap:4px; margin-bottom:8px; }
.qbtn { border:1px solid var(--midnight-border); background:var(--midnight-800); border-radius:var(--radius-sm); padding:4px 8px; font-size:0.6rem; font-family:var(--font-body); transition:var(--transition); color:#DCE2EA; }
.qbtn:hover { border-color:var(--sage); }
.chat-main { display:flex; flex-direction:column; padding:10px; height:200px; }
.chat-log { flex:1; overflow-y:auto; display:flex; flex-direction:column; gap:6px; padding-right:4px; }
.chat-log::-webkit-scrollbar { width:3px; }
.chat-log::-webkit-scrollbar-thumb { background:var(--midnight-border); border-radius:2px; }
.chat-bubble { max-width:85%; padding:7px 10px; border-radius:var(--radius-md); font-size:0.68rem; line-height:1.45; }
.chat-bubble.bot { background:var(--midnight-700); align-self:flex-start; color:#DCE2EA; }
.chat-bubble.user { background:var(--sage); color:white; align-self:flex-end; }
.chat-form { display:flex; gap:6px; margin-top:8px; }
.chat-form input { flex:1; padding:6px 10px; border-radius:var(--radius-sm); border:1px solid var(--midnight-border); background:var(--midnight-700); outline:none; font-family:var(--font-body); font-size:0.7rem; color:#DCE2EA; }
.chat-form input:focus { border-color:var(--sage); }
.chat-form button { padding:6px 12px; border-radius:var(--radius-sm); border:none; background:var(--sage); color:white; font-weight:500; font-size:0.7rem; }

/* Stats strip */
.stat-strip { display:flex; gap:1px; background:var(--midnight-border); border-radius:var(--radius-md); overflow:hidden; margin:6px 0; }
.stat-cell { flex:1; background:var(--midnight-800); padding:8px 4px; text-align:center; }
.stat-val { font-family:var(--font-display); font-size:0.95rem; font-weight:700; color:var(--sage); }
.stat-lbl { font-size:0.48rem; color:#6A8099; font-family:var(--font-mono); text-transform:uppercase; }

/* Footer */
.vvu-footer { border-top:1px solid var(--midnight-border); padding:20px 24px; display:flex; justify-content:space-between; flex-wrap:wrap; gap:10px; font-family:var(--font-mono); font-size:0.55rem; color:#6A8099; margin-top:8px; }
      `}</style>

      {/* Ticker */}
      <div className="ticker">
        <div className="ticker-inner">
          <span>UBUNTU POOLS <b>pilot stage</b></span>
          <span>PAYMENT RAIL <b>Stitch · instant EFT</b></span>
          <span>RECEIPTS <b>ED25519 via ProofBridge</b></span>
          <span>POPIA <b>consent-aware design</b></span>
          <span>GOVERNANCE <b>proposals & voting, Supabase-backed</b></span>
          <span>UBUNTU POOLS <b>pilot stage</b></span>
          <span>PAYMENT RAIL <b>Stitch · instant EFT</b></span>
          <span>RECEIPTS <b>ED25519 via ProofBridge</b></span>
          <span>POPIA <b>consent-aware design</b></span>
          <span>GOVERNANCE <b>proposals & voting, Supabase-backed</b></span>
        </div>
      </div>

      {/* Nav */}
      <div style={{display:'flex',justifyContent:'flex-end',padding:'6px 20px',fontFamily:'var(--font-mono)',fontSize:'0.55rem',borderBottom:'1px solid var(--midnight-border)'}}>
        <Link href="/gateway" style={{color:'var(--ochre)',textDecoration:'none',letterSpacing:'0.06em'}}>Gateway OS →</Link>
      </div>

      <div className="wrap">

        {/* Hero */}
        <div className="hero">
          <div>
            <h1>Saving together, <span className="accent">verified</span> on-chain.</h1>
            <p>A ROSCA platform rooted in the stokvel tradition. Every contribution is receipted through ProofBridge; every payout is visible to the group. Interactive demo — no live member data.</p>
          </div>
          <div className="hero-badges">
            <span className="pilot-tag">No live funds processed</span>
            <span className="pilot-tag">Governance — Supabase-backed</span>
          </div>
        </div>

        {/* Stat strip */}
        <div className="stat-strip">
          <div className="stat-cell"><div className="stat-val">Pilot</div><div className="stat-lbl">Status</div></div>
          <div className="stat-cell"><div className="stat-val">5</div><div className="stat-lbl">Score Signals</div></div>
          <div className="stat-cell"><div className="stat-val">5–12</div><div className="stat-lbl">Members</div></div>
          <div className="stat-cell"><div className="stat-val">Stitch</div><div className="stat-lbl">Payment Rail</div></div>
          <div className="stat-cell"><div className="stat-val">POPIA</div><div className="stat-lbl">Compliance</div></div>
        </div>

        {/* Bento Grid */}
        <div className="bento">

          {/* Ant Stack Queue */}
          <div className="panel queue-panel">
            <div className="panel-hdr">
              <span>🐜 Ant Stack Queue Engine</span>
              <span className="ant-status">{status}</span>
            </div>
            <div className="panel-body">
              <div ref={trackRef} className="ant-track">
                <span className="ant-track-start">🍂 STITCH EFT</span>
                <span className="ant-track-end">📂 VAULT</span>
              </div>
              <div className="ant-progress">
                <div className="ant-progress-fill" style={{ width: progress + '%' }} />
              </div>
            </div>
          </div>

          {/* Ubuntu Score Simulator */}
          <div className="panel score-panel" id="score">
            <div className="panel-hdr">
              <span>Ubuntu Score Simulator</span>
              <div style={{ display:'flex', gap:6, alignItems:'center' }}>
                <span className="tier-label"><span className="k" style={{ fontSize:'0.5rem' }}>Tier </span><span className="v" id="auth-level" style={{ fontSize:'0.7rem', color:'#8A9A5B' }}>Steward</span></span>
              </div>
            </div>
            <div className="panel-body">
              <div className="score-layout">
                <div className="ring-wrap">
                  <svg viewBox="0 0 140 140">
                    <circle cx="70" cy="70" r="56" fill="none" className="ring-bg" strokeWidth="11"/>
                    <circle id="score-ring" cx="70" cy="70" r="56" fill="none" className="ring-fg" strokeWidth="11" strokeLinecap="round" strokeDasharray="351.86" strokeDashoffset="105"/>
                  </svg>
                  <div className="score-center">
                    <div id="score-big" className="score-num">68</div>
                    <div className="score-denom">/ 100</div>
                  </div>
                </div>
                <div>
                  <div className="slider-row">
                    <div className="slider-label"><span>Reciprocity <span className="weight">(25%)</span></span><span className="slider-val" id="v-recip">72</span></div>
                    <input id="s-recip" type="range" min="0" max="100" defaultValue={72} />
                  </div>
                  <div className="slider-row">
                    <div className="slider-label"><span>Consistency <span className="weight">(20%)</span></span><span className="slider-val" id="v-cons">68</span></div>
                    <input id="s-cons" type="range" min="0" max="100" defaultValue={68} />
                  </div>
                  <div className="slider-row">
                    <div className="slider-label"><span>Endorsements <span className="weight">(20%)</span></span><span className="slider-val" id="v-end">65</span></div>
                    <input id="s-end" type="range" min="0" max="100" defaultValue={65} />
                  </div>
                  <div className="slider-row">
                    <div className="slider-label"><span>Governance <span className="weight">(20%)</span></span><span className="slider-val" id="v-gov">58</span></div>
                    <input id="s-gov" type="range" min="0" max="100" defaultValue={58} />
                  </div>
                  <div className="slider-row">
                    <div className="slider-label"><span>Resource sharing <span className="weight">(15%)</span></span><span className="slider-val" id="v-share">74</span></div>
                    <input id="s-share" type="range" min="0" max="100" defaultValue={74} />
                  </div>
                </div>
              </div>
              <ul className="priv-list" id="priv-list"></ul>
              <p className="score-quote">“Umuntu ngumuntu ngabantu” — the score grows when the village grows.</p>
            </div>
          </div>

          {/* Pool Creator */}
          <div className="panel creator-panel" id="creator">
            <div className="panel-hdr"><span>Pool Creator</span></div>
            <div className="panel-body">
              <form id="pool-form" onSubmit={(e) => {
                e.preventDefault();
                const form = e.target as HTMLFormElement;
                const name = ((form.querySelector('#p-name') as HTMLInputElement)?.value || 'Ubuntu Village').trim();
                const amt = +((form.querySelector('#p-amt') as HTMLInputElement)?.value || 500);
                const members = +((form.querySelector('#p-members') as HTMLInputElement)?.value || 8);
                const cyc = ((form.querySelector('#p-cycle') as HTMLSelectElement)?.value || 'Monthly');
                const bytes = crypto.getRandomValues(new Uint8Array(10));
                const id = 'preview_' + Array.from(bytes).map(b => b.toString(16).padStart(2,'0')).join('');

                const poName = document.getElementById('po-name'); const poHash = document.getElementById('po-hash');
                const poAmt = document.getElementById('po-amt'); const poPot = document.getElementById('po-pot');
                const poNext = document.getElementById('po-next'); const out = document.getElementById('pool-output');
                if (poName) poName.textContent = name; if (poHash) poHash.textContent = id;
                if (poAmt) poAmt.textContent = 'R' + amt.toLocaleString('en-ZA');
                if (poPot) poPot.textContent = 'R' + (amt * members).toLocaleString('en-ZA');
                if (poNext) poNext.textContent = cyc === 'Weekly' ? '7 days' : '30 days';
                if (out) out.classList.add('visible');
              }}>
                <div className="field">
                  <label htmlFor="p-name">Pool name</label>
                  <input id="p-name" required placeholder="e.g. Gqeberha Builders" />
                </div>
                <div className="field-pair">
                  <div className="field"><label htmlFor="p-amt">Contribution (R)</label><input id="p-amt" type="number" min="100" max="10000" step="50" defaultValue={500} /></div>
                  <div className="field"><label htmlFor="p-members">Members (5–12)</label><input id="p-members" type="number" min="5" max="12" defaultValue={8} /></div>
                </div>
                <div className="field">
                  <label htmlFor="p-cycle">Cycle</label>
                  <select id="p-cycle"><option>Weekly</option><option selected>Monthly</option></select>
                </div>
                <button type="submit" className="btn-sage">Preview pool →</button>
                <p style={{fontSize:'0.55rem',color:'#6A8099',textAlign:'center',marginTop:'6px'}}>Sample receipt ID only · no funds · no on-chain write</p>
              </form>
              <div id="pool-output" className="pool-output">
                <div className="pool-output-name" id="po-name">—</div>
                <div className="pool-output-hash" id="po-hash">—</div>
                <div className="pool-output-stats">
                  <div className="pos"><div className="k">Contribution</div><div className="v" id="po-amt">—</div></div>
                  <div className="pos"><div className="k">Cycle pot</div><div className="v" id="po-pot">—</div></div>
                  <div className="pos"><div className="k">First payout</div><div className="v" id="po-next">—</div></div>
                </div>
              </div>
            </div>
          </div>

          {/* Architecture Map */}
          <div className="panel arch-panel">
            <div className="panel-hdr"><span>Architecture Map</span></div>
            <div className="panel-body">
              {[
                {num:1, name:'Identity', color:'#1A1A1C', meta:'Built', layer:'identity'},
                {num:2, name:'Trust score', color:'#8A9A5B', meta:'Built', layer:'trust'},
                {num:3, name:'Governance', color:'#CC7722', meta:'Built', layer:'governance'},
                {num:4, name:'ROSCA engine', color:'#1A1A1C', meta:'Partial', layer:'rosca'},
                {num:5, name:'Credit', color:'#8A9A5B', meta:'Roadmap', layer:'credit'},
              ].map((item) => (
                <div key={item.layer}
                  className={`arch-layer${activeLayer === item.layer ? ' active' : ''}`}
                  onClick={() => setActiveLayer(item.layer)}>
                  <div className="arch-layer-left">
                    <div className="arch-num" style={{background:item.color}}>{item.num}</div>
                    <div className="arch-name">{item.name}</div>
                  </div>
                  <div className="arch-meta">{item.meta}</div>
                </div>
              ))}
              <div className="arch-desc">
                <div className="arch-desc-title">{layerData[activeLayer]?.t || ''}</div>
                <p className="arch-desc-text">{layerData[activeLayer]?.d || ''}</p>
              </div>
            </div>
          </div>

          {/* LINDIWE Assistant */}
          <div className="panel chat-panel">
            <div className="panel-hdr"><span>LINDIWE — Rule-based Guide</span></div>
            <div className="panel-body" style={{padding:0}}>
              <div className="chat-grid">
                <div className="chat-side">
                  <div className="chat-avatar">L</div>
                  <h3>LINDIWE</h3>
                  <p>Rule-based guide to pool mechanics, the Ubuntu Score, and governance.</p>
                  <div className="qbtn-row">
                    <button className="qbtn" data-q="pool">Pool mechanics</button>
                    <button className="qbtn" data-q="score">Ubuntu Score</button>
                    <button className="qbtn" data-q="gov">Governance</button>
                  </div>
                  <span className="pilot-tag">Rule-based · no live data</span>
                </div>
                <div className="chat-main">
                  <div className="chat-log" id="chat-log">
                    <div className="chat-bubble bot">Molo. I&apos;m LINDIWE, a rule-based guide. I answer questions about pool mechanics, the Ubuntu Score, and governance design. I&apos;m not reading any real account data.</div>
                  </div>
                  <form className="chat-form" onSubmit={(e) => {
                    e.preventDefault();
                    const input = document.getElementById('chat-input') as HTMLInputElement;
                    const t = input?.value?.trim();
                    if (!t) return;
                    input.value = '';
                    const el = document.getElementById('chat-log') as HTMLElement;
                    const responses: Record<string,string> = {
                      pool: 'Pool mechanics: members contribute a fixed amount each cycle. One member receives the full pot per cycle, rotating until everyone has been paid once. The Pool creator panel above lets you preview the numbers for your group.',
                      score: 'The Ubuntu Score is a weighted average: Reciprocity (25%), Consistency (20%), Endorsements (20%), Governance (20%), Resource sharing (15%). Drag the sliders in the simulator to see how each signal moves your tier.',
                      gov: 'Governance is fully wired: proposals, voting, delegations, and quorum run on Supabase-backed tables with row-level security. The GovernanceService API is operational. Create a proposal, cast a vote, or delegate your weight.',
                      default: 'I can answer questions about pool mechanics, the Ubuntu Score, or governance design.'
                    };
                    const addBubble = (text: string, from: string) => {
                      const d = document.createElement('div'); d.className = 'chat-bubble ' + (from === 'user' ? 'user' : 'bot');
                      d.textContent = text; el?.appendChild(d); if (el) el.scrollTop = el.scrollHeight;
                    };
                    addBubble(t, 'user');
                    const k = t.toLowerCase();
                    if (k.includes('pool') || k.includes('rosca')) addBubble(responses.pool, 'bot');
                    else if (k.includes('score') || k.includes('tier')) addBubble(responses.score, 'bot');
                    else if (k.includes('govern') || k.includes('vote')) addBubble(responses.gov, 'bot');
                    else addBubble(responses.default, 'bot');
                  }}>
                    <input id="chat-input" placeholder="Ask about pool mechanics…" autoComplete="off" />
                    <button type="submit">Send</button>
                  </form>
                </div>
              </div>
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="footer-band" style={{margin:'8px 0 0',padding:'14px 18px',borderRadius:'var(--radius-lg)',background:'var(--midnight-800)',border:'1px solid var(--midnight-border)',display:'flex',flexWrap:'wrap',alignItems:'center',justifyContent:'space-between',gap:'12px'}}>
          <div>
            <div style={{fontFamily:'var(--font-display)',fontWeight:700,color:'var(--ochre)',marginBottom:2}}>Built with Ubuntu</div>
            <div style={{fontSize:'0.65rem',color:'#6A8099'}}>Pilot stage · Gqeberha, Eastern Cape · POPIA-aware design</div>
          </div>
          <span style={{fontFamily:'var(--font-mono)',fontSize:'0.55rem',color:'#6A8099'}}>ubuntu-pools@0.9.0-pilot</span>
        </div>

      </div>

      <div className="vvu-footer">
        <span>Ubuntu Pools <strong style={{color:'#DCE2EA'}}>0.9.0-pilot</strong></span>
        <span>Stitch InstantEFT · ProofBridge ED25519</span>
        <span>POPIA Consent-aware</span>
      </div>
    </div>
  );
}

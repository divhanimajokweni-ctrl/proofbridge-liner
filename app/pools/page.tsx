'use client';
import { useEffect, useState, useRef } from 'react';
import Link from 'next/link';

export default function UbuntuPoolsLanding() {
  const [status, setStatus] = useState('INGESTING QUEUES...');
  const [progress, setProgress] = useState(0);
  const trackRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const tasks = ["PARSE_HMAC", "VERIFY_STITCH_EFT", "MUTATE_REPUTATION", "SIGN_ED25519", "ANCHOR_AMOY"];

    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          if (trackRef.current) {
            const ants = trackRef.current.querySelectorAll('.marching-ant');
            ants.forEach(ant => ant.remove());
          }
          return 0;
        }

        const nextProgress = prev + 5;
        const currentTask = tasks[Math.floor(Math.random() * tasks.length)];
        setStatus(`PROCESSING ${currentTask}`);

        if (trackRef.current) {
          const ant = document.createElement('div');
          ant.className = 'marching-ant';
          ant.style.position = 'absolute';
          ant.style.top = '50%';
          ant.style.transform = 'translateY(-50%)';
          ant.style.left = '60px';
          ant.style.fontFamily = '"IBM Plex Mono", monospace';
          ant.style.fontSize = '0.6rem';
          ant.style.color = '#8A9A5B';
          ant.style.whiteSpace = 'nowrap';
          ant.innerHTML = '🐜 <span style="background:rgba(138,154,91,0.15); padding:2px 6px; border-radius:4px; margin-left:4px;">' + currentTask + '</span>';
          trackRef.current.appendChild(ant);

          let currentPos = 60;
          const endPos = trackRef.current.clientWidth - 160;
          const runAnimation = () => {
            currentPos += 6;
            ant.style.left = currentPos + 'px';
            if (currentPos < endPos) {
              requestAnimationFrame(runAnimation);
            } else {
              ant.style.opacity = '0';
              setTimeout(() => ant.remove(), 100);
            }
          };
          requestAnimationFrame(runAnimation);
        }
        return nextProgress;
      });
    }, 900);

    return () => clearInterval(interval);
  }, []);

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
    const circ = 2 * Math.PI * 56;

    function calcScore() {
      const r = +sliders.recip.value, c = +sliders.cons.value,
            e = +sliders.end.value,  g = +sliders.gov.value, s = +sliders.share.value;
      valEls.recip.textContent = ''+r; valEls.cons.textContent = ''+c;
      valEls.end.textContent   = ''+e; valEls.gov.textContent  = ''+g; valEls.share.textContent = ''+s;
      const total = Math.round(r*0.25 + c*0.20 + e*0.20 + g*0.20 + s*0.15);
      scoreBig.textContent = ''+total;
      ring.style.strokeDashoffset = '' + (circ * (1 - total / 100));

      let level: string, color: string;
      if (total < 20)       { level = 'Novice';      color = '#8B7355'; }
      else if (total < 40)  { level = 'Contributor'; color = 'var(--sage)'; }
      else if (total < 60)  { level = 'Steward';     color = 'var(--sage)'; }
      else if (total < 80)  { level = 'Guardian';    color = 'var(--ochre)'; }
      else                  { level = 'Archivist';   color = 'var(--ochre)'; }
      authLevel.textContent = level;
      authLevel.style.color = color;

      const privs = [
        { min:0,  t:'Join pools up to R2,000' },
        { min:20, t:'Create pools up to R5,000' },
        { min:40, t:'Verified pool creation' },
        { min:40, t:'Governance weight 1.5\u00d7' },
        { min:60, t:'Dispute arbitration' },
        { min:80, t:'Protocol upgrade proposals' }
      ];
      privList.innerHTML = privs
        .filter(p => total >= p.min)
        .map(p => '<li><span class="priv-dot"></span>' + p.t + '</li>')
        .join('');
    }

    keys.forEach(k => {
      sliders[k].addEventListener('input', calcScore);
    });
    calcScore();

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
        function addBubble(t: string, from: string) {
          const d = document.createElement('div');
          d.className = 'chat-bubble ' + (from === 'user' ? 'user' : 'bot');
          d.textContent = t;
          el.appendChild(d);
          el.scrollTop = el.scrollHeight;
        }
        if (key && responses[key]) {
          addBubble(text, 'user');
          addBubble(responses[key], 'bot');
        }
      });
    });
  }, []);

  return (
    <div className="pools-page">
      <style>{`
.pools-page {
  --sage:#8A9A5B; --sage-light:#B8C98A; --sage-dark:#5C6B38;
  --ochre:#CC7722; --ochre-dim:rgba(204,119,34,0.6);
  --charcoal:#1E1E1C; --stone:#E2E3DB;
  --gravel:#5A5A55; --warm-white:#FAFAF7; --paper:#F4F5F0;
  --light-bg:#FAFAF7; --light-panel:#FFFFFF; --light-panel-raised:#FCF8F1;
  --light-border:#E5DDCF;
  --light-text-primary:#1E1E1C; --light-text-secondary:rgba(30,30,28,0.62); --light-text-muted:rgba(30,30,28,0.40);
  --status-live:#4A8B5C;
  --font-display:'Syne',system-ui,sans-serif;
  --font-mono:'IBM Plex Mono',monospace;
  --font-body:'DM Sans',system-ui,sans-serif;
  --radius-sm:8px; --radius-md:12px; --radius-lg:20px; --radius-pill:40px;
  --ease:cubic-bezier(0.4,0,0.2,1); --transition:0.2s var(--ease);
}
@media (prefers-reduced-motion:reduce) {
  .pools-page *, .pools-page *::before, .pools-page *::after { animation-duration:0.01ms !important; transition-duration:0.01ms !important; }
}
.pools-page *, .pools-page *::before, .pools-page *::after { box-sizing:border-box; margin:0; padding:0; }
.pools-page { background:var(--light-bg); color:var(--light-text-primary); font-family:var(--font-body); }
.pools-page a { color:inherit; text-decoration:none; }
.pools-page button { font:inherit; cursor:pointer; }
.pools-page :focus-visible { outline:2px solid var(--ochre); outline-offset:2px; }
.pools-page ::selection { background:var(--ochre); color:white; }

.wrap { max-width:1280px; margin:0 auto; padding:0 32px; }

.pilot-tag {
  display:inline-flex; align-items:center; gap:5px;
  font-family:var(--font-mono); font-size:9px; letter-spacing:0.08em; text-transform:uppercase;
  color:var(--ochre); border:1px solid var(--ochre-dim); background:rgba(204,119,34,0.08);
  padding:2px 8px; border-radius:var(--radius-pill); white-space:nowrap;
}
.pilot-tag::before { content:''; width:5px; height:5px; border-radius:50%; background:var(--ochre); }

.ticker { background:var(--charcoal); border-bottom:2px solid var(--ochre); padding:7px 0; overflow:hidden; }
.ticker-inner { display:flex; gap:40px; white-space:nowrap; width:max-content; animation:tickerScroll 52s linear infinite; font-family:var(--font-mono); font-size:10px; color:rgba(255,255,255,0.45); }
.ticker-inner b { color:rgba(255,255,255,0.8); font-weight:500; }
@keyframes tickerScroll { from{transform:translateX(0)} to{transform:translateX(-50%)} }

.vvu-nav { display:flex; align-items:center; justify-content:space-between; padding:16px 32px; border-bottom:1px solid var(--light-border); position:relative; z-index:10; flex-wrap:wrap; gap:14px; background:rgba(250,250,247,0.92); backdrop-filter:blur(14px); }
.vvu-logo { display:flex; align-items:center; gap:11px; }
.vvu-logo-mark { width:32px; height:32px; flex-shrink:0; }
.vvu-logo-text h1 { font-family:var(--font-display); font-size:0.92rem; font-weight:800; letter-spacing:-0.01em; line-height:1.15; }
.vvu-logo-text p { font-family:var(--font-mono); font-size:0.57rem; color:var(--sage); letter-spacing:0.14em; text-transform:uppercase; }
.vvu-nav-links { display:flex; gap:26px; list-style:none; align-items:center; }
.vvu-nav-links a { font-family:var(--font-mono); font-size:0.64rem; color:var(--light-text-secondary); letter-spacing:0.05em; transition:var(--transition); }
.vvu-nav-links a:hover { color:var(--ochre); }
@media (max-width:860px) { .vvu-nav-links { display:none; } }

.intro { padding:36px 0 26px; }
.intro h1 { font-family:var(--font-display); font-weight:800; font-size:clamp(1.7rem,3.8vw,2.5rem); letter-spacing:-0.02em; line-height:1.08; margin-bottom:10px; }
.intro h1 .accent { color:var(--sage); }
.intro p { font-size:0.92rem; color:var(--light-text-secondary); max-width:640px; line-height:1.65; margin-bottom:14px; }
.intro-badges { display:flex; gap:10px; flex-wrap:wrap; }

/* Ant Stack Queue Engine */
.ant-queue-section { margin:0 0 28px; }
.ant-queue-card { background:var(--charcoal); border-radius:var(--radius-lg); padding:20px 22px; color:rgba(255,255,255,0.88); }
.ant-queue-header { display:flex; justify-content:space-between; font-family:var(--font-mono); font-size:0.6rem; color:var(--sage); text-transform:uppercase; margin-bottom:10px; letter-spacing:0.06em; }
.ant-queue-header .ant-status { color:var(--ochre); }
.ant-track { height:64px; background:#0C0C0A; border-radius:var(--radius-sm); border:1px dashed rgba(255,255,255,0.08); position:relative; overflow:hidden; margin-bottom:10px; }
.ant-track-start { position:absolute; left:12px; top:50%; transform:translateY(-50%); font-family:var(--font-mono); font-size:0.6rem; color:var(--ochre); background:#1A1A17; padding:2px 6px; border-radius:4px; z-index:10; }
.ant-track-end { position:absolute; right:12px; top:50%; transform:translateY(-50%); font-family:var(--font-mono); font-size:0.6rem; color:var(--sage); background:#1A1A17; padding:2px 6px; border-radius:4px; z-index:10; }
.ant-progress { height:3px; background:rgba(255,255,255,0.05); border-radius:2px; overflow:hidden; }
.ant-progress-fill { height:100%; background:linear-gradient(90deg, var(--ochre), var(--sage)); transition:width 0.1s linear; }

.pg { display:grid; grid-template-columns:5fr 7fr; gap:20px; padding-bottom:52px; }
.right-col { display:grid; grid-template-columns:1fr 1fr; gap:20px; align-content:start; }
.full-row { grid-column:1/-1; }

.card { background:var(--light-panel); border:1px solid var(--light-border); border-radius:var(--radius-lg); padding:24px; box-shadow:0 1px 0 rgba(13,13,13,0.04),0 8px 24px rgba(13,13,13,0.04); }
.card-title { font-family:var(--font-display); font-weight:700; font-size:1.12rem; margin-bottom:4px; }
.card-sub { font-size:0.76rem; color:var(--light-text-secondary); margin-bottom:18px; }

.score-header { display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:20px; }
.score-tier-label { text-align:right; }
.score-tier-label .k { font-size:0.65rem; color:var(--light-text-muted); text-transform:uppercase; letter-spacing:0.05em; }
.score-tier-label .v { font-family:var(--font-display); font-weight:700; color:var(--sage); }
.score-layout { display:grid; grid-template-columns:124px 1fr; gap:22px; align-items:center; }
.score-ring-wrap { position:relative; width:124px; height:124px; }
.score-ring-wrap svg { width:100%; height:100%; }
.ring-bg { stroke:#EDE7DC; }
.ring-fg { stroke:var(--ochre); transition:stroke-dashoffset 0.55s var(--ease); transform:rotate(-90deg); transform-origin:50% 50%; }
.score-center { position:absolute; inset:0; display:flex; flex-direction:column; align-items:center; justify-content:center; }
.score-num { font-family:var(--font-display); font-weight:800; font-size:2rem; line-height:1; }
.score-denom { font-family:var(--font-mono); font-size:0.6rem; color:var(--light-text-muted); }

.slider-row { margin-bottom:12px; }
.slider-label { display:flex; justify-content:space-between; font-size:0.76rem; margin-bottom:3px; }
.slider-label .weight { color:var(--light-text-muted); }
.slider-val { font-family:var(--font-mono); }
input[type="range"] { -webkit-appearance:none; width:100%; height:5px; background:#EDE7DC; border-radius:6px; outline:none; }
input[type="range"]::-webkit-slider-thumb { -webkit-appearance:none; width:15px; height:15px; border-radius:50%; background:var(--ochre); border:2px solid var(--charcoal); cursor:pointer; }
input[type="range"]::-moz-range-thumb { width:15px; height:15px; border-radius:50%; background:var(--ochre); border:2px solid var(--charcoal); cursor:pointer; }

.priv-list { list-style:none; display:grid; grid-template-columns:1fr 1fr; gap:5px; margin-top:14px; }
.priv-list li { display:flex; align-items:center; gap:7px; font-size:0.75rem; color:var(--light-text-secondary); }
.priv-dot { width:5px; height:5px; border-radius:50%; background:var(--ochre); flex-shrink:0; }
.score-quote { margin-top:14px; font-size:0.72rem; color:var(--light-text-muted); font-style:italic; }

.field { margin-bottom:12px; }
.field label { font-size:0.72rem; color:var(--light-text-secondary); display:block; margin-bottom:4px; }
.field input,.field select { width:100%; padding:9px 12px; border-radius:var(--radius-sm); border:1px solid var(--light-border); background:var(--light-panel-raised); font-family:var(--font-body); font-size:0.83rem; outline:none; color:var(--light-text-primary); }
.field input:focus,.field select:focus { border-color:var(--ochre); }
.field-pair { display:grid; grid-template-columns:1fr 1fr; gap:10px; }
.btn-sage { width:100%; padding:11px; border:none; border-radius:var(--radius-md); background:var(--sage); color:white; font-weight:600; font-family:var(--font-display); font-size:0.88rem; transition:var(--transition); }
.btn-sage:hover { background:var(--sage-dark); }
.pool-output { margin-top:14px; padding:14px; border-radius:var(--radius-md); border:1px solid var(--light-border); background:var(--light-panel-raised); display:none; }
.pool-output.visible { display:block; }
.pool-output-head { display:flex; justify-content:space-between; align-items:center; margin-bottom:8px; }
.pool-output-name { font-family:var(--font-display); font-weight:700; font-size:0.92rem; }
.pool-output-hash { font-family:var(--font-mono); font-size:0.62rem; color:var(--light-text-muted); word-break:break-all; margin-bottom:10px; }
.pool-output-stats { display:grid; grid-template-columns:1fr 1fr 1fr; gap:8px; text-align:center; }
.pos { background:var(--light-panel); border:1px solid var(--light-border); border-radius:var(--radius-sm); padding:8px 6px; }
.pos .k { font-size:0.62rem; color:var(--light-text-muted); }
.pos .v { font-family:var(--font-mono); font-weight:600; font-size:0.82rem; }

.arch-stack { display:flex; flex-direction:column; gap:6px; margin-bottom:12px; }
.arch-layer { border:1px solid var(--light-border); border-radius:var(--radius-md); padding:10px 13px; display:flex; align-items:center; justify-content:space-between; cursor:pointer; transition:var(--transition); background:var(--light-panel-raised); }
.arch-layer.active,.arch-layer:hover { border-color:var(--ochre); background:var(--light-panel); box-shadow:0 0 0 2px rgba(204,119,34,0.1); }
.arch-layer-left { display:flex; align-items:center; gap:9px; }
.arch-num { width:22px; height:22px; border-radius:6px; display:flex; align-items:center; justify-content:center; font-family:var(--font-mono); font-size:0.66rem; color:white; flex-shrink:0; }
.arch-name { font-size:0.82rem; font-weight:500; }
.arch-meta { font-size:0.65rem; color:var(--light-text-muted); font-family:var(--font-mono); }
.arch-desc { padding:13px; border-radius:var(--radius-md); background:var(--light-panel-raised); border:1px solid var(--light-border); min-height:76px; }
.arch-desc-title { font-family:var(--font-display); font-weight:600; font-size:0.9rem; margin-bottom:4px; }
.arch-desc-text { font-size:0.77rem; color:var(--light-text-secondary); line-height:1.55; }

.assistant-card { display:grid; grid-template-columns:260px 1fr; padding:0; overflow:hidden; }
.assistant-side { border-right:1px solid var(--light-border); padding:22px; background:var(--light-panel-raised); }
.assistant-avatar { width:32px; height:32px; border-radius:9px; background:var(--sage); color:white; display:flex; align-items:center; justify-content:center; font-weight:700; font-family:var(--font-display); font-size:0.9rem; margin-bottom:10px; }
.assistant-side h3 { font-family:var(--font-display); font-weight:700; font-size:0.9rem; margin-bottom:6px; }
.assistant-side p { font-size:0.75rem; color:var(--light-text-secondary); line-height:1.55; margin-bottom:14px; }
.qbtn-row { display:flex; flex-wrap:wrap; gap:6px; margin-bottom:14px; }
.qbtn { border:1px solid var(--light-border); background:var(--light-panel); border-radius:var(--radius-sm); padding:6px 10px; font-size:0.7rem; font-family:var(--font-body); transition:var(--transition); color:var(--light-text-primary); }
.qbtn:hover { border-color:var(--sage); }
.assistant-chat { display:flex; flex-direction:column; padding:22px; height:300px; }
.chat-log { flex:1; overflow-y:auto; display:flex; flex-direction:column; gap:9px; padding-right:4px; }
.chat-log::-webkit-scrollbar { width:4px; }
.chat-log::-webkit-scrollbar-thumb { background:var(--light-border); border-radius:2px; }
.chat-bubble { max-width:85%; padding:10px 13px; border-radius:var(--radius-md); font-size:0.8rem; line-height:1.52; }
.chat-bubble.bot { background:var(--light-panel-raised); align-self:flex-start; }
.chat-bubble.user { background:var(--sage); color:white; align-self:flex-end; }
.chat-form { display:flex; gap:8px; margin-top:12px; }
.chat-form input { flex:1; padding:9px 13px; border-radius:var(--radius-md); border:1px solid var(--light-border); outline:none; font-family:var(--font-body); font-size:0.82rem; }
.chat-form input:focus { border-color:var(--sage); }
.chat-form button { padding:9px 16px; border-radius:var(--radius-md); border:none; background:var(--sage); color:white; font-weight:500; }

.footer-band { margin:4px 0 36px; padding:20px 24px; border-radius:var(--radius-lg); background:var(--charcoal); color:rgba(255,255,255,0.88); display:flex; flex-wrap:wrap; align-items:center; justify-content:space-between; gap:16px; }
.footer-band .fb-title { font-family:var(--font-display); font-weight:700; color:var(--ochre); margin-bottom:2px; }
.footer-band .fb-sub { font-size:0.76rem; color:rgba(255,255,255,0.55); }
.footer-band .fb-badge { font-family:var(--font-mono); font-size:0.65rem; color:rgba(255,255,255,0.4); }

.vvu-footer { border-top:1px solid var(--light-border); padding:32px 32px 28px; display:flex; justify-content:space-between; flex-wrap:wrap; gap:16px; font-family:var(--font-mono); font-size:0.64rem; color:var(--light-text-muted); }
.vvu-footer em { color:var(--sage); font-style:italic; }

@media (max-width:960px) {
  .pg { grid-template-columns:1fr; }
  .right-col { grid-template-columns:1fr; }
  .score-layout { grid-template-columns:1fr; justify-items:center; }
  .assistant-card { grid-template-columns:1fr; }
  .assistant-side { border-right:none; border-bottom:1px solid var(--light-border); }
}
@media (max-width:560px) {
  .priv-list { grid-template-columns:1fr; }
  .pool-output-stats { grid-template-columns:1fr; }
  .wrap { padding:0 18px; }
}
      `}</style>

      <div className="ticker">
        <div className="ticker-inner">
          <span>UBUNTU POOLS <b>pilot stage</b></span>
          <span>PAYMENT RAIL <b>Stitch &middot; instant EFT</b></span>
          <span>RECEIPTS <b>ED25519 via ProofBridge</b></span>
          <span>POPIA <b>consent-aware design</b></span>
          <span>GOVERNANCE <b>proposals & voting, Supabase-backed</b></span>
          <span>UBUNTU POOLS <b>pilot stage</b></span>
          <span>PAYMENT RAIL <b>Stitch &middot; instant EFT</b></span>
          <span>RECEIPTS <b>ED25519 via ProofBridge</b></span>
          <span>POPIA <b>consent-aware design</b></span>
          <span>GOVERNANCE <b>proposals & voting, Supabase-backed</b></span>
        </div>
      </div>

      <nav className="vvu-nav">
        <Link href="/" className="vvu-logo">
          <svg className="vvu-logo-mark" viewBox="0 0 100 100" fill="none" aria-hidden="true">
            <circle cx="35" cy="40" r="16" stroke="#8A9A5B" strokeWidth="5"/>
            <circle cx="65" cy="40" r="16" stroke="#CC7722" strokeWidth="5"/>
            <circle cx="50" cy="64" r="16" stroke="#2F2F2F" strokeWidth="5"/>
          </svg>
          <div className="vvu-logo-text"><h1>UBUNTU POOLS</h1><p>Village savings OS</p></div>
        </Link>
        <ul className="vvu-nav-links">
          <li><a href="#score">Ubuntu Score</a></li>
          <li><a href="#creator">Create pool</a></li>
          <li><Link href="/proofbridge">ProofBridge</Link></li>
        </ul>
        <span className="pilot-tag">Pilot demo</span>
      </nav>

      <main className="wrap">

        <div className="intro">
          <h1>Saving together, <span className="accent">verified</span> on-chain.</h1>
          <p>A ROSCA platform rooted in the stokvel tradition. Every contribution is receipted through ProofBridge; every payout is visible to the group. The score simulator, pool creator, and architecture map below compute real values from your input. No live member data is shown — this is an interactive pilot demo.</p>
          <div className="intro-badges">
            <span className="pilot-tag">No live funds processed here</span>
            <span className="pilot-tag">Governance &mdash; proposals & voting, Supabase-backed</span>
          </div>
        </div>

        <div className="ant-queue-section">
          <div className="ant-queue-card">
            <div className="ant-queue-header">
              <span>🐜 Ant Stack Queue Engine (SIMULATED)</span>
              <span className="ant-status">{status}</span>
            </div>
            <div ref={trackRef} className="ant-track">
              <span className="ant-track-start">🍂 STITCH EFT</span>
              <span className="ant-track-end">📂 VAULT</span>
            </div>
            <div className="ant-progress">
              <div className="ant-progress-fill" style={{width: progress + '%'}} />
            </div>
          </div>
        </div>

        <div className="pg">

          <section className="card" id="score">
            <div className="score-header">
              <div>
                <div className="card-title">Ubuntu Score simulator</div>
                <div className="card-sub">Drag any signal to see how the weighted score responds.</div>
              </div>
              <div className="score-tier-label">
                <div className="k">Tier</div>
                <div className="v" id="auth-level">Steward</div>
              </div>
            </div>

            <div className="score-layout">
              <div className="score-ring-wrap">
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
                  <input id="s-recip" type="range" min="0" max="100" defaultValue={72} aria-label="Reciprocity" />
                </div>
                <div className="slider-row">
                  <div className="slider-label"><span>Consistency <span className="weight">(20%)</span></span><span className="slider-val" id="v-cons">68</span></div>
                  <input id="s-cons" type="range" min="0" max="100" defaultValue={68} aria-label="Consistency" />
                </div>
                <div className="slider-row">
                  <div className="slider-label"><span>Endorsements <span className="weight">(20%)</span></span><span className="slider-val" id="v-end">65</span></div>
                  <input id="s-end" type="range" min="0" max="100" defaultValue={65} aria-label="Endorsements" />
                </div>
                <div className="slider-row">
                  <div className="slider-label"><span>Governance <span className="weight">(20%)</span></span><span className="slider-val" id="v-gov">58</span></div>
                  <input id="s-gov" type="range" min="0" max="100" defaultValue={58} aria-label="Governance" />
                </div>
                <div className="slider-row">
                  <div className="slider-label"><span>Resource sharing <span className="weight">(15%)</span></span><span className="slider-val" id="v-share">74</span></div>
                  <input id="s-share" type="range" min="0" max="100" defaultValue={74} aria-label="Resource sharing" />
                </div>
              </div>
            </div>

            <ul className="priv-list" id="priv-list"></ul>
            <p className="score-quote">&ldquo;Umuntu ngumuntu ngabantu&rdquo; &mdash; the score grows when the village grows.</p>
          </section>

          <div className="right-col">

            <section className="card" id="creator">
              <div className="card-title">Pool creator</div>
              <div className="card-sub">Preview a pool configuration. Generates a sample ID &mdash; no funds move, no on-chain write.</div>
              <form id="pool-form" onSubmit={(e) => {
                e.preventDefault();
                const form = e.target as HTMLFormElement;
                const name = (form.querySelector('#p-name') as HTMLInputElement).value.trim() || 'Ubuntu Village';
                const amt = +(form.querySelector('#p-amt') as HTMLInputElement).value;
                const members = +(form.querySelector('#p-members') as HTMLInputElement).value;
                const cyc = (form.querySelector('#p-cycle') as HTMLSelectElement).value;
                const bytes = crypto.getRandomValues(new Uint8Array(10));
                const id = 'preview_' + Array.from(bytes).map(b => b.toString(16).padStart(2,'0')).join('');
                (document.getElementById('po-name') as HTMLElement).textContent = name;
                (document.getElementById('po-hash') as HTMLElement).textContent = id;
                (document.getElementById('po-amt') as HTMLElement).textContent = 'R' + amt.toLocaleString('en-ZA');
                (document.getElementById('po-pot') as HTMLElement).textContent = 'R' + (amt * members).toLocaleString('en-ZA');
                (document.getElementById('po-next') as HTMLElement).textContent = cyc === 'Weekly' ? '7 days' : '30 days';
                const out = document.getElementById('pool-output') as HTMLElement;
                out.classList.add('visible');
                out.scrollIntoView({ behavior:'smooth', block:'nearest' });
              }}>
                <div className="field">
                  <label htmlFor="p-name">Pool name</label>
                  <input id="p-name" required placeholder="e.g. Gqeberha Builders" />
                </div>
                <div className="field-pair">
                  <div className="field"><label htmlFor="p-amt">Contribution (R)</label><input id="p-amt" type="number" min="100" max="10000" step="50" defaultValue={500} /></div>
                  <div className="field"><label htmlFor="p-members">Members (5&ndash;12)</label><input id="p-members" type="number" min="5" max="12" defaultValue={8} /></div>
                </div>
                <div className="field">
                  <label htmlFor="p-cycle">Cycle</label>
                  <select id="p-cycle"><option>Weekly</option><option selected>Monthly</option></select>
                </div>
                <button type="submit" className="btn-sage">Preview pool &rarr;</button>
                <p style={{fontSize:'0.65rem',color:'var(--light-text-muted)',textAlign:'center',marginTop:'8px'}}>
                  Sample receipt ID only &middot; no funds &middot; no on-chain write
                </p>
              </form>
              <div id="pool-output" className="pool-output">
                <div className="pool-output-head">
                  <span className="pool-output-name" id="po-name">&mdash;</span>
                  <span className="pilot-tag">Preview</span>
                </div>
                <div className="pool-output-hash" id="po-hash">&mdash;</div>
                <div className="pool-output-stats">
                  <div className="pos"><div className="k">Contribution</div><div className="v" id="po-amt">&mdash;</div></div>
                  <div className="pos"><div className="k">Cycle pot</div><div className="v" id="po-pot">&mdash;</div></div>
                  <div className="pos"><div className="k">First payout</div><div className="v" id="po-next">&mdash;</div></div>
                </div>
              </div>
            </section>

            <section className="card">
              <div className="card-title">Architecture map</div>
              <div className="card-sub">Click a layer to see what is built and what is still on the roadmap.</div>
              <div className="arch-stack" id="arch-stack">
                {[
                  {num:1, name:'Identity', color:'var(--charcoal)', meta:'Built', layer:'identity'},
                  {num:2, name:'Trust score', color:'var(--sage)', meta:'Built', layer:'trust'},
                  {num:3, name:'Governance', color:'var(--ochre)', meta:'Built', layer:'governance'},
                  {num:4, name:'ROSCA engine', color:'var(--charcoal)', meta:'Partial', layer:'rosca'},
                  {num:5, name:'Credit', color:'var(--sage)', meta:'Roadmap', layer:'credit'},
                ].map((item) => (
                  <div className={'arch-layer' + (item.layer === 'identity' ? ' active' : '')} data-layer={item.layer} key={item.layer}
                    onClick={(e) => {
                      document.querySelectorAll('.arch-layer').forEach(x => x.classList.remove('active'));
                      (e.currentTarget as HTMLElement).classList.add('active');
                      const layerData: Record<string,{t:string,d:string}> = {
                        identity:   {t:'Identity &mdash; Supabase auth', d:'Magic-link sign-in, PKCE callback, middleware loop protection, and RLS policies are all built and tested (Gate A, complete). W3C DID-based identity is a post-pilot roadmap item.'},
                        trust:      {t:'Trust &mdash; Ubuntu Score', d:'Five weighted signals as shown in the simulator. Scoring logic is implemented client-side here; server-side persistence is a Sprint 2 item.'},
                        governance: {t:'Governance &mdash; proposals & votes', d:'Proposal lifecycle is fully wired. GovernanceService connects proposals, voting, and delegations to Supabase-backed tables with row-level security. Quorum is configurable per proposal.'},
                        rosca:      {t:'ROSCA engine &mdash; contributions', d:'Stitch webhook integration is wired for contributions. Payout automation and dispute rails are partially built. Stitch webhook HMAC verification is a Sprint 2 item.'},
                        credit:     {t:'Credit &mdash; roadmap', d:'No credit mechanism is implemented. This layer becomes relevant after Ubuntu Pools proves one full ROSCA cycle with real funds.'}
                      };
                      const ld = layerData[item.layer];
                      (document.getElementById('ad-title') as HTMLElement).innerHTML = ld.t;
                      (document.getElementById('ad-text') as HTMLElement).innerHTML = ld.d;
                    }}>
                    <div className="arch-layer-left">
                      <div className="arch-num" style={{background:item.color}}>{item.num}</div>
                      <div className="arch-name">{item.name}</div>
                    </div>
                    <div className="arch-meta">{item.meta}</div>
                  </div>
                ))}
              </div>
              <div className="arch-desc">
                <div className="arch-desc-title" id="ad-title">Identity &mdash; Supabase auth</div>
                <p className="arch-desc-text" id="ad-text">Magic-link sign-in, PKCE callback, middleware loop protection, and RLS policies are all built and tested (Gate A, complete). W3C DID-based identity is a post-pilot roadmap item.</p>
              </div>
            </section>

            <section className="card full-row assistant-card">
              <div className="assistant-side">
                <div className="assistant-avatar">L</div>
                <h3>LINDIWE</h3>
                <p>Rule-based guide to pool mechanics, the Ubuntu Score, and governance. Not connected to live account data &mdash; this is a pilot-stage assistant with fixed responses.</p>
                <div className="qbtn-row">
                  <button className="qbtn" data-q="pool">Pool mechanics</button>
                  <button className="qbtn" data-q="score">Ubuntu Score</button>
                  <button className="qbtn" data-q="gov">Governance</button>
                </div>
                <span className="pilot-tag">Rule-based &middot; no live data</span>
              </div>
              <div className="assistant-chat">
                <div className="chat-log" id="chat-log">
                  <div className="chat-bubble bot">Molo. I&rsquo;m LINDIWE, a rule-based guide for this pilot. I answer questions about pool mechanics, the Ubuntu Score, and governance design. I&rsquo;m not reading any real account data.</div>
                </div>
                <form className="chat-form" id="chat-form" onSubmit={(e) => {
                  e.preventDefault();
                  const input = document.getElementById('chat-input') as HTMLInputElement;
                  const t = input.value.trim();
                  if (!t) return;
                  input.value = '';
                  const el = document.getElementById('chat-log') as HTMLElement;
                  const responses: Record<string,string> = {
                    pool: 'Pool mechanics: members contribute a fixed amount each cycle. One member receives the full pot per cycle, rotating until everyone has been paid once. The Pool creator panel above lets you preview the numbers for your group.',
                    score: 'The Ubuntu Score is a weighted average: Reciprocity (25%), Consistency (20%), Endorsements (20%), Governance (20%), Resource sharing (15%). Drag the sliders in the simulator to see how each signal moves your tier.',
                    gov: 'Governance is fully wired: proposals, voting, delegations, and quorum run on Supabase-backed tables with row-level security. The GovernanceService API is operational. Create a proposal, cast a vote, or delegate your weight.',
                    default: 'I can answer questions about pool mechanics, the Ubuntu Score, or governance design. I\u2019m a fixed rule-based guide for this pilot \u2014 not a live model reading your account data.'
                  };
                  const addBubble = (text: string, from: string) => {
                    const d = document.createElement('div');
                    d.className = 'chat-bubble ' + (from === 'user' ? 'user' : 'bot');
                    d.textContent = text;
                    el.appendChild(d);
                    el.scrollTop = el.scrollHeight;
                  };
                  addBubble(t, 'user');
                  const k = t.toLowerCase();
                  if (k.includes('pool') || k.includes('rosca')) addBubble(responses.pool, 'bot');
                  else if (k.includes('score') || k.includes('tier')) addBubble(responses.score, 'bot');
                  else if (k.includes('govern') || k.includes('vote')) addBubble(responses.gov, 'bot');
                  else addBubble(responses.default, 'bot');
                }}>
                  <input id="chat-input" placeholder="Ask about pool mechanics&hellip;" autoComplete="off" />
                  <button type="submit">Send</button>
                </form>
              </div>
            </section>

          </div>
        </div>

        <div className="footer-band">
          <div>
            <div className="fb-title">Built with Ubuntu</div>
            <div className="fb-sub">Pilot stage &middot; Gqeberha, Eastern Cape &middot; POPIA-aware design</div>
          </div>
          <span className="fb-badge">ubuntu-pools@0.9.0-pilot</span>
        </div>

      </main>

      <footer className="vvu-footer">
        <div>Ubuntu Pools &middot; a Vaguely Vanity LLC (CIPC 2026/259053/07) product &middot; Gqeberha, Eastern Cape, South Africa</div>
        <div>&copy; 2026 Vaguely Vanity LLC &middot; <em>&ldquo;Umuntu ngumuntu ngabantu&rdquo;</em></div>
      </footer>
    </div>
  );
}

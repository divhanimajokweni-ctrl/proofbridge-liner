'use client';
import { useEffect, useRef, useState, useCallback } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sword,
  Code2,
  Wallet,
  MessageCircle,
  Trophy,
  Swords,
  Zap,
  Users,
  Shield,
  Crosshair,
  Menu,
  X,
  Home,
} from 'lucide-react';
import { ArenaTicker, type BountyData } from '../../src/components/ArenaTicker';
import { GameHUD, type GameMode, type HUDStats } from '../../src/components/GameHUD';
import { VillageFeed } from '../../src/components/VillageFeed';
import { TreasuryPanel } from '../../src/components/TreasuryPanel';
import { SocialMesh } from '../../src/components/SocialMesh';
import type { FeedItem } from '../../src/engine/NexusIntegrator';

/* ──────────────────────────────────────────────────────────────────────────
   ProofBridge-Liner · The Village Nexus
   ──────────────────────────────────────────────────────────────────────────
   A privacy-first Digital Headquarters with four districts:
     DOCK  — App launcher (Arena, Editor, Bank, Studio)
     FEED  — TikTok-style "Scroll of Truth" (discovery & entertainment)
     SOCIAL— Unified chat (Discord/Twitter/Matrix/Twitch)
     BANK  — Treasury (fiat, crypto, REP → USD valuation)

   Modes:
     VILLAGE — Social discovery mode (default)
     ARENA   — Editor + bounty gameplay mode
   ────────────────────────────────────────────────────────────────────────── */

type NexusMode = 'VILLAGE' | 'ARENA';

// ─── Dock Icon ─────
function DockIcon({
  icon,
  label,
  active,
  onClick,
  badge,
}: {
  icon: React.ReactNode;
  label: string;
  active?: boolean;
  onClick?: () => void;
  badge?: string | number;
}) {
  return (
    <motion.button
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.9 }}
      onClick={onClick}
      title={label}
      style={{
        width: 40,
        height: 40,
        borderRadius: 12,
        border: `1px solid ${active ? 'rgba(245,158,11,0.4)' : 'rgba(255,255,255,0.06)'}`,
        background: active ? 'rgba(245,158,11,0.1)' : 'rgba(15,15,17,0.6)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: active ? '#F59E0B' : '#6A8099',
        cursor: 'pointer',
        position: 'relative',
        transition: 'all 0.2s ease',
        backdropFilter: 'blur(8px)',
      }}
      onMouseEnter={e => { if (!active) { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.15)'; e.currentTarget.style.color = '#D1D5DB'; }}}
      onMouseLeave={e => { if (!active) { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)'; e.currentTarget.style.color = '#6A8099'; }}}
    >
      {icon}
      {badge !== undefined && (
        <span style={{
          position: 'absolute', top: -4, right: -4,
          width: 14, height: 14, borderRadius: '50%',
          background: '#EF4444', color: '#FFF',
          fontSize: 8, fontWeight: 700,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          {badge}
        </span>
      )}
    </motion.button>
  );
}

// ─── Main Dashboard ─────────────────────────────────────────────

export default function ProofBridgeLanding() {
  // ── Mode ──
  const [mode, setMode] = useState<NexusMode>('VILLAGE');
  const [selectedBounty, setSelectedBounty] = useState<BountyData | null>(null);
  const [activeDock, setActiveDock] = useState<string>('village');

  // ── Arena State ──
  const [gameMode, setGameMode] = useState<GameMode>('SIEGE');
  const [hudStats, setHUDStats] = useState<HUDStats>({
    stake: 500, timeLeft: 14 * 3600,
    lines: 68, linesOriginal: 68, diff: 0,
    solved: 47, total: 200,
    repScore: 3400, rank: 'Prover',
  });

  // ── Term / Audit ──
  const [termUptime, setTermUptime] = useState('0s');
  const [auditLogs, setAuditLogs] = useState<string[]>([
    '[14:02:23] NEXUS_READY · Village mode',
    '[14:02:24] FEED_ENGINE · 12 items loaded',
    '[14:02:25] TREASURY · $6,682.50 total',
    '[14:02:26] SOCIAL · 5 platforms connected',
    '[14:02:27] PRIVACY · Airlock active (HIGH)',
  ]);

  const canvasRef = useRef<HTMLCanvasElement>(null);

  // ── Uptime ──
  useEffect(() => {
    let secs = 0;
    const timer = setInterval(() => {
      secs++;
      const m = Math.floor(secs / 60), s = secs % 60;
      setTermUptime(m > 0 ? `${m}m ${s}s` : `${s}s`);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // ── Canvas (quorum globe) ──
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resize = () => {
      const parent = canvas.parentElement;
      const maxW = Math.min(parent ? parent.clientWidth - 40 : 300, 400);
      const size = Math.max(220, maxW);
      canvas.width = size; canvas.height = size;
    };
    resize();
    window.addEventListener('resize', resize);

    const radius = Math.min(canvas.width, canvas.height) * 0.38;
    const nodes: { x: number; y: number; z: number }[] = [];
    for (let i = 0; i < 180; i += 12) {
      const lat = (i * Math.PI) / 180 - Math.PI / 2;
      for (let j = 0; j < 360; j += 18) {
        const lon = (j * Math.PI) / 180 - Math.PI;
        nodes.push({
          x: radius * Math.cos(lat) * Math.sin(lon),
          y: radius * Math.sin(lat),
          z: radius * Math.cos(lat) * Math.cos(lon),
        });
      }
    }

    let rotY = 0, animId: number;
    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      rotY += 0.003;
      const cosY = Math.cos(rotY), sinY = Math.sin(rotY);
      nodes.forEach((node, i) => {
        const rx = node.x * cosY - node.z * sinY;
        const rz = node.z * cosY + node.x * sinY;
        if (rz + radius > 0) {
          const sx = canvas.width / 2 + rx, sy = canvas.height / 2 + node.y;
          const scale = Math.max(0.3, (rz + radius) / (radius * 2));
          const isGold = i % 3 === 0;
          const color = isGold ? 'rgba(245,158,11,' : 'rgba(59,130,246,';
          ctx.beginPath();
          ctx.fillStyle = `${color}${scale * 0.7})`;
          ctx.arc(sx, sy, isGold ? scale * 2.5 : scale * 2, 0, 2 * Math.PI);
          ctx.fill();
        }
      });
      animId = requestAnimationFrame(render);
    };
    render();
    return () => { cancelAnimationFrame(animId); window.removeEventListener('resize', resize); };
  }, []);

  // ── Handlers ──
  const handleAuditUpdate = useCallback((msg: string) => {
    setAuditLogs(prev => [...prev.slice(-19), `[${new Date().toLocaleTimeString()}] ${msg}`]);
  }, []);

  const handleEnterArena = useCallback((item: FeedItem) => {
    setMode('ARENA');
    setActiveDock('arena');
    setSelectedBounty({
      id: item.id,
      theorem_name: item.title,
      complexity: 'Hard',
      mode: item.type === 'SIEGE' ? 'SIEGE' : item.type === 'GOLF' ? 'GOLF' : 'CRUSADE',
      rep_reward: item.bounty,
      status: 'PURGATORY',
      blue_claimant: item.author,
      purgatory_end: new Date(Date.now() + 24 * 3600000).toISOString(),
    });
    handleAuditUpdate(`ARENA_ENTER · ${item.title}`);
  }, [handleAuditUpdate]);

  const handleBountyClick = useCallback((bounty: BountyData) => {
    setSelectedBounty(bounty);
    if (bounty.purgatory_end) {
      const tl = Math.max(0, Math.floor((new Date(bounty.purgatory_end).getTime() - Date.now()) / 1000));
      setHUDStats(p => ({ ...p, timeLeft: tl, stake: Math.floor(bounty.rep_reward / 10) }));
    }
    if (bounty.mode === 'GOLF' && bounty.lines_original) {
      setHUDStats(p => ({ ...p, lines: bounty.lines_original!, linesOriginal: bounty.lines_original!, diff: 0 }));
    }
    if (bounty.mode === 'CRUSADE' && bounty.sub_bounties) {
      setHUDStats(p => ({ ...p, total: bounty.sub_bounties!.length, solved: Math.floor(bounty.sub_bounties!.length * 0.235) }));
    }
    handleAuditUpdate(`BOUNTY_SELECT · ${bounty.theorem_name}`);
  }, [handleAuditUpdate]);

  const handleModeChange = useCallback((m: GameMode) => {
    setGameMode(m);
    handleAuditUpdate(`GAME_MODE · ${m}`);
  }, [handleAuditUpdate]);

  const switchMode = useCallback((m: NexusMode) => {
    setMode(m);
    setActiveDock(m === 'VILLAGE' ? 'village' : 'arena');
    handleAuditUpdate(`VIEW · ${m}`);
  }, [handleAuditUpdate]);

  const toggleMode = useCallback(() => {
    switchMode(mode === 'VILLAGE' ? 'ARENA' : 'VILLAGE');
  }, [mode, switchMode]);

  // ── Proof lines (editor view) ──
  const proofLines = [
    { line: 1, state: 'pass' as const, code: 'theorem infinite_primes (n : ℕ) :' },
    { line: 2, state: 'pass' as const, code: '  ∃ p, Nat.Prime p ∧ p > n := by' },
    { line: 3, state: 'warn' as const, code: '  -- CRAFT: try let p := min_fac (n! + 1)', tooltip: 'CRAFT: 3 pool matches' },
    { line: 4, state: 'pass' as const, code: '  have hpos : n! + 1 > 1 := by' },
    { line: 5, state: 'pass' as const, code: '    apply Nat.succ_lt_succ; exact Nat.factorial_pos n' },
    { line: 6, state: 'fail' as const, code: '  have hp := exists_prime_and_dvd hpos', tooltip: 'Breach: leak' },
    { line: 7, state: 'pooled' as const, code: '  rcases hp with ⟨p, hp_prime, hp_dvd⟩', tooltip: 'Pool: @MIT_Node' },
    { line: 8, state: 'pass' as const, code: '  refine ⟨p, hp_prime, ?_⟩' },
    { line: 9, state: 'pass' as const, code: '  -- p > n because p ∣ n!+1 but p ∤ n!' },
    { line: 10, state: 'pooled' as const, code: '  exact Nat.le_of_dvd (by omega) hp_dvd', tooltip: 'Pool ratified' },
  ];

  return (
    <div className="nexus-root" style={{ animation: 'fadeSlideIn 0.3s ease' }}>
      <style>{`
.nexus-root {
  --void: #050505; --substrate: #0F0F11; --surface: #1A1A1C;
  --border: #2E2E32; --local: #3B82F6; --consensus: #F59E0B;
  --verify: #10B981; --breach: #EF4444; --muted: #6A8099; --text: #DCE2EA;
  --font-display: 'Syne',system-ui,sans-serif;
  --font-mono: 'IBM Plex Mono',monospace;
  --font-body: 'DM Sans',system-ui,sans-serif;
  --ease-out: cubic-bezier(0.16,1,0.3,1);
}
@media (prefers-reduced-motion:reduce) {
  .nexus-root *,.nexus-root *::before,.nexus-root *::after { animation-duration:0.01ms!important; transition-duration:0.01ms!important; }
}
.nexus-root *,.nexus-root *::before,.nexus-root *::after { box-sizing:border-box; margin:0; padding:0; }
.nexus-root {
  background: var(--void); color: var(--text);
  font-family: var(--font-body); line-height:1.5;
  overflow-x:hidden; min-height:100vh;
}
.nexus-root button { font:inherit; cursor:pointer; }
.nexus-root :focus-visible { outline:2px solid var(--consensus); outline-offset:2px; }
.nexus-root::before {
  content:''; position:fixed; inset:0; pointer-events:none; z-index:0;
  background-image: linear-gradient(rgba(245,158,11,0.012) 1px, transparent 1px),
                    linear-gradient(90deg, rgba(245,158,11,0.012) 1px, transparent 1px);
  background-size:48px 48px;
}

/* ── Nexus Grid ── */
.nexus-grid {
  display: grid; gap: 4px; height: 100vh;
  grid-template-columns: 52px 1fr 300px;
  grid-template-rows: 1fr 1fr;
  grid-template-areas:
    "dock  feed   social"
    "dock  feed   treasury";
}
.nexus-grid.arena-mode {
  grid-template-columns: 52px 1fr;
  grid-template-rows: 48px 1fr 1fr 0.6fr;
  grid-template-areas:
    "dock  nav"
    "dock  editor"
    "dock  graph"
    "dock  output";
}

.panel {
  background: var(--substrate);
  border: 1px solid var(--border);
  border-radius: 10px;
  display: flex; flex-direction: column;
  overflow: hidden;
  backdrop-filter: blur(12px);
}
.panel-header {
  display:flex; align-items:center; justify-content:space-between;
  padding:6px 10px; border-bottom:1px solid var(--border);
  background:rgba(15,15,17,0.8); font-size:0.55rem;
  font-family:var(--font-mono); color:var(--muted);
  text-transform:uppercase; letter-spacing:0.08em;
  flex-shrink:0; backdrop-filter:blur(12px);
}
.panel-body { flex:1; overflow:auto; position:relative; }

/* ── Dock ── */
.dock-panel { grid-area:dock; display:flex; flex-direction:column; align-items:center; gap:6px; padding:8px 0; border-right:1px solid var(--border); background:var(--substrate); }
.dock-divider { width:24px; height:1px; background:var(--border); margin:2px 0; }

/* ── Feed ── */
.feed-panel { grid-area:feed; }
.social-panel { grid-area:social; }
.treasury-panel { grid-area:treasury; }

/* ── Arena mode panels ── */
.arena-nav { grid-area:nav; }
.arena-editor { grid-area:editor; }
.arena-graph { grid-area:graph; }
.arena-output { grid-area:output; }

.editor-code { margin-left:36px; padding:8px 12px; font-family:var(--font-mono); font-size:0.65rem; line-height:2; }
.editor-code .line { display:flex; align-items:center; gap:6px; }
.editor-code .line-num { color:var(--border); min-width:20px; text-align:right; font-size:0.5rem; user-select:none; }
.editor-code .keyword { color:#C084FC; }
.editor-code .type { color:#FDE68A; }
.editor-code .comment { color:var(--muted); font-style:italic; }
.editor-code .error-underline { text-decoration:underline wavy var(--breach); text-underline-offset:3px; }
.editor-code .pool-highlight { background:rgba(245,158,11,0.1); border-radius:2px; }
.editor-gutter {
  position:absolute; left:0; top:32px; bottom:0; width:30px;
  background:var(--void); border-right:1px solid var(--border);
  display:flex; flex-direction:column; align-items:center; gap:8px; padding-top:8px;
  z-index:10;
}

/* ── Output log ── */
.evidence-log { padding:6px 12px; font-family:var(--font-mono); font-size:0.55rem; }
.evidence-line { display:flex; align-items:center; gap:6px; padding:1px 0; color:var(--muted); white-space:nowrap; }
.evidence-line .ts { color:var(--border); min-width:50px; font-size:0.5rem; }
.evidence-line .check { font-size:0.5rem; }
.evidence-line .arrow { color:var(--muted); font-size:0.45rem; }
.evidence-line.active { color:var(--text); }
.evidence-line.active .ts { color:var(--verify); }

/* ── Ticker ── */
.ticker { background:var(--substrate); border-bottom:1px solid var(--border); padding:4px 0; overflow:hidden; }
.ticker-inner { display:flex; gap:32px; white-space:nowrap; width:max-content; animation:tickerScroll 48s linear infinite; font-family:var(--font-mono); font-size:0.5rem; color:var(--muted); }
.ticker-inner b { color:var(--text); font-weight:500; }
.ticker-inner .warn { color:var(--breach); }
.ticker-inner .pool { color:var(--consensus); }
.ticker-inner .arena { color:#A855F7; }
@keyframes tickerScroll { from{transform:translateX(0)} to{transform:translateX(-50%)} }
@keyframes fadeSlideIn { from{opacity:0;transform:translateY(6px)} to{opacity:1;transform:translateY(0)} }
@keyframes blink { 50% { opacity:0 } }
.panel-body::-webkit-scrollbar { width:3px; }
.panel-body::-webkit-scrollbar-thumb { background:var(--border); border-radius:2px; }
      `}</style>

      {/* ── Ticker ── */}
      <div className="ticker">
        <div className="ticker-inner">
          <span>PROOFBRIDGE LINER <b>v2.0 · NEXUS</b></span>
          <span>VILLAGE <b className="pool">● feed active</b></span>
          <span>TREASURY <b className="pool">$6,682.50</b></span>
          <span>SOCIAL <b>5 platforms</b></span>
          <span>PRIVACY <b className="verify">HIGH · airlock active</b></span>
          <span>UBUNTUGAMES <b className="arena">● 7 bounties</b></span>
          <span>REP <b className="pool">14.8k @local_user</b></span>
          <span>TEE <b className="warn">software-attested</b></span>
          <span>COSIGN <b className="verify">5 keys</b></span>
          <span>PROOFBRIDGE LINER <b>v2.0 · NEXUS</b></span>
          <span>VILLAGE <b className="pool">● feed active</b></span>
          <span>TREASURY <b className="pool">$6,682.50</b></span>
          <span>SOCIAL <b>5 platforms</b></span>
          <span>PRIVACY <b className="verify">HIGH · airlock active</b></span>
          <span>UBUNTUGAMES <b className="arena">● 7 bounties</b></span>
          <span>REP <b className="pool">14.8k @local_user</b></span>
          <span>TEE <b className="warn">software-attested</b></span>
          <span>COSIGN <b className="verify">5 keys</b></span>
        </div>
      </div>

      {/* ── Cross-System Nav ── */}
      <div
        style={{
          borderBottom: '1px solid var(--border)',
          background: 'rgba(15,15,17,0.7)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          alignItems: 'center',
          gap: 4,
          padding: '0 12px',
          flexShrink: 0,
          overflowX: 'auto',
        }}
      >
        <span style={{ fontSize: 8, color: '#6A8099', textTransform: 'uppercase', letterSpacing: '0.08em', marginRight: 6, flexShrink: 0 }}>Compliance OS:</span>
        {[
          { href: '/proofbridge', label: 'ProofBridge', color: '#F59E0B' },
          { href: '/ubuntu-games', label: 'UbuntuGames', color: '#EF4444' },
          { href: '/pools', label: 'Ubuntu Pools', color: '#10B981' },
          { href: '/safekrypte', label: 'SafeKrypte', color: '#A855F7' },
          { href: '/safegrid', label: 'SafeLiner', color: '#3B82F6' },
        ].map(link => (
          <Link
            key={link.href}
            href={link.href}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 3,
              padding: '3px 8px', borderRadius: 4, fontSize: 9,
              color: link.color, textDecoration: 'none',
              border: `1px solid ${link.color}25`,
              background: `${link.color}08`,
              whiteSpace: 'nowrap', flexShrink: 0,
            }}
          >
            <span style={{ width: 4, height: 4, borderRadius: '50%', background: link.color, display: 'inline-block' }} />
            {link.label}
          </Link>
        ))}
      </div>

      {/* ── Nexus Grid ── */}
      <div className={`nexus-grid${mode === 'ARENA' ? ' arena-mode' : ''}`}>

        {/* ═══════════════ DOCK (always visible) ═══════════════ */}
        <div className="dock-panel">
          <DockIcon icon={<Home size={16} />} label="Village" active={activeDock === 'village'} onClick={() => switchMode('VILLAGE')} />
          <DockIcon icon={<Swords size={16} />} label="Arena" active={activeDock === 'arena'} onClick={toggleMode} badge={7} />
          <div className="dock-divider" />
          <DockIcon icon={<Code2 size={16} />} label="Editor" active={activeDock === 'editor'} onClick={() => switchMode('ARENA')} />
          <DockIcon icon={<Wallet size={16} />} label="Treasury" />
          <DockIcon icon={<MessageCircle size={16} />} label="Social" />
          <div className="dock-divider" />
          <DockIcon icon={<Shield size={16} />} label="Privacy" />
          <DockIcon icon={<Users size={16} />} label="Guild" />
          <div style={{ flex: 1 }} />
          {/* Lindiwe badge */}
          <div style={{
            writingMode: 'vertical-rl', fontSize: 7, color: '#F59E0B',
            fontFamily: "'IBM Plex Mono', monospace", letterSpacing: '0.1em',
            opacity: 0.6, padding: '4px 0',
          }}>
            LINDIWE 14.8k
          </div>
        </div>

        {/* ═══════════════ VILLAGE MODE ═══════════════ */}
        {mode === 'VILLAGE' && (
          <>
            {/* Feed */}
            <div className="panel feed-panel" style={{ borderRadius: 0, border: 'none', background: '#050505' }}>
              <VillageFeed onEnterArena={handleEnterArena} />
            </div>

            {/* Social */}
            <div className="panel social-panel">
              <SocialMesh />
            </div>

            {/* Treasury */}
            <div className="panel treasury-panel">
              <TreasuryPanel />
            </div>
          </>
        )}

        {/* ═══════════════ ARENA MODE ═══════════════ */}
        {mode === 'ARENA' && (
          <>
            {/* Nav */}
            <div className="panel arena-nav" style={{ display: 'flex', alignItems: 'center', padding: '0 14px', justifyContent: 'space-between', borderRadius: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <motion.button whileTap={{ scale: 0.9 }} onClick={() => switchMode('VILLAGE')}
                  style={{ background: 'none', border: '1px solid var(--border)', borderRadius: 6, padding: '4px 8px', color: '#6A8099', fontSize: 9, cursor: 'pointer' }}>
                  <X size={12} /> Back
                </motion.button>
                <span style={{ fontSize: 10, color: '#9CA3AF', fontFamily: "'IBM Plex Mono', monospace" }}>
                  {selectedBounty ? `Siege: ${selectedBounty.theorem_name.replace(/_/g, ' ')}` : 'ProofBridge Editor'}
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <GameHUD mode={gameMode} stats={hudStats} onModeChange={handleModeChange} />
                {selectedBounty && (
                  <span style={{ fontSize: 9, color: '#F59E0B', fontFamily: "'IBM Plex Mono', monospace", fontWeight: 700 }}>
                    {selectedBounty.rep_reward.toLocaleString()} REP
                  </span>
                )}
              </div>
            </div>

            {/* Editor */}
            <div className="panel arena-editor">
              <div className="panel-header">
                <span>Main.lean — Sanctuary {selectedBounty && <span style={{ color: '#A855F7' }}>◆ {selectedBounty.theorem_name.replace(/_/g, ' ')}</span>}</span>
                <div style={{ display: 'flex', gap: 6 }}>
                  <span className="panel-dot" style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--verify)' }} />
                  <span className="panel-dot" style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--border)' }} />
                </div>
              </div>
              <div className="panel-body">
                <div className="editor-gutter">
                  {proofLines.map((l, i) => {
                    const colors = { pass: '#10B981', warn: '#FBBF24', fail: '#EF4444', pooled: '#F59E0B' };
                    return (
                      <div key={i} title={l.tooltip}
                        style={{ width: 6, height: 6, borderRadius: '50%', background: colors[l.state], boxShadow: `0 0 4px ${colors[l.state]}66`, flexShrink: 0 }} />
                    );
                  })}
                </div>
                <div className="editor-code">
                  {proofLines.map((l, i) => (
                    <div className="line" key={i}>
                      <span className="line-num">{String(l.line).padStart(2, ' ')}</span>
                      <span dangerouslySetInnerHTML={{
                        __html: l.code
                          .replace(/\b(theorem|lemma|def|example|by|have|apply|exact|refine|rcases|intro|exists)\b/g, '<span class="keyword">$1</span>')
                          .replace(/\b(ℕ|∃|∧|:=)\b/g, '<span class="type">$1</span>')
                          .replace(/sorry/, '<span class="error-underline">sorry</span>')
                      }} />
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Graph / Arena Ticker */}
            <div className="panel arena-graph">
              <div className="panel-header">
                <span>Arena · Active Bounties</span>
              </div>
              <div className="panel-body">
                <ArenaTicker onBountyClick={handleBountyClick} />
              </div>
            </div>

            {/* Output */}
            <div className="panel arena-output">
              <div className="panel-header">
                <span>Audit Log · Sprinto</span>
              </div>
              <div className="panel-body">
                <div className="evidence-log">
                  {auditLogs.map((log, i) => (
                    <div key={i} className={`evidence-line${i === auditLogs.length - 1 ? ' active' : ''}`}>
                      <span className="ts">{log.substring(0, 10)}</span>
                      <span className="check">▸</span>
                      <span>{log.length > 80 ? log.slice(0, 80) + '…' : log}</span>
                    </div>
                  ))}
                  <div className="evidence-line active" style={{ marginTop: 2 }}>
                    <span className="ts" style={{ color: 'var(--verify)' }}>{new Date().toLocaleTimeString()}</span>
                    <span className="check" style={{ color: 'var(--verify)' }}>●</span>
                    <span className="arrow" style={{ color: 'var(--verify)' }}>▸</span>
                    <span style={{ color: 'var(--verify)', animation: 'blink 1s step-end infinite' }}>_</span>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      {/* ── Footer ── */}
      <div style={{ borderTop: '1px solid var(--border)', padding: '10px 20px', display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8, fontFamily: "'IBM Plex Mono', monospace", fontSize: '0.5rem', color: 'var(--muted)' }}>
        <span>ProofBridge Liner <strong style={{ color: '#DCE2EA' }}>v2.0 · Nexus</strong></span>
        <span>Uptime: {termUptime} · {auditLogs.length} events</span>
        <span>Vault: <strong style={{ color: 'var(--verify)' }}>ENCRYPTED</strong> · Privacy: <strong style={{ color: 'var(--consensus)' }}>HIGH</strong></span>
      </div>
    </div>
  );
}

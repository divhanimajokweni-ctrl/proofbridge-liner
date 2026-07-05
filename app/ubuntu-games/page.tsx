'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  Swords,
  Zap,
  Users,
  Play,
  Trophy,
  Shield,
  Sword,
  ChevronRight,
  Skull,
  Target,
  Crosshair,
  Bug,
} from 'lucide-react';
import Link from 'next/link';

// ─── Types ───────────────────────────────────────────────────────────────────

type GameMode = 'SIEGE' | 'GOLF' | 'CRUSADE' | 'ANT_FEAST';

interface LiveSession {
  id: string;
  mode: GameMode;
  title: string;
  theorem: string;
  bounty: number;
  players: number;
  status: 'LIVE' | 'ENDING' | 'NEW';
  timeLeft?: number;
}

// ─── Mock Data ───────────────────────────────────────────────────────────────

const LIVE_SESSIONS: LiveSession[] = [
  {
    id: 'siege_1',
    mode: 'SIEGE',
    title: 'Break My Spec: Auth.lean',
    theorem: 'def is_safe (x : Input) : Bool',
    bounty: 5000,
    players: 34,
    status: 'LIVE',
    timeLeft: 14 * 3600,
  },
  {
    id: 'crusade_1',
    mode: 'CRUSADE',
    title: 'Raid Boss: Riemann Zeta',
    theorem: 'ζ(s) = 0 ⇒ s = 1/2 + iτ',
    bounty: 100000,
    players: 124,
    status: 'LIVE',
  },
  {
    id: 'golf_1',
    mode: 'GOLF',
    title: 'Speedrun: QuickSort Correctness',
    theorem: 'sorted (sort a) ∧ permutation a (sort a)',
    bounty: 200,
    players: 14,
    status: 'LIVE',
  },
  {
    id: 'siege_2',
    mode: 'SIEGE',
    title: 'ZK Circuit Soundness Gap',
    theorem: 'verify_proof (π : Proof) : Bool',
    bounty: 2500,
    players: 7,
    status: 'ENDING',
    timeLeft: 3600,
  },
  {
    id: 'crusade_2',
    mode: 'CRUSADE',
    title: 'Yang-Mills Mass Gap',
    theorem: 'mass_gap > 0',
    bounty: 100000,
    players: 67,
    status: 'LIVE',
  },
  {
    id: 'golf_2',
    mode: 'GOLF',
    title: 'factorial_equiv recursion',
    theorem: 'fact (n+1) = (n+1) * fact n',
    bounty: 150,
    players: 22,
    status: 'NEW',
  },
];

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatTimeLeft(seconds: number): string {
  if (seconds <= 0) return '00:00:00';
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  const pad = (n: number) => n.toString().padStart(2, '0');
  return `${pad(h)}:${pad(m)}:${pad(s)}`;
}

const MODE_META: Record<GameMode, { icon: typeof Swords; color: string; label: string; href: string }> = {
  SIEGE:     { icon: Swords,   color: '#EF4444', label: 'Red Siege',        href: '/ubuntu-games/siege' },
  GOLF:      { icon: Zap,      color: '#3B82F6', label: 'Proof Golf',        href: '/ubuntu-games/golf' },
  CRUSADE:   { icon: Users,    color: '#A855F7', label: 'Crusade Raid',      href: '/ubuntu-games/crusade' },
  ANT_FEAST: { icon: Bug as unknown as typeof Swords, color: '#D4A017', label: 'Ant Feast', href: '/ubuntu-games/ant-feast' },
};

// ─── Main Hub Page ────────────────────────────────────────────────────────────

export default function UbuntuGamesHub() {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <div
      style={{
        height: '100vh',
        width: '100%',
        background: 'var(--void, #050505)',
        color: 'var(--text, #DCE2EA)',
        fontFamily: "'IBM Plex Mono', monospace",
        overflow: 'auto',
        position: 'relative',
      }}
    >
      {/* Background grid */}
      <div
        style={{
          position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0,
          backgroundImage: 'linear-gradient(rgba(245,158,11,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(245,158,11,0.03) 1px, transparent 1px)',
          backgroundSize: '48px 48px',
        }}
      />

      <div style={{ position: 'relative', zIndex: 1, maxWidth: 1200, margin: '0 auto', padding: '40px 24px' }}>
        {/* ── Header ── */}
        <header style={{ marginBottom: 48, textAlign: 'center' }}>
          <div
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 10,
              padding: '4px 12px', borderRadius: 20,
              border: '1px solid rgba(245,158,11,0.3)', background: 'rgba(245,158,11,0.08)',
              fontSize: 9, color: '#F59E0B', fontWeight: 700, marginBottom: 16,
              textTransform: 'uppercase', letterSpacing: '0.1em',
            }}
          >
            <Sword size={10} />
            UbuntuGames · Live Now
          </div>

          <h1
            style={{
              fontSize: 42, fontWeight: 800, color: '#FFFFFF',
              fontFamily: "'Syne', system-ui, sans-serif",
              letterSpacing: '-0.03em', lineHeight: 1.1, marginBottom: 12,
            }}
          >
            The Arena of Truth
          </h1>
          <p style={{ fontSize: 12, color: '#6A8099', maxWidth: 560, margin: '0 auto', lineHeight: 1.6 }}>
            Red vs Blue. Formal verification as competitive sport.
            Enter a Siege, beat a Proof Golf speedrun, or join a Crusade raid.
          </p>

          {/* Mode quick links */}
          <div style={{ display: 'flex', gap: 10, justifyContent: 'center', marginTop: 24, flexWrap: 'wrap' }}>
            {(Object.keys(MODE_META) as GameMode[]).map(mode => {
              const meta = MODE_META[mode];
              const Icon = meta.icon;
              return (
                <Link key={mode} href={meta.href} style={{ textDecoration: 'none' }}>
                  <motion.button
                    whileHover={{ scale: 1.04 }}
                    whileTap={{ scale: 0.96 }}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 8,
                      padding: '10px 18px', borderRadius: 10,
                      border: `1px solid ${meta.color}40`,
                      background: `${meta.color}12`,
                      color: meta.color, fontSize: 11, fontWeight: 700,
                      cursor: 'pointer', transition: 'all 0.2s ease',
                    }}
                  >
                    <Icon size={14} />
                    {meta.label}
                    <ChevronRight size={12} style={{ opacity: 0.6 }} />
                  </motion.button>
                </Link>
              );
            })}
          </div>

          {/* Compliance OS links */}
          <div style={{ display: 'flex', gap: 6, justifyContent: 'center', marginTop: 12, flexWrap: 'wrap' }}>
            {[
              { href: '/proofbridge', label: 'Village Dashboard', color: '#F59E0B' },
              { href: '/pools', label: 'Ubuntu Pools', color: '#10B981' },
              { href: '/safekrypte', label: 'SafeKrypte', color: '#A855F7' },
              { href: '/safegrid', label: 'SafeLiner', color: '#3B82F6' },
            ].map(link => (
              <Link key={link.href} href={link.href} style={{ textDecoration: 'none' }}>
                <span
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: 4,
                    padding: '2px 8px', borderRadius: 4, fontSize: 9,
                    color: link.color,
                    border: `1px solid ${link.color}25`,
                    background: `${link.color}08`,
                  }}
                >
                  <span style={{ width: 4, height: 4, borderRadius: '50%', background: link.color, display: 'inline-block' }} />
                  {link.label}
                </span>
              </Link>
            ))}
          </div>
        </header>

        {/* ── Live Sessions List ── */}
        <section>
          <div
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              marginBottom: 16, padding: '0 4px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div
                style={{
                  width: 8, height: 8, borderRadius: '50%', background: '#10B981',
                  boxShadow: '0 0 10px rgba(16,185,129,0.7)',
                  animation: 'pulse 2s ease-in-out infinite',
                }}
              />
              <span style={{ fontSize: 10, fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                Live Sessions
              </span>
            </div>
            <Link
              href="/ubuntu-games/live"
              style={{ fontSize: 9, color: '#3B82F6', textDecoration: 'none', fontWeight: 600 }}
            >
              View full feed →
            </Link>
          </div>

          <div style={{ display: 'grid', gap: 10 }}>
            {LIVE_SESSIONS.map(session => {
              const meta = MODE_META[session.mode];
              const Icon = meta.icon;
              const timeLeft = session.timeLeft
                ? Math.max(0, Math.floor((session.timeLeft * 1000 + now - Date.now()) / 1000))
                : null;

              return (
                <motion.div
                  key={session.id}
                  whileHover={{ scale: 1.01 }}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr auto auto auto',
                    alignItems: 'center',
                    gap: 16,
                    padding: '16px 20px',
                    borderRadius: 10,
                    border: `1px solid ${meta.color}25`,
                    background: 'var(--substrate, #0F0F11)',
                    cursor: 'pointer',
                    textDecoration: 'none',
                    color: 'inherit',
                    transition: 'all 0.2s ease',
                  }}
                >
                  {/* Left: mode badge + title */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 }}>
                    <div
                      style={{
                        width: 36, height: 36, borderRadius: 10,
                        background: `${meta.color}18`,
                        border: `1px solid ${meta.color}35`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        flexShrink: 0,
                      }}
                    >
                      <Icon size={16} style={{ color: meta.color }} />
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <div
                        style={{
                          display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2,
                        }}
                      >
                        <span
                          style={{
                            fontSize: 9, fontWeight: 700, color: meta.color,
                            padding: '1px 6px', borderRadius: 4,
                            background: `${meta.color}15`,
                            textTransform: 'uppercase', letterSpacing: '0.06em',
                          }}
                        >
                          {session.status === 'LIVE' ? '● LIVE' : session.status === 'ENDING' ? '⚠ ENDING' : '● NEW'}
                        </span>
                        <span
                          style={{
                            fontSize: 9, color: '#6A8099', padding: '1px 6px', borderRadius: 4,
                            background: 'rgba(255,255,255,0.03)',
                          }}
                        >
                          {session.mode}
                        </span>
                      </div>
                      <div
                        style={{
                          fontSize: 13, fontWeight: 700, color: '#D1D5DB',
                          whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                        }}
                      >
                        {session.title}
                      </div>
                      <div
                        style={{
                          fontSize: 10, color: '#6A8099', fontFamily: "'IBM Plex Mono', monospace",
                          whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                        }}
                      >
                        {session.theorem}
                      </div>
                    </div>
                  </div>

                  {/* Players */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 10, color: '#9CA3AF', flexShrink: 0 }}>
                    <Users size={12} />
                    <span style={{ fontWeight: 700 }}>{session.players}</span>
                  </div>

                  {/* Countdown */}
                  {timeLeft !== null && (
                    <div
                      style={{
                        fontFamily: "'IBM Plex Mono', monospace", fontSize: 11, fontWeight: 700,
                        color: timeLeft < 3600 ? '#EF4444' : '#D1D5DB',
                        flexShrink: 0, minWidth: 70, textAlign: 'right',
                      }}
                    >
                      {formatTimeLeft(timeLeft)}
                    </div>
                  )}

                  {/* Bounty + link */}
                  <Link
                    href={`/ubuntu-games/bounty/${session.id}`}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 6,
                      padding: '4px 10px', borderRadius: 6,
                      border: '1px solid rgba(245,158,11,0.25)',
                      background: 'rgba(245,158,11,0.08)',
                      color: '#F59E0B', fontSize: 11, fontWeight: 700,
                      textDecoration: 'none', flexShrink: 0, whiteSpace: 'nowrap',
                    }}
                  >
                    <Trophy size={10} />
                    {session.bounty.toLocaleString()} REP
                  </Link>
                </motion.div>
              );
            })}
          </div>
        </section>

        {/* ── Footer ── */}
        <footer
          style={{
            marginTop: 48, padding: '16px 0', borderTop: '1px solid var(--border, #2E2E32)',
            display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8,
            fontSize: 9, color: '#6A8099',
          }}
        >
          <span>UbuntuGames <strong style={{ color: '#DCE2EA' }}>v1.0</strong></span>
          <span>Red vs Blue · Formal Verification as Sport</span>
          <span>ProofBridge Liner · Lindiwe Oracle · Ubuntu Pool</span>
        </footer>
      </div>

      {/* Pulse animation */}
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
      `}</style>
    </div>
  );
}

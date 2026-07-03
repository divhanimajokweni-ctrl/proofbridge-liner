'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sword,
  Shield,
  Clock,
  Trophy,
  AlertTriangle,
  Crosshair,
  Swords,
  Users,
  Zap,
  Skull,
} from 'lucide-react';

// ── Types ────────────────────────────────────────────────────────────────────

export type BountyStatus = 'OPEN' | 'PURGATORY' | 'CANONICAL' | 'BREACHED';
export type GameMode = 'SIEGE' | 'GOLF' | 'CRUSADE';
export type Difficulty = 'God-Tier' | 'Hard' | 'Medium' | 'Easy';

export interface BountyData {
  id: string;
  theorem_name: string;
  complexity: Difficulty;
  mode: GameMode;
  rep_reward: number;
  blue_claimant?: string;
  red_breacher?: string;
  status: BountyStatus;
  proof_cid?: string;
  purgatory_end?: string;
  lines_original?: number;
  lines_new?: number;
  sub_bounties?: string[];
}

export interface ArenaState {
  bounties: BountyData[];
  scores: Record<string, number>;
}

// ── Props ────────────────────────────────────────────────────────────────────

interface ArenaTickerProps {
  /** API base URL. Defaults to '' (same origin). */
  apiBase?: string;
  /** Initial bounties for SSR / fallback. */
  initialBounties?: BountyData[];
  /** Called when a bounty card is clicked. */
  onBountyClick?: (bounty: BountyData) => void;
  /** Called when live data arrives from the stream. */
  onStateChange?: (state: ArenaState) => void;
}

// ── Mock Fallback Data ────────────────────────────────────────────────────────

const MOCK_BOUNTIES: BountyData[] = [
  {
    id: 'b1', theorem_name: 'Riemann_Zeta_Zeros',
    complexity: 'God-Tier', mode: 'CRUSADE',
    rep_reward: 100000, status: 'OPEN',
  },
  {
    id: 'b2', theorem_name: 'Navier_Stokes_Smoothness',
    complexity: 'Hard', mode: 'CRUSADE',
    rep_reward: 50000, status: 'OPEN',
  },
  {
    id: 'b3', theorem_name: 'P_vs_NP',
    complexity: 'God-Tier', mode: 'SIEGE',
    rep_reward: 100000, status: 'OPEN',
  },
  {
    id: 'b4', theorem_name: 'Yang_Mills_Existence',
    complexity: 'God-Tier', mode: 'CRUSADE',
    rep_reward: 100000, status: 'OPEN',
  },
  {
    id: 'b5', theorem_name: 'Lemma_Topology_4.2',
    complexity: 'Medium', mode: 'SIEGE',
    rep_reward: 500, status: 'PURGATORY',
    blue_claimant: '@Tokyo_Node',
    purgatory_end: new Date(Date.now() + 14 * 3600 * 1000).toISOString(),
  },
  {
    id: 'b6', theorem_name: 'QuickSort_Correctness',
    complexity: 'Easy', mode: 'GOLF',
    rep_reward: 200, status: 'OPEN',
    lines_original: 68,
  },
  {
    id: 'b7', theorem_name: 'Banach_Tarski_Decomposition',
    complexity: 'Hard', mode: 'SIEGE',
    rep_reward: 1200, status: 'CANONICAL',
    blue_claimant: '@Oxford_Lab',
  },
];

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatTimeLeft(seconds: number): string {
  if (seconds <= 0) return '00:00:00';
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

function getTimeLeft(purgatoryEnd?: string): number {
  if (!purgatoryEnd) return 0;
  const end = new Date(purgatoryEnd).getTime();
  const now = Date.now();
  return Math.max(0, Math.floor((end - now) / 1000));
}

// ── Mode Icons ───────────────────────────────────────────────────────────────

const ModeIcon = ({ mode }: { mode: GameMode }) => {
  switch (mode) {
    case 'SIEGE':
      return <Swords size={10} className="text-red-400" />;
    case 'GOLF':
      return <Zap size={10} className="text-blue-400" />;
    case 'CRUSADE':
      return <Users size={10} className="text-purple-400" />;
  }
};

// ── Component ─────────────────────────────────────────────────────────────────

export function ArenaTicker({
  apiBase = '',
  initialBounties,
  onBountyClick,
  onStateChange,
}: ArenaTickerProps) {
  const [bounties, setBounties] = useState<BountyData[]>(
    initialBounties ?? MOCK_BOUNTIES
  );
  const [connected, setConnected] = useState(false);

  // ── Live stream simulation: fetch from API, fall back to local tick ──
  const refresh = useCallback(async () => {
    try {
      const res = await fetch(`${apiBase}/api/arena`);
      if (res.ok) {
        const data: ArenaState = await res.json();
        setBounties(data.bounties);
        setConnected(true);
        onStateChange?.(data);
        return;
      }
    } catch {
      // API unavailable — use local tick simulation
    }
    setConnected(false);
  }, [apiBase, onStateChange]);

  // Poll API every 10s
  useEffect(() => {
    refresh();
    const interval = setInterval(refresh, 10_000);
    return () => clearInterval(interval);
  }, [refresh]);

  // Local timer tick for PURGATORY countdowns (runs every 1s, client-side)
  useEffect(() => {
    const tick = setInterval(() => {
      setBounties(prev =>
        prev.map(b => ({ ...b })) // triggers re-render for timeLeft computation
      );
    }, 1000);
    return () => clearInterval(tick);
  }, []);

  // ── Connection status indicator ──
  const connectionColor = connected ? '#10B981' : '#FBBF24';
  const connectionLabel = connected ? 'API LIVE' : 'LOCAL TICK';

  return (
    <div
      className="arena-ticker-root"
      style={{
        height: '100%',
        width: '100%',
        background: 'var(--substrate, #0F0F11)',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        fontFamily: "'IBM Plex Mono', monospace",
      }}
    >
      {/* ── HEADER ── */}
      <div
        className="arena-ticker-header"
        style={{
          height: 32,
          borderBottom: '1px solid var(--border, #2E2E32)',
          background: 'rgba(15,15,17,0.8)',
          backdropFilter: 'blur(12px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 12px',
          flexShrink: 0,
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            fontSize: 10,
            fontWeight: 700,
            color: '#9CA3AF',
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
          }}
        >
          <Sword size={12} style={{ color: '#EF4444' }} />
          <span>UbuntuGames // Live Arena</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span
            style={{
              width: 6,
              height: 6,
              borderRadius: '50%',
              background: connectionColor,
              boxShadow: `0 0 6px ${connectionColor}66`,
            }}
          />
          <span
            style={{
              fontSize: 9,
              color: connectionColor,
              letterSpacing: '0.05em',
            }}
          >
            {connectionLabel}
          </span>
        </div>
      </div>

      {/* ── TICKER LIST ── */}
      <div
        className="arena-ticker-body"
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: 8,
          display: 'flex',
          flexDirection: 'column',
          gap: 6,
        }}
      >
        <AnimatePresence initial={false}>
          {bounties.map(bounty => (
            <BountyCard
              key={bounty.id}
              bounty={bounty}
              onClick={() => onBountyClick?.(bounty)}
            />
          ))}
        </AnimatePresence>
      </div>

      {/* ── FOOTER STATS BAR ── */}
      <div
        style={{
          borderTop: '1px solid var(--border, #2E2E32)',
          padding: '4px 12px',
          display: 'flex',
          justifyContent: 'space-between',
          fontSize: 9,
          color: '#6A8099',
          flexShrink: 0,
          background: 'rgba(0,0,0,0.2)',
        }}
      >
        <span>
          <span style={{ color: '#3B82F6' }}>{bounties.filter(b => b.status === 'OPEN').length}</span> Open
          {' · '}
          <span style={{ color: '#A855F7' }}>
            {bounties.filter(b => b.status === 'PURGATORY').length}
          </span>{' '}
          Purgatory
        </span>
        <span>
          <span style={{ color: '#10B981' }}>
            {bounties.filter(b => b.status === 'CANONICAL').length}
          </span>{' '}
          Canonical
          {' · '}
          <span style={{ color: '#EF4444' }}>
            {bounties.filter(b => b.status === 'BREACHED').length}
          </span>{' '}
          Breached
        </span>
      </div>
    </div>
  );
}

// ── BountyCard (internal sub-component) ──────────────────────────────────────

function BountyCard({
  bounty,
  onClick,
}: {
  bounty: BountyData;
  onClick: () => void;
}) {
  const timeLeft = getTimeLeft(bounty.purgatory_end);

  // ── Status-specific visual config ──
  const statusConfig: Record<
    BountyStatus,
    { border: string; bg: string; hoverBorder: string }
  > = {
    OPEN: {
      border: 'rgba(59,130,246,0.2)',
      bg: 'transparent',
      hoverBorder: 'rgba(59,130,246,0.5)',
    },
    PURGATORY: {
      border: 'rgba(168,85,247,0.3)',
      bg: 'rgba(168,85,247,0.05)',
      hoverBorder: 'rgba(168,85,247,0.6)',
    },
    CANONICAL: {
      border: 'rgba(16,185,129,0.2)',
      bg: 'transparent',
      hoverBorder: 'rgba(16,185,129,0.4)',
    },
    BREACHED: {
      border: 'rgba(239,68,68,0.3)',
      bg: 'rgba(239,68,68,0.08)',
      hoverBorder: 'rgba(239,68,68,0.6)',
    },
  };

  const cfg = statusConfig[bounty.status];

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: -12 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
      onClick={onClick}
      style={{ cursor: 'pointer' }}
    >
      <div
        className="bounty-card"
        style={{
          position: 'relative',
          padding: '10px 12px',
          borderRadius: 8,
          border: `1px solid ${cfg.border}`,
          background: cfg.bg,
          transition: 'all 0.2s cubic-bezier(0.16,1,0.3,1)',
        }}
        onMouseEnter={e => {
          e.currentTarget.style.borderColor = cfg.hoverBorder;
          e.currentTarget.style.background =
            bounty.status === 'PURGATORY'
              ? 'rgba(168,85,247,0.1)'
              : 'rgba(255,255,255,0.02)';
        }}
        onMouseLeave={e => {
          e.currentTarget.style.borderColor = cfg.border;
          e.currentTarget.style.background = cfg.bg;
        }}
      >
        {/* ── Row 1: Theorem Name + Rep Reward ── */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            marginBottom: 4,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, flex: 1, minWidth: 0 }}>
            <ModeIcon mode={bounty.mode} />
            <span
              style={{
                fontSize: 12,
                fontFamily: "'IBM Plex Mono', monospace",
                color: '#D1D5DB',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              {bounty.theorem_name.replace(/_/g, ' ')}
            </span>
            <span
              style={{
                fontSize: 8,
                padding: '1px 4px',
                borderRadius: 4,
                background:
                  bounty.complexity === 'God-Tier'
                    ? 'rgba(239,68,68,0.15)'
                    : bounty.complexity === 'Hard'
                    ? 'rgba(251,191,36,0.15)'
                    : 'rgba(59,130,246,0.15)',
                color:
                  bounty.complexity === 'God-Tier'
                    ? '#EF4444'
                    : bounty.complexity === 'Hard'
                    ? '#FBBF24'
                    : '#3B82F6',
                flexShrink: 0,
              }}
            >
              {bounty.complexity === 'God-Tier'
                ? '✦✦✦'
                : bounty.complexity === 'Hard'
                ? '✦✦'
                : bounty.complexity === 'Medium'
                ? '✦'
                : '·'}
            </span>
          </div>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 4,
              fontSize: 10,
              fontWeight: 700,
              color: '#F59E0B',
              background: 'rgba(245,158,11,0.1)',
              padding: '2px 6px',
              borderRadius: 4,
              flexShrink: 0,
              marginLeft: 8,
            }}
          >
            <Trophy size={10} />
            {bounty.rep_reward.toLocaleString()} REP
          </div>
        </div>

        {/* ── Row 2: Status-specific content ── */}

        {/* OPEN */}
        {bounty.status === 'OPEN' && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              fontSize: 9,
              color: '#60A5FA',
              fontFamily: "'IBM Plex Mono', monospace",
            }}
          >
            <span
              style={{
                width: 6,
                height: 6,
                borderRadius: '50%',
                background: '#3B82F6',
                animation: 'pulse 1.5s ease-in-out infinite',
              }}
            />
            <span>WAITING FOR PROOF</span>
            {bounty.lines_original && (
              <span style={{ color: '#6A8099', marginLeft: 'auto' }}>
                target: {bounty.lines_original} lines
              </span>
            )}
          </div>
        )}

        {/* PURGATORY */}
        {bounty.status === 'PURGATORY' && (
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              fontSize: 9,
              color: '#C4B5FD',
              fontFamily: "'IBM Plex Mono', monospace",
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <Shield size={10} />
              <span>Defending: {bounty.blue_claimant}</span>
            </div>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 4,
                fontWeight: 700,
                background: 'rgba(168,85,247,0.15)',
                padding: '2px 8px',
                borderRadius: 4,
                color: timeLeft <= 3600 ? '#EF4444' : '#C4B5FD',
              }}
            >
              <Clock size={10} />
              {formatTimeLeft(timeLeft)}
            </div>
          </div>
        )}

        {/* BREACHED */}
        {bounty.status === 'BREACHED' && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              fontSize: 9,
              color: '#EF4444',
              fontFamily: "'IBM Plex Mono', monospace",
              fontWeight: 700,
            }}
          >
            <Skull size={10} />
            <span>
              BREACHED by {bounty.red_breacher ?? 'unknown'}
            </span>
          </div>
        )}

        {/* CANONICAL */}
        {bounty.status === 'CANONICAL' && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              fontSize: 9,
              color: 'rgba(16,185,129,0.8)',
              fontFamily: "'IBM Plex Mono', monospace",
            }}
          >
            <Crosshair size={10} />
            <span>
              Verified Truth{'\u00A0'}·{'\u00A0'}by {bounty.blue_claimant}
            </span>
          </div>
        )}

        {/* ── Sub-bounty count for Crusade mode ── */}
        {bounty.mode === 'CRUSADE' && bounty.sub_bounties && (
          <div
            style={{
              marginTop: 4,
              fontSize: 8,
              color: '#6A8099',
              display: 'flex',
              gap: 4,
            }}
          >
            <Users size={8} />
            <span>{bounty.sub_bounties.length} sub-bounties</span>
          </div>
        )}

        {/* Hover overlay */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            pointerEvents: 'none',
            borderRadius: 8,
            transition: 'background 0.2s ease',
          }}
          className="bounty-hover-overlay"
        />
      </div>
    </motion.div>
  );
}

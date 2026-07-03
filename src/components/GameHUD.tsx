'use client';

import React from 'react';
import {
  AlertTriangle,
  Clock,
  Zap,
  Swords,
  Users,
  Trophy,
  Crosshair,
} from 'lucide-react';

// ── Types ────────────────────────────────────────────────────────────────────

export type GameMode = 'SIEGE' | 'GOLF' | 'CRUSADE' | 'NONE';

export interface HUDStats {
  /** Current mode-specific stake/reputation (Siege) */
  stake?: number;
  /** Time remaining in seconds (Siege Purgatory) */
  timeLeft?: number;
  /** Current proof line count (Golf) */
  lines?: number;
  /** Original line count to beat (Golf) */
  linesOriginal?: number;
  /** Percentage improvement (Golf) */
  diff?: number;
  /** Number of solved sub-bounties (Crusade) */
  solved?: number;
  /** Total sub-bounties (Crusade) */
  total?: number;
  /** Player's Lindiwe reputation score */
  repScore?: number;
  /** Player's reputation rank */
  rank?: string;
}

interface GameHUDProps {
  mode: GameMode;
  stats?: HUDStats;
  /** Callback to switch game mode */
  onModeChange?: (mode: GameMode) => void;
  /** Available modes to show in switcher */
  availableModes?: GameMode[];
}

// ── Rank thresholds ──────────────────────────────────────────────────────────

function getRank(score: number): { title: string; color: string } {
  if (score >= 10000) return { title: 'Architect', color: '#F59E0B' };
  if (score >= 1000) return { title: 'Prover', color: '#A78BFA' };
  if (score >= 100) return { title: 'Scholar', color: '#60A5FA' };
  return { title: 'Neophyte', color: '#9CA3AF' };
}

// ── Component ─────────────────────────────────────────────────────────────────

export function GameHUD({
  mode,
  stats = {},
  onModeChange,
  availableModes = ['SIEGE', 'GOLF', 'CRUSADE'],
}: GameHUDProps) {
  const rank = stats.repScore ? getRank(stats.repScore) : null;

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        pointerEvents: 'auto',
        fontFamily: "'IBM Plex Mono', monospace",
      }}
    >
      {/* ── Reputation Badge ── */}
      {rank && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 4,
            padding: '2px 8px',
            borderRadius: 20,
            border: `1px solid ${rank.color}44`,
            background: `${rank.color}11`,
            fontSize: 9,
            color: rank.color,
          }}
        >
          <Trophy size={10} />
          <span style={{ fontWeight: 700 }}>{stats.repScore?.toLocaleString()}</span>
          <span style={{ opacity: 0.6 }}>{rank.title}</span>
        </div>
      )}

      {/* ── Mode Switcher ── */}
      {onModeChange && availableModes.length > 0 && (
        <div
          style={{
            display: 'flex',
            gap: 2,
            padding: 2,
            borderRadius: 8,
            background: 'rgba(0,0,0,0.3)',
            border: '1px solid rgba(255,255,255,0.06)',
          }}
        >
          {availableModes.map(m => {
            const isActive = mode === m;
            const icons: Record<GameMode, React.ReactNode> = {
              SIEGE: <Swords size={10} />,
              GOLF: <Zap size={10} />,
              CRUSADE: <Users size={10} />,
              NONE: <Crosshair size={10} />,
            };
            const labels: Record<GameMode, string> = {
              SIEGE: 'Siege',
              GOLF: 'Golf',
              CRUSADE: 'Crusade',
              NONE: 'Free',
            };
            const colors: Record<GameMode, string> = {
              SIEGE: '#EF4444',
              GOLF: '#3B82F6',
              CRUSADE: '#A855F7',
              NONE: '#6A8099',
            };
            return (
              <button
                key={m}
                onClick={() => onModeChange(m)}
                title={`Switch to ${labels[m]} mode`}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 3,
                  padding: '2px 6px',
                  borderRadius: 6,
                  border: 'none',
                  background: isActive ? `${colors[m]}22` : 'transparent',
                  color: isActive ? colors[m] : '#6A8099',
                  fontSize: 9,
                  fontWeight: isActive ? 700 : 400,
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
                onMouseEnter={e => {
                  if (!isActive) e.currentTarget.style.background = 'rgba(255,255,255,0.05)';
                }}
                onMouseLeave={e => {
                  if (!isActive) e.currentTarget.style.background = 'transparent';
                }}
              >
                {icons[m]}
                <span>{labels[m]}</span>
              </button>
            );
          })}
        </div>
      )}

      {/* ── SIEGE Mode HUD ── */}
      {mode === 'SIEGE' && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            padding: '2px 10px',
            borderRadius: 8,
            background: 'rgba(239,68,68,0.08)',
            border: '1px solid rgba(239,68,68,0.2)',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 4,
              fontSize: 9,
              color: '#EF4444',
              fontWeight: 700,
            }}
          >
            <AlertTriangle size={10} />
            <span>UNDER ATTACK</span>
          </div>
          {stats.timeLeft !== undefined && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 3,
                fontSize: 11,
                fontWeight: 700,
                color: stats.timeLeft <= 3600 ? '#EF4444' : '#FCA5A5',
              }}
            >
              <Clock size={10} />
              {formatSiegeTimer(stats.timeLeft)}
            </div>
          )}
          {stats.stake !== undefined && (
            <span style={{ fontSize: 9, color: '#F59E0B' }}>
              STAKE: {stats.stake} REP
            </span>
          )}
        </div>
      )}

      {/* ── GOLF Mode HUD ── */}
      {mode === 'GOLF' && stats.lines !== undefined && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            padding: '2px 10px',
            borderRadius: 20,
            background: 'rgba(15,15,17,0.8)',
            backdropFilter: 'blur(12px)',
            border: '1px solid rgba(59,130,246,0.2)',
          }}
        >
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
            <span style={{ fontSize: 8, color: '#6A8099' }}>CURRENT</span>
            <span style={{ fontSize: 12, fontFamily: "'IBM Plex Mono', monospace", color: '#D1D5DB' }}>
              {stats.lines}
              <span style={{ fontSize: 8, color: '#6A8099' }}> lines</span>
            </span>
          </div>
          <div style={{ width: 1, height: 24, background: 'rgba(255,255,255,0.08)' }} />
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
            <span style={{ fontSize: 8, color: '#6A8099' }}>TO BEAT</span>
            <span style={{ fontSize: 12, fontFamily: "'IBM Plex Mono', monospace", color: '#10B981' }}>
              -{stats.diff ?? 0}%
            </span>
          </div>
          {stats.linesOriginal && (
            <span style={{ fontSize: 8, color: '#6A8099', marginLeft: 4 }}>
              orig: {stats.linesOriginal}
            </span>
          )}
        </div>
      )}

      {/* ── CRUSADE Mode HUD ── */}
      {mode === 'CRUSADE' && stats.total !== undefined && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            padding: '2px 10px',
            borderRadius: 8,
            background: 'rgba(168,85,247,0.08)',
            border: '1px solid rgba(168,85,247,0.2)',
          }}
        >
          <Users size={10} style={{ color: '#A855F7' }} />
          <div
            style={{
              width: 60,
              height: 4,
              borderRadius: 2,
              background: 'rgba(255,255,255,0.1)',
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                width: `${((stats.solved ?? 0) / stats.total) * 100}%`,
                height: '100%',
                borderRadius: 2,
                background: '#A855F7',
                transition: 'width 0.5s ease',
              }}
            />
          </div>
          <span style={{ fontSize: 9, color: '#C4B5FD', fontWeight: 700 }}>
            {stats.solved ?? 0}/{stats.total}
          </span>
        </div>
      )}

      {/* ── NONE Mode (just rep) ── */}
      {mode === 'NONE' && rank && (
        <span style={{ fontSize: 8, color: '#6A8099' }}>
          {rank.title} · {stats.repScore?.toLocaleString()} REP
        </span>
      )}
    </div>
  );
}

function formatSiegeTimer(seconds: number): string {
  if (seconds <= 0) return '00:00:00';
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  const pad = (n: number) => n.toString().padStart(2, '0');
  return `${pad(h)}:${pad(m)}:${pad(s)}`;
}

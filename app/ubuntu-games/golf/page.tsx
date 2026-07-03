'use client';

import React, { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Zap, Trophy, Timer } from 'lucide-react';
import Link from 'next/link';
import { GameHUD, type GameMode, type HUDStats } from '../../../src/components/GameHUD';
import { ArenaTicker, type BountyData } from '../../../src/components/ArenaTicker';

export default function GolfLive() {
  const [gameMode, setGameMode] = useState<GameMode>('GOLF');
  const [hudStats, setHUDStats] = useState<HUDStats>({
    lines: 68, linesOriginal: 68, diff: 0,
    stake: 100, timeLeft: 3600,
    solved: 0, total: 1,
    repScore: 3400, rank: 'Prover',
  });

  const handleBountyClick = useCallback((bounty: BountyData) => {
    if (bounty.mode === 'GOLF' && bounty.lines_original) {
      setHUDStats(p => ({ ...p, lines: bounty.lines_original!, linesOriginal: bounty.lines_original!, diff: 0 }));
    }
  }, []);

  return (
    <div
      style={{
        height: '100vh',
        width: '100%',
        background: 'var(--void, #050505)',
        color: 'var(--text, #DCE2EA)',
        fontFamily: "'IBM Plex Mono', monospace",
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}
    >
      {/* ── Golf Header ── */}
      <div
        style={{
          height: 42,
          borderBottom: '1px solid rgba(59,130,246,0.25)',
          background: 'linear-gradient(180deg, rgba(59,130,246,0.06) 0%, transparent 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 16px',
          flexShrink: 0,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Link href="/ubuntu-games" style={{ textDecoration: 'none', color: 'inherit' }}>
            <motion.button
              whileTap={{ scale: 0.9 }}
              style={{
                background: 'none', border: '1px solid rgba(59,130,246,0.3)',
                borderRadius: 6, padding: '3px 8px', color: '#3B82F6',
                fontSize: 9, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4,
              }}
            >
              ← Back
            </motion.button>
          </Link>
          <Zap size={14} style={{ color: '#3B82F6' }} />
          <span style={{ fontSize: 12, fontWeight: 700, color: '#3B82F6', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
            Proof Golf
          </span>
          <span
            style={{
              fontSize: 9, padding: '1px 6px', borderRadius: 4,
              background: 'rgba(59,130,246,0.1)', color: '#60A5FA',
              border: '1px solid rgba(59,130,246,0.25)',
            }}
          >
            ⚡ SPEEDRUN
          </span>
        </div>
        <GameHUD mode={gameMode} stats={hudStats} onModeChange={setGameMode} />
      </div>

      {/* ── Arena Ticker ── */}
      <div style={{ flex: 1, overflow: 'hidden' }}>
        <ArenaTicker onBountyClick={handleBountyClick} />
      </div>
    </div>
  );
}

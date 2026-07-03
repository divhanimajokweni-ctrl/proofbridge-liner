'use client';

import React, { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  Swords, Shield, Skull, Clock, Trophy, Users, AlertTriangle,
} from 'lucide-react';
import Link from 'next/link';
import { GameHUD, type GameMode, type HUDStats } from '../../../src/components/GameHUD';
import { ArenaTicker, type BountyData } from '../../../src/components/ArenaTicker';

export default function SiegeLive() {
  const [gameMode, setGameMode] = useState<GameMode>('SIEGE');
  const [hudStats, setHUDStats] = useState<HUDStats>({
    stake: 500, timeLeft: 14 * 3600,
    lines: 68, linesOriginal: 68, diff: 0,
    solved: 47, total: 200,
    repScore: 3400, rank: 'Prover',
  });

  const handleBountyClick = useCallback((bounty: BountyData) => {
    if (bounty.purgatory_end) {
      const tl = Math.max(0, Math.floor((new Date(bounty.purgatory_end).getTime() - Date.now()) / 1000));
      setHUDStats(p => ({ ...p, timeLeft: tl, stake: Math.floor(bounty.rep_reward / 10) }));
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
      {/* ── Siege Header ── */}
      <div
        style={{
          height: 42,
          borderBottom: '1px solid rgba(239,68,68,0.25)',
          background: 'linear-gradient(180deg, rgba(239,68,68,0.08) 0%, transparent 100%)',
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
                background: 'none', border: '1px solid rgba(239,68,68,0.3)',
                borderRadius: 6, padding: '3px 8px', color: '#EF4444',
                fontSize: 9, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4,
              }}
            >
              ← Back
            </motion.button>
          </Link>
          <Swords size={14} style={{ color: '#EF4444' }} />
          <span style={{ fontSize: 12, fontWeight: 700, color: '#EF4444', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
            Siege Mode
          </span>
          <span
            style={{
              fontSize: 9, padding: '1px 6px', borderRadius: 4,
              background: 'rgba(239,68,68,0.15)', color: '#FCA5A5',
              border: '1px solid rgba(239,68,68,0.3)',
              animation: 'pulse 2s ease-in-out infinite',
            }}
          >
            ⚠ UNDER ATTACK
          </span>
        </div>
        <GameHUD mode={gameMode} stats={hudStats} onModeChange={setGameMode} />
      </div>

      {/* ── Arena Ticker ── */}
      <div style={{ flex: 1, overflow: 'hidden' }}>
        <ArenaTicker onBountyClick={handleBountyClick} />
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      `}</style>
    </div>
  );
}

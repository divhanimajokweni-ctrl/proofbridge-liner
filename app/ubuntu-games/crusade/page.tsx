'use client';

import React, { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Users, Trophy, Crosshair } from 'lucide-react';
import Link from 'next/link';
import { GameHUD, type GameMode, type HUDStats } from '../../../src/components/GameHUD';
import { ArenaTicker, type BountyData } from '../../../src/components/ArenaTicker';

export default function CrusadeLive() {
  const [gameMode, setGameMode] = useState<GameMode>('CRUSADE');
  const [hudStats, setHUDStats] = useState<HUDStats>({
    stake: 1000, timeLeft: 72 * 3600,
    lines: 0, linesOriginal: 0, diff: 0,
    solved: 47, total: 200,
    repScore: 3400, rank: 'Prover',
  });

  const handleBountyClick = useCallback((bounty: BountyData) => {
    if (bounty.mode === 'CRUSADE' && bounty.sub_bounties) {
      setHUDStats(p => ({
        ...p, total: bounty.sub_bounties!.length,
        solved: Math.floor(bounty.sub_bounties!.length * 0.235),
      }));
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
      {/* ── Crusade Header ── */}
      <div
        style={{
          height: 42,
          borderBottom: '1px solid rgba(168,85,247,0.25)',
          background: 'linear-gradient(180deg, rgba(168,85,247,0.08) 0%, transparent 100%)',
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
                background: 'none', border: '1px solid rgba(168,85,247,0.3)',
                borderRadius: 6, padding: '3px 8px', color: '#A855F7',
                fontSize: 9, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4,
              }}
            >
              ← Back
            </motion.button>
          </Link>
          <Users size={14} style={{ color: '#A855F7' }} />
          <span style={{ fontSize: 12, fontWeight: 700, color: '#A855F7', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
            Crusade Raid
          </span>
          <span
            style={{
              fontSize: 9, padding: '1px 6px', borderRadius: 4,
              background: 'rgba(168,85,247,0.1)', color: '#C4B5FD',
              border: '1px solid rgba(168,85,247,0.25)',
            }}
          >
            👥 CO-OP RAID
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

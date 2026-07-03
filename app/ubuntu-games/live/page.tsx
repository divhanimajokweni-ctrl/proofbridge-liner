'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Swords } from 'lucide-react';
import { VillageFeed } from '../../../src/components/VillageFeed';
import { GameHUD, type GameMode, type HUDStats } from '../../../src/components/GameHUD';

export default function UbuntuGamesLive() {
  const [gameMode, setGameMode] = useState<GameMode>('NONE');
  const [hudStats, setHUDStats] = useState<HUDStats>({
    stake: 500, timeLeft: 14 * 3600,
    lines: 68, linesOriginal: 68, diff: 0,
    solved: 47, total: 200,
    repScore: 3400, rank: 'Prover',
  });

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
      {/* ── Top Bar ── */}
      <div
        style={{
          height: 38,
          borderBottom: '1px solid var(--border, #2E2E32)',
          background: 'rgba(15,15,17,0.9)',
          backdropFilter: 'blur(12px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 16px',
          flexShrink: 0,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Swords size={14} style={{ color: '#EF4444' }} />
          <span style={{ fontSize: 11, fontWeight: 700, color: '#D1D5DB', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
            UbuntuGames · Live
          </span>
          <span
            style={{
              fontSize: 9, padding: '1px 6px', borderRadius: 4,
              background: 'rgba(16,185,129,0.1)', color: '#10B981', border: '1px solid rgba(16,185,129,0.25)',
            }}
          >
            ● STREAMING
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <GameHUD mode={gameMode} stats={hudStats} onModeChange={setGameMode} />
        </div>
      </div>

      {/* ── Main Content: Feed ── */}
      <div style={{ flex: 1, overflow: 'hidden', position: 'relative' }}>
        <VillageFeed />
      </div>
    </div>
  );
}

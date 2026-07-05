'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Swords, Zap, Shield, Trophy, Skull, Clock, Users, ChevronRight,
  ArrowDown, ArrowUp, AlertTriangle, Bug, Dna, Sparkles, Eye,
} from 'lucide-react';
import Link from 'next/link';

// ─── Types ────────────────────────────────────────────────────────────────────

type Phase = 'hub' | 'raid' | 'result' | 'mutations' | 'radar';

interface AntArchetype {
  id: string; name: string; color: string; hp: number;
  dnaValue: number; jellyValue: number; icon: string; size: number;
}

const ANT_ARCHETYPES: AntArchetype[] = [
  { id: 'worker',      name: 'Worker Drone',   color: '#8B6914', hp: 1,  dnaValue: 3,  jellyValue: 0, icon: '\uD83D\uDC1C', size: 18 },
  { id: 'larvae',      name: 'Larvae',         color: '#F5F5DC', hp: 0,  dnaValue: 8,  jellyValue: 0, icon: '\uD83E\uDD5A', size: 16 },
  { id: 'acid_spitter',name: 'Acid Spitter',   color: '#7BC67E', hp: 3,  dnaValue: 12, jellyValue: 0, icon: '\uD83D\uDCA7', size: 20 },
  { id: 'soldier',     name: 'Soldier Ant',    color: '#C62828', hp: 5,  dnaValue: 18, jellyValue: 0, icon: '\u2694\uFE0F', size: 24 },
  { id: 'queens_guard',name: "Queen's Guard",  color: '#7B1FA2', hp: 12, dnaValue: 0,  jellyValue: 5, icon: '\uD83D\uDC51', size: 30 },
];

const MUTATIONS = [
  { id: 'elasticity', name: 'Elasticity', color: '#4FC3F7', icon: 'settings-input-component', desc: 'Agility & Range',
    tiers: [
      { tier: 1, name: 'Hyper-Tensile Fibers', cost: 50, effect: '+25% Range' },
      { tier: 2, name: 'Prehensile Tip',       cost: 120, effect: 'Auto-Corner' },
      { tier: 3, name: 'Snare Micro-Barbs',    cost: 280, effect: 'Multi-Grab' },
    ]},
  { id: 'gastronomy', name: 'Gastronomy', color: '#EF9A9A', icon: 'local-dining', desc: 'Resilience & Combat',
    tiers: [
      { tier: 1, name: 'Chitinous Shielding', cost: 60, effect: '+3 Sting Block' },
      { tier: 2, name: 'Acidic Saliva',       cost: 150, effect: 'Wall Dissolve' },
      { tier: 3, name: 'Pheromone Mimicry',   cost: 320, effect: '5s Cloak' },
    ]},
  { id: 'sensory', name: 'Sensory', color: '#A5D6A7', icon: 'waves', desc: 'Detection & Strategy',
    tiers: [
      { tier: 1, name: 'Seismic Whiskers',    cost: 70, effect: 'Seismic Map' },
      { tier: 2, name: 'Thermal Olfaction',   cost: 180, effect: 'Thermal Vision' },
      { tier: 3, name: 'Apex Intuition',      cost: 350, effect: 'Bullet Time' },
    ]},
];

interface GameState {
  workerDNA: number;
  royalJelly: number;
  highestDepth: number;
  raidsCompleted: number;
  bossesDefeated: number;
  unlockedMutations: Record<string, number>;
}

interface RaidAnt {
  id: string;
  archetype: AntArchetype;
  x: number;
  y: number;
  captured: boolean;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function uid(): string {
  return Math.random().toString(36).slice(2, 10);
}

function clamp(v: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, v));
}

// ─── Constants ─────────────────────────────────────────────────────────────────

const ZONES = [
  { maxDepth: 20, label: 'ZONE 1: FORAGING COMMONS', bg: '#1A0F00' },
  { maxDepth: 50, label: 'ZONE 2: NURSERY CHAMBERS', bg: '#0D0A00' },
  { maxDepth: 100, label: 'ZONE 3: THE FORBIDDEN CORE', bg: '#0A0000' },
];

const COLORS = {
  void: '#050505',
  substrate: '#0F0F11',
  text: '#DCE2EA',
  textMuted: '#6A8099',
  accent: '#D4A017',
  royal: '#9B59B6',
  danger: '#EF4444',
  success: '#10B981',
  border: '#2E2E32',
};

// ─── Main Component ──────────────────────────────────────────────────────────

export default function AntFeastPage() {
  const [phase, setPhase] = useState<Phase>('hub');
  const [gameState, setGameState] = useState<GameState>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('ant_feast_state');
      if (saved) {
        try { return JSON.parse(saved); } catch {}
      }
    }
    return {
      workerDNA: 200,
      royalJelly: 2,
      highestDepth: 12,
      raidsCompleted: 0,
      bossesDefeated: 0,
      unlockedMutations: {},
    };
  });

  // Persist game state
  useEffect(() => {
    localStorage.setItem('ant_feast_state', JSON.stringify(gameState));
  }, [gameState]);

  // ── Raid State ──
  const [raidActive, setRaidActive] = useState(false);
  const [health, setHealth] = useState(100);
  const [stamina, setStamina] = useState(100);
  const [depth, setDepth] = useState(0);
  const [dnaThisRun, setDnaThisRun] = useState(0);
  const [jellyThisRun, setJellyThisRun] = useState(0);
  const [antsCaptured, setAntsCaptured] = useState(0);
  const [timer, setTimer] = useState(0);
  const [alarmLevel, setAlarmLevel] = useState(0);
  const [collapseWarning, setCollapseWarning] = useState(false);
  const [collapseCount, setCollapseCount] = useState(0);
  const [message, setMessage] = useState('');
  const [ants, setAnts] = useState<RaidAnt[]>([]);
  const [bossPhase, setBossPhase] = useState(0);
  const [bossDefeated, setBossDefeated] = useState(false);

  const flashRef = useRef<number | null>(null);

  const showMsg = useCallback((msg: string, dur = 2000) => {
    setMessage(msg);
    if (flashRef.current) clearTimeout(flashRef.current);
    flashRef.current = window.setTimeout(() => setMessage(''), dur);
  }, []);

  // ── Raid Tick Loop ──
  useEffect(() => {
    if (!raidActive) return;

    const spawnInt = setInterval(() => {
      const zoneIdx = depth < 20 ? 0 : depth < 50 ? 1 : 2;
      const pool = zoneIdx === 0
        ? [ANT_ARCHETYPES[0], ANT_ARCHETYPES[1]]
        : zoneIdx === 1
          ? [ANT_ARCHETYPES[0], ANT_ARCHETYPES[1], ANT_ARCHETYPES[2], ANT_ARCHETYPES[3]]
          : [ANT_ARCHETYPES[2], ANT_ARCHETYPES[3], ANT_ARCHETYPES[4]];
      const arch = pool[Math.floor(Math.random() * pool.length)];
      setAnts(prev => {
        if (prev.length >= 12) return prev;
        return [...prev, { id: uid(), archetype: arch, x: 20 + Math.random() * 300, y: 60 + Math.random() * 240, captured: false }];
      });
    }, 1800);

    const timerInt = setInterval(() => {
      setTimer(t => t + 1);
      if (Math.random() < 0.06) {
        setStamina(s => Math.max(0, s - 3));
      }
    }, 1000);

    const collapseInt = setInterval(() => {
      if (collapseWarning) {
        setCollapseCount(prev => {
          if (prev <= 1) {
            setCollapseWarning(false);
            setHealth(h => Math.max(0, h - 30));
            showMsg('\uD83D\uDCA5 TUNNEL COLLAPSED! -30 HP!');
            return 0;
          }
          return prev - 1;
        });
      }
    }, 1000);

    const alarmInt = setInterval(() => {
      setAlarmLevel(a => Math.max(0, a - (Math.random() < 0.3 ? 1 : 0)));
    }, 5000);

    return () => {
      clearInterval(spawnInt);
      clearInterval(timerInt);
      clearInterval(collapseInt);
      clearInterval(alarmInt);
    };
  }, [raidActive, collapseWarning, depth, showMsg]);

  // Health <= 0
  useEffect(() => {
    if (health <= 0 && raidActive) {
      setRaidActive(false);
      showMsg('\uD83D\uDC80 TONGUE SEVERED! Mission failed.');
      setTimeout(() => setPhase('result'), 1500);
    }
  }, [health, raidActive, showMsg]);

  // ── Handlers ──
  const startRaid = useCallback(() => {
    setPhase('raid');
    setRaidActive(true);
    setHealth(100);
    setStamina(100);
    setDepth(0);
    setDnaThisRun(0);
    setJellyThisRun(0);
    setAntsCaptured(0);
    setTimer(0);
    setAlarmLevel(0);
    setCollapseWarning(false);
    setCollapseCount(0);
    setAnts([]);
    setBossPhase(0);
    setBossDefeated(false);
    setMessage('');
  }, []);

  const captureAnt = useCallback((antId: string) => {
    let captured: RaidAnt | undefined;
    setAnts(prev => {
      const idx = prev.findIndex(a => a.id === antId);
      if (idx === -1) return prev;
      captured = prev[idx];
      return prev.filter(a => a.id !== antId);
    });
    if (!captured) return;
    const arch = captured.archetype;
    setDnaThisRun(d => d + arch.dnaValue);
    setJellyThisRun(j => j + arch.jellyValue);
    setAntsCaptured(c => c + 1);

    if (arch.id === 'acid_spitter' || arch.id === 'soldier') {
      setStamina(s => Math.max(0, s - 10));
      showMsg(arch.id === 'soldier' ? '\u2694\uFE0F Soldier latched! -10 Stamina' : '\uD83D\uDCA7 Acid hit! -10 Stamina');
    }
    if (arch.id === 'queens_guard') {
      setHealth(h => Math.max(0, h - 20));
      showMsg("\uD83D\uDC51 Queen's Guard struck! -20 HP!", 2000);
      setAlarmLevel(3);
    }
  }, [showMsg]);

  const descend = useCallback(() => {
    if (stamina < 15) {
      showMsg('\u26A1 Too exhausted to descend!');
      return;
    }
    const inc = 5 + Math.floor(Math.random() * 5);
    setDepth(d => Math.min(100, d + inc));
    setStamina(s => Math.max(0, s - 8));
    showMsg('\u2B07 Descending deeper...', 1200);
    if (Math.random() < 0.3) {
      setCollapseWarning(true);
      setCollapseCount(4);
      showMsg('\u26A0\uFE0F Structural collapse in 4 seconds!');
    }
  }, [stamina, showMsg]);

  const panicRetract = useCallback(() => {
    const sacrificed = Math.floor(antsCaptured * 0.4);
    setAntsCaptured(c => Math.max(0, c - sacrificed));
    setAlarmLevel(0);
    setCollapseWarning(false);
    setCollapseCount(0);
    setStamina(s => Math.min(100, s + 20));
    showMsg('\u26A1 PANIC RETRACT! Lost ' + sacrificed + ' captures. Stamina restored.', 2500);
  }, [antsCaptured, showMsg]);

  const endRaid = useCallback(() => {
    setRaidActive(false);
    setPhase('result');
  }, []);

  const saveRaid = useCallback(() => {
    setGameState(prev => ({
      workerDNA: prev.workerDNA + dnaThisRun,
      royalJelly: prev.royalJelly + jellyThisRun,
      highestDepth: Math.max(prev.highestDepth, depth),
      raidsCompleted: prev.raidsCompleted + (health > 0 ? 1 : 0),
      bossesDefeated: prev.bossesDefeated + (bossDefeated ? 1 : 0),
      unlockedMutations: prev.unlockedMutations,
    }));
    setPhase('hub');
  }, [dnaThisRun, jellyThisRun, depth, health, bossDefeated]);

  const getZone = () => ZONES.find(z => depth <= z.maxDepth) || ZONES[2];

  // ── Render: Hub ──
  if (phase === 'hub') {
    const zoneIdx = gameState.highestDepth < 20 ? 0 : gameState.highestDepth < 50 ? 1 : 2;
    return (
      <div style={{ height: '100vh', width: '100%', background: COLORS.void, color: COLORS.text, fontFamily: "'IBM Plex Mono', monospace", overflow: 'auto', position: 'relative' }}>
        <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0,
          backgroundImage: 'linear-gradient(rgba(212,160,23,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(212,160,23,0.03) 1px, transparent 1px)',
          backgroundSize: '48px 48px' }} />
        <div style={{ position: 'relative', zIndex: 1, maxWidth: 900, margin: '0 auto', padding: '24px' }}>
          {/* Header */}
          <header style={{ marginBottom: 32, textAlign: 'center' }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 10, padding: '4px 12px', borderRadius: 20,
              border: '1px solid rgba(212,160,23,0.3)', background: 'rgba(212,160,23,0.08)', fontSize: 9, color: COLORS.accent, fontWeight: 700, marginBottom: 12,
              textTransform: 'uppercase', letterSpacing: '0.1em' }}>
              <Bug size={10} /> Ant Feast · Alpha
            </div>
            <h1 style={{ fontSize: 36, fontWeight: 800, color: '#FFF', fontFamily: "'Syne', sans-serif", letterSpacing: '-0.03em', marginBottom: 8 }}>
              \uD83D\uDC1C ANT FEAST
            </h1>
            <p style={{ fontSize: 11, color: COLORS.textMuted, maxWidth: 500, margin: '0 auto', lineHeight: 1.6 }}>
              Control the anteater&apos;s tongue. Raid the ant colony. Collect DNA.
              Descend deeper. Survive the Queen&apos;s Guard.
            </p>
          </header>

          {/* Stats */}
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', marginBottom: 24, flexWrap: 'wrap' }}>
            {[
              { label: '\uD83E\uDDEC DNA', value: gameState.workerDNA, color: COLORS.accent },
              { label: '\uD83D\uDC51 Jelly', value: gameState.royalJelly, color: COLORS.royal },
              { label: '\uD83D\uDCCF Max Depth', value: gameState.highestDepth + 'm', color: COLORS.text },
              { label: '\u2694\uFE0F Raids', value: gameState.raidsCompleted, color: COLORS.textMuted },
              { label: '\uD83D\uDC51 Bosses', value: gameState.bossesDefeated, color: COLORS.royal },
            ].map(s => (
              <div key={s.label} style={{ background: COLORS.substrate, borderRadius: 8, padding: '10px 16px', border: '1px solid ' + COLORS.border, textAlign: 'center', minWidth: 100 }}>
                <div style={{ color: COLORS.textMuted, fontSize: 9, marginBottom: 4 }}>{s.label}</div>
                <div style={{ color: s.color, fontSize: 20, fontWeight: 700 }}>{s.value}</div>
              </div>
            ))}
          </div>

          {/* Colony Preview */}
          <div style={{ borderRadius: 12, overflow: 'hidden', marginBottom: 20, position: 'relative' }}>
            <div style={{ height: 140, background: 'linear-gradient(180deg, #3D1F08 0%, #1A0F00 40%, #0A0000 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column' }}>
              <div style={{ fontSize: 48, marginBottom: 8, opacity: 0.6 }}>\uD83D\uDC1C</div>
              <div style={{ color: COLORS.text, fontSize: 13, fontWeight: 700, marginBottom: 4 }}>COLONY ALPHA-7 DETECTED</div>
              <div style={{ color: COLORS.textMuted, fontSize: 10 }}>3 Entry Points · Depth: ~{ZONES[zoneIdx].label.split(':')[1] || '60m'} · High Activity</div>
            </div>
            <div style={{ position: 'absolute', bottom: 12, left: 0, right: 0, display: 'flex', justifyContent: 'center' }}>
              <motion.button
                whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                onClick={startRaid}
                style={{ background: '#8B4513', border: '2px solid ' + COLORS.accent, borderRadius: 24, padding: '10px 32px', color: COLORS.text, fontWeight: 700, fontSize: 14, cursor: 'pointer', letterSpacing: 1 }}
              >
                \u2B07 BEGIN RAID
              </motion.button>
            </div>
          </div>

          {/* Quick Actions */}
          <div style={{ display: 'flex', gap: 10, marginBottom: 20 }}>
            <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
              onClick={() => setPhase('mutations')}
              style={{ flex: 1, background: COLORS.substrate, border: '1px solid rgba(79,195,247,0.3)', borderRadius: 10, padding: 14, cursor: 'pointer', color: COLORS.text, textAlign: 'center' }}>
              <div style={{ fontSize: 11, color: '#4FC3F7', fontWeight: 700 }}>\uD83E\uDDEC MUTATIONS</div>
              <div style={{ fontSize: 9, color: COLORS.textMuted, marginTop: 4 }}>Upgrade Tree</div>
            </motion.button>
            <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
              onClick={() => setPhase('radar')}
              style={{ flex: 1, background: COLORS.substrate, border: '1px solid rgba(165,214,167,0.3)', borderRadius: 10, padding: 14, cursor: 'pointer', color: COLORS.text, textAlign: 'center' }}>
              <div style={{ fontSize: 11, color: '#A5D6A7', fontWeight: 700 }}>\uD83D\uDEF0\uFE0F RADAR</div>
              <div style={{ fontSize: 9, color: COLORS.textMuted, marginTop: 4 }}>Colony Scan</div>
            </motion.button>
          </div>

          {/* Back to Games */}
          <div style={{ textAlign: 'center', marginTop: 24 }}>
            <Link href="/ubuntu-games" style={{ fontSize: 10, color: COLORS.textMuted, textDecoration: 'none' }}>
              \u2190 Back to Ubuntu Games
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // ── Render: Mutations ──
  if (phase === 'mutations') {
    return (
      <div style={{ height: '100vh', width: '100%', background: COLORS.void, color: COLORS.text, fontFamily: "'IBM Plex Mono', monospace", overflow: 'auto' }}>
        <div style={{ maxWidth: 900, margin: '0 auto', padding: 24 }}>
          <div style={{ textAlign: 'center', marginBottom: 24 }}>
            <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 8, color: '#FFF' }}>\uD83E\uDDEC GENETIC MUTATION NURSERY</h2>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
              <span style={{ color: COLORS.accent, fontWeight: 700 }}>\uD83E\uDDEC {gameState.workerDNA}</span>
              <span style={{ color: COLORS.royal, fontWeight: 700 }}>\uD83D\uDC51 {gameState.royalJelly}</span>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
            {MUTATIONS.map(branch => {
              const unlockedTier = gameState.unlockedMutations[branch.id] || 0;
              return (
                <div key={branch.id} style={{ background: COLORS.substrate, border: '1px solid ' + COLORS.border, borderRadius: 10, padding: 16 }}>
                  <div style={{ borderBottom: '3px solid ' + branch.color, paddingBottom: 8, marginBottom: 16, textAlign: 'center' }}>
                    <div style={{ color: branch.color, fontSize: 14, fontWeight: 700 }}>{branch.name}</div>
                    <div style={{ color: COLORS.textMuted, fontSize: 10 }}>{branch.desc}</div>
                    <div style={{ color: branch.color, fontSize: 11, fontWeight: 700, marginTop: 4 }}>{unlockedTier}/{branch.tiers.length}</div>
                  </div>
                  {branch.tiers.map((tier, idx) => {
                    const isUnlocked = unlockedTier >= tier.tier;
                    const canUnlock = unlockedTier === tier.tier - 1;
                    const affordable = tier.cost <= gameState.workerDNA;
                    return (
                      <div key={tier.tier} style={{ marginBottom: 12, opacity: isUnlocked ? 1 : 0.5 }}>
                        {idx > 0 && <div style={{ width: 2, height: 16, background: COLORS.border, margin: '0 auto' }} />}
                        <motion.button
                          whileHover={canUnlock && affordable ? { scale: 1.03 } : {}}
                          onClick={() => {
                            if (!canUnlock || !affordable) return;
                            setGameState(prev => ({
                              ...prev,
                              workerDNA: prev.workerDNA - tier.cost,
                              unlockedMutations: { ...prev.unlockedMutations, [branch.id]: tier.tier },
                            }));
                          }}
                          disabled={!canUnlock || !affordable}
                          style={{
                            width: '100%', padding: 12, borderRadius: 8, cursor: canUnlock && affordable ? 'pointer' : 'default',
                            background: isUnlocked ? 'rgba(0,0,0,0.3)' : canUnlock && affordable ? '#1A1500' : '#151515',
                            border: '1px solid ' + (isUnlocked ? branch.color : canUnlock && affordable ? COLORS.accent : '#333'),
                            color: COLORS.text, textAlign: 'center', fontFamily: 'inherit',
                          }}>
                          <div style={{ fontSize: 9, color: COLORS.textMuted }}>TIER {tier.tier}</div>
                          <div style={{ fontSize: 12, fontWeight: 700, color: isUnlocked ? branch.color : COLORS.text }}>{tier.name}</div>
                          <div style={{ fontSize: 9, color: isUnlocked ? COLORS.success : COLORS.textMuted, marginTop: 4 }}>
                            {isUnlocked ? '\u2705 UNLOCKED' : `\uD83E\uDDEC ${tier.cost}`}
                          </div>
                          {!isUnlocked && <div style={{ fontSize: 8, color: COLORS.textMuted, marginTop: 2 }}>{tier.effect}</div>}
                        </motion.button>
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>

          <div style={{ textAlign: 'center', marginTop: 24 }}>
            <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
              onClick={() => setPhase('hub')}
              style={{ background: COLORS.substrate, border: '1px solid ' + COLORS.border, borderRadius: 8, padding: '8px 24px', color: COLORS.text, cursor: 'pointer', fontFamily: 'inherit', fontSize: 11 }}>
              \u2190 Back to Colony Hub
            </motion.button>
          </div>
        </div>
      </div>
    );
  }

  // ── Render: Radar ──
  if (phase === 'radar') {
    const sensorTier = gameState.unlockedMutations.sensory || 0;
    const radarData = [
      { colonyId: 'c1', targetClassification: 'FORAGING COMMONS', threatLevel: 'LOW', coordinates: { latitude: '12.4N', longitude: '8.2W' }, sensorReading: '0.82 p/u' },
      { colonyId: 'c2', targetClassification: 'NURSERY CHAMBER', threatLevel: 'MEDIUM', coordinates: { latitude: '28.7N', longitude: '15.3W' }, sensorReading: '1.45 p/u' },
      { colonyId: 'c3', targetClassification: 'QUEEN CORE NODE', threatLevel: 'CRITICAL', coordinates: { latitude: '45.1N', longitude: '22.8W' }, sensorReading: '3.92 p/u' },
    ];
    return (
      <div style={{ height: '100vh', width: '100%', background: '#0A0A0A', color: COLORS.text, fontFamily: "'IBM Plex Mono', monospace", overflow: 'auto' }}>
        <div style={{ maxWidth: 700, margin: '0 auto', padding: 24 }}>
          <div style={{ borderBottom: '1px solid #222', paddingBottom: 10, marginBottom: 16, textAlign: 'center' }}>
            <h2 style={{ fontSize: 16, fontWeight: 700, color: '#A5D6A7', letterSpacing: 1 }}>\uD83D\uDEF0\uFE0F SEISMIC SUBSURFACE RADAR</h2>
            <div style={{ color: '#666', fontSize: 10, marginTop: 4 }}>SENSORY LEVEL: TIER {sensorTier} · CONFIGURATION: {sensorTier > 0 ? 'STABLE' : 'UNSTABLE'}</div>
          </div>
          {radarData.map(d => {
            const threatColor = d.threatLevel === 'CRITICAL' ? '#FF5252' : d.threatLevel === 'MEDIUM' ? '#FFD700' : '#4CAF50';
            return (
              <div key={d.colonyId} style={{ background: '#141414', border: '1px solid #262626', borderRadius: 6, padding: 12, marginBottom: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                  <span style={{ fontWeight: 700, fontSize: 13 }}>{d.targetClassification}</span>
                  <span style={{ background: threatColor, color: '#000', padding: '2px 8px', borderRadius: 4, fontSize: 10, fontWeight: 900 }}>{d.threatLevel}</span>
                </div>
                <div style={{ display: 'flex', gap: 12 }}>
                  <div style={{ flex: 1 }}><div style={{ color: '#555', fontSize: 9, fontWeight: 700 }}>LATITUDE</div><div style={{ fontSize: 12 }}>{d.coordinates.latitude}</div></div>
                  <div style={{ flex: 1 }}><div style={{ color: '#555', fontSize: 9, fontWeight: 700 }}>LONGITUDE</div><div style={{ fontSize: 12 }}>{d.coordinates.longitude}</div></div>
                  <div style={{ flex: 1 }}><div style={{ color: '#555', fontSize: 9, fontWeight: 700 }}>PULSE DENSITY</div><div style={{ fontSize: 12 }}>{d.sensorReading}</div></div>
                </div>
                {sensorTier === 0 && (
                  <div style={{ marginTop: 8, background: '#2C1616', padding: 6, borderRadius: 4, textAlign: 'center' }}>
                    <span style={{ color: '#FF8A80', fontSize: 10, fontWeight: 700 }}>\u26A0\uFE0F HIGH VARIANCE: Upgrade Sensory in Lab</span>
                  </div>
                )}
              </div>
            );
          })}
          <div style={{ textAlign: 'center', marginTop: 16 }}>
            <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
              onClick={() => setPhase('hub')}
              style={{ background: COLORS.substrate, border: '1px solid ' + COLORS.border, borderRadius: 8, padding: '8px 24px', color: COLORS.text, cursor: 'pointer', fontFamily: 'inherit', fontSize: 11 }}>
              \u2190 Back to Colony Hub
            </motion.button>
          </div>
        </div>
      </div>
    );
  }

  // ── Render: Raid ──
  if (phase === 'raid') {
    const zone = getZone();
    const alarmBorder = alarmLevel === 0 ? 'transparent' : alarmLevel === 1 ? '#F39C12' : alarmLevel === 2 ? '#E67E22' : '#E74C3C';

    return (
      <div style={{ height: '100vh', width: '100%', background: zone.bg, color: COLORS.text, fontFamily: "'IBM Plex Mono', monospace", display: 'flex', flexDirection: 'column', overflow: 'hidden', position: 'relative' }}>
        {/* Background texture */}
        <div style={{ position: 'absolute', inset: 0, opacity: 0.06, background: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.3) 2px, rgba(0,0,0,0.3) 4px)' }} />

        {/* HUD */}
        <div style={{ position: 'relative', zIndex: 10, padding: '8px 12px', background: 'rgba(0,0,0,0.6)', borderBottom: '3px solid ' + alarmBorder }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
            <span style={{ color: alarmLevel > 0 ? '#FF4444' : COLORS.textMuted, fontSize: 10 }}>
              {alarmLevel === 0 ? '\uD83D\uDFE2 QUIET' : alarmLevel === 1 ? '\uD83D\uDFE1 ALERT' : alarmLevel === 2 ? '\uD83D\uDFE0 ALARM' : '\uD83D\uDD34 SWARM!'}
            </span>
            <span style={{ color: COLORS.textMuted, fontSize: 10, fontWeight: 700 }}>{zone.label}</span>
            <span style={{ color: COLORS.accent, fontSize: 10 }}>\u23F1 {String(Math.floor(timer / 60)).padStart(2, '0')}:{String(timer % 60).padStart(2, '0')}</span>
          </div>

          {/* HP Bar */}
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: 3 }}>
            <span style={{ color: '#FF9999', fontSize: 9, width: 20 }}>\u2764\uFE0F</span>
            <div style={{ flex: 1, height: 6, background: '#330000', borderRadius: 3, marginRight: 8 }}>
              <div style={{ height: '100%', width: health + '%', background: health > 60 ? '#FF9999' : health > 30 ? '#FF4444' : '#8B0000', borderRadius: 3 }} />
            </div>
            <span style={{ color: '#FF9999', fontSize: 9, width: 28, textAlign: 'right' }}>{health}%</span>
          </div>
          {/* Stamina Bar */}
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: 3 }}>
            <span style={{ color: '#9999FF', fontSize: 9, width: 20 }}>\u26A1</span>
            <div style={{ flex: 1, height: 6, background: '#001133', borderRadius: 3, marginRight: 8 }}>
              <div style={{ height: '100%', width: stamina + '%', background: '#4FC3F7', borderRadius: 3 }} />
            </div>
            <span style={{ color: '#4FC3F7', fontSize: 9, width: 28, textAlign: 'right' }}>{stamina}%</span>
          </div>
          {/* Depth indicator */}
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <span style={{ color: COLORS.accent, fontSize: 9, width: 20 }}>\uD83D\uDCCF</span>
            <span style={{ color: COLORS.accent, fontSize: 9, fontWeight: 700 }}>{depth}m</span>
            <span style={{ marginLeft: 12, color: COLORS.accent, fontSize: 9 }}>\uD83E\uDDEC +{dnaThisRun}</span>
            {jellyThisRun > 0 && <span style={{ marginLeft: 8, color: COLORS.royal, fontSize: 9 }}>\uD83D\uDC51 +{jellyThisRun}</span>}
            <span style={{ marginLeft: 8, color: COLORS.textMuted, fontSize: 9 }}>\uD83D\uDC1C {antsCaptured}</span>
          </div>
        </div>

        {/* Message bar */}
        {message && (
          <div style={{ position: 'relative', zIndex: 10, background: 'rgba(0,0,0,0.85)', padding: '6px 16px', textAlign: 'center' }}>
            <span style={{ fontSize: 11 }}>{message}</span>
          </div>
        )}

        {/* Collapse warning */}
        {collapseWarning && (
          <div style={{ position: 'relative', zIndex: 10, background: COLORS.danger, padding: 5, textAlign: 'center' }}>
            <span style={{ color: '#FFF', fontSize: 12, fontWeight: 700 }}>
              \u26A0\uFE0F STRUCTURAL COLLAPSE IN {collapseCount}s \u2014 RETRACT NOW!
            </span>
          </div>
        )}

        {/* Ant field */}
        <div style={{ flex: 1, position: 'relative', zIndex: 5, overflow: 'hidden' }}>
          {/* Tongue visual */}
          <div style={{ position: 'absolute', top: '45%', left: '50%', marginLeft: -2, width: 4, height: '55%', background: health > 60 ? '#FFB3BA' : health > 30 ? '#FF6B6B' : '#C0392B', borderRadius: 2, opacity: 0.6 }} />
          <div style={{ position: 'absolute', top: 10, left: '50%', marginLeft: -16, width: 32, height: 10, background: health > 60 ? '#FFB3BA' : health > 30 ? '#FF6B6B' : '#C0392B', borderRadius: 5, opacity: 0.8 }} />

          {/* Ants */}
          {ants.map(ant => (
            <motion.button
              key={ant.id}
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0 }}
              onClick={() => captureAnt(ant.id)}
              style={{
                position: 'absolute', left: ant.x, top: ant.y,
                width: ant.archetype.size + 8, height: ant.archetype.size + 8,
                borderRadius: '50%', background: ant.archetype.color + '44',
                border: '1px solid ' + ant.archetype.color,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer', fontSize: ant.archetype.size - 6,
              }}
              title={ant.archetype.name}
            >
              {ant.archetype.icon}
            </motion.button>
          ))}
        </div>

        {/* Controls */}
        <div style={{ position: 'relative', zIndex: 10, background: 'rgba(0,0,0,0.8)', padding: '10px 12px' }}>
          <div style={{ display: 'flex', gap: 6, marginBottom: 6 }}>
            <motion.button whileTap={{ scale: 0.95 }} onClick={descend}
              style={{ flex: 1, background: '#8B4513', border: '1px solid ' + COLORS.accent, borderRadius: 8, padding: 10, color: COLORS.text, fontWeight: 700, fontSize: 11, cursor: 'pointer', fontFamily: 'inherit' }}>
              \u2B07 DESCEND
            </motion.button>
            <motion.button whileTap={{ scale: 0.95 }} onClick={panicRetract}
              style={{ flex: 1, background: '#4A0000', border: '2px solid ' + COLORS.danger, borderRadius: 8, padding: 10, color: '#FF6666', fontWeight: 700, fontSize: 11, cursor: 'pointer', fontFamily: 'inherit' }}>
              \u26A1 RETRACT
            </motion.button>
          </div>
          <motion.button whileTap={{ scale: 0.95 }} onClick={endRaid}
            style={{ width: '100%', background: '#2D2D2D', border: '1px solid #555', borderRadius: 8, padding: 8, color: COLORS.textMuted, fontSize: 10, cursor: 'pointer', fontFamily: 'inherit' }}>
            \u21A9 SURFACE
          </motion.button>
        </div>
      </div>
    );
  }

  // ── Render: Result ──
  if (phase === 'result') {
    const success = health > 0;
    const resultColor = bossDefeated ? COLORS.royal : success ? COLORS.success : COLORS.danger;
    const resultTitle = bossDefeated ? '\uD83D\uDC51 QUEEN DEFEATED!' : success ? '\u2705 SUCCESSFUL EXTRACTION' : '\uD83D\uDC80 RUN ENDED';

    return (
      <div style={{ height: '100vh', width: '100%', background: 'rgba(0,0,0,0.9)', color: COLORS.text, fontFamily: "'IBM Plex Mono', monospace", display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
        <motion.div
          initial={{ y: '100%' }} animate={{ y: 0 }}
          style={{ width: '100%', maxWidth: 500, background: '#1E0F05', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24 }}
        >
          <div style={{ width: 40, height: 4, background: COLORS.border, borderRadius: 2, margin: '0 auto 16px' }} />
          <h2 style={{ color: resultColor, fontSize: 20, fontWeight: 700, textAlign: 'center', marginBottom: 4 }}>{resultTitle}</h2>
          <p style={{ color: COLORS.textMuted, fontSize: 11, textAlign: 'center', marginBottom: 20 }}>RAID COMPLETE \u2014 SURFACE RETURN</p>

          <div style={{ background: '#150A02', borderRadius: 10, padding: 16, marginBottom: 16 }}>
            <div style={{ color: COLORS.textMuted, fontSize: 9, letterSpacing: 1, marginBottom: 12 }}>RAID SUMMARY</div>
            <div style={{ display: 'flex', justifyContent: 'space-around' }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ color: COLORS.accent, fontSize: 28, fontWeight: 700 }}>+{dnaThisRun}</div>
                <div style={{ color: COLORS.textMuted, fontSize: 10 }}>\uD83E\uDDEC DNA</div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ color: COLORS.royal, fontSize: 28, fontWeight: 700 }}>+{jellyThisRun}</div>
                <div style={{ color: COLORS.textMuted, fontSize: 10 }}>\uD83D\uDC51 Jelly</div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ color: COLORS.text, fontSize: 28, fontWeight: 700 }}>{antsCaptured}</div>
                <div style={{ color: COLORS.textMuted, fontSize: 10 }}>\uD83D\uDC1C Ants</div>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 12, marginBottom: 20 }}>
            <div style={{ flex: 1, background: '#150A02', borderRadius: 8, padding: 12, textAlign: 'center' }}>
              <div style={{ color: COLORS.text, fontSize: 18, fontWeight: 700 }}>{depth}m</div>
              <div style={{ color: COLORS.textMuted, fontSize: 10 }}>Max Depth</div>
            </div>
            <div style={{ flex: 1, background: '#150A02', borderRadius: 8, padding: 12, textAlign: 'center' }}>
              <div style={{ color: COLORS.text, fontSize: 18, fontWeight: 700 }}>{String(Math.floor(timer / 60)).padStart(2, '0')}:{String(timer % 60).padStart(2, '0')}</div>
              <div style={{ color: COLORS.textMuted, fontSize: 10 }}>Time</div>
            </div>
          </div>

          <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
            onClick={saveRaid}
            style={{ width: '100%', background: '#8B4513', border: '1px solid ' + COLORS.accent, borderRadius: 12, padding: 14, color: COLORS.text, fontWeight: 700, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit', letterSpacing: 1 }}>
            \uD83D\uDCBE DEPOSIT DNA &amp; RETURN TO SURFACE
          </motion.button>
        </motion.div>
      </div>
    );
  }

  return null;
}

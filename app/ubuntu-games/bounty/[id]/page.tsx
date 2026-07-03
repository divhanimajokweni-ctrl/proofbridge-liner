'use client';

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  ArrowLeft, Trophy, Shield, Clock, Skull, Users, Zap,
  Crosshair, Swords, Share2,
} from 'lucide-react';
import Link from 'next/link';
import { ArenaTicker, type BountyData, type BountyStatus } from '../../../../src/components/ArenaTicker';

export default function BountyDetail({ params }: { params: { id: string } }) {
  const [bounty, setBounty] = useState<BountyData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    fetch('/api/arena')
      .then(res => res.ok ? res.json() : null)
      .then(data => {
        if (cancelled || !data?.bounties?.length) return;
        const found = data.bounties.find((b: BountyData) => b.id === params.id);
        if (found) setBounty(found);
      })
      .finally(() => !cancelled && setLoading(false));
    return () => { cancelled = true; };
  }, [params.id]);

  const statusConfig: Record<BountyStatus, { label: string; color: string; icon: typeof Shield }> = {
    OPEN:       { label: 'Open',        color: '#3B82F6', icon: Crosshair },
    PURGATORY:  { label: 'Purgatory',   color: '#A855F7', icon: Clock },
    CANONICAL:  { label: 'Canonical',   color: '#10B981', icon: Shield },
    BREACHED:   { label: 'Breached',    color: '#EF4444', icon: Skull },
  };

  const modeConfig: Record<string, { label: string; color: string; icon: typeof Swords }> = {
    SIEGE:   { label: 'Siege',   color: '#EF4444', icon: Swords },
    GOLF:    { label: 'Golf',    color: '#3B82F6', icon: Zap },
    CRUSADE: { label: 'Crusade', color: '#A855F7', icon: Users },
  };

  if (loading) {
    return (
      <div
        style={{
          height: '100vh', width: '100%',
          background: 'var(--void, #050505)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: '#6A8099', fontSize: 11, fontFamily: "'IBM Plex Mono', monospace",
        }}
      >
        LOADING BOUNTY…
      </div>
    );
  }

  if (!bounty) {
    return (
      <div
        style={{
          height: '100vh', width: '100%',
          background: 'var(--void, #050505)',
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          color: '#6A8099', fontSize: 11, fontFamily: "'IBM Plex Mono', monospace", gap: 12,
        }}
      >
        <Skull size={28} style={{ color: '#EF4444', opacity: 0.5 }} />
        <div>Bounty not found</div>
        <Link href="/ubuntu-games" style={{ color: '#3B82F6', textDecoration: 'none', fontSize: 10 }}>
          ← Back to Arena
        </Link>
      </div>
    );
  }

  const st = statusConfig[bounty.status] ?? statusConfig.OPEN;
  const mc = modeConfig[bounty.mode] ?? modeConfig.SIEGE;
  const StatusIcon = st.icon;
  const ModeIcon = mc.icon;

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
      {/* ── Nav ── */}
      <div
        style={{
          height: 42,
          borderBottom: '1px solid var(--border, #2E2E32)',
          background: 'rgba(15,15,17,0.9)',
          backdropFilter: 'blur(12px)',
          display: 'flex',
          alignItems: 'center',
          padding: '0 16px',
          gap: 12,
          flexShrink: 0,
        }}
      >
        <Link href="/ubuntu-games" style={{ textDecoration: 'none', color: 'inherit' }}>
          <motion.button
            whileTap={{ scale: 0.9 }}
            style={{
              background: 'none', border: '1px solid var(--border)',
              borderRadius: 6, padding: '3px 8px', color: '#9CA3AF',
              fontSize: 9, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4,
            }}
          >
            <ArrowLeft size={10} /> Back
          </motion.button>
        </Link>
        <div style={{ flex: 1 }} />
        <Link
          href={`/ubuntu-games/${bounty.mode.toLowerCase()}`}
          style={{
            display: 'flex', alignItems: 'center', gap: 4,
            padding: '3px 10px', borderRadius: 6,
            border: `1px solid ${mc.color}40`,
            background: `${mc.color}12`,
            color: mc.color, fontSize: 9, fontWeight: 700,
            textDecoration: 'none',
          }}
        >
          <ModeIcon size={10} />
          Enter {mc.label}
        </Link>
      </div>

      {/* ── Detail Body ── */}
      <div style={{ flex: 1, overflowY: 'auto', padding: 24 }}>
        <div style={{ maxWidth: 720, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Title + Status */}
          <div
            style={{
              padding: 20, borderRadius: 10,
              border: `1px solid ${mc.color}30`,
              background: 'var(--substrate, #0F0F11)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10, flexWrap: 'wrap' }}>
              <span
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 4,
                  padding: '2px 8px', borderRadius: 4,
                  background: `${mc.color}18`, color: mc.color,
                  fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em',
                }}
              >
                <ModeIcon size={10} />
                {bounty.mode}
              </span>
              <span
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 4,
                  padding: '2px 8px', borderRadius: 4,
                  background: `${st.color}18`, color: st.color,
                  fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em',
                }}
              >
                <StatusIcon size={10} />
                {bounty.status}
              </span>
              <span
                style={{
                  fontSize: 9, padding: '2px 8px', borderRadius: 4,
                  background: 'rgba(245,158,11,0.08)', color: '#F59E0B',
                  border: '1px solid rgba(245,158,11,0.2)',
                }}
              >
                {'✦'.repeat(
                  bounty.complexity === 'God-Tier' ? 3
                    : bounty.complexity === 'Hard' ? 2
                    : bounty.complexity === 'Medium' ? 1
                    : 0
                )}
                {' '}
                {bounty.complexity}
              </span>
            </div>

            <h1
              style={{
                fontSize: 22, fontWeight: 700, color: '#FFFFFF',
                fontFamily: "'Syne', system-ui, sans-serif",
                letterSpacing: '-0.02em', marginBottom: 6, lineHeight: 1.3,
              }}
            >
              {bounty.theorem_name.replace(/_/g, ' ')}
            </h1>

            {bounty.blue_claimant && (
              <div style={{ fontSize: 10, color: '#9CA3AF', marginBottom: 4 }}>
                Claimed by <span style={{ color: '#D1D5DB', fontWeight: 600 }}>{bounty.blue_claimant}</span>
              </div>
            )}
            {bounty.red_breacher && (
              <div style={{ fontSize: 10, color: '#EF4444' }}>
                Breached by <span style={{ fontWeight: 600 }}>{bounty.red_breacher}</span>
              </div>
            )}

            {/* Bounty Reward */}
            <div
              style={{
                marginTop: 14, display: 'inline-flex', alignItems: 'center', gap: 6,
                padding: '6px 12px', borderRadius: 8,
                background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.25)',
              }}
            >
              <Trophy size={14} style={{ color: '#F59E0B' }} />
              <span style={{ fontSize: 16, fontWeight: 700, color: '#F59E0B' }}>
                {bounty.rep_reward.toLocaleString()}
              </span>
              <span style={{ fontSize: 10, color: '#9CA3AF' }}>REP</span>
            </div>
          </div>

          {/* Meta Grid */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
              gap: 10,
            }}
          >
            {[
              { label: 'Mode', value: bounty.mode, color: mc.color },
              { label: 'Status', value: bounty.status, color: st.color },
              { label: 'Complexity', value: bounty.complexity, color: '#F59E0B' },
              ...(bounty.purgatory_end
                ? [
                    {
                      label: 'Purgatory Ends',
                      value: new Date(bounty.purgatory_end).toLocaleString(),
                      color: '#A855F7',
                    },
                  ]
                : []),
              ...(bounty.lines_original
                ? [{ label: 'Original Lines', value: String(bounty.lines_original), color: '#3B82F6' }]
                : []),
              ...(bounty.sub_bounties
                ? [{ label: 'Sub-Bounties', value: `${bounty.sub_bounties.length} minions`, color: '#A855F7' }]
                : []),
            ].map(meta => (
              <div
                key={meta.label}
                style={{
                  padding: 12, borderRadius: 8,
                  border: '1px solid var(--border, #2E2E32)',
                  background: 'var(--substrate, #0F0F11)',
                }}
              >
                <div style={{ fontSize: 8, color: '#6A8099', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>
                  {meta.label}
                </div>
                <div style={{ fontSize: 12, fontWeight: 700, color: meta.color }}>
                  {meta.value}
                </div>
              </div>
            ))}
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <Link href={`/ubuntu-games/${bounty.mode.toLowerCase()}`} style={{ textDecoration: 'none' }}>
              <motion.button
                whileTap={{ scale: 0.95 }}
                style={{
                  padding: '10px 18px', borderRadius: 8,
                  border: `1px solid ${mc.color}50`,
                  background: `${mc.color}18`,
                  color: mc.color, fontSize: 11, fontWeight: 700,
                  cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6,
                }}
              >
                <Crosshair size={12} />
                Enter {bounty.mode}
              </motion.button>
            </Link>
            <motion.button
              whileTap={{ scale: 0.95 }}
              style={{
                padding: '10px 18px', borderRadius: 8,
                border: '1px solid var(--border)', background: 'var(--substrate, #0F0F11)',
                color: '#D1D5DB', fontSize: 11, fontWeight: 700,
                cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6,
              }}
            >
              <Share2 size={12} />
              Share
            </motion.button>
          </div>
        </div>
      </div>
    </div>
  );
}

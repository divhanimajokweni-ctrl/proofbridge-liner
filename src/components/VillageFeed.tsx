'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Heart,
  GitFork,
  Sword,
  Zap,
  Users,
  Trophy,
  Shield,
  MessageCircle,
  Share2,
  Play,
  CheckCircle,
  Crosshair,
  Clock,
  ExternalLink,
  UserCheck,
} from 'lucide-react';
import { TacticVisualizerPlay } from './TacticVisualizerPlay';
import type { FeedItem } from '../engine/NexusIntegrator';

// ── Mock Feed Data ────────────────────────────────────────────────────────────

const MOCK_FEED: FeedItem[] = [
  {
    id: 'f1', type: 'SIEGE',
    title: 'Break My Spec: Auth.lean',
    description: 'I proved this auth system is secure. My spec has a hole — find it and steal 500 REP.',
    author: '@Cipher_Master', bounty: 5000, signatures: 12,
    userHasVerified: false, timestamp: Date.now() - 60000,
  },
  {
    id: 'f2', type: 'GOLF',
    title: 'Optimize: Prime Sieve Generator',
    description: 'Can anyone make this faster? 200 REP for the leanest proof.',
    author: '@SpeedDemon', bounty: 200, signatures: 8,
    userHasVerified: false, timestamp: Date.now() - 300000,
  },
  {
    id: 'f3', type: 'CRUSADE',
    title: 'Raid Boss: Riemann Zeta Zeros',
    description: '200 sub-bounties open. Community effort. 100k REP for the kill.',
    author: '@Guild_Leader', bounty: 100000, signatures: 47,
    userHasVerified: true, timestamp: Date.now() - 3600000,
  },
  {
    id: 'f4', type: 'STREAM',
    title: 'Live Coding: Proving Fermat\'s Little Theorem',
    description: 'Watch me write a 5-line proof in real-time. Tips = compute credits.',
    author: '@Streamer_Math', bounty: 0, signatures: 230,
    userHasVerified: false, timestamp: Date.now() - 7200000,
  },
  {
    id: 'f5', type: 'MILESTONE',
    title: '👑 @Tokyo_Node hit 10k REP — Architect Rank!',
    description: 'Lindiwe Oracle certified. Now has governance voting rights with 10x weight.',
    author: '@Lindiwe_Bot', bounty: 0, signatures: 89,
    userHasVerified: true, timestamp: Date.now() - 14400000,
  },
  {
    id: 'f6', type: 'GOVERNANCE',
    title: '🗳️ HARD FORK PROPOSAL: Add Excluded Middle?',
    description: 'Vote now: Should the pool axiom set include LEM? Architects only.',
    author: '@Gov_DAO', bounty: 0, signatures: 34,
    userHasVerified: false, timestamp: Date.now() - 28800000,
  },
  {
    id: 'f7', type: 'SIEGE',
    title: 'Break My Proof: Zero-Knowledge Circuit',
    description: 'ZK circuit verification. Find the soundness gap. 2500 REP bounty.',
    author: '@Crypto_Verifier', bounty: 2500, signatures: 3,
    userHasVerified: false, timestamp: Date.now() - 43200000,
  },
  {
    id: 'f8', type: 'GOLF',
    title: 'Speedrun: factorial_equiv recursion',
    description: 'Current best: 12 lines / 3.2s compile. Can you beat 8 lines?',
    author: '@Lean_Pro', bounty: 150, signatures: 19,
    userHasVerified: true, timestamp: Date.now() - 86400000,
  },
  {
    id: 'f9', type: 'STREAM',
    title: '🎮 Arena Grand Finals: @Tokyo_Node vs @Oxford_Lab',
    description: 'Live siege match. 5k REP on the line. Spectator client open.',
    author: '@UbuntuGames', bounty: 5000, signatures: 1200,
    userHasVerified: false, timestamp: Date.now() - 90000000,
  },
];

// ── Props ─────────────────────────────────────────────────────────────────────

interface VillageFeedProps {
  initialItems?: FeedItem[];
  onEnterArena?: (item: FeedItem) => void;
  onVerify?: (item: FeedItem) => void;
  onFork?: (item: FeedItem) => void;
  className?: string;
}

// ── Component ─────────────────────────────────────────────────────────────────

export function VillageFeed({
  initialItems,
  onEnterArena,
  onVerify,
  onFork,
  className = '',
}: VillageFeedProps) {
  const [items, setItems] = useState<FeedItem[]>(initialItems ?? MOCK_FEED);
  const [activeIndex, setActiveIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const [showVideo, setShowVideo] = useState(false);

  // ── Intersection Observer for active card tracking ──
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const observer = new IntersectionObserver(
      entries => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            const idx = Number(entry.target.getAttribute('data-index'));
            if (!isNaN(idx)) setActiveIndex(idx);
          }
        }
      },
      { root: container, threshold: 0.6 }
    );

    const cards = container.querySelectorAll('[data-index]');
    cards.forEach(c => observer.observe(c));

    return () => observer.disconnect();
  }, [items]);

  // ── Try live feed from /api/feed, fall back to mock ──
  useEffect(() => {
    let cancelled = false;
    fetch('/api/feed?limit=50')
      .then(res => res.ok ? res.json() : null)
      .then(data => {
        if (cancelled || !data?.items?.length) return;
        const mapped: FeedItem[] = data.items.map((it: Record<string, unknown>) => ({
          id: it.id as string,
          type: it.type as FeedItem['type'],
          title: it.title as string,
          description: it.description as string,
          author: it.author as string,
          bounty: (it.bounty as number) ?? 0,
          signatures: (it.signatures as number) ?? 0,
          userHasVerified: (it.userHasVerified as boolean) ?? false,
          timestamp: (it.timestamp as number) ?? Date.now(),
        }));
        setItems(mapped);
      })
      .catch(() => { /* stay on mock */ });
    return () => { cancelled = true; };
  }, []);

  // ── Auto-play simulation: cycle through active SIEGE cards ──
  useEffect(() => {
    const timer = setInterval(() => {
      setItems(prev =>
        prev.map(item => {
          if (item.type === 'SIEGE' && Math.random() > 0.85) {
            return { ...item, signatures: item.signatures + 1 };
          }
          return item;
        })
      );
    }, 3000);
    return () => clearInterval(timer);
  }, []);

  const handleVerify = useCallback(
    (item: FeedItem) => {
      setItems(prev =>
        prev.map(i =>
          i.id === item.id
            ? { ...i, userHasVerified: !i.userHasVerified, signatures: i.signatures + (i.userHasVerified ? -1 : 1) }
            : i
        )
      );
      onVerify?.(item);
    },
    [onVerify]
  );

  // ── Status indicator for emergency events ──
  const liveSiegeCount = items.filter(i => i.type === 'SIEGE').length;

  return (
    <div
      ref={containerRef}
      className={`village-feed ${className}`}
      style={{
        height: '100%',
        width: '100%',
        overflowY: 'scroll',
        scrollSnapType: 'y mandatory',
        background: '#050505',
        position: 'relative',
        fontFamily: "'IBM Plex Mono', monospace",
      }}
    >
      {/* ── Floating status bar ── */}
      <div
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 50,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '8px 14px',
          background: 'linear-gradient(180deg, rgba(5,5,5,0.95) 60%, transparent)',
          pointerEvents: 'none',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{
            width: 8, height: 8, borderRadius: '50%',
            background: '#10B981',
            boxShadow: '0 0 8px rgba(16,185,129,0.6)',
            animation: 'pulse 2s ease-in-out infinite',
          }} />
          <span style={{ fontSize: 10, color: '#9CA3AF', fontWeight: 600, letterSpacing: '0.08em' }}>
            VILLAGE · LIVE
          </span>
        </div>
        <div style={{ display: 'flex', gap: 12, fontSize: 9, color: '#6A8099' }}>
          <span style={{ color: '#EF4444' }}>{liveSiegeCount} SIEGES</span>
          <span style={{ color: '#A855F7' }}>{items.filter(i => i.type === 'CRUSADE').length} RAIDS</span>
          <span style={{ color: '#3B82F6' }}>{items.filter(i => i.type === 'GOLF').length} SPEEDRUNS</span>
        </div>
      </div>

      {/* ── Feed Cards ── */}
      <AnimatePresence>
        {items.map((item, index) => (
          <FeedCard
            key={item.id}
            item={item}
            index={index}
            isActive={index === activeIndex}
            onVerify={() => handleVerify(item)}
            onEnterArena={() => onEnterArena?.(item)}
            onFork={() => onFork?.(item)}
          />
        ))}
      </AnimatePresence>

      {/* ── End of feed ── */}
      <div
        style={{
          height: 120,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 8,
          color: '#6A8099',
          fontSize: 10,
          scrollSnapAlign: 'start',
        }}
      >
        <div style={{ width: 32, height: 32, borderRadius: '50%', border: '2px solid #2E2E32', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Shield size={14} />
        </div>
        <span>END OF FEED · Your reputation precedes you</span>
      </div>
    </div>
  );
}

// ── Feed Card Sub-Component ───────────────────────────────────────────────────

function FeedCard({
  item,
  index,
  isActive,
  onVerify,
  onEnterArena,
  onFork,
}: {
  item: FeedItem;
  index: number;
  isActive: boolean;
  onVerify: () => void;
  onEnterArena: () => void;
  onFork: () => void;
}) {
  const cardRef = useRef<HTMLDivElement>(null);

  // ── Play state for tactic visualizer animation ──
  const [playing, setPlaying] = useState(false);
  useEffect(() => {
    if (isActive) {
      const timer = setTimeout(() => setPlaying(true), 300);
      return () => { clearTimeout(timer); setPlaying(false); };
    }
    return undefined;
  }, [isActive]);

  // ── Gradient by type ──
  const gradients: Record<string, string> = {
    SIEGE: 'from-red-900/40 via-transparent to-midnight-900',
    GOLF: 'from-blue-900/40 via-transparent to-midnight-900',
    CRUSADE: 'from-purple-900/40 via-transparent to-midnight-900',
    STREAM: 'from-emerald-900/40 via-transparent to-midnight-900',
    MILESTONE: 'from-yellow-900/40 via-transparent to-midnight-900',
    GOVERNANCE: 'from-cyan-900/40 via-transparent to-midnight-900',
  };

  // ── Type icon ──
  const TypeIcon = () => {
    switch (item.type) {
      case 'SIEGE': return <Sword size={12} />;
      case 'GOLF': return <Zap size={12} />;
      case 'CRUSADE': return <Users size={12} />;
      case 'STREAM': return <Play size={12} />;
      case 'MILESTONE': return <Trophy size={12} />;
      case 'GOVERNANCE': return <MessageCircle size={12} />;
    }
  };

  // ── Type color ──
  const typeColor: Record<string, string> = {
    SIEGE: '#EF4444', GOLF: '#3B82F6', CRUSADE: '#A855F7',
    STREAM: '#10B981', MILESTONE: '#F59E0B', GOVERNANCE: '#06B6D4',
  };

  // ── Action animation ──
  const [justVerified, setJustVerified] = useState(false);
  const handleVerify = () => {
    setJustVerified(true);
    onVerify();
    setTimeout(() => setJustVerified(false), 600);
  };

  return (
    <div
      ref={cardRef}
      data-index={index}
      className="village-feed-card"
      style={{
        height: 'calc(100vh - 48px)',
        minHeight: 600,
        scrollSnapAlign: 'start',
        position: 'relative',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'flex-end',
        padding: 20,
      }}
    >
      {/* ── Animated Tactic Graph Background ── */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          zIndex: 0,
          opacity: playing ? 0.45 : 0.1,
          transition: 'opacity 0.5s ease',
        }}
      >
        <TacticVisualizerPlay
          trace={Array.isArray(item.trace) ? item.trace : undefined}
          playing={playing}
          tint={
            item.type === 'SIEGE'
              ? 'red'
              : item.type === 'GOLF'
                ? 'blue'
                : item.type === 'CRUSADE'
                  ? 'purple'
                  : 'blue'
          }
        />
      </div>

      {/* ── Gradient overlay ── */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          zIndex: 1,
          background: `linear-gradient(to bottom, transparent 40%, ${gradients[item.type]})`,
        }}
      />

      {/* ── Right Side Action Buttons ── */}
      <div
        style={{
          position: 'absolute',
          right: 12,
          bottom: 120,
          zIndex: 20,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 16,
        }}
      >
        {/* Verify (Like) */}
        <motion.div
          whileTap={{ scale: 0.85 }}
          onClick={handleVerify}
          style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, cursor: 'pointer' }}
        >
          <div
            style={{
              padding: 10,
              borderRadius: '50%',
              background: item.userHasVerified || justVerified ? 'rgba(16,185,129,0.2)' : 'rgba(15,15,17,0.8)',
              border: `1px solid ${item.userHasVerified ? '#10B981' : '#4B5563'}`,
              transition: 'all 0.2s ease',
            }}
          >
            {justVerified ? (
              <CheckCircle size={20} style={{ color: '#10B981' }} />
            ) : (
              <Heart
                size={20}
                style={{
                  color: item.userHasVerified ? '#10B981' : '#D1D5DB',
                  fill: item.userHasVerified ? '#10B981' : 'transparent',
                }}
              />
            )}
          </div>
          <span style={{ fontSize: 10, fontWeight: 700, color: '#D1D5DB' }}>
            {item.signatures}
          </span>
        </motion.div>

        {/* Fork (Remix) */}
        <motion.div
          whileTap={{ scale: 0.85 }}
          onClick={onFork}
          style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, cursor: 'pointer' }}
        >
          <div
            style={{
              padding: 10,
              borderRadius: '50%',
              background: 'rgba(15,15,17,0.8)',
              border: '1px solid #4B5563',
              transition: 'all 0.2s ease',
            }}
          >
            <GitFork size={20} style={{ color: '#D1D5DB' }} />
          </div>
          <span style={{ fontSize: 9, color: '#9CA3AF' }}>Fork</span>
        </motion.div>

        {/* Enter Arena */}
        {(item.type === 'SIEGE' || item.type === 'GOLF' || item.type === 'CRUSADE') && (
          <motion.div
            whileTap={{ scale: 0.85 }}
            onClick={onEnterArena}
            style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, cursor: 'pointer' }}
          >
            <div
              style={{
                padding: 12,
                borderRadius: '50%',
                background: 'rgba(239,68,68,0.9)',
                border: '1px solid rgba(239,68,68,0.5)',
                boxShadow: '0 0 20px rgba(239,68,68,0.3)',
                animation: isActive ? 'pulse 2s ease-in-out infinite' : 'none',
              }}
            >
              <Sword size={22} style={{ color: '#FFFFFF' }} />
            </div>
            <span style={{ fontSize: 8, color: '#EF4444', fontWeight: 700 }}>ATTACK</span>
          </motion.div>
        )}

        {/* Share */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, cursor: 'pointer' }}>
          <div
            style={{
              padding: 10,
              borderRadius: '50%',
              background: 'rgba(15,15,17,0.8)',
              border: '1px solid #4B5563',
            }}
          >
            <Share2 size={18} style={{ color: '#9CA3AF' }} />
          </div>
          <span style={{ fontSize: 8, color: '#6A8099' }}>Share</span>
        </div>
      </div>

      {/* ── Bottom Content ── */}
      <div style={{ position: 'relative', zIndex: 10, width: '75%' }}>
        {/* Badge row */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
          <span
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 4,
              padding: '3px 8px', borderRadius: 4,
              background: `${typeColor[item.type]}20`,
              color: typeColor[item.type],
              fontSize: 9, fontWeight: 700,
            }}
          >
            <TypeIcon />
            {item.type === 'SIEGE' && 'LIVE SIEGE'}
            {item.type === 'GOLF' && 'SPEEDRUN'}
            {item.type === 'CRUSADE' && 'CRUSADE RAID'}
            {item.type === 'STREAM' && 'LIVE NOW'}
            {item.type === 'MILESTONE' && 'MILESTONE'}
            {item.type === 'GOVERNANCE' && 'GOVERNANCE'}
          </span>
          {item.type === 'SIEGE' && (
            <span style={{ fontSize: 8, color: '#6A8099', display: 'flex', alignItems: 'center', gap: 3 }}>
              <Clock size={8} />
              23h left
            </span>
          )}
        </div>

        {/* Title */}
        <h3
          style={{
            fontSize: 18,
            fontWeight: 700,
            color: '#FFFFFF',
            fontFamily: "'Syne', system-ui, sans-serif",
            marginBottom: 4,
            textShadow: '0 2px 10px rgba(0,0,0,0.5)',
            lineHeight: 1.2,
          }}
        >
          {item.title}
        </h3>

        {/* Description */}
        <p
          style={{
            fontSize: 12,
            color: '#9CA3AF',
            lineHeight: 1.4,
            marginBottom: 8,
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
          }}
        >
          {item.description}
        </p>

        {/* Author + Bounty */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {/* Author avatar placeholder */}
          <div
            style={{
              width: 22, height: 22, borderRadius: '50%',
              background: `${typeColor[item.type]}33`,
              border: `1px solid ${typeColor[item.type]}44`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 8, color: typeColor[item.type], fontWeight: 700,
            }}
          >
            {item.author.charAt(1).toUpperCase()}
          </div>
          <span style={{ fontSize: 11, color: '#D1D5DB', fontWeight: 500 }}>{item.author}</span>
          {item.bounty > 0 && (
            <>
              <span style={{ color: '#4B5563', fontSize: 8 }}>·</span>
              <span style={{ fontSize: 11, color: '#F59E0B', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 3 }}>
                <Trophy size={10} />
                {item.bounty.toLocaleString()} REP
              </span>
            </>
          )}
          {/* Verified badge */}
          {item.userHasVerified && (
            <span style={{ fontSize: 8, color: '#10B981', display: 'flex', alignItems: 'center', gap: 2 }}>
              <UserCheck size={8} /> Verified
            </span>
          )}
        </div>
      </div>

      {/* ── Index indicator (bottom-right) ── */}
      <div
        style={{
          position: 'absolute',
          bottom: 20,
          right: 20,
          zIndex: 10,
          fontSize: 9,
          color: '#4B5563',
          fontFamily: "'IBM Plex Mono', monospace",
        }}
      >
        {String(index + 1).padStart(2, '0')}
      </div>
    </div>
  );
}

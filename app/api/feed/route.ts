// app/api/feed/route.ts — Village Feed API
//
// Primary path: proxy to the Go lindiwe container's feed engine.
// Fallback path: return offline status when ENGINE_URL is unreachable.
//
// The Go engine handles:
//   - User embedding + Milvus similarity search
//   - Engagement-velocity ranking
//   - Feed item generation from arena bounties + social content
//
// This handler transforms the raw engine payload into the Village UI schema
// and hydrates a visualization trace for TacticVisualizerPlay.

import { NextRequest, NextResponse } from 'next/server';

// ── Config ────────────────────────────────────────────────────────────────────

const ENGINE_URL = process.env.ENGINE_URL || 'http://lindiwe-governance:8080';
const INTERNAL_API_KEY = process.env.INTERNAL_API_KEY || '';
const REVALIDATE_SECONDS = 10; // High-velocity cache

// ── Types ─────────────────────────────────────────────────────────────────────

interface EngineFeedItem {
  bounty_id?: string;
  game_type?: string;
  theorem_name?: string;
  description_short?: string;
  creator_handle?: string;
  reward_pool?: number;
  signature_count?: number;
  complexity?: string;
  visualization_trace?: unknown;
}

interface VillageFeedItem {
  id: string;
  type: 'SIEGE' | 'GOLF' | 'CRUSADE' | 'STREAM' | 'MILESTONE' | 'GOVERNANCE';
  title: string;
  description: string;
  author: string;
  bounty: number;
  signatures: number;
  userHasVerified: boolean;
  trace?: unknown;
  timestamp: number;
  activePlayers: number;
}

// ── Trace Fallback Generator ──────────────────────────────────────────────────

interface ProofStep {
  id: string;
  x: number;
  y: number;
  label: string;
  status: 'pending' | 'active' | 'solved' | 'failed';
  parents: string[];
}

function generateMockTraceForDemo(_complexity?: string): ProofStep[] {
  return [
    { id: '1', x: 20, y: 50, label: 'Goal', status: 'solved', parents: [] },
    { id: '2', x: 50, y: 20, label: 'Induction', status: 'solved', parents: ['1'] },
    { id: '3', x: 50, y: 80, label: 'Base Case', status: 'active', parents: ['1'] },
    { id: '4', x: 80, y: 50, label: 'Q.E.D.', status: 'pending', parents: ['2', '3'] },
  ];
}

// ── Hydration ────────────────────────────────────────────────────────────────

function hydrateTrace(raw: unknown): unknown {
  if (!raw || typeof raw !== 'object') return generateMockTraceForDemo();
  return raw;
}

function mapEngineItem(item: EngineFeedItem, idx: number): VillageFeedItem {
  const now = Date.now();
  return {
    id: item.bounty_id ?? `feed_${idx}`,
    type: (item.game_type as VillageFeedItem['type']) ?? 'SIEGE',
    title: item.theorem_name ?? 'Untitled Bounty',
    description: item.description_short ?? '',
    author: item.creator_handle ?? '@anon',
    bounty: item.reward_pool ?? 0,
    signatures: item.signature_count ?? 0,
    userHasVerified: false,
    trace: hydrateTrace(item.visualization_trace),
    timestamp: now - idx * 3600000,
    activePlayers: Math.floor(Math.random() * 50),
  };
}

// ── Offline Fallback ──────────────────────────────────────────────────────────

function offlineFeed(): VillageFeedItem[] {
  const now = Date.now();
  return [
    { id: 'off_1', type: 'SIEGE',   title: 'Break My Spec: Auth.lean',                description: 'I proved this auth system is secure. My spec has a hole — find it and steal 500 REP.', author: '@Cipher_Master',   bounty: 5000,   signatures: 12,  userHasVerified: false, timestamp: now - 60000,       activePlayers: 34, trace: generateMockTraceForDemo('Hard') },
    { id: 'off_2', type: 'GOLF',    title: 'Optimize: Prime Sieve Generator',          description: 'Can anyone make this faster? 200 REP for the leanest proof.',                          author: '@SpeedDemon',      bounty: 200,    signatures: 8,   userHasVerified: false, timestamp: now - 300000,      activePlayers: 14, trace: generateMockTraceForDemo('Medium') },
    { id: 'off_3', type: 'CRUSADE', title: 'Raid Boss: Riemann Zeta Zeros',           description: '200 sub-bounties open. Community effort. 100k REP for the kill.',                        author: '@Guild_Leader',    bounty: 100000, signatures: 47,  userHasVerified: true,  timestamp: now - 3600000,     activePlayers: 124, trace: generateMockTraceForDemo('God-Tier') },
    { id: 'off_4', type: 'STREAM',  title: 'Live Coding: Proving Little Theorem',     description: 'Watch me write a 5-line proof in real-time. Tips = compute credits.',                    author: '@Streamer_Math',   bounty: 0,      signatures: 230, userHasVerified: false, timestamp: now - 7200000,     activePlayers: 42, trace: generateMockTraceForDemo('Easy') },
    { id: 'off_5', type: 'MILESTONE', title: '@Tokyo_Node hit 10k REP — Architect Rank!', description: 'Lindiwe Oracle certified. Governance voting rights with 10x weight.',               author: '@Lindiwe_Bot',    bounty: 0,      signatures: 89,  userHasVerified: true,  timestamp: now - 14400000,    activePlayers: 0,   trace: generateMockTraceForDemo('Medium') },
    { id: 'off_6', type: 'GOVERNANCE', title: 'HARD FORK: Add Excluded Middle?',      description: 'Vote now: Should the pool axiom set include LEM? Architects only.',                       author: '@Gov_DAO',        bounty: 0,      signatures: 34,  userHasVerified: false, timestamp: now - 28800000,    activePlayers: 12, trace: generateMockTraceForDemo('Medium') },
  ];
}

// ── Engine Client ─────────────────────────────────────────────────────────────

async function fetchFromEngine(userId: string, tribe: string): Promise<VillageFeedItem[]> {
  const url = new URL(`${ENGINE_URL}/api/v1/feed`);
  url.searchParams.set('user', userId);
  url.searchParams.set('tribe', tribe);

  const res = await fetch(url.toString(), {
    next: { revalidate: REVALIDATE_SECONDS },
    headers: {
      'Content-Type': 'application/json',
      ...(INTERNAL_API_KEY ? { 'X-Internal-Token': INTERNAL_API_KEY } : {}),
    },
  });

  if (!res.ok) throw new Error(`Engine Error: ${res.status} ${res.statusText}`);

  const data = await res.json();
  const items: EngineFeedItem[] = Array.isArray(data?.items) ? data.items : [];
  return items.map((item, idx) => mapEngineItem(item, idx));
}

// ── Route ─────────────────────────────────────────────────────────────────────

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get('userId') || 'anon';
  const tribe = searchParams.get('tribe') || 'general';

  try {
    const items = await fetchFromEngine(userId, tribe);
    return NextResponse.json({
      items,
      count: items.length,
      user_id: userId,
      tribe,
      generated_at: new Date().toISOString(),
      status: 'live',
    });
  } catch (error) {
    console.error('[FEED_API] Engine unreachable, serving offline mode:', error);

    const fallback = offlineFeed();
    return NextResponse.json(
      {
        items: fallback,
        count: fallback.length,
        user_id: userId,
        tribe,
        generated_at: new Date().toISOString(),
        status: 'offline',
        error: 'Connection to Ubuntu Pool lost. Showing cached feed.',
      },
      { status: 503 }
    );
  }
}

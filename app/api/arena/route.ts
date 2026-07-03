// app/api/arena/route.ts — UbuntuGames Arena API
//
// Provides:
//   GET  /api/arena          → list all bounties & scores
//   POST /api/arena/claim    → Blue Team claims a bounty
//   POST /api/arena/breach   → Red Team breaches a bounty
//   POST /api/arena/golf     → Submit a Golf score
//   GET  /api/arena/leaderboard → top reputation scores
//
// In production, these operations are forwarded to the Lindiwe container
// via docker exec or HTTP. Here we maintain an in-memory engine for
// development and preview deployments.

import { NextRequest, NextResponse } from 'next/server';

// ── Types ────────────────────────────────────────────────────────────────────

type BountyStatus = 'OPEN' | 'PURGATORY' | 'CANONICAL' | 'BREACHED';
type GameMode = 'SIEGE' | 'GOLF' | 'CRUSADE';
type Difficulty = 'God-Tier' | 'Hard' | 'Medium' | 'Easy';

interface Bounty {
  id: string;
  theorem_name: string;
  complexity: Difficulty;
  mode: GameMode;
  rep_reward: number;
  blue_claimant?: string;
  red_breacher?: string;
  status: BountyStatus;
  proof_cid?: string;
  breach_cid?: string;
  purgatory_end?: string;
  lines_original?: number;
  lines_new?: number;
  sub_bounties?: string[];
  created_at: string;
}

// ── In-Memory Engine ─────────────────────────────────────────────────────────

class ArenaEngine {
  bounties: Map<string, Bounty> = new Map();
  scores: Map<string, number> = new Map();

  constructor() {
    this.seed();
  }

  private seed() {
    const now = Date.now();
    const add = (b: Bounty) => this.bounties.set(b.id, b);

    add({
      id: 'b1', theorem_name: 'Riemann_Zeta_Zeros',
      complexity: 'God-Tier', mode: 'CRUSADE',
      rep_reward: 100000, status: 'OPEN',
      created_at: new Date(now - 86400000 * 7).toISOString(),
      sub_bounties: Array.from({ length: 200 }, (_, i) => `b1_sub_${i + 1}`),
    });
    add({
      id: 'b2', theorem_name: 'Navier_Stokes_Smoothness',
      complexity: 'Hard', mode: 'CRUSADE',
      rep_reward: 50000, status: 'OPEN',
      created_at: new Date(now - 86400000 * 5).toISOString(),
      sub_bounties: Array.from({ length: 100 }, (_, i) => `b2_sub_${i + 1}`),
    });
    add({
      id: 'b3', theorem_name: 'P_vs_NP',
      complexity: 'God-Tier', mode: 'SIEGE',
      rep_reward: 100000, status: 'OPEN',
      created_at: new Date(now - 86400000 * 3).toISOString(),
    });
    add({
      id: 'b4', theorem_name: 'Yang_Mills_Existence',
      complexity: 'God-Tier', mode: 'CRUSADE',
      rep_reward: 100000, status: 'OPEN',
      created_at: new Date(now - 86400000).toISOString(),
    });
    add({
      id: 'b5', theorem_name: 'Lemma_Topology_4.2',
      complexity: 'Medium', mode: 'SIEGE',
      rep_reward: 500, status: 'PURGATORY',
      blue_claimant: '@Tokyo_Node',
      purgatory_end: new Date(now + 14 * 3600_000).toISOString(),
      created_at: new Date(now - 3600_000 * 10).toISOString(),
    });
    add({
      id: 'b6', theorem_name: 'QuickSort_Correctness',
      complexity: 'Easy', mode: 'GOLF',
      rep_reward: 200, status: 'OPEN',
      lines_original: 68,
      created_at: new Date(now - 3600_000 * 2).toISOString(),
    });
    add({
      id: 'b7', theorem_name: 'Banach_Tarski_Decomposition',
      complexity: 'Hard', mode: 'SIEGE',
      rep_reward: 1200, status: 'CANONICAL',
      blue_claimant: '@Oxford_Lab',
      created_at: new Date(now - 86400000 * 2).toISOString(),
    });

    this.scores.set('@Tokyo_Node', 3400);
    this.scores.set('@Oxford_Lab', 7200);
    this.scores.set('@MIT_Node', 8900);
    this.scores.set('@Red_Team_Alpha', 2100);
    this.scores.set('@Lean_Fndtn', 15000);
  }

  list(): Bounty[] {
    return Array.from(this.bounties.values()).sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
  }

  get(id: string): Bounty | undefined {
    return this.bounties.get(id);
  }

  claim(id: string, user: string, proofCID: string): { ok: boolean; error?: string } {
    const bounty = this.bounties.get(id);
    if (!bounty) return { ok: false, error: 'Bounty not found' };
    if (bounty.status !== 'OPEN') return { ok: false, error: `Bounty is ${bounty.status}` };

    const stake = Math.floor(bounty.rep_reward / 10);
    const userRep = this.scores.get(user) ?? 0;
    if (userRep < stake) return { ok: false, error: `Insufficient REP: need ${stake}, have ${userRep}` };

    this.scores.set(user, userRep - stake);
    bounty.status = 'PURGATORY';
    bounty.blue_claimant = user;
    bounty.proof_cid = proofCID;
    bounty.purgatory_end = new Date(Date.now() + 24 * 3600_000).toISOString();

    return { ok: true };
  }

  breach(id: string, attacker: string, breachCID: string): { ok: boolean; error?: string } {
    const bounty = this.bounties.get(id);
    if (!bounty) return { ok: false, error: 'Bounty not found' };
    if (bounty.status !== 'PURGATORY') return { ok: false, error: `Bounty is ${bounty.status} — must be PURGATORY` };

    const reward = Math.floor(bounty.rep_reward / 2);
    const current = this.scores.get(attacker) ?? 0;
    this.scores.set(attacker, current + reward);

    bounty.status = 'BREACHED';
    bounty.red_breacher = attacker;
    bounty.breach_cid = breachCID;

    return { ok: true };
  }

  golf(id: string, user: string, newLines: number): { ok: boolean; error?: string; score?: number } {
    const bounty = this.bounties.get(id);
    if (!bounty) return { ok: false, error: 'Bounty not found' };
    if (bounty.mode !== 'GOLF') return { ok: false, error: 'Bounty is not in GOLF mode' };
    if (!bounty.lines_original) return { ok: false, error: 'Original line count not set' };

    const improvement = bounty.lines_original - newLines;
    if (improvement <= 0) return { ok: false, error: `No improvement: orig=${bounty.lines_original}, new=${newLines}` };

    const score = improvement * 100;
    const current = this.scores.get(user) ?? 0;
    this.scores.set(user, current + score);

    bounty.lines_new = newLines;

    return { ok: true, score };
  }

  leaderboard(): Array<{ user: string; score: number }> {
    return Array.from(this.scores.entries())
      .map(([user, score]) => ({ user, score }))
      .sort((a, b) => b.score - a.score)
      .slice(0, 20);
  }
}

// ── Singleton ────────────────────────────────────────────────────────────────

const globalForArena = globalThis as unknown as { _arenaEngine?: ArenaEngine };
const engine = globalForArena._arenaEngine ?? (globalForArena._arenaEngine = new ArenaEngine());

// ── Helper: CORS / JSON ──────────────────────────────────────────────────────

function json(data: unknown, status = 200) {
  return NextResponse.json(data, { status });
}

// ── Routes ───────────────────────────────────────────────────────────────────

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const action = searchParams.get('action');

  switch (action) {
    case 'leaderboard':
      return json({ leaderboard: engine.leaderboard() });

    case 'bounty': {
      const id = searchParams.get('id');
      if (!id) return json({ error: 'Missing id param' }, 400);
      const bounty = engine.get(id);
      if (!bounty) return json({ error: 'Bounty not found' }, 404);
      return json({ bounty });
    }

    default:
      return json({
        bounties: engine.list(),
        scores: Object.fromEntries(engine.scores),
      });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, bounty_id, user, proof_cid, breach_cid, new_lines } = body;

    if (!action) return json({ error: 'Missing action' }, 400);

    switch (action) {
      case 'claim': {
        if (!bounty_id || !user || !proof_cid) {
          return json({ error: 'Missing bounty_id, user, or proof_cid' }, 400);
        }
        const result = engine.claim(bounty_id, user, proof_cid);
        if (!result.ok) return json(result, 400);
        return json({ ok: true, bounty: engine.get(bounty_id) });
      }

      case 'breach': {
        if (!bounty_id || !user || !breach_cid) {
          return json({ error: 'Missing bounty_id, user, or breach_cid' }, 400);
        }
        const result = engine.breach(bounty_id, user, breach_cid);
        if (!result.ok) return json(result, 400);
        return json({ ok: true, bounty: engine.get(bounty_id) });
      }

      case 'golf': {
        if (!bounty_id || !user || new_lines === undefined) {
          return json({ error: 'Missing bounty_id, user, or new_lines' }, 400);
        }
        const result = engine.golf(bounty_id, user, Number(new_lines));
        if (!result.ok) return json(result, 400);
        return json({ ok: true, score: result.score, bounty: engine.get(bounty_id) });
      }

      default:
        return json({ error: `Unknown action: ${action}` }, 400);
    }
  } catch (e) {
    return json({ error: 'Invalid JSON body' }, 400);
  }
}

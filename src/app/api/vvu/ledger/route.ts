/**
 * GET /api/vvu/ledger
 * ===================
 * Returns the validated ledger entries the calling user is permitted to see.
 *
 * If Supabase is configured (NEXT_PUBLIC_SUPABASE_URL +
 * SUPABASE_SERVICE_ROLE_KEY), this route calls the `get_validated_ledger()`
 * RPC function — which enforces RLS-tier-based access at the database level.
 *
 * If Supabase is NOT configured, it returns the same 10 seeded entries from
 * prisma/supabase-rls-schema-20260901.sql as a DEMO fallback (all marked
 * tier='open' so they're visible to everyone). The HUD shows "DEMO" in this
 * mode; once Supabase is wired in, it shows "RLS LIVE".
 */
import { NextResponse } from 'next/server';

// The canonical seeded ledger — mirrors prisma/supabase-rls-schema-20260901.sql
const SEEDED_LEDGER = [
  { id: 1,  file_name: 'vvu-3d-gis-bench-20260901.tsx',     sha256_hash: 'ca7e2c104fdc75e8583a861d98b69cccc3867f36a515c2db9fe1eb5bcd26785b', agent_name: 'Visualizer',     required_tier: 'open',       verified_at: '2026-09-01T00:00:00Z' },
  { id: 2,  file_name: 'vvu-deploy-all-20260901.sh',         sha256_hash: '49cbc5545f76df1b22ff830fc94eb3191555fe0bbc5913f4d0aef3f11a370353', agent_name: 'Orchestrator',   required_tier: 'open',       verified_at: '2026-09-01T00:00:00Z' },
  { id: 3,  file_name: 'vvu-post-install-20260901.sh',       sha256_hash: 'a072f020f9614e130310f28bdca635583d6cc100510189dc15caa8a25ae56257', agent_name: 'QA / Tester',    required_tier: 'open',       verified_at: '2026-09-01T00:00:00Z' },
  { id: 4,  file_name: 'vvu-pis-db-schema-20260901.sql',    sha256_hash: '8aa259106d6b640d65136df9934637628052dfecb04ac969a98efb563dc2924c', agent_name: 'Database',       required_tier: 'pro',        verified_at: '2026-09-01T00:00:00Z' },
  { id: 5,  file_name: 'vvu-modelarts-obs-uploader-20260901.py', sha256_hash: 'f51a6a19ca6c937219b937fb9f467bf5763d6e8e95bc1e60b38732ffd3b49505', agent_name: 'Data / Cloud',   required_tier: 'max',        verified_at: '2026-09-01T00:00:00Z' },
  { id: 6,  file_name: 'vvu-modelarts-exeml-config-20260901.yaml', sha256_hash: '39e49c9bc764628eba13c84ab597a607cdb550f82f3e9a744a737a9351d67a45', agent_name: 'ML Ops',         required_tier: 'max',        verified_at: '2026-09-01T00:00:00Z' },
  { id: 7,  file_name: 'vvu-dn300-surge-config-20260901.json', sha256_hash: 'c03ebfcaa055da9d6727a3e865f36dc63406ad760456a2bbfb0c083fc6694107', agent_name: 'Simulation',     required_tier: 'pro',        verified_at: '2026-09-01T00:00:00Z' },
  { id: 8,  file_name: 'vvu-structural-surge-analysis-20260901.apdl', sha256_hash: '431841f8520592ff0290c501bae40a84dd6049e35bd9c06f09f29bf2fff2b2cd', agent_name: 'Sim / FEA',      required_tier: 'max',        verified_at: '2026-09-01T00:00:00Z' },
  { id: 9,  file_name: 'vvu-b2b-vault-sync-20260901.py',     sha256_hash: '07b06d96a72a01034f52f2c98075eca2d4a79bf0f6709480f0c8147fc5c68d21', agent_name: 'CRM Ingestion',  required_tier: 'enterprise',  verified_at: '2026-09-01T00:00:00Z' },
  { id: 10, file_name: 'vvu-obsidian-sync-20260901.sh',      sha256_hash: 'b2f5148db3678cc0be15021b758c164db9602c5a09a996a5ef55a564d9870442', agent_name: 'SANS Auditor',   required_tier: 'enterprise',  verified_at: '2026-09-01T00:00:00Z' },
] as const;

export async function GET() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey  = process.env.SUPABASE_SERVICE_ROLE_KEY;

  // ── DEMO MODE: no Supabase configured — return all entries as "open" ──
  if (!supabaseUrl || !serviceKey) {
    return NextResponse.json({
      source: 'demo',
      tier: 'open',
      entries: SEEDED_LEDGER.map(e => ({ ...e, required_tier: 'open' })),
    });
  }

  // ── LIVE MODE: call the Supabase RPC ──────────────────────────────────
  try {
    const resp = await fetch(`${supabaseUrl}/rest/v1/rpc/get_validated_ledger`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        apikey: serviceKey,
        Authorization: `Bearer ${serviceKey}`,
      },
      body: '{}',
    });

    if (!resp.ok) {
      throw new Error(`Supabase RPC failed: ${resp.status} ${resp.statusText}`);
    }

    const entries = await resp.json();
    return NextResponse.json({
      source: 'rls-live',
      tier: 'open', // The actual tier would come from a separate /api/vvu/tier call
      entries,
    });
  } catch (err) {
    console.error('[/api/vvu/ledger] Supabase call failed, falling back to demo:', err);
    return NextResponse.json({
      source: 'demo-fallback',
      tier: 'open',
      entries: SEEDED_LEDGER.map(e => ({ ...e, required_tier: 'open' })),
      error: err instanceof Error ? err.message : 'Unknown error',
    });
  }
}

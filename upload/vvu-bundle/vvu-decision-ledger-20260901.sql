-- VVU Decision Ledger - Sovereign RLS Schema
-- File: vvu-decision-ledger-20260901.sql
-- Version: v0.3 · Release 20260901
-- Alignment: POPIA, WORM, Five-Conjunct Theorem

-- Enable extensions
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Agent Identities - Scoped logins
CREATE TABLE IF NOT EXISTS agent_identities (
  agent_id TEXT PRIMARY KEY,
  wallet_address TEXT NOT NULL UNIQUE,
  public_key_ed25519 TEXT NOT NULL,
  role TEXT NOT NULL,
  is_revoked BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Decision Ledger - Append Only
CREATE TABLE IF NOT EXISTS decision_ledger (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id TEXT REFERENCES agent_identities(agent_id),
  action_type TEXT NOT NULL CHECK (action_type IN ('BID_CHANGE','BUDGET_SHIFT','COPY_GENERATE','STEP_GENERATE','EVIDENCE_REGISTER','INVARIANT_CHECK','FAIL_CLOSED','AGENT_REVOKE')),
  action_payload JSONB NOT NULL,
  rationale TEXT,
  source_hash TEXT NOT NULL, -- SHA-256 64 chars
  invariant_check BOOLEAN,
  five_conjunct_pass BOOLEAN,
  tx_hash TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- WORM Enforcement
DROP RULE IF EXISTS no_update_ledger ON decision_ledger;
CREATE RULE no_update_ledger AS ON UPDATE TO decision_ledger DO INSTEAD NOTHING;
DROP RULE IF EXISTS no_delete_ledger ON decision_ledger;
CREATE RULE no_delete_ledger AS ON DELETE TO decision_ledger DO INSTEAD NOTHING;

-- RLS
ALTER TABLE decision_ledger ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS agent_insert_own ON decision_ledger;
CREATE POLICY agent_insert_own ON decision_ledger FOR INSERT WITH CHECK (agent_id = current_user);
DROP POLICY IF EXISTS read_all ON decision_ledger;
CREATE POLICY read_all ON decision_ledger FOR SELECT USING (true);

-- Physical Nodes State Machine
CREATE TABLE IF NOT EXISTS physical_nodes (
  node_id TEXT PRIMARY KEY,
  state TEXT NOT NULL CHECK (state IN ('DISCONNECTED','PAIRING_BLE','TOTP_VERIFICATION','STEADY_STATE_LOCKED','LEAK_ACTIVE','FAIL_CLOSED')),
  last_telemetry_hash TEXT,
  last_verified_at TIMESTAMPTZ,
  thermal_c REAL,
  wave_celerity REAL,
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Evidence Anchor Cache (mirrors on-chain)
CREATE TABLE IF NOT EXISTS evidence_anchor (
  file_hash TEXT PRIMARY KEY,
  source TEXT NOT NULL,
  tx_hash TEXT NOT NULL,
  five_conjunct_pass BOOLEAN,
  anchored_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes for agentic queries
CREATE INDEX IF NOT EXISTS idx_ledger_agent ON decision_ledger(agent_id);
CREATE INDEX IF NOT EXISTS idx_ledger_hash ON decision_ledger(source_hash);
CREATE INDEX IF NOT EXISTS idx_ledger_time ON decision_ledger(created_at DESC);

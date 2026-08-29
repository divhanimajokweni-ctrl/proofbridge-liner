-- Migration: gateway_participants table
-- Created: 2026-07-05
-- Purpose: Replace filesystem-based tenant storage in gateway module
--          with database-backed persistence for Vercel serverless compatibility.
--          Also adds auth-linked participant records with RLS.

CREATE TABLE IF NOT EXISTS gateway_participants (
  id                  UUID PRIMARY KEY,
  email               TEXT UNIQUE NOT NULL,
  display_name        TEXT NOT NULL,
  onboarding_status   TEXT NOT NULL DEFAULT 'pending_verification',
  gateway_version     TEXT NOT NULL DEFAULT '2.0-STABLE',
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ip_hash             TEXT,
  ubuntu_score        NUMERIC(5,2) DEFAULT 0,
  participant_class   TEXT NOT NULL DEFAULT 'NaturalPerson',
  verified_at         TIMESTAMPTZ,
  CONSTRAINT valid_class CHECK (
    participant_class IN ('NaturalPerson', 'RegisteredOrganization', 'GovernmentEntity')
  )
);

-- RLS: participants can only read their own row
ALTER TABLE gateway_participants ENABLE ROW LEVEL SECURITY;

CREATE POLICY "own_row" ON gateway_participants
  FOR SELECT USING (auth.uid() = id);

-- Service role bypasses RLS (used server-side only)
CREATE INDEX IF NOT EXISTS idx_gp_email ON gateway_participants(email);
CREATE INDEX IF NOT EXISTS idx_gp_status ON gateway_participants(onboarding_status);

-- PIN store table for gateway auth
CREATE TABLE IF NOT EXISTS gateway_pin_store (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       TEXT NOT NULL UNIQUE,
  pin_hash      TEXT NOT NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_auth     TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_gps_user_id ON gateway_pin_store(user_id);

-- IP jail table for Fail2Ban rate limiting
CREATE TABLE IF NOT EXISTS gateway_ip_jail (
  ip              TEXT PRIMARY KEY,
  failed_attempts INTEGER NOT NULL DEFAULT 0,
  jailed_at       TIMESTAMPTZ,
  last_attempt    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

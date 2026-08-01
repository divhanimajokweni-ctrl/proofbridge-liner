-- ============================================================
-- 003_consent.sql — POPIA Consent Storage Architecture
-- Tracks immutable cryptographic logs for compliance verification
-- ============================================================

CREATE TABLE IF NOT EXISTS consent_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    player_id UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
    consent_type TEXT NOT NULL CHECK (consent_type IN ('marketing', 'analytics', 'retention')),
    status TEXT NOT NULL DEFAULT 'granted' CHECK (status IN ('granted', 'revoked', 'expired')),
    version TEXT NOT NULL DEFAULT '1.0',
    consented_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    expires_at TIMESTAMPTZ NOT NULL,
    ip_address TEXT NOT NULL,
    user_agent TEXT NOT NULL,
    active BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE INDEX idx_consent_player_type ON consent_records(player_id, consent_type) WHERE active = true;

ALTER TABLE consent_records ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can query their own consent footprints" ON consent_records
    FOR SELECT USING (player_id = auth.uid());

CREATE POLICY "Users can append their personal consent choices" ON consent_records
    FOR INSERT WITH CHECK (player_id = auth.uid());

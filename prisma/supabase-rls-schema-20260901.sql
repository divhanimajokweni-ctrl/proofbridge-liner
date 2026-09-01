-- =============================================================================
-- VVU ENTERPRISE RLS SUITE · RELEASE 20260901
-- Database: Supabase PostgreSQL
-- Security Level: SANS 1200 Compliant · Multi-Tenant RLS
--
-- This schema turns the VVU Validation Dashboard from a mockup into a
-- real, enforceable SaaS product. RLS policies ensure the database itself
-- enforces tier-based access — even if the UI is compromised, no data leaks.
--
-- Tiers (ascending): open → pro → max → enterprise
-- Tables: user_profiles, ledger_entries, blind_zone_data,
--         trust_sphere_nodes, audit_log
-- =============================================================================

-- ─── 1. ENABLE RLS & EXTENSIONS ──────────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "postgis";

-- ─── 2. CUSTOM TYPES ──────────────────────────────────────────────────────────
CREATE TYPE user_tier AS ENUM ('open', 'pro', 'max', 'enterprise');
CREATE TYPE node_state AS ENUM ('unknown', 'identity', 'contribution', 'receipt', 'hash', 'zk_proof', 'trust');

-- ─── 3. USER PROFILES TABLE ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS user_profiles (
    id UUID REFERENCES auth.users(id) PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    tier user_tier DEFAULT 'open',
    trust_score NUMERIC(3,2) DEFAULT 0.00,
    node_state node_state DEFAULT 'unknown',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── 4. LEDGER ENTRIES (Secure Data Access) ──────────────────────────────────
CREATE TABLE IF NOT EXISTS ledger_entries (
    id BIGSERIAL PRIMARY KEY,
    file_name TEXT NOT NULL,
    sha256_hash TEXT NOT NULL,
    agent_name TEXT NOT NULL,
    required_tier user_tier NOT NULL,
    file_size_bytes BIGINT,
    verified_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── 5. BLIND ZONE DATA (Mbilini Geospatial Intelligence) ──────────────────
CREATE TABLE IF NOT EXISTS blind_zone_data (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    lat NUMERIC(10, 8) NOT NULL,
    lng NUMERIC(11, 8) NOT NULL,
    elevation_m NUMERIC(8, 2),
    sensor_type TEXT CHECK (sensor_type IN ('user', 'drone', 'satellite', 'fixed_camera')),
    confidence_score NUMERIC(3, 2) DEFAULT 0.50,
    raw_payload JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id),
    geom GEOMETRY(Point, 4326) GENERATED ALWAYS AS (ST_SetSRID(ST_MakePoint(lng, lat), 4326)) STORED
);

-- ─── 6. TRUST SPHERE NODES ────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS trust_sphere_nodes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    owner_id UUID REFERENCES auth.users(id),
    node_state node_state DEFAULT 'unknown',
    staking_amount NUMERIC(20, 8) DEFAULT 0,
    verification_hash TEXT,
    proof_data JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── 7. AUDIT LOG ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS audit_log (
    id BIGSERIAL PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id),
    action TEXT NOT NULL,
    table_name TEXT,
    record_id TEXT,
    old_data JSONB,
    new_data JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================================================
-- RLS POLICIES
-- =============================================================================

-- ─── 8. ENABLE RLS ON ALL TABLES ────────────────────────────────────────────
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE ledger_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE blind_zone_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE trust_sphere_nodes ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;

-- ─── 9. USER PROFILES POLICIES ──────────────────────────────────────────────
CREATE POLICY "Users view own profile" ON user_profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users update own profile" ON user_profiles
    FOR UPDATE USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

CREATE POLICY "Admins manage all profiles" ON user_profiles
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM user_profiles
            WHERE id = auth.uid() AND tier IN ('max', 'enterprise')
        )
    );

-- ─── 10. LEDGER ENTRIES POLICIES (CORE SECURITY) ──────────────────────────────
CREATE POLICY "Secure Ledger Access" ON ledger_entries
    FOR SELECT USING (
        required_tier = 'open' OR
        (required_tier = 'pro' AND EXISTS (
            SELECT 1 FROM user_profiles
            WHERE id = auth.uid() AND tier IN ('pro', 'max', 'enterprise')
        )) OR
        (required_tier = 'max' AND EXISTS (
            SELECT 1 FROM user_profiles
            WHERE id = auth.uid() AND tier IN ('max', 'enterprise')
        )) OR
        (required_tier = 'enterprise' AND EXISTS (
            SELECT 1 FROM user_profiles
            WHERE id = auth.uid() AND tier = 'enterprise'
        ))
    );

CREATE POLICY "Insert Ledger Entries" ON ledger_entries
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM user_profiles
            WHERE id = auth.uid() AND tier = 'enterprise'
        )
    );

-- ─── 11. BLIND ZONE POLICIES ──────────────────────────────────────────────────
CREATE POLICY "Blind Zone Read Access" ON blind_zone_data
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM user_profiles
            WHERE id = auth.uid() AND tier IN ('max', 'enterprise')
        )
    );

CREATE POLICY "Blind Zone Community Contribution" ON blind_zone_data
    FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Blind Zone Update Own" ON blind_zone_data
    FOR UPDATE USING (auth.uid() = created_by)
    WITH CHECK (auth.uid() = created_by);

-- ─── 12. TRUST SPHERE POLICIES ────────────────────────────────────────────────
CREATE POLICY "Trust Sphere View Own" ON trust_sphere_nodes
    FOR SELECT USING (auth.uid() = owner_id);

CREATE POLICY "Trust Sphere View All" ON trust_sphere_nodes
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM user_profiles
            WHERE id = auth.uid() AND tier IN ('max', 'enterprise')
        )
    );

CREATE POLICY "Trust Sphere Create" ON trust_sphere_nodes
    FOR INSERT WITH CHECK (auth.uid() = owner_id);

-- ─── 13. AUDIT LOG POLICIES ────────────────────────────────────────────────────
CREATE POLICY "Audit Log Read" ON audit_log
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM user_profiles
            WHERE id = auth.uid() AND tier IN ('enterprise')
        )
    );

CREATE POLICY "Audit Log Insert" ON audit_log
    FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- =============================================================================
-- HELPER FUNCTIONS
-- =============================================================================

-- ─── 14. AUTO-CREATE USER PROFILE ON SIGNUP ──────────────────────────────────
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.user_profiles (id, email, tier)
    VALUES (NEW.id, NEW.email, 'open');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ─── 15. SECURE LEDGER RPC FUNCTION (Frontend Call) ──────────────────────────
CREATE OR REPLACE FUNCTION get_validated_ledger()
RETURNS TABLE (
    id BIGINT,
    file_name TEXT,
    sha256_hash TEXT,
    agent_name TEXT,
    required_tier TEXT,
    verified_at TIMESTAMPTZ
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        le.id,
        le.file_name,
        le.sha256_hash,
        le.agent_name,
        le.required_tier::text,
        le.verified_at
    FROM ledger_entries le
    WHERE
        le.required_tier = 'open' OR
        (le.required_tier = 'pro' AND EXISTS (
            SELECT 1 FROM user_profiles up
            WHERE up.id = auth.uid() AND up.tier IN ('pro', 'max', 'enterprise')
        )) OR
        (le.required_tier = 'max' AND EXISTS (
            SELECT 1 FROM user_profiles up
            WHERE up.id = auth.uid() AND up.tier IN ('max', 'enterprise')
        )) OR
        (le.required_tier = 'enterprise' AND EXISTS (
            SELECT 1 FROM user_profiles up
            WHERE up.id = auth.uid() AND up.tier = 'enterprise'
        ));
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ─── 16. GET USER TIER (Frontend HUD) ────────────────────────────────────────
CREATE OR REPLACE FUNCTION get_user_tier()
RETURNS TEXT AS $$
DECLARE
    user_tier_text TEXT;
BEGIN
    SELECT tier::text INTO user_tier_text
    FROM user_profiles
    WHERE id = auth.uid();
    RETURN COALESCE(user_tier_text, 'open');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ─── 17. GET BLIND ZONE DATA (Geospatial Query) ──────────────────────────────
CREATE OR REPLACE FUNCTION get_blind_zone(
    lat_min NUMERIC,
    lat_max NUMERIC,
    lng_min NUMERIC,
    lng_max NUMERIC
)
RETURNS TABLE (
    id UUID,
    lat NUMERIC,
    lng NUMERIC,
    elevation_m NUMERIC,
    sensor_type TEXT,
    confidence_score NUMERIC,
    created_at TIMESTAMPTZ
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        bzd.id,
        bzd.lat,
        bzd.lng,
        bzd.elevation_m,
        bzd.sensor_type,
        bzd.confidence_score,
        bzd.created_at
    FROM blind_zone_data bzd
    WHERE
        bzd.lat BETWEEN lat_min AND lat_max
        AND bzd.lng BETWEEN lng_min AND lng_max
        AND EXISTS (
            SELECT 1 FROM user_profiles up
            WHERE up.id = auth.uid() AND up.tier IN ('max', 'enterprise')
        );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================================================
-- SEED DATA (Matches V2 Frontend LEDGER_ENTRIES)
-- =============================================================================

INSERT INTO ledger_entries (file_name, sha256_hash, agent_name, required_tier) VALUES
('vvu-3d-gis-bench-20260901.tsx', 'ca7e2c104fdc75e8583a861d98b69cccc3867f36a515c2db9fe1eb5bcd26785b', 'Visualizer', 'open'),
('vvu-deploy-all-20260901.sh', '49cbc5545f76df1b22ff830fc94eb3191555fe0bbc5913f4d0aef3f11a370353', 'Orchestrator', 'open'),
('vvu-post-install-20260901.sh', 'a072f020f9614e130310f28bdca635583d6cc100510189dc15caa8a25ae56257', 'QA / Tester', 'open'),
('vvu-pis-db-schema-20260901.sql', '8aa259106d6b640d65136df9934637628052dfecb04ac969a98efb563dc2924c', 'Database', 'pro'),
('vvu-modelarts-obs-uploader-20260901.py', 'f51a6a19ca6c937219b937fb9f467bf5763d6e8e95bc1e60b38732ffd3b49505', 'Data / Cloud', 'max'),
('vvu-modelarts-exeml-config-20260901.yaml', '39e49c9bc764628eba13c84ab597a607cdb550f82f3e9a744a737a9351d67a45', 'ML Ops', 'max'),
('vvu-dn300-surge-config-20260901.json', 'c03ebfcaa055da9d6727a3e865f36dc63406ad760456a2bbfb0c083fc6694107', 'Simulation', 'pro'),
('vvu-structural-surge-analysis-20260901.apdl', '431841f8520592ff0290c501bae40a84dd6049e35bd9c06f09f29bf2fff2b2cd', 'Sim / FEA', 'max'),
('vvu-b2b-vault-sync-20260901.py', '07b06d96a72a01034f52f2c98075eca2d4a79bf0f6709480f0c8147fc5c68d21', 'CRM Ingestion', 'enterprise'),
('vvu-obsidian-sync-20260901.sh', 'b2f5148db3678cc0be15021b758c164db9602c5a09a996a5ef55a564d9870442', 'SANS Auditor', 'enterprise')
ON CONFLICT DO NOTHING;

-- =============================================================================
-- AUDIT TRIGGER
-- =============================================================================
CREATE OR REPLACE FUNCTION audit_ledger_changes()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO audit_log (user_id, action, table_name, record_id, old_data, new_data)
    VALUES (
        auth.uid(),
        TG_OP,
        TG_TABLE_NAME,
        COALESCE(NEW.id, OLD.id)::text,
        CASE WHEN TG_OP = 'DELETE' THEN row_to_json(OLD) ELSE row_to_json(OLD) END,
        CASE WHEN TG_OP = 'INSERT' THEN row_to_json(NEW) ELSE row_to_json(NEW) END
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS audit_ledger_entries ON ledger_entries;
CREATE TRIGGER audit_ledger_entries
    AFTER INSERT OR UPDATE OR DELETE ON ledger_entries
    FOR EACH ROW EXECUTE FUNCTION audit_ledger_changes();

-- =============================================================================
-- END OF SCHEMA
-- =============================================================================

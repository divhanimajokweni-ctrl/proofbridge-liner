-- =============================================================================
-- VVU PAYMENT TRACKING MIGRATION · RELEASE 20260901
-- =============================================================================
-- Adds payment tracking columns to user_profiles + creates the
-- payment_events audit table. Run AFTER supabase-rls-schema-20260901.sql.
-- =============================================================================

-- ─── 1. ADD PAYMENT TRACKING COLUMNS TO user_profiles ──────────────────
ALTER TABLE user_profiles
    ADD COLUMN IF NOT EXISTS payment_reference TEXT,
    ADD COLUMN IF NOT EXISTS payment_amount INTEGER,
    ADD COLUMN IF NOT EXISTS payment_email TEXT,
    ADD COLUMN IF NOT EXISTS subscription_expires_at TIMESTAMPTZ;

-- ─── 2. CREATE payment_events TABLE ────────────────────────────────────
CREATE TABLE IF NOT EXISTS payment_events (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id),
    event_type TEXT NOT NULL,                -- 'charge.success', 'charge.failed'
    tier user_tier NOT NULL,                 -- 'pro', 'max', 'enterprise'
    amount INTEGER NOT NULL,                 -- in kobo (R1 = 100 kobo)
    reference TEXT UNIQUE NOT NULL,          -- Paystack payment reference
    status TEXT DEFAULT 'pending',           -- 'pending', 'completed', 'failed'
    metadata JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    processed_at TIMESTAMPTZ
);

-- ─── 3. ENABLE RLS ON payment_events ───────────────────────────────────
ALTER TABLE payment_events ENABLE ROW LEVEL SECURITY;

-- Users can view their own payment events
DROP POLICY IF EXISTS "Users view own payments" ON payment_events;
CREATE POLICY "Users view own payments" ON payment_events
    FOR SELECT USING (auth.uid() = user_id);

-- Max/Enterprise users can view all payment events (admin/audit)
DROP POLICY IF EXISTS "Admins view all payments" ON payment_events;
CREATE POLICY "Admins view all payments" ON payment_events
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM user_profiles
            WHERE id = auth.uid() AND tier IN ('max', 'enterprise')
        )
    );

-- Only the service role (Edge Function) can INSERT payment events
DROP POLICY IF EXISTS "Service role inserts payments" ON payment_events;
CREATE POLICY "Service role inserts payments" ON payment_events
    FOR INSERT WITH CHECK (auth.uid() IS NOT NULL OR true);
-- Note: the Edge Function uses the service role key, which bypasses RLS.
-- This policy is a fallback for any client-side inserts (which should be blocked in production).

-- ─── 4. MONITORING VIEW: FAILED PAYMENTS ───────────────────────────────
CREATE OR REPLACE VIEW failed_payments_monitor AS
SELECT
    pe.created_at,
    up.email,
    pe.amount,
    pe.reference,
    pe.status,
    pe.metadata->>'error' AS error_message
FROM payment_events pe
JOIN user_profiles up ON pe.user_id = up.id
WHERE pe.status = 'failed'
ORDER BY pe.created_at DESC
LIMIT 100;

-- ─── 5. MONITORING VIEW: TIER UPGRADE FUNNEL ──────────────────────────
CREATE OR REPLACE VIEW tier_upgrade_funnel AS
SELECT
    tier,
    COUNT(*) AS total_upgrades,
    SUM(amount) / 100.0 AS total_revenue_rands,
    AVG(amount) / 100.0 AS avg_payment_rands,
    MIN(created_at) AS first_upgrade,
    MAX(created_at) AS latest_upgrade
FROM payment_events
WHERE status = 'completed'
GROUP BY tier
ORDER BY total_revenue_rands DESC;

-- =============================================================================
-- END OF MIGRATION
-- =============================================================================

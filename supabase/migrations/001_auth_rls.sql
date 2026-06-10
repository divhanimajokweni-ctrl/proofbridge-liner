-- File: supabase/migrations/001_auth_rls.sql
-- Description: Core schema schema with structural type guarantees and Gate B stubs.
-- Gate A Structural Remediations: Enforce unambiguous UUID types across relational entities
ALTER TABLE profiles ALTER COLUMN user_id SET DATA TYPE uuid;
ALTER TABLE contributions ALTER COLUMN user_id SET DATA TYPE uuid;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE contributions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Profiles self-isolation read constraint" ON profiles
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Contributions self-isolation read constraint" ON contributions
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admins system override query permission" ON contributions
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE profiles.user_id = auth.uid() AND profiles.role = 'admin')
  );
-- Embedded Watchdog Event Capture Log (Server Mirroring)
CREATE TABLE IF NOT EXISTS watchdog_incidents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  op_tag TEXT NOT NULL,
  priority TEXT NOT NULL,
  summary TEXT NOT NULL,
  error_log TEXT,
  timestamp TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE watchdog_incidents ENABLE ROW LEVEL SECURITY;
-- Restrict watchdog incidents insertion to service role or authenticated users with specific permissions
CREATE POLICY "System engine internal append privileges" ON watchdog_incidents
  FOR INSERT
  WITH CHECK (
    -- Allow service role to insert (for system processes)
    EXISTS (SELECT 1 WHERE auth.role() = 'service_role')
    OR
    -- Allow authenticated users to insert specific incident types (if needed)
    (auth.uid() IS NOT NULL AND op_tag IN ('GATE_A_COOKIE_FAULT', 'GATE_A_MIDDLEWARE_LOOP', 'GATE_A_RLS_VIOLATION', 'GATE_A_SESSION_TIMEOUT', 'GATE_A_CALLBACK_FAILED', 'GATE_A_HEALTH_DEGRADED'))
  );
-- Idempotency Key Storage for Webhook Processing
CREATE TABLE IF NOT EXISTS webhook_idempotency_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  idempotency_key TEXT UNIQUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  expires_at TIMESTAMPTZ NOT NULL
);
-- Index for efficient cleanup of expired idempotency keys
CREATE INDEX IF NOT EXISTS idx_webhook_idempotency_keys_expires_at ON webhook_idempotency_keys(expires_at);
-- Row Level Security for idempotency keys
ALTER TABLE webhook_idempotency_keys ENABLE ROW LEVEL SECURITY;
CREATE POLICY "System internal idempotency key management" ON webhook_idempotency_keys
  FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');
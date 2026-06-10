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
  id TEXT PRIMARY KEY,
  op_tag TEXT NOT NULL,
  priority TEXT NOT NULL,
  summary TEXT NOT NULL,
  error_log TEXT,
  timestamp TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE watchdog_incidents ENABLE ROW LEVEL SECURITY;
CREATE POLICY "System engine internal append privileges" ON watchdog_incidents
  FOR INSERT WITH CHECK (true);
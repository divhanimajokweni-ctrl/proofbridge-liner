-- 0003_rls_missing_policies.sql — Add RLS policies for tables missing them
-- Run this in: Supabase Dashboard → SQL Editor
-- Covers: analytics_events, community_managers, export_logs, live_activity

-- ANALYTICS_EVENTS
-- Internal analytics; allow service_role full access, facilitators read
CREATE POLICY "analytics_events_service_full" ON analytics_events
  FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');
CREATE POLICY "analytics_events_facilitator_select" ON analytics_events
  FOR SELECT USING (auth.jwt() ->> 'user_metadata'::text LIKE '%"facilitator"%');

-- COMMUNITY_MANAGERS
-- Manager records; allow facilitators full CRUD, members read
CREATE POLICY "community_managers_facilitator_full" ON community_managers
  FOR ALL USING (auth.jwt() ->> 'user_metadata'::text LIKE '%"facilitator"%');
CREATE POLICY "community_managers_member_select" ON community_managers
  FOR SELECT USING (auth.role() = 'authenticated');

-- EXPORT_LOGS
-- Audit logs; service_role full access, facilitators read-only
CREATE POLICY "export_logs_service_full" ON export_logs
  FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');
CREATE POLICY "export_logs_facilitator_select" ON export_logs
  FOR SELECT USING (auth.jwt() ->> 'user_metadata'::text LIKE '%"facilitator"%');

-- LIVE_ACTIVITY
-- Real-time activity feed; service_role full, authenticated users read
CREATE POLICY "live_activity_service_full" ON live_activity
  FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');
CREATE POLICY "live_activity_authenticated_select" ON live_activity
  FOR SELECT USING (auth.role() = 'authenticated');

-- SECURITY DEFINER FUNCTION — rls_auto_enable
-- Revoke EXECUTE from anon and authenticated; only service_role should run it
REVOKE EXECUTE ON FUNCTION public.rls_auto_enable() FROM anon, authenticated;
GRANT EXECUTE ON FUNCTION public.rls_auto_enable() TO service_role;

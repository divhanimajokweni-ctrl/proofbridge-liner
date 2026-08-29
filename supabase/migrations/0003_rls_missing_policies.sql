-- 0003_rls_missing_policies.sql — Add (idempotently) RLS policies for tables
-- Covers: analytics_events, community_managers, export_logs, live_activity

-- ANALYTICS_EVENTS
DROP POLICY IF EXISTS "analytics_events_service_full" ON analytics_events;
CREATE POLICY "analytics_events_service_full" ON analytics_events
  FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

DROP POLICY IF EXISTS "analytics_events_facilitator_select" ON analytics_events;
CREATE POLICY "analytics_events_facilitator_select" ON analytics_events
  FOR SELECT USING (auth.role() = 'authenticated' AND (auth.jwt() ->> 'user_metadata'::text) LIKE '%"facilitator"%');

-- COMMUNITY_MANAGERS
DROP POLICY IF EXISTS "community_managers_facilitator_full" ON community_managers;
CREATE POLICY "community_managers_facilitator_full" ON community_managers
  FOR ALL USING (auth.role() = 'authenticated' AND auth.jwt() ->> 'user_metadata'::text LIKE '%"facilitator"%');

DROP POLICY IF EXISTS "community_managers_member_select" ON community_managers;
CREATE POLICY "community_managers_member_select" ON community_managers
  FOR SELECT USING (auth.role() = 'authenticated');

-- EXPORT_LOGS
DROP POLICY IF EXISTS "export_logs_service_full" ON export_logs;
CREATE POLICY "export_logs_service_full" ON export_logs
  FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

DROP POLICY IF EXISTS "export_logs_facilitator_select" ON export_logs;
CREATE POLICY "export_logs_facilitator_select" ON export_logs
  FOR SELECT USING (auth.role() = 'authenticated' AND auth.jwt() ->> 'user_metadata'::text LIKE '%"facilitator"%');

-- LIVE_ACTIVITY
DROP POLICY IF EXISTS "live_activity_service_full" ON live_activity;
CREATE POLICY "live_activity_service_full" ON live_activity
  FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

DROP POLICY IF EXISTS "live_activity_authenticated_select" ON live_activity;
CREATE POLICY "live_activity_authenticated_select" ON live_activity
  FOR SELECT USING (auth.role() = 'authenticated');

-- SECURITY DEFINER FUNCTION — rls_auto_enable
REVOKE EXECUTE ON FUNCTION public.rls_auto_enable() FROM anon, authenticated;
GRANT EXECUTE ON FUNCTION public.rls_auto_enable() TO service_role;

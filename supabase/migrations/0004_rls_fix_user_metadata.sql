-- 0004_rls_fix_user_metadata.sql
-- SECURITY FIX (CRITICAL): RLS policies must not authorize on user_metadata.
--
-- WHY: `user_metadata` in the JWT is writable by the end user themselves
-- (supabase.auth.updateUser({ data: {...} })). Any policy that grants
-- privileges based on it can be bypassed — a normal user can set their own
-- metadata to include "facilitator" and read/write privileged tables.
-- Supabase's linter flags this as CRITICAL ("RLS references user metadata").
--
-- FIX: authorize on `app_metadata` instead. app_metadata is ONLY settable by
-- the service_role (admin) via the Admin API — users cannot edit it.
--
-- MIGRATION IMPACT (read before running):
--   The "facilitator" role must now live in app_metadata, not user_metadata.
--   Assign it with the service role, e.g.:
--     supabase.auth.admin.updateUserById(userId, {
--       app_metadata: { roles: ['facilitator'] }
--     })
--   Any facilitator currently marked only in user_metadata will LOSE access
--   until their app_metadata is set. Migrate existing facilitators first.
--
-- Idempotent: safe to re-run.

-- ============ 0002_rls.sql tables: pools / members / contributions ============

-- POOLS
DROP POLICY IF EXISTS "pools_select_own_or_facilitator" ON pools;
CREATE POLICY "pools_select_own_or_facilitator" ON pools
  FOR SELECT USING (
    auth.role() = 'authenticated'
    AND (
      auth.jwt() ->> 'app_metadata'::text LIKE '%"facilitator"%'
      OR created_by = auth.uid()
    )
  );

DROP POLICY IF EXISTS "pools_insert_facilitator" ON pools;
CREATE POLICY "pools_insert_facilitator" ON pools
  FOR INSERT WITH CHECK (
    auth.jwt() ->> 'app_metadata'::text LIKE '%"facilitator"%'
  );

DROP POLICY IF EXISTS "pools_update_facilitator" ON pools;
CREATE POLICY "pools_update_facilitator" ON pools
  FOR UPDATE USING (
    auth.jwt() ->> 'app_metadata'::text LIKE '%"facilitator"%'
  );

DROP POLICY IF EXISTS "pools_delete_facilitator" ON pools;
CREATE POLICY "pools_delete_facilitator" ON pools
  FOR DELETE USING (
    auth.jwt() ->> 'app_metadata'::text LIKE '%"facilitator"%'
  );

-- MEMBERS
DROP POLICY IF EXISTS "members_select_self_or_facilitator" ON members;
CREATE POLICY "members_select_self_or_facilitator" ON members
  FOR SELECT USING (
    auth.uid() = user_id
    OR auth.jwt() ->> 'app_metadata'::text LIKE '%"facilitator"%'
  );

-- CONTRIBUTIONS
DROP POLICY IF EXISTS "contributions_select_self_or_facilitator" ON contributions;
CREATE POLICY "contributions_select_self_or_facilitator" ON contributions
  FOR SELECT USING (
    auth.uid() = member_id
    OR auth.jwt() ->> 'app_metadata'::text LIKE '%"facilitator"%'
  );

-- ==== 0003_rls_missing_policies.sql tables: analytics_events / community_managers / export_logs ====
-- (These are the three tables the Supabase Security Advisor flagged CRITICAL.)

-- ANALYTICS_EVENTS
DROP POLICY IF EXISTS "analytics_events_facilitator_select" ON analytics_events;
CREATE POLICY "analytics_events_facilitator_select" ON analytics_events
  FOR SELECT USING (
    auth.role() = 'authenticated'
    AND (auth.jwt() ->> 'app_metadata'::text) LIKE '%"facilitator"%'
  );

-- COMMUNITY_MANAGERS
DROP POLICY IF EXISTS "community_managers_facilitator_full" ON community_managers;
CREATE POLICY "community_managers_facilitator_full" ON community_managers
  FOR ALL USING (
    auth.role() = 'authenticated'
    AND auth.jwt() ->> 'app_metadata'::text LIKE '%"facilitator"%'
  );

-- EXPORT_LOGS
DROP POLICY IF EXISTS "export_logs_facilitator_select" ON export_logs;
CREATE POLICY "export_logs_facilitator_select" ON export_logs
  FOR SELECT USING (
    auth.role() = 'authenticated'
    AND auth.jwt() ->> 'app_metadata'::text LIKE '%"facilitator"%'
  );

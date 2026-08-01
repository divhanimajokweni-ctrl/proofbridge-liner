-- 0002_rls.sql — Gate A: Row-Level Security for Ubuntu Pools
-- PRECONDITION: 0001_gate1_schema must be applied first (tables: pools, members, contributions)
-- Run this in: Supabase Dashboard → SQL Editor

-- Verify tables exist first (will error with 42P01 if missing)
DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'pools') THEN
    RAISE EXCEPTION 'Table "pools" does not exist. Run 0001_gate1_schema.sql first.';
  END IF;
  IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'members') THEN
    RAISE EXCEPTION 'Table "members" does not exist. Run 0001_gate1_schema.sql first.';
  END IF;
  IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'contributions') THEN
    RAISE EXCEPTION 'Table "contributions" does not exist. Run 0001_gate1_schema.sql first.';
  END IF;
END $$;

-- Enable RLS on all tables
ALTER TABLE pools ENABLE ROW LEVEL SECURITY;
ALTER TABLE members ENABLE ROW LEVEL SECURITY;
ALTER TABLE contributions ENABLE ROW LEVEL SECURITY;

-- POOLS policies
-- Facilitators can read/update all pools; members can see their own pools
CREATE POLICY "pools_select_own_or_facilitator" ON pools
  FOR SELECT USING (
    auth.role() = 'authenticated'
    AND (
      auth.jwt() ->> 'user_metadata'::text LIKE '%"facilitator"%'
      OR created_by = auth.uid()
    )
  );

CREATE POLICY "pools_insert_facilitator" ON pools
  FOR INSERT WITH CHECK (
    auth.jwt() ->> 'user_metadata'::text LIKE '%"facilitator"%'
  );

CREATE POLICY "pools_update_facilitator" ON pools
  FOR UPDATE USING (
    auth.jwt() ->> 'user_metadata'::text LIKE '%"facilitator"%'
  );

CREATE POLICY "pools_delete_facilitator" ON pools
  FOR DELETE USING (
    auth.jwt() ->> 'user_metadata'::text LIKE '%"facilitator"%'
  );

-- MEMBERS policies
-- Members can read/update their own record; facilitators can read all
CREATE POLICY "members_select_self_or_facilitator" ON members
  FOR SELECT USING (
    auth.uid() = user_id
    OR auth.jwt() ->> 'user_metadata'::text LIKE '%"facilitator"%'
  );

CREATE POLICY "members_insert_authenticated" ON members
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "members_update_self" ON members
  FOR UPDATE USING (auth.uid() = user_id);

-- CONTRIBUTIONS policies
-- Members can read their own contributions; facilitators can read all
CREATE POLICY "contributions_select_self_or_facilitator" ON contributions
  FOR SELECT USING (
    auth.uid() = member_id
    OR auth.jwt() ->> 'user_metadata'::text LIKE '%"facilitator"%'
  );

CREATE POLICY "contributions_insert_authenticated" ON contributions
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

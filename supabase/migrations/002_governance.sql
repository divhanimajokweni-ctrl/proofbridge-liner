-- ============================================================
-- 002_governance.sql — Gate D Governance Tables
-- Supabase migration for Ubuntu Pools governance
-- ============================================================

CREATE TABLE IF NOT EXISTS proposals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    pool_id UUID NOT NULL REFERENCES pools(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    proposal_type TEXT NOT NULL CHECK (proposal_type IN ('rule_change', 'payout', 'member_remove', 'fee_adjust')),
    status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'passed', 'rejected', 'executed')),
    created_by UUID NOT NULL REFERENCES players(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    starts_at TIMESTAMPTZ,
    ends_at TIMESTAMPTZ,
    executed_at TIMESTAMPTZ,
    execution_tx_hash TEXT,
    metadata JSONB DEFAULT '{}'::jsonb
);

CREATE TABLE IF NOT EXISTS votes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    proposal_id UUID NOT NULL REFERENCES proposals(id) ON DELETE CASCADE,
    voter_id UUID NOT NULL REFERENCES players(id),
    vote TEXT NOT NULL CHECK (vote IN ('for', 'against', 'abstain')),
    weight FLOAT NOT NULL DEFAULT 1.0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    tx_hash TEXT,
    UNIQUE(proposal_id, voter_id)
);

CREATE TABLE IF NOT EXISTS delegations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    delegator_id UUID NOT NULL REFERENCES players(id),
    delegate_id UUID NOT NULL REFERENCES players(id),
    pool_id UUID REFERENCES pools(id) ON DELETE CASCADE,
    active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    expires_at TIMESTAMPTZ,
    UNIQUE(delegator_id, pool_id)
);

CREATE INDEX idx_proposals_pool_id ON proposals(pool_id);
CREATE INDEX idx_proposals_status ON proposals(status);
CREATE INDEX idx_votes_proposal_id ON votes(proposal_id);
CREATE INDEX idx_votes_voter_id ON votes(voter_id);
CREATE INDEX idx_delegations_delegator_id ON delegations(delegator_id);
CREATE INDEX idx_delegations_delegate_id ON delegations(delegate_id);
CREATE INDEX idx_delegations_active ON delegations(active);

ALTER TABLE proposals ENABLE ROW LEVEL SECURITY;
ALTER TABLE votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE delegations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read proposals" ON proposals
    FOR SELECT USING (true);

CREATE POLICY "Pool members can create proposals" ON proposals
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM pool_members 
            WHERE pool_id = proposals.pool_id 
            AND player_id = auth.uid()
        )
    );

CREATE POLICY "Anyone can read votes" ON votes
    FOR SELECT USING (true);

CREATE POLICY "Pool members can vote" ON votes
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM pool_members 
            WHERE pool_id = (SELECT pool_id FROM proposals WHERE id = votes.proposal_id)
            AND player_id = auth.uid()
        )
    );

CREATE POLICY "Users can manage their delegations" ON delegations
    FOR ALL USING (delegator_id = auth.uid());

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export type ProposalType = 'rule_change' | 'payout' | 'member_remove' | 'fee_adjust';
export type ProposalStatus = 'draft' | 'active' | 'passed' | 'rejected' | 'executed';
export type VoteType = 'for' | 'against' | 'abstain';

export interface Proposal {
    id: string;
    poolId: string;
    title: string;
    description: string;
    type: ProposalType;
    status: ProposalStatus;
    createdBy: string;
    createdAt: string;
    startsAt: string | null;
    endsAt: string | null;
    executedAt: string | null;
    executionTxHash: string | null;
    metadata: Record<string, any>;
}

export interface Vote {
    id: string;
    proposalId: string;
    voterId: string;
    vote: VoteType;
    weight: number;
    createdAt: string;
    txHash: string | null;
}

export interface Delegation {
    id: string;
    delegatorId: string;
    delegateId: string;
    poolId: string | null;
    active: boolean;
    createdAt: string;
    expiresAt: string | null;
}

export class GovernanceService {
    async createProposal(
        poolId: string,
        title: string,
        description: string,
        type: ProposalType,
        metadata: Record<string, any> = {}
    ): Promise<Proposal> {
        const { data, error } = await supabase
            .from('proposals')
            .insert({
                pool_id: poolId,
                title,
                description,
                proposal_type: type,
                status: 'draft',
                created_by: (await this.getCurrentUser()).id,
                metadata,
            })
            .select()
            .single();

        if (error) throw new Error(`Failed to create proposal: ${error.message}`);
        return this.mapProposal(data);
    }

    async getProposals(poolId: string, status?: ProposalStatus): Promise<Proposal[]> {
        let query = supabase
            .from('proposals')
            .select('*')
            .eq('pool_id', poolId)
            .order('created_at', { ascending: false });

        if (status) {
            query = query.eq('status', status);
        }

        const { data, error } = await query;

        if (error) throw new Error(`Failed to fetch proposals: ${error.message}`);
        return data.map(this.mapProposal);
    }

    async getProposal(proposalId: string): Promise<Proposal> {
        const { data, error } = await supabase
            .from('proposals')
            .select('*')
            .eq('id', proposalId)
            .single();

        if (error) throw new Error(`Failed to fetch proposal: ${error.message}`);
        return this.mapProposal(data);
    }

    async activateProposal(proposalId: string, durationDays: number = 7): Promise<Proposal> {
        const startsAt = new Date();
        const endsAt = new Date(startsAt.getTime() + durationDays * 24 * 60 * 60 * 1000);

        const { data, error } = await supabase
            .from('proposals')
            .update({
                status: 'active',
                starts_at: startsAt.toISOString(),
                ends_at: endsAt.toISOString(),
            })
            .eq('id', proposalId)
            .select()
            .single();

        if (error) throw new Error(`Failed to activate proposal: ${error.message}`);
        return this.mapProposal(data);
    }

    async castVote(proposalId: string, vote: VoteType): Promise<Vote> {
        const user = await this.getCurrentUser();

        const { data, error } = await supabase
            .from('votes')
            .insert({
                proposal_id: proposalId,
                voter_id: user.id,
                vote,
                weight: await this.getVotingWeight(user.id),
            })
            .select()
            .single();

        if (error) throw new Error(`Failed to cast vote: ${error.message}`);
        return this.mapVote(data);
    }

    async getVotes(proposalId: string): Promise<Vote[]> {
        const { data, error } = await supabase
            .from('votes')
            .select('*')
            .eq('proposal_id', proposalId);

        if (error) throw new Error(`Failed to fetch votes: ${error.message}`);
        return data.map(this.mapVote);
    }

    async getVoteTotals(proposalId: string): Promise<{ for: number; against: number; abstain: number }> {
        const votes = await this.getVotes(proposalId);
        
        return votes.reduce(
            (acc, v) => {
                if (v.vote === 'for') acc.for += v.weight;
                else if (v.vote === 'against') acc.against += v.weight;
                else acc.abstain += v.weight;
                return acc;
            },
            { for: 0, against: 0, abstain: 0 }
        );
    }

    async getVotingWeight(playerId: string): Promise<number> {
        const { data: score } = await supabase
            .from('scores')
            .select('score')
            .eq('player_id', playerId)
            .single();

        const baseWeight = 1.0;
        const scoreBonus = score ? Math.floor(score.score / 20) : 0;
        
        return baseWeight + scoreBonus;
    }

    async delegate(delegatorId: string, delegateId: string, poolId?: string): Promise<Delegation> {
        await supabase
            .from('delegations')
            .update({ active: false })
            .eq('delegator_id', delegatorId)
            .eq('pool_id', poolId || null);

        const { data, error } = await supabase
            .from('delegations')
            .insert({
                delegator_id: delegatorId,
                delegate_id: delegateId,
                pool_id: poolId || null,
                active: true,
            })
            .select()
            .single();

        if (error) throw new Error(`Failed to delegate: ${error.message}`);
        return this.mapDelegation(data);
    }

    async getDelegations(delegatorId: string): Promise<Delegation[]> {
        const { data, error } = await supabase
            .from('delegations')
            .select('*')
            .eq('delegator_id', delegatorId)
            .eq('active', true);

        if (error) throw new Error(`Failed to fetch delegations: ${error.message}`);
        return data.map(this.mapDelegation);
    }

    private async getCurrentUser(): Promise<{ id: string }> {
        const { data, error } = await supabase.auth.getUser();
        if (error || !data.user) {
            throw new Error('User not authenticated');
        }
        return { id: data.user.id };
    }

    private mapProposal(data: any): Proposal {
        return {
            id: data.id,
            poolId: data.pool_id,
            title: data.title,
            description: data.description,
            type: data.proposal_type,
            status: data.status,
            createdBy: data.created_by,
            createdAt: data.created_at,
            startsAt: data.starts_at,
            endsAt: data.ends_at,
            executedAt: data.executed_at,
            executionTxHash: data.execution_tx_hash,
            metadata: data.metadata || {},
        };
    }

    private mapVote(data: any): Vote {
        return {
            id: data.id,
            proposalId: data.proposal_id,
            voterId: data.voter_id,
            vote: data.vote,
            weight: data.weight,
            createdAt: data.created_at,
            txHash: data.tx_hash,
        };
    }

    private mapDelegation(data: any): Delegation {
        return {
            id: data.id,
            delegatorId: data.delegator_id,
            delegateId: data.delegate_id,
            poolId: data.pool_id,
            active: data.active,
            createdAt: data.created_at,
            expiresAt: data.expires_at,
        };
    }
}

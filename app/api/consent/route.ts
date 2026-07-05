import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

function getSupabase() {
    const url = process.env.SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !key) {
        throw new Error('SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set');
    }
    // Validate URL to prevent "Invalid supabaseUrl" throw from placeholder values
    try { new URL(url); } catch {
        throw new Error('SUPABASE_URL is malformed. Check Replit secrets or .env.local');
    }
    return createClient(url, key);
}

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest): Promise<NextResponse> {
    try {
        const body = await req.json();
        const { playerId, consentType, version } = body;

        if (!playerId) {
            return NextResponse.json(
                { error: 'playerId is required' },
                { status: 400 }
            );
        }

        if (!consentType || !['marketing', 'analytics', 'retention'].includes(consentType)) {
            return NextResponse.json(
                { error: 'consentType must be: marketing, analytics, or retention' },
                { status: 400 }
            );
        }

        const { data, error } = await getSupabase()
            .from('consent_records')
            .insert({
                player_id: playerId,
                consent_type: consentType,
                version: version || '1.0',
                consented_at: new Date().toISOString(),
                expires_at: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
                ip_address: req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown',
                user_agent: req.headers.get('user-agent') || 'unknown',
            })
            .select()
            .single();

        if (error) {
            console.error('[consent] Database error:', error);
            return NextResponse.json(
                { error: 'Failed to record consent' },
                { status: 500 }
            );
        }

        return NextResponse.json({
            success: true,
            consentId: data.id,
            expiresAt: data.expires_at,
            type: consentType,
        }, { status: 200 });

    } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        console.error('[consent] Error:', message);
        return NextResponse.json(
            { error: message },
            { status: 500 }
        );
    }
}

export async function GET(req: NextRequest): Promise<NextResponse> {
    try {
        const { searchParams } = new URL(req.url);
        const playerId = searchParams.get('playerId');
        const consentType = searchParams.get('type');

        if (!playerId) {
            return NextResponse.json(
                { error: 'playerId is required' },
                { status: 400 }
            );
        }

        let query = getSupabase()
            .from('consent_records')
            .select('*')
            .eq('player_id', playerId)
            .eq('active', true)
            .order('consented_at', { ascending: false });

        if (consentType) {
            query = query.eq('consent_type', consentType);
        }

        const { data, error } = await query.limit(10);

        if (error) {
            console.error('[consent] Database error:', error);
            return NextResponse.json(
                { error: 'Failed to fetch consent records' },
                { status: 500 }
            );
        }

        return NextResponse.json({
            success: true,
            consents: data,
        }, { status: 200 });

    } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        return NextResponse.json(
            { error: message },
            { status: 500 }
        );
    }
}

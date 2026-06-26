// app/api/github/token/route.ts
import { NextResponse } from 'next/server';
import axios from 'axios';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { installationId } = body;

    if (!installationId) {
      return NextResponse.json({ error: 'Missing mandatory installationId parameter.' }, { status: 400 });
    }

    // 1. Resolve target GitHub REST API destination
    const targetUrl = `https://github.com/app/installations/${installationId}/access_tokens`;
    
    // 2. Safely resolve override posture from environment variables
    const headerOverrideMode = process.env.GITHUB_TOKEN_OVERRIDE_MODE || 'absent';

    const headers: Record<string, string> = {
      'Accept': 'application/vnd.github+json',
      'Authorization': `Bearer ${generateAppJSONWebToken()}`, // Your App signature generator
    };

    // 3. Inject the per-request override header if not set to standard rollout behavior
    if (headerOverrideMode === 'enabled' || headerOverrideMode === 'disabled') {
      headers['X-GitHub-Stateless-S2S-Token'] = headerOverrideMode;
    }

    // 4. Request the installation token from remote endpoint
    const response = await axios.post(targetUrl, {}, { headers });
    const { token, expires_at } = response.data;

    // 5. Sanity check length constraints to prevent internal database corruption
    if (token.length > parseInt(process.env.MAX_TOKEN_LENGTH_LIMIT || '520', 10)) {
      throw new Error(`Token length (${token.length}) exceeds system storage limits.`);
    }

    return NextResponse.json({
      success: true,
      tokenType: token.includes('.') ? 'STATELESS_JWT' : 'STATEFUL_OPAQUE',
      token: token,
      expiresAt: expires_at
    }, { status: 200 });

  } catch (err: any) {
    console.error('[GITHUB-AUTH-ENGINE-ERROR]:', err.response?.data || err.message);
    return NextResponse.json({ 
      error: 'Failed to negotiate token format with upstream provider.',
      details: err.message 
    }, { status: 500 });
  }
}

function generateAppJSONWebToken(): string {
  // In production, insert your standard GitHub App RS256 private key signing routine here
  return "STUB_APP_JWT";
}

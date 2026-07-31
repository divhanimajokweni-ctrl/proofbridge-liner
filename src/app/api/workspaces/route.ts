import { NextResponse } from 'next/server';
import type { EpistemicMaturity, WorkspaceMode } from '@/lib/vvu/three-roots';

// ---------------------------------------------------------------------------
// GET /api/workspaces
// Returns workspace data: list of workspaces at different maturity stages
// ---------------------------------------------------------------------------

export async function GET() {
  // Mock 3 workspaces at different maturity stages
  const workspaces = [
    {
      id: 'ws-001',
      name: 'Klipfontein Water Loss Investigation',
      description: 'Detecting and resolving water loss in Cape Town Klipfontein supply network using HBK inference and ProofBridge verification.',
      maturity: 'operational' as EpistemicMaturity,
      mode: 'operations' as WorkspaceMode,
      ownerId: 'user-engineer-001',
      capabilityIds: ['detect-water-loss', 'run-inference', 'verify-authenticity', 'trace-provenance'],
      tags: ['water-infrastructure', 'cape-town', 'hbk'],
      currentMaturity: 'operational' as EpistemicMaturity,
      targetMaturity: 'institutional-memory' as EpistemicMaturity,
      eventCount: 6,
      attestationCount: 2,
      confidenceScore: 0.94,
      createdAt: '2025-03-01T07:00:00Z',
      updatedAt: '2025-03-04T10:00:00Z',
    },
    {
      id: 'ws-002',
      name: 'Gugulethu Stokvel Pool',
      description: 'Community savings pool for the Gugulethu neighbourhood. Ubuntu Score tracking and ProofBridge receipt verification.',
      maturity: 'observed' as EpistemicMaturity,
      mode: 'engineering' as WorkspaceMode,
      ownerId: 'user-community-002',
      capabilityIds: ['manage-community-pools', 'verify-authenticity'],
      tags: ['stokvel', 'community-finance', 'gugulethu'],
      currentMaturity: 'observed' as EpistemicMaturity,
      targetMaturity: 'attested' as EpistemicMaturity,
      eventCount: 2,
      attestationCount: 0,
      confidenceScore: 0.45,
      createdAt: '2025-03-05T10:00:00Z',
      updatedAt: '2025-03-05T12:00:00Z',
    },
    {
      id: 'ws-003',
      name: 'AIR Runtime Circuit Breaker Audit',
      description: 'Compliance audit of the Agentic Inference Runtime circuit breaker state machine and NATS queue management.',
      maturity: 'attested' as EpistemicMaturity,
      mode: 'compliance' as WorkspaceMode,
      ownerId: 'user-compliance-003',
      capabilityIds: ['monitor-circuit-health', 'trace-provenance'],
      tags: ['circuit-breaker', 'compliance', 'audit'],
      currentMaturity: 'attested' as EpistemicMaturity,
      targetMaturity: 'institutional-memory' as EpistemicMaturity,
      eventCount: 12,
      attestationCount: 5,
      confidenceScore: 0.87,
      createdAt: '2025-02-15T08:00:00Z',
      updatedAt: '2025-03-10T16:00:00Z',
    },
  ];

  return NextResponse.json({
    workspaces,
    summary: {
      totalWorkspaces: workspaces.length,
      byMaturity: {
        unknown: workspaces.filter((w) => w.maturity === 'unknown').length,
        observed: workspaces.filter((w) => w.maturity === 'observed').length,
        investigated: workspaces.filter((w) => w.maturity === 'investigated').length,
        verified: workspaces.filter((w) => w.maturity === 'verified').length,
        attested: workspaces.filter((w) => w.maturity === 'attested').length,
        operational: workspaces.filter((w) => w.maturity === 'operational').length,
        'institutional-memory': workspaces.filter((w) => w.maturity === 'institutional-memory').length,
      },
      byMode: {
        engineering: workspaces.filter((w) => w.mode === 'engineering').length,
        review: workspaces.filter((w) => w.mode === 'review').length,
        operations: workspaces.filter((w) => w.mode === 'operations').length,
        compliance: workspaces.filter((w) => w.mode === 'compliance').length,
        executive: workspaces.filter((w) => w.mode === 'executive').length,
      },
      totalEvents: workspaces.reduce((sum, w) => sum + w.eventCount, 0),
      totalAttestations: workspaces.reduce((sum, w) => sum + w.attestationCount, 0),
      averageConfidence: workspaces.reduce((sum, w) => sum + w.confidenceScore, 0) / workspaces.length,
    },
  });
}

// ---------------------------------------------------------------------------
// POST /api/workspaces
// Create a new workspace
// ---------------------------------------------------------------------------

export async function POST(request: Request) {
  try {
    const body = await request.json();

    // Validate required fields
    if (!body.name || typeof body.name !== 'string') {
      return NextResponse.json(
        { error: 'Workspace name is required' },
        { status: 400 }
      );
    }

    // Create a new workspace (mock — in production, this would use Prisma)
    const newWorkspace = {
      id: `ws-${Date.now()}`,
      name: body.name,
      description: body.description || '',
      maturity: (body.maturity || 'unknown') as EpistemicMaturity,
      mode: (body.mode || 'engineering') as WorkspaceMode,
      ownerId: body.ownerId || 'anonymous',
      capabilityIds: body.capabilityIds || [],
      tags: body.tags || [],
      currentMaturity: (body.currentMaturity || 'unknown') as EpistemicMaturity,
      targetMaturity: (body.targetMaturity || 'verified') as EpistemicMaturity,
      eventCount: 0,
      attestationCount: 0,
      confidenceScore: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    return NextResponse.json(
      {
        workspace: newWorkspace,
        message: 'Workspace created successfully',
      },
      { status: 201 }
    );
  } catch {
    return NextResponse.json(
      { error: 'Invalid request body' },
      { status: 400 }
    );
  }
}

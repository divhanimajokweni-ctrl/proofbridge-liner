import { NextResponse } from 'next/server';
import type { EngineeringEvent, EpistemicMaturity } from '@/lib/vvu/three-roots';

// ---------------------------------------------------------------------------
// GET /api/history-root
// Returns history root data: engineering events, chain integrity, event count by maturity
// ---------------------------------------------------------------------------

export async function GET() {
  // Mock 8 engineering events spanning different maturity stages
  const events: EngineeringEvent[] = [
    {
      id: 'evt-001',
      timestamp: '2025-03-01T08:00:00Z',
      type: 'observation',
      payload: {
        sensorId: 'water-pressure-ct-042',
        reading: 4.2,
        unit: 'bar',
        location: 'Cape Town - Klipfontein',
      },
      previousHash: '0000000000000000000000000000000000000000000000000000000000000000',
      eventHash: 'a1b2c3d4e5f6789012345678901234567890abcdef1234567890abcdef123456',
      maturity: 'observed',
      workspaceId: 'ws-001',
      capabilityId: 'detect-water-loss',
    },
    {
      id: 'evt-002',
      timestamp: '2025-03-01T09:15:00Z',
      type: 'hypothesis',
      payload: {
        hypothesis: 'Pressure drop indicates leak in main supply line',
        confidence: 0.65,
        evidenceIds: ['evt-001'],
      },
      previousHash: 'a1b2c3d4e5f6789012345678901234567890abcdef1234567890abcdef123456',
      eventHash: 'b2c3d4e5f6789012345678901234567890abcdef1234567890abcdef1234567',
      maturity: 'investigated',
      workspaceId: 'ws-001',
      capabilityId: 'detect-water-loss',
    },
    {
      id: 'evt-003',
      timestamp: '2025-03-01T10:30:00Z',
      type: 'simulation',
      payload: {
        model: 'HBK-MCMC-v3',
        branch: 'leak-klipfontein-001',
        brierScore: 0.018,
        result: 'TRIP verdict: potential leak confirmed',
      },
      previousHash: 'b2c3d4e5f6789012345678901234567890abcdef1234567890abcdef1234567',
      eventHash: 'c3d4e5f6789012345678901234567890abcdef1234567890abcdef123456789',
      maturity: 'investigated',
      workspaceId: 'ws-001',
      capabilityId: 'run-inference',
    },
    {
      id: 'evt-004',
      timestamp: '2025-03-01T14:00:00Z',
      type: 'evidence',
      payload: {
        evidenceType: 'replay_verification',
        replayResult: 'PASS',
        derivationLogHash: 'def456789012345678901234567890abcdef1234567890abcdef1234567890ab',
        validationIndex: 94.2,
      },
      previousHash: 'c3d4e5f6789012345678901234567890abcdef1234567890abcdef123456789',
      eventHash: 'd4e5f6789012345678901234567890abcdef1234567890abcdef12345678901',
      maturity: 'verified',
      workspaceId: 'ws-001',
      capabilityId: 'verify-authenticity',
    },
    {
      id: 'evt-005',
      timestamp: '2025-03-02T08:00:00Z',
      type: 'attestation',
      payload: {
        attestationType: 'ed25519_receipt',
        certificateId: 'cert-001',
        signedBy: 'proofbridge@vvu',
        claim: 'Water loss detection replay verified with Brier ≤ 0.02',
      },
      previousHash: 'd4e5f6789012345678901234567890abcdef1234567890abcdef12345678901',
      eventHash: 'e5f6789012345678901234567890abcdef1234567890abcdef123456789012',
      maturity: 'attested',
      workspaceId: 'ws-001',
      capabilityId: 'verify-authenticity',
    },
    {
      id: 'evt-006',
      timestamp: '2025-03-03T06:00:00Z',
      type: 'operational',
      payload: {
        action: 'dispatch_maintenance_crew',
        location: 'Cape Town - Klipfontein Main',
        priority: 'HIGH',
        referenceEvent: 'evt-005',
        eta: '2 hours',
      },
      previousHash: 'e5f6789012345678901234567890abcdef1234567890abcdef123456789012',
      eventHash: 'f6789012345678901234567890abcdef1234567890abcdef12345678901234',
      maturity: 'operational',
      workspaceId: 'ws-001',
      capabilityId: 'detect-water-loss',
    },
    {
      id: 'evt-007',
      timestamp: '2025-03-04T10:00:00Z',
      type: 'memory',
      payload: {
        archiveType: 'institutional_memory',
        summary: 'Klipfontein water loss incident — full lifecycle from detection to resolution',
        lessonsLearned: [
          'HBK Brier score threshold of 0.02 correctly identified the leak',
          'Replay verification confirmed the MCMC derivation',
          '72h response time from detection to dispatch',
        ],
        provenanceChain: ['evt-001', 'evt-002', 'evt-003', 'evt-004', 'evt-005', 'evt-006'],
      },
      previousHash: 'f6789012345678901234567890abcdef1234567890abcdef12345678901234',
      eventHash: '6789012345678901234567890abcdef1234567890abcdef123456789012345',
      maturity: 'institutional-memory',
      workspaceId: 'ws-001',
      capabilityId: 'trace-provenance',
    },
    {
      id: 'evt-008',
      timestamp: '2025-03-05T12:00:00Z',
      type: 'observation',
      payload: {
        sensorId: 'ubuntu-pools-ct-001',
        reading: 'pool contribution verified',
        poolId: 'stokvel-gugulethu-003',
        amount: 500,
        currency: 'ZAR',
      },
      previousHash: '6789012345678901234567890abcdef1234567890abcdef123456789012345',
      eventHash: '789012345678901234567890abcdef1234567890abcdef1234567890123456',
      maturity: 'unknown',
      workspaceId: 'ws-002',
      capabilityId: 'manage-community-pools',
    },
  ];

  // Chain integrity verification
  // In a real system, we would verify each event's previousHash matches the prior event's eventHash
  // For mock data, we validate the chain links
  let chainIntegrityValid = true;
  for (let i = 1; i < events.length; i++) {
    if (events[i].previousHash !== events[i - 1].eventHash) {
      chainIntegrityValid = false;
      break;
    }
  }

  const chainIntegrity = {
    valid: chainIntegrityValid,
    verifiedAt: new Date().toISOString(),
    totalBlocks: events.length,
    genesisHash: events[0].previousHash,
    tipHash: events[events.length - 1].eventHash,
    algorithm: 'SHA-256',
  };

  // Event count by maturity stage
  const eventCountByMaturity: Record<EpistemicMaturity, number> = {
    unknown: 0,
    observed: 0,
    investigated: 0,
    verified: 0,
    attested: 0,
    operational: 0,
    'institutional-memory': 0,
  };

  for (const event of events) {
    eventCountByMaturity[event.maturity]++;
  }

  // Event count by workspace
  const eventCountByWorkspace: Record<string, number> = {};
  for (const event of events) {
    eventCountByWorkspace[event.workspaceId] =
      (eventCountByWorkspace[event.workspaceId] || 0) + 1;
  }

  return NextResponse.json({
    events,
    chainIntegrity,
    eventCountByMaturity,
    eventCountByWorkspace,
    summary: {
      totalEvents: events.length,
      uniqueWorkspaces: Object.keys(eventCountByWorkspace).length,
      uniqueCapabilities: [...new Set(events.filter((e) => e.capabilityId).map((e) => e.capabilityId!))].length,
      earliestEvent: events[0].timestamp,
      latestEvent: events[events.length - 1].timestamp,
    },
  });
}

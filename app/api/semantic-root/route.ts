import { NextResponse } from 'next/server';
import type {
  EnvironmentDescriptor,
  SemanticIntegrityEvent,
} from '@/lib/vvu/three-roots';

// ---------------------------------------------------------------------------
// GET /api/semantic-root
// Returns semantic root data: environment descriptors, integrity events, active env info
// ---------------------------------------------------------------------------

export async function GET() {
  // Mock 2 environment descriptors:
  // 1. ACTIVE/SOUND — the current production environment
  // 2. SUPERSEDED/DEFECTIVE — a previously active environment with a known defect
  const environments: EnvironmentDescriptor[] = [
    {
      id: 'env-001',
      solverHash: 'sha256:abc123def456789012345678901234567890abcdef1234567890abcdef1234',
      ontologyHash: 'sha256:789012345678901234567890abcdef1234567890abcdef1234567890123456',
      policyHash: 'sha256:def456789012345678901234567890abcdef1234567890abcdef1234567890',
      canonicalizationHash: 'sha256:1234567890abcdef1234567890abcdef1234567890abcdef1234567890123456',
      runtimeHash: 'sha256:4567890abcdef1234567890abcdef1234567890abcdef1234567890123456789',
      lifecycle: 'ACTIVE',
      integrity: 'SOUND',
      createdAt: '2025-01-15T08:00:00Z',
    },
    {
      id: 'env-002',
      solverHash: 'sha256:oldabc123def456789012345678901234567890abcdef1234567890abcdef12',
      ontologyHash: 'sha256:old789012345678901234567890abcdef1234567890abcdef12345678901234',
      policyHash: 'sha256:olddef456789012345678901234567890abcdef1234567890abcdef12345678',
      canonicalizationHash: 'sha256:old1234567890abcdef1234567890abcdef1234567890abcdef123456789012',
      runtimeHash: 'sha256:old4567890abcdef1234567890abcdef1234567890abcdef123456789012345',
      lifecycle: 'SUPERSEDED',
      integrity: 'DEFECTIVE',
      createdAt: '2024-11-20T14:00:00Z',
      supersededAt: '2025-01-15T08:00:00Z',
    },
  ];

  // Mock 1 semantic integrity event — the defect that caused env-002 to be superseded
  const integrityEvents: SemanticIntegrityEvent[] = [
    {
      id: 'sie-001',
      environmentId: 'env-002',
      defect: 'bayesian_scoring_bug',
      classification: 'logic',
      discoveryEvidence: JSON.stringify({
        trigger: 'HBK MCMC derivation produced non-reproducible Brier scores',
        affectedVersions: ['v2.3.0', 'v2.3.1'],
        detectionMethod: 'Automated replay verification failed — Brier score drift > 0.005',
        reportedBy: 'compliance-agent@vvu',
      }),
      remediationStrategy: 'full_reverification',
      affectedBlockRange: { start: 142, end: 287 },
      replacementEnvironmentId: 'env-001',
      timestamp: '2025-01-14T22:30:00Z',
    },
  ];

  // Current active environment info
  const activeEnvironment = environments.find(
    (env) => env.lifecycle === 'ACTIVE' && env.integrity === 'SOUND'
  );

  const currentActiveEnvironmentInfo = activeEnvironment
    ? {
        id: activeEnvironment.id,
        status: `${activeEnvironment.lifecycle}/${activeEnvironment.integrity}`,
        solverHash: activeEnvironment.solverHash,
        ontologyHash: activeEnvironment.ontologyHash,
        policyHash: activeEnvironment.policyHash,
        runtimeHash: activeEnvironment.runtimeHash,
        createdAt: activeEnvironment.createdAt,
        supersededEnvironments: environments
          .filter((env) => env.lifecycle === 'SUPERSEDED')
          .map((env) => ({
            id: env.id,
            supersededAt: env.supersededAt,
            defect: integrityEvents.find((sie) => sie.environmentId === env.id)?.defect ?? null,
          })),
      }
    : null;

  return NextResponse.json({
    environments,
    integrityEvents,
    currentActiveEnvironmentInfo,
    summary: {
      totalEnvironments: environments.length,
      activeEnvironments: environments.filter((env) => env.lifecycle === 'ACTIVE').length,
      supersededEnvironments: environments.filter((env) => env.lifecycle === 'SUPERSEDED').length,
      soundEnvironments: environments.filter((env) => env.integrity === 'SOUND').length,
      defectiveEnvironments: environments.filter((env) => env.integrity === 'DEFECTIVE').length,
      totalIntegrityEvents: integrityEvents.length,
    },
  });
}

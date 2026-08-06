import { NextResponse } from 'next/server';
import type { TrustPassport, TrustPassportEntry } from '@/lib/vvu/three-roots';
import {
  calculateOverallMaturity,
  calculateTrustScore,
} from '@/lib/vvu/three-roots';

// ---------------------------------------------------------------------------
// GET /api/trust-passport
// Returns trust passport data: entries for each capability, overall maturity, stats
// ---------------------------------------------------------------------------

export async function GET() {
  // Mock trust passport entries — one per capability, at various maturity stages
  const entries: Record<string, TrustPassportEntry> = {
    'verify-authenticity': {
      capabilityId: 'verify-authenticity',
      maturity: 'attested',
      completedSteps: ['va-discover', 'va-learn', 'va-interactive', 'va-reveal'],
      totalSteps: 4,
      lastUpdated: '2025-03-12T11:45:00Z',
      eventCount: 3,
      attestationCount: 2,
      environmentSound: true,
    },
    'detect-water-loss': {
      capabilityId: 'detect-water-loss',
      maturity: 'operational',
      completedSteps: ['dwl-discover', 'dwl-learn', 'dwl-interactive', 'dwl-reveal'],
      totalSteps: 4,
      lastUpdated: '2025-03-03T06:00:00Z',
      eventCount: 4,
      attestationCount: 1,
      environmentSound: true,
    },
    'manage-community-pools': {
      capabilityId: 'manage-community-pools',
      maturity: 'observed',
      completedSteps: ['mcp-discover'],
      totalSteps: 4,
      lastUpdated: '2025-03-05T12:00:00Z',
      eventCount: 1,
      attestationCount: 0,
      environmentSound: true,
    },
    'run-inference': {
      capabilityId: 'run-inference',
      maturity: 'investigated',
      completedSteps: ['ri-discover', 'ri-learn'],
      totalSteps: 4,
      lastUpdated: '2025-03-01T10:30:00Z',
      eventCount: 2,
      attestationCount: 0,
      environmentSound: true,
    },
    'trace-provenance': {
      capabilityId: 'trace-provenance',
      maturity: 'institutional-memory',
      completedSteps: ['tp-discover', 'tp-learn', 'tp-interactive', 'tp-reveal'],
      totalSteps: 4,
      lastUpdated: '2025-03-04T10:00:00Z',
      eventCount: 5,
      attestationCount: 3,
      environmentSound: true,
    },
    'monitor-circuit-health': {
      capabilityId: 'monitor-circuit-health',
      maturity: 'attested',
      completedSteps: ['mch-discover', 'mch-learn', 'mch-interactive', 'mch-reveal'],
      totalSteps: 4,
      lastUpdated: '2025-03-10T16:00:00Z',
      eventCount: 8,
      attestationCount: 5,
      environmentSound: true,
    },
    'simulate-scenarios': {
      capabilityId: 'simulate-scenarios',
      maturity: 'verified',
      completedSteps: ['ss-discover', 'ss-learn', 'ss-interactive'],
      totalSteps: 4,
      lastUpdated: '2025-03-08T14:00:00Z',
      eventCount: 3,
      attestationCount: 0,
      environmentSound: true,
    },
    'explore-trust-network': {
      capabilityId: 'explore-trust-network',
      maturity: 'unknown',
      completedSteps: [],
      totalSteps: 4,
      lastUpdated: '2025-01-01T00:00:00Z',
      eventCount: 0,
      attestationCount: 0,
      environmentSound: false,
    },
  };

  // Calculate overall maturity and trust score using the helper functions
  const overallMaturity = calculateOverallMaturity(entries);
  const trustScore = calculateTrustScore(entries);

  const totalEvents = Object.values(entries).reduce(
    (sum, entry) => sum + entry.eventCount,
    0
  );
  const totalAttestations = Object.values(entries).reduce(
    (sum, entry) => sum + entry.attestationCount,
    0
  );

  const passport: TrustPassport = {
    entries,
    overallMaturity,
    totalEvents,
    totalAttestations,
    trustScore,
  };

  // Maturity distribution across capabilities
  const maturityDistribution: Record<string, number> = {};
  for (const entry of Object.values(entries)) {
    maturityDistribution[entry.maturity] =
      (maturityDistribution[entry.maturity] || 0) + 1;
  }

  // Capabilities with sound vs unsound environments
  const soundEnvironments = Object.values(entries).filter(
    (e) => e.environmentSound
  ).length;
  const unsoundEnvironments = Object.values(entries).filter(
    (e) => !e.environmentSound
  ).length;

  return NextResponse.json({
    passport,
    maturityDistribution,
    environmentHealth: {
      sound: soundEnvironments,
      unsound: unsoundEnvironments,
      total: Object.keys(entries).length,
    },
    summary: {
      totalCapabilities: Object.keys(entries).length,
      completedCapabilities: Object.values(entries).filter(
        (e) => e.completedSteps.length === e.totalSteps
      ).length,
      overallMaturity,
      trustScore,
      totalEvents,
      totalAttestations,
    },
  });
}

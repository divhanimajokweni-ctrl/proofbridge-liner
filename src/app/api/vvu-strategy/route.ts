import { NextResponse } from 'next/server';
import { RESOURCE_ACQUISITION_STRATEGY, getTrack, getTracksByStatus, countSupportByStatus } from '@/lib/vvu-strategy/data';

/**
 * VVU Resource Acquisition & Partnership Strategy API
 *
 * GET /api/vvu-strategy — Full 7-track strategy with principles
 * GET /api/vvu-strategy?track=A — Specific track detail
 * GET /api/vvu-strategy?status=active_outreach — Tracks by status
 */
export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const trackId = url.searchParams.get('track');
    const statusFilter = url.searchParams.get('status');
    const summary = url.searchParams.get('summary') === 'true';

    if (trackId) {
      const track = getTrack(trackId as any);
      if (!track) {
        return NextResponse.json(
          { error: `Track ${trackId} not found. Valid IDs: A, B, C, D, E, F, G` },
          { status: 404 },
        );
      }
      return NextResponse.json({ track });
    }

    if (statusFilter) {
      const tracks = getTracksByStatus(statusFilter as any);
      return NextResponse.json({ tracks, statusFilter });
    }

    if (summary) {
      const counts = countSupportByStatus();
      return NextResponse.json({
        trackCount: RESOURCE_ACQUISITION_STRATEGY.tracks.length,
        supportItemCount: Object.values(counts).reduce((a, b) => a + b, 0),
        statusBreakdown: counts,
        executionPrinciple: RESOURCE_ACQUISITION_STRATEGY.executionPrinciple,
        communicationsPolicy: RESOURCE_ACQUISITION_STRATEGY.communicationsPolicy,
        pilotMunicipality: RESOURCE_ACQUISITION_STRATEGY.pilotMunicipality,
        pilotMunicipalityStatus: RESOURCE_ACQUISITION_STRATEGY.pilotMunicipalityStatus,
      });
    }

    return NextResponse.json(RESOURCE_ACQUISITION_STRATEGY);
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to load VVU strategy data' },
      { status: 500 },
    );
  }
}

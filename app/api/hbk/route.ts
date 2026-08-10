import { NextResponse } from 'next/server';

/**
 * HBK MK-II Pipeline API
 *
 * Returns pipeline status, configuration summary, and provenance information.
 * The actual pipeline execution happens via the Python CLI (run_pipeline.py).
 * This API provides the bridge between the VVU workspace and the pipeline outputs.
 */

export const dynamic = 'force-dynamic';

interface PipelineStatus {
  status: 'idle' | 'running' | 'completed' | 'error';
  lastRun: string | null;
  config: {
    computeProvider: string;
    mode: string;
    hasGenesis: boolean;
    hasROCm: boolean;
  };
  provenance: {
    total: number;
    signed: number;
    unverified: number;
    unspecified: number;
  };
  outputs: string[];
  engineeringDisclaimer: string;
}

export async function GET() {
  try {
    // In production, this would read from the pipeline output directory
    // and check for the existence of result files.
    const status: PipelineStatus = {
      status: 'idle',
      lastRun: null,
      config: {
        computeProvider: 'local',
        mode: 'test',
        hasGenesis: false,
        hasROCm: false,
      },
      provenance: {
        total: 10,
        signed: 1, // geometry is signed
        unverified: 8, // pressure, materials, safety are unverified
        unspecified: 1, // simulation params
      },
      outputs: [
        'results.json',
        'metrics.json',
        'system_info.json',
        'ledger.json',
        'provenance.json',
        'anomaly_model.pt',
      ],
      engineeringDisclaimer: 'Most engineering values in config.yaml are marked as unverified_placeholder. The pipeline correctly labels them as UNVERIFIED in any generated report. Do not cite unverified values as engineering-correct.',
    };

    return NextResponse.json(status);
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to read pipeline status', details: String(error) },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const mode = body.mode || 'test';

    // In production, this would trigger the Python pipeline via subprocess
    // or delegate to a compute provider (AMD Cloud, etc.)
    // For now, return the expected behavior documentation.
    return NextResponse.json({
      message: 'Pipeline execution is handled via the Python CLI',
      command: `python run_pipeline.py --mode ${mode}`,
      note: 'Run the pipeline from the terminal: cd pipeline && python run_pipeline.py --mode test',
      provider: 'local',
      mode,
      nextSteps: [
        '1. Validate the pipeline locally with --mode test',
        '2. Verify all output artifacts are generated correctly',
        '3. Check provenance.json for engineering value classification',
        '4. Run generate_submission.py to create the submission report',
        '5. Only then consider AMD Cloud integration',
      ],
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Invalid request', details: String(error) },
      { status: 400 },
    );
  }
}

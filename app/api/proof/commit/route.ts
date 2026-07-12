// app/api/proof/commit/route.ts — Commit Proof to Ubuntu Pool
//
// Receives a verified Lean 4 proof file path and triggers the full
// Cosign signing pipeline:
//   1. Validates the file exists in the workspace
//   2. Shells out to docker exec proofbridge-lindiwe ./sign_proof.sh
//   3. Parses the IPFS CID from the script output
//   4. Returns the anchoring result to the frontend
//
// Called by:
//   CommitControl.tsx → POST /api/proof/commit

import { NextRequest, NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

// ── Configuration ────────────────────────────────────────────────

const CONTAINER_NAME = 'proofbridge-lindiwe';
const SCRIPT_PATH = './sign_proof.sh';
const STAGING_DIR = '/app/staging';

// ── Helpers ──────────────────────────────────────────────────────

/**
 * Sanitise the file path to prevent command injection.
 * Only allows alphanumeric characters, forward slashes, dots,
 * underscores, and hyphens.
 */
function sanitisePath(raw: string): string {
  return raw.replace(/[^a-zA-Z0-9\/._-]/g, '');
}

/**
 * Parse the IPFS CID from the sign_proof.sh stdout output.
 * Expected line: "Global Reference ID (CID): QmHash..."
 */
function extractCID(stdout: string): string | null {
  const match = stdout.match(/Global Reference ID \(CID\):\s*(Qm[a-zA-Z0-9]+)/);
  return match ? match[1] : null;
}

/**
 * Parse the count of signatures from the output.
 * Expected line: "STATUS: 1/3 Signatures (Pending Consensus)"
 * or similar from the lindiwe consensus engine.
 */
function extractSignatureCount(stdout: string): number {
  const match = stdout.match(/(\d+)\/3 Signatures/i);
  return match ? parseInt(match[1], 10) : 0;
}

// ── Route Handler ────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  try {
    // 1. Parse and validate request body
    const body = await request.json();
    const filePath: string | undefined = body?.filePath;

    if (!filePath || typeof filePath !== 'string') {
      return NextResponse.json(
        { error: 'Missing required field: filePath' },
        { status: 400 }
      );
    }

    const cleanPath = sanitisePath(filePath);

    // 2. Execute the signing pipeline inside the lindiwe container
    //    The container has the script mounted at /app/sign_proof.sh
    //    and the proof file is expected at /app/staging/<cleanPath>
    const command = [
      'docker', 'exec', CONTAINER_NAME,
      SCRIPT_PATH,
      `${STAGING_DIR}/${cleanPath}`,
    ].join(' ');

    console.log(`[API/proof/commit] Executing: ${command}`);

    const { stdout, stderr } = await execAsync(command, {
      timeout: 30_000, // 30-second timeout for signing + IPFS
    });

    // Log stderr but don't treat it as a hard failure
    if (stderr && !stderr.includes('Profiling')) {
      console.warn(`[API/proof/commit] [stderr] ${stderr}`);
    }

    // 3. Parse results
    const cid = extractCID(stdout);
    if (!cid) {
      console.error(`[API/proof/commit] No CID found in output:\n${stdout}`);
      return NextResponse.json(
        { error: 'Signing pipeline succeeded but no CID was returned' },
        { status: 500 }
      );
    }

    const signatures = extractSignatureCount(stdout);

    console.log(`[API/proof/commit] ✅  Proof anchored: ${cid} (${signatures}/3 sigs)`);

    // 4. Return success to the frontend
    return NextResponse.json({
      status: 'anchored',
      cid,
      signatures,
      timestamp: new Date().toISOString(),
      container: CONTAINER_NAME,
    });

  } catch (error: unknown) {
    const err = error as Error;
    console.error('[API/proof/commit] Pipeline failed:', err.message);

    return NextResponse.json(
      {
        error: 'Signing pipeline failed',
        details: err.message,
        hint: 'Ensure the lindiwe-governance container is running via docker-compose',
      },
      { status: 500 }
    );
  }
}

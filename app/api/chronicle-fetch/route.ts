import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const CHRONICLE_LOG_PATH =
  process.env.CHRONICLE_LOG_PATH ||
  '/opt/vvu/data/chronicle_chain.log';
const FALLBACK_LOG_PATH = path.join(process.cwd(), 'data', 'chronicle_chain.log');

function resolveLogPath(): string | null {
  if (fs.existsSync(CHRONICLE_LOG_PATH)) return CHRONICLE_LOG_PATH;
  if (fs.existsSync(FALLBACK_LOG_PATH)) return FALLBACK_LOG_PATH;
  return null;
}

function parseLine(line: string): any | null {
  try {
    return JSON.parse(line);
  } catch {
    return null;
  }
}

function normalizeEntry(entry: any, index: number) {
  const header = entry?.Document?.Hdr;
  const txInfo = entry?.Document?.TxInf;
  if (!header || !txInfo) return null;

  const statusRaw = String(txInfo.CmplncInd || '').toUpperCase();
  const status = statusRaw === 'PASSED' ? 'APPROVED' : 'REJECTED';

  return {
    chronicleId: header.MsgId || `CHR-${index}`,
    status,
    agentId: txInfo.InitgPty?.Id || 'UNKNOWN',
    targetContract: txInfo.DbtrAgent?.Id || 'UNKNOWN',
    reason:
      status === 'APPROVED'
        ? 'READY_FOR_ATTESTATION'
        : txInfo.FailRsn || 'REGULATORY_POLICY_VIOLATION',
    calldataHash: header.DocAttest?.Checksum
      ? String(header.DocAttest.Checksum).substring(0, 16)
      : '',
    valueETH: parseFloat(txInfo.IntrBkSttlmAmt?.Amt || '0') || 0,
    timestamp: header.CreDtTm ? new Date(header.CreDtTm).getTime() : Date.now(),
  };
}

function buildMockFeed(): any[] {
  const now = Date.now();
  return [
    {
      chronicleId: 'MOCK-CHR-001',
      status: 'APPROVED',
      agentId: 'agent-mock-01',
      targetContract: '0xMockContractA0000000000000000000',
      reason: 'READY_FOR_ATTESTATION',
      calldataHash: 'a1b2c3d4e5f6a7b8',
      valueETH: 0.84,
      timestamp: now - 1000 * 60 * 5,
    },
    {
      chronicleId: 'MOCK-CHR-002',
      status: 'REJECTED',
      agentId: 'agent-mock-02',
      targetContract: '0xMockContractB0000000000000000000',
      reason: 'RATE_LIMIT_EXCEEDED',
      calldataHash: '0000000000000000',
      valueETH: 0,
      timestamp: now - 1000 * 60 * 2,
    },
    {
      chronicleId: 'MOCK-CHR-003',
      status: 'APPROVED',
      agentId: 'agent-mock-01',
      targetContract: '0xMockContractC0000000000000000000',
      reason: 'READY_FOR_ATTESTATION',
      calldataHash: 'f6e5d4c3b2a1f6e5',
      valueETH: 1.25,
      timestamp: now,
    },
  ];
}

export async function GET() {
  try {
    const logPath = resolveLogPath();
    let entries: any[] = [];

    if (logPath) {
      const raw = fs.readFileSync(logPath, 'utf8').trim();
      if (raw) {
        entries = raw
          .split('\n')
          .map((line, idx) => normalizeEntry(parseLine(line), idx))
          .filter((entry): entry is NonNullable<typeof entry> => entry !== null);
      }
    } else {
      entries = buildMockFeed();
    }

    // Reverse to show newest first, keep light surface for rendering
    const logs = entries
      .reverse()
      .slice(0, 100)
      .map((entry: any) => ({
        chronicleId: entry.chronicleId,
        status: entry.status,
        agentId: entry.agentId,
        targetContract: entry.targetContract,
        reason: entry.reason,
        calldataHash: entry.calldataHash,
        valueETH: entry.valueETH,
        timestamp: entry.timestamp,
      }));

    const latestLog = entries[entries.length - 1];
    const emergencyShutdownActive =
      typeof latestLog?.emergencyShutdownActive === 'boolean'
        ? latestLog.emergencyShutdownActive
        : false;

    return NextResponse.json({
      success: true,
      emergencyShutdownActive,
      source: logPath || 'mock-feed',
      count: logs.length,
      logs,
    });
  } catch (error: any) {
    console.error('[chronicle-fetch] pipeline disruption:', error.message);
    return NextResponse.json(
      { success: false, error: 'Chronicle pipeline disruption' },
      { status: 500 }
    );
  }
}

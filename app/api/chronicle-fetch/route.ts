/**
 * Chronicle Fetch — Compliance Log Pipeline
 *
 * Dual-mode endpoint:
 *   1. File-based mode (default) — reads from chronicle_chain.log or local fallback
 *   2. Upstash Redis mode (?mode=upstash) — reads from Upstash with billing enforcement
 *
 * Supports role-based view mappers in Upstash mode.
 */
import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { Redis } from '@upstash/redis';

// ── File-based constants ──────────────────────────────────────────

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

// ── Upstash Redis mode ────────────────────────────────────────────

let upstashClient: Redis | null = null;

function getUpstashClient(): Redis | null {
  if (upstashClient) return upstashClient;
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (url && token) {
    upstashClient = new Redis({ url, token });
    return upstashClient;
  }
  return null;
}

const CHRONICLE_LIST_KEY = 'billing:chronicles';
const GLOBAL_SHUTDOWN_KEY = 'billing:global_shutdown';

type ViewRole = 'COMPLIANCE' | 'DEVOPS' | 'FINANCE';

function applyRoleMapper(logs: any[], role: ViewRole): any[] {
  return logs.map((log: any) => {
    switch (role) {
      case 'FINANCE':
        return {
          chronicleId: log.chronicleId,
          status: log.status,
          agentId: log.agentId,
          primaryMetric: `${log.valueETH ?? 0} ETH`,
          metaLabel: 'Asset Exposure',
          detailSnippet: `Target Contract: ${(log.targetContract || '').substring(0, 14)}...`,
        };
      case 'DEVOPS':
        return {
          chronicleId: log.chronicleId,
          status: log.status,
          agentId: log.agentId,
          primaryMetric: log.status === 'APPROVED' ? '21,000 gas' : 'ERR_HALT',
          metaLabel: 'Gas Utilization Profile',
          detailSnippet: log.reason || `Tx Hash: ${(log.calldataHash || '').substring(0, 14)}...`,
        };
      case 'COMPLIANCE':
      default:
        return {
          chronicleId: log.chronicleId,
          status: log.status,
          agentId: log.agentId,
          primaryMetric: log.status,
          metaLabel:
            log.status === 'APPROVED' ? 'Policy Cleared' : 'Circuit Breaker Tripped',
          detailSnippet:
            log.status === 'APPROVED'
              ? `Passed pre-signing policy for contract ${(log.targetContract || '').substring(0, 16)}...`
              : `Violation: ${log.reason}`,
        };
    }
  });
}

// ── Mock feed (fallback for file mode) ─────────────────────────────

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

// ── GET handler (supports both modes) ──────────────────────────────

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const mode = searchParams.get('mode') || 'file';
    const role = (searchParams.get('role') || 'COMPLIANCE').toUpperCase() as ViewRole;
    const clientId = searchParams.get('clientId') || 'default-client';

    // ═══ UPSTASH REDIS MODE ═══════════════════════════════════════
    if (mode === 'upstash') {
      const redis = getUpstashClient();
      if (!redis) {
        return NextResponse.json(
          {
            success: false,
            error: 'Upstash Redis not configured. Set UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN.',
          },
          { status: 503 }
        );
      }

      // Fetch system states concurrently
      const [systemPaused, rawLogs, billingProfile] = await Promise.all([
        redis.get<boolean>(GLOBAL_SHUTDOWN_KEY),
        redis.lrange<any>(CHRONICLE_LIST_KEY, 0, 49).catch(() => []),
        redis.hgetall(`billing:client:${clientId}`).catch(() => null),
      ]);

      const logsList = Array.isArray(rawLogs) ? rawLogs : [];
      const logsCount = logsList.length;
      const monthlyLimit = parseInt(
        (billingProfile?.monthlyLimit as string) || '5000',
        10
      );
      const billingTier = (billingProfile?.tier as string) || 'Sandbox Developer';

      // Billing quota guard — returns 402 if over limit
      if (logsCount >= monthlyLimit) {
        return NextResponse.json(
          {
            success: false,
            error: 'SUBSCRIPTION_QUOTA_EXHAUSTED',
            reason: `Your ${billingTier} tier limit of ${monthlyLimit} logs has been reached. Please upgrade.`,
          },
          { status: 402 }
        );
      }

      // Parse stored logs (stored as JSON strings in Redis)
      const parsedLogs = logsList
        .map((item: any) => {
          if (typeof item === 'string') {
            try {
              return JSON.parse(item);
            } catch {
              return null;
            }
          }
          return item;
        })
        .filter(Boolean);

      // Apply role-based view mapper
      const mappedLogs = applyRoleMapper(parsedLogs, role);

      return NextResponse.json({
        success: true,
        emergencyShutdownActive: !!systemPaused,
        source: 'upstash-redis',
        mode: 'upstash',
        billingInfo: {
          tier: billingTier,
          usage: logsCount,
          cap: monthlyLimit,
        },
        logs: mappedLogs,
      });
    }

    // ═══ FILE-BASED MODE (default, preserves existing behavior) ═══
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
      mode: 'file',
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

// ── POST handler: emergency overrides ─────────────────────────────

export async function POST(request: Request) {
  try {
    const { targetState, clientId } = await request.json();
    const redis = getUpstashClient();

    if (!redis) {
      return NextResponse.json(
        { error: 'Upstash Redis not configured' },
        { status: 503 }
      );
    }

    // Update global kill-switch
    if (typeof targetState === 'boolean') {
      await redis.set(GLOBAL_SHUTDOWN_KEY, targetState);
    }

    // Optionally update client billing status
    if (clientId) {
      await redis.hset(`billing:client:${clientId}`, {
        killSwitchOverriddenAt: Date.now().toString(),
        killSwitchState: String(targetState),
      });
    }

    return NextResponse.json({
      success: true,
      updatedState: targetState,
    });
  } catch (error: any) {
    console.error('[chronicle-fetch POST] Error:', error.message);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

/**
 * VVU OS — AUDIT-BUS Operator
 * Immutable event log, circuit breaker monitoring, alert routing.
 * Writes to a JSONL audit file for persistence.
 */

import * as fs from 'fs';
import { IOperator, OperatorStatus, OperatorResult, SubsystemType } from './types';

const AUDIT_LOG_PATH = '/tmp/vvu-audit.jsonl';

interface AuditEvent {
  id: string;
  timestamp: string;
  source: string;
  type: string;
  severity: 'INFO' | 'WARN' | 'ERROR' | 'CRITICAL';
  message: string;
  metadata?: Record<string, unknown>;
}

export class AuditBusOperator implements IOperator {
  readonly name = 'VVU-AUDIT-BUS';
  readonly subsystem: SubsystemType = 'SECURITY';
  pid: number = 0;

  private startedAt: number = 0;
  private lastActivity: string | null = null;
  private errorCount = 0;
  private state: OperatorStatus['state'] = 'INIT';
  private circuitBreakerOpen = false;
  private eventLog: AuditEvent[] = [];

  async start(): Promise<void> {
    this.state = 'RUNNING';
    this.startedAt = Date.now();
    this.lastActivity = new Date().toISOString();

    // Ensure audit log file exists
    try {
      fs.appendFileSync(AUDIT_LOG_PATH, '', { flag: 'a' });
    } catch {
      // May not have write permissions
    }

    // Log boot event
    await this.writeEvent({
      source: 'AUDIT-BUS',
      type: 'BOOT',
      severity: 'INFO',
      message: 'Audit bus initialized and operational',
    });
  }

  async stop(): Promise<void> {
    await this.writeEvent({
      source: 'AUDIT-BUS',
      type: 'SHUTDOWN',
      severity: 'INFO',
      message: 'Audit bus shutting down',
    });
    this.state = 'STOPPED';
    this.lastActivity = new Date().toISOString();
  }

  status(): OperatorStatus {
    return {
      pid: this.pid,
      name: this.name,
      subsystem: this.subsystem,
      state: this.state,
      uptimeMs: this.startedAt ? Date.now() - this.startedAt : 0,
      lastActivity: this.lastActivity,
      errorCount: this.errorCount,
    };
  }

  async execute(command: string, args?: Record<string, unknown>): Promise<OperatorResult> {
    const start = Date.now();
    this.lastActivity = new Date().toISOString();

    try {
      switch (command) {
        case 'log-event':
          return this.logEvent(args, start);
        case 'read-log':
          return this.readLog(args, start);
        case 'get-stats':
          return this.getStats(start);
        case 'circuit-breaker-status':
          return this.circuitBreakerStatus(start);
        case 'circuit-breaker-toggle':
          return this.circuitBreakerToggle(args, start);
        default:
          return {
            success: false,
            data: null,
            error: `AUDIT-BUS: unknown command '${command}'`,
            durationMs: Date.now() - start,
          };
      }
    } catch (err) {
      this.errorCount++;
      return {
        success: false,
        data: null,
        error: `AUDIT-BUS error: ${err instanceof Error ? err.message : String(err)}`,
        durationMs: Date.now() - start,
      };
    }
  }

  private async writeEvent(event: Partial<AuditEvent>): Promise<AuditEvent> {
    const full: AuditEvent = {
      id: `evt_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      timestamp: new Date().toISOString(),
      source: event.source ?? 'UNKNOWN',
      type: event.type ?? 'GENERIC',
      severity: event.severity ?? 'INFO',
      message: event.message ?? '',
      metadata: event.metadata ?? {},
    };

    this.eventLog.push(full);
    if (this.eventLog.length > 1000) {
      this.eventLog = this.eventLog.slice(-500);
    }

    // Persist to JSONL
    try {
      fs.appendFileSync(AUDIT_LOG_PATH, JSON.stringify(full) + '\n', { flag: 'a' });
    } catch {
      // Non-fatal if we can't write
    }

    return full;
  }

  private async logEvent(args: Record<string, unknown> | undefined, start: number): Promise<OperatorResult> {
    const event = await this.writeEvent({
      source: String(args?.source ?? 'OPERATOR'),
      type: String(args?.type ?? 'USER_EVENT'),
      severity: (args?.severity as AuditEvent['severity']) ?? 'INFO',
      message: String(args?.message ?? ''),
      metadata: (args?.metadata as Record<string, unknown>) ?? {},
    });

    return {
      success: true,
      data: { eventId: event.id, timestamp: event.timestamp },
      durationMs: Date.now() - start,
    };
  }

  private async readLog(args: Record<string, unknown> | undefined, start: number): Promise<OperatorResult> {
    const limit = Math.min(Math.max(Number(args?.limit ?? 50), 1), 200);
    const severity = String(args?.severity ?? '').toUpperCase() as AuditEvent['severity'] | '';

    let entries = this.eventLog;
    if (severity && ['INFO', 'WARN', 'ERROR', 'CRITICAL'].includes(severity)) {
      entries = entries.filter(e => e.severity === severity);
    }

    const tail = entries.slice(-limit);

    // Also try to read from the file for more complete view
    let fileEntries: AuditEvent[] = [];
    try {
      if (fs.existsSync(AUDIT_LOG_PATH)) {
        const raw = fs.readFileSync(AUDIT_LOG_PATH, 'utf-8');
        fileEntries = raw.trim().split('\n').filter(Boolean).map(line => {
          try { return JSON.parse(line); } catch { return null; }
        }).filter(Boolean);
      }
    } catch {
      // File may not be accessible
    }

    return {
      success: true,
      data: {
        inMemory: tail,
        inFile: fileEntries.length,
        totalInMemory: this.eventLog.length,
        totalInFile: fileEntries.length,
        limit,
        filter: severity || 'none',
      },
      durationMs: Date.now() - start,
    };
  }

  private async getStats(start: number): Promise<OperatorResult> {
    const stats = {
      totalEvents: this.eventLog.length,
      bySeverity: {
        INFO: this.eventLog.filter(e => e.severity === 'INFO').length,
        WARN: this.eventLog.filter(e => e.severity === 'WARN').length,
        ERROR: this.eventLog.filter(e => e.severity === 'ERROR').length,
        CRITICAL: this.eventLog.filter(e => e.severity === 'CRITICAL').length,
      },
      bySource: {} as Record<string, number>,
      circuitBreakerOpen: this.circuitBreakerOpen,
    };

    for (const e of this.eventLog) {
      stats.bySource[e.source] = (stats.bySource[e.source] ?? 0) + 1;
    }

    return {
      success: true,
      data: stats,
      durationMs: Date.now() - start,
    };
  }

  private async circuitBreakerStatus(start: number): Promise<OperatorResult> {
    return {
      success: true,
      data: {
        open: this.circuitBreakerOpen,
        state: this.circuitBreakerOpen ? 'TRIPPED' : 'CLOSED',
        lastTripTime: null,
        eventsSinceTrip: this.eventLog.length,
      },
      durationMs: Date.now() - start,
    };
  }

  private async circuitBreakerToggle(args: Record<string, unknown> | undefined, start: number): Promise<OperatorResult> {
    const open = Boolean(args?.open);
    this.circuitBreakerOpen = open;

    await this.writeEvent({
      source: 'AUDIT-BUS',
      type: 'CIRCUIT_BREAKER',
      severity: 'WARN',
      message: `Circuit breaker ${open ? 'TRIPPED (OPEN)' : 'RESET (CLOSED)'}`,
      metadata: { open },
    });

    return {
      success: true,
      data: {
        open: this.circuitBreakerOpen,
        state: this.circuitBreakerOpen ? 'TRIPPED' : 'CLOSED',
      },
      durationMs: Date.now() - start,
    };
  }
}

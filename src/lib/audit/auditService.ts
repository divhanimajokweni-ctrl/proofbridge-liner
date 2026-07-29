export type AuditSeverity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export interface AuditChainEntry {
  id: string;
  prevHash: string | null;
  payload: Record<string, unknown>;
  timestamp: number;
  chainHash?: string;
}

export interface AuditEvent {
  id: string
  timestamp: string
  actor: string
  action: string
  target: string
  metadata: Record<string, unknown>
  severity: AuditSeverity
  digest: string
}

export class AuditService {
  private static instance: AuditService | null = null
  private buffer: AuditEvent[] = []
  private maxBuffer = 200

  private constructor() {}

  static getInstance(): AuditService {
    if (!AuditService.instance) {
      AuditService.instance = new AuditService()
    }
    return AuditService.instance
  }

  private doc(evt: { actor: string; action: string; target: string; metadata: Record<string, unknown>; severity: AuditSeverity }): AuditEvent {
    const id = crypto.randomUUID()
    const ts = new Date().toISOString()
    const raw = `${ts}|${evt.actor}|${evt.action}|${evt.target}|${JSON.stringify(evt.metadata)}|${evt.severity}`
    const digest = Array.from(new Uint8Array(new TextEncoder().encode(raw)))
      .map(b => b.toString(16).padStart(2, '0'))
      .slice(0, 16)
      .join('')
    return { id, timestamp: ts, digest, ...evt }
  }

  record(evt: { actor: string; action: string; target: string; metadata?: Record<string, unknown>; severity?: AuditSeverity }): AuditEvent {
    const normalized = { metadata: evt.metadata ?? {}, severity: evt.severity ?? 'LOW' };
    const stamped = this.doc({ ...evt, ...normalized });
    this.buffer.push(stamped)
    if (this.buffer.length > this.maxBuffer) this.buffer.shift()
    return stamped
  }

  history(limit = 200): AuditEvent[] {
    return this.buffer.slice(-limit)
  }
}

export const appendAuditTrail = (params: { actor: string; action: string; target: string; metadata?: Record<string, unknown>; severity?: AuditSeverity }): AuditEvent =>
  AuditService.getInstance().record(params)

export const exportAuditTrail = (format: 'json' | 'csv' = 'json') => {
  const history = AuditService.getInstance().history()
  if (format === 'csv') {
    const headers = ['id', 'timestamp', 'actor', 'action', 'target', 'severity', 'digest']
    const rows = history.map(e => `${e.id},${e.timestamp},${e.actor},${e.action},${e.target},${e.severity},${e.digest}`)
    return `${headers.join(',')}\n${rows.join('\n')}`
  }
  return history
}

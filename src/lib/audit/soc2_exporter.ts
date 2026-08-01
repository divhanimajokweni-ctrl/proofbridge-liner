import { AuditEvent } from '@/lib/audit/auditService';

export interface SOC2AuditArtifact {
  generatedAt: string
  controlFamily: string
  events: Array<Omit<AuditEvent, 'metadata'>>
  systemIntegrityHash: string
}

export class SOC2AuditExporter {
  static generateArtifact(controlFamily = 'CA-17'): SOC2AuditArtifact {
    const events = []
    const mod = require('@/lib/audit/auditService')
    const history = mod.exportAuditTrail('json')
    for (const e of history) {
      const { metadata, ...rest } = e
      events.push(rest)
    }
    const eventsHashSource = events.map((e: any) => `${e.timestamp}|${e.actor}|${e.action}|${e.target}|${e.severity}|${e.digest}`).join('\n')
    const hash = Array.from(new Uint8Array(new TextEncoder().encode(eventsHashSource)))
      .map((b: number) => b.toString(16).padStart(2, '0'))
      .slice(0, 24)
      .join('')
    return {
      generatedAt: new Date().toISOString(),
      controlFamily,
      events,
      systemIntegrityHash: hash,
    }
  }
}

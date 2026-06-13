import { SOC2AuditExporter } from '@/lib/audit/soc2_exporter';
import { NextResponse } from 'next/server';
import { appendAuditTrail } from '@/lib/audit/auditService';

export async function GET() {
  const artifact = await SOC2AuditExporter.generateArtifact('CA-17');
  void appendAuditTrail({
    actor: 'system',
    action: 'SOC2_EXPORT',
    target: 'audit_svc',
    metadata: { controlFamily: artifact.controlFamily, eventCount: artifact.events.length },
    severity: 'MEDIUM',
  });
  return NextResponse.json(artifact);
}

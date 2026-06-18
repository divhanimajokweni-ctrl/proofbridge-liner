import { prisma } from '../db';

export async function auditLog(
  eventHash: string,
  action: string,
  actor: string,
  metadata: Record<string, unknown> = {},
) {
  return prisma.proofAudit.create({
    data: {
      eventHash,
      action,
      actor,
      metadata,
    },
  });
}

import crypto from 'crypto';
import { prisma } from '../db';
import { drainLocalQueue } from './index';
import { auditLog } from '../audit/middleware';

function proofHash(payload: Record<string, unknown>) {
  return `0x${crypto.createHash('sha256').update(JSON.stringify(payload)).digest('hex')}`;
}

async function submitProof(hash: string, payload: Record<string, unknown>) {
  return {
    hash: `0x${crypto.createHash('sha256').update(`${hash}:${Date.now()}`).digest('hex')}`,
    nonce: 0,
    wait: async () => ({ blockNumber: 0, payload }),
  };
}

export async function processProofJob(eventId: string, payload: Record<string, unknown>) {
  try {
    await prisma.proofEvent.update({ where: { id: eventId }, data: { status: 'PROCESSING', attempts: { increment: 1 } } });
    const hash = proofHash(payload);
    const existing = await prisma.proofSubmission.findUnique({ where: { proofHash: hash } });
    if (existing) {
      await prisma.proofEvent.update({ where: { id: eventId }, data: { status: 'CONFIRMED', txHash: existing.txHash, processedAt: new Date() } });
      return { alreadySubmitted: true, txHash: existing.txHash };
    }
    const tx = await submitProof(hash, payload);
    const submission = await prisma.proofSubmission.create({ data: { proofHash: hash, txHash: tx.hash, nonce: tx.nonce, status: 'PENDING' } });
    const receipt = await tx.wait();
    await prisma.proofSubmission.update({ where: { id: submission.id }, data: { status: 'CONFIRMED', confirmedAt: new Date() } });
    await prisma.proofEvent.update({ where: { id: eventId }, data: { status: 'CONFIRMED', txHash: tx.hash, processedAt: new Date() } });
    await auditLog(hash, 'TX_CONFIRMED', 'oracle', { txHash: tx.hash, blockNumber: receipt.blockNumber });
    return { success: true, txHash: tx.hash };
  } catch (error) {
    await prisma.proofEvent.update({ where: { id: eventId }, data: { status: 'FAILED', error: String(error), processedAt: new Date() } });
    const event = await prisma.proofEvent.findUnique({ where: { id: eventId } });
    if (event && event.attempts < 3) throw error;
    return { failed: true, error: String(error) };
  }
}

export async function runProofWorkerOnce() {
  const jobs = drainLocalQueue();
  return Promise.all(jobs.map((job) => processProofJob(job.eventId, job.payload)));
}

export async function runRecoveryOnce() {
  const pending = await prisma.proofSubmission.findMany({ where: { status: 'PENDING' }, take: 10 });
  return Promise.all(pending.map((sub) => prisma.proofSubmission.update({ where: { id: sub.id }, data: { status: 'FAILED' } })));
}

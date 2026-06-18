type ProofJob = { eventId: string; payload: Record<string, unknown> };
const localQueue: ProofJob[] = [];

export async function queueProof(eventId: string, payload: Record<string, unknown>) {
  localQueue.push({ eventId, payload });
  return { id: eventId, queued: true };
}

export function getLocalQueueDepth() {
  return localQueue.length;
}

export function drainLocalQueue() {
  return localQueue.splice(0, localQueue.length);
}

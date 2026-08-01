/**
 * VVU Antony Queue Stress-Test Harness
 * =====================================
 * Injects 100 mock tasks into the vvu_antony_queue Firestore collection
 * using atomic batch writes (50 per batch) to avoid network throttling.
 *
 * Usage:
 *   npx ts-node scripts/stress-test-queue.ts
 *
 * Prerequisites:
 *   NEXT_PUBLIC_FIREBASE_API_KEY, NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
 *   NEXT_PUBLIC_FIREBASE_PROJECT_ID must be set in the environment.
 */

import { initializeApp } from 'firebase/app';
import { getFirestore, collection, writeBatch, doc } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || '',
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || '',
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || '',
};

if (!firebaseConfig.apiKey || !firebaseConfig.projectId) {
  console.error('[FATAL] Firebase environment variables not set.');
  console.error('  Required: NEXT_PUBLIC_FIREBASE_API_KEY, NEXT_PUBLIC_FIREBASE_PROJECT_ID');
  process.exit(1);
}

const app = initializeApp(firebaseConfig, 'stress-test');
const db = getFirestore(app);

const TARGET_NODES = ['VVU-CORE-PROD-01', 'SAFE-GATEWAY-ARRAY', 'POOL-ENGINE-03', 'PROOFBRIDGE-LINER-07'];
const STATUS_OPTIONS = ['QUEUED', 'PROCESSING'] as const;

/**
 * Generate a deterministic-looking mock payload hash.
 */
function mockPayloadHash(i: number): string {
  const prefix = '0x';
  const body = Array(65).join('f'); // 64 chars of 'f'
  const suffix = i.toString(16).padStart(3, '0');
  return prefix + body.slice(0, 61) + suffix;
}

async function injectQueueStressMatrix() {
  console.log('► [STRESS_TEST] Initializing mass assertion loop into Antony Queue...');
  const queueRef = collection(db, 'vvu_antony_queue');
  let batch = writeBatch(db);

  const totalTasks = 100;
  const batchLimit = 50;

  for (let i = 1; i <= totalTasks; i++) {
    const customId = `MOCK_TX_ID_${1000 + i}`;
    const taskDoc = doc(queueRef, customId);

    const mockPayload = {
      payloadHash: mockPayloadHash(i),
      targetNode: TARGET_NODES[i % TARGET_NODES.length],
      status: STATUS_OPTIONS[i % STATUS_OPTIONS.length],
      priority: Math.floor(Math.random() * 5) + 1,
      timestamp: Date.now(),
    };

    batch.set(taskDoc, mockPayload);

    // Commit when batch is full to bypass Firestore chunk constraints
    if (i % batchLimit === 0 || i === totalTasks) {
      const rangeStart = i - batchLimit + 1;
      const rangeEnd = i;
      console.log(`  ► Committing execution block chunk... [Range: ${rangeStart}–${rangeEnd}]`);
      await batch.commit();
      batch = writeBatch(db);
    }
  }

  console.log('🎉 [SUCCESS] Stress matrix clear. 100 mock tasks locked in database registers.');
}

injectQueueStressMatrix().catch((err) => {
  console.error('[FAILURE] Stress test encountered an error:', err);
  process.exit(1);
});

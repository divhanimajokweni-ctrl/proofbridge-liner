import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { trustEventOutbox } from '../../lib/db/src/schema/trust-runtime';
import { eq, lt, sql, and } from 'drizzle-orm';

export class OutboxWorker {
  private workerId = crypto.randomUUID();
  private isRunning = false;
  private pollIntervalMs = 1000;
  private leaseDurationMs = 60000;
  private maxAttempts = 5;

  constructor(
    private db: NodePgDatabase,
    private messageBus: {
      publish: (eventType: string, payload: Record<string, any>) => Promise<void>;
    }
  ) {}

  start() {
    this.isRunning = true;
    this.poll();
  }

  stop() {
    this.isRunning = false;
  }

  async recoverStaleLeases() {
    // Reset messages where worker crashed before completing
    await this.db.update(trustEventOutbox).set({
      status: 'PENDING',
      workerId: null,
      lockedUntil: null,
    }).where(
      and(
        eq(trustEventOutbox.status, 'PROCESSING'),
        lt(trustEventOutbox.lockedUntil, new Date())
      )
    );
  }

  private async poll() {
    while (this.isRunning) {
      try {
        await this.db.transaction(async (tx) => {
          // 1. Claim a batch of messages using SKIP LOCKED
          const pendingMessages = await tx.execute(sql`
            SELECT * FROM trust_event_outbox
            WHERE status = 'PENDING' AND next_attempt <= NOW()
            ORDER BY created_at ASC
            LIMIT 100
            FOR UPDATE SKIP LOCKED
          `);

          const rows = pendingMessages.rows as any[];
          if (!rows.length) return;

          // 2. Lock the messages to this worker
          const ids = rows.map((m: any) => m.id);
          await tx.update(trustEventOutbox).set({
            status: 'PROCESSING',
            workerId: this.workerId,
            lockedUntil: new Date(Date.now() + this.leaseDurationMs),
          }).where(sql`id IN ${ids}`);

          // 3. Publish to external bus (outside transaction)
          for (const msg of rows) {
            try {
              await this.messageBus.publish(msg.eventType, msg.payload);

              // 4. Mark complete
              await tx.update(trustEventOutbox).set({
                status: 'COMPLETE',
                processedAt: new Date(),
              }).where(eq(trustEventOutbox.id, msg.id));
            } catch (err) {
              const newAttemptCount = msg.attempt_count + 1;
              const isDead = newAttemptCount >= this.maxAttempts;

              await tx.update(trustEventOutbox).set({
                status: isDead ? 'DEAD' : 'PENDING',
                attemptCount: newAttemptCount,
                lastError: err instanceof Error ? err.message : String(err),
                nextAttempt: new Date(Date.now() + (10000 * newAttemptCount)),
                workerId: null,
                lockedUntil: null,
              }).where(eq(trustEventOutbox.id, msg.id));
            }
          }
        });
      } catch (err) {
        console.error('Outbox polling cycle failed', err);
      }

      await new Promise(resolve => setTimeout(resolve, this.pollIntervalMs));
    }
  }
}

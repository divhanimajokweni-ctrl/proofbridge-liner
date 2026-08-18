/**
 * VVU-IVE Webhook Subsystem — Admin / Audit Worker
 * ----------------------------------------------------------------------------
 * Separate consumer pool (2 pods, static). Consumes from
 * `vvu-webhook-audit` topic with consumer group
 * `vvu-admin-audit-workers`.
 *
 * Purpose: Decoupled audit trail. Records every delivery outcome, CB state
 * transition, and operator replay action into the AuditEvent table. If the
 * primary delivery path's audit write fails, this worker re-ingests from
 * Kafka and fills in the gap.
 *
 * In the Sept 15 launch, this worker provides:
 *   - Redundant audit log (defense against webhook worker DB write failure)
 *   - External observability surface (audit topic consumers can be added)
 *
 * Does NOT perform deliveries. Does NOT consume from main delivery topic.
 */

import { db } from "@/lib/db";
import { TOPIC_AUDIT } from "./kafka/topics";
import { getTransport } from "./transport/factory";
import { CONSUMER_CONFIG } from "./config";
import type {
  AuditEventType,
  KafkaDeliveryMessage,
  TransportMessage,
} from "./types";
import type { Consumer } from "./transport/interface";

export interface AdminWorkerOptions {
  groupId?: string;
  topic?: string;
  // Inject consumer (for tests)
  consumerOverride?: Consumer;
}

export class AdminWorker {
  private consumer: Consumer | null = null;
  private running = false;
  private opts: Required<AdminWorkerOptions>;

  constructor(opts: AdminWorkerOptions = {}) {
    this.opts = {
      groupId: opts.groupId ?? CONSUMER_CONFIG.GROUP_ID_ADMIN,
      topic: opts.topic ?? TOPIC_AUDIT,
      consumerOverride: opts.consumerOverride ?? (undefined as never),
    };
  }

  async start(): Promise<void> {
    if (this.running) return;
    this.running = true;

    if (this.opts.consumerOverride) {
      this.consumer = this.opts.consumerOverride;
    } else {
      const transport = await getTransport(this.opts.groupId);
      this.consumer = await transport.consumer();
    }

    await this.consumer.subscribe(this.opts.topic, this.opts.groupId);
    this.consumer.run(this.handle.bind(this)).catch((err) => {
      // eslint-disable-next-line no-console
      console.error("[admin-worker] consumer run failed:", err);
      this.running = false;
    });
  }

  async stop(): Promise<void> {
    this.running = false;
    if (this.consumer) await this.consumer.stop();
  }

  isRunning(): boolean {
    return this.running;
  }

  private async handle(message: TransportMessage): Promise<void> {
    const msg: KafkaDeliveryMessage = message.value;
    // Parse the payload — it carries the audit event details
    let details: Record<string, unknown>;
    try {
      details = JSON.parse(msg.payload);
    } catch {
      details = { raw: msg.payload };
    }

    const type = (details.type as AuditEventType) ?? "delivery_attempted";

    // Idempotent insert — if deliveryId+attemptId already exists, skip
    // (the webhook worker wrote it first; admin worker is just the backup)
    const existing = await db.auditEvent.findFirst({
      where: {
        type,
        deliveryId: msg.deliveryId,
      },
      orderBy: { createdAt: "desc" },
    });

    if (existing) {
      // Already audited — this is normal (admin worker is the secondary path)
      return;
    }

    await db.auditEvent.create({
      data: {
        type,
        webhookId: msg.webhookId,
        deliveryId: msg.deliveryId,
        attemptId: (details.attemptId as string) ?? "",
        details: JSON.stringify(details),
      },
    });
  }
}

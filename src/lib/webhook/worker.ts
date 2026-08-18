/**
 * VVU-IVE Webhook Subsystem — Webhook Worker (Pillars 1-5 in concert)
 * ----------------------------------------------------------------------------
 * Consumes from Kafka `vvu-webhook-delivery` topic. For each message:
 *
 *   1. Look up webhook (skip if disabled — soft-disable, not CB)
 *   2. Check per-webhook circuit breaker (Pillar 2):
 *        OPEN                  → SKIP → write DLQ entry (circuit_breaker_open_skipped)
 *        CLOSED / HALF_OPEN    → proceed
 *   3. Run retry engine (Pillar 3): up to 4 attempts, full jitter, 30s timeout
 *        - Charge retry budget per retry (Pillar 3, layer 3)
 *        - Honor Retry-After on 429
 *        - Non-retryable (400/401/403/404/...) → immediate DLQ (non_retryable_error)
 *   4. Record each attempt in WebhookDeliveryAttempt (audit)
 *   5. Record CB result (success resets, terminal failure counts++)
 *   6. On terminal outcome → write DLQ entry (exhausted_retries / non_retryable_error)
 *   7. Update WebhookDelivery.status
 *   8. Commit Kafka offset (manual commit, exactly-once-ish)
 *
 * CRITICAL: Per-webhook Kafka partition + WEBHOOK_CONCURRENCY=1 means there's
 * only ONE in-flight delivery per webhook at a time. The CB state doesn't
 * need locks.
 *
 * Critical Invariant (the Sept 15 launch test):
 *   If the webhook endpoint goes down, the Verification Workers (separate pool)
 *   MUST stay at 100% CPU. Webhook failure must not block verification.
 */

import { db } from "@/lib/db";
import { CIRCUIT_BREAKER_CONFIG, IDEMPOTENCY_CONFIG, RETRY_CONFIG } from "./config";
import { TOPIC_DELIVERY, TOPIC_AUDIT } from "./kafka/topics";
import { checkBreaker, recordResult } from "./circuit-breaker";
import {
  computeDelayMs,
  getMaxAttempts,
  shouldRetry,
} from "./retry";
import { chargeRetry, recordInitialAttempt } from "./retry-budget";
import { deliverOnce } from "./deliver";
import { sendToDLQ } from "./dlq";
import { getTransport } from "./transport/factory";
import { CONSUMER_CONFIG } from "./config";
import type {
  AttemptOutcome,
  AuditEventType,
  KafkaDeliveryMessage,
  TransportMessage,
  WebhookRecord,
} from "./types";
import type { Consumer, Producer } from "./transport/interface";

export interface WorkerOptions {
  // Consumer group ID (default: vvu-webhook-delivery-workers)
  groupId?: string;
  // Topic (default: vvu-webhook-delivery)
  topic?: string;
  // Fetch implementation override (for tests)
  fetchImpl?: typeof fetch;
  // Inject transport override (for tests — memory transport)
  transport?: {
    consumer: Consumer;
    producer: Producer;
  };
}

export class WebhookWorker {
  private consumer: Consumer | null = null;
  private producer: Producer | null = null;
  private running = false;
  private opts: Required<WorkerOptions>;

  constructor(opts: WorkerOptions = {}) {
    this.opts = {
      groupId: opts.groupId ?? CONSUMER_CONFIG.GROUP_ID_DELIVERY,
      topic: opts.topic ?? TOPIC_DELIVERY,
      fetchImpl: opts.fetchImpl ?? fetch,
      transport: opts.transport ?? { consumer: undefined as never, producer: undefined as never },
    };
  }

  async start(): Promise<void> {
    if (this.running) return;
    this.running = true;

    // Resolve transport
    if (this.opts.transport.consumer && this.opts.transport.producer) {
      this.consumer = this.opts.transport.consumer;
      this.producer = this.opts.transport.producer;
    } else {
      const transport = await getTransport(this.opts.groupId);
      this.consumer = await transport.consumer();
      this.producer = await transport.producer();
    }

    await this.consumer.subscribe(this.opts.topic, this.opts.groupId);

    // Start the consumer loop (blocks until stop())
    // We don't `await` here so the caller can shut us down via stop()
    this.consumer.run(this.handle.bind(this)).catch((err) => {
      // eslint-disable-next-line no-console
      console.error("[webhook-worker] consumer run failed:", err);
      this.running = false;
    });
  }

  async stop(): Promise<void> {
    this.running = false;
    if (this.consumer) await this.consumer.stop();
    if (this.producer) await this.producer.disconnect();
  }

  /**
   * Message handler. Throws on error → offset NOT committed (message redelivered).
   * Resolves → offset committed (message acknowledged).
   *
   * Critical: This function MUST complete (success or DLQ) before resolving.
   * If it throws, the message is redelivered — which is fine for retries
   * because we use idempotency-key dedup at the receiver.
   */
  private async handle(message: TransportMessage): Promise<void> {
    const msg: KafkaDeliveryMessage = message.value;
    const { deliveryId, webhookId, eventId, payload } = msg;

    // 1. Look up the webhook
    const webhookRow = await db.webhook.findUnique({
      where: { id: webhookId },
    });
    if (!webhookRow || !webhookRow.enabled) {
      // Webhook doesn't exist or is soft-disabled — skip + commit
      // (do not DLQ — this is an admin-state issue, not a delivery issue)
      await this.audit("delivery_skipped", webhookId, deliveryId, "", {
        reason: webhookRow ? "WEBHOOK_DISABLED" : "WEBHOOK_NOT_FOUND",
      });
      return;
    }
    const webhook: WebhookRecord = {
      id: webhookRow.id,
      name: webhookRow.name,
      url: webhookRow.url,
      type: webhookRow.type as WebhookRecord["type"],
      secret: webhookRow.secret,
      nextSecret: webhookRow.nextSecret ?? "",
      enabled: webhookRow.enabled,
      createdAt: webhookRow.createdAt,
      updatedAt: webhookRow.updatedAt,
    };

    // Mark delivery as IN_FLIGHT
    await db.webhookDelivery.update({
      where: { id: deliveryId },
      data: {
        status: "IN_FLIGHT",
        statusReason: "",
        kafkaPartition: message.partition,
        kafkaOffset: Number(message.offset),
        updatedAt: new Date(),
      },
    });

    // 2. Check circuit breaker
    const cbCheck = await checkBreaker(webhookId);
    if (cbCheck.decision === "SKIP") {
      // Send to DLQ with reason circuit_breaker_open_skipped
      await sendToDLQ({
        deliveryId,
        webhookId,
        eventId,
        payload,
        reason: "circuit_breaker_open_skipped",
        finalHttpStatus: 0,
        producer: this.producer ?? undefined,
      });
      // Update delivery status
      await db.webhookDelivery.update({
        where: { id: deliveryId },
        data: {
          status: "SKIPPED",
          statusReason: cbCheck.reason,
          updatedAt: new Date(),
        },
      });
      await this.audit("delivery_skipped", webhookId, deliveryId, "", {
        reason: cbCheck.reason,
        cbState: cbCheck.currentState,
      });
      return;
    }

    // 3. Run retry engine
    const isProbe = cbCheck.isHalfOpenProbe;
    let attemptNumber = 0;
    let lastOutcome: AttemptOutcome = "connection_failure";
    let lastHttpStatus = 0;
    let lastResponseBody = "";
    let terminalReason: "exhausted_retries" | "non_retryable_error" | null = null;

    while (attemptNumber < getMaxAttempts()) {
      attemptNumber++;
      // Compute pre-attempt delay (jittered for retries)
      const preDelay = attemptNumber === 1 ? 0 : computeDelayMs(attemptNumber - 2);
      if (preDelay > 0) {
        // Charge retry budget before sleeping
        const ok = await chargeRetry();
        if (!ok) {
          // Budget exhausted — send to DLQ immediately
          terminalReason = "exhausted_retries";
          lastOutcome = "connection_failure";
          break;
        }
        await sleep(preDelay);
      } else if (attemptNumber === 1) {
        // Record initial attempt for accounting
        await recordInitialAttempt();
      }

      // Perform single HTTP delivery
      const result = await deliverOnce({
        webhook,
        deliveryId,
        payload,
        fetchImpl: this.opts.fetchImpl,
      });
      lastOutcome = result.outcome;
      lastHttpStatus = result.httpStatus;
      lastResponseBody = result.responseBody;

      // Persist attempt record
      const attemptRow = await db.webhookDeliveryAttempt.create({
        data: {
          deliveryId,
          attemptNumber,
          httpStatus: result.httpStatus,
          outcome: result.outcome,
          responseBody: result.responseBody,
          delayMs: preDelay,
          startedAt: new Date(Date.now() - (preDelay + RETRY_CONFIG.ATTEMPT_TIMEOUT_MS)),
          finishedAt: new Date(),
        },
      });

      await this.audit(
        "delivery_attempted",
        webhookId,
        deliveryId,
        attemptRow.id,
        {
          attemptNumber,
          httpStatus: result.httpStatus,
          outcome: result.outcome,
          isHalfOpenProbe: isProbe,
        },
      );

      if (result.outcome === "success") {
        // Success! Update delivery status
        await db.webhookDelivery.update({
          where: { id: deliveryId },
          data: {
            status: "DELIVERED",
            statusReason: "",
            updatedAt: new Date(),
          },
        });
        await recordResult(webhookId, isProbe, false);
        await this.audit("delivery_succeeded", webhookId, deliveryId, attemptRow.id, {
          attemptNumber,
        });
        return; // ✓ Done
      }

      // Non-retryable → immediate DLQ (terminal)
      if (result.outcome === "non_retryable") {
        terminalReason = "non_retryable_error";
        break;
      }

      // Retryable — check if we should retry
      if (!shouldRetry(attemptNumber, result.outcome)) {
        // Out of attempts
        terminalReason = "exhausted_retries";
        break;
      }

      // Honor 429 Retry-After (override the computed jittered delay)
      if (result.retryAfterMs && result.retryAfterMs > 0) {
        await sleep(result.retryAfterMs);
      }
      // Else: loop continues, computeDelayMs will be called next iteration
    }

    // 4. Terminal outcome — record CB (only for exhausted retries, NOT non-retryable)
    // Per contract: "Terminal Failure Definition: An event that has exhausted
    // all 4 delivery attempts." A non-retryable 400/401/403/404 is a DIFFERENT
    // layer of failure and must NOT count toward the per-webhook CB threshold.
    if (terminalReason === "exhausted_retries") {
      await recordResult(webhookId, isProbe, true);
    } else if (isProbe) {
      // Half-open probe: even a non-retryable failure means the probe failed
      // (the endpoint responded, but the request is rejected — the channel
      // is "working" in a strict sense, but the breaker should treat this
      // as a probe failure to avoid masking broken integrations).
      await recordResult(webhookId, isProbe, true);
    }

    const dlqReason =
      terminalReason === "non_retryable_error"
        ? "non_retryable_error" as const
        : "exhausted_retries" as const;

    await sendToDLQ({
      deliveryId,
      webhookId,
      eventId,
      payload,
      reason: dlqReason,
      finalHttpStatus: lastHttpStatus,
      producer: this.producer ?? undefined,
    });

    await db.webhookDelivery.update({
      where: { id: deliveryId },
      data: {
        status: "DLQ",
        statusReason: terminalReason ?? "exhausted_retries",
        updatedAt: new Date(),
      },
    });

    await this.audit("delivery_dlq", webhookId, deliveryId, "", {
      reason: dlqReason,
      finalHttpStatus: lastHttpStatus,
      attempts: attemptNumber,
    });
  }

  /**
   * Publish an audit event. Best-effort — failures don't block delivery.
   * Mirrors what admin workers consume from `vvu-webhook-audit`.
   */
  private async audit(
    type: AuditEventType,
    webhookId: string,
    deliveryId: string,
    attemptId: string,
    details: Record<string, unknown>,
  ): Promise<void> {
    try {
      // Write to Postgres (audit trail available to admin UI)
      await db.auditEvent.create({
        data: {
          type,
          webhookId,
          deliveryId,
          attemptId,
          details: JSON.stringify(details),
        },
      });
      // Also publish to Kafka audit topic (for admin workers)
      if (this.producer) {
        await this.producer.publish(TOPIC_AUDIT, webhookId, {
          deliveryId,
          webhookId,
          eventId: deliveryId, // reuse for audit
          payload: JSON.stringify({ type, ...details }),
        }).catch(() => {});
      }
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error("[webhook-worker] audit failure (non-fatal):", err);
    }
  }

  isRunning(): boolean {
    return this.running;
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

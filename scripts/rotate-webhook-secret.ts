/**
 * VVU-IVE Webhook Subsystem — Secret Rotation Script (Section 16.2 of dossier)
 * ----------------------------------------------------------------------------
 * Run: bun run scripts/rotate-webhook-secret.ts <webhook_id> [admin_user_id]
 *      bun run webhook:rotate-secret <webhook_id> [admin_user_id]
 *
 * Implements the STANDARD rotation procedure (NOT emergency):
 *   Phase 1 (here): generate new 32-byte secret, store as `nextSecret`.
 *   Phase 2 (operator-driven): deploy dual-validation code (already deployed
 *                              — deliver.ts sends both X-VVU-Signature and
 *                              X-VVU-Signature-Next headers when nextSecret
 *                              is set).
 *   Phase 3 (operator-driven): coordinate downstream clients to migrate.
 *   Phase 4 (separate `promote` script): promote nextSecret → secret.
 *
 * Emergency rotation (compromised secret) is also supported via --emergency:
 *   Immediately replaces `secret` with a fresh random value and clears
 *   `nextSecret`. Receivers that haven't been told the new secret will
 *   start rejecting signatures immediately.
 *
 * Audit: every rotation (scheduled or emergency) writes a row to
 *   `WebhookSecretAudit` containing SHA-256 hashes of the old and new
 *   secrets (NOT the secrets themselves).
 */

import { db } from "@/lib/db";
import crypto from "node:crypto";

export interface RotationOptions {
  webhookId: string;
  adminUserId: string;
  reason?: "scheduled" | "emergency" | "promoted";
  // Override the secret generator (for tests)
  generateSecret?: () => string;
}

export interface RotationResult {
  webhookId: string;
  success: boolean;
  // "scheduled" → nextSecret was set; secret unchanged
  // "emergency" → secret replaced; nextSecret cleared
  // "promoted"  → nextSecret promoted to secret; nextSecret cleared
  mode: "scheduled" | "emergency" | "promoted" | "noop";
  // When mode=scheduled: the new nextSecret (operator must distribute)
  // When mode=emergency: the new secret (operator must distribute)
  // When mode=promoted: empty (nextSecret was already known to clients)
  newSecret?: string;
  error?: string;
}

function defaultGenerateSecret(): string {
  // 32 bytes of cryptographic randomness → hex string (64 chars)
  return crypto.randomBytes(32).toString("hex");
}

function sha256Hex(input: string): string {
  return crypto.createHash("sha256").update(input).digest("hex");
}

/**
 * STANDARD rotation: set nextSecret. Existing clients continue to validate
 * against `secret`. New clients can be configured with `nextSecret`. Both
 * will work because deliver.ts sends BOTH X-VVU-Signature and
 * X-VVU-Signature-Next headers when nextSecret is set.
 */
export async function rotateSecret(opts: RotationOptions): Promise<RotationResult> {
  const { webhookId, adminUserId, reason = "scheduled" } = opts;
  const generate = opts.generateSecret ?? defaultGenerateSecret;

  try {
    const webhook = await db.webhook.findUnique({ where: { id: webhookId } });
    if (!webhook) {
      return {
        webhookId,
        success: false,
        mode: "noop",
        error: "Webhook not found",
      };
    }

    const newSecret = generate();
    const oldSecretHash = sha256Hex(webhook.secret);
    const newSecretHash = sha256Hex(newSecret);

    // Atomic update: set nextSecret, leave secret untouched
    await db.webhook.update({
      where: { id: webhookId },
      data: { nextSecret: newSecret, updatedAt: new Date() },
    });

    // Audit log — hashes only, never raw secrets
    await db.webhookSecretAudit.create({
      data: {
        webhookId,
        oldSecretHash,
        newSecretHash,
        rotatedBy: adminUserId,
        reason,
      },
    });

    return {
      webhookId,
      success: true,
      mode: "scheduled",
      newSecret,
    };
  } catch (err) {
    return {
      webhookId,
      success: false,
      mode: "noop",
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

/**
 * EMERGENCY rotation: immediately replace `secret` with a fresh random value
 * and clear `nextSecret`. Receivers that haven't been told the new secret
 * will start rejecting signatures immediately.
 *
 * Use this when a secret is known to be compromised.
 */
export async function emergencyRotateSecret(
  opts: RotationOptions,
): Promise<RotationResult> {
  const { webhookId, adminUserId } = opts;
  const generate = opts.generateSecret ?? defaultGenerateSecret;

  try {
    const webhook = await db.webhook.findUnique({ where: { id: webhookId } });
    if (!webhook) {
      return {
        webhookId,
        success: false,
        mode: "noop",
        error: "Webhook not found",
      };
    }

    const newSecret = generate();
    const oldSecretHash = sha256Hex(webhook.secret);
    const newSecretHash = sha256Hex(newSecret);

    await db.webhook.update({
      where: { id: webhookId },
      data: {
        secret: newSecret,
        nextSecret: "", // clear — no staged rotation in flight
        updatedAt: new Date(),
      },
    });

    await db.webhookSecretAudit.create({
      data: {
        webhookId,
        oldSecretHash,
        newSecretHash,
        rotatedBy: adminUserId,
        reason: "emergency",
      },
    });

    return {
      webhookId,
      success: true,
      mode: "emergency",
      newSecret,
    };
  } catch (err) {
    return {
      webhookId,
      success: false,
      mode: "noop",
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

/**
 * PROMOTE: when all clients have migrated to nextSecret, promote it to
 * `secret` and clear `nextSecret`. This completes the staged rotation.
 */
export async function promoteSecret(
  webhookId: string,
  adminUserId: string,
): Promise<RotationResult> {
  try {
    const webhook = await db.webhook.findUnique({ where: { id: webhookId } });
    if (!webhook) {
      return {
        webhookId,
        success: false,
        mode: "noop",
        error: "Webhook not found",
      };
    }

    if (!webhook.nextSecret) {
      return {
        webhookId,
        success: false,
        mode: "noop",
        error: "No nextSecret set — nothing to promote. Run scheduled rotation first.",
      };
    }

    const oldSecretHash = sha256Hex(webhook.secret);
    const newSecretHash = sha256Hex(webhook.nextSecret);

    await db.webhook.update({
      where: { id: webhookId },
      data: {
        secret: webhook.nextSecret, // promote
        nextSecret: "", // clear
        updatedAt: new Date(),
      },
    });

    await db.webhookSecretAudit.create({
      data: {
        webhookId,
        oldSecretHash,
        newSecretHash,
        rotatedBy: adminUserId,
        reason: "promoted",
      },
    });

    return {
      webhookId,
      success: true,
      mode: "promoted",
    };
  } catch (err) {
    return {
      webhookId,
      success: false,
      mode: "noop",
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

// ── CLI entrypoint ─────────────────────────────────────────────────────────
async function main() {
  const args = process.argv.slice(2);
  const isEmergency = args.includes("--emergency");
  const isPromote = args.includes("--promote");
  const positional = args.filter((a) => !a.startsWith("--"));

  const webhookId = positional[0];
  const adminUserId = positional[1] ?? "cli-admin";

  if (!webhookId) {
    // eslint-disable-next-line no-console
    console.error(
      "Usage: bun run scripts/rotate-webhook-secret.ts <webhook_id> [admin_user_id] [--emergency|--promote]",
    );
    // eslint-disable-next-line no-console
    console.error("  (no flag)   = scheduled rotation (sets nextSecret)");
    // eslint-disable-next-line no-console
    console.error("  --emergency = emergency rotation (replaces secret immediately)");
    // eslint-disable-next-line no-console
    console.error("  --promote   = promote nextSecret → secret (completes rotation)");
    process.exit(1);
  }

  let result: RotationResult;
  if (isPromote) {
    result = await promoteSecret(webhookId, adminUserId);
  } else if (isEmergency) {
    result = await emergencyRotateSecret({ webhookId, adminUserId });
  } else {
    result = await rotateSecret({ webhookId, adminUserId });
  }

  // eslint-disable-next-line no-console
  console.log("Rotation result:", JSON.stringify(result, null, 2));
  process.exit(result.success ? 0 : 1);
}

const isMain =
  typeof process !== "undefined" &&
  process.argv[1] &&
  process.argv[1].includes("rotate-webhook-secret");
if (isMain) {
  main().catch((err) => {
    // eslint-disable-next-line no-console
    console.error("FATAL:", err);
    process.exit(1);
  });
}

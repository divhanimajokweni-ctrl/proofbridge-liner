import { db } from "@/lib/db";
import crypto from "node:crypto";
function defaultGenerateSecret() {
  return crypto.randomBytes(32).toString("hex");
}
function sha256Hex(input) {
  return crypto.createHash("sha256").update(input).digest("hex");
}
async function rotateSecret(opts) {
  var _a;
  const { webhookId, adminUserId, reason = "scheduled" } = opts;
  const generate = (_a = opts.generateSecret) != null ? _a : defaultGenerateSecret;
  try {
    const webhook = await db.webhook.findUnique({ where: { id: webhookId } });
    if (!webhook) {
      return {
        webhookId,
        success: false,
        mode: "noop",
        error: "Webhook not found"
      };
    }
    const newSecret = generate();
    const oldSecretHash = sha256Hex(webhook.secret);
    const newSecretHash = sha256Hex(newSecret);
    await db.webhook.update({
      where: { id: webhookId },
      data: { nextSecret: newSecret, updatedAt: /* @__PURE__ */ new Date() }
    });
    await db.webhookSecretAudit.create({
      data: {
        webhookId,
        oldSecretHash,
        newSecretHash,
        rotatedBy: adminUserId,
        reason
      }
    });
    return {
      webhookId,
      success: true,
      mode: "scheduled",
      newSecret
    };
  } catch (err) {
    return {
      webhookId,
      success: false,
      mode: "noop",
      error: err instanceof Error ? err.message : String(err)
    };
  }
}
async function emergencyRotateSecret(opts) {
  var _a;
  const { webhookId, adminUserId } = opts;
  const generate = (_a = opts.generateSecret) != null ? _a : defaultGenerateSecret;
  try {
    const webhook = await db.webhook.findUnique({ where: { id: webhookId } });
    if (!webhook) {
      return {
        webhookId,
        success: false,
        mode: "noop",
        error: "Webhook not found"
      };
    }
    const newSecret = generate();
    const oldSecretHash = sha256Hex(webhook.secret);
    const newSecretHash = sha256Hex(newSecret);
    await db.webhook.update({
      where: { id: webhookId },
      data: {
        secret: newSecret,
        nextSecret: "",
        // clear — no staged rotation in flight
        updatedAt: /* @__PURE__ */ new Date()
      }
    });
    await db.webhookSecretAudit.create({
      data: {
        webhookId,
        oldSecretHash,
        newSecretHash,
        rotatedBy: adminUserId,
        reason: "emergency"
      }
    });
    return {
      webhookId,
      success: true,
      mode: "emergency",
      newSecret
    };
  } catch (err) {
    return {
      webhookId,
      success: false,
      mode: "noop",
      error: err instanceof Error ? err.message : String(err)
    };
  }
}
async function promoteSecret(webhookId, adminUserId) {
  try {
    const webhook = await db.webhook.findUnique({ where: { id: webhookId } });
    if (!webhook) {
      return {
        webhookId,
        success: false,
        mode: "noop",
        error: "Webhook not found"
      };
    }
    if (!webhook.nextSecret) {
      return {
        webhookId,
        success: false,
        mode: "noop",
        error: "No nextSecret set \u2014 nothing to promote. Run scheduled rotation first."
      };
    }
    const oldSecretHash = sha256Hex(webhook.secret);
    const newSecretHash = sha256Hex(webhook.nextSecret);
    await db.webhook.update({
      where: { id: webhookId },
      data: {
        secret: webhook.nextSecret,
        // promote
        nextSecret: "",
        // clear
        updatedAt: /* @__PURE__ */ new Date()
      }
    });
    await db.webhookSecretAudit.create({
      data: {
        webhookId,
        oldSecretHash,
        newSecretHash,
        rotatedBy: adminUserId,
        reason: "promoted"
      }
    });
    return {
      webhookId,
      success: true,
      mode: "promoted"
    };
  } catch (err) {
    return {
      webhookId,
      success: false,
      mode: "noop",
      error: err instanceof Error ? err.message : String(err)
    };
  }
}
async function main() {
  var _a;
  const args = process.argv.slice(2);
  const isEmergency = args.includes("--emergency");
  const isPromote = args.includes("--promote");
  const positional = args.filter((a) => !a.startsWith("--"));
  const webhookId = positional[0];
  const adminUserId = (_a = positional[1]) != null ? _a : "cli-admin";
  if (!webhookId) {
    console.error(
      "Usage: bun run scripts/rotate-webhook-secret.ts <webhook_id> [admin_user_id] [--emergency|--promote]"
    );
    console.error("  (no flag)   = scheduled rotation (sets nextSecret)");
    console.error("  --emergency = emergency rotation (replaces secret immediately)");
    console.error("  --promote   = promote nextSecret \u2192 secret (completes rotation)");
    process.exit(1);
  }
  let result;
  if (isPromote) {
    result = await promoteSecret(webhookId, adminUserId);
  } else if (isEmergency) {
    result = await emergencyRotateSecret({ webhookId, adminUserId });
  } else {
    result = await rotateSecret({ webhookId, adminUserId });
  }
  console.log("Rotation result:", JSON.stringify(result, null, 2));
  process.exit(result.success ? 0 : 1);
}
const isMain = typeof process !== "undefined" && process.argv[1] && process.argv[1].includes("rotate-webhook-secret");
if (isMain) {
  main().catch((err) => {
    console.error("FATAL:", err);
    process.exit(1);
  });
}
export {
  emergencyRotateSecret,
  promoteSecret,
  rotateSecret
};

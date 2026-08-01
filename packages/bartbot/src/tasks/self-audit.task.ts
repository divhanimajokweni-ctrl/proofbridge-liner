import { createEventJournal, createTrustContextManager } from "@proofbridge/trust-runtime";
import type { EventJournal, TrustContextManager } from "@proofbridge/trust-runtime";

export class SelfAuditTask {
  private contextManager: TrustContextManager;

  constructor() {
    this.contextManager = createTrustContextManager({
      signingKey: process.env.BARTBOT_SIGNING_KEY || "bartbot-self-audit-key",
    });
  }

  async execute(): Promise<{
    contextsChecked: number;
    passed: number;
    failed: number;
    details: Array<{ contextId: string; valid: boolean; breaks: string[] }>;
  }> {
    console.log("[BARTBOT] Self-Audit starting...");

    const contexts = this.contextManager.getAllContexts();
    const results: Array<{ contextId: string; valid: boolean; breaks: string[] }> = [];
    let passed = 0;
    let failed = 0;

    for (const ctx of contexts) {
      const journal = this.contextManager.getJournal(ctx.contextId);
      let valid = false;
      const breaks: string[] = [];

      if (journal) {
        valid = journal.verifyIntegrity();
        if (!valid) {
          breaks.push(`Hash chain integrity check failed for context ${ctx.contextId}`);
        }
      } else {
        breaks.push(`No journal found for context ${ctx.contextId}`);
      }

      results.push({
        contextId: ctx.contextId,
        valid,
        breaks,
      });

      if (valid) {
        passed++;
      } else {
        failed++;
        console.error(`[BARTBOT] Chain break in context ${ctx.contextId}:`, breaks);
      }
    }

    const auditContextId = process.env.BARTBOT_SELF_CONTEXT_ID || "ctx_bartbot_self";
    try {
      const auditJournal = createEventJournal({
        contextId: auditContextId,
      });

      auditJournal.journalEvent({
        contextId: auditContextId,
        eventType: failed > 0 ? "bartbot.self_audit_failure" : "bartbot.self_audit",
        eventVersion: "1",
        payload: {
          type: failed > 0 ? "bartbot.self_audit_failure" : "bartbot.self_audit",
          auditType: "hash-chain-integrity",
          result: failed > 0 ? "failed" : "passed",
          details: {
            contextsChecked: contexts.length,
            passed,
            failed,
            results,
            timestamp: Date.now(),
          },
          timestamp: Date.now(),
          alertLevel: failed > 0 ? "critical" : "warning",
        },
        agentId: "bartbot-self-audit",
      });
    } catch (err) {
      console.error(`[BARTBOT] Failed to journal audit result:`, err);
    }

    console.log(`[BARTBOT] Self-Audit complete: ${passed} passed, ${failed} failed`);
    return { contextsChecked: contexts.length, passed, failed, details: results };
  }

  getSchedule(): string {
    return "0 * * * *";
  }

  getTaskName(): string {
    return "self-audit";
  }
}

export const selfAuditTask = new SelfAuditTask();

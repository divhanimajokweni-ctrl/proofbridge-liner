import { createEventJournal, createTrustContextManager } from "@proofbridge/trust-runtime";
import type { TrustContextManager } from "@proofbridge/trust-runtime";

export class PolicySyncTask {
  private contextManager: TrustContextManager;

  constructor() {
    this.contextManager = createTrustContextManager({
      signingKey: process.env.BARTBOT_SIGNING_KEY || "bartbot-policy-sync-key",
    });
  }

  async execute(): Promise<{
    contextsChecked: number;
    policiesUpdated: number;
    details: Array<{ contextId: string; updated: boolean; newVersion?: string }>;
  }> {
    console.log("[BARTBOT] Policy Sync starting...");

    const contexts = this.contextManager.getAllContexts();
    const results: Array<{ contextId: string; updated: boolean; newVersion?: string }> = [];
    let policiesUpdated = 0;

    for (const ctx of contexts) {
      const journal = this.contextManager.getJournal(ctx.contextId);
      if (!journal) {
        results.push({ contextId: ctx.contextId, updated: false });
        continue;
      }

      const contextEvents = journal.getEventsByType("context.updated");
      const lastUpdate = contextEvents.length > 0
        ? contextEvents[contextEvents.length - 1]
        : null;

      const currentVersion = ctx.configurationReceipt || "0";
      const lastSyncedVersion = lastUpdate
        ? (lastUpdate.payload as any)?.newVersion || "0"
        : "0";

      if (currentVersion !== lastSyncedVersion) {
        journal.journalEvent({
          contextId: ctx.contextId,
          eventType: "context.updated",
          eventVersion: "1",
          payload: {
            type: "context.updated",
            previousVersion: lastSyncedVersion,
            newVersion: currentVersion,
            policyHash: ctx.trustAnchor,
            timestamp: Date.now(),
          },
          agentId: "bartbot-policy-sync",
        });

        policiesUpdated++;
        results.push({
          contextId: ctx.contextId,
          updated: true,
          newVersion: currentVersion,
        });

        console.log(`[BARTBOT] Policy updated for ${ctx.contextId}: ${currentVersion}`);
      } else {
        results.push({ contextId: ctx.contextId, updated: false });
      }
    }

    console.log(`[BARTBOT] Policy Sync complete: ${policiesUpdated} updated`);
    return { contextsChecked: contexts.length, policiesUpdated, details: results };
  }

  getSchedule(): string {
    return "*/30 * * * *";
  }

  getTaskName(): string {
    return "policy-sync";
  }
}

export const policySyncTask = new PolicySyncTask();

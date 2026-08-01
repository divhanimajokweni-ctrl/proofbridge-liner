import cron, { type ScheduledTask as CronScheduledTask } from "node-cron";
import { createEventJournal } from "@proofbridge/trust-runtime";

interface ScheduledTask {
  name: string;
  cronExpression: string;
  execute: () => Promise<any>;
  enabled: boolean;
  lastRun?: number;
  lastResult?: "success" | "failure";
}

class BartbotScheduler {
  private tasks: Map<string, ScheduledTask> = new Map();
  private cronJobs: Map<string, CronScheduledTask> = new Map();

  register(
    name: string,
    cronExpression: string,
    execute: () => Promise<any>,
    enabled: boolean = true
  ): void {
    if (this.tasks.has(name)) {
      console.warn(`[Scheduler] Task "${name}" already registered — overwriting`);
    }

    this.tasks.set(name, {
      name,
      cronExpression,
      execute,
      enabled,
    });

    console.log(`[Scheduler] Task registered: "${name}" (${cronExpression})`);
  }

  start(): void {
    console.log("[Scheduler] Starting BARTBOT task scheduler...");

    for (const [name, task] of this.tasks) {
      if (!task.enabled) {
        console.log(`[Scheduler] Task "${name}" is disabled — skipping`);
        continue;
      }

      if (!cron.validate(task.cronExpression)) {
        console.error(`[Scheduler] Invalid cron expression for "${name}": ${task.cronExpression}`);
        continue;
      }

      const cronJob = cron.schedule(task.cronExpression, async () => {
        await this.executeTask(name);
      });

      this.cronJobs.set(name, cronJob);
      console.log(`[Scheduler] Task "${name}" scheduled: ${task.cronExpression}`);
    }

    console.log(`[Scheduler] Started ${this.cronJobs.size} scheduled tasks`);
  }

  async executeNow(name: string): Promise<any> {
    const task = this.tasks.get(name);
    if (!task) {
      throw new Error(`Task "${name}" not registered`);
    }

    return this.executeTask(name);
  }

  stopTask(name: string): void {
    const cronJob = this.cronJobs.get(name);
    if (cronJob) {
      cronJob.stop();
      this.cronJobs.delete(name);
      console.log(`[Scheduler] Task "${name}" stopped`);
    }
  }

  stopAll(): void {
    for (const [name, cronJob] of this.cronJobs) {
      cronJob.stop();
      console.log(`[Scheduler] Task "${name}" stopped`);
    }
    this.cronJobs.clear();
    console.log("[Scheduler] All tasks stopped");
  }

  getStatus(): Array<{
    name: string;
    cron: string;
    enabled: boolean;
    lastRun?: number;
    lastResult?: string;
  }> {
    const status: Array<{
      name: string;
      cron: string;
      enabled: boolean;
      lastRun?: number;
      lastResult?: string;
    }> = [];

    for (const [name, task] of this.tasks) {
      status.push({
        name,
        cron: task.cronExpression,
        enabled: task.enabled,
        lastRun: task.lastRun,
        lastResult: task.lastResult,
      });
    }

    return status;
  }

  private async executeTask(name: string): Promise<void> {
    const task = this.tasks.get(name);
    if (!task) return;

    const startTime = Date.now();
    console.log(`[Scheduler] Executing task "${name}"...`);

    try {
      const result = await task.execute();

      task.lastRun = Date.now();
      task.lastResult = "success";

      console.log(`[Scheduler] Task "${name}" completed in ${Date.now() - startTime}ms`);

      await this.journalTaskExecution(name, true, Date.now() - startTime, result);
    } catch (err: any) {
      task.lastRun = Date.now();
      task.lastResult = "failure";

      console.error(`[Scheduler] Task "${name}" FAILED:`, err.message);

      await this.journalTaskExecution(name, false, Date.now() - startTime, {
        error: err.message,
        stack: err.stack,
      });
    }
  }

  private async journalTaskExecution(
    taskName: string,
    success: boolean,
    duration: number,
    result: any
  ): Promise<void> {
    try {
      const contextId = process.env.BARTBOT_SELF_CONTEXT_ID || "ctx_bartbot_self";
      const journal = createEventJournal({ contextId });

      journal.journalEvent({
        contextId,
        eventType: success ? "bartbot.self_audit" : "bartbot.self_audit_failure",
        eventVersion: "1",
        payload: {
          type: success ? "bartbot.self_audit" : "bartbot.self_audit_failure",
          auditType: "scheduler-execution",
          result: success ? "passed" : "failed",
          details: {
            taskName,
            success,
            duration,
            timestamp: Date.now(),
            resultSummary: typeof result === "object"
              ? JSON.stringify(result).slice(0, 500)
              : String(result).slice(0, 500),
          },
          timestamp: Date.now(),
          alertLevel: success ? "warning" : "critical",
        },
        agentId: "bartbot-scheduler",
      });
    } catch (err) {
      console.error(`[Scheduler] Failed to journal task execution:`, err);
    }
  }
}

export const bartbotScheduler = new BartbotScheduler();

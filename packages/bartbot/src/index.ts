import { bartbotScheduler } from "./scheduler";
import { securitySentinelTask } from "./tasks/security-sentinel.task";
import { selfAuditTask } from "./tasks/self-audit.task";
import { policySyncTask } from "./tasks/policy-sync.task";

bartbotScheduler.register(
  securitySentinelTask.getTaskName(),
  securitySentinelTask.getSchedule(),
  async () => {
    return securitySentinelTask.execute();
  }
);

bartbotScheduler.register(
  selfAuditTask.getTaskName(),
  selfAuditTask.getSchedule(),
  async () => {
    return selfAuditTask.execute();
  }
);

bartbotScheduler.register(
  policySyncTask.getTaskName(),
  policySyncTask.getSchedule(),
  async () => {
    return policySyncTask.execute();
  }
);

console.log("[BARTBOT] Initializing autonomous agent...");
bartbotScheduler.start();
console.log("[BARTBOT] Autonomous agent running");

process.on("SIGTERM", () => {
  console.log("[BARTBOT] SIGTERM received — stopping scheduler");
  bartbotScheduler.stopAll();
  process.exit(0);
});

process.on("SIGINT", () => {
  console.log("[BARTBOT] SIGINT received — stopping scheduler");
  bartbotScheduler.stopAll();
  process.exit(0);
});

export { bartbotScheduler };

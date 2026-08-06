import { execSync } from "child_process";

type MessageType = "security-scan" | "self-audit" | "policy-sync" | "alert";

interface LindiweMessage {
  type: MessageType;
  priority: "low" | "normal" | "high" | "critical";
  title: string;
  body: string;
  data?: Record<string, unknown>;
}

export class LindiweNotifier {
  private notifyScript: string;

  constructor(notifyScript?: string) {
    this.notifyScript = notifyScript ||
      process.env.LINDWEI_NOTIFY_SCRIPT ||
      "./scripts/send-whatsapp.js";
  }

  send(message: LindiweMessage): void {
    const formatted = this.formatMessage(message);
    this.dispatch(formatted);
  }

  sendSecurityScanReport(report: any): void {
    const message: LindiweMessage = {
      type: "security-scan",
      priority: report.passed ? "low" : "high",
      title: report.passed
        ? "Security Scan — Clean"
        : "Security Scan — Alerts Found",
      body: report.summary,
      data: report,
    };
    this.send(message);
  }

  sendSelfAuditReport(audit: {
    contextsChecked: number;
    passed: number;
    failed: number;
    details: Array<{ contextId: string; valid: boolean; breaks: string[] }>;
  }): void {
    const isClean = audit.failed === 0;

    const lines: string[] = [];
    lines.push(isClean ? "Hash Chain Audit — All Intact" : "Hash Chain Audit — BREAKS DETECTED");
    lines.push("");
    lines.push(`• Contexts checked: ${audit.contextsChecked}`);
    lines.push(`• Passed: ${audit.passed}`);
    lines.push(`• Failed: ${audit.failed}`);
    lines.push("");

    if (!isClean) {
      for (const detail of audit.details) {
        if (!detail.valid) {
          lines.push(`${detail.contextId}`);
          for (const breakMsg of detail.breaks) {
            lines.push(`  → ${breakMsg.slice(0, 120)}`);
          }
        }
      }
    }

    const message: LindiweMessage = {
      type: "self-audit",
      priority: isClean ? "normal" : "critical",
      title: isClean ? "Hash Chain Audit — All Intact" : "Hash Chain Audit — BREAKS",
      body: lines.join("\n"),
      data: audit,
    };
    this.send(message);
  }

  sendPolicySyncReport(sync: {
    contextsChecked: number;
    policiesUpdated: number;
    details: Array<{ contextId: string; updated: boolean; newVersion?: string }>;
  }): void {
    const lines: string[] = [];
    lines.push(sync.policiesUpdated > 0
      ? "Policy Sync — Updates Applied"
      : "Policy Sync — No Changes");
    lines.push("");
    lines.push(`• Contexts: ${sync.contextsChecked}`);
    lines.push(`• Updated: ${sync.policiesUpdated}`);

    if (sync.policiesUpdated > 0) {
      lines.push("");
      for (const detail of sync.details) {
        if (detail.updated) {
          lines.push(`  → ${detail.contextId}: v${detail.newVersion}`);
        }
      }
    }

    const message: LindiweMessage = {
      type: "policy-sync",
      priority: "low",
      title: sync.policiesUpdated > 0 ? "Policy Sync — Updated" : "Policy Sync — No Changes",
      body: lines.join("\n"),
      data: sync,
    };
    this.send(message);
  }

  sendAlert(title: string, body: string, priority: "high" | "critical" = "high"): void {
    const prefix = priority === "critical" ? "!!!" : "!!";
    const message: LindiweMessage = {
      type: "alert",
      priority,
      title: `${prefix} ${title}`,
      body,
    };
    this.send(message);
  }

  private formatMessage(message: LindiweMessage): string {
    const priorityMarkers: Record<string, string> = {
      low: "[INFO]",
      normal: "[NOTICE]",
      high: "[WARN]",
      critical: "[CRIT]",
    };

    const marker = priorityMarkers[message.priority] || "[NOTICE]";
    const header = `${marker} ${message.title}`;
    const timestamp = `\n\n${new Date().toISOString().slice(0, 19).replace("T", " ")} UTC`;

    return `${header}\n\n${message.body}${timestamp}`;
  }

  private dispatch(message: string): void {
    try {
      const escaped = message.replace(/"/g, '\\"').replace(/`/g, '\\`');
      execSync(`node ${this.notifyScript} "${escaped}"`, {
        timeout: 15_000,
        stdio: "pipe",
      });
      console.log("[Lindiwe] Notification sent");
    } catch (err: any) {
      console.error("[Lindiwe] Failed to send notification:", err.message);
    }
  }
}

export const lindiweNotifier = new LindiweNotifier();

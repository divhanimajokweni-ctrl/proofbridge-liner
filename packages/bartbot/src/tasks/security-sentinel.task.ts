import { execSync } from "child_process";
import { createEventJournal, createTrustContextManager } from "@proofbridge/trust-runtime";
import { hashObject } from "@proofbridge/trust-crypto";

interface SecuritySentinelConfig {
  repoPath: string;
  bartbotAgentId: string;
  securityContextId: string;
  dockerImageName: string;
  lindiweNotifyScript: string;
  schedule: string;
  thresholds: {
    criticalCve: number;
    highCve: number;
    secretsLeaked: number;
    slitherHigh: number;
  };
}

const DEFAULT_CONFIG: SecuritySentinelConfig = {
  repoPath: process.env.REPO_PATH || "/home/vvu/proofbridge-liner",
  bartbotAgentId: "bartbot-security-sentinel",
  securityContextId: process.env.BARTBOT_SECURITY_CONTEXT_ID || "ctx_security_sentinel",
  dockerImageName: process.env.DOCKER_IMAGE_NAME || "proofbridge-liner-risk-engine:latest",
  lindiweNotifyScript: process.env.LINDWEI_NOTIFY_SCRIPT || "./scripts/send-whatsapp.js",
  schedule: "0 6 * * *",
  thresholds: {
    criticalCve: 0,
    highCve: 0,
    secretsLeaked: 0,
    slitherHigh: 0,
  },
};

interface NpmAuditResult {
  critical: number;
  high: number;
  moderate: number;
  low: number;
  total: number;
}

interface GitleaksResult {
  leakCount: number;
  leaks: Array<{
    file: string;
    line: number;
    rule: string;
    secret: string;
  }>;
}

interface TrivyResult {
  vulnerabilities: Array<{
    id: string;
    severity: string;
    package: string;
    installedVersion: string;
    fixedVersion: string;
    title: string;
  }>;
}

interface SlitherResult {
  detectors: Array<{
    check: string;
    severity: string;
    description: string;
    file: string;
    line: number;
  }>;
}

interface ConfigDriftResult {
  dockerRoot: boolean;
  openPortsCount: number;
  envFileExposed: boolean;
  issues: string[];
}

interface SecurityScanReport {
  timestamp: number;
  scanId: string;
  npmAudit: NpmAuditResult;
  gitleaks: GitleaksResult;
  trivy: TrivyResult;
  slither: SlitherResult;
  configDrift: ConfigDriftResult;
  duration: number;
  passed: boolean;
  summary: string;
}

function runNpmAudit(repoPath: string): NpmAuditResult {
  try {
    const output = execSync("npm audit --json", {
      cwd: repoPath,
      timeout: 120_000,
    }).toString();

    const audit = JSON.parse(output);
    const vulns = audit.metadata?.vulnerabilities || {};
    return {
      critical: vulns.critical || 0,
      high: vulns.high || 0,
      moderate: vulns.moderate || 0,
      low: vulns.low || 0,
      total: (vulns.critical || 0) + (vulns.high || 0) + (vulns.moderate || 0) + (vulns.low || 0),
    };
  } catch (err: any) {
    if (err.stdout) {
      try {
        const audit = JSON.parse(err.stdout);
        const vulns = audit.metadata?.vulnerabilities || {};
        return {
          critical: vulns.critical || 0,
          high: vulns.high || 0,
          moderate: vulns.moderate || 0,
          low: vulns.low || 0,
          total: (vulns.critical || 0) + (vulns.high || 0) + (vulns.moderate || 0) + (vulns.low || 0),
        };
      } catch {}
    }
    return { critical: 0, high: 0, moderate: 0, low: 0, total: 0 };
  }
}

function runGitleaks(repoPath: string): GitleaksResult {
  try {
    execSync(
      `gitleaks detect --source ${repoPath} --report-format json --report-path /tmp/gitleaks-report.json --no-git`,
      { timeout: 60_000 }
    );
    const raw = require("fs").readFileSync("/tmp/gitleaks-report.json", "utf-8");
    const findings = JSON.parse(raw || "[]");

    return {
      leakCount: findings.length,
      leaks: findings.map((f: any) => ({
        file: f.File || f.file,
        line: f.StartLine || f.line,
        rule: f.RuleID || f.rule,
        secret: "[REDACTED]",
      })),
    };
  } catch {
    return { leakCount: 0, leaks: [] };
  }
}

function runTrivy(repoPath: string, dockerImage: string): TrivyResult {
  const vulns: TrivyResult["vulnerabilities"] = [];

  try {
    execSync(
      `trivy fs --scanners vuln --severity HIGH,CRITICAL --format json --output /tmp/trivy-fs.json ${repoPath}`,
      { timeout: 120_000 }
    );
    const raw = require("fs").readFileSync("/tmp/trivy-fs.json", "utf-8");
    const data = JSON.parse(raw);
    for (const result of data.Results || []) {
      for (const v of result.Vulnerabilities || []) {
        vulns.push({
          id: v.VulnerabilityID,
          severity: v.Severity,
          package: v.PkgName,
          installedVersion: v.InstalledVersion,
          fixedVersion: v.FixedVersion || "unknown",
          title: v.Title || "",
        });
      }
    }
  } catch {}

  if (dockerImage) {
    try {
      execSync(
        `trivy image --severity HIGH,CRITICAL --format json --output /tmp/trivy-image.json ${dockerImage}`,
        { timeout: 120_000 }
      );
      const raw = require("fs").readFileSync("/tmp/trivy-image.json", "utf-8");
      const data = JSON.parse(raw);
      for (const result of data.Results || []) {
        for (const v of result.Vulnerabilities || []) {
          vulns.push({
            id: v.VulnerabilityID,
            severity: v.Severity,
            package: v.PkgName,
            installedVersion: v.InstalledVersion,
            fixedVersion: v.FixedVersion || "unknown",
            title: v.Title || "",
          });
        }
      }
    } catch {}
  }

  return { vulnerabilities: vulns };
}

function runSlither(repoPath: string): SlitherResult {
  const contractsDir = `${repoPath}/contracts`;
  const fs = require("fs");

  if (!fs.existsSync(contractsDir)) {
    return { detectors: [] };
  }

  try {
    execSync(`slither ${contractsDir} --json /tmp/slither.json`, {
      timeout: 120_000,
    });
    const raw = fs.readFileSync("/tmp/slither.json", "utf-8");
    const data = JSON.parse(raw);
    const detectors: SlitherResult["detectors"] = [];

    if (data.results?.detectors) {
      for (const d of data.results.detectors) {
        detectors.push({
          check: d.check,
          severity: d.impact || "Unknown",
          description: d.description,
          file: d.elements?.[0]?.source_mapping?.filename_relative || "unknown",
          line: d.elements?.[0]?.source_mapping?.lines?.[0] || 0,
        });
      }
    }

    return { detectors };
  } catch {
    return { detectors: [] };
  }
}

function runConfigDrift(repoPath: string): ConfigDriftResult {
  const fs = require("fs");
  const issues: string[] = [];
  let dockerRoot = false;
  let openPortsCount = 0;
  let envFileExposed = false;

  try {
    const dockerfile = fs.readFileSync(`${repoPath}/infra/Dockerfile`, "utf-8");
    if (!dockerfile.includes("USER ")) {
      dockerRoot = true;
      issues.push("Dockerfile does not specify non-root USER");
    }
  } catch {}

  try {
    const compose = fs.readFileSync(`${repoPath}/infra/docker-compose.yml`, "utf-8");
    const ports = compose.match(/EXPOSE|ports:/g) || [];
    openPortsCount = ports.length;
  } catch {}

  try {
    if (fs.existsSync(`${repoPath}/.env`)) {
      envFileExposed = true;
      issues.push(".env file present in repo (should be .gitignored)");
    }
  } catch {}

  return { dockerRoot, openPortsCount, envFileExposed, issues };
}

function generateReport(
  scanId: string,
  npmResult: NpmAuditResult,
  gitleaksResult: GitleaksResult,
  trivyResult: TrivyResult,
  slitherResult: SlitherResult,
  driftResult: ConfigDriftResult,
  duration: number,
  thresholds: SecuritySentinelConfig["thresholds"]
): SecurityScanReport {
  const hasAlerts =
    npmResult.critical > thresholds.criticalCve ||
    npmResult.high > thresholds.highCve ||
    gitleaksResult.leakCount > thresholds.secretsLeaked ||
    slitherResult.detectors.filter((d) => d.severity === "High").length > thresholds.slitherHigh;

  const passed = !hasAlerts;

  const lines: string[] = [];
  lines.push(`BARTBOT Security Scan — ${new Date().toISOString().slice(0, 10)}`);
  lines.push("");
  lines.push(`• CVEs: ${npmResult.critical} critical, ${npmResult.high} high, ${npmResult.moderate} moderate`);
  lines.push(`• Secrets: ${gitleaksResult.leakCount > 0 ? "ALERT " + gitleaksResult.leakCount + " LEAKED" : "None"}`);
  lines.push(`• Docker: ${trivyResult.vulnerabilities.length} HIGH/CRITICAL vulns`);
  lines.push(`• Solidity: ${slitherResult.detectors.length} findings`);
  lines.push(`• Config: ${driftResult.issues.length > 0 ? driftResult.issues.join(", ") : "Clean"}`);
  lines.push("");
  lines.push(`Scan ID: ${scanId}`);
  lines.push(`Duration: ${(duration / 1000).toFixed(1)}s`);
  lines.push(`Status: ${passed ? "PASSED" : "ALERTS FOUND"}`);

  return {
    timestamp: Date.now(),
    scanId,
    npmAudit: npmResult,
    gitleaks: gitleaksResult,
    trivy: trivyResult,
    slither: slitherResult,
    configDrift: driftResult,
    duration,
    passed,
    summary: lines.join("\n"),
  };
}

export class SecuritySentinelTask {
  private config: SecuritySentinelConfig;

  constructor(config: Partial<SecuritySentinelConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  async execute(): Promise<SecurityScanReport> {
    const startTime = performance.now();
    const scanId = `scan_${hashObject({ ts: Date.now(), type: "security-sentinel" }).slice(0, 16)}`;

    console.log(`[BARTBOT] Security Sentinel starting — scan ${scanId}`);

    const npmResult = runNpmAudit(this.config.repoPath);
    console.log(`[BARTBOT] NPM audit complete: ${npmResult.total} vulns`);

    const gitleaksResult = runGitleaks(this.config.repoPath);
    console.log(`[BARTBOT] Gitleaks complete: ${gitleaksResult.leakCount} leaks`);

    const trivyResult = runTrivy(this.config.repoPath, this.config.dockerImageName);
    console.log(`[BARTBOT] Trivy complete: ${trivyResult.vulnerabilities.length} vulns`);

    const slitherResult = runSlither(this.config.repoPath);
    console.log(`[BARTBOT] Slither complete: ${slitherResult.detectors.length} findings`);

    const driftResult = runConfigDrift(this.config.repoPath);
    console.log(`[BARTBOT] Config drift complete: ${driftResult.issues.length} issues`);

    const duration = performance.now() - startTime;

    const report = generateReport(
      scanId,
      npmResult,
      gitleaksResult,
      trivyResult,
      slitherResult,
      driftResult,
      duration,
      this.config.thresholds
    );

    await this.journalScan(report);
    await this.notifyLindiwe(report);

    console.log(`[BARTBOT] Security Sentinel complete — ${report.passed ? "PASSED" : "ALERTS"}`);
    return report;
  }

  private async journalScan(report: SecurityScanReport): Promise<void> {
    try {
      const journal = createEventJournal({
        contextId: this.config.securityContextId,
      });

      journal.journalEvent({
        contextId: this.config.securityContextId,
        eventType: report.passed
          ? "bartbot.self_audit"
          : "bartbot.self_audit_failure",
        eventVersion: "1",
        payload: {
          type: report.passed ? "bartbot.self_audit" : "bartbot.self_audit_failure",
          auditType: "security-sentinel",
          result: report.passed ? "passed" : "failed",
          details: {
            scanId: report.scanId,
            npmVulns: report.npmAudit,
            secretsLeaked: report.gitleaks.leakCount,
            dockerVulns: report.trivy.vulnerabilities.length,
            slitherFindings: report.slither.detectors.length,
            configIssues: report.configDrift.issues,
            duration: report.duration,
          },
          timestamp: Date.now(),
          alertLevel: report.passed ? "warning" : "critical",
        },
        agentId: this.config.bartbotAgentId,
      });

      console.log(`[BARTBOT] Security scan journaled to trust events`);
    } catch (err) {
      console.error(`[BARTBOT] Failed to journal scan:`, err);
    }
  }

  private async notifyLindiwe(report: SecurityScanReport): Promise<void> {
    try {
      execSync(
        `node ${this.config.lindiweNotifyScript} "${report.summary.replace(/"/g, '\\"')}"`,
        { timeout: 15_000 }
      );
      console.log(`[BARTBOT] WhatsApp notification sent`);
    } catch (err) {
      console.error(`[BARTBOT] Failed to send WhatsApp notification:`, err);
    }
  }

  getSchedule(): string {
    return this.config.schedule;
  }

  getTaskName(): string {
    return "security-sentinel";
  }
}

export const securitySentinelTask = new SecuritySentinelTask();

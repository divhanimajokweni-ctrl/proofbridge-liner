"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { FileText, Download, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface TrustAssuranceReportProps {
  claimTitle: string;
  claimState: string;
  claimType: string;
  safetyCritical: boolean;
  nInd: number | null;
  numSources: number;
  evidenceCount: number;
  authorized: boolean | null;
  breakerTripped: boolean;
  intendedAction: string;
  generatedAt?: Date;
}

interface MetricRow {
  label: string;
  value: string;
  status: "pass" | "warn" | "fail" | "info";
}

export function TrustAssuranceReport({
  claimTitle,
  claimState,
  claimType,
  safetyCritical,
  nInd,
  numSources,
  evidenceCount,
  authorized,
  breakerTripped,
  intendedAction,
  generatedAt = new Date(),
}: TrustAssuranceReportProps) {
  const reportId = `TAR-${generatedAt.getTime().toString(36).toUpperCase().slice(-8)}`;

  const metrics: MetricRow[] = [
    {
      label: "Claim Verification State",
      value: claimState,
      status: ["PROVEN", "VERIFIED", "SUPPORTED"].includes(claimState)
        ? "pass"
        : claimState === "OBSERVED"
        ? "warn"
        : "fail",
    },
    {
      label: "Claim Type Classification",
      value: claimType,
      status: "info",
    },
    {
      label: "Evidence Items Collected",
      value: String(evidenceCount),
      status: evidenceCount >= 3 ? "pass" : evidenceCount >= 1 ? "warn" : "fail",
    },
    {
      label: "Distinct Evidence Sources",
      value: String(numSources),
      status: numSources >= 3 ? "pass" : numSources >= 2 ? "warn" : "fail",
    },
    {
      label: "Spectral Diversification (N_ind)",
      value: nInd !== null ? nInd.toFixed(4) : "—",
      status: nInd !== null && nInd >= (safetyCritical ? 2 : 1) - 0.3 ? "pass" : "fail",
    },
    {
      label: "Safety-Critical Designation",
      value: safetyCritical ? "YES" : "NO",
      status: "info",
    },
    {
      label: "Circuit Breaker State",
      value: breakerTripped ? "TRIPPED" : "CLOSED",
      status: breakerTripped ? "fail" : "pass",
    },
    {
      label: "Authorization Decision (A)",
      value: authorized === null ? "PENDING" : authorized ? "TRUE" : "FALSE",
      status: authorized === null ? "info" : authorized ? "pass" : "fail",
    },
  ];

  const passedCount = metrics.filter((m) => m.status === "pass").length;
  const failedCount = metrics.filter((m) => m.status === "fail").length;
  const warnCount = metrics.filter((m) => m.status === "warn").length;

  const overallStatus: "pass" | "warn" | "fail" =
    failedCount > 0 || breakerTripped ? "fail" : warnCount > 0 ? "warn" : "pass";

  const statusStyles = {
    pass: { bg: "bg-emerald-500/10", text: "text-emerald-700 dark:text-emerald-300", border: "border-emerald-500/30", dot: "bg-emerald-500" },
    warn: { bg: "bg-amber-500/10", text: "text-amber-700 dark:text-amber-300", border: "border-amber-500/30", dot: "bg-amber-500" },
    fail: { bg: "bg-red-500/10", text: "text-red-700 dark:text-red-300", border: "border-red-500/30", dot: "bg-red-500" },
    info: { bg: "bg-transparent", text: "text-foreground", border: "border-border", dot: "bg-muted-foreground/50" },
  };

  const overallLabel = {
    pass: "TRUST VERIFIED",
    warn: "TRUST DEGRADED",
    fail: "TRUST SUSPENDED",
  }[overallStatus];

  const statusColorMap = {
    pass: "#10b981",
    warn: "#f59e0b",
    fail: "#ef4444",
    info: "#71717a",
  };

  const generateReportHTML = () => {
    const statusColor = statusColorMap[overallStatus];
    const metricsRows = metrics.map((m) => {
      const c = statusColorMap[m.status];
      return `<tr>
        <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;font-size:13px;color:#52525b">${m.label}</td>
        <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;font-size:13px;font-family:monospace;font-weight:600;color:${c}">${m.value}</td>
        <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;font-size:11px;font-family:monospace;color:${c};text-transform:uppercase">${m.status}</td>
      </tr>`;
    }).join("");

    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>VVU Trust Assurance Report ${reportId}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; color: #18181b; background: #fff; padding: 48px; max-width: 800px; margin: 0 auto; }
    h1 { font-size: 22px; font-weight: 700; margin-bottom: 4px; }
    .subtitle { font-size: 12px; color: #71717a; font-family: monospace; margin-bottom: 24px; }
    .posture { border: 2px solid ${statusColor}; border-radius: 8px; padding: 16px; margin-bottom: 24px; background: ${statusColor}11; }
    .posture-label { font-size: 11px; font-family: monospace; text-transform: uppercase; letter-spacing: 1px; color: #71717a; margin-bottom: 4px; }
    .posture-value { font-size: 18px; font-family: monospace; font-weight: 700; color: ${statusColor}; letter-spacing: 2px; }
    .posture-claim { font-size: 14px; font-weight: 600; margin-top: 8px; }
    .posture-meta { font-size: 11px; font-family: monospace; color: #71717a; margin-top: 4px; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 24px; }
    th { padding: 8px 12px; border-bottom: 2px solid #e5e7eb; font-size: 11px; font-family: monospace; text-transform: uppercase; letter-spacing: 0.5px; color: #71717a; text-align: left; }
    .footer { font-size: 11px; font-family: monospace; color: #a1a1aa; line-height: 1.6; }
    .branding { display: flex; align-items: center; gap: 8px; margin-bottom: 4px; }
    .ring { width: 8px; height: 8px; border-radius: 50%; border: 2px solid; display: inline-block; }
    @media print { body { padding: 24px; } }
  </style>
</head>
<body>
  <div class="branding">
    <span class="ring" style="border-color:#10b981"></span>
    <span class="ring" style="border-color:#f59e0b"></span>
    <span class="ring" style="border-color:#8b5cf6"></span>
    <span style="font-weight:700;font-size:16px;margin-left:4px">VVU</span>
    <span style="font-size:11px;color:#71717a;font-family:monospace">SEARM Platform</span>
  </div>
  <h1>Trust Assurance Report</h1>
  <p class="subtitle">Report ID: ${reportId} · TAR v1.0 · Audit-ready attestation</p>

  <div class="posture">
    <div class="posture-label">Overall Posture</div>
    <div class="posture-value">${overallLabel}</div>
    <div class="posture-claim">${claimTitle}</div>
    <div class="posture-meta">
      ${generatedAt.toISOString()} · ${passedCount} pass · ${warnCount} warn · ${failedCount} fail
    </div>
  </div>

  <table>
    <thead>
      <tr><th>Metric</th><th>Value</th><th>Status</th></tr>
    </thead>
    <tbody>${metricsRows}</tbody>
  </table>

  <p style="font-size:12px;margin-bottom:4px"><strong>Intended action:</strong> ${intendedAction}</p>

  <div class="footer">
    <p>This report satisfies EU AI Act Article 13 (transparency), NIST AI RMF MEASURE function, and SOC 2 CC7.1 (detection &amp; monitoring) evidence requirements.</p>
    <p style="margin-top:8px">Generated by VVU SEARM Platform · ${new Date().toISOString()}</p>
  </div>
</body>
</html>`;
  };

  return (
    <Card className="p-4">
      <div className="flex items-center justify-between mb-3">
        <div>
          <h3 className="text-sm font-semibold tracking-tight flex items-center gap-1.5">
            <FileText className="h-3.5 w-3.5" />
            Trust Assurance Report
          </h3>
          <p className="text-[11px] text-muted-foreground font-mono mt-0.5">
            TAR v1.0 · Audit-ready attestation
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-[10px] font-mono">
            {reportId}
          </Badge>
        </div>
      </div>

      {/* Report Header */}
      <div className={cn("rounded-md border p-3 mb-3", statusStyles[overallStatus].bg, statusStyles[overallStatus].border)}>
        <div className="flex items-center justify-between mb-1">
          <span className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
            Overall Posture
          </span>
          <span className={cn("font-mono text-sm font-bold tracking-wider", statusStyles[overallStatus].text)}>
            {overallLabel}
          </span>
        </div>
        <p className="text-xs font-semibold leading-tight mb-1 line-clamp-1">{claimTitle}</p>
        <div className="flex items-center gap-3 text-[10px] font-mono text-muted-foreground">
          <span>{generatedAt.toLocaleString()}</span>
          <span>·</span>
          <span>{passedCount} pass</span>
          <span>·</span>
          <span>{warnCount} warn</span>
          <span>·</span>
          <span>{failedCount} fail</span>
        </div>
      </div>

      {/* Metrics Table */}
      <div className="space-y-1">
        {metrics.map((metric) => {
          const s = statusStyles[metric.status];
          return (
            <div
              key={metric.label}
              className={cn("flex items-center justify-between rounded border px-2.5 py-1.5", s.bg, s.border)}
            >
              <div className="flex items-center gap-2 min-w-0">
                <span className={cn("h-1.5 w-1.5 rounded-full shrink-0", s.dot)} />
                <span className="text-[11px] text-muted-foreground truncate">{metric.label}</span>
              </div>
              <span className={cn("font-mono text-[11px] font-semibold shrink-0 ml-2", s.text)}>
                {metric.value}
              </span>
            </div>
          );
        })}
      </div>

      {/* Footer */}
      <div className="mt-3 flex items-center justify-between">
        <p className="text-[10px] text-muted-foreground font-mono">
          Intended action: <span className="font-semibold text-foreground">{intendedAction}</span>
        </p>
        <div className="flex items-center gap-1">
          <button
            className="rounded border border-border bg-background px-2 py-1 text-[10px] font-mono font-semibold hover:bg-muted transition-colors"
            onClick={() => {
              const html = generateReportHTML();
              const win = window.open("", "_blank", "width=800,height=600");
              if (win) {
                win.document.write(html);
                win.document.close();
                win.onload = () => { win.print(); };
              }
            }}
          >
            <Download className="h-2.5 w-2.5 inline mr-1" />
            Export PDF
          </button>
          <button
            className="rounded border border-border bg-background px-2 py-1 text-[10px] font-mono font-semibold hover:bg-muted transition-colors"
            onClick={() => {
              const text = `VVU Trust Assurance Report\nReport ID: ${reportId}\nGenerated: ${generatedAt.toISOString()}\nClaim: ${claimTitle}\n\nOverall: ${overallLabel}\n\n${metrics.map((m) => `${m.label}: ${m.value} [${m.status.toUpperCase()}]`).join("\n")}`;
              const blob = new Blob([text], { type: "text/plain" });
              const url = URL.createObjectURL(blob);
              const a = document.createElement("a");
              a.href = url;
              a.download = `${reportId}.txt`;
              a.click();
              URL.revokeObjectURL(url);
            }}
          >
            <Download className="h-2.5 w-2.5 inline mr-1" />
            Export TXT
          </button>
        </div>
      </div>

      <p className="mt-2 text-[10px] text-muted-foreground font-mono leading-relaxed">
        This report satisfies EU AI Act Article 13 (transparency), NIST AI RMF MEASURE function,
        and SOC 2 CC7.1 (detection & monitoring) evidence requirements.
      </p>
    </Card>
  );
}

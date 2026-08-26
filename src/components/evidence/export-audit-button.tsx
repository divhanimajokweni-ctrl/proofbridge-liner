"use client";

import { useState } from "react";
import { Download, FileJson, CheckCircle2 } from "lucide-react";
import type { EvidenceGraph } from "@/lib/evidence/EISv1Engine";
import { AuditSerializer } from "@/lib/evidence/AuditSerializer";

interface ExportAuditButtonProps {
  evidenceGraph: EvidenceGraph | null;
  isSimulation?: boolean;
}

/**
 * Export Audit Button — generates a cryptographic audit receipt (.JSON)
 * using the browser's native Web Crypto API for SHA-256 hashing.
 *
 * The receipt includes the appliedConfiguration so the result is
 * mathematically reproducible — a municipal investigator can verify
 * exactly why the system made its decision.
 */
export function ExportAuditButton({
  evidenceGraph,
  isSimulation = true,
}: ExportAuditButtonProps) {
  const [isExporting, setIsExporting] = useState(false);
  const [exported, setExported] = useState(false);

  const handleExport = async () => {
    if (!evidenceGraph) return;
    setIsExporting(true);

    try {
      const jsonString = await AuditSerializer.generateAuditDocument(
        evidenceGraph,
        isSimulation
      );

      const blob = new Blob([jsonString], { type: "application/json" });
      const url = URL.createObjectURL(blob);

      const auditId = JSON.parse(jsonString).auditId;
      const link = document.createElement("a");
      link.href = url;
      link.download = `VVU_AUDIT_${auditId}_${evidenceGraph.claimId}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      setExported(true);
      setTimeout(() => setExported(false), 3000);
    } catch (error) {
      console.error("Failed to export audit document:", error);
    } finally {
      setIsExporting(false);
    }
  };

  if (!evidenceGraph) {
    return (
      <button
        disabled
        className="flex cursor-not-allowed items-center gap-2 rounded border border-slate-700 bg-slate-800 px-4 py-2 font-mono text-sm text-slate-500"
      >
        <FileJson className="h-4 w-4" /> NO EVIDENCE TO EXPORT
      </button>
    );
  }

  return (
    <button
      onClick={handleExport}
      disabled={isExporting}
      className={`flex items-center gap-2 rounded border px-4 py-2 font-mono text-sm transition-all ${
        exported
          ? "border-emerald-500 bg-emerald-900/50 text-emerald-400"
          : "border-sky-900/50 bg-slate-800 text-sky-400 hover:border-sky-500 hover:bg-slate-700"
      }`}
    >
      {exported ? (
        <>
          <CheckCircle2 className="h-4 w-4" /> RECEIPT SAVED
        </>
      ) : (
        <>
          <Download className={`h-4 w-4 ${isExporting ? "animate-bounce" : ""}`} />
          {isExporting ? "GENERATING HASH..." : "EXPORT AUDIT RECEIPT (.JSON)"}
        </>
      )}
    </button>
  );
}

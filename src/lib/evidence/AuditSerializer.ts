// lib/evidence/AuditSerializer.ts
// Transforms an Evidence Graph into an immutable Audit Document with
// SHA-256 cryptographic hash for tamper-proof reproducibility.
// Browser-compatible — uses Web Crypto API (no Node.js crypto dependency).

import type { EvidenceGraph } from "./EISv1Engine";

export interface AuditDocument {
  auditId: string;
  generatedAt: string;
  systemVersion: string;
  dataClassification: "SIMULATION_DATA" | "OPERATIONAL_DATA";
  evidenceGraph: EvidenceGraph;
  cryptographicHash: string;
}

export class AuditSerializer {
  /**
   * Generates a SHA-256 hash of the evidence graph payload.
   * Uses the browser's native Web Crypto API.
   */
  static async hashEvidence(graph: EvidenceGraph): Promise<string> {
    const payload = JSON.stringify(graph);
    const encoder = new TextEncoder();
    const data = encoder.encode(payload);
    const hashBuffer = await crypto.subtle.digest("SHA-256", data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");
  }

  /**
   * Transforms an Evidence Graph into an immutable Audit Document.
   * Returns a pretty-printed JSON string for the investigator to read.
   */
  static async generateAuditDocument(
    graph: EvidenceGraph,
    isSimulation: boolean = true
  ): Promise<string> {
    const timestamp = new Date().toISOString();
    const hash = await AuditSerializer.hashEvidence(graph);

    const auditDoc: AuditDocument = {
      auditId: `AUDIT-${hash.substring(0, 8).toUpperCase()}`,
      generatedAt: timestamp,
      systemVersion: "VVU-IVE-EIS-v1.0",
      dataClassification: isSimulation ? "SIMULATION_DATA" : "OPERATIONAL_DATA",
      evidenceGraph: graph,
      cryptographicHash: hash,
    };

    return JSON.stringify(auditDoc, null, 2);
  }
}

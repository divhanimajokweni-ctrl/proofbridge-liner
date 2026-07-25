import fs from "node:fs";
import path from "node:path";

export interface EvidenceEnvelope {
  artifact: string;
  version: string;
  status: "PASS" | "FAIL" | "INCOMPLETE" | "PENDING";
  generatedAt: string;
  generator: string;
  inputs: string[];
  checksum: string;
  payload: Record<string, any>;
}

export function readEnvelope(root: string, name: string): EvidenceEnvelope | null {
  try {
    const file = path.join(root, name);
    if (!fs.existsSync(file)) return null;
    return JSON.parse(fs.readFileSync(file, "utf8"));
  } catch {
    return null;
  }
}

export function envelopeStatus(envelope: EvidenceEnvelope | null): "PASS" | "FAIL" | "INCOMPLETE" | "PENDING" | null {
  if (!envelope) return null;
  return envelope.status;
}

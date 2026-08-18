"use client";

/**
 * DocCertificate — the corporate document certification seal + cross-reference table.
 *
 * Mirrors the deployed STUDI "Doc Certificate" page:
 *   - A seal panel showing issuer, status, hash
 *   - A cross-reference table of every governing document
 */

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { Fingerprint, ShieldCheck, Stamp } from "lucide-react";

interface GoverningDoc {
  id: string;
  name: string;
  abbr: string;
  version: string;
  checksum: string;
  status: "Draft" | "Certified" | "Pending" | "Superseded";
  certifiedAt: string | null;
}

const DOCUMENTS: GoverningDoc[] = [
  {
    id: "DOC-MOI",
    name: "Memorandum of Incorporation",
    abbr: "MOI",
    version: "v0.3-draft",
    checksum: "0x7af2…b913",
    status: "Draft",
    certifiedAt: null,
  },
  {
    id: "DOC-SHA",
    name: "Shareholders Agreement",
    abbr: "SHA",
    version: "v0.2-draft",
    checksum: "0x4e21…9c40",
    status: "Draft",
    certifiedAt: null,
  },
  {
    id: "DOC-CHT",
    name: "Founding Charter",
    abbr: "CHT",
    version: "v1.0",
    checksum: "0xab12…cd34",
    status: "Certified",
    certifiedAt: "2026-08-15",
  },
  {
    id: "DOC-TRD",
    name: "Trust Deed — Venture Vision Ubuntu Trust",
    abbr: "TRD",
    version: "v0.1-draft",
    checksum: "0xfe98…10aa",
    status: "Pending",
    certifiedAt: null,
  },
  {
    id: "DOC-DIR",
    name: "Director Registry & ID Pack",
    abbr: "DIR",
    version: "v1.0",
    checksum: "0x9911…2233",
    status: "Certified",
    certifiedAt: "2026-08-15",
  },
  {
    id: "DOC-BNK",
    name: "Bank Signatory Matrix — FNB Business",
    abbr: "BNK",
    version: "v0.1-draft",
    checksum: "0x44aa…77cc",
    status: "Draft",
    certifiedAt: null,
  },
  {
    id: "DOC-IP",
    name: "IP Assignment — EIS Theorems",
    abbr: "IP",
    version: "v0.1-draft",
    checksum: "0x0c11…beef",
    status: "Pending",
    certifiedAt: null,
  },
  {
    id: "DOC-OLD-MOI",
    name: "Pre-merger CoR14.1 (VVU Eng.)",
    abbr: "OLD",
    version: "v1.0",
    checksum: "0xdead…beef",
    status: "Superseded",
    certifiedAt: "2026-04-10",
  },
];

function statusBadge(status: GoverningDoc["status"]) {
  switch (status) {
    case "Certified":
      return <span className="text-emerald-400">Certified</span>;
    case "Draft":
      return <span className="text-amber-400">Draft</span>;
    case "Pending":
      return <span className="text-red-400">Pending</span>;
    case "Superseded":
      return <span className="text-muted-foreground line-through">Superseded</span>;
  }
}

export function DocCertificate() {
  const certified = DOCUMENTS.filter((d) => d.status === "Certified").length;
  const total = DOCUMENTS.length;
  const sealStatus = certified === total ? "CERTIFIED" : "DRAFT";

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold tracking-tight">Doc Certificate</h1>
        <p className="mt-1 text-xs text-muted-foreground">
          Master certification seal binding every governing document to its
          hash, version, and signature chain. Issued by the VVU STUDI
          Governance Engine.
        </p>
      </div>

      {/* Seal */}
      <Card
        className="border-vvu-studi/40 bg-gradient-to-br from-card via-card to-[color-mix(in_oklab,var(--vvu-studi)_10%,card)]"
      >
        <CardContent className="p-6">
          <div className="flex flex-col items-center gap-5 md:flex-row md:items-start md:gap-7">
            {/* Seal emblem */}
            <div className="relative flex h-32 w-32 shrink-0 items-center justify-center">
              <svg viewBox="0 0 120 120" className="h-32 w-32">
                <defs>
                  <linearGradient id="seal-grad" x1="0" y1="0" x2="120" y2="120">
                    <stop offset="0%" stopColor="var(--vvu-studi)" />
                    <stop offset="100%" stopColor="var(--vvu-gold)" />
                  </linearGradient>
                </defs>
                <circle
                  cx="60"
                  cy="60"
                  r="55"
                  stroke="url(#seal-grad)"
                  strokeWidth="2.5"
                  fill="none"
                />
                <circle
                  cx="60"
                  cy="60"
                  r="48"
                  stroke="url(#seal-grad)"
                  strokeWidth="1"
                  fill="none"
                  opacity="0.5"
                />
                {/* Tick marks around the seal */}
                {Array.from({ length: 24 }).map((_, i) => {
                  const angle = (i / 24) * Math.PI * 2;
                  const r1 = 51;
                  const r2 = 55;
                  const x1 = 60 + Math.cos(angle) * r1;
                  const y1 = 60 + Math.sin(angle) * r1;
                  const x2 = 60 + Math.cos(angle) * r2;
                  const y2 = 60 + Math.sin(angle) * r2;
                  return (
                    <line
                      key={i}
                      x1={x1}
                      y1={y1}
                      x2={x2}
                      y2={y2}
                      stroke="url(#seal-grad)"
                      strokeWidth="1"
                    />
                  );
                })}
                <ShieldCheck
                  x="36"
                  y="36"
                  width="48"
                  height="48"
                  style={{ color: "var(--vvu-gold)" }}
                />
              </svg>
              <span
                className="absolute -bottom-1 rounded px-1.5 py-0.5 font-mono text-[9px] font-bold uppercase tracking-wider"
                style={{
                  backgroundColor:
                    sealStatus === "CERTIFIED"
                      ? "var(--vvu-ive)"
                      : "oklch(0.7 0.18 65)",
                  color: "oklch(0.145 0 0)",
                }}
              >
                {sealStatus}
              </span>
            </div>

            {/* Seal metadata */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <Stamp className="h-4 w-4 text-vvu-studi" style={{ color: "var(--vvu-studi)" }} />
                <h2 className="text-lg font-bold tracking-tight">
                  Document Certification Seal
                </h2>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Venture Vision Ubuntu (PTY) LTD — CoR pending · Issued by the
                VVU STUDI Governance Engine
              </p>
              <dl className="mt-4 grid grid-cols-2 gap-x-6 gap-y-2 text-[11px] font-mono">
                <div>
                  <dt className="text-muted-foreground/70">Issuer</dt>
                  <dd className="text-foreground">VVU STUDI Governance Engine</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground/70">Status</dt>
                  <dd
                    className={cn(
                      sealStatus === "CERTIFIED"
                        ? "text-emerald-400"
                        : "text-amber-400"
                    )}
                  >
                    {sealStatus === "CERTIFIED"
                      ? "CERTIFIED — filed"
                      : "DRAFT — not yet filed with CIPC"}
                  </dd>
                </div>
                <div>
                  <dt className="text-muted-foreground/70">Bound documents</dt>
                  <dd className="text-foreground">{certified} / {total}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground/70">Seal ID</dt>
                  <dd className="text-foreground">SEAL-2026-08-18-001</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground/70">Seal root hash</dt>
                  <dd className="text-foreground truncate">
                    0x9c4f1a…77e2b0
                  </dd>
                </div>
                <div>
                  <dt className="text-muted-foreground/70">Previous seal</dt>
                  <dd className="text-muted-foreground">none (initial)</dd>
                </div>
              </dl>
              <div className="mt-3 flex items-center gap-1.5 rounded border border-vvu-studi/30 bg-card/60 px-2.5 py-1.5 text-[10px] font-mono">
                <Fingerprint className="h-3 w-3" style={{ color: "var(--vvu-studi)" }} />
                <span className="text-muted-foreground">
                  Merkle root over the document set — recomputed on every
                  status change. Any retroactive edit invalidates the seal.
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Cross-reference table */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold tracking-tight">
            Cross-Reference Table — All Governing Documents
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="pl-4 text-[10px] uppercase tracking-wider">
                  ID
                </TableHead>
                <TableHead className="text-[10px] uppercase tracking-wider">
                  Document
                </TableHead>
                <TableHead className="text-[10px] uppercase tracking-wider">
                  Abbr
                </TableHead>
                <TableHead className="text-[10px] uppercase tracking-wider">
                  Version
                </TableHead>
                <TableHead className="font-mono text-[10px] uppercase tracking-wider">
                  Checksum
                </TableHead>
                <TableHead className="text-[10px] uppercase tracking-wider">
                  Certified
                </TableHead>
                <TableHead className="pr-4 text-right text-[10px] uppercase tracking-wider">
                  Status
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {DOCUMENTS.map((d) => (
                <TableRow
                  key={d.id}
                  className="text-xs hover:bg-accent/40"
                >
                  <TableCell className="pl-4 font-mono text-[11px] text-muted-foreground">
                    {d.id}
                  </TableCell>
                  <TableCell className="font-medium">{d.name}</TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className="font-mono text-[10px]"
                    >
                      {d.abbr}
                    </Badge>
                  </TableCell>
                  <TableCell className="font-mono text-[11px] text-muted-foreground">
                    {d.version}
                  </TableCell>
                  <TableCell className="font-mono text-[11px] text-muted-foreground">
                    {d.checksum}
                  </TableCell>
                  <TableCell className="font-mono text-[11px] text-muted-foreground">
                    {d.certifiedAt ?? "—"}
                  </TableCell>
                  <TableCell className="pr-4 text-right font-mono text-[11px] font-bold">
                    {statusBadge(d.status)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

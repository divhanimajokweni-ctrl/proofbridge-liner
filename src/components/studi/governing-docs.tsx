"use client";

/**
 * GoverningDocs — simpler card-grid view of governing documents.
 * Used by the "Governing Docs" sidebar entry in STUDI.
 */

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FileText, History, Plus } from "lucide-react";

interface Doc {
  id: string;
  name: string;
  abbr: string;
  version: string;
  status: "Draft" | "Certified" | "Pending" | "Superseded";
  custodian: string;
  updated: string;
}

const DOCS: Doc[] = [
  {
    id: "DOC-MOI",
    name: "Memorandum of Incorporation",
    abbr: "MOI",
    version: "v0.3-draft",
    status: "Draft",
    custodian: "Founding directors",
    updated: "2026-08-17",
  },
  {
    id: "DOC-SHA",
    name: "Shareholders Agreement",
    abbr: "SHA",
    version: "v0.2-draft",
    status: "Draft",
    custodian: "Founding directors",
    updated: "2026-08-14",
  },
  {
    id: "DOC-CHT",
    name: "Founding Charter",
    abbr: "CHT",
    version: "v1.0",
    status: "Certified",
    custodian: "VVU STUDI Engine",
    updated: "2026-08-15",
  },
  {
    id: "DOC-TRD",
    name: "Trust Deed — VVU Trust",
    abbr: "TRD",
    version: "v0.1-draft",
    status: "Pending",
    custodian: "Trustees (TBD)",
    updated: "—",
  },
  {
    id: "DOC-DIR",
    name: "Director Registry",
    abbr: "DIR",
    version: "v1.0",
    status: "Certified",
    custodian: "VVU STUDI Engine",
    updated: "2026-08-15",
  },
  {
    id: "DOC-BNK",
    name: "Bank Signatory Matrix",
    abbr: "BNK",
    version: "v0.1-draft",
    status: "Draft",
    custodian: "CFO",
    updated: "2026-08-12",
  },
];

function tone(status: Doc["status"]) {
  switch (status) {
    case "Certified":
      return "border-emerald-500/30 bg-emerald-500/5 text-emerald-400";
    case "Draft":
      return "border-amber-500/30 bg-amber-500/5 text-amber-400";
    case "Pending":
      return "border-red-500/30 bg-red-500/5 text-red-400";
    case "Superseded":
      return "border-muted/30 bg-muted/5 text-muted-foreground line-through";
  }
}

export function GoverningDocs() {
  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight">Governing Documents</h1>
          <p className="mt-1 text-xs text-muted-foreground">
            The canonical document set bound into the STUDI certification seal.
          </p>
        </div>
        <button className="inline-flex items-center gap-1 rounded-md border border-border bg-card px-2.5 py-1.5 text-xs hover:bg-accent/40">
          <Plus className="h-3.5 w-3.5" />
          New document
        </button>
      </div>

      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
        {DOCS.map((d) => (
          <Card key={d.id} className="border-border/70">
            <CardHeader className="pb-2">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-muted-foreground" />
                  <CardTitle className="text-sm font-semibold leading-tight">
                    {d.name}
                  </CardTitle>
                </div>
                <Badge
                  variant="outline"
                  className="font-mono text-[9px] uppercase"
                >
                  {d.abbr}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-2 pt-0">
              <div className="flex items-center justify-between text-[11px] font-mono">
                <span className="text-muted-foreground">{d.version}</span>
                <span className={`rounded border px-1.5 py-0.5 font-bold uppercase ${tone(d.status)}`}>
                  {d.status}
                </span>
              </div>
              <div className="text-[11px] text-muted-foreground">
                Custodian: <span className="text-foreground">{d.custodian}</span>
              </div>
              <div className="flex items-center gap-1.5 text-[10px] font-mono text-muted-foreground/70">
                <History className="h-3 w-3" />
                Last update: {d.updated}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

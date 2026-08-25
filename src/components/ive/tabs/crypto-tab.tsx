"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Lock,
  FileArchive,
  KeyRound,
  ShieldCheck,
  Scroll,
  FileText,
  Boxes,
  Building2,
  Scale,
  Landmark,
  Gavel,
  CheckCircle2,
  Clock,
  Loader2,
  XCircle,
} from "lucide-react";
import { CRYPTO_STAGES, GOVERNANCE_ARTIFACTS } from "@/lib/ive/data";

const REGULATOR_ICONS = {
  SOC2: ShieldCheck,
  "FIC/FICA": Landmark,
  HPCSA: Building2,
  SAICA: Scale,
  NSC: Gavel,
  Constitution: Scroll,
};

const ARTIFACT_ICONS = {
  "Decision Essay": FileText,
  "Compliance Export": FileArchive,
  "Minted Audit": ShieldCheck,
  "OmniClass Map": Boxes,
};

const STATUS_TONES = {
  minted: "ive-text-emerald",
  attested: "ive-text-gold",
  draft: "text-muted-foreground",
  expired: "ive-text-rose",
};

const STATUS_ICONS = {
  complete: CheckCircle2,
  running: Loader2,
  queued: Clock,
  failed: XCircle,
};

export function CryptoTab() {
  return (
    <div className="space-y-6">
      {/* zipenc pipeline */}
      <Card className="ive-glass-gold">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 font-mono text-sm uppercase tracking-widest">
            <Lock className="h-4 w-4 ive-text-gold" />
            zipenc Folder Specification
          </CardTitle>
          <CardDescription className="text-xs">
            Entire folder trees encrypted in three stages: compress → derive
            Fernet key → AES-256 encrypt into a single .enc payload.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 md:grid-cols-3">
            {CRYPTO_STAGES.map((s, i) => {
              const Icon = STATUS_ICONS[s.status];
              const tone =
                s.status === "complete"
                  ? "ive-text-emerald"
                  : s.status === "running"
                  ? "ive-text-gold"
                  : s.status === "failed"
                  ? "ive-text-rose"
                  : "text-muted-foreground";
              return (
                <div
                  key={s.id}
                  className={`relative rounded-lg border p-4 ${
                    s.status === "running"
                      ? "border-[oklch(0.82_0.16_75/50%)] bg-primary/10 ive-glow-gold"
                      : "border-border/40 bg-secondary/30"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                      Stage {i + 1} / 3
                    </span>
                    <Icon
                      className={`h-4 w-4 ${tone} ${
                        s.status === "running" ? "animate-spin" : ""
                      }`}
                    />
                  </div>
                  <div className="mt-2 font-mono text-sm font-bold">
                    {s.name.split(" · ")[1]}
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {s.description}
                  </p>
                  <div className="mt-3 flex items-center justify-between font-mono text-[10px] uppercase tracking-widest">
                    <span className={tone}>{s.cipher}</span>
                    <span className="text-muted-foreground">
                      {s.durationMs > 0 ? `${s.durationMs}ms` : "—"}
                    </span>
                  </div>
                  {s.status === "running" && (
                    <div className="mt-2">
                      <Progress value={62} className="h-1.5" />
                    </div>
                  )}
                  {i < 2 && (
                    <div className="absolute -right-3 top-1/2 hidden -translate-y-1/2 text-muted-foreground md:block">
                      →
                    </div>
                  )}
                </div>
              );
            })}
          </div>
          <div className="mt-4 flex flex-wrap items-center gap-3 rounded-md border border-border/40 bg-black/30 p-3">
            <FileArchive className="h-4 w-4 ive-text-gold" />
            <span className="font-mono text-xs text-muted-foreground">
              vault · /ive/vault/
            </span>
            <code className="font-mono text-xs ive-text-emerald">
              structure_audit_2025-04-18.enc
            </code>
            <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
              AES-256-CBC · 4.2 MB · 1,204 nodes
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Agnostic CAD shifting */}
      <Card className="ive-glass">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 font-mono text-sm uppercase tracking-widest">
            <Boxes className="h-4 w-4 ive-text-emerald" />
            Agnostic CAD Shifting
          </CardTitle>
          <CardDescription className="text-xs">
            Resolves the &quot;one-size-fits-all&quot; bottleneck. Static
            cloud-native tools suffer latency in complex simulations — IVE
            supports unified BIM environments and fluid conceptual tools.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 md:grid-cols-2">
            <div className="rounded-lg border border-border/40 bg-secondary/30 p-4">
              <div className="flex items-center gap-2">
                <Building2 className="h-4 w-4 ive-text-gold" />
                <span className="font-mono text-sm font-medium">
                  Unified · Revit BIM
                </span>
              </div>
              <p className="mt-2 text-xs text-muted-foreground">
                Coordinated deliverables between mechanical consultants and
                architectural stakeholders. Used for production BIM authoring
                and discipline coordination.
              </p>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {["Structural", "MEP", "Architectural", "Civil"].map((t) => (
                  <Badge
                    key={t}
                    variant="outline"
                    className="font-mono text-[10px] uppercase tracking-widest"
                  >
                    {t}
                  </Badge>
                ))}
              </div>
            </div>
            <div className="rounded-lg border border-border/40 bg-secondary/30 p-4">
              <div className="flex items-center gap-2">
                <Boxes className="h-4 w-4 ive-text-emerald" />
                <span className="font-mono text-sm font-medium">
                  Fluid · Autodesk Forma
                </span>
              </div>
              <p className="mt-2 text-xs text-muted-foreground">
                Conceptual massing, wind/pollution analysis, and early-stage
                solar studies. Output handoff into Revit for detail
                development.
              </p>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {["Massing", "Insolation", "Wind", "Density"].map((t) => (
                  <Badge
                    key={t}
                    variant="outline"
                    className="font-mono text-[10px] uppercase tracking-widest"
                  >
                    {t}
                  </Badge>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Governance artifacts */}
      <Card className="ive-glass">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 font-mono text-sm uppercase tracking-widest">
            <Scroll className="h-4 w-4 ive-text-gold" />
            Minted Governance Artifacts
          </CardTitle>
          <CardDescription className="text-xs">
            Facilitator agent extracts binding decisions and mints signed
            compliance exports to 6 regulators. Post-construction models move
            to the Common Data Environment (CDE) for full lifecycle
            governance.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="ive-scrollbar max-h-[420px] overflow-y-auto pr-1">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-border/50 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                  <th className="py-2 pr-3">ID</th>
                  <th className="py-2 pr-3">Title</th>
                  <th className="py-2 pr-3">Type</th>
                  <th className="py-2 pr-3">Regulator</th>
                  <th className="py-2 pr-3">Status</th>
                  <th className="py-2 pr-3">Hash</th>
                  <th className="py-2 pr-3">TS</th>
                </tr>
              </thead>
              <tbody className="font-mono text-xs">
                {GOVERNANCE_ARTIFACTS.map((a) => {
                  const RegIcon =
                    REGULATOR_ICONS[a.regulator] ?? ShieldCheck;
                  const ArtIcon =
                    ARTIFACT_ICONS[a.type] ?? FileText;
                  const tone = STATUS_TONES[a.status];
                  return (
                    <tr
                      key={a.id}
                      className="border-b border-border/30 hover:bg-secondary/40"
                    >
                      <td className="py-2 pr-3 ive-text-gold">{a.id}</td>
                      <td className="py-2 pr-3">
                        <div className="flex items-center gap-2">
                          <ArtIcon className="h-3 w-3 text-muted-foreground" />
                          <span className="text-foreground">{a.title}</span>
                        </div>
                      </td>
                      <td className="py-2 pr-3 text-muted-foreground">
                        {a.type}
                      </td>
                      <td className="py-2 pr-3">
                        <div className="flex items-center gap-1.5">
                          <RegIcon className="h-3 w-3 ive-text-gold" />
                          <span className="text-foreground">{a.regulator}</span>
                        </div>
                      </td>
                      <td className={`py-2 pr-3 ${tone}`}>
                        {a.status}
                      </td>
                      <td className="py-2 pr-3 ive-text-emerald">{a.hash}</td>
                      <td className="py-2 pr-3 text-muted-foreground">
                        {new Date(a.ts).toLocaleString("en-GB", {
                          hour: "2-digit",
                          minute: "2-digit",
                          day: "2-digit",
                          month: "short",
                        })}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* CDE lifecycle */}
      <Card className="ive-glass">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 font-mono text-sm uppercase tracking-widest">
            <KeyRound className="h-4 w-4 ive-text-emerald" />
            Common Data Environment · Lifecycle
          </CardTitle>
          <CardDescription className="text-xs">
            Detailed post-construction models migrate to the CDE for full
            lifecycle governance — interpretability &amp; traceability of all
            model evaluations.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 md:grid-cols-4">
            {[
              { phase: "Concept", state: "complete", accent: "emerald" },
              { phase: "Design Development", state: "complete", accent: "emerald" },
              { phase: "Construction", state: "in_progress", accent: "gold" },
              { phase: "CDE Handover", state: "pending", accent: "muted" },
            ].map((p, i) => {
              const tone =
                p.accent === "emerald"
                  ? "ive-text-emerald"
                  : p.accent === "gold"
                  ? "ive-text-gold"
                  : "text-muted-foreground";
              return (
                <div key={p.phase} className="relative">
                  <div className="rounded-lg border border-border/40 bg-secondary/30 p-3 text-center">
                    <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                      Phase {i + 1}
                    </div>
                    <div className={`mt-1 font-mono text-sm font-bold ${tone}`}>
                      {p.phase}
                    </div>
                    <div className={`mt-1 font-mono text-[10px] uppercase tracking-widest ${tone}`}>
                      {p.state.replace("_", " ")}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

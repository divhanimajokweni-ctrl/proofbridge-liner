"use client";

/**
 * StudiOverview — VVU STUDI landing page.
 *
 * STUDI is the governance / academic-instruction face of VVU.
 * Hero + mission + 4 trust dimensions + governance workflow.
 *
 * The hero card embeds <EvolutionMatrix mode="hero"> as a transparent
 * backdrop — the Fibonacci point cloud morphs between the global-sphere
 * and Antone-the-ant stages, echoing STUDI's "every node equal under
 * governance" framing. The text sits on top with a backdrop blur so it
 * stays readable regardless of which frame the morph is in.
 */

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EvolutionMatrix } from "@/components/vvu/evolution-matrix";
import { StudiGateEditor } from "@/components/studi/studi-gate-editor";
import {
  Building2,
  FileCheck2,
  Gavel,
  GraduationCap,
  ScrollText,
  ShieldCheck,
} from "lucide-react";

export function StudiOverview() {
  return (
    <div className="space-y-5">
      {/* Hero — with Fibonacci evolution matrix as backdrop */}
      <Card className="relative overflow-hidden border-vvu-studi/30 bg-gradient-to-br from-card via-card to-[color-mix(in_oklab,var(--vvu-studi)_8%,card)]">
        {/* 3D point-cloud backdrop — DATA-DRIVEN by theorem-state store.
            STUDI gates blocked ⇒ sphere held (warning); gates met ⇒ antone. */}
        <EvolutionMatrix mode="hero" dataDriven stageRange={[0, 1]} />
        {/* Dark scrim so the foreground text stays legible */}
        <div
          className="pointer-events-none absolute inset-0 z-[1]"
          style={{
            background:
              "linear-gradient(90deg, rgba(15,15,20,0.85) 0%, rgba(15,15,20,0.55) 50%, rgba(15,15,20,0.15) 100%)",
          }}
        />
        <CardContent className="relative z-[2] p-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div className="max-w-2xl">
              <Badge
                className="mb-3 font-mono uppercase tracking-wider"
                variant="outline"
              >
                <GraduationCap className="mr-1 h-3 w-3" />
                VVU · STUDI
              </Badge>
              <h1 className="text-2xl font-bold leading-tight tracking-tight md:text-3xl">
                Govern the institution that governs the engineering.
              </h1>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                VVU STUDI is the corporate-governance and academic-instruction
                workspace. It binds every engineering claim made in IVE back to
                a governing document, a charter clause, and a board resolution —
                so that release decisions are not only technically correct but
                <span className="text-foreground"> legally defensible</span>.
                The same Evidence Independence Specification that powers IVE
                runs underneath STUDI; the bound is just a different shape:
                &ldquo;Claim ≤ Document ≤ Resolution ≤ Filing ≤ Compliance&rdquo;.
              </p>
            </div>
            <div className="flex flex-col gap-2 md:w-64">
              <div className="rounded-md border border-vvu-studi/30 bg-card/70 p-3 backdrop-blur-sm">
                <div className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
                  STUDI status
                </div>
                <div className="mt-1 flex items-baseline gap-2">
                  <span
                    className="text-xs font-bold uppercase tracking-wider"
                    style={{ color: "var(--vvu-studi)" }}
                  >
                    MO-GO
                  </span>
                  <span className="text-[10px] text-muted-foreground">
                    · freeze defined
                  </span>
                </div>
              </div>
              <div className="rounded-md border border-border bg-card/70 p-3 text-[11px] font-mono backdrop-blur-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Charter</span>
                  <span className="text-amber-400">DRAFT</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">MOI</span>
                  <span className="text-amber-400">DRAFT</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">SHA</span>
                  <span className="text-red-400">PENDING</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">CIPC</span>
                  <span className="text-muted-foreground">NOT FILED</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* One-click fail-closed valve demo. Flip gates below; the hero
          matrix above morphs from sphere → antone when all gates hit
          GO/FILED/RESOLVED. */}
      <StudiGateEditor />

      {/* Trust dimensions */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {[
          {
            icon: Gavel,
            label: "Legal",
            desc: "Charter, MOI, SHA reviewed & resolved",
            state: "0 / 3",
            tone: "amber",
          },
          {
            icon: FileCheck2,
            label: "Compliance",
            desc: "CIPC filing, SARS tax clearance, BBBEE",
            state: "0 / 5",
            tone: "red",
          },
          {
            icon: ScrollText,
            label: "Provenance",
            desc: "Document hash chain + signature ledger",
            state: "0 / 1",
            tone: "amber",
          },
          {
            icon: Building2,
            label: "Corporate",
            desc: "Director registry + share register + bank",
            state: "0 / 4",
            tone: "red",
          },
        ].map((dim) => {
          const Icon = dim.icon;
          const tone =
            dim.tone === "amber"
              ? "text-amber-400"
              : dim.tone === "red"
                ? "text-red-400"
                : "text-emerald-400";
          return (
            <Card key={dim.label} className="border-border/70">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2 text-sm font-semibold">
                    <Icon className="h-4 w-4 text-muted-foreground" />
                    {dim.label}
                  </CardTitle>
                  <span className={`font-mono text-xs font-bold ${tone}`}>
                    {dim.state}
                  </span>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <p className="text-[11px] leading-relaxed text-muted-foreground">
                  {dim.desc}
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Workflow strip */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold tracking-tight">
            Corporate governance workflow
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap items-center gap-2 text-[10px] font-mono">
            {[
              "Charter Draft",
              "Director Resolution",
              "MOI Filed (CIPC)",
              "Shareholders Agreement",
              "Trust Deed",
              "Bank Signatory Update",
              "Compliance Pack",
              "Annual Filing",
            ].map((step, i, arr) => (
              <div key={step} className="flex items-center gap-2">
                <div className="rounded-md border border-border bg-card/60 px-2 py-1.5 text-foreground">
                  <span className="text-muted-foreground/70">
                    {String(i + 1).padStart(2, "0")}
                  </span>{" "}
                  {step}
                </div>
                {i < arr.length - 1 && (
                  <span className="text-muted-foreground/40">→</span>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Fail-closed banner */}
      <Card className="border-vvu-studi/40">
        <CardContent className="flex items-start gap-3 p-4">
          <ShieldCheck className="h-5 w-5 text-vvu-studi shrink-0 mt-0.5" style={{ color: "var(--vvu-studi)" }} />
          <div className="text-xs leading-relaxed">
            <strong className="text-foreground">
              STUDI is fail-closed by EIS Theorem 5.
            </strong>{" "}
            Until every required governing document is <em>resolved</em> (not
            just present) and cross-referenced into the document certification
            seal, the engineering release in IVE stays{" "}
            <span className="text-red-400 font-mono">BLOCKED</span>. The two
            workspaces are not decorative — they are the two halves of a single
            fail-closed valve.
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

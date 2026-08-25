"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { LayoutGrid, ShieldCheck, Scroll, Cpu } from "lucide-react";
import { IveCanvas } from "../ive-canvas";

/**
 * Self-Service Canvas tab — IVE v2.1 market monitor.
 *
 * A plugin-based dashboard grid that demonstrates the IVE governance model
 * in operational form:
 *   - Bridge state machine (PROPOSED → SUPPORTED → ACCEPTED → COMMITTED)
 *     gated by a circuit breaker with audited ledger entries.
 *   - Watchdog widget (integrity checks).
 *   - Ledger widget (recent audit entries).
 *   - Custom plugins via in-browser code editor (P0/P1 hardened).
 *
 * Ported from the vanilla-JS IVE Canvas v2.1 HTML to React, with all
 * P0/P1 bug fixes from the technical review preserved.
 */
export function CanvasTab() {
  return (
    <div className="space-y-4">
      <Card className="ive-glass-gold">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 font-mono text-sm uppercase tracking-widest">
            <LayoutGrid className="h-4 w-4 ive-text-gold" />
            IVE Self-Service Canvas · v2.1
          </CardTitle>
          <CardDescription className="text-xs">
            Operational dashboard for the IVE governance bridge. Plugins
            compose the live canvas; every bridge transition is gated by the
            circuit breaker and logged to the audit ledger. All P0/P1 bugs
            from the technical review fixed.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-3">
            {[
              {
                icon: ShieldCheck,
                title: "Circuit Breaker",
                body: "Bridge transitions blocked unless support score ≥ 60%.",
                tone: "ive-text-emerald",
              },
              {
                icon: Scroll,
                title: "Audit Ledger",
                body: "Every attempt (pass, block, rejected, success) recorded.",
                tone: "ive-text-gold",
              },
              {
                icon: Cpu,
                title: "Plugin Sandbox",
                body: "Custom render functions compiled with try/catch guards.",
                tone: "ive-text-jade",
              },
            ].map((c) => {
              const Icon = c.icon;
              return (
                <div
                  key={c.title}
                  className="rounded-lg border border-border/40 bg-secondary/30 p-3"
                >
                  <div className="flex items-center gap-2">
                    <Icon className={`h-4 w-4 ${c.tone}`} />
                    <h3 className="font-mono text-[11px] uppercase tracking-widest">
                      {c.title}
                    </h3>
                  </div>
                  <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                    {c.body}
                  </p>
                </div>
              );
            })}
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            <Badge variant="outline" className="border-[oklch(0.82_0.16_75/40%)] ive-text-gold">
              8 default plugins
            </Badge>
            <Badge variant="outline" className="border-[oklch(0.72_0.17_162/40%)] ive-text-emerald">
              P0/P1 hardened
            </Badge>
            <Badge variant="outline" className="border-border">
              Ctrl+K · new plugin
            </Badge>
            <Badge variant="outline" className="border-border">
              Persisted to localStorage
            </Badge>
          </div>
        </CardContent>
      </Card>

      <IveCanvas />
    </div>
  );
}

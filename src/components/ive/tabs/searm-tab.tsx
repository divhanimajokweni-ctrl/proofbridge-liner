"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ShieldAlert, FileText, GraduationCap, Lock } from "lucide-react";

export function SearmTab() {
  return (
    <div className="space-y-4">
      <Card className="ive-glass-gold">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 font-mono text-sm uppercase tracking-widest">
            <ShieldAlert className="h-4 w-4 ive-text-gold" />
            VVU SEARM · Claim Builder + Teaching
          </CardTitle>
          <CardDescription className="text-xs">
            SEARM (enterprise-architecture risk-management) surface — claim
            construction + teaching interface. Orbitron display, Share Tech Mono
            body, 3-pane grid, idle screensaver. Served from{" "}
            <code className="font-mono">/vvu-searm.html</code>.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-3">
            {[
              { icon: FileText, title: "Claim Builder", body: "Constructs structured risk/governance claims with templated fields.", tone: "ive-text-gold" },
              { icon: GraduationCap, title: "Teaching Mode", body: "Walks the user through SEARM methodology step-by-step.", tone: "ive-text-emerald" },
              { icon: Lock, title: "Screensaver Lock", body: "Idle-triggered canvas screensaver — re-engage with any input.", tone: "ive-text-jade" },
            ].map((c) => {
              const Icon = c.icon;
              return (
                <div key={c.title} className="rounded-lg border border-border/40 bg-secondary/30 p-3">
                  <div className="flex items-center gap-2">
                    <Icon className={`h-4 w-4 ${c.tone}`} />
                    <h3 className="font-mono text-[11px] uppercase tracking-widest">{c.title}</h3>
                  </div>
                  <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{c.body}</p>
                </div>
              );
            })}
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            <Badge variant="outline" className="border-[oklch(0.82_0.16_75/40%)] ive-text-gold">3-pane grid</Badge>
            <Badge variant="outline" className="border-border">iframe-isolated</Badge>
            <Badge variant="outline" className="border-border">Orbitron + Share Tech Mono</Badge>
          </div>
        </CardContent>
      </Card>
      <div className="overflow-hidden rounded-lg border border-border/60 ive-glass">
        <iframe
          src="/vvu-searm.html"
          title="VVU SEARM — Claim Builder + Teaching"
          className="h-[760px] w-full"
          loading="lazy"
          sandbox="allow-scripts allow-same-origin"
        />
      </div>
    </div>
  );
}

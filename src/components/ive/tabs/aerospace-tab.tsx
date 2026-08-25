"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plane, Compass, Activity, Radar } from "lucide-react";

export function AerospaceTab() {
  return (
    <div className="space-y-4">
      <Card className="ive-glass-gold">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 font-mono text-sm uppercase tracking-widest">
            <Plane className="h-4 w-4 ive-text-gold" />
            VVU Aerospace · Central Access Node
          </CardTitle>
          <CardDescription className="text-xs">
            Aerospace operations surface — 3-ring SPA (E-Study · VVU Workspace · Playground).
            True WebGL 3D kinematics via three.js, KCL parametric extraction, DRC validation,
            ASCII-art telemetry. Served from <code className="font-mono">/vvu-aerospace.html</code>.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-3">
            {[
              { icon: Compass, title: "Ring 1 · E-Study", body: "Interactive residual-depth explainer with manual stepping + UCO transfer.", tone: "ive-text-gold" },
              { icon: Activity, title: "Ring 2 · Workspace", body: "Schematic ingestion, Lindiwe AI terminal, DRC 11-body validation matrix.", tone: "ive-text-emerald" },
              { icon: Radar, title: "Ring 3 · Playground", body: "True WebGL 3D — 4-body assembly with explode/yaw/pitch/zoom controls.", tone: "ive-text-jade" },
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
            <Badge variant="outline" className="border-[oklch(0.82_0.16_75/40%)] ive-text-gold">WebGL 3D · three.js r128</Badge>
            <Badge variant="outline" className="border-border">iframe-isolated</Badge>
            <Badge variant="outline" className="border-border">3-ring SPA</Badge>
          </div>
        </CardContent>
      </Card>
      <div className="overflow-hidden rounded-lg border border-border/60 ive-glass">
        <iframe
          src="/vvu-aerospace.html"
          title="VVU Aerospace — Central Access Node"
          className="h-[760px] w-full"
          loading="lazy"
          sandbox="allow-scripts allow-same-origin"
        />
      </div>
    </div>
  );
}

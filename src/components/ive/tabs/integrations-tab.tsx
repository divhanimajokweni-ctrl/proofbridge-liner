"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Users, Network, Plug, MessageCircle, Mail, Briefcase, GitBranch, GraduationCap } from "lucide-react";
import { INTEGRATIONS } from "@/lib/ive/architecture";

const TYPE_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  social: MessageCircle,
  email: Mail,
  workspace: Briefcase,
  "version-control": GitBranch,
  academic: GraduationCap,
};

export function IntegrationsTab() {
  const connected = INTEGRATIONS.filter((i) => i.status === "connected");
  const pending = INTEGRATIONS.filter((i) => i.status === "pending");
  const disconnected = INTEGRATIONS.filter((i) => i.status === "disconnected");

  return (
    <div className="space-y-4">
      <Card className="ive-glass-gold">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 font-mono text-sm uppercase tracking-widest">
            <Users className="h-4 w-4 ive-text-gold" />
            Integrations & Organizations
          </CardTitle>
          <CardDescription className="text-xs">
            Connection graph showing the live status of Discord, Outlook,
            Gmail Workspace, Microsoft Teams, GitHub, and academic attestations
            (Wits, ECSA, SAICA, CIPC, IEEE).
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-lg border border-[oklch(0.72_0.17_162/40%)] bg-primary/5 p-3 text-center">
              <div className="font-mono text-2xl font-bold ive-text-emerald">{connected.length}</div>
              <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Connected</div>
            </div>
            <div className="rounded-lg border border-[oklch(0.82_0.16_75/40%)] bg-secondary/30 p-3 text-center">
              <div className="font-mono text-2xl font-bold ive-text-gold">{pending.length}</div>
              <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Pending</div>
            </div>
            <div className="rounded-lg border border-border/40 bg-secondary/20 p-3 text-center">
              <div className="font-mono text-2xl font-bold text-muted-foreground">{disconnected.length}</div>
              <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Disconnected</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Connection Graph */}
      <Card className="ive-glass">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 font-mono text-sm uppercase tracking-widest">
            <Network className="h-4 w-4 ive-text-emerald" />
            Connection Graph · Visual Integration Layer
          </CardTitle>
          <CardDescription className="text-xs">
            Toggle graph view showing the interconnected nodes and workflows
            of each integration tool.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            {INTEGRATIONS.map((int) => {
              const Icon = TYPE_ICONS[int.type] ?? Plug;
              return (
                <div
                  key={int.id}
                  className={`rounded-lg border p-3 transition-all ${
                    int.status === "connected"
                      ? "border-[oklch(0.72_0.17_162/40%)] bg-primary/5"
                      : int.status === "pending"
                      ? "border-[oklch(0.82_0.16_75/40%)] bg-secondary/30"
                      : "border-border/40 bg-secondary/20"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <Icon className={`h-5 w-5 ${
                      int.status === "connected" ? "ive-text-emerald" :
                      int.status === "pending" ? "ive-text-gold" : "text-muted-foreground"
                    }`} />
                    <div className="flex items-center gap-1">
                      {int.status === "connected" && <span className="h-2 w-2 rounded-full bg-emerald-500" />}
                      {int.status === "pending" && <span className="h-2 w-2 rounded-full bg-amber-500" />}
                      {int.status === "disconnected" && <span className="h-2 w-2 rounded-full bg-muted-foreground/40" />}
                    </div>
                  </div>
                  <div className="mt-2 font-mono text-xs font-semibold">{int.name}</div>
                  <div className="mt-0.5 font-mono text-[10px] text-muted-foreground">
                    {int.status === "connected" && int.account}
                    {int.status === "disconnected" && "Click to connect"}
                    {int.status === "pending" && "Awaiting verification"}
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="mt-2 w-full font-mono text-[9px] uppercase tracking-widest"
                  >
                    {int.status === "connected" ? "Manage" : int.status === "pending" ? "Verify" : "Connect"}
                  </Button>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Organization groups */}
      <Card className="ive-glass">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 font-mono text-sm uppercase tracking-widest">
            <Briefcase className="h-4 w-4 ive-text-gold" />
            Organization Groups
          </CardTitle>
          <CardDescription className="text-xs">
            Discord servers, Outlook organizations, Gmail workspace, Teams
            accounts — synced via the Master Graph.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { name: "VVU Community", type: "Discord Server", count: 247 },
              { name: "Engineering Team", type: "Teams", count: 12 },
              { name: "DWS Pipeline", type: "Outlook Org", count: 5 },
              { name: "Founding 100", type: "Discord Server", count: 89 },
            ].map((g) => (
              <div key={g.name} className="rounded-lg border border-border/40 bg-secondary/30 p-3">
                <div className="font-mono text-xs font-semibold">{g.name}</div>
                <div className="font-mono text-[10px] text-muted-foreground">{g.type}</div>
                <div className="mt-1 flex items-center gap-1">
                  <Users className="h-3 w-3 text-muted-foreground" />
                  <span className="font-mono text-[10px] text-muted-foreground">{g.count} members</span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

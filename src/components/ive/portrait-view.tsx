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
import { Progress } from "@/components/ui/progress";
import {
  User,
  Wallet,
  Users,
  FolderGit2,
  Network,
  Settings,
  Key,
  Receipt,
  Rocket,
  Plus,
  TrendingUp,
  Calendar,
  Target,
} from "lucide-react";
import {
  MASTER_GRAPH_NODES,
  UBUNTU_POOLS,
  INTEGRATIONS,
  PRICING_TIERS,
  type UserRole,
} from "@/lib/ive/architecture";

/**
 * Portrait View — the "Home Base" per the VRES / VRES1 / NMU architectural
 * specification. This is where all users land. It is the "Memory" of the
 * system — showing the Master Graph (User → Orgs → Projects → Wallet →
 * Pools), user metrics, wallet balance, and integration status.
 *
 * The [Enter Studio] button transitions to the Landscape View.
 */
export function PortraitView({
  role,
  onEnterStudio,
  onUpgrade,
}: {
  role: UserRole;
  onEnterStudio: () => void;
  onUpgrade: () => void;
}) {
  const connectedIntegrations = INTEGRATIONS.filter((i) => i.status === "connected");
  const tier = PRICING_TIERS.find((t) => t.id === role) ?? PRICING_TIERS[0];
  const isGuest = role === "guest";
  const maturityScore = isGuest ? 53 : 80;

  return (
    <div className="space-y-4">
      {/* Hero / Howzit banner */}
      <Card className="relative overflow-hidden border-border/60 ive-glass-gold">
        <div className="relative grid gap-4 p-6 md:grid-cols-[1.5fr_1fr] md:p-8">
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <span className="text-2xl">🇿🇦</span>
              <Badge variant="outline" className="border-[oklch(0.82_0.16_75/40%)] ive-text-gold">
                Portrait · Home Base
              </Badge>
              {!isGuest && (
                <Badge variant="outline" className="border-[oklch(0.72_0.17_162/40%)] ive-text-emerald">
                  {tier.name} · {tier.priceZAR}
                </Badge>
              )}
            </div>
            <h2 className="font-mono text-2xl font-semibold leading-tight md:text-3xl">
              Howzit! This is your{" "}
              <span className="ive-text-gold">Home Base</span>.
            </h2>
            <p className="max-w-2xl text-sm text-muted-foreground">
              All your settings, wallet, and saved projects live here. The
              Master Graph below connects you to your organizations, projects,
              ANTPAY wallet, and Ubuntu Pools. Click{" "}
              <span className="ive-text-gold">Enter Studio</span> to start
              building right now.
            </p>
            <div className="flex flex-wrap gap-2 pt-2">
              <Button
                onClick={onEnterStudio}
                className="gap-2 font-mono text-xs uppercase tracking-widest"
              >
                <Rocket className="h-4 w-4" />
                Enter Studio
              </Button>
              {isGuest && (
                <Button
                  variant="outline"
                  onClick={onUpgrade}
                  className="gap-2 font-mono text-xs uppercase tracking-widest"
                >
                  <Wallet className="h-4 w-4" />
                  Upgrade
                </Button>
              )}
            </div>
          </div>

          {/* Maturity + AIR indicators */}
          <div className="flex flex-col justify-center gap-3">
            <div className="rounded-lg border border-border/40 bg-secondary/30 p-3">
              <div className="mb-1 flex items-center justify-between">
                <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                  Maturity
                </span>
                <span className="font-mono text-lg font-bold ive-text-gold">
                  {maturityScore}%
                </span>
              </div>
              <Progress value={maturityScore} className="h-1.5" />
            </div>
            <div className="rounded-lg border border-border/40 bg-secondary/30 p-3">
              <div className="flex items-center justify-between">
                <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                  AIR Runtime
                </span>
                <div className="flex items-center gap-2">
                  <span className="relative flex h-2 w-2">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" />
                    <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
                  </span>
                  <span className="font-mono text-xs font-semibold ive-text-emerald">
                    LIVE
                  </span>
                </div>
              </div>
            </div>
            <div className="rounded-lg border border-border/40 bg-secondary/30 p-3">
              <div className="flex items-center justify-between">
                <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                  ANTPAY Wallet
                </span>
                <span className="font-mono text-lg font-bold ive-text-gold">
                  R {isGuest ? "0" : "4,500"}
                </span>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Master Graph */}
      <Card className="ive-glass">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 font-mono text-sm uppercase tracking-widest">
              <Network className="h-4 w-4 ive-text-gold" />
              Master Graph · Visual Integration Layer
            </CardTitle>
            <Badge variant="outline" className="font-mono text-[10px] uppercase tracking-widest">
              {isGuest ? "1 node · disconnected" : `${MASTER_GRAPH_NODES.length} nodes · connected`}
            </Badge>
          </div>
          <CardDescription className="text-xs">
            Central graph connecting the User node to Organizations, Projects,
            ANTPAY Wallet, and Ubuntu Pools. Click a node to open that module.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <MasterGraphSVG isGuest={isGuest} />
        </CardContent>
      </Card>

      {/* Widgets grid — User Metrics, Goals, Calendars, API Keys, Receipts */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card className="ive-glass">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 font-mono text-xs uppercase tracking-widest">
              <Target className="h-3.5 w-3.5 ive-text-gold" />
              User Metrics
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-xs">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Projects</span>
              <span className="font-mono font-semibold">{isGuest ? "0" : "3"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Documents</span>
              <span className="font-mono font-semibold">{isGuest ? "0" : "12"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Quality Gates</span>
              <span className="font-mono font-semibold">{isGuest ? "0/19" : "7/19"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Brier Score</span>
              <span className="font-mono font-semibold ive-text-emerald">0.018</span>
            </div>
          </CardContent>
        </Card>

        <Card className="ive-glass">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 font-mono text-xs uppercase tracking-widest">
              <TrendingUp className="h-3.5 w-3.5 ive-text-emerald" />
              Goals
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {isGuest ? (
              <p className="text-xs text-muted-foreground">No goals set. Upgrade to unlock.</p>
            ) : (
              [
                { label: "DWS Pipeline Export", progress: 65 },
                { label: "Watchdog Gate 4 Closure", progress: 40 },
                { label: "Stokvel Contribution", progress: 100 },
              ].map((g) => (
                <div key={g.label}>
                  <div className="mb-1 flex justify-between text-xs">
                    <span className="text-muted-foreground">{g.label}</span>
                    <span className="font-mono">{g.progress}%</span>
                  </div>
                  <Progress value={g.progress} className="h-1" />
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card className="ive-glass">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 font-mono text-xs uppercase tracking-widest">
              <Calendar className="h-3.5 w-3.5 ive-text-jade" />
              Calendar
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-1.5 text-xs">
            {isGuest ? (
              <p className="text-muted-foreground">No upcoming events.</p>
            ) : (
              [
                { date: "Aug 26", event: "Soak test begins (50K tx)" },
                { date: "Sep 06", event: "Gate 4 closure" },
                { date: "Sep 15", event: "Mainnet launch" },
              ].map((c) => (
                <div key={c.event} className="flex gap-2">
                  <span className="font-mono text-muted-foreground">{c.date}</span>
                  <span>{c.event}</span>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card className="ive-glass">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 font-mono text-xs uppercase tracking-widest">
              <Key className="h-3.5 w-3.5 ive-text-gold" />
              API Keys
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-1.5 text-xs">
            {isGuest ? (
              <p className="text-muted-foreground">No API keys. Upgrade to generate.</p>
            ) : (
              [
                { name: "Facilitator LLM", key: "vvc_prod_***" },
                { name: "Store Registry", key: "vvc_store_***" },
              ].map((k) => (
                <div key={k.name} className="flex justify-between">
                  <span className="text-muted-foreground">{k.name}</span>
                  <code className="font-mono text-[10px]">{k.key}</code>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card className="ive-glass">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 font-mono text-xs uppercase tracking-widest">
              <Receipt className="h-3.5 w-3.5 ive-text-emerald" />
              Receipts
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-1.5 text-xs">
            {isGuest ? (
              <p className="text-muted-foreground">No receipts yet.</p>
            ) : (
              UBUNTU_POOLS[0].receipts.slice(0, 3).map((r) => (
                <div key={r.id} className="flex justify-between">
                  <span className="font-mono text-[10px] text-muted-foreground">{r.id}</span>
                  <span className="font-mono font-semibold">R{r.amountZAR}</span>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card className="ive-glass">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 font-mono text-xs uppercase tracking-widest">
              <Settings className="h-3.5 w-3.5 ive-text-jade" />
              Project Planning
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-1.5 text-xs">
            {isGuest ? (
              <p className="text-muted-foreground">No projects. Upgrade to create.</p>
            ) : (
              [
                { name: "DWS Pipeline", status: "ACTIVE", tone: "ive-text-emerald" },
                { name: "NMU Demo Kit", status: "FROZEN", tone: "ive-text-gold" },
                { name: "SealedRegistry", status: "PHASE 2", tone: "ive-text-rose" },
              ].map((p) => (
                <div key={p.name} className="flex justify-between">
                  <span>{p.name}</span>
                  <span className={`font-mono text-[10px] ${p.tone}`}>{p.status}</span>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      {/* Integrations row */}
      <Card className="ive-glass">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 font-mono text-sm uppercase tracking-widest">
            <Users className="h-4 w-4 ive-text-gold" />
            Integrations & Organizations
          </CardTitle>
          <CardDescription className="text-xs">
            Connection graph showing the live status of Discord, Outlook,
            Gmail Workspace, Microsoft Teams, and academic attestations.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            {INTEGRATIONS.map((int) => (
              <div
                key={int.id}
                className={`rounded-lg border p-3 ${
                  int.status === "connected"
                    ? "border-[oklch(0.72_0.17_162/40%)] bg-primary/5"
                    : int.status === "pending"
                    ? "border-[oklch(0.82_0.16_75/40%)] bg-secondary/30"
                    : "border-border/40 bg-secondary/20"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xl">{int.icon}</span>
                  {int.status === "connected" && (
                    <span className="h-2 w-2 rounded-full bg-emerald-500" />
                  )}
                  {int.status === "pending" && (
                    <span className="h-2 w-2 rounded-full bg-amber-500" />
                  )}
                </div>
                <div className="mt-1 font-mono text-xs font-semibold">{int.name}</div>
                <div className="mt-0.5 font-mono text-[10px] text-muted-foreground">
                  {int.status === "connected" && int.account}
                  {int.status === "disconnected" && "Not connected"}
                  {int.status === "pending" && "Pending verification"}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

/**
 * Master Graph SVG — a simplified node-link diagram showing the User node
 * connected (or disconnected for guests) to Organizations, Projects, Wallet,
 * and Pools.
 */
function MasterGraphSVG({ isGuest }: { isGuest: boolean }) {
  const center = { x: 200, y: 150 };
  const orbitNodes = [
    { label: "Organization", icon: "🏢", x: 350, y: 70, connected: !isGuest },
    { label: "Projects", icon: "📁", x: 380, y: 200, connected: !isGuest },
    { label: "ANTPAY", icon: "💰", x: 60, y: 70, connected: !isGuest },
    { label: "Ubuntu Pools", icon: "🤝", x: 40, y: 230, connected: !isGuest },
    { label: "Discord", icon: "💬", x: 200, y: 280, connected: !isGuest && connectedIntegrations().includes("discord") },
  ];

  return (
    <svg viewBox="0 0 420 320" className="w-full" style={{ maxHeight: 320 }}>
      {/* Connection lines */}
      {orbitNodes.map((n, i) => (
        <line
          key={i}
          x1={center.x}
          y1={center.y}
          x2={n.x}
          y2={n.y}
          stroke={n.connected ? "oklch(0.82 0.16 75 / 0.4)" : "oklch(0.4 0.02 60 / 0.2)"}
          strokeWidth={n.connected ? 2 : 1}
          strokeDasharray={n.connected ? "none" : "4 4"}
        />
      ))}

      {/* Center: User node */}
      <g>
        <circle cx={center.x} cy={center.y} r="28" fill="oklch(0.82 0.16 75 / 0.15)" stroke="oklch(0.82 0.16 75)" strokeWidth="2" />
        <text x={center.x} y={center.y - 2} textAnchor="middle" fontSize="14" fill="oklch(0.82 0.16 75)">👤</text>
        <text x={center.x} y={center.y + 12} textAnchor="middle" fontSize="9" fill="oklch(0.82 0.16 75)" fontFamily="monospace" fontWeight="bold">USER</text>
      </g>

      {/* Orbit nodes */}
      {orbitNodes.map((n, i) => (
        <g key={i}>
          <circle
            cx={n.x}
            cy={n.y}
            r="22"
            fill={n.connected ? "oklch(0.72 0.17 162 / 0.1)" : "oklch(0.2 0.018 60 / 0.4)"}
            stroke={n.connected ? "oklch(0.72 0.17 162 / 0.6)" : "oklch(0.4 0.02 60 / 0.4)"}
            strokeWidth="1.5"
          />
          <text x={n.x} y={n.y + 4} textAnchor="middle" fontSize="14">{n.icon}</text>
          <text x={n.x} y={n.y + 34} textAnchor="middle" fontSize="8" fill={n.connected ? "oklch(0.72 0.17 162)" : "oklch(0.6 0.012 60)"} fontFamily="monospace">
            {n.label}
          </text>
        </g>
      ))}
    </svg>
  );
}

function connectedIntegrations(): string[] {
  return INTEGRATIONS.filter((i) => i.status === "connected").map((i) => i.id);
}

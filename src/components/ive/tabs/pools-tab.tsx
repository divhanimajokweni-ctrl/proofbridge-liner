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
import { Users, Handshake, Receipt, Plus, TrendingUp } from "lucide-react";
import { UBUNTU_POOLS } from "@/lib/ive/architecture";

export function PoolsTab() {
  return (
    <div className="space-y-4">
      <Card className="ive-glass-gold">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 font-mono text-sm uppercase tracking-widest">
            <Handshake className="h-4 w-4 ive-text-gold" />
            Ubuntu Pools · Community Stokvel
          </CardTitle>
          <CardDescription className="text-xs">
            Community pooled funding (R500 – R5,000 / month contribution
            ranges) and Direct VVU Funding. Every contribution gets a
            ProofBridge receipt.
          </CardDescription>
        </CardHeader>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        {UBUNTU_POOLS.map((pool) => (
          <Card key={pool.id} className="ive-glass">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="font-mono text-sm uppercase tracking-widest">
                  {pool.name}
                </CardTitle>
                <Badge variant="outline" className="border-[oklch(0.82_0.16_75/40%)] ive-text-gold">
                  {pool.contributionRange}
                </Badge>
              </div>
              <CardDescription className="text-xs">{pool.description}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {/* Pool stats */}
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-lg border border-border/40 bg-secondary/30 p-3">
                  <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                    Vault Balance
                  </div>
                  <div className="mt-1 font-mono text-2xl font-bold ive-text-gold">
                    R {pool.balanceZAR.toLocaleString()}
                  </div>
                </div>
                <div className="rounded-lg border border-border/40 bg-secondary/30 p-3">
                  <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                    Contributors
                  </div>
                  <div className="mt-1 font-mono text-2xl font-bold ive-text-emerald">
                    {pool.contributorCount}
                  </div>
                </div>
              </div>

              {/* Community Graph mini */}
              <div className="rounded-lg border border-border/40 bg-black/20 p-3">
                <div className="mb-2 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                  Community Graph · pooled funds across contributors
                </div>
                <svg viewBox="0 0 300 80" className="w-full">
                  {Array.from({ length: 10 }).map((_, i) => {
                    const x = 20 + i * 28;
                    const isContributor = i < Math.min(pool.contributorCount, 10);
                    return (
                      <g key={i}>
                        <line x1={150} y1={40} x2={x} y2={20 + (i % 3) * 20} stroke={isContributor ? "oklch(0.82 0.16 75 / 0.3)" : "oklch(0.3 0.02 60 / 0.15)"} strokeWidth="1" />
                        <circle cx={x} cy={20 + (i % 3) * 20} r="5" fill={isContributor ? "oklch(0.82 0.16 75 / 0.6)" : "oklch(0.3 0.02 60 / 0.3)"} />
                      </g>
                    );
                  })}
                  <circle cx={150} cy={40} r="12" fill="oklch(0.82 0.16 75 / 0.2)" stroke="oklch(0.82 0.16 75)" strokeWidth="2" />
                  <text x={150} y={44} textAnchor="middle" fontSize="10" fill="oklch(0.82 0.16 75)" fontFamily="monospace" fontWeight="bold">POOL</text>
                </svg>
              </div>

              {/* Receipts */}
              <div>
                <div className="mb-2 flex items-center gap-2 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                  <Receipt className="h-3 w-3" />
                  ProofBridge Receipts
                </div>
                <div className="space-y-1.5">
                  {pool.receipts.map((r) => (
                    <div key={r.id} className="flex items-center justify-between rounded-md border border-border/40 bg-secondary/20 p-2">
                      <div>
                        <div className="font-mono text-[10px] text-muted-foreground">{r.id}</div>
                        <div className="font-mono text-[10px] ive-text-emerald">{r.proofBridgeReceipt}</div>
                      </div>
                      <div className="text-right">
                        <div className="font-mono text-sm font-bold ive-text-gold">R {r.amountZAR.toLocaleString()}</div>
                        <div className="font-mono text-[9px] text-muted-foreground">{r.date}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <Button className="w-full gap-2 font-mono text-xs uppercase tracking-widest">
                <Plus className="h-4 w-4" />
                Contribute to {pool.name}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* VVU Funding direct */}
      <Card className="ive-glass">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 font-mono text-sm uppercase tracking-widest">
            <TrendingUp className="h-4 w-4 ive-text-emerald" />
            Direct VVU Funding
          </CardTitle>
          <CardDescription className="text-xs">
            Direct funding for Venture Vision Ubuntu core research and platform
            development. Every contribution is ProofBridge-attested.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-3">
            {[
              { amount: "R 1,000", desc: "Research contributor" },
              { amount: "R 10,000", desc: "Platform sponsor" },
              { amount: "R 50,000", desc: "Founding partner" },
            ].map((tier) => (
              <div key={tier.amount} className="rounded-lg border border-border/40 bg-secondary/30 p-3 text-center">
                <div className="font-mono text-lg font-bold ive-text-gold">{tier.amount}</div>
                <div className="font-mono text-[10px] text-muted-foreground">{tier.desc}</div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

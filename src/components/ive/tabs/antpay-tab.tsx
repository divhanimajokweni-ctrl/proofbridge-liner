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
import { Wallet, CreditCard, Receipt, Zap, TrendingUp, Building2 } from "lucide-react";
import { PRICING_TIERS } from "@/lib/ive/architecture";

export function AntpayTab() {
  return (
    <div className="space-y-4">
      <Card className="ive-glass-gold">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 font-mono text-sm uppercase tracking-widest">
            <Wallet className="h-4 w-4 ive-text-gold" />
            ANTPAY · Financials & Billing
          </CardTitle>
          <CardDescription className="text-xs">
            ZAR pricing table for the VVU Native contactless payment rail.
            Wallet flow graph showing the movement of Compute Credits,
            Subscriptions, and BLE transaction receipts (from{" "}
            <code className="font-mono">TerminalGattServer.kt</code>).
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <div className="rounded-lg border border-[oklch(0.82_0.16_75/30%)] bg-primary/5 p-3">
              <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Wallet Balance</div>
              <div className="mt-1 font-mono text-2xl font-bold ive-text-gold">R 4,500</div>
              <div className="font-mono text-[10px] text-muted-foreground">Compute Credits · ZAR</div>
            </div>
            <div className="rounded-lg border border-border/40 bg-secondary/30 p-3">
              <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Monthly Subscription</div>
              <div className="mt-1 font-mono text-2xl font-bold">R 4,500</div>
              <div className="font-mono text-[10px] text-muted-foreground">Creator tier · active</div>
            </div>
            <div className="rounded-lg border border-border/40 bg-secondary/30 p-3">
              <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">BLE Receipts</div>
              <div className="mt-1 font-mono text-2xl font-bold ive-text-emerald">3</div>
              <div className="font-mono text-[10px] text-muted-foreground">ProofBridge-verified</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ZAR Pricing Table */}
      <Card className="ive-glass">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 font-mono text-sm uppercase tracking-widest">
            <CreditCard className="h-4 w-4 ive-text-gold" />
            ZAR Pricing Table
          </CardTitle>
          <CardDescription className="text-xs">
            Six tiers — from free academic to enterprise. Payments processed
            via ANTPAY (Stitch EFT or BLE contactless).
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            {PRICING_TIERS.map((tier) => (
              <div
                key={tier.id}
                className={`relative rounded-lg border p-4 ${
                  tier.badge === "POPULAR"
                    ? "border-[oklch(0.82_0.16_75/60%)] bg-primary/10 ive-glow-gold"
                    : tier.id === "student"
                    ? "border-[oklch(0.72_0.17_162/40%)] bg-primary/5"
                    : "border-border/40 bg-secondary/30"
                }`}
              >
                {tier.badge && (
                  <div className="absolute -top-2 left-4">
                    <Badge variant="outline" className="border-[oklch(0.82_0.16_75/60%)] bg-background ive-text-gold">
                      {tier.badge}
                    </Badge>
                  </div>
                )}
                <div className="font-mono text-sm font-semibold">{tier.name}</div>
                <div className="mt-1 font-mono text-2xl font-bold ive-text-gold">
                  {tier.priceZAR}
                </div>
                <div className="mt-1 text-xs text-muted-foreground">{tier.target}</div>
                <ul className="mt-3 space-y-1.5">
                  {tier.features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-xs text-muted-foreground">
                      <span className="mt-0.5 text-emerald-500">✓</span>
                      {f}
                    </li>
                  ))}
                </ul>
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-4 w-full font-mono text-[10px] uppercase tracking-widest"
                >
                  {tier.priceMonthly === 0 ? "Start Free" : `Subscribe · ${tier.priceZAR}`}
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Wallet Flow Graph */}
      <Card className="ive-glass">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 font-mono text-sm uppercase tracking-widest">
            <TrendingUp className="h-4 w-4 ive-text-emerald" />
            Wallet Flow Graph
          </CardTitle>
          <CardDescription className="text-xs">
            Visual integration layer showing the exact movement of Compute
            Credits, Subscriptions, and BLE transaction receipts.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 md:grid-cols-4">
            {[
              { icon: Zap, label: "Compute Credits", value: "R 4,500", tone: "ive-text-gold", desc: "Pre-paid metering" },
              { icon: CreditCard, label: "Subscriptions", value: "R 4,500/mo", tone: "ive-text-emerald", desc: "Creator tier active" },
              { icon: Receipt, label: "BLE Receipts", value: "3 tx", tone: "ive-text-jade", desc: "ProofBridge-verified" },
              { icon: Building2, label: "Stitch EFT", value: "Linked", tone: "ive-text-gold", desc: "Bank transfer ready" },
            ].map((w) => {
              const Icon = w.icon;
              return (
                <div key={w.label} className="rounded-lg border border-border/40 bg-secondary/30 p-3 text-center">
                  <Icon className={`mx-auto h-6 w-6 ${w.tone}`} />
                  <div className="mt-2 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                    {w.label}
                  </div>
                  <div className={`mt-1 font-mono text-lg font-bold ${w.tone}`}>{w.value}</div>
                  <div className="font-mono text-[9px] text-muted-foreground">{w.desc}</div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import {
  Layers,
  FileCode2,
  Sigma,
  ShieldCheck,
  AlertTriangle,
  Activity,
} from "lucide-react";

interface SystemHealthMonitorProps {
  claimsCount: number;
  totalEvidence: number;
  avgNInd: number | null;
  authRate: number;
  breakerEvents: number;
}

interface MetricCard {
  label: string;
  value: string;
  icon: React.ElementType;
  dotColor: string;
  iconColor: string;
}

export function SystemHealthMonitor({
  claimsCount,
  totalEvidence,
  avgNInd,
  authRate,
  breakerEvents,
}: SystemHealthMonitorProps) {
  // Live pulse animation — simulates heartbeat for health indicator
  const [pulsePhase, setPulsePhase] = useState(0);
  useEffect(() => {
    const interval = setInterval(() => {
      setPulsePhase((p) => (p + 1) % 3);
    }, 1200);
    return () => clearInterval(interval);
  }, []);

  // Determine overall health
  const hasBreaker = breakerEvents > 0;
  const lowAuth = authRate < 0.5;
  const healthStatus: "green" | "amber" | "red" = hasBreaker
    ? "red"
    : lowAuth
      ? "amber"
      : "green";

  const healthDot = {
    green: "bg-emerald-500",
    amber: "bg-amber-500",
    red: "bg-red-500",
  }[healthStatus];

  const healthPulse = {
    green: "shadow-emerald-500/50",
    amber: "shadow-amber-500/50",
    red: "shadow-red-500/50",
  }[healthStatus];

  const metrics: MetricCard[] = [
    {
      label: "Total Claims",
      value: claimsCount.toString(),
      icon: Layers,
      dotColor: claimsCount > 0 ? "bg-emerald-500" : "bg-zinc-400",
      iconColor: "text-emerald-600 dark:text-emerald-400",
    },
    {
      label: "Total Evidence",
      value: totalEvidence.toString(),
      icon: FileCode2,
      dotColor: totalEvidence > 0 ? "bg-emerald-500" : "bg-zinc-400",
      iconColor: "text-amber-600 dark:text-amber-400",
    },
    {
      label: "Avg N_ind",
      value: avgNInd !== null ? avgNInd.toFixed(2) : "—",
      icon: Sigma,
      dotColor:
        avgNInd !== null
          ? avgNInd >= 2
            ? "bg-emerald-500"
            : avgNInd >= 1
              ? "bg-amber-500"
              : "bg-red-500"
          : "bg-zinc-400",
      iconColor: "text-violet-600 dark:text-violet-400",
    },
    {
      label: "Auth Rate",
      value: `${(authRate * 100).toFixed(1)}%`,
      icon: ShieldCheck,
      dotColor:
        authRate >= 0.8
          ? "bg-emerald-500"
          : authRate >= 0.5
            ? "bg-amber-500"
            : "bg-red-500",
      iconColor: "text-cyan-600 dark:text-cyan-400",
    },
    {
      label: "Breaker Events",
      value: breakerEvents.toString(),
      icon: AlertTriangle,
      dotColor: breakerEvents > 0 ? "bg-red-500" : "bg-emerald-500",
      iconColor:
        breakerEvents > 0
          ? "text-red-600 dark:text-red-400"
          : "text-emerald-600 dark:text-emerald-400",
    },
  ];

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Activity className="h-4 w-4 text-muted-foreground" />
          <h3 className="text-sm font-semibold tracking-tight">System Health</h3>
        </div>
        <div className="flex items-center gap-1.5">
          {/* Animated pulse dot */}
          <span
            className={cn(
              "h-2 w-2 rounded-full transition-all duration-300",
              healthDot,
              pulsePhase === 0 && `shadow-[0_0_4px_2px] ${healthPulse} scale-125`,
              pulsePhase === 1 && "scale-100",
              pulsePhase === 2 && "scale-90 opacity-70"
            )}
          />
          <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider">
            {healthStatus === "green" ? "healthy" : healthStatus === "amber" ? "degraded" : "alert"}
          </span>
          {/* Mini heartbeat line */}
          <svg
            width="24"
            height="12"
            viewBox="0 0 24 12"
            className="text-muted-foreground/50 ml-1"
            aria-hidden
          >
            <polyline
              fill="none"
              stroke="currentColor"
              strokeWidth="1.2"
              strokeLinejoin="round"
              points={
                healthStatus === "green"
                  ? "0,6 4,6 6,2 8,10 10,6 14,6 16,2 18,10 20,6 24,6"
                  : healthStatus === "amber"
                  ? "0,6 3,6 5,3 7,9 9,6 12,6 14,3 16,9 18,6 21,6 24,6"
                  : "0,6 2,6 4,1 6,11 8,6 10,6 12,1 14,11 16,6 18,6 20,1 22,11 24,6"
              }
            />
          </svg>
        </div>
      </div>

      <div className="grid grid-cols-5 gap-2">
        {metrics.map((metric) => {
          const Icon = metric.icon;
          return (
            <Card
              key={metric.label}
              className="bg-muted/30 rounded-lg p-3 border-border/50 shadow-none gap-0"
            >
              <div className="flex items-center justify-between mb-1.5">
                <Icon className={cn("h-3.5 w-3.5", metric.iconColor)} />
                <span className={cn("h-1.5 w-1.5 rounded-full", metric.dotColor)} />
              </div>
              <div className="text-lg font-semibold tracking-tight leading-none">
                {metric.value}
              </div>
              <div className="text-[10px] text-muted-foreground font-medium mt-1 truncate">
                {metric.label}
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

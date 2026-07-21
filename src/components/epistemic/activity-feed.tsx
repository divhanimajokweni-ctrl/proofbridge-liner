"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { Variants } from "framer-motion";
import {
  AlertTriangle, GitMerge, Cpu, RefreshCw, ShieldCheck, FileText,
  Activity, Clock, Filter,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  GradientBorderCard, StatusPill, Hash, SeverityDot, containerVariants, cardVariants, itemVariants,
  GridOverlay, TopAccentBar,
} from "./primitives";

/* ─── Types ─── */
type EventType = "violation" | "merge" | "shadow-event" | "sync" | "proof-generated" | "policy-updated";

interface FeedEvent {
  id: string;
  timestamp: string;
  type: EventType;
  description: string;
  severity: "critical" | "high" | "medium" | "low";
}

/* ─── Event type config ─── */
const EVENT_CONFIG: Record<EventType, { icon: typeof Activity; color: string; bg: string; border: string; label: string }> = {
  violation: { icon: AlertTriangle, color: "text-violating", bg: "bg-violating/10", border: "border-violating/30", label: "Violation" },
  merge: { icon: GitMerge, color: "text-verified", bg: "bg-verified/10", border: "border-verified/30", label: "Merge" },
  "shadow-event": { icon: Cpu, color: "text-repairing", bg: "bg-repairing/10", border: "border-repairing/30", label: "Shadow" },
  sync: { icon: RefreshCw, color: "text-verified", bg: "bg-verified/10", border: "border-verified/30", label: "Sync" },
  "proof-generated": { icon: ShieldCheck, color: "text-verified", bg: "bg-verified/10", border: "border-verified/30", label: "Proof" },
  "policy-updated": { icon: FileText, color: "text-repairing", bg: "bg-repairing/10", border: "border-repairing/30", label: "Policy" },
};

/* ─── Filter options ─── */
type FeedFilter = "all" | "violation" | "merge" | "proof";

const FILTER_OPTIONS: { key: FeedFilter; label: string }[] = [
  { key: "all", label: "All" },
  { key: "violation", label: "Violations" },
  { key: "merge", label: "Merges" },
  { key: "proof", label: "Proofs" },
];

/* ─── Mock data generator ─── */
const EVENT_TYPES: EventType[] = ["violation", "merge", "shadow-event", "sync", "proof-generated", "policy-updated"];

const DESCRIPTIONS: Record<EventType, string[]> = {
  violation: [
    "Invariant breach detected on shard epistemic://east-1",
    "Policy P-0042 divergence exceeded threshold (1.4 > 0.8)",
    "Hard violation: unauthorized state mutation in shard us-west-2",
    "Soft violation: latency SLO missed on shadow bridge",
  ],
  merge: [
    "Merge proposal M-0192 applied to shard epistemic://east-1",
    "Cross-shard merge completed with 0 conflicts (3 iterations)",
    "Auto-repair merge applied for policy P-0038",
    "Merge proposal M-0188 rejected: divergence too high",
  ],
  "shadow-event": [
    "Shadow bridge takeover initiated for policy P-0042",
    "Shadow drift detected: divergence 0.12 on shard eu-west-1",
    "Shadow handback completed successfully",
    "What-if analysis completed for policy P-0040",
  ],
  sync: [
    "Argo CD sync wave -5 completed: Namespaces synced",
    "Argo CD sync wave 0 in progress: Messaging components",
    "Manual sync triggered by admin for wave 3",
    "Auto-sync retry succeeded for wave -1",
  ],
  "proof-generated": [
    "ZK proof generated for shard epistemic://east-1 (12ms)",
    "MMR ancestry proof anchored: 48 of 52 proofs verified",
    "SNARK circuit constraint verified for policy P-0042",
    "Batch proof generation completed: 6 proofs in 84ms",
  ],
  "policy-updated": [
    "Policy P-0042 updated to v2.3: new invariant added",
    "Policy P-0038 template refreshed from .epd source",
    "Federation policy sync: 3 policies reconciled",
    "Policy P-0040 DSL compiled successfully",
  ],
};

const SEVERITIES: Record<EventType, ("critical" | "high" | "medium" | "low")[]> = {
  violation: ["critical", "high", "medium", "high"],
  merge: ["low", "low", "medium", "low"],
  "shadow-event": ["medium", "medium", "low", "low"],
  sync: ["low", "medium", "low", "low"],
  "proof-generated": ["low", "low", "medium", "low"],
  "policy-updated": ["low", "low", "medium", "low"],
};

let eventCounter = 0;

function generateEvent(): FeedEvent {
  const type = EVENT_TYPES[Math.floor(Math.random() * EVENT_TYPES.length)];
  const descs = DESCRIPTIONS[type];
  const sevs = SEVERITIES[type];
  const idx = Math.floor(Math.random() * descs.length);
  eventCounter++;
  return {
    id: `ev-${eventCounter}-${Date.now()}`,
    timestamp: new Date().toISOString(),
    type,
    description: descs[idx],
    severity: sevs[idx],
  };
}

function generateInitialEvents(count: number): FeedEvent[] {
  const events: FeedEvent[] = [];
  for (let i = 0; i < count; i++) {
    const ev = generateEvent();
    // Spread timestamps over the past 30 minutes
    const ago = Math.floor(Math.random() * 30 * 60 * 1000);
    ev.timestamp = new Date(Date.now() - ago).toISOString();
    events.push(ev);
  }
  // Sort by timestamp descending (newest first)
  events.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  return events;
}

function fmtRelative(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const s = Math.floor(diff / 1000);
  if (s < 5) return "just now";
  if (s < 60) return `${s}s ago`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  return `${h}h ago`;
}

/* ─── Variants ─── */
const cv: Variants = { hidden: {}, visible: { transition: { staggerChildren: 0.04 } } };
const itemV: Variants = {
  hidden: { opacity: 0, x: -16, height: 0 },
  visible: { opacity: 1, x: 0, height: "auto", transition: { type: "spring", stiffness: 300, damping: 26 } },
  exit: { opacity: 0, x: 16, height: 0, transition: { duration: 0.15 } },
};

/* ─── Main Component ─── */
export function ActivityFeed() {
  const [events, setEvents] = useState<FeedEvent[]>(() => generateInitialEvents(20));
  const [filter, setFilter] = useState<FeedFilter>("all");
  const [isLive, setIsLive] = useState(true);

  // Auto-refresh: add a new event every 15 seconds
  useEffect(() => {
    if (!isLive) return;
    const t = setInterval(() => {
      const newEvent = generateEvent();
      setEvents((prev) => [newEvent, ...prev].slice(0, 40));
    }, 15000);
    return () => clearInterval(t);
  }, [isLive]);

  // Filter events
  const filteredEvents = useMemo(() => {
    if (filter === "all") return events.slice(0, 20);
    if (filter === "violation") return events.filter((e) => e.type === "violation").slice(0, 20);
    if (filter === "merge") return events.filter((e) => e.type === "merge").slice(0, 20);
    if (filter === "proof") return events.filter((e) => e.type === "proof-generated").slice(0, 20);
    return events.slice(0, 20);
  }, [events, filter]);

  // Count per filter
  const counts = useMemo(() => ({
    all: events.length,
    violation: events.filter((e) => e.type === "violation").length,
    merge: events.filter((e) => e.type === "merge").length,
    proof: events.filter((e) => e.type === "proof-generated").length,
  }), [events]);

  return (
    <GradientBorderCard gradient="from-repairing/30 via-verified/20 to-violating/10" className="overflow-hidden">
      <div className="relative p-4 sm:p-5">
        <TopAccentBar color="oklch(0.75 0.15 80 / 0.5)" />
        <GridOverlay opacity="opacity-[0.06]" />
        <div className="relative">
          {/* Header */}
          <div className="flex items-center gap-2 mb-4">
            <div className="flex h-7 w-7 items-center justify-center rounded-md bg-repairing/10 border border-repairing/30">
              <Activity className="h-3.5 w-3.5 text-repairing" />
            </div>
            <h3 className="text-sm font-semibold">Activity Feed</h3>
            {/* Live indicator */}
            <button
              type="button"
              onClick={() => setIsLive((v) => !v)}
              className={`ml-auto flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[10px] font-mono transition-all ${
                isLive
                  ? "border-verified/40 bg-verified/10 text-verified"
                  : "border-border/40 bg-muted/20 text-muted-foreground"
              }`}
            >
              <span className="relative flex h-1.5 w-1.5">
                {isLive && <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-verified opacity-50" />}
                <span className={`relative inline-flex rounded-full h-1.5 w-1.5 ${isLive ? "bg-verified" : "bg-muted-foreground/40"}`} />
              </span>
              {isLive ? "LIVE" : "PAUSED"}
            </button>
          </div>

          {/* Filter buttons */}
          <div className="flex items-center gap-1.5 mb-3">
            <Filter className="h-3 w-3 text-muted-foreground/50" />
            {FILTER_OPTIONS.map((opt) => (
              <Button
                key={opt.key}
                variant="ghost"
                size="sm"
                onClick={() => setFilter(opt.key)}
                className={`h-6 px-2 text-[10px] font-mono ${
                  filter === opt.key
                    ? "bg-verified/10 text-verified border border-verified/30"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {opt.label}
                <Badge variant="secondary" className="ml-1 h-3.5 px-1 text-[8px]">
                  {counts[opt.key]}
                </Badge>
              </Button>
            ))}
          </div>

          {/* Event list */}
          <div className="max-h-96 overflow-y-auto custom-scrollbar">
            <AnimatePresence mode="popLayout">
              {filteredEvents.length === 0 && (
                <p className="text-sm text-muted-foreground py-8 text-center">No events matching filter.</p>
              )}
              {filteredEvents.map((event) => {
                const cfg = EVENT_CONFIG[event.type];
                const Icon = cfg.icon;
                return (
                  <motion.div
                    key={event.id}
                    variants={itemV}
                    initial="hidden"
                    animate="visible"
                    exit="exit"
                    layout
                    className="relative flex items-start gap-3 rounded-lg border border-border/30 bg-background/30 px-3 py-2.5 mb-1.5 hover:border-border/60 hover:bg-background/50 transition-all group/ev"
                  >
                    {/* Type icon */}
                    <div className={`mt-0.5 h-7 w-7 shrink-0 rounded-md flex items-center justify-center ${cfg.bg} ${cfg.border} border`}>
                      <Icon className={`h-3.5 w-3.5 ${cfg.color}`} />
                    </div>
                    {/* Content */}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className={`text-[9px] font-mono px-1.5 py-0.5 rounded-full shrink-0 ${cfg.bg} ${cfg.color} ${cfg.border} border`}>
                          {cfg.label}
                        </span>
                        <SeverityDot severity={event.severity} />
                      </div>
                      <p className="text-xs font-medium mt-1 leading-tight">{event.description}</p>
                    </div>
                    {/* Timestamp */}
                    <span className="text-[10px] text-muted-foreground/70 font-mono shrink-0 flex items-center gap-1 mt-0.5">
                      <Clock className="h-2.5 w-2.5" />{fmtRelative(event.timestamp)}
                    </span>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </GradientBorderCard>
  );
}

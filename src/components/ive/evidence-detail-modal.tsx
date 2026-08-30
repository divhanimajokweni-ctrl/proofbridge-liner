"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { StateBadge } from "@/components/ive/state-badge";
import { EvidenceItem } from "@/lib/eis";
import { cn } from "@/lib/utils";
import { Clock, Weight, FileText, VectorSquare } from "lucide-react";

interface EvidenceDetailModalProps {
  evidence: EvidenceItem | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const SOURCE_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  "you.com": {
    bg: "bg-rose-500/10",
    text: "text-rose-700 dark:text-rose-300",
    border: "border-rose-500/30",
  },
  brave: {
    bg: "bg-orange-500/10",
    text: "text-orange-700 dark:text-orange-300",
    border: "border-orange-500/30",
  },
  firecrawl: {
    bg: "bg-amber-500/10",
    text: "text-amber-700 dark:text-amber-300",
    border: "border-amber-500/30",
  },
  watchdog: {
    bg: "bg-cyan-500/10",
    text: "text-cyan-700 dark:text-cyan-300",
    border: "border-cyan-500/30",
  },
};

export function EvidenceDetailModal({
  evidence,
  open,
  onOpenChange,
}: EvidenceDetailModalProps) {
  if (!evidence) return null;

  const sourceStyle = SOURCE_COLORS[evidence.source] ?? {
    bg: "bg-zinc-500/10",
    text: "text-zinc-700 dark:text-zinc-300",
    border: "border-zinc-500/30",
  };

  const weightPercent = Math.min(100, Math.max(0, evidence.weight * 100));
  const embeddingPreview = evidence.embedding?.slice(0, 5) ?? [];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-4 w-4 text-muted-foreground" />
            Evidence Detail
          </DialogTitle>
          <DialogDescription>
            Full view of evidence item from {evidence.source}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Source Badge */}
          <div className="flex items-center gap-3">
            <span className="text-xs font-medium text-muted-foreground">Source</span>
            <Badge
              className={cn(
                "font-mono text-xs",
                sourceStyle.bg,
                sourceStyle.text,
                sourceStyle.border
              )}
              variant="outline"
            >
              {evidence.source}
            </Badge>
          </div>

          {/* Content with ScrollArea */}
          <div>
            <div className="flex items-center gap-1.5 mb-1.5">
              <FileText className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="text-xs font-medium text-muted-foreground">Content</span>
            </div>
            <ScrollArea className="h-40 w-full rounded-md border border-border bg-muted/20 p-3">
              <p className="text-sm leading-relaxed whitespace-pre-wrap">
                {evidence.content}
              </p>
            </ScrollArea>
          </div>

          {/* Weight with visual bar */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <div className="flex items-center gap-1.5">
                <Weight className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="text-xs font-medium text-muted-foreground">Weight</span>
              </div>
              <span className="text-xs font-mono font-semibold">
                {evidence.weight.toFixed(3)}
              </span>
            </div>
            <div className="h-2.5 w-full rounded-full bg-muted overflow-hidden">
              <div
                className={cn(
                  "h-full rounded-full transition-all",
                  weightPercent >= 70
                    ? "bg-emerald-500"
                    : weightPercent >= 40
                      ? "bg-amber-500"
                      : "bg-zinc-400"
                )}
                style={{ width: `${weightPercent}%` }}
              />
            </div>
            <div className="flex justify-between mt-1">
              <span className="text-[10px] font-mono text-muted-foreground">0</span>
              <span className="text-[10px] font-mono text-muted-foreground">1</span>
            </div>
          </div>

          {/* State Badge */}
          <div className="flex items-center gap-3">
            <span className="text-xs font-medium text-muted-foreground">State</span>
            <StateBadge state={evidence.state} size="sm" />
          </div>

          {/* Collection Timestamp */}
          <div className="flex items-center gap-3">
            <Clock className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="text-xs font-medium text-muted-foreground">Collected</span>
            <span className="text-xs font-mono text-foreground">
              {new Date(evidence.collectedAt).toLocaleString()}
            </span>
          </div>

          {/* Embedding Vector Preview */}
          {embeddingPreview.length > 0 && (
            <div>
              <div className="flex items-center gap-1.5 mb-1.5">
                <VectorSquare className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="text-xs font-medium text-muted-foreground">
                  Embedding Preview
                </span>
                <span className="text-[10px] font-mono text-muted-foreground">
                  (first {embeddingPreview.length} of {evidence.embedding.length})
                </span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {embeddingPreview.map((val, i) => (
                  <span
                    key={i}
                    className="inline-flex items-center rounded bg-muted/50 px-1.5 py-0.5 text-[10px] font-mono text-muted-foreground"
                  >
                    {val.toFixed(4)}
                  </span>
                ))}
                {evidence.embedding.length > 5 && (
                  <span className="inline-flex items-center rounded bg-muted/30 px-1.5 py-0.5 text-[10px] font-mono text-muted-foreground">
                    … +{evidence.embedding.length - 5} more
                  </span>
                )}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

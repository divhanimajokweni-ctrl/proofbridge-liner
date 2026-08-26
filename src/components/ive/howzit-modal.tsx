"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Rocket, ShieldCheck, Wrench, GraduationCap } from "lucide-react";
import { HOWZIT_MESSAGE } from "@/lib/ive/architecture";

/**
 * Howzit onboarding modal — appears on first load (per the VRES / VRES1 / NMU
 * architectural specification). Asks the user if they are Building or
 * Validating, then offers an [Enter Studio] button to transition to the
 * Landscape View.
 *
 * Persisted to localStorage so it only shows once per session.
 */
export function HowzitModal({
  open,
  onEnterStudio,
  onDismiss,
}: {
  open: boolean;
  onEnterStudio: (mode: "building" | "validating") => void;
  onDismiss: () => void;
}) {
  const [selectedMode, setSelectedMode] = useState<"building" | "validating" | null>(null);

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onDismiss()}>
      <DialogContent className="max-w-lg border-[oklch(0.82_0.16_75/40%)] bg-background/95 backdrop-blur">
        <DialogHeader>
          <div className="mb-2 flex items-center gap-2">
            <span className="text-2xl">🇿🇦</span>
            <Badge variant="outline" className="border-[oklch(0.82_0.16_75/40%)] ive-text-gold">
              VVU · Home Base
            </Badge>
          </div>
          <DialogTitle className="font-mono text-lg">
            Howzit! Welcome to VVU.
          </DialogTitle>
          <DialogDescription className="text-sm leading-relaxed">
            {HOWZIT_MESSAGE}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 py-2">
          <div className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
            What brings you here today?
          </div>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setSelectedMode("building")}
              className={`rounded-lg border p-4 text-left transition-all ${
                selectedMode === "building"
                  ? "border-[oklch(0.82_0.16_75/60%)] bg-primary/10 ive-glow-gold"
                  : "border-border/40 bg-secondary/30 hover:border-[oklch(0.82_0.16_75/30%)]"
              }`}
            >
              <Wrench className="mb-2 h-5 w-5 ive-text-gold" />
              <div className="font-mono text-sm font-semibold">Building</div>
              <div className="mt-1 text-xs text-muted-foreground">
                Creating documents, uploading CAD, generating 3D constructions, minting assets.
              </div>
            </button>
            <button
              type="button"
              onClick={() => setSelectedMode("validating")}
              className={`rounded-lg border p-4 text-left transition-all ${
                selectedMode === "validating"
                  ? "border-[oklch(0.72_0.17_162/60%)] bg-primary/10 ive-glow-emerald"
                  : "border-border/40 bg-secondary/30 hover:border-[oklch(0.72_0.17_162/30%)]"
              }`}
            >
              <ShieldCheck className="mb-2 h-5 w-5 ive-text-emerald" />
              <div className="font-mono text-sm font-semibold">Validating</div>
              <div className="mt-1 text-xs text-muted-foreground">
                Running Watchdog checks, auditing governance artifacts, verifying evidence decay.
              </div>
            </button>
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button
            variant="ghost"
            onClick={onDismiss}
            className="font-mono text-xs uppercase tracking-widest"
          >
            <GraduationCap className="mr-1 h-3 w-3" />
            Just Browsing
          </Button>
          <Button
            onClick={() => selectedMode && onEnterStudio(selectedMode)}
            disabled={!selectedMode}
            className="gap-2 font-mono text-xs uppercase tracking-widest"
          >
            <Rocket className="h-4 w-4" />
            Enter Studio
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

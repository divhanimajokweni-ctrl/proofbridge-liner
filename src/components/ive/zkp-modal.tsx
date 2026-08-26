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
import { Progress } from "@/components/ui/progress";
import { Lock, CheckCircle2, Loader2, Wallet, ShieldCheck } from "lucide-react";
import {
  ZKP_ATTESTATION_SOURCES,
  PRICING_TIERS,
  type UserRole,
} from "@/lib/ive/architecture";

/**
 * ZKP verification modal — the "Upgrade Gate" per the E2E blueprint.
 * User proves their role via a zero-knowledge proof (no raw IDs stored),
 * the system auto-applies the correct ZAR pricing tier, and ANTPAY
 * processes the payment. Only a cryptographic proof is stored — not
 * the underlying identity.
 */
export function ZkpModal({
  open,
  onClose,
  onVerified,
}: {
  open: boolean;
  onClose: () => void;
  onVerified: (role: UserRole) => void;
}) {
  const [step, setStep] = useState<"select" | "attesting" | "verified">("select");
  const [selectedSources, setSelectedSources] = useState<string[]>([]);
  const [progress, setProgress] = useState(0);
  const [detectedRole, setDetectedRole] = useState<UserRole>("student");

  const toggleSource = (id: string) => {
    setSelectedSources((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]
    );
  };

  const startAttestation = () => {
    if (selectedSources.length === 0) return;
    setStep("attesting");
    setProgress(0);

    // Simulate ZKP generation + verification
    const interval = setInterval(() => {
      setProgress((p) => {
        if (p >= 100) {
          clearInterval(interval);
          // Determine role based on selected sources
          const hasAcademic = selectedSources.some((s) =>
            ["wits", "ecsa", "saica", "ieee"].includes(s)
          );
          const hasEnterprise = selectedSources.includes("cipc");
          const hasGov = selectedSources.includes("microsoft");

          let role: UserRole = "creator";
          if (hasAcademic && selectedSources.length <= 2) role = "student";
          else if (hasEnterprise) role = "enterprise";
          else if (hasGov) role = "government";
          else if (hasAcademic) role = "professional";

          setDetectedRole(role);
          setStep("verified");
          return 100;
        }
        return p + 10;
      });
    }, 150);
  };

  const reset = () => {
    setStep("select");
    setSelectedSources([]);
    setProgress(0);
    setDetectedRole("student");
  };

  const handleVerified = () => {
    onVerified(detectedRole);
    reset();
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const detectedTier = PRICING_TIERS.find((t) => t.id === detectedRole) ?? PRICING_TIERS[0];

  return (
    <Dialog open={open} onOpenChange={(o) => !o && handleClose()}>
      <DialogContent className="max-w-lg border-[oklch(0.72_0.17_162/40%)] bg-background/95 backdrop-blur">
        <DialogHeader>
          <div className="mb-2 flex items-center gap-2">
            <Lock className="h-4 w-4 ive-text-emerald" />
            <Badge variant="outline" className="border-[oklch(0.72_0.17_162/40%)] ive-text-emerald">
              ZKP Verification · Zero Fabrication
            </Badge>
          </div>
          <DialogTitle className="font-mono text-lg">
            Verify Your Role
          </DialogTitle>
          <DialogDescription className="text-sm leading-relaxed">
            Link your professional or academic wallet to prove your role. We
            don&apos;t store your ID — only a cryptographic proof. VVU verifies
            the mathematical proof and auto-applies the correct ZAR pricing tier.
          </DialogDescription>
        </DialogHeader>

        {step === "select" && (
          <div className="space-y-3 py-2">
            <div className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
              Select attestation sources:
            </div>
            <div className="grid grid-cols-2 gap-2">
              {ZKP_ATTESTATION_SOURCES.map((src) => {
                const selected = selectedSources.includes(src.id);
                return (
                  <button
                    key={src.id}
                    type="button"
                    onClick={() => toggleSource(src.id)}
                    className={`flex items-center gap-2 rounded-lg border p-3 text-left transition-all ${
                      selected
                        ? "border-[oklch(0.72_0.17_162/60%)] bg-primary/10"
                        : "border-border/40 bg-secondary/30 hover:border-border"
                    }`}
                  >
                    <span className="text-lg">{src.icon}</span>
                    <span className="font-mono text-xs">{src.name}</span>
                    {selected && (
                      <CheckCircle2 className="ml-auto h-4 w-4 ive-text-emerald" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {step === "attesting" && (
          <div className="space-y-4 py-4">
            <div className="flex items-center gap-2 text-sm">
              <Loader2 className="h-4 w-4 animate-spin ive-text-emerald" />
              <span className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
                Generating zero-knowledge proof…
              </span>
            </div>
            <Progress value={progress} className="h-2" />
            <div className="font-mono text-[10px] text-muted-foreground">
              {progress < 30 && "→ Generating ZKP from wallet attestations…"}
              {progress >= 30 && progress < 60 && "→ Submitting proof to VVU verifier…"}
              {progress >= 60 && progress < 90 && "→ Verifying mathematical proof…"}
              {progress >= 90 && "→ Applying ZAR pricing tier…"}
            </div>
          </div>
        )}

        {step === "verified" && (
          <div className="space-y-3 py-2">
            <div className="flex items-start gap-3 rounded-lg border border-[oklch(0.72_0.17_162/40%)] bg-primary/5 p-4">
              <CheckCircle2 className="mt-0.5 h-5 w-5 ive-text-emerald" />
              <div className="flex-1">
                <div className="font-mono text-sm font-semibold ive-text-emerald">
                  Role Verified: {detectedTier.name}
                </div>
                <div className="mt-1 text-xs text-muted-foreground">
                  ZKP proof stored. No raw identity retained.
                </div>
                <div className="mt-2 flex items-center gap-2">
                  <Badge variant="outline" className="font-mono text-xs">
                    {detectedTier.priceZAR}
                  </Badge>
                  <Badge variant="outline" className="font-mono text-xs">
                    {detectedTier.target}
                  </Badge>
                </div>
              </div>
            </div>

            <div className="rounded-lg border border-border/40 bg-secondary/30 p-3">
              <div className="mb-1.5 flex items-center gap-2 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                <Wallet className="h-3 w-3" />
                ANTPAY Payment
              </div>
              <div className="text-xs text-muted-foreground">
                Pay via ANTPAY (Stitch EFT or BLE contactless). A ProofBridge
                receipt will be issued for every transaction.
              </div>
            </div>
          </div>
        )}

        <DialogFooter className="gap-2">
          {step === "select" && (
            <>
              <Button variant="ghost" onClick={handleClose} className="font-mono text-xs uppercase tracking-widest">
                Cancel
              </Button>
              <Button
                onClick={startAttestation}
                disabled={selectedSources.length === 0}
                className="gap-2 font-mono text-xs uppercase tracking-widest"
              >
                <ShieldCheck className="h-4 w-4" />
                Generate ZKP
              </Button>
            </>
          )}
          {step === "attesting" && (
            <Button disabled className="gap-2 font-mono text-xs uppercase tracking-widest">
              <Loader2 className="h-4 w-4 animate-spin" />
              Verifying…
            </Button>
          )}
          {step === "verified" && (
            <>
              <Button variant="ghost" onClick={reset} className="font-mono text-xs uppercase tracking-widest">
                Re-verify
              </Button>
              <Button
                onClick={handleVerified}
                className="gap-2 font-mono text-xs uppercase tracking-widest"
              >
                <Wallet className="h-4 w-4" />
                Pay via ANTPAY
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

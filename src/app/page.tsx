"use client";

import { useState } from "react";
import { WorldContainer } from "@/components/ive/world-container";
import { HowzitModal } from "@/components/ive/howzit-modal";
import { ZkpModal } from "@/components/ive/zkp-modal";
import { IveFooter } from "@/components/ive/ive-footer";
import { ROLE_TIERS, type UserRole } from "@/lib/ive/architecture";
import { Button } from "@/components/ui/button";
import { Lock } from "lucide-react";

/**
 * VRES v1.0 — World → Room → Activity → Interaction architecture.
 *
 * This is NOT a Portrait/Landscape state toggle. It is a genuine spatial
 * runtime:
 * - The World container is the spatial landing (6 selectable Rooms)
 * - Entering a Room replaces the World view with the Room's working viewport
 * - The Room's Activity owns the full working area
 * - Existing tab components are reused as Activities — their internals are NOT changed
 * - Only their containment changes (from dashboard tab → Room activity)
 *
 * The Howzit onboarding modal + ZKP role-gating flow are preserved exactly
 * as they were — they gate entry into the World.
 */
export default function Home() {
  const [howzitOpen, setHowzitOpen] = useState(true);
  const [zkpOpen, setZkpOpen] = useState(false);
  const [role, setRole] = useState<UserRole>("guest");

  const handleEnterStudio = (_mode: "building" | "validating") => {
    setHowzitOpen(false);
  };

  const handleUpgrade = () => {
    setZkpOpen(true);
  };

  const handleZkpVerified = (newRole: UserRole) => {
    setRole(newRole);
    setZkpOpen(false);
  };

  return (
    <div className="relative flex min-h-screen flex-col">
      {/* Hero backdrop image (user-supplied field-edited photo) */}
      <div
        className="pointer-events-none fixed inset-0 z-0"
        style={{
          backgroundImage:
            "linear-gradient(180deg, rgba(13,10,18,0.82) 0%, rgba(13,10,18,0.88) 50%, rgba(13,10,18,0.95) 100%), url(/ive-hero-backdrop.jpg)",
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundAttachment: "fixed",
        }}
        aria-hidden
      />

      <div className="relative z-10 flex min-h-screen flex-col">
        {/* World container — the spatial runtime */}
        <div className="flex-1">
          <WorldContainer role={role} onUpgrade={handleUpgrade} />
        </div>

        <IveFooter />
      </div>

      {/* Howzit onboarding modal — gates entry into the World */}
      <HowzitModal
        open={howzitOpen}
        onEnterStudio={handleEnterStudio}
        onDismiss={() => setHowzitOpen(false)}
      />

      {/* ZKP verification modal — gates entry into locked Rooms */}
      <ZkpModal
        open={zkpOpen}
        onClose={() => setZkpOpen(false)}
        onVerified={handleZkpVerified}
      />
    </div>
  );
}

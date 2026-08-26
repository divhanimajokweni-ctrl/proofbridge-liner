"use client";

import { useState, useEffect } from "react";
import { IveHeader } from "@/components/ive/ive-header";
import { IveFooter } from "@/components/ive/ive-footer";
import { ParticleField } from "@/components/ive/particle-field";
import { HowzitModal } from "@/components/ive/howzit-modal";
import { ZkpModal } from "@/components/ive/zkp-modal";
import { PortraitView } from "@/components/ive/portrait-view";
import { OverviewTab } from "@/components/ive/tabs/overview-tab";
import { HbkTab } from "@/components/ive/tabs/hbk-tab";
import { FacilitatorTab } from "@/components/ive/tabs/facilitator-tab";
import { IntegrationTab } from "@/components/ive/tabs/integration-tab";
import { AirTab } from "@/components/ive/tabs/air-tab";
import { CryptoTab } from "@/components/ive/tabs/crypto-tab";
import { SandboxTab } from "@/components/ive/tabs/sandbox-tab";
import { CanvasTab } from "@/components/ive/tabs/canvas-tab";
import { AerospaceTab } from "@/components/ive/tabs/aerospace-tab";
import { SearmTab } from "@/components/ive/tabs/searm-tab";
import { FieldTab } from "@/components/ive/tabs/field-tab";
import { DevSdkTab } from "@/components/ive/tabs/dev-sdk-tab";
import { AntpayTab } from "@/components/ive/tabs/antpay-tab";
import { PoolsTab } from "@/components/ive/tabs/pools-tab";
import { IntegrationsTab } from "@/components/ive/tabs/integrations-tab";
import { StudioTab } from "@/components/ive/tabs/studio-tab";
import { ROLE_TIERS, type UserRole } from "@/lib/ive/architecture";
import { Button } from "@/components/ui/button";
import { Home as HomeIcon, LayoutDashboard, Rocket, Wallet } from "lucide-react";

export default function Home() {
  const [tab, setTab] = useState<string>("overview");
  const [environment, setEnvironment] = useState<"portrait" | "landscape">("portrait");
  const [howzitOpen, setHowzitOpen] = useState(true);
  const [zkpOpen, setZkpOpen] = useState(false);
  const [role, setRole] = useState<UserRole>("guest");

  // Determine which tabs the current role can see
  const visibleTabs = ROLE_TIERS[role].visibleTabs;

  const handleEnterStudio = (mode: "building" | "validating") => {
    setHowzitOpen(false);
    setEnvironment("landscape");
    if (mode === "building") {
      setTab("studio");
    } else {
      setTab("overview");
    }
  };

  const handleUpgrade = () => {
    setZkpOpen(true);
  };

  const handleZkpVerified = (newRole: UserRole) => {
    setRole(newRole);
    setZkpOpen(false);
    setEnvironment("portrait");
    setTab("overview");
  };

  return (
    <div className="relative flex min-h-screen flex-col">
      {/* Ambient particle layer behind everything */}
      <div className="pointer-events-none fixed inset-0 z-0 opacity-50">
        <ParticleField density={45} />
      </div>

      {/* Hero backdrop image (user-supplied field-edited photo) */}
      <div
        className="pointer-events-none fixed inset-0 z-0"
        style={{
          backgroundImage:
            "linear-gradient(180deg, rgba(13,10,18,0.78) 0%, rgba(13,10,18,0.86) 50%, rgba(13,10,18,0.94) 100%), url(/ive-hero-backdrop.jpg)",
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundAttachment: "fixed",
        }}
        aria-hidden
      />

      <div className="relative z-10 flex min-h-screen flex-col">
        {/* Environment toggle — Portrait / Landscape */}
        <div className="mx-auto flex w-full max-w-[1400px] items-center justify-between gap-2 px-4 pt-3 md:px-6">
          <div className="flex gap-1 rounded-lg border border-border/40 bg-secondary/30 p-1">
            <Button
              variant={environment === "portrait" ? "default" : "ghost"}
              size="sm"
              onClick={() => setEnvironment("portrait")}
              className="gap-1.5 font-mono text-[10px] uppercase tracking-widest"
            >
              <HomeIcon className="h-3 w-3" />
              Portrait · Home Base
            </Button>
            <Button
              variant={environment === "landscape" ? "default" : "ghost"}
              size="sm"
              onClick={() => setEnvironment("landscape")}
              className="gap-1.5 font-mono text-[10px] uppercase tracking-widest"
            >
              <LayoutDashboard className="h-3 w-3" />
              Landscape · Studio
            </Button>
          </div>

          {/* Role + Upgrade badge */}
          <div className="flex items-center gap-2">
            <span className="rounded-full border border-border/40 bg-secondary/30 px-2 py-0.5 font-mono text-[9px] uppercase tracking-widest text-muted-foreground">
              Role: {ROLE_TIERS[role].label}
            </span>
            {role === "guest" && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleUpgrade}
                className="gap-1.5 font-mono text-[10px] uppercase tracking-widest"
              >
                <Wallet className="h-3 w-3" />
                Upgrade
              </Button>
            )}
          </div>
        </div>

        {/* PORTRAIT VIEW — Home Base */}
        {environment === "portrait" && (
          <main className="mx-auto w-full max-w-[1400px] flex-1 px-4 py-4 md:px-6 md:py-6">
            <PortraitView
              role={role}
              onEnterStudio={() => setEnvironment("landscape")}
              onUpgrade={handleUpgrade}
            />
          </main>
        )}

        {/* LANDSCAPE VIEW — 12-tab dashboard + 4 new tabs */}
        {environment === "landscape" && (
          <>
            <IveHeader activeTab={tab} onTab={setTab} />
            <main className="mx-auto w-full max-w-[1400px] flex-1 px-4 py-6 md:px-6 md:py-8">
              {/* Role-gated tab rendering — only show tabs the role can see */}
              {visibleTabs.includes("overview") && tab === "overview" && <OverviewTab onJump={setTab} />}
              {visibleTabs.includes("hbk") && tab === "hbk" && <HbkTab />}
              {visibleTabs.includes("facilitator") && tab === "facilitator" && <FacilitatorTab />}
              {visibleTabs.includes("integration") && tab === "integration" && <IntegrationTab />}
              {visibleTabs.includes("air") && tab === "air" && <AirTab />}
              {visibleTabs.includes("crypto") && tab === "crypto" && <CryptoTab />}
              {visibleTabs.includes("sandbox") && tab === "sandbox" && <SandboxTab />}
              {visibleTabs.includes("canvas") && tab === "canvas" && <CanvasTab />}
              {visibleTabs.includes("aerospace") && tab === "aerospace" && <AerospaceTab />}
              {visibleTabs.includes("searm") && tab === "searm" && <SearmTab />}
              {visibleTabs.includes("field") && tab === "field" && <FieldTab />}
              {visibleTabs.includes("devsdk") && tab === "devsdk" && <DevSdkTab />}
              {visibleTabs.includes("studio") && tab === "studio" && <StudioTab />}
              {visibleTabs.includes("antpay") && tab === "antpay" && <AntpayTab />}
              {visibleTabs.includes("pools") && tab === "pools" && <PoolsTab />}
              {visibleTabs.includes("integrations") && tab === "integrations" && <IntegrationsTab />}

              {/* Role-gated message for locked tabs */}
              {!visibleTabs.includes(tab) && (
                <div className="flex flex-col items-center justify-center gap-3 py-20 text-center">
                  <span className="text-4xl">🔒</span>
                  <div className="font-mono text-sm uppercase tracking-widest text-muted-foreground">
                    This module requires a higher role tier
                  </div>
                  <Button
                    onClick={handleUpgrade}
                    className="gap-2 font-mono text-xs uppercase tracking-widest"
                  >
                    <Rocket className="h-4 w-4" />
                    Upgrade to unlock
                  </Button>
                </div>
              )}
            </main>
          </>
        )}

        <IveFooter />
      </div>

      {/* Howzit onboarding modal */}
      <HowzitModal
        open={howzitOpen}
        onEnterStudio={handleEnterStudio}
        onDismiss={() => setHowzitOpen(false)}
      />

      {/* ZKP verification modal */}
      <ZkpModal
        open={zkpOpen}
        onClose={() => setZkpOpen(false)}
        onVerified={handleZkpVerified}
      />
    </div>
  );
}

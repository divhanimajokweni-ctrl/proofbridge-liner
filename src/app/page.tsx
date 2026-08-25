"use client";

import { useState } from "react";
import { IveHeader } from "@/components/ive/ive-header";
import { IveFooter } from "@/components/ive/ive-footer";
import { ParticleField } from "@/components/ive/particle-field";
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

export default function Home() {
  const [tab, setTab] = useState<string>("overview");

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
        <IveHeader activeTab={tab} onTab={setTab} />

        <main className="mx-auto w-full max-w-[1400px] flex-1 px-4 py-6 md:px-6 md:py-8">
          {tab === "overview" && <OverviewTab onJump={setTab} />}
          {tab === "hbk" && <HbkTab />}
          {tab === "facilitator" && <FacilitatorTab />}
          {tab === "integration" && <IntegrationTab />}
          {tab === "air" && <AirTab />}
          {tab === "crypto" && <CryptoTab />}
          {tab === "sandbox" && <SandboxTab />}
          {tab === "canvas" && <CanvasTab />}
          {tab === "aerospace" && <AerospaceTab />}
          {tab === "searm" && <SearmTab />}
          {tab === "field" && <FieldTab />}
        </main>

        <IveFooter />
      </div>
    </div>
  );
}

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

export default function Home() {
  const [tab, setTab] = useState<string>("overview");

  return (
    <div className="relative flex min-h-screen flex-col">
      {/* Ambient particle layer behind everything */}
      <div className="pointer-events-none fixed inset-0 z-0 opacity-50">
        <ParticleField density={45} />
      </div>

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
        </main>

        <IveFooter />
      </div>
    </div>
  );
}

import { NextResponse } from "next/server";
import {
  HBK_CAD_MODULES, OWNERSHIP_STRUCTURE, SPONSORSHIP_PACKAGES,
  RESOURCE_REGISTER, PROGRAMME_TIMELINE, VALIDATION_PHASES,
  CONSORTIUM_PARTNERS, CONSORTIUM_ARCHITECTURE, IP_OWNERSHIP,
  ROADMAP_PHASES, BATTERY_SPEC, WIRING_RAILS, THERMAL_THRESHOLDS,
  THERMAL_CONTAINMENT, PHASE2_BOM,
} from "@/lib/hbk/types";

export async function GET() {
  return NextResponse.json({
    modules: HBK_CAD_MODULES,
    ownership: OWNERSHIP_STRUCTURE,
    consortium: CONSORTIUM_PARTNERS,
    consortiumArchitecture: CONSORTIUM_ARCHITECTURE,
    ipOwnership: IP_OWNERSHIP,
    roadmap: ROADMAP_PHASES,
    packages: SPONSORSHIP_PACKAGES,
    resources: RESOURCE_REGISTER,
    timeline: PROGRAMME_TIMELINE,
    validation: VALIDATION_PHASES,
    phase2: {
      battery: BATTERY_SPEC,
      wiring: WIRING_RAILS,
      thermalThresholds: THERMAL_THRESHOLDS,
      thermalContainment: THERMAL_CONTAINMENT,
      bom: PHASE2_BOM,
    },
    meta: {
      project: "VVU HBK Mk-II",
      phase: "Phase 2 — Power & Thermal Architecture",
      capitalization: "VVU 100% — No equity dilution. Partnerships through contracts, not ownership.",
      compute: "AMD Ryzen AI Embedded APU / Kria SoM (Edge-Compute)",
      power: "8S4P 32700 LiFePO₄ (25.6V, 20Ah, 614Wh) — Daly 8S 20A BMS",
      thermal: "3-tier containment: TIM PCM → Structural conduction → Aerogel isolation (0.015 W/m·K)",
      enclosure: "IP67 Ruggedized Transit Shell (500x400x180mm outer dim) — Denel aluminum",
      chassis: "460×360×3mm 6061-T6 Anodized Aluminum Base Plate",
      wiring: "Star Ground P0–P3: Main Power (10 AWG) → System (14 AWG) → Clean Rail (18 AWG, galvanically isolated) → Signal (STP)",
      consortiumModel: "VVU coordinates the HBK Applied Research Programme through tailored agreements: Research Collaboration (academic), Grant (funding), Pilot (municipal), Technology Partnership (industrial).",
    },
  });
}

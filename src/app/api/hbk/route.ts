import { NextResponse } from "next/server";
import {
  HBK_CAD_MODULES, OWNERSHIP_STRUCTURE, SPONSORSHIP_PACKAGES,
  RESOURCE_REGISTER, PROGRAMME_TIMELINE, VALIDATION_PHASES,
  CONSORTIUM_PARTNERS, CONSORTIUM_ARCHITECTURE, IP_OWNERSHIP,
  ROADMAP_PHASES,
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
    meta: {
      project: "VVU HBK Mk-II",
      capitalization: "VVU 100% — No equity dilution. Partnerships through contracts, not ownership.",
      compute: "AMD Ryzen AI Embedded APU / Kria SoM (Edge-Compute)",
      enclosure: "IP67 Ruggedized Transit Shell (500x400x180mm outer dim)",
      chassis: "460×360×3mm 6061-T6 Anodized Aluminum Base Plate",
      consortiumModel: "VVU coordinates the HBK Applied Research Programme through tailored agreements: Research Collaboration (academic), Grant (funding), Pilot (municipal), Technology Partnership (industrial).",
    },
  });
}

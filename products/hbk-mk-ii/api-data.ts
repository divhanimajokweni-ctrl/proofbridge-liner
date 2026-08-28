import { NextResponse } from "next/server";
import {
  HBK_CAD_MODULES, EQUITY_SPLIT, SPONSORSHIP_PACKAGES,
  RESOURCE_REGISTER, PROGRAMME_TIMELINE, VALIDATION_PHASES,
} from "@/lib/hbk/types";

export async function GET() {
  return NextResponse.json({
    modules: HBK_CAD_MODULES,
    equity: EQUITY_SPLIT,
    packages: SPONSORSHIP_PACKAGES,
    resources: RESOURCE_REGISTER,
    timeline: PROGRAMME_TIMELINE,
    validation: VALIDATION_PHASES,
    meta: {
      project: "VVU HBK Mk-II",
      capitalization: "70% VVU / 20% UCT & Wits / 5% Direct Investors / 5% Unallocated (AMD Target)",
      compute: "AMD Ryzen AI Embedded APU / Kria SoM (Edge-Compute)",
      enclosure: "IP67 Ruggedized Transit Shell (500x400x180mm outer dim)",
      chassis: "460×360×3mm 6061-T6 Anodized Aluminum Base Plate",
    },
  });
}

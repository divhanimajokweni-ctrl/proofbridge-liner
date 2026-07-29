import { NextResponse } from "next/server";
import { RESOURCE_REGISTER } from "@/lib/hbk/types";

export async function GET() {
  const totalNeeded = RESOURCE_REGISTER.reduce((a, r) => a + r.qtyNeeded, 0);
  const totalCommitted = RESOURCE_REGISTER.reduce((a, r) => a + r.qtyCommitted, 0);
  const urgentCount = RESOURCE_REGISTER.filter(r => r.status === "urgent").length;
  const securedCount = RESOURCE_REGISTER.filter(r => r.status === "secured").length;

  return NextResponse.json({
    resources: RESOURCE_REGISTER,
    summary: {
      total: RESOURCE_REGISTER.length,
      totalNeeded,
      totalCommitted,
      urgentCount,
      securedCount,
      progressPct: totalNeeded > 0 ? ((totalCommitted / totalNeeded) * 100).toFixed(1) : "0",
    },
  });
}

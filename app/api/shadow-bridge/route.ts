import { NextRequest, NextResponse } from "next/server";

// GET /api/shadow-bridge?policyId=... — shadow bridge overview (mock data)
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const policyId = searchParams.get("policyId");

  const bridges = [
    {
      policy: { id: "pol-1", name: "grid_frequency_stability", domain: "smart_grid", shadowEnabled: true, takeoverLatencyMs: 250, authoritative: false },
      liveState: { frequency: 50.01, generation: [420, 380, 510], load: [410, 375, 500], losses: 12, thermal_headroom: 18, geo_region: "europe-west" },
      shadowState: { frequency: 50.04, generation: [425, 385, 515], load: [412, 378, 503], losses: 12, thermal_headroom: 17, geo_region: "europe-west" },
      liveInvariants: [{ passed: true, actual: "50.01 in [49.8, 50.2]", expected: "[49.8, 50.2]" }, { passed: true, actual: "1810 >= 1812", expected: "sum(generation) >= sum(load) + losses" }, { passed: true, actual: "18 >= 10", expected: ">=10" }],
      shadowInvariants: [{ passed: true, actual: "50.04 in [49.8, 50.2]", expected: "[49.8, 50.2]" }, { passed: true, actual: "1815 >= 1815", expected: "sum(generation) >= sum(load) + losses" }, { passed: true, actual: "17 >= 10", expected: ">=10" }],
      divergence: 0,
      events: [
        { id: "shadow-1", policyId: "pol-1", kind: "takeover", summary: "Shadow takeover on europe-west", divergence: 0.02, authoritative: false, createdAt: "2025-06-01T10:00:00Z" },
        { id: "shadow-2", policyId: "pol-1", kind: "whatif", summary: "What-if replay on europe-north", divergence: 0.15, authoritative: false, createdAt: "2025-05-28T10:00:00Z" },
        { id: "shadow-3", policyId: "pol-1", kind: "divergence", summary: "Twin divergence on europe-west", divergence: 0.08, authoritative: false, createdAt: "2025-05-25T10:00:00Z" },
      ],
    },
    {
      policy: { id: "pol-3", name: "fleet_safety_envelope", domain: "autonomous_vehicles", shadowEnabled: true, takeoverLatencyMs: 150, authoritative: true },
      liveState: { vehicle_id: "AV-042", separation: [3.2, 2.8, 4.1, 2.5, 5.0], speed: 64, braking_budget: 42, jerk: -1.8 },
      shadowState: { vehicle_id: "AV-042", separation: [3.0, 2.6, 3.9, 2.3, 4.8], speed: 67, braking_budget: 38, jerk: -2.0 },
      liveInvariants: [{ passed: true, actual: "2.5 >= 2.0", expected: ">=2.0" }, { passed: true, actual: "64 in [0, 120]", expected: "[0, 120]" }, { passed: true, actual: "42 >= 0", expected: ">=0" }, { passed: true, actual: "1.8 <= 2.5", expected: "<=2.5" }],
      shadowInvariants: [{ passed: true, actual: "2.3 >= 2.0", expected: ">=2.0" }, { passed: true, actual: "67 in [0, 120]", expected: "[0, 120]" }, { passed: true, actual: "38 >= 0", expected: ">=0" }, { passed: true, actual: "2.0 <= 2.5", expected: "<=2.5" }],
      divergence: 0,
      events: [
        { id: "shadow-4", policyId: "pol-3", kind: "handback", summary: "Authority handback on AV-042", divergence: 0.01, authoritative: true, createdAt: "2025-06-01T08:00:00Z" },
        { id: "shadow-5", policyId: "pol-3", kind: "replay", summary: "Episode replay on AV-042", divergence: 0.03, authoritative: true, createdAt: "2025-05-27T08:00:00Z" },
      ],
    },
    {
      policy: { id: "pol-4", name: "cold_chain_integrity", domain: "supply_chain", shadowEnabled: true, takeoverLatencyMs: 500, authoritative: false },
      liveState: { custody_stage: "transporter", temperature: 4.5, excursion_minutes: 8, humidity: 48 },
      shadowState: { custody_stage: "transporter", temperature: 4.8, excursion_minutes: 10, humidity: 46 },
      liveInvariants: [{ passed: true, actual: "4.5 in [2, 8]", expected: "[2, 8]" }, { passed: true, actual: "8 <= 30", expected: "<=30" }, { passed: true, actual: "48 in [35, 65]", expected: "[35, 65]" }],
      shadowInvariants: [{ passed: true, actual: "4.8 in [2, 8]", expected: "[2, 8]" }, { passed: true, actual: "10 <= 30", expected: "<=30" }, { passed: true, actual: "46 in [35, 65]", expected: "[35, 65]" }],
      divergence: 0,
      events: [
        { id: "shadow-6", policyId: "pol-4", kind: "replay", summary: "Episode replay on transporter", divergence: 0.05, authoritative: false, createdAt: "2025-05-30T10:00:00Z" },
        { id: "shadow-7", policyId: "pol-4", kind: "handback", summary: "Authority handback on producer", divergence: 0.02, authoritative: false, createdAt: "2025-05-25T10:00:00Z" },
      ],
    },
    {
      policy: { id: "pol-6", name: "water_treatment_safety", domain: "water_utility", shadowEnabled: true, takeoverLatencyMs: 120, authoritative: true },
      liveState: { plant_unit: "plant-north", chlorine_residual: 1.8, ph: 7.2, main_pressure: 6.4, turbidity: 0.4 },
      shadowState: { plant_unit: "plant-north", chlorine_residual: 1.85, ph: 7.25, main_pressure: 6.45, turbidity: 0.42 },
      liveInvariants: [{ passed: true, actual: "1.8 in [0.2, 4.0]", expected: "[0.2, 4.0]" }, { passed: true, actual: "7.2 in [6.5, 8.5]", expected: "[6.5, 8.5]" }, { passed: true, actual: "6.4 <= 8.5", expected: "<=8.5" }, { passed: true, actual: "0.4 <= 1.0", expected: "<=1.0" }],
      shadowInvariants: [{ passed: true, actual: "1.85 in [0.2, 4.0]", expected: "[0.2, 4.0]" }, { passed: true, actual: "7.25 in [6.5, 8.5]", expected: "[6.5, 8.5]" }, { passed: true, actual: "6.45 <= 8.5", expected: "<=8.5" }, { passed: true, actual: "0.42 <= 1.0", expected: "<=1.0" }],
      divergence: 0,
      events: [
        { id: "shadow-8", policyId: "pol-6", kind: "takeover", summary: "Shadow takeover on plant-north", divergence: 0.04, authoritative: true, createdAt: "2025-06-01T06:00:00Z" },
        { id: "shadow-9", policyId: "pol-6", kind: "whatif", summary: "What-if replay on plant-south", divergence: 0.1, authoritative: true, createdAt: "2025-05-28T06:00:00Z" },
      ],
    },
  ];

  const filtered = policyId
    ? bridges.filter((b) => b.policy.id === policyId)
    : bridges;

  return NextResponse.json({ bridges: filtered });
}

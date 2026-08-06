/**
 * HBK MK-II CAD registry — sourced from the demo-project KCL files.
 * These are the actual procedural geometry definitions for the
 * Hydro-Gateway case study. They are NOT redesigned during release freeze.
 */

export interface CadPart {
  id: string;
  name: string;
  file: string;
  description: string;
  parameters: { label: string; value: string; unit: string }[];
  kcl: string;
}

export const CAD_PARTS: CadPart[] = [
  {
    id: "hydro-gateway",
    name: "Hydro-Gateway Assembly",
    file: "cad/hydroGatewayMain.kcl",
    description:
      "Transportable skid; stationary during operation, with no onboard propulsion modeled. Imports skid base, pressure pipe, pump module, control/IO/power cabinets, service rack, meter pod, telemetry mast, and top beacon.",
    parameters: [
      { label: "Skid Top Z", value: "86", unit: "mm" },
      { label: "Pipe Axis Z", value: "310", unit: "mm" },
      { label: "Rear Equipment Y", value: "540", unit: "mm" },
    ],
    kcl: `// HBK MK-II Hydro-Gateway assembly
@settings(defaultLengthUnit = mm, kclVersion = 2.0, experimentalFeatures = allow)

import skidBase from "skid_base.kcl"
import allBodies as pressurePipePart from "pressure_pipe.kcl"
import allBodies as pumpModulePart from "pump_module.kcl"
import allBodies as edgeControlCabinetPart from "edge_control_cabinet.kcl"
import allBodies as powerBackupCabinetPart from "power_backup_cabinet.kcl"
import allBodies as ioCabinetPart from "io_cabinet.kcl"
import allBodies as serviceRackPart from "service_rack.kcl"
import allBodies as meterPodPart from "meter_pod.kcl"
import allBodies as telemetryMastPart from "telemetry_mast.kcl"
import allBodies as topBeaconPart from "top_beacon.kcl"

skidTopZ = 86mm
pipeAxisZ = 310mm
rearEquipmentY = 540mm

pressurePipe = pressurePipePart
  |> translate(x = -720mm, y = -690mm, z = pipeAxisZ, global = true)

pumpModule = pumpModulePart
  |> rotate(axis = Z, angle = 180deg, global = false)
  |> translate(x = 25mm, y = -690mm, z = 340mm, global = true)`,
  },
  {
    id: "pressure-pipe",
    name: "Pressure Pipe Spool",
    file: "cad/pressure_pipe.kcl",
    description:
      "Hollow DN260-style spool with 335 mm flanges and staged true bolt-hole cuts.",
    parameters: [
      { label: "Pipe Length", value: "760", unit: "mm" },
      { label: "Outer Diameter", value: "280", unit: "mm" },
      { label: "Inner Diameter", value: "260", unit: "mm" },
      { label: "Flange Outer", value: "335", unit: "mm" },
      { label: "Flange Thickness", value: "24", unit: "mm" },
      { label: "Bolt Circle", value: "290", unit: "mm" },
      { label: "Bolt Hole", value: "22", unit: "mm" },
    ],
    kcl: `// Pressure pipe spool
@settings(defaultLengthUnit = mm, kclVersion = 2.0, experimentalFeatures = allow)

pipeLength = 760mm
pipeOuterDiameter = 280mm
pipeInnerDiameter = 260mm
flangeOuterDiameter = 335mm
flangeThickness = 24mm
boltCircleDiameter = 290mm
boltHoleDiameter = 22mm
pipeColor = "#76838c"
flangeColor = "#9aa4aa"

pipeSectionSketch = sketch(on = XY) {
  outerCircle = circle(start = [var 140mm, var 0mm], center = [var 0mm, var 0mm])
  innerCircle = circle(start = [var 130mm, var 0mm], center = [var 0mm, var 0mm])
  coincident([outerCircle.center, ORIGIN])
  coincident([innerCircle.center, ORIGIN])
  diameter(outerCircle) == pipeOuterDiameter
  diameter(innerCircle) == pipeInnerDiameter
}
pipeShell = extrude(pipeSectionRegion, length = pipeLength, symmetric = true)
  |> appearance(color = pipeColor, metalness = 74, roughness = 38)`,
  },
  {
    id: "skid-base",
    name: "Skid Base",
    file: "cad/skid_base.kcl",
    description: "Transportable structural base for the Hydro-Gateway skid.",
    parameters: [
      { label: "Material", value: "REQUIRES ENGINEERING DATA", unit: "" },
      { label: "Load Class", value: "REQUIRES ENGINEERING DATA", unit: "" },
    ],
    kcl: `// Skid base — transportable structural platform
@settings(defaultLengthUnit = mm, kclVersion = 2.0)

// Structural dimensions are a parametric study; load class REQUIRES ENGINEERING DATA.
skidLength = 1600mm
skidWidth = 1200mm
skidHeight = 86mm`,
  },
  {
    id: "pump-module",
    name: "Pump Module",
    file: "cad/pump_module.kcl",
    description: "Hydraulic pump module — pressure class REQUIRES ENGINEERING DATA.",
    parameters: [
      { label: "Pressure Class", value: "REQUIRES ENGINEERING DATA", unit: "" },
      { label: "Flow Range", value: "REQUIRES ENGINEERING DATA", unit: "" },
    ],
    kcl: `// Pump module
@settings(defaultLengthUnit = mm, kclVersion = 2.0)
// Pressure class and flow range REQUIRES ENGINEERING DATA.`,
  },
];

/** HBK MK-II three-tier architecture summary (from architecture spec). */
export const HBK_ARCHITECTURE = {
  tiers: [
    {
      id: "tier-1",
      name: "Tier 1 — HBK Mk-II Research Instrument",
      mission:
        "Authoritative field instrument. Acquires deterministic observations, applies active calibration, records evidence, enforces all hardware safety constraints, communicates without depending on external infrastructure.",
      owns: [
        "Field sensors and signal acquisition",
        "Sampling clocks and acquisition timing",
        "Local non-volatile storage",
        "Hardware watchdogs and independent safety circuits",
        "Approved edge inference execution",
        "Local evidence packaging",
      ],
      requiresEngineeringData: [
        "Sensor suite and hydraulic wetted path",
        "Pressure class and flow range",
        "Water-contact materials",
        "Backflow protection",
        "Integrated actuation authority",
      ],
    },
    {
      id: "tier-2",
      name: "Tier 2 — Local Research Workstation",
      mission:
        "Temporary local research workstation, not a process controller. Provides calibration, experiment design, and evidence review.",
      owns: [
        "Calibration package authoring",
        "Experiment design and parameterization",
        "Evidence review and export",
        "Bayesian prior selection (research products only)",
      ],
      requiresEngineeringData: ["Workstation hardware class", "Local storage retention policy"],
    },
    {
      id: "tier-3",
      name: "Tier 3 — Long-term Scientific Platform",
      mission:
        "Long-term scientific platform. Never sends runtime field-equipment commands. Preserves raw observations separately from derived inference products.",
      owns: [
        "Long-term observation archive",
        "Derived scientific product registry",
        "Cross-experiment provenance",
      ],
      requiresEngineeringData: ["Replication topology", "Retention compliance class"],
    },
  ],
  rules: [
    "Tier 1 is autonomous and remains safe without Tier 2 or Tier 3.",
    "Tier 2 is a temporary local research workstation, not a process controller.",
    "Tier 3 never sends runtime field-equipment commands.",
    "Every authoritative responsibility has one owner.",
    "Raw observations are preserved separately from derived inference products.",
    "Bayesian outputs are derived scientific products, not substitutes for deterministic evidence.",
    "Safety enforcement occurs inside Tier 1 and cannot be bypassed by Tier 2.",
    "Cloud availability is never a Tier 1 safety or acquisition dependency.",
  ],
};

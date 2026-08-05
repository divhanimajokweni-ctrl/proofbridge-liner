"use client";

import { motion } from "framer-motion";
import {
  Boxes,
  FileCode2,
  Ruler,
  Crosshair,
  CircleDashed,
  TriangleAlert,
  type LucideIcon,
} from "lucide-react";
import { useIveStore } from "@/store/useIveStore";
import { PanelFrame, SectionLabel, StatusPill, MonoTable } from "../primitives";
import type { ReactElement, ReactNode } from "react";
import type { CadPart } from "@/lib/ive/cad";

/* ------------------------------------------------------------------ */
/* KCL token renderer                                                  */
/* ------------------------------------------------------------------ */

const KCL_KEYWORDS = new Set([
  "import",
  "from",
  "as",
  "sketch",
  "on",
  "circle",
  "line",
  "extrude",
  "revolve",
  "translate",
  "rotate",
  "scale",
  "appearance",
  "coincident",
  "diameter",
  "start",
  "center",
  "axis",
  "angle",
  "length",
  "symmetric",
  "global",
  "color",
  "metalness",
  "roughness",
  "let",
  "fn",
  "return",
  "var",
]);

function tokenizeKclLine(line: string): ReactNode[] {
  const nodes: ReactNode[] = [];
  const regex =
    /(\/\/[^\n]*)|("(?:[^"\\]|\\.)*")|(-?\d+(?:\.\d+)?(?:mm|deg)?)|([A-Za-z_][A-Za-z0-9_]*)|(\s+)|([^\sA-Za-z0-9_"//]+)/g;
  let m: RegExpExecArray | null;
  let key = 0;
  while ((m = regex.exec(line)) !== null) {
    if (m[1]) {
      nodes.push(
        <span key={key++} className="italic" style={{ color: "rgba(255,255,255,0.32)" }}>
          {m[1]}
        </span>,
      );
    } else if (m[2]) {
      nodes.push(
        <span key={key++} style={{ color: "var(--ive-proven)" }}>
          {m[2]}
        </span>,
      );
    } else if (m[3]) {
      nodes.push(
        <span key={key++} style={{ color: "var(--ive-gold)" }}>
          {m[3]}
        </span>,
      );
    } else if (m[4]) {
      if (KCL_KEYWORDS.has(m[4])) {
        nodes.push(
          <span key={key++} className="font-semibold" style={{ color: "#b23dff" }}>
            {m[4]}
          </span>,
        );
      } else {
        nodes.push(
          <span key={key++} style={{ color: "rgba(255,255,255,0.85)" }}>
            {m[4]}
          </span>,
        );
      }
    } else if (m[5]) {
      nodes.push(<span key={key++}>{m[5]}</span>);
    } else if (m[6]) {
      nodes.push(
        <span key={key++} style={{ color: "rgba(255,255,255,0.45)" }}>
          {m[6]}
        </span>,
      );
    }
  }
  return nodes;
}

function KclBlock({ kcl }: { kcl: string }) {
  const lines = kcl.split("\n");
  return (
    <div className="ive-scroll overflow-x-auto rounded-lg border border-white/[0.06] bg-black/40">
      <pre className="ive-mono min-w-full py-3 text-[11px] leading-relaxed">
        <code className="block">
          {lines.map((line, i) => (
            <div key={i} className="flex hover:bg-white/[0.02]">
              <span className="ive-mono w-10 shrink-0 select-none pr-3 text-right text-[9.5px] text-muted-foreground/35">
                {i + 1}
              </span>
              <span className="whitespace-pre pr-4">{tokenizeKclLine(line)}</span>
            </div>
          ))}
        </code>
      </pre>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* SVG wireframes                                                      */
/* ------------------------------------------------------------------ */

const GOLD = "#C9A84C";
const GOLD_DIM = "rgba(201,168,76,0.5)";
const GOLD_FAINT = "rgba(201,168,76,0.2)";
const BLOCKED = "#ff4d5f";

/** Hydro-gateway assembly — skid rectangle with positioned part markers. */
function HydroGatewayWireframe() {
  // viewBox 0 0 400 280 — skid rectangle scaled from 1600x1200 (skidHeight=86)
  const skid = { x: 40, y: 200, w: 320, h: 28 };
  // Marker positions approximated from the KCL translations
  const markers = [
    { id: "pipe", label: "Pressure Pipe", x: 70, y: 110, accent: GOLD },
    { id: "pump", label: "Pump Module", x: 210, y: 130, accent: GOLD },
    { id: "edge", label: "Edge Ctrl Cabinet", x: 310, y: 100, accent: GOLD },
    { id: "power", label: "Power Backup", x: 320, y: 170, accent: GOLD },
    { id: "io", label: "IO Cabinet", x: 70, y: 170, accent: GOLD },
    { id: "rack", label: "Service Rack", x: 180, y: 180, accent: GOLD },
    { id: "meter", label: "Meter Pod", x: 130, y: 90, accent: GOLD },
    { id: "mast", label: "Telemetry Mast", x: 360, y: 60, accent: GOLD },
    { id: "beacon", label: "Top Beacon", x: 360, y: 30, accent: GOLD },
  ];
  return (
    <svg viewBox="0 0 400 280" className="h-full w-full" preserveAspectRatio="xMidYMid meet">
      <defs>
        <pattern id="gw-grid" width="20" height="20" patternUnits="userSpaceOnUse">
          <path d="M 20 0 L 0 0 0 20" fill="none" stroke={GOLD_FAINT} strokeWidth="0.3" />
        </pattern>
      </defs>
      <rect x="0" y="0" width="400" height="280" fill="url(#gw-grid)" opacity="0.5" />
      {/* coordinate axes */}
      <line x1="20" y1="260" x2="60" y2="260" stroke={GOLD_DIM} strokeWidth="0.5" />
      <line x1="20" y1="260" x2="20" y2="220" stroke={GOLD_DIM} strokeWidth="0.5" />
      <text x="62" y="262" fill={GOLD_DIM} fontSize="7" className="ive-mono">X</text>
      <text x="14" y="216" fill={GOLD_DIM} fontSize="7" className="ive-mono">Z</text>

      {/* Skid base */}
      <motion.rect
        x={skid.x}
        y={skid.y}
        width={skid.w}
        height={skid.h}
        fill="rgba(201,168,76,0.05)"
        stroke={GOLD}
        strokeWidth="1"
        initial={{ pathLength: 0, opacity: 0 }}
        animate={{ pathLength: 1, opacity: 1 }}
        transition={{ duration: 1, ease: "easeInOut" }}
      />
      <text x={skid.x + skid.w / 2} y={skid.y + skid.h + 12} fill={GOLD_DIM} fontSize="7" textAnchor="middle" className="ive-mono">
        skid_base · 1600 × 1200 mm
      </text>

      {/* Pipe axis line */}
      <motion.line
        x1="60"
        y1="110"
        x2="340"
        y2="110"
        stroke={GOLD_DIM}
        strokeWidth="0.5"
        strokeDasharray="3 3"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 0.8, delay: 0.4 }}
      />
      <text x="64" y="105" fill={GOLD_DIM} fontSize="6.5" className="ive-mono">pipe axis Z = 310mm</text>

      {/* Markers */}
      {markers.map((m, i) => (
        <motion.g
          key={m.id}
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.6 + i * 0.05, duration: 0.3 }}
        >
          <circle cx={m.x} cy={m.y} r="3.5" fill={`${m.accent}25`} stroke={m.accent} strokeWidth="0.8" />
          <circle cx={m.x} cy={m.y} r="1" fill={m.accent} />
          <line x1={m.x} y1={m.y} x2={m.x} y2={skid.y} stroke={GOLD_FAINT} strokeWidth="0.3" strokeDasharray="1 2" />
          <text x={m.x + 6} y={m.y + 2} fill={GOLD_DIM} fontSize="6" className="ive-mono">
            {m.label}
          </text>
        </motion.g>
      ))}
    </svg>
  );
}

/** Pressure pipe — concentric circles + flange + bolt holes. */
function PressurePipeWireframe() {
  // outer 280mm, inner 260mm, flange 335mm, bolt circle 290mm, bolt hole 22mm
  const cx = 200;
  const cy = 140;
  // Scale: 1mm ≈ 0.5px, so flange 335mm → 167.5px radius (max)
  const scale = 0.45;
  const rFlange = 335 * scale / 2;
  const rBolt = 290 * scale / 2;
  const rOuter = 280 * scale / 2;
  const rInner = 260 * scale / 2;
  const boltR = 22 * scale / 2;
  const boltCount = 8;

  return (
    <svg viewBox="0 0 400 280" className="h-full w-full" preserveAspectRatio="xMidYMid meet">
      <defs>
        <pattern id="pp-grid" width="20" height="20" patternUnits="userSpaceOnUse">
          <path d="M 20 0 L 0 0 0 20" fill="none" stroke={GOLD_FAINT} strokeWidth="0.3" />
        </pattern>
      </defs>
      <rect x="0" y="0" width="400" height="280" fill="url(#pp-grid)" opacity="0.5" />

      {/* center crosshair */}
      <line x1={cx - rFlange - 10} y1={cy} x2={cx + rFlange + 10} y2={cy} stroke={GOLD_FAINT} strokeWidth="0.4" strokeDasharray="2 3" />
      <line x1={cx} y1={cy - rFlange - 10} x2={cx} y2={cy + rFlange + 10} stroke={GOLD_FAINT} strokeWidth="0.4" strokeDasharray="2 3" />

      {/* Flange */}
      <motion.circle
        cx={cx}
        cy={cy}
        r={rFlange}
        fill="rgba(201,168,76,0.04)"
        stroke={GOLD_DIM}
        strokeWidth="0.8"
        initial={{ pathLength: 0, opacity: 0 }}
        animate={{ pathLength: 1, opacity: 1 }}
        transition={{ duration: 1.1, ease: "easeInOut" }}
      />
      {/* Bolt circle */}
      <motion.circle
        cx={cx}
        cy={cy}
        r={rBolt}
        fill="none"
        stroke={GOLD_FAINT}
        strokeWidth="0.5"
        strokeDasharray="2 2"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 1, delay: 0.2 }}
      />
      {/* Outer pipe wall */}
      <motion.circle
        cx={cx}
        cy={cy}
        r={rOuter}
        fill="rgba(201,168,76,0.08)"
        stroke={GOLD}
        strokeWidth="1.1"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 1, delay: 0.3 }}
      />
      {/* Inner bore */}
      <motion.circle
        cx={cx}
        cy={cy}
        r={rInner}
        fill="rgba(0,0,0,0.6)"
        stroke={GOLD_DIM}
        strokeWidth="0.7"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 0.9, delay: 0.5 }}
      />

      {/* Bolt holes */}
      {Array.from({ length: boltCount }).map((_, i) => {
        const a = (i / boltCount) * Math.PI * 2;
        const bx = cx + Math.cos(a) * rBolt;
        const by = cy + Math.sin(a) * rBolt;
        return (
          <motion.circle
            key={i}
            cx={bx}
            cy={by}
            r={boltR}
            fill="rgba(0,0,0,0.85)"
            stroke={GOLD_DIM}
            strokeWidth="0.5"
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.8 + i * 0.05, duration: 0.25 }}
          />
        );
      })}

      {/* Labels */}
      <text x={cx} y={cy - rFlange - 8} fill={GOLD} fontSize="7" textAnchor="middle" className="ive-mono">
        flange Ø 335mm
      </text>
      <text x={cx + rFlange + 6} y={cy + 3} fill={GOLD_DIM} fontSize="6.5" className="ive-mono">
        outer Ø 280
      </text>
      <text x={cx + 4} y={cy + 3} fill={GOLD_DIM} fontSize="6.5" className="ive-mono">
        bore Ø 260
      </text>
      <text x={cx} y={cy + rFlange + 14} fill={GOLD_DIM} fontSize="6.5" textAnchor="middle" className="ive-mono">
        bolt circle Ø 290 · 8 × Ø22
      </text>
    </svg>
  );
}

/** Skid base — rectangle with dimension annotations. */
function SkidBaseWireframe() {
  return (
    <svg viewBox="0 0 400 280" className="h-full w-full" preserveAspectRatio="xMidYMid meet">
      <defs>
        <pattern id="sb-grid" width="20" height="20" patternUnits="userSpaceOnUse">
          <path d="M 20 0 L 0 0 0 20" fill="none" stroke={GOLD_FAINT} strokeWidth="0.3" />
        </pattern>
      </defs>
      <rect x="0" y="0" width="400" height="280" fill="url(#sb-grid)" opacity="0.5" />

      {/* Skid outline 1600x1200 → 320x240 */}
      <motion.rect
        x="40"
        y="40"
        width="320"
        height="200"
        fill="rgba(201,168,76,0.05)"
        stroke={GOLD}
        strokeWidth="1.1"
        initial={{ pathLength: 0, opacity: 0 }}
        animate={{ pathLength: 1, opacity: 1 }}
        transition={{ duration: 1.2, ease: "easeInOut" }}
      />

      {/* Mounting points */}
      {[
        [60, 60],
        [340, 60],
        [60, 220],
        [340, 220],
      ].map(([x, y], i) => (
        <motion.circle
          key={i}
          cx={x}
          cy={y}
          r="3"
          fill="rgba(0,0,0,0.7)"
          stroke={GOLD}
          strokeWidth="0.6"
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.8 + i * 0.08 }}
        />
      ))}

      {/* Dimension lines */}
      <motion.g
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.2, duration: 0.4 }}
      >
        <line x1="40" y1="25" x2="360" y2="25" stroke={GOLD_DIM} strokeWidth="0.5" />
        <line x1="40" y1="20" x2="40" y2="30" stroke={GOLD_DIM} strokeWidth="0.5" />
        <line x1="360" y1="20" x2="360" y2="30" stroke={GOLD_DIM} strokeWidth="0.5" />
        <text x="200" y="20" fill={GOLD} fontSize="7" textAnchor="middle" className="ive-mono">
          length · 1600 mm
        </text>

        <line x1="25" y1="40" x2="25" y2="240" stroke={GOLD_DIM} strokeWidth="0.5" />
        <line x1="20" y1="40" x2="30" y2="40" stroke={GOLD_DIM} strokeWidth="0.5" />
        <line x1="20" y1="240" x2="30" y2="240" stroke={GOLD_DIM} strokeWidth="0.5" />
        <text x="20" y="145" fill={GOLD} fontSize="7" textAnchor="middle" transform="rotate(-90 20 145)" className="ive-mono">
          width · 1200 mm
        </text>
        <text x="200" y="265" fill={GOLD_DIM} fontSize="7" textAnchor="middle" className="ive-mono">
          height · 86 mm · load class REQUIRES ENGINEERING DATA
        </text>
      </motion.g>
    </svg>
  );
}

/** Pump module — stylized motor + pump housing. */
function PumpModuleWireframe() {
  const cx = 200;
  const cy = 140;
  return (
    <svg viewBox="0 0 400 280" className="h-full w-full" preserveAspectRatio="xMidYMid meet">
      <defs>
        <pattern id="pm-grid" width="20" height="20" patternUnits="userSpaceOnUse">
          <path d="M 20 0 L 0 0 0 20" fill="none" stroke={GOLD_FAINT} strokeWidth="0.3" />
        </pattern>
        <marker id="flow-arrow" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
          <path d="M 0 0 L 6 3 L 0 6 z" fill={BLOCKED} />
        </marker>
      </defs>
      <rect x="0" y="0" width="400" height="280" fill="url(#pm-grid)" opacity="0.5" />

      {/* Motor housing (rectangle) */}
      <motion.rect
        x="60"
        y="105"
        width="120"
        height="70"
        rx="4"
        fill="rgba(201,168,76,0.06)"
        stroke={GOLD}
        strokeWidth="1"
        initial={{ pathLength: 0, opacity: 0 }}
        animate={{ pathLength: 1, opacity: 1 }}
        transition={{ duration: 1 }}
      />
      <text x="120" y="145" fill={GOLD_DIM} fontSize="7" textAnchor="middle" className="ive-mono">
        motor
      </text>

      {/* Coupler */}
      <motion.line
        x1="180"
        y1="140"
        x2="195"
        y2="140"
        stroke={GOLD}
        strokeWidth="2"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 0.4, delay: 0.5 }}
      />

      {/* Pump housing (circle) */}
      <motion.circle
        cx={cx + 30}
        cy={cy}
        r="40"
        fill="rgba(201,168,76,0.05)"
        stroke={GOLD}
        strokeWidth="1"
        initial={{ pathLength: 0, opacity: 0 }}
        animate={{ pathLength: 1, opacity: 1 }}
        transition={{ duration: 1, delay: 0.6 }}
      />
      {/* Impeller */}
      <motion.circle
        cx={cx + 30}
        cy={cy}
        r="20"
        fill="none"
        stroke={GOLD_DIM}
        strokeWidth="0.6"
        strokeDasharray="3 2"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 0.8, delay: 0.9 }}
      />
      {Array.from({ length: 6 }).map((_, i) => {
        const a = (i / 6) * Math.PI * 2;
        return (
          <motion.line
            key={i}
            x1={cx + 30}
            y1={cy}
            x2={cx + 30 + Math.cos(a) * 20}
            y2={cy + Math.sin(a) * 20}
            stroke={GOLD_DIM}
            strokeWidth="0.5"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 0.5, delay: 1 + i * 0.05 }}
          />
        );
      })}

      {/* Discharge port */}
      <motion.rect
        x={cx + 60}
        y={cy - 12}
        width="40"
        height="24"
        fill="rgba(201,168,76,0.04)"
        stroke={GOLD_DIM}
        strokeWidth="0.8"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 0.6, delay: 1.2 }}
      />

      {/* Flow arrow */}
      <motion.path
        d={`M ${cx + 70} ${cy} L ${cx + 95} ${cy}`}
        stroke={BLOCKED}
        strokeWidth="1.2"
        markerEnd="url(#flow-arrow)"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 0.5, delay: 1.5 }}
      />

      <text x={200} y={250} fill={BLOCKED} fontSize="7" textAnchor="middle" className="ive-mono">
        pressure class + flow range · REQUIRES ENGINEERING DATA
      </text>
      <text x="200" y="35" fill={GOLD_DIM} fontSize="7" textAnchor="middle" className="ive-mono">
        pump_module · parametric study
      </text>
    </svg>
  );
}

const WIREFRAMES: Record<string, () => ReactElement> = {
  "hydro-gateway": HydroGatewayWireframe,
  "pressure-pipe": PressurePipeWireframe,
  "skid-base": SkidBaseWireframe,
  "pump-module": PumpModuleWireframe,
};

const PART_ICONS: Record<string, LucideIcon> = {
  "hydro-gateway": Boxes,
  "pressure-pipe": CircleDashed,
  "skid-base": Ruler,
  "pump-module": Crosshair,
};

/* ------------------------------------------------------------------ */
/* Panel                                                               */
/* ------------------------------------------------------------------ */

export function CadViewerPanel() {
  const cadParts = useIveStore((s) => s.hbk.cadParts);
  const activePartId = useIveStore((s) => s.hbk.activePartId);
  const setActivePartId = useIveStore((s) => s.hbk.setActivePartId);
  const activePart: CadPart | undefined =
    cadParts.find((p) => p.id === activePartId) ?? cadParts[0];

  if (!activePart) return null;

  const Wireframe = WIREFRAMES[activePart.id] ?? HydroGatewayWireframe;
  const PartIcon = PART_ICONS[activePart.id] ?? FileCode2;

  const paramRows = activePart.parameters.map((p) => ({
    param: p.label,
    value:
      p.value === "REQUIRES ENGINEERING DATA" ? (
        <span style={{ color: "var(--ive-blocked)" }}>{p.value}</span>
      ) : (
        <span style={{ color: "var(--ive-gold)" }}>{p.value}</span>
      ),
    unit: p.unit || "—",
  }));

  return (
    <PanelFrame
      title="CAD Viewer"
      tag="CAD"
      accent="#C9A84C"
      mission="Procedural KCL geometry inspection for the Hydro-Gateway."
      actions={<StatusPill state="Parametric Study · KCL 2.0" accent="var(--ive-gold)" />}
    >
      {/* Part selector tabs */}
      <div className="ive-scroll -mx-1 flex gap-1.5 overflow-x-auto px-1 pb-1">
        {cadParts.map((p) => {
          const Icon = PART_ICONS[p.id] ?? FileCode2;
          const active = p.id === activePart.id;
          return (
            <button
              key={p.id}
              onClick={() => setActivePartId(p.id)}
              className={`group inline-flex flex-none items-center gap-2 rounded-md border px-3 py-2 text-left transition-all ${
                active
                  ? "border-[var(--ive-gold)]/40 bg-[var(--ive-gold)]/10"
                  : "border-white/[0.06] bg-white/[0.015] hover:border-white/15 hover:bg-white/[0.03]"
              }`}
            >
              <Icon
                className="h-3.5 w-3.5"
                style={{ color: active ? "var(--ive-gold)" : "rgba(255,255,255,0.5)" }}
              />
              <div className="min-w-0">
                <div
                  className={`text-[11px] font-semibold ${
                    active ? "text-[var(--ive-gold)]" : "text-foreground/80"
                  }`}
                >
                  {p.name}
                </div>
                <div className="ive-mono truncate text-[8.5px] text-muted-foreground/60">
                  {p.file}
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Main viewer grid */}
      <div className="mt-4 grid gap-4 lg:grid-cols-[minmax(0,1fr)_300px]">
        {/* Wireframe */}
        <motion.div
          key={activePart.id}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          className="ive-surface relative overflow-hidden rounded-xl border border-white/[0.06] p-3"
        >
          <div className="absolute left-3 top-3 z-10 flex items-center gap-2">
            <PartIcon className="h-3.5 w-3.5" style={{ color: "var(--ive-gold)" }} />
            <span className="ive-mono text-[10px] uppercase tracking-wider text-muted-foreground">
              {activePart.name} · wireframe
            </span>
          </div>
          <div className="absolute right-3 top-3 z-10">
            <StatusPill state="SVG · not FEA" accent="#8b949e" />
          </div>
          <div className="aspect-[10/7] w-full">
            <Wireframe />
          </div>
          <div className="ive-mono mt-2 flex items-center justify-between text-[8.5px] text-muted-foreground/50">
            <span>viewBox 0 0 400 280 · gold stroke on dark</span>
            <span>parametric · not at-scale assembly</span>
          </div>
        </motion.div>

        {/* Side: parameters */}
        <div className="flex flex-col gap-4">
          <div>
            <SectionLabel>Parameters · {activePart.id}</SectionLabel>
            <MonoTable
              cols={[
                { key: "param", label: "Parameter" },
                { key: "value", label: "Value" },
                { key: "unit", label: "Unit", className: "text-right" },
              ]}
              rows={paramRows}
            />
          </div>

          <div className="ive-surface rounded-lg border border-white/[0.06] p-3.5">
            <div className="ive-mono mb-2 text-[9px] uppercase tracking-[0.16em] text-muted-foreground/70">
              Geometry Source
            </div>
            <div className="flex items-center gap-2">
              <FileCode2 className="h-3.5 w-3.5" style={{ color: "var(--ive-gold)" }} />
              <span className="ive-mono text-[11px] text-foreground">{activePart.file}</span>
            </div>
            <div className="ive-divider mt-3 h-px w-full" />
            <p className="ive-mono mt-2 text-[9.5px] leading-relaxed text-muted-foreground/70">
              Procedural geometry generated from KCL. Wireframe visualization is illustrative — not
              at-scale assembly output.
            </p>
          </div>
        </div>
      </div>

      {/* KCL source */}
      <div className="mt-5">
        <SectionLabel>KCL Source · {activePart.file}</SectionLabel>
        <KclBlock kcl={activePart.kcl} />
      </div>

      {/* Boundary note */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="mt-5 flex items-start gap-3 rounded-lg border border-[var(--ive-blocked)]/25 bg-[var(--ive-blocked)]/[0.04] p-4"
      >
        <TriangleAlert
          className="mt-0.5 h-4 w-4 flex-none"
          style={{ color: "var(--ive-blocked)" }}
        />
        <p className="ive-mono text-[10.5px] leading-relaxed text-muted-foreground/85">
          CAD is a parametric engineering study. Load class and material{" "}
          <span style={{ color: "var(--ive-blocked)" }}>REQUIRES ENGINEERING DATA</span>. No CAD
          redesign is authorized during release harmonization.
        </p>
      </motion.div>
    </PanelFrame>
  );
}

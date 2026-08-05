"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useIveStore } from "@/store/useIveStore";
import { VVULogo } from "../VVULogo";

/**
 * BootSequence
 * ------------
 * The cinematic IVE launch sequence. Stages (release freeze):
 *
 *   VVU Logo → Three Rings → Fibonacci Trust Sphere → Evidence Nodes
 *   → Evidence Runtime → Zoo Engine → Proof Runtime → Trust Runtime
 *   → IVE Workspace
 *
 * - Smooth, 60fps (CSS / RAF canvas only; no setState-in-render).
 * - Responsive (scales via viewBox + clamp).
 * - Interrupt-safe: Esc or the Skip button jumps to the workspace.
 * - No console errors (canvas guarded, all effects cleaned up).
 */

export function BootSequence() {
  const stages = useIveStore((s) => s.bootStages);
  const bootStageIndex = useIveStore((s) => s.bootStageIndex);
  const advanceBoot = useIveStore((s) => s.advanceBoot);
  const completeBoot = useIveStore((s) => s.completeBoot);
  const skipBoot = useIveStore((s) => s.skipBoot);

  const [localStage, setLocalStage] = useState(0);
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  // Drive the boot progression with the golden-ratio cadence.
  useEffect(() => {
    timersRef.current.forEach(clearTimeout);
    timersRef.current = [];

    if (localStage >= stages.length) {
      const t = setTimeout(() => completeBoot(), 280);
      timersRef.current.push(t);
      return;
    }

    const stage = stages[localStage];
    const t = setTimeout(() => {
      setLocalStage((s) => s + 1);
      advanceBoot();
    }, stage.durationMs);
    timersRef.current.push(t);

    return () => timersRef.current.forEach(clearTimeout);
  }, [localStage, stages, advanceBoot, completeBoot]);

  const current = stages[Math.min(localStage, stages.length - 1)];
  const progress = Math.min(localStage / (stages.length - 1), 1);

  return (
    <div className="ive-scanline relative flex h-full w-full flex-col items-center justify-center overflow-hidden">
      {/* Particle field canvas — slow-drifting evidence motes */}
      <BootParticleField />

      {/* Ambient grid + radial glow */}
      <div className="ive-grid-bg pointer-events-none absolute inset-0 opacity-40" />
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(circle at 50% 45%, rgba(201,168,76,0.10), transparent 55%)",
        }}
      />
      {/* Vignette for depth */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse at 50% 50%, transparent 40%, rgba(0,0,0,0.4) 100%)",
        }}
      />

      {/* Stage stage visual */}
      <div className="relative flex h-[280px] w-full items-center justify-center sm:h-[340px]">
        <AnimatePresence mode="wait">
          <BootStageVisual key={current.id} stageId={current.id} />
        </AnimatePresence>
      </div>

      {/* Stage label */}
      <div className="relative z-10 mt-6 flex flex-col items-center gap-2 px-6 text-center">
        <AnimatePresence mode="wait">
          <motion.div
            key={current.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.3 }}
            className="flex flex-col items-center gap-1.5"
          >
            <div className="ive-mono text-[10px] uppercase tracking-[0.32em] text-[var(--ive-gold)]/80">
              IVE · {String(localStage + 1).padStart(2, "0")} / {String(stages.length).padStart(2, "0")}
            </div>
            <h1 className="font-sans text-lg font-bold tracking-tight text-foreground sm:text-xl">
              {current.label}
            </h1>
            <p className="ive-mono max-w-[420px] text-[11px] leading-relaxed text-muted-foreground">
              {current.detail}
            </p>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Progress rail */}
      <div className="relative z-10 mt-7 flex w-full max-w-[520px] flex-col gap-2 px-6">
        <div className="h-[3px] w-full overflow-hidden rounded-full bg-white/[0.06]">
          <motion.div
            className="h-full rounded-full"
            style={{ background: "linear-gradient(90deg, #8A9A5B, #C9A84C, #CC7722)" }}
            animate={{ width: `${progress * 100}%` }}
            transition={{ duration: 0.5, ease: "easeOut" }}
          />
        </div>
        <div className="flex justify-between">
          {stages.map((s, i) => (
            <div
              key={s.id}
              className="h-1 w-1 rounded-full transition-colors duration-300"
              style={{
                background:
                  i < localStage
                    ? "var(--ive-gold)"
                    : i === localStage
                      ? "rgba(201,168,76,0.6)"
                      : "rgba(255,255,255,0.12)",
              }}
            />
          ))}
        </div>
      </div>

      {/* Skip control */}
      <button
        onClick={skipBoot}
        className="ive-mono absolute bottom-6 right-6 z-20 rounded-md border border-white/10 bg-white/[0.03] px-3 py-1.5 text-[10px] uppercase tracking-[0.16em] text-muted-foreground transition-colors hover:border-[var(--ive-gold)]/40 hover:text-foreground"
      >
        Skip <kbd className="ml-1 rounded border border-white/10 bg-white/[0.04] px-1 py-0.5 text-[9px]">Esc</kbd>
      </button>

      {/* Tagline footer */}
      <div className="ive-mono absolute bottom-6 left-6 z-20 hidden text-[9px] uppercase tracking-[0.24em] text-muted-foreground/50 sm:block">
        Engineer systems that can prove themselves.
      </div>
    </div>
  );
}

/* ---------- per-stage visuals ---------- */

function BootStageVisual({ stageId }: { stageId: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.92 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.96 }}
      transition={{ duration: 0.45, ease: "easeOut" }}
      className="flex h-full w-full items-center justify-center"
    >
      {stageId === "logo" && <LogoStage />}
      {stageId === "rings" && <RingsStage />}
      {stageId === "sphere" && <SphereStage />}
      {stageId === "evidence-nodes" && <NodesStage />}
      {stageId === "evidence-runtime" && <RuntimeStage />}
      {stageId === "zoo-engine" && <ZooStage />}
      {stageId === "proof-runtime" && <ProofStage />}
      {stageId === "trust-runtime" && <TrustStage />}
      {stageId === "workspace" && <WorkspaceStage />}
    </motion.div>
  );
}

function LogoStage() {
  return (
    <div className="flex flex-col items-center gap-5">
      <VVULogo size={120} animated showCore />
      <motion.div
        className="ive-mono text-[11px] uppercase tracking-[0.4em] text-[var(--ive-gold)]/70"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.9, duration: 0.5 }}
      >
        VVU · IVE
      </motion.div>
    </div>
  );
}

function RingsStage() {
  return (
    <div className="relative h-[220px] w-[220px]">
      {[0, 1, 2].map((i) => (
        <motion.div
          key={i}
          className="absolute inset-0 rounded-full border"
          style={{
            borderColor: ["#8A9A5B", "#CC7722", "#E2E3DB"][i] + "55",
          }}
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.8, delay: i * 0.18, ease: "easeOut" }}
        >
          <motion.div
            className="absolute inset-[-12px] rounded-full border border-dashed"
            style={{ borderColor: ["#8A9A5B", "#CC7722", "#E2E3DB"][i] + "30" }}
            animate={{ rotate: 360 }}
            transition={{ duration: 14 + i * 6, repeat: Infinity, ease: "linear" }}
          />
        </motion.div>
      ))}
      <div className="absolute inset-0 flex items-center justify-center">
        <VVULogo size={56} />
      </div>
    </div>
  );
}

function SphereStage() {
  return <MiniSphere />;
}

function NodesStage() {
  const states = [
    { c: "#2a2d3a", l: "unknown" },
    { c: "#3d6bff", l: "identity" },
    { c: "#3dd6ff", l: "contribution" },
    { c: "#3dffb0", l: "receipt" },
    { c: "#c9a84c", l: "hash" },
    { c: "#b23dff", l: "zk" },
    { c: "#ff2e5f", l: "trust" },
  ];
  return (
    <div className="flex flex-col items-center gap-4">
      <div className="flex items-center gap-2">
        {states.map((s, i) => (
          <motion.div
            key={s.l}
            className="flex flex-col items-center gap-1.5"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.12, duration: 0.4 }}
          >
            <div
              className="h-3 w-3 rounded-full"
              style={{ background: s.c, boxShadow: `0 0 10px ${s.c}80` }}
            />
            <span className="ive-mono text-[8px] uppercase tracking-wider text-muted-foreground">
              {s.l}
            </span>
          </motion.div>
        ))}
      </div>
      <MiniSphere small />
    </div>
  );
}

function RuntimeStage() {
  const lines = [
    "09:14:03  Geometry Loaded",
    "09:14:04  Specification Generated",
    "09:14:05  Proof Obligations Created",
    "09:14:06  Solver Started",
    "09:14:09  Ledger Written",
    "09:14:11  Engineering Release BLOCKED",
  ];
  return (
    <div className="ive-surface w-[340px] max-w-[90vw] rounded-lg border border-white/[0.08] p-4 sm:w-[420px]">
      <div className="ive-mono mb-2 flex items-center gap-2 text-[9px] uppercase tracking-[0.16em] text-muted-foreground">
        <span className="h-1.5 w-1.5 rounded-full bg-[var(--ive-proven)] ive-live-pulse" />
        evidence runtime · deterministic
      </div>
      <div className="ive-mono space-y-1 text-[10.5px] leading-relaxed">
        {lines.map((l, i) => (
          <motion.div
            key={l}
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.18, duration: 0.3 }}
            className={
              l.includes("BLOCKED")
                ? "text-[var(--ive-blocked)]"
                : l.includes("Ledger")
                  ? "text-[var(--ive-proven)]"
                  : "text-foreground/80"
            }
          >
            {l}
          </motion.div>
        ))}
      </div>
    </div>
  );
}

function ZooStage() {
  return (
    <div className="relative h-[200px] w-[200px]">
      <svg viewBox="0 0 200 200" className="h-full w-full">
        {/* procedural CAD wireframe hint */}
        {[40, 60, 80, 100, 120, 140, 160].map((r, i) => (
          <motion.circle
            key={r}
            cx="100"
            cy="100"
            r={r}
            fill="none"
            stroke="#C9A84C"
            strokeWidth="0.6"
            strokeOpacity={0.15 + (i % 3) * 0.06}
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ pathLength: 1, opacity: 1 }}
            transition={{ delay: i * 0.08, duration: 0.5 }}
          />
        ))}
        <motion.line x1="100" y1="20" x2="100" y2="180" stroke="#3dffb0" strokeWidth="0.5" strokeOpacity="0.4" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 0.6 }} />
        <motion.line x1="20" y1="100" x2="180" y2="100" stroke="#3dffb0" strokeWidth="0.5" strokeOpacity="0.4" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 0.6, delay: 0.1 }} />
        <motion.circle cx="100" cy="100" r="6" fill="#C9A84C" initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.5 }} />
      </svg>
      <div className="ive-mono absolute bottom-0 left-1/2 -translate-x-1/2 text-[9px] uppercase tracking-[0.2em] text-[var(--ive-proven)]/70">
        zoo engine · kcl 2.0
      </div>
    </div>
  );
}

function ProofStage() {
  const nodes = ["in", "geo", "spec", "obl", "sol", "ev", "led", "rel"];
  return (
    <div className="flex items-center gap-1">
      {nodes.map((n, i) => (
        <div key={n} className="flex items-center">
          <motion.div
            className="flex h-9 w-9 items-center justify-center rounded-md border"
            style={{
              borderColor: i === 7 ? "var(--ive-blocked)" : "var(--ive-gold)",
              background: i === 7 ? "rgba(255,77,95,0.08)" : "rgba(201,168,76,0.06)",
            }}
            initial={{ opacity: 0, scale: 0.6 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.1, duration: 0.35 }}
          >
            <span className="ive-mono text-[8px] uppercase" style={{ color: i === 7 ? "var(--ive-blocked)" : "var(--ive-gold)" }}>
              {n}
            </span>
          </motion.div>
          {i < nodes.length - 1 && (
            <motion.div
              className="h-[1.5px] w-3"
              style={{ background: "var(--ive-gold)" }}
              initial={{ scaleX: 0 }}
              animate={{ scaleX: 1 }}
              transition={{ delay: i * 0.1 + 0.08, duration: 0.2 }}
            />
          )}
        </div>
      ))}
    </div>
  );
}

function TrustStage() {
  const dims = ["Safety", "Integrity", "Determinism", "Auditability", "Recoverability", "Availability"];
  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
      {dims.map((d, i) => (
        <motion.div
          key={d}
          className="ive-surface flex flex-col items-center gap-1 rounded-md border border-white/[0.08] px-3 py-2"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.1, duration: 0.35 }}
        >
          <span className="ive-mono text-[8px] uppercase tracking-wider text-muted-foreground">
            {d}
          </span>
          <span
            className="ive-mono text-[10px] font-semibold"
            style={{
              color:
                d === "Safety"
                  ? "var(--ive-blocked)"
                  : d === "Integrity" || d === "Auditability"
                    ? "var(--ive-proven)"
                    : "var(--ive-pending)",
            }}
          >
            {d === "Safety" ? "OUT_OF_SCOPE" : d === "Integrity" ? "VERIFIED" : d === "Auditability" ? "LEDGER" : "PENDING"}
          </span>
        </motion.div>
      ))}
    </div>
  );
}

function WorkspaceStage() {
  return (
    <div className="flex flex-col items-center gap-4">
      <VVULogo size={72} />
      <motion.div
        className="ive-mono text-[11px] uppercase tracking-[0.32em] text-[var(--ive-gold)]"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
      >
        Entering IVE Workspace
      </motion.div>
      <motion.div
        className="h-[2px] w-32 overflow-hidden rounded-full bg-white/10"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
      >
        <motion.div
          className="h-full"
          style={{ background: "var(--ive-gold)" }}
          animate={{ width: ["0%", "100%"] }}
          transition={{ duration: 1.2, ease: "easeInOut" }}
        />
      </motion.div>
    </div>
  );
}

/* ---------- mini fibonacci sphere (canvas, reused in boot) ---------- */

function MiniSphere({ small = false }: { small?: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const rafRef = useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const NODES = small ? 90 : 180;
    const phi = Math.PI * (3 - Math.sqrt(5));
    const nodes: { bx: number; by: number; bz: number; state: number }[] = [];
    for (let i = 0; i < NODES; i++) {
      const y = 1 - (i / (NODES - 1)) * 2;
      const r = Math.sqrt(Math.max(0, 1 - y * y));
      const theta = phi * i;
      nodes.push({
        bx: Math.cos(theta) * r,
        by: y,
        bz: Math.sin(theta) * r,
        state: Math.floor(Math.random() * 7),
      });
    }
    const colors = ["#2a2d3a", "#3d6bff", "#3dd6ff", "#3dffb0", "#c9a84c", "#b23dff", "#ff2e5f"];

    const render = (time: number) => {
      rafRef.current = requestAnimationFrame(render);
      const cw = canvas.clientWidth;
      const ch = canvas.clientHeight;
      if (cw === 0 || ch === 0) return;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const tw = Math.round(cw * dpr);
      const th = Math.round(ch * dpr);
      if (canvas.width !== tw || canvas.height !== th) {
        canvas.width = tw;
        canvas.height = th;
      }
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, cw, ch);
      const cx = cw / 2;
      const cy = ch / 2;
      const radius = Math.min(cw, ch) * 0.42;
      const aA = time * 0.0002;
      const aB = time * 0.00013;
      const cosA = Math.cos(aA);
      const sinA = Math.sin(aA);
      const cosB = Math.cos(aB);
      const sinB = Math.sin(aB);
      const items = nodes.map((n, i) => {
        const x1 = n.bx * cosA - n.bz * sinA;
        const z1 = n.bx * sinA + n.bz * cosA;
        const y2 = n.by * cosB - z1 * sinB;
        const z2 = n.by * sinB + z1 * cosB;
        return { x: cx + x1 * radius, y: cy + y2 * radius, z: z2, state: n.state, i };
      });
      items.sort((a, b) => a.z - b.z);
      for (const it of items) {
        const depth = (it.z + 1) * 0.5;
        ctx.globalAlpha = 0.25 + depth * 0.75;
        const size = (small ? 1.4 : 1.8) * (0.5 + depth * 0.85);
        ctx.fillStyle = colors[it.state];
        ctx.beginPath();
        ctx.arc(it.x, it.y, size, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
    };
    rafRef.current = requestAnimationFrame(render);
    return () => cancelAnimationFrame(rafRef.current);
  }, [small]);

  return (
    <canvas
      ref={canvasRef}
      className={small ? "h-[160px] w-[160px]" : "h-[220px] w-[220px]"}
      role="img"
      aria-label="Fibonacci trust sphere boot visualization"
    />
  );
}

/**
 * BootParticleField
 * -----------------
 * A slow-drifting field of evidence motes rendered on a canvas behind the
 * boot stages. Each mote drifts upward at a stochastically varied speed
 * with a gentle horizontal sway, creating a "data rain" ambient effect
 * without overwhelming the foreground stage visual. Zero re-renders — all
 * animation state lives in refs driven by a single RAF loop.
 */
function BootParticleField() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const rafRef = useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    interface Mote {
      x: number;
      y: number;
      vx: number;
      vy: number;
      size: number;
      alpha: number;
      phase: number;
      color: string;
    }
    const colors = ["#C9A84C", "#8A9A5B", "#CC7722", "#3dffb0", "#3d9bff"];
    let motes: Mote[] = [];

    const seed = () => {
      const w = canvas.clientWidth;
      const h = canvas.clientHeight;
      const count = Math.min(80, Math.floor((w * h) / 12000));
      motes = Array.from({ length: count }, () => ({
        x: Math.random() * w,
        y: Math.random() * h,
        vx: (Math.random() - 0.5) * 0.08,
        vy: -(0.08 + Math.random() * 0.22),
        size: 0.5 + Math.random() * 1.4,
        alpha: 0.08 + Math.random() * 0.28,
        phase: Math.random() * Math.PI * 2,
        color: colors[Math.floor(Math.random() * colors.length)],
      }));
    };
    seed();

    const render = (time: number) => {
      rafRef.current = requestAnimationFrame(render);
      const cw = canvas.clientWidth;
      const ch = canvas.clientHeight;
      if (cw === 0 || ch === 0) return;
      const tw = Math.round(cw * dpr);
      const th = Math.round(ch * dpr);
      if (canvas.width !== tw || canvas.height !== th) {
        canvas.width = tw;
        canvas.height = th;
        seed();
      }
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, cw, ch);

      for (const m of motes) {
        m.x += m.vx + Math.sin(time * 0.0006 + m.phase) * 0.12;
        m.y += m.vy;
        if (m.y < -10) {
          m.y = ch + 10;
          m.x = Math.random() * cw;
        }
        if (m.x < -10) m.x = cw + 10;
        if (m.x > cw + 10) m.x = -10;
        const flicker = 0.7 + Math.sin(time * 0.002 + m.phase) * 0.3;
        ctx.globalAlpha = m.alpha * flicker;
        ctx.fillStyle = m.color;
        ctx.beginPath();
        ctx.arc(m.x, m.y, m.size, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
    };
    rafRef.current = requestAnimationFrame(render);
    return () => cancelAnimationFrame(rafRef.current);
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="pointer-events-none absolute inset-0 h-full w-full"
      aria-hidden
    />
  );
}

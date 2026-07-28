"use client";

/**
 * TrustSphere
 * ------------
 * A living verification state-space rendered on an HTML canvas.
 *
 * - 380 nodes are distributed on a unit sphere using the Fibonacci spiral
 *   (golden-angle), guaranteeing an even, visually balanced point cloud.
 * - The sphere tumbles along two independent axes (Y and X) at different
 *   angular velocities, producing an organic, non-repeating rotation.
 * - Each node runs an independent state machine:
 *       unknown -> identity -> contribution -> receipt -> hash -> zk -> trust
 *   "trust" is terminal but occasionally resets to "unknown" so the system
 *   stays alive (new, unverified contributions keep entering the mesh).
 * - Hovering a node reveals an imperative tooltip showing its index, current
 *   state, color, and progress through the verification chain.
 * - Live metrics (verified count + density) are reported to the parent via the
 *   `onMetrics` callback and mirrored in a small overlay.
 *
 * Implementation notes
 * - All animation state lives in refs and is driven by a single
 *   requestAnimationFrame loop set up once in useEffect([]).
 * - No useState is used: derived display values use useMemo, and the tooltip /
 *   metrics overlays are updated imperatively via refs. This deliberately
 *   avoids any setState-in-effect pattern and keeps re-renders at zero while
 *   the sphere is animating.
 */

import {
  useEffect,
  useMemo,
  useRef,
  type MouseEvent as ReactMouseEvent,
  type TouchEvent as ReactTouchEvent,
} from "react";

type NodeState =
  | "unknown"
  | "identity"
  | "contribution"
  | "receipt"
  | "hash"
  | "zk"
  | "trust";

const STATE_COLORS: Record<NodeState, string> = {
  unknown: "#2a2d3a",
  identity: "#3d6bff",
  contribution: "#3dd6ff",
  receipt: "#3dffb0",
  hash: "#c9a84c",
  zk: "#b23dff",
  trust: "#ff2e5f",
};

const STATE_ORDER: NodeState[] = [
  "unknown",
  "identity",
  "contribution",
  "receipt",
  "hash",
  "zk",
  "trust",
];

const STATE_LABELS: Record<NodeState, string> = {
  unknown: "Unknown",
  identity: "Identity",
  contribution: "Contribution",
  receipt: "Receipt",
  hash: "Hash",
  zk: "ZK Proof",
  trust: "Trust",
};

const NODE_COUNT = 380;

export interface TrustSphereMetrics {
  /** Number of nodes currently in the terminal "trust" state. */
  verified: number;
  /** verified / total (0..1). */
  density: number;
  /** Total node count (380). */
  total: number;
}

export interface TrustSphereProps {
  /** "global" = slower, mesh-wide view. "personal" = faster personal ledger. */
  mode?: "global" | "personal";
  /** Invoked ~2x/sec with the latest verified count and density. */
  onMetrics?: (metrics: TrustSphereMetrics) => void;
  /** Compact rendering: smaller points, no constellation links. */
  dense?: boolean;
}

interface Node {
  /** Base position on the unit sphere (Fibonacci distribution). */
  bx: number;
  by: number;
  bz: number;
  state: NodeState;
  /** Milliseconds remaining in the current state before advancing. */
  dwell: number;
  /** Per-node phase offset for the glow pulse. */
  pulse: number;
}

interface RenderItem {
  x: number;
  y: number;
  z: number;
  state: NodeState;
  idx: number;
}

/** Build the Fibonacci-distributed node cloud with a varied initial state. */
function createNodes(): Node[] {
  const nodes: Node[] = [];
  const phi = Math.PI * (3 - Math.sqrt(5)); // golden angle
  for (let i = 0; i < NODE_COUNT; i++) {
    const y = 1 - (i / (NODE_COUNT - 1)) * 2; // y from 1 -> -1
    const r = Math.sqrt(Math.max(0, 1 - y * y));
    const theta = phi * i;
    const x = Math.cos(theta) * r;
    const z = Math.sin(theta) * r;

    // Weighted initial distribution so the sphere is colorful on first paint
    // rather than uniformly "unknown".
    const roll = Math.random();
    let state: NodeState;
    if (roll < 0.34) state = "unknown";
    else if (roll < 0.5) state = "identity";
    else if (roll < 0.62) state = "contribution";
    else if (roll < 0.72) state = "receipt";
    else if (roll < 0.82) state = "hash";
    else if (roll < 0.9) state = "zk";
    else state = "trust";

    nodes.push({
      bx: x,
      by: y,
      bz: z,
      state,
      dwell: 1000 + Math.random() * 5000,
      pulse: Math.random() * Math.PI * 2,
    });
  }
  return nodes;
}

export default function TrustSphere({
  mode = "global",
  onMetrics,
  dense = false,
}: TrustSphereProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Imperative tooltip DOM refs (updated from the RAF loop, no React state).
  const tooltipRef = useRef<HTMLDivElement | null>(null);
  const tooltipDotRef = useRef<HTMLSpanElement | null>(null);
  const tooltipLabelRef = useRef<HTMLDivElement | null>(null);
  const tooltipIndexRef = useRef<HTMLDivElement | null>(null);
  const tooltipProgressRef = useRef<HTMLDivElement | null>(null);

  // Imperative metrics overlay refs.
  const verifiedRef = useRef<HTMLSpanElement | null>(null);
  const densityRef = useRef<HTMLDivElement | null>(null);

  // Mutable simulation state — lives outside React's render cycle.
  const nodesRef = useRef<Node[] | null>(null);
  if (nodesRef.current === null) {
    nodesRef.current = createNodes();
  }
  const itemsRef = useRef<RenderItem[]>(
    Array.from({ length: NODE_COUNT }, () => ({
      x: 0,
      y: 0,
      z: 0,
      state: "unknown" as NodeState,
      idx: 0,
    }))
  );
  const projectedRef = useRef<Float32Array>(new Float32Array(NODE_COUNT * 2));
  const mouseRef = useRef({ x: 0, y: 0, inside: false });
  const rafRef = useRef(0);
  const lastTimeRef = useRef(0);
  const lastMetricsRef = useRef(0);

  // Mirror latest props into refs so the animation effect (empty deps) always
  // reads fresh values without needing to re-run / re-subscribe. Ref writes
  // in an effect are allowed (only setState-in-effect is prohibited).
  const modeRef = useRef(mode);
  const denseRef = useRef(dense);
  const onMetricsRef = useRef(onMetrics);
  useEffect(() => {
    modeRef.current = mode;
    denseRef.current = dense;
    onMetricsRef.current = onMetrics;
  }, [mode, dense, onMetrics]);

  // Derived display values via useMemo (no setState-in-effect).
  const legend = useMemo(
    () =>
      STATE_ORDER.map((s) => ({
        state: s,
        color: STATE_COLORS[s],
        label: STATE_LABELS[s],
      })),
    []
  );
  const modeLabel = useMemo(
    () => (mode === "personal" ? "Personal Ledger" : "Global Mesh"),
    [mode]
  );

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const dpr = Math.min(
      typeof window !== "undefined" ? window.devicePixelRatio || 1 : 1,
      2
    );

    const render = (time: number) => {
      rafRef.current = requestAnimationFrame(render);

      const cw = canvas.clientWidth;
      const ch = canvas.clientHeight;
      if (cw === 0 || ch === 0) return;

      const targetW = Math.round(cw * dpr);
      const targetH = Math.round(ch * dpr);
      if (canvas.width !== targetW || canvas.height !== targetH) {
        canvas.width = targetW;
        canvas.height = targetH;
      }
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      const dt = lastTimeRef.current
        ? Math.min(time - lastTimeRef.current, 64)
        : 16;
      lastTimeRef.current = time;

      const cx = cw / 2;
      const cy = ch / 2;
      const radius = Math.min(cw, ch) * 0.42;
      const nodes = nodesRef.current!;

      // --- advance each node's independent state machine ---
      const speed = modeRef.current === "personal" ? 1.45 : 1;
      const dtMs = dt * speed;
      for (let i = 0; i < nodes.length; i++) {
        const n = nodes[i];
        n.dwell -= dtMs;
        n.pulse += dt * 0.003;
        if (n.dwell <= 0) {
          if (n.state === "trust") {
            // Terminal state; occasionally a fresh unverified node re-enters.
            if (Math.random() < 0.18) {
              n.state = "unknown";
              n.dwell = 1500 + Math.random() * 4000;
            } else {
              n.dwell = 2500 + Math.random() * 5000;
            }
          } else {
            const idx = STATE_ORDER.indexOf(n.state);
            n.state = STATE_ORDER[idx + 1];
            n.dwell = 1200 + Math.random() * 4200;
          }
        }
      }

      // --- dual-axis tumble (Y and X at different speeds) ---
      const angleA = time * 0.00018; // primary axis
      const angleB = time * 0.00011; // secondary axis
      const cosA = Math.cos(angleA),
        sinA = Math.sin(angleA);
      const cosB = Math.cos(angleB),
        sinB = Math.sin(angleB);

      // --- backdrop + sphere outline ---
      ctx.clearRect(0, 0, cw, ch);
      const grad = ctx.createRadialGradient(
        cx,
        cy,
        radius * 0.2,
        cx,
        cy,
        radius * 1.3
      );
      grad.addColorStop(0, "rgba(60, 70, 100, 0.10)");
      grad.addColorStop(1, "rgba(10, 12, 20, 0)");
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(cx, cy, radius * 1.25, 0, Math.PI * 2);
      ctx.fill();

      ctx.beginPath();
      ctx.arc(cx, cy, radius, 0, Math.PI * 2);
      ctx.strokeStyle = "rgba(140, 150, 180, 0.10)";
      ctx.lineWidth = 1;
      ctx.stroke();

      // --- project all nodes to screen space (rotation + orthographic) ---
      const projected = projectedRef.current;
      const items = itemsRef.current;
      for (let i = 0; i < nodes.length; i++) {
        const n = nodes[i];
        // rotate around Y
        const x1 = n.bx * cosA - n.bz * sinA;
        const z1 = n.bx * sinA + n.bz * cosA;
        // rotate around X
        const y2 = n.by * cosB - z1 * sinB;
        const z2 = n.by * sinB + z1 * cosB;
        const sx = cx + x1 * radius;
        const sy = cy + y2 * radius;
        projected[i * 2] = sx;
        projected[i * 2 + 1] = sy;
        const it = items[i];
        it.x = sx;
        it.y = sy;
        it.z = z2;
        it.state = n.state;
        it.idx = i;
      }
      // Painter's algorithm: draw far nodes first.
      items.sort((a, b) => a.z - b.z);

      // --- constellation links between verified / proving nodes ---
      if (!denseRef.current) {
        const maxD = radius * 0.32;
        const maxD2 = maxD * maxD;
        ctx.lineWidth = 0.6;
        for (let i = 0; i < items.length; i++) {
          const a = items[i];
          if (a.state !== "trust" && a.state !== "zk") continue;
          for (let j = i + 1; j < items.length; j++) {
            const b = items[j];
            if (b.state !== "trust" && b.state !== "zk") continue;
            const dx = a.x - b.x;
            const dy = a.y - b.y;
            const d2 = dx * dx + dy * dy;
            if (d2 < maxD2) {
              const t = 1 - Math.sqrt(d2) / maxD;
              const alpha = 0.18 * t;
              ctx.strokeStyle =
                a.state === "trust" && b.state === "trust"
                  ? `rgba(255, 46, 95, ${alpha})`
                  : `rgba(178, 61, 255, ${alpha * 0.7})`;
              ctx.beginPath();
              ctx.moveTo(a.x, a.y);
              ctx.lineTo(b.x, b.y);
              ctx.stroke();
            }
          }
        }
      }

      // --- draw nodes ---
      const baseSize = denseRef.current ? 1.5 : 2.3;
      for (let i = 0; i < items.length; i++) {
        const it = items[i];
        const depth = (it.z + 1) * 0.5; // 0 = back, 1 = front
        const alpha = 0.22 + depth * 0.78;
        const advanced = it.state === "trust" || it.state === "zk";
        const pulse = advanced
          ? 1 + Math.sin(nodes[it.idx].pulse) * 0.18
          : 1;
        const size = baseSize * (0.55 + depth * 0.85) * pulse;
        const color = STATE_COLORS[it.state];

        if (advanced) {
          // soft glow halo
          ctx.globalAlpha = alpha * 0.22;
          ctx.beginPath();
          ctx.arc(it.x, it.y, size * 3, 0, Math.PI * 2);
          ctx.fillStyle = color;
          ctx.fill();
        }
        ctx.globalAlpha = alpha;
        ctx.beginPath();
        ctx.arc(it.x, it.y, size, 0, Math.PI * 2);
        ctx.fillStyle = color;
        ctx.fill();
      }
      ctx.globalAlpha = 1;

      // --- hover hit-test + imperative tooltip update ---
      let hoverIdx = -1;
      if (mouseRef.current.inside) {
        const mx = mouseRef.current.x;
        const my = mouseRef.current.y;
        let bestD = 22 * 22;
        for (let i = 0; i < nodes.length; i++) {
          const dx = projected[i * 2] - mx;
          const dy = projected[i * 2 + 1] - my;
          const d2 = dx * dx + dy * dy;
          if (d2 < bestD) {
            bestD = d2;
            hoverIdx = i;
          }
        }
      }

      const tip = tooltipRef.current;
      if (hoverIdx >= 0) {
        const n = nodes[hoverIdx];
        const sx = projected[hoverIdx * 2];
        const sy = projected[hoverIdx * 2 + 1];
        const progress =
          (STATE_ORDER.indexOf(n.state) + 1) / STATE_ORDER.length;
        if (tooltipDotRef.current)
          tooltipDotRef.current.style.background = STATE_COLORS[n.state];
        if (tooltipLabelRef.current)
          tooltipLabelRef.current.textContent = STATE_LABELS[n.state];
        if (tooltipIndexRef.current)
          tooltipIndexRef.current.textContent = `Node #${String(
            hoverIdx
          ).padStart(3, "0")}`;
        if (tooltipProgressRef.current)
          tooltipProgressRef.current.style.width = `${Math.round(
            progress * 100
          )}%`;
        if (tip) {
          // Flip the tooltip below the node when near the top edge.
          const flip = sy < 90;
          tip.style.transform = flip
            ? `translate(${sx}px, ${sy}px) translate(-50%, 16px)`
            : `translate(${sx}px, ${sy}px) translate(-50%, calc(-100% - 16px))`;
          tip.style.opacity = "1";
        }
        canvas.style.cursor = "pointer";
      } else {
        if (tip) tip.style.opacity = "0";
        canvas.style.cursor = "default";
      }

      // --- throttled metrics report + overlay mirror ---
      if (time - lastMetricsRef.current > 480) {
        lastMetricsRef.current = time;
        let verified = 0;
        for (let i = 0; i < nodes.length; i++) {
          if (nodes[i].state === "trust") verified++;
        }
        const density = verified / nodes.length;
        if (onMetricsRef.current) {
          onMetricsRef.current({
            verified,
            density,
            total: nodes.length,
          });
        }
        if (verifiedRef.current)
          verifiedRef.current.textContent = String(verified);
        if (densityRef.current)
          densityRef.current.style.width = `${Math.round(density * 100)}%`;
      }
    };

    rafRef.current = requestAnimationFrame(render);
    return () => cancelAnimationFrame(rafRef.current);
  }, []);

  // --- input handlers (setState-free; only mutate the mouse ref) ---
  const handlePointer = (clientX: number, clientY: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    mouseRef.current = {
      x: clientX - rect.left,
      y: clientY - rect.top,
      inside: true,
    };
  };
  const handleMouseMove = (e: ReactMouseEvent<HTMLCanvasElement>) =>
    handlePointer(e.clientX, e.clientY);
  const handleTouch = (e: ReactTouchEvent<HTMLCanvasElement>) => {
    const t = e.touches[0];
    if (t) handlePointer(t.clientX, t.clientY);
  };
  const handleMouseLeave = () => {
    mouseRef.current.inside = false;
  };

  return (
    <div
      ref={containerRef}
      className="relative mx-auto aspect-square w-full max-w-[640px] select-none"
    >
      <canvas
        ref={canvasRef}
        className="block h-full w-full rounded-2xl"
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        onTouchStart={handleTouch}
        onTouchMove={handleTouch}
        onTouchEnd={handleMouseLeave}
        role="img"
        aria-label={`Trust sphere visualization: ${NODE_COUNT} nodes tumbling through the verification chain unknown, identity, contribution, receipt, hash, ZK proof, and trust. Current mode: ${modeLabel}.`}
      />

      {/* Legend — state chain */}
      <div className="pointer-events-none absolute left-3 top-3 flex flex-col gap-1.5 rounded-lg border border-white/10 bg-black/40 p-2.5 backdrop-blur-sm">
        <div className="text-[9px] font-semibold uppercase tracking-[0.12em] text-white/40">
          Verification Chain
        </div>
        <div className="flex flex-col gap-1">
          {legend.map((l) => (
            <div key={l.state} className="flex items-center gap-2">
              <span
                className="inline-block h-2 w-2 shrink-0 rounded-full"
                style={{
                  background: l.color,
                  boxShadow: `0 0 6px ${l.color}66`,
                }}
              />
              <span className="text-[10px] font-medium text-white/70">
                {l.label}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Metrics overlay */}
      <div className="pointer-events-none absolute right-3 top-3 flex flex-col items-end gap-1 rounded-lg border border-white/10 bg-black/40 px-3 py-2 backdrop-blur-sm">
        <div className="text-[9px] font-semibold uppercase tracking-[0.12em] text-white/40">
          Verified
        </div>
        <div className="font-mono text-sm text-white/90">
          <span ref={verifiedRef}>0</span>
          <span className="text-white/40"> / {NODE_COUNT}</span>
        </div>
        <div className="mt-1 h-1 w-24 overflow-hidden rounded-full bg-white/10">
          <div
            ref={densityRef}
            className="h-full rounded-full transition-[width] duration-500 ease-out"
            style={{ width: "0%", background: STATE_COLORS.trust }}
          />
        </div>
      </div>

      {/* Mode badge */}
      <div className="pointer-events-none absolute bottom-3 left-3 rounded-full border border-white/10 bg-black/40 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-white/70 backdrop-blur-sm">
        {modeLabel}
      </div>

      {/* Node count hint */}
      <div className="pointer-events-none absolute bottom-3 right-3 font-mono text-[10px] text-white/40">
        {NODE_COUNT} nodes · fib-spiral
      </div>

      {/* Tooltip — updated imperatively each frame (no React state) */}
      <div
        ref={tooltipRef}
        className="pointer-events-none absolute left-0 top-0 z-20 opacity-0 transition-opacity duration-150"
        style={{ willChange: "transform, opacity" }}
      >
        <div className="flex min-w-[148px] flex-col gap-1.5 rounded-lg border border-white/15 bg-zinc-950/90 px-3 py-2 shadow-xl backdrop-blur-md">
          <div className="flex items-center gap-2">
            <span
              ref={tooltipDotRef}
              className="inline-block h-2.5 w-2.5 rounded-full"
              style={{ background: STATE_COLORS.unknown }}
            />
            <div
              ref={tooltipLabelRef}
              className="text-xs font-semibold text-white/90"
            >
              Unknown
            </div>
          </div>
          <div
            ref={tooltipIndexRef}
            className="font-mono text-[10px] text-white/40"
          >
            Node #000
          </div>
          <div className="mt-0.5">
            <div className="mb-1 text-[9px] uppercase tracking-[0.12em] text-white/40">
              Chain Progress
            </div>
            <div className="h-1 w-full overflow-hidden rounded-full bg-white/10">
              <div
                ref={tooltipProgressRef}
                className="h-full rounded-full"
                style={{ width: "0%", background: STATE_COLORS.trust }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

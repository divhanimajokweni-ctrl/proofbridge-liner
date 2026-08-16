"use client";

import { useState, useRef, useEffect, useCallback } from "react";

/* ═══════════════════════════════════════════════════════════════
   CALCULUS VISUAL STRATEGY DOCS
   Navy/Paper-White Palette · SVG + CSS Animations
   ═══════════════════════════════════════════════════════════════ */

const C = {
  navy:      "#1a1a2e",
  paperWhite:"#faf9f6",
  softGold:  "#c9a84c",
  slate:     "#64748b",
  lightGray: "#e8e6e1",
  emerald:   "#10b981",
  coral:     "#e53e3e",
  teal:      "#0d9488",
  purple:    "#7c3aed",
  epsilonBg: "rgba(229,62,62,0.12)",
  deltaBg:   "rgba(16,185,129,0.12)",
};

/* ── Math helpers ── */
const f = (x: number) => (x * x) / 4;           // f(x) = x²/4
const fPrime = (x: number) => x / 2;             // f'(x) = x/2
const g = (x: number) => Math.sin(x) + 1;        // g(x) = sin(x) + 1
const gIntegral = 2 + Math.PI;                    // ∫₀^π (sin(x)+1) dx = 2 + π

/* ── Riemann sum computation ── */
function riemannSum(n: number, type: "left" | "right" | "midpoint"): number {
  const a = 0, b = Math.PI;
  const dx = (b - a) / n;
  let sum = 0;
  for (let i = 0; i < n; i++) {
    let xi: number;
    if (type === "left") xi = a + i * dx;
    else if (type === "right") xi = a + (i + 1) * dx;
    else xi = a + (i + 0.5) * dx;
    sum += g(xi) * dx;
  }
  return sum;
}

/* ── ε-δ computation for f(x) = x², a = 2, L = 4 ── */
function computeDelta(epsilon: number): number {
  // For f(x) = x², lim x→2 f(x) = 4
  // |x² - 4| = |x-2||x+2|
  // If |x-2| < δ and x near 2 (say within 1), then |x+2| < 5
  // So |x² - 4| < 5δ → choose δ = min(1, ε/5)
  return Math.min(1, epsilon / 5);
}

/* ── Styled math span helpers ── */
const Sup = ({ children }: { children: React.ReactNode }) => (
  <sup style={{ fontSize: "0.7em", verticalAlign: "super", lineHeight: 0 }}>{children}</sup>
);
const Sub = ({ children }: { children: React.ReactNode }) => (
  <sub style={{ fontSize: "0.7em", verticalAlign: "sub", lineHeight: 0 }}>{children}</sub>
);

/* ═══════════════════════════════════════════════════════════════
   TANGENT LINE VISUALIZER
   ═══════════════════════════════════════════════════════════════ */
function TangentLineViz() {
  const [a, setA] = useState(2);
  const svgRef = useRef<SVGSVGElement>(null);
  const [dragging, setDragging] = useState(false);

  // SVG coordinate system
  const xMin = -1, xMax = 7, yMin = -1, yMax = 14;
  const W = 520, H = 360;
  const pad = 40;
  const plotW = W - 2 * pad, plotH = H - 2 * pad;

  const toSvgX = (x: number) => pad + ((x - xMin) / (xMax - xMin)) * plotW;
  const toSvgY = (y: number) => pad + plotH - ((y - yMin) / (yMax - yMin)) * plotH;
  const fromSvgX = (sx: number) => xMin + ((sx - pad) / plotW) * (xMax - xMin);

  // Curve points
  const curvePts: string[] = [];
  for (let i = 0; i <= 200; i++) {
    const x = xMin + (i / 200) * (xMax - xMin);
    const y = f(x);
    if (y >= yMin && y <= yMax) {
      curvePts.push(`${toSvgX(x)},${toSvgY(y)}`);
    }
  }

  // Tangent line at point a
  const fa = f(a);
  const fpa = fPrime(a);
  const tanX1 = xMin, tanX2 = xMax;
  const tanY1 = fa + fpa * (tanX1 - a);
  const tanY2 = fa + fpa * (tanX2 - a);

  const handleMouseDown = useCallback(() => setDragging(true), []);
  useEffect(() => {
    if (!dragging) return;
    const handleMove = (e: MouseEvent) => {
      if (!svgRef.current) return;
      const rect = svgRef.current.getBoundingClientRect();
      const sx = ((e.clientX - rect.left) / rect.width) * W;
      const newX = fromSvgX(sx);
      setA(Math.max(0, Math.min(6, newX)));
    };
    const handleUp = () => setDragging(false);
    window.addEventListener("mousemove", handleMove);
    window.addEventListener("mouseup", handleUp);
    return () => {
      window.removeEventListener("mousemove", handleMove);
      window.removeEventListener("mouseup", handleUp);
    };
  }, [dragging]);

  return (
    <div style={{ background: C.paperWhite, borderRadius: 8, border: `1px solid ${C.lightGray}`, padding: 20 }}>
      <h3 style={{ fontFamily: "'Georgia', serif", fontSize: 18, color: C.navy, marginBottom: 4 }}>
        Tangent Line Visualizer
      </h3>
      <p style={{ fontSize: 12, color: C.slate, marginBottom: 12 }}>
        Drag the point along f(x) = x²/4 to see the tangent line and derivative.
      </p>

      <svg ref={svgRef} viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", maxWidth: W, background: "#fff", borderRadius: 6, border: `1px solid ${C.lightGray}`, cursor: dragging ? "grabbing" : "default" }}>
        {/* Grid lines */}
        {Array.from({ length: 9 }, (_, i) => {
          const x = xMin + i;
          return <line key={`gx${i}`} x1={toSvgX(x)} y1={toSvgY(yMin)} x2={toSvgX(x)} y2={toSvgY(yMax)} stroke={C.lightGray} strokeWidth={0.5} />;
        })}
        {Array.from({ length: 16 }, (_, i) => {
          const y = yMin + i;
          return <line key={`gy${i}`} x1={toSvgX(xMin)} y1={toSvgY(y)} x2={toSvgX(xMax)} y2={toSvgY(y)} stroke={C.lightGray} strokeWidth={0.5} />;
        })}

        {/* Axes */}
        <line x1={toSvgX(xMin)} y1={toSvgY(0)} x2={toSvgX(xMax)} y2={toSvgY(0)} stroke={C.slate} strokeWidth={1} />
        <line x1={toSvgX(0)} y1={toSvgY(yMin)} x2={toSvgX(0)} y2={toSvgY(yMax)} stroke={C.slate} strokeWidth={1} />

        {/* Curve */}
        <polyline points={curvePts.join(" ")} fill="none" stroke={C.teal} strokeWidth={2.5} />

        {/* Tangent line */}
        <line x1={toSvgX(tanX1)} y1={toSvgY(tanY1)} x2={toSvgX(tanX2)} y2={toSvgY(tanY2)} stroke={C.coral} strokeWidth={1.5} strokeDasharray="6 3" />

        {/* Point on curve */}
        <circle cx={toSvgX(a)} cy={toSvgY(fa)} r={6} fill={C.coral} stroke="#fff" strokeWidth={2} style={{ cursor: "grab" }} onMouseDown={handleMouseDown} />

        {/* Labels */}
        <text x={toSvgX(a) + 10} y={toSvgY(fa) - 10} fontSize={11} fill={C.coral} fontFamily="'Georgia', serif">
          ({a.toFixed(1)}, {fa.toFixed(1)})
        </text>
      </svg>

      {/* Equations */}
      <div style={{ marginTop: 14, display: "flex", flexDirection: "column", gap: 6, fontFamily: "'Georgia', serif", fontSize: 14, color: C.navy }}>
        <div>
          <span style={{ color: C.teal }}>f(x)</span> = x<Sup>2</Sup>/4
        </div>
        <div>
          <span style={{ color: C.coral }}>f&apos;({a.toFixed(1)})</span> = {a.toFixed(1)}/2 = <strong>{fpa.toFixed(2)}</strong>
        </div>
        <div>
          Tangent: y = {fa.toFixed(2)} + {fpa.toFixed(2)}(x − {a.toFixed(1)})
        </div>
      </div>

      {/* Slider */}
      <div style={{ marginTop: 10, display: "flex", alignItems: "center", gap: 10 }}>
        <span style={{ fontSize: 11, color: C.slate, fontFamily: "'Georgia', serif" }}>a = </span>
        <input type="range" min={0} max={6} step={0.05} value={a}
          onChange={(e) => setA(Number(e.target.value))}
          style={{ flex: 1, accentColor: C.coral }}
        />
        <span style={{ fontSize: 13, color: C.navy, fontWeight: 700, fontFamily: "'Georgia', serif", minWidth: 40, textAlign: "right" }}>{a.toFixed(2)}</span>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   RIEMANN SUM INTERACTIVE
   ═══════════════════════════════════════════════════════════════ */
function RiemannSumViz() {
  const [n, setN] = useState(8);
  const [type, setType] = useState<"left" | "right" | "midpoint">("left");
  const [animN, setAnimN] = useState(8);

  // Animate n changes
  useEffect(() => {
    setAnimN(n);
  }, [n]);

  const sum = riemannSum(animN, type);
  const a = 0, b = Math.PI;
  const W = 520, H = 300;
  const pad = 40;
  const plotW = W - 2 * pad, plotH = H - 2 * pad;
  const xMin = -0.2, xMax = Math.PI + 0.3, yMin = -0.1, yMax = 2.3;

  const toSvgX = (x: number) => pad + ((x - xMin) / (xMax - xMin)) * plotW;
  const toSvgY = (y: number) => pad + plotH - ((y - yMin) / (yMax - yMin)) * plotH;

  // Curve points
  const curvePts: string[] = [];
  for (let i = 0; i <= 200; i++) {
    const x = xMin + (i / 200) * (xMax - xMin);
    const y = g(x);
    curvePts.push(`${toSvgX(x)},${toSvgY(y)}`);
  }

  // Rectangle data
  const dx = (b - a) / animN;
  const rects: { x: number; y: number; w: number; h: number }[] = [];
  for (let i = 0; i < animN; i++) {
    let xi: number;
    if (type === "left") xi = a + i * dx;
    else if (type === "right") xi = a + (i + 1) * dx;
    else xi = a + (i + 0.5) * dx;
    rects.push({ x: a + i * dx, y: 0, w: dx, h: g(xi) });
  }

  return (
    <div style={{ background: C.paperWhite, borderRadius: 8, border: `1px solid ${C.lightGray}`, padding: 20 }}>
      <h3 style={{ fontFamily: "'Georgia', serif", fontSize: 18, color: C.navy, marginBottom: 4 }}>
        Riemann Sum Interactive
      </h3>
      <p style={{ fontSize: 12, color: C.slate, marginBottom: 12 }}>
        Approximate ∫₀<Sup>π</Sup> (sin(x) + 1) dx with adjustable rectangles.
      </p>

      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", maxWidth: W, background: "#fff", borderRadius: 6, border: `1px solid ${C.lightGray}` }}>
        {/* Axes */}
        <line x1={toSvgX(xMin)} y1={toSvgY(0)} x2={toSvgX(xMax)} y2={toSvgY(0)} stroke={C.slate} strokeWidth={1} />
        <line x1={toSvgX(0)} y1={toSvgY(yMin)} x2={toSvgX(0)} y2={toSvgY(yMax)} stroke={C.slate} strokeWidth={1} />

        {/* Rectangles */}
        {rects.map((r, i) => (
          <rect key={i}
            x={toSvgX(r.x)} y={toSvgY(r.y + r.h)}
            width={toSvgX(r.x + r.w) - toSvgX(r.x)}
            height={toSvgY(r.y) - toSvgY(r.y + r.h)}
            fill={type === "left" ? "rgba(13,148,136,0.2)" : type === "right" ? "rgba(124,58,237,0.2)" : "rgba(201,168,76,0.25)"}
            stroke={type === "left" ? C.teal : type === "right" ? C.purple : C.softGold}
            strokeWidth={0.8}
          />
        ))}

        {/* Curve */}
        <polyline points={curvePts.join(" ")} fill="none" stroke={C.teal} strokeWidth={2.5} />

        {/* Labels */}
        <text x={toSvgX(Math.PI / 2)} y={toSvgY(2.15)} textAnchor="middle" fontSize={11} fill={C.navy} fontFamily="'Georgia', serif">
          sin(x) + 1
        </text>
        <text x={toSvgX(Math.PI) + 5} y={toSvgY(0) + 14} fontSize={10} fill={C.slate} fontFamily="'Georgia', serif">π</text>
      </svg>

      {/* Controls */}
      <div style={{ marginTop: 14, display: "flex", flexDirection: "column", gap: 10 }}>
        {/* n slider */}
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ fontSize: 12, color: C.slate, fontFamily: "'Georgia', serif" }}>n = </span>
          <input type="range" min={2} max={50} step={1} value={n}
            onChange={(e) => setN(Number(e.target.value))}
            style={{ flex: 1, accentColor: C.teal }}
          />
          <span style={{ fontSize: 14, color: C.navy, fontWeight: 700, fontFamily: "'Georgia', serif", minWidth: 30, textAlign: "right" }}>{n}</span>
        </div>

        {/* Type toggle */}
        <div style={{ display: "flex", gap: 6 }}>
          {(["left", "right", "midpoint"] as const).map((t) => (
            <button key={t} onClick={() => setType(t)} style={{
              padding: "6px 14px", fontSize: 12, borderRadius: 4, border: `1px solid ${type === t ? C.teal : C.lightGray}`,
              background: type === t ? "rgba(13,148,136,0.1)" : "transparent",
              color: type === t ? C.teal : C.slate, cursor: "pointer", fontFamily: "'Georgia', serif",
              fontWeight: type === t ? 700 : 400, transition: "all .2s",
            }}>
              {t === "left" ? "Left" : t === "right" ? "Right" : "Midpoint"}
            </button>
          ))}
        </div>

        {/* Sum comparison */}
        <div style={{ display: "flex", gap: 20, fontFamily: "'Georgia', serif", fontSize: 13 }}>
          <div>
            <span style={{ color: C.slate }}>Riemann Sum:</span>{" "}
            <span style={{ color: C.navy, fontWeight: 700 }}>{sum.toFixed(4)}</span>
          </div>
          <div>
            <span style={{ color: C.slate }}>Actual Integral:</span>{" "}
            <span style={{ color: C.emerald, fontWeight: 700 }}>{gIntegral.toFixed(4)}</span>
          </div>
          <div>
            <span style={{ color: C.slate }}>Error:</span>{" "}
            <span style={{ color: Math.abs(sum - gIntegral) < 0.05 ? C.emerald : C.coral, fontWeight: 700 }}>
              {Math.abs(sum - gIntegral).toFixed(4)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   ε-δ VISUAL PROOF TOOL
   ═══════════════════════════════════════════════════════════════ */
function EpsilonDeltaViz() {
  const [epsilon, setEpsilon] = useState(0.5);
  const delta = computeDelta(epsilon);

  // f(x) = x², a = 2, L = 4
  const aVal = 2, LVal = 4;
  const W = 520, H = 320;
  const pad = 40;
  const plotW = W - 2 * pad, plotH = H - 2 * pad;
  const xMin = 0.5, xMax = 3.5, yMin = 0, yMax = 13;

  const toSvgX = (x: number) => pad + ((x - xMin) / (xMax - xMin)) * plotW;
  const toSvgY = (y: number) => pad + plotH - ((y - yMin) / (yMax - yMin)) * plotH;

  // Curve f(x) = x²
  const curvePts: string[] = [];
  for (let i = 0; i <= 200; i++) {
    const x = xMin + (i / 200) * (xMax - xMin);
    const y = x * x;
    if (y >= yMin && y <= yMax) curvePts.push(`${toSvgX(x)},${toSvgY(y)}`);
  }

  const yEpsTop = LVal + epsilon;
  const yEpsBot = Math.max(0, LVal - epsilon);
  const xDeltaLeft = aVal - delta;
  const xDeltaRight = aVal + delta;

  return (
    <div style={{ background: C.paperWhite, borderRadius: 8, border: `1px solid ${C.lightGray}`, padding: 20 }}>
      <h3 style={{ fontFamily: "'Georgia', serif", fontSize: 18, color: C.navy, marginBottom: 4 }}>
        ε-δ Visual Proof Tool
      </h3>
      <p style={{ fontSize: 12, color: C.slate, marginBottom: 12 }}>
        For f(x) = x², lim<Sub>x→2</Sub> f(x) = 4. Adjust ε to find δ.
      </p>

      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", maxWidth: W, background: "#fff", borderRadius: 6, border: `1px solid ${C.lightGray}` }}>
        {/* ε-band (horizontal) */}
        {yEpsTop <= yMax && (
          <rect x={pad} y={toSvgY(yEpsTop)} width={plotW} height={toSvgY(yEpsBot) - toSvgY(yEpsTop)}
            fill={C.epsilonBg} stroke={C.coral} strokeWidth={0.5} strokeDasharray="4 2" />
        )}

        {/* δ-band (vertical) */}
        <rect x={toSvgX(xDeltaLeft)} y={pad} width={toSvgX(xDeltaRight) - toSvgX(xDeltaLeft)} height={plotH}
          fill={C.deltaBg} stroke={C.emerald} strokeWidth={0.5} strokeDasharray="4 2" />

        {/* Grid */}
        <line x1={toSvgX(xMin)} y1={toSvgY(0)} x2={toSvgX(xMax)} y2={toSvgY(0)} stroke={C.slate} strokeWidth={0.5} />
        <line x1={toSvgX(0)} y1={toSvgY(yMin)} x2={toSvgX(0)} y2={toSvgY(yMax)} stroke={C.slate} strokeWidth={0.5} />

        {/* Curve */}
        <polyline points={curvePts.join(" ")} fill="none" stroke={C.teal} strokeWidth={2.5} />

        {/* Horizontal lines for L±ε */}
        <line x1={pad} y1={toSvgY(LVal + epsilon)} x2={W - pad} y2={toSvgY(LVal + epsilon)} stroke={C.coral} strokeWidth={1} strokeDasharray="6 3" />
        <line x1={pad} y1={toSvgY(LVal - epsilon)} x2={W - pad} y2={toSvgY(LVal - epsilon)} stroke={C.coral} strokeWidth={1} strokeDasharray="6 3" />
        <text x={W - pad + 4} y={toSvgY(LVal + epsilon) + 4} fontSize={9} fill={C.coral} fontFamily="'Georgia', serif">L+ε</text>
        <text x={W - pad + 4} y={toSvgY(LVal - epsilon) + 4} fontSize={9} fill={C.coral} fontFamily="'Georgia', serif">L−ε</text>

        {/* Vertical lines for a±δ */}
        <line x1={toSvgX(aVal - delta)} y1={pad} x2={toSvgX(aVal - delta)} y2={H - pad} stroke={C.emerald} strokeWidth={1} strokeDasharray="6 3" />
        <line x1={toSvgX(aVal + delta)} y1={pad} x2={toSvgX(aVal + delta)} y2={H - pad} stroke={C.emerald} strokeWidth={1} strokeDasharray="6 3" />

        {/* Point (a, L) */}
        <circle cx={toSvgX(aVal)} cy={toSvgY(LVal)} r={5} fill={C.navy} stroke="#fff" strokeWidth={2} />

        {/* Labels */}
        <text x={toSvgX(aVal) - 5} y={toSvgY(LVal) - 12} fontSize={11} fill={C.navy} fontWeight={700} fontFamily="'Georgia', serif">(2, 4)</text>
        <text x={toSvgX(aVal) + 8} y={toSvgY(0) + 14} fontSize={10} fill={C.emerald} fontFamily="'Georgia', serif">a = 2</text>
      </svg>

      {/* Controls */}
      <div style={{ marginTop: 14, display: "flex", flexDirection: "column", gap: 10 }}>
        {/* ε slider */}
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ fontSize: 13, color: C.coral, fontFamily: "'Georgia', serif" }}>ε = </span>
          <input type="range" min={0.05} max={2} step={0.01} value={epsilon}
            onChange={(e) => setEpsilon(Number(e.target.value))}
            style={{ flex: 1, accentColor: C.coral }}
          />
          <span style={{ fontSize: 14, color: C.coral, fontWeight: 700, fontFamily: "'Georgia', serif", minWidth: 50, textAlign: "right" }}>{epsilon.toFixed(2)}</span>
        </div>

        {/* δ display */}
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ fontSize: 13, color: C.emerald, fontFamily: "'Georgia', serif" }}>δ = </span>
          <span style={{ fontSize: 14, color: C.emerald, fontWeight: 700, fontFamily: "'Georgia', serif" }}>{delta.toFixed(4)}</span>
          <span style={{ fontSize: 11, color: C.slate, fontFamily: "'Georgia', serif" }}>= min(1, ε/5)</span>
        </div>

        {/* Challenge-response */}
        <div style={{ padding: "10px 14px", background: "rgba(13,148,136,0.06)", border: `1px solid ${C.teal}`, borderRadius: 6, fontFamily: "'Georgia', serif", fontSize: 13, color: C.navy }}>
          <strong>Challenge-Response:</strong> Given ε = {epsilon.toFixed(2)}, choose δ = {delta.toFixed(4)}.
          <br />
          Then |x − 2| &lt; δ ⟹ |x<Sup>2</Sup> − 4| &lt; ε = {epsilon.toFixed(2)} ✓
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   STEP-THROUGH PROOF
   ═══════════════════════════════════════════════════════════════ */
function StepThroughProof() {
  const [step, setStep] = useState(0);

  const steps = [
    {
      title: "Step 1: Evaluate f(x + h)",
      content: (
        <span>
          f(x + h) = (x + h)<Sup>2</Sup> = x<Sup>2</Sup> + 2xh + h<Sup>2</Sup>
        </span>
      ),
      note: "Expand the binomial using (a + b)² = a² + 2ab + b²",
    },
    {
      title: "Step 2: Compute the difference",
      content: (
        <span>
          f(x + h) − f(x) = [x<Sup>2</Sup> + 2xh + h<Sup>2</Sup>] − x<Sup>2</Sup> = 2xh + h<Sup>2</Sup>
        </span>
      ),
      note: "The x² terms cancel — this is the key simplification",
    },
    {
      title: "Step 3: Form the difference quotient",
      content: (
        <span>
          [f(x + h) − f(x)] / h = (2xh + h<Sup>2</Sup>) / h = 2x + h
        </span>
      ),
      note: "Divide through by h (valid since h ≠ 0 in the limit)",
    },
    {
      title: "Step 4: Take the limit",
      content: (
        <span>
          lim<Sub>h→0</Sub> [2x + h] = 2x ✓
        </span>
      ),
      note: "As h → 0, the term vanishes. The derivative of x² is 2x.",
    },
  ];

  const current = steps[step];

  return (
    <div style={{ background: C.paperWhite, borderRadius: 8, border: `1px solid ${C.lightGray}`, padding: 20 }}>
      <h3 style={{ fontFamily: "'Georgia', serif", fontSize: 18, color: C.navy, marginBottom: 4 }}>
        Step-Through Proof: d/dx(x²) = 2x
      </h3>
      <p style={{ fontSize: 12, color: C.slate, marginBottom: 16 }}>
        Navigate through each step of the derivative computation.
      </p>

      {/* Step indicator */}
      <div style={{ display: "flex", gap: 6, marginBottom: 16 }}>
        {steps.map((_, i) => (
          <div key={i} style={{
            width: 32, height: 4, borderRadius: 2,
            background: i === step ? C.navy : i < step ? C.emerald : C.lightGray,
            transition: "all .3s",
          }} />
        ))}
      </div>

      {/* Current step */}
      <div style={{
        padding: "16px 20px", borderRadius: 6,
        background: step === 3 ? "rgba(16,185,129,0.06)" : "rgba(26,26,46,0.03)",
        border: `1px solid ${step === 3 ? C.emerald : C.lightGray}`,
        marginBottom: 12,
      }}>
        <div style={{ fontSize: 13, color: C.softGold, fontWeight: 700, fontFamily: "'Georgia', serif", marginBottom: 8, letterSpacing: 0.5 }}>
          {current.title}
        </div>
        <div style={{ fontSize: 18, color: C.navy, fontFamily: "'Georgia', serif", lineHeight: 1.8 }}>
          {current.content}
        </div>
        <div style={{ marginTop: 10, fontSize: 12, color: C.slate, fontStyle: "italic", fontFamily: "'Georgia', serif" }}>
          💡 {current.note}
        </div>
      </div>

      {/* Navigation */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <button onClick={() => setStep((s) => Math.max(0, s - 1))} disabled={step === 0} style={{
          padding: "8px 20px", fontSize: 13, borderRadius: 4,
          border: `1px solid ${step === 0 ? C.lightGray : C.navy}`,
          background: step === 0 ? "transparent" : C.navy,
          color: step === 0 ? C.slate : C.paperWhite,
          cursor: step === 0 ? "not-allowed" : "pointer",
          fontFamily: "'Georgia', serif", transition: "all .2s",
        }}>← Prev</button>
        <span style={{ fontSize: 12, color: C.slate, fontFamily: "'Georgia', serif" }}>
          Step {step + 1} of {steps.length}
        </span>
        <button onClick={() => setStep((s) => Math.min(steps.length - 1, s + 1))} disabled={step === steps.length - 1} style={{
          padding: "8px 20px", fontSize: 13, borderRadius: 4,
          border: `1px solid ${step === steps.length - 1 ? C.lightGray : C.navy}`,
          background: step === steps.length - 1 ? "transparent" : C.navy,
          color: step === steps.length - 1 ? C.slate : C.paperWhite,
          cursor: step === steps.length - 1 ? "not-allowed" : "pointer",
          fontFamily: "'Georgia', serif", transition: "all .2s",
        }}>Next →</button>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   MAIN EXPORT: CALCULUS VISUAL STRATEGY DOCS
   ═══════════════════════════════════════════════════════════════ */
export default function CalculusVisuals() {
  const [section, setSection] = useState(0);
  const sections = [
    { title: "Tangent Lines", icon: "📈" },
    { title: "Riemann Sums", icon: "📊" },
    { title: "ε-δ Proof", icon: "🔍" },
    { title: "Step Proofs", icon: "📝" },
  ];

  return (
    <div style={{
      background: C.navy, borderRadius: 0, overflow: "auto",
      height: "100%", width: "100%", position: "relative",
    }}>
      {/* Navy header bar */}
      <div style={{
        position: "sticky", top: 0, zIndex: 10,
        background: C.navy, borderBottom: `1px solid rgba(201,168,76,0.3)`,
        padding: "12px 20px", display: "flex", alignItems: "center", gap: 16,
      }}>
        <div style={{ fontFamily: "'Georgia', serif", fontSize: 16, fontWeight: 700, color: C.softGold, letterSpacing: 1 }}>
          Calculus Visual Strategy
        </div>
        <div style={{ fontSize: 11, color: "rgba(201,168,76,0.6)", fontFamily: "'Georgia', serif" }}>
          Navy/Paper-White · Interactive Textbook
        </div>
        <div style={{ flex: 1 }} />
        {/* Section tabs */}
        <div style={{ display: "flex", gap: 4 }}>
          {sections.map((s, i) => (
            <button key={i} onClick={() => setSection(i)} style={{
              padding: "6px 12px", fontSize: 11, borderRadius: 4,
              border: `1px solid ${section === i ? C.softGold : "rgba(201,168,76,0.2)"}`,
              background: section === i ? "rgba(201,168,76,0.15)" : "transparent",
              color: section === i ? C.softGold : "rgba(201,168,76,0.5)",
              cursor: "pointer", fontFamily: "'Georgia', serif", transition: "all .2s",
              display: "flex", alignItems: "center", gap: 5,
            }}>
              <span>{s.icon}</span> {s.title}
            </button>
          ))}
        </div>
      </div>

      {/* Content area */}
      <div style={{ padding: 20, display: "flex", justifyContent: "center", alignItems: "flex-start", overflowY: "auto", maxHeight: "calc(100% - 50px)" }}>
        <div style={{ maxWidth: 600, width: "100%" }}>
          {section === 0 && <TangentLineViz />}
          {section === 1 && <RiemannSumViz />}
          {section === 2 && <EpsilonDeltaViz />}
          {section === 3 && <StepThroughProof />}
        </div>
      </div>
    </div>
  );
}

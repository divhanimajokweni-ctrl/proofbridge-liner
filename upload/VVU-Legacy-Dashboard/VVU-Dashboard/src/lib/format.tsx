// Shared display utilities for the Epistemic Runtime dashboard.

/**
 * Format a state value for compact, readable display in dense UIs.
 * - numbers: round to 4 sig figs, drop trailing zeros
 * - arrays: "[a, b, c]" with each element compactly formatted; truncate long
 *   arrays with an ellipsis count
 * - objects: shallow "{ k: v, ... }" with compact values
 * - strings/bools/null: as-is
 */
export function formatValue(v: unknown, maxLen = 28): string {
  if (v === null) return "null";
  if (v === undefined) return "—";
  if (typeof v === "boolean") return v ? "true" : "false";
  if (typeof v === "number") {
    if (!isFinite(v)) return String(v);
    if (Number.isInteger(v)) return String(v);
    // 4 significant figures, strip trailing zeros
    const r = Number(v.toPrecision(4));
    return String(r);
  }
  if (typeof v === "string") return v;
  if (Array.isArray(v)) {
    if (v.length === 0) return "[]";
    const parts = v.slice(0, 4).map((x) => formatValue(x, 10));
    let s = "[" + parts.join(", ");
    if (v.length > 4) s += `, …${v.length - 4} more`;
    s += "]";
    return s;
  }
  if (typeof v === "object") {
    const entries = Object.entries(v as Record<string, unknown>);
    if (entries.length === 0) return "{}";
    const parts = entries.slice(0, 3).map(([k, x]) => `${k}: ${formatValue(x, 10)}`);
    let s = "{ " + parts.join(", ");
    if (entries.length > 3) s += `, …${entries.length - 3} more`;
    s += " }";
    return s;
  }
  return String(v);
}

/** A tiny inline sparkline rendered as an SVG polyline. No deps. */
export function Sparkline({
  values,
  width = 80,
  height = 22,
  stroke = "var(--verified)",
  fill = "var(--verified)",
  strokeWidth = 1.5,
}: {
  values: number[];
  width?: number;
  height?: number;
  stroke?: string;
  fill?: string;
  strokeWidth?: number;
}) {
  if (!values || values.length === 0) {
    return <span className="text-[10px] text-muted-foreground font-mono">—</span>;
  }
  const n = values.length;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const pad = strokeWidth;
  const w = width;
  const h = height;
  const stepX = n === 1 ? 0 : (w - pad * 2) / (n - 1);
  const pts = values.map((v, i) => {
    const x = pad + i * stepX;
    const y = h - pad - ((v - min) / range) * (h - pad * 2);
    return `${x.toFixed(2)},${y.toFixed(2)}`;
  });
  const linePath = `M ${pts.join(" L ")}`;
  const areaPath = `${linePath} L ${pad + (n - 1) * stepX},${h - pad} L ${pad},${h - pad} Z`;
  const lastY = pts[pts.length - 1].split(",")[1];
  const lastX = pad + (n - 1) * stepX;
  return (
    <svg width={w} height={h} className="inline-block align-middle" aria-hidden>
      <path d={areaPath} fill={fill} opacity={0.12} />
      <path
        d={linePath}
        fill="none"
        stroke={stroke}
        strokeWidth={strokeWidth}
        strokeLinejoin="round"
        strokeLinecap="round"
      />
      <circle cx={lastX} cy={parseFloat(lastY)} r={1.8} fill={stroke} />
    </svg>
  );
}

/** Relative time formatter (e.g. "3s ago", "12m ago", "2h ago"). */
export function timeAgo(date: Date | string | number): string {
  const d = typeof date === "object" ? date : new Date(date);
  const s = Math.floor((Date.now() - d.getTime()) / 1000);
  if (s < 5) return "just now";
  if (s < 60) return `${s}s ago`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

/** A short, deterministic hash-style color from a string (for node/org badges). */
export function colorFromString(s: string): string {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = (h * 31 + s.charCodeAt(i)) | 0;
  }
  // pick from the warm emerald/amber/rose/teal/violet palette (no blue/indigo)
  const palette = [
    "oklch(0.78 0.16 160)", // verified emerald
    "oklch(0.80 0.15 80)", // repairing amber
    "oklch(0.74 0.13 190)", // teal
    "oklch(0.70 0.13 40)", // quarantined
    "oklch(0.68 0.16 320)", // warm violet
    "oklch(0.76 0.15 150)", // green-teal
  ];
  return palette[Math.abs(h) % palette.length];
}

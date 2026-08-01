"use client";

import { cn } from "@/lib/utils";

const STATUS_COLORS: Record<string, string> = {
  verified: "var(--verified)",
  repairing: "var(--repairing)",
  violating: "var(--violating)",
  quarantined: "var(--quarantined)",
};

function resolveColor(c?: string): string {
  if (!c) return "var(--verified)";
  return STATUS_COLORS[c] ?? c;
}

/** Helper: build SVG path "d" from points */
function polyPath(pts: { x: number; y: number }[], close = false) {
  return pts.map((p, i) => `${i ? "L" : "M"}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(" ") + (close ? " Z" : "");
}

/* ─── 1. SparkLine ─── */
export interface SparkLineProps { data: number[]; width?: number; height?: number; color?: string; fill?: boolean; className?: string }

export function SparkLine({ data, width = 120, height = 32, color, fill = false, className }: SparkLineProps) {
  if (data.length < 2) return null;
  const min = Math.min(...data), max = Math.max(...data), range = max - min || 1, p = 2;
  const pts = data.map((v, i) => ({ x: p + (i / (data.length - 1)) * (width - p * 2), y: p + (1 - (v - min) / range) * (height - p * 2) }));
  const line = polyPath(pts);
  const area = `${line} L${pts.at(-1)!.x.toFixed(1)},${height} L${pts[0].x.toFixed(1)},${height} Z`;
  const c = resolveColor(color);
  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} className={cn("overflow-visible", className)} role="img" aria-label={`Sparkline, ${data.length} pts`}>
      {fill && <path d={area} fill={c} opacity={0.15} style={{ transition: "opacity .3s" }} />}
      <path d={line} fill="none" stroke={c} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" style={{ transition: "stroke .3s" }} />
      <circle cx={pts.at(-1)!.x} cy={pts.at(-1)!.y} r={2} fill={c} style={{ transition: "fill .3s" }} />
    </svg>
  );
}

/* ─── 2. MiniBar ─── */
export interface MiniBarProps { data: { label: string; value: number; color?: string }[]; width?: number; height?: number; horizontal?: boolean; className?: string }

export function MiniBar({ data, width = 200, height = 80, horizontal = false, className }: MiniBarProps) {
  if (!data.length) return null;
  const maxVal = Math.max(...data.map((d) => d.value), 1);
  const svgProps = { width, height, viewBox: `0 0 ${width} ${height}`, className: cn("overflow-visible", className), role: "img" as const, "aria-label": "Bar chart" };

  if (horizontal) {
    const barH = Math.max(8, (height - 8) / data.length - 3), labelW = 40, areaW = width - labelW - 4;
    return (
      <svg {...svgProps}>
        {data.map((d, i) => {
          const bw = (d.value / maxVal) * areaW, y = 4 + i * (barH + 3);
          return <g key={i} style={{ transition: "opacity .3s" }}>
            <text x={labelW - 4} y={y + barH / 2} textAnchor="end" dominantBaseline="central" fill="currentColor" fontSize={9} opacity={0.6}>{d.label}</text>
            <rect x={labelW} y={y} width={bw} height={barH} rx={2} fill={resolveColor(d.color)} opacity={0.8} style={{ transition: "width .4s ease,fill .3s" }} />
            <text x={labelW + bw + 4} y={y + barH / 2} dominantBaseline="central" fill="currentColor" fontSize={8} opacity={0.5}>{d.value}</text>
          </g>;
        })}
      </svg>
    );
  }

  const barW = Math.max(8, (width - 8) / data.length - 2), barAreaH = height - 18;
  return (
    <svg {...svgProps}>
      {data.map((d, i) => {
        const bh = (d.value / maxVal) * barAreaH, x = 4 + i * (barW + 2), y = 4 + barAreaH - bh;
        return <g key={i} style={{ transition: "opacity .3s" }}>
          <rect x={x} y={y} width={barW} height={bh} rx={2} fill={resolveColor(d.color)} opacity={0.8} style={{ transition: "height .4s ease,y .4s ease,fill .3s" }} />
          <text x={x + barW / 2} y={height - 2} textAnchor="middle" fill="currentColor" fontSize={8} opacity={0.5}>{d.label.length > 4 ? d.label.slice(0, 3) + "…" : d.label}</text>
        </g>;
      })}
    </svg>
  );
}

/* ─── 3. DonutChart ─── */
export interface DonutChartProps { data: { label: string; value: number; color: string }[]; size?: number; thickness?: number; className?: string; showLabels?: boolean }

export function DonutChart({ data, size = 80, thickness = 12, className, showLabels = false }: DonutChartProps) {
  if (!data.length) return null;
  const total = data.reduce((s, d) => s + d.value, 0) || 1;
  const r = (size - thickness) / 2, circ = 2 * Math.PI * r, cx = size / 2, cy = size / 2;

  const segs = data.reduce<Array<{ dash: number; gap: number; offset: number; color: string; label: string; i: number }>>(
    (acc, d, i) => {
      const dash = (d.value / total) * circ;
      const offset = acc.length ? acc[acc.length - 1].offset + acc[acc.length - 1].dash : 0;
      acc.push({ dash, gap: circ - dash, offset, color: d.color, label: d.label, i });
      return acc;
    }, []);

  return (
    <div className={cn("inline-flex flex-col items-center", className)}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} role="img" aria-label="Donut chart">
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="currentColor" strokeWidth={thickness} opacity={0.06} />
        {segs.map((s) => (
          <circle key={s.i} cx={cx} cy={cy} r={r} fill="none" stroke={resolveColor(s.color)} strokeWidth={thickness}
            strokeDasharray={`${s.dash} ${s.gap}`} strokeDashoffset={-s.offset} strokeLinecap="butt"
            style={{ transition: "stroke-dasharray .6s ease,stroke-dashoffset .6s ease" }} role="presentation" />
        ))}
        <text x={cx} y={cy - 4} textAnchor="middle" dominantBaseline="central" fill="currentColor" fontSize={size * 0.16} fontWeight={600}>{total}</text>
        <text x={cx} y={cy + size * 0.1} textAnchor="middle" dominantBaseline="central" fill="currentColor" fontSize={size * 0.09} opacity={0.5}>total</text>
      </svg>
      {showLabels && (
        <div className="mt-1.5 flex flex-wrap justify-center gap-x-2.5 gap-y-0.5">
          {data.map((d, i) => (
            <span key={i} className="flex items-center gap-1 text-[9px] text-muted-foreground">
              <span className="inline-block h-1.5 w-1.5 rounded-full" style={{ backgroundColor: resolveColor(d.color) }} />{d.label}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

/* ─── 4. RadarGrid ─── */
export interface RadarGridProps { data: { label: string; value: number; max?: number }[]; size?: number; color?: string; className?: string }

export function RadarGrid({ data, size = 120, color, className }: RadarGridProps) {
  if (data.length < 3) return null;
  const cx = size / 2, cy = size / 2, r = size / 2 - 20, n = data.length, step = (2 * Math.PI) / n;
  const pt = (a: number, rad: number) => ({ x: cx + rad * Math.cos(a - Math.PI / 2), y: cy + rad * Math.sin(a - Math.PI / 2) });
  const ringPath = (pct: number) => polyPath(Array.from({ length: n }, (_, i) => pt(i * step, pct * r)), true);
  const dp = data.map((d, i) => pt(i * step, Math.min(d.value / (d.max ?? 100), 1) * r));
  const c = resolveColor(color);

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className={cn("overflow-visible", className)} role="img" aria-label="Radar chart">
      {[0.25, 0.5, 0.75, 1].map((pct, ri) => <path key={ri} d={ringPath(pct)} fill="none" stroke="currentColor" strokeWidth={0.5} opacity={0.1 + ri * 0.03} />)}
      {Array.from({ length: n }, (_, i) => <line key={i} x1={cx} y1={cy} x2={pt(i * step, r).x} y2={pt(i * step, r).y} stroke="currentColor" strokeWidth={0.5} opacity={0.1} />)}
      <path d={polyPath(dp, true)} fill={c} fillOpacity={0.15} stroke={c} strokeWidth={1.5} strokeLinejoin="round" style={{ transition: "fill .3s,stroke .3s" }} />
      {dp.map((p, i) => (
        <g key={i}>
          <circle cx={p.x} cy={p.y} r={2.5} fill={c} style={{ transition: "fill .3s" }} />
          {size >= 100 && <text x={pt(i * step, r + 12).x} y={pt(i * step, r + 12).y} textAnchor="middle" dominantBaseline="central" fill="currentColor" fontSize={8} opacity={0.5}>
            {data[i].label.length > 6 ? data[i].label.slice(0, 5) + "…" : data[i].label}
          </text>}
        </g>
      ))}
    </svg>
  );
}

/* ─── 5. MetricGauge ─── */
export interface MetricGaugeProps { value: number; max?: number; label?: string; color?: string; size?: number; className?: string }

export function MetricGauge({ value, max = 100, label, color, size = 100, className }: MetricGaugeProps) {
  const r = (size - 16) / 2, cx = size / 2, cy = size / 2, arcLen = Math.PI * r, pct = Math.min(Math.max(value / max, 0), 1);
  const c = resolveColor(color);
  const arc = `M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`;
  return (
    <div className={cn("inline-flex flex-col items-center", className)}>
      <svg width={size} height={size / 2 + 8} viewBox={`0 0 ${size} ${size / 2 + 8}`} role="img" aria-label={`${label ?? "Gauge"}: ${value}/${max}`}>
        <path d={arc} fill="none" stroke="currentColor" strokeWidth={6} opacity={0.08} strokeLinecap="round" />
        <path d={arc} fill="none" stroke={c} strokeWidth={6} strokeLinecap="round" strokeDasharray={`${pct * arcLen} ${arcLen}`} style={{ transition: "stroke-dasharray .6s ease,stroke .3s" }} />
        <text x={cx} y={cy - 4} textAnchor="middle" dominantBaseline="central" fill="currentColor" fontSize={size * 0.18} fontWeight={600}>{value}</text>
        <text x={cx} y={cy + 10} textAnchor="middle" dominantBaseline="central" fill="currentColor" fontSize={size * 0.08} opacity={0.4}>/{max}</text>
      </svg>
      {label && <span className="mt-0.5 text-[9px] text-muted-foreground">{label}</span>}
    </div>
  );
}

/* ─── 6. HeatGrid ─── */
export interface HeatGridProps { data: { x: number; y: number; value: number; label?: string }[]; rows?: number; cols?: number; colorScale?: [string, string]; className?: string }

export function HeatGrid({ data, rows = 7, cols = 24, colorScale, className }: HeatGridProps) {
  const cs = 14, gap = 2, w = cols * (cs + gap), h = rows * (cs + gap);
  const lo = colorScale?.[0] ?? "var(--quarantined)", hi = colorScale?.[1] ?? "var(--verified)";
  const maxV = Math.max(...data.map((d) => d.value), 1), minV = Math.min(...data.map((d) => d.value), 0);
  const map = new Map(data.map((d) => [`${d.x},${d.y}`, d]));

  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} className={cn("overflow-visible", className)} role="img" aria-label="Heatmap grid">
      {Array.from({ length: rows }, (_, y) =>
        Array.from({ length: cols }, (_, x) => {
          const cell = map.get(`${x},${y}`);
          const t = maxV > minV && cell ? (cell.value - minV) / (maxV - minV) : 0;
          return <rect key={`${x}-${y}`} x={x * (cs + gap)} y={y * (cs + gap)} width={cs} height={cs} rx={2}
            fill={t > 0.5 ? hi : lo} opacity={t === 0 ? 0.04 : 0.2 + t * 0.7}
            style={{ transition: "opacity .3s,fill .3s" }}>
            {cell?.label && <title>{cell.label}</title>}
          </rect>;
        })
      )}
    </svg>
  );
}

/* ─── 7. TimelineBar ─── */
export interface TimelineBarProps { events: { time: string; label: string; color?: string; type?: string }[]; width?: number; className?: string }

export function TimelineBar({ events, width = 400, className }: TimelineBarProps) {
  if (!events.length) return null;
  const h = 36, pad = 12;
  return (
    <svg width={width} height={h} viewBox={`0 0 ${width} ${h}`} className={cn("overflow-visible", className)} role="img" aria-label="Timeline">
      <line x1={pad} y1={h / 2} x2={width - pad} y2={h / 2} stroke="currentColor" strokeWidth={1} opacity={0.15} />
      {events.map((e, i) => {
        const x = pad + (i / Math.max(events.length - 1, 1)) * (width - pad * 2);
        const c = resolveColor(e.color ?? (e.type === "violation" ? "violating" : e.type === "repair" ? "repairing" : "verified"));
        return (
          <g key={i} style={{ transition: "opacity .3s" }}>
            <circle cx={x} cy={h / 2} r={4} fill={c} opacity={0.8} style={{ transition: "fill .3s" }}>
              <title>{`${e.time} — ${e.label}`}</title>
            </circle>
            {(e.type === "violation" || e.type === "repair") && (
              <circle cx={x} cy={h / 2} r={7} fill="none" stroke={c} strokeWidth={1} opacity={0.3}>
                <animate attributeName="r" values="4;8;4" dur="2s" repeatCount="indefinite" />
                <animate attributeName="opacity" values="0.4;0;0.4" dur="2s" repeatCount="indefinite" />
              </circle>
            )}
            <text x={x} y={i % 2 === 0 ? h / 2 - 10 : h / 2 + 14} textAnchor="middle" fill="currentColor" fontSize={8} opacity={0.55}>
              {e.label.length > 10 ? e.label.slice(0, 9) + "…" : e.label}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

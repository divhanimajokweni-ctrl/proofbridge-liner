# Task 1-a: Chart Primitives

## Summary
Created `/home/z/my-project/src/components/epistemic/chart-primitives.tsx` — 225 lines of lightweight SVG-based chart components to replace recharts and reduce OOM risk during Turbopack compilation.

## Components Created (7 total, all named exports)
1. **SparkLine** — SVG line/area sparkline (replaces LineChart/AreaChart)
2. **MiniBar** — Horizontal/vertical bar chart (replaces BarChart/Bar)
3. **DonutChart** — Donut/pie chart with stroke-dasharray (replaces PieChart/Pie)
4. **RadarGrid** — Radar/spider chart on polygonal grid (replaces RadarChart/Radar)
5. **MetricGauge** — Semicircular gauge for KPIs
6. **HeatGrid** — Heatmap grid for coverage/invariant status
7. **TimelineBar** — Horizontal timeline with event markers

## Key Decisions
- Zero external dependencies (pure SVG/CSS only)
- Dark/light mode via CSS variables (`var(--verified)`, `var(--repairing)`, etc.)
- Immutable reduce pattern in DonutChart to satisfy react-hooks/immutability lint rule
- Smooth CSS transitions on all animated properties
- SVG `<animate>` for pulsing violation/repair indicators in TimelineBar

## File Location
`/home/z/my-project/src/components/epistemic/chart-primitives.tsx`

## Lint Status
✅ 0 errors, 0 warnings

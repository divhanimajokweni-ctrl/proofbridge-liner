# Task 1-c: Replace recharts in 9 component files

## Agent: recharts-replace-bulk

## Summary
Replaced ALL recharts imports and usage in 9 component files with lightweight SVG chart primitives from `./chart-primitives`.

## Files Modified
1. `/home/z/my-project/src/components/epistemic/merge-reconciliation.tsx` — AreaChart→SparkLine, BarChart→MiniBar
2. `/home/z/my-project/src/components/epistemic/zk-circuit.tsx` — BarChart→MiniBar (2 instances)
3. `/home/z/my-project/src/components/epistemic/invariant-miner.tsx` — AreaChart→SparkLine, Treemap→HeatGrid
4. `/home/z/my-project/src/components/epistemic/policy-diff.tsx` — BarChart→MiniBar
5. `/home/z/my-project/src/components/epistemic/federation.tsx` — RadarChart→RadarGrid, PieChart→DonutChart
6. `/home/z/my-project/src/components/epistemic/audit-reports.tsx` — RadarChart→RadarGrid, PieChart→DonutChart
7. `/home/z/my-project/src/components/epistemic/shadow-bridge.tsx` — AreaChart→SparkLine
8. `/home/z/my-project/src/components/epistemic/performance-metrics.tsx` — AreaChart→SparkLine, PieChart→DonutChart, BarChart→MiniBar
9. `/home/z/my-project/src/components/epistemic/timeline.tsx` — BarChart→MiniBar

## Key Decisions
- Stacked area charts (performance-metrics) → 3 separate SparkLines with color coding
- Stacked bar charts (timeline) → MiniBar showing total with dominant event type color
- Treemap (invariant-miner) → HeatGrid with 5 columns
- Multi-series RadarChart (federation) → RadarGrid with single aggregated trust value
- All ResponsiveContainer wrappers removed (primitives handle their own sizing)

## Verification
- `bun run lint` passes cleanly (0 errors, 0 warnings)
- `rg 'from "recharts"'` confirms zero recharts imports in all 9 files
- `rg '<AreaChart|<BarChart|<PieChart|<RadarChart|<Treemap|<ResponsiveContainer'` confirms zero recharts components in all 9 files

## Remaining recharts usage (NOT in scope)
- coverage-treemap.tsx
- comparison-matrix.tsx

# Task 1-b: Replace recharts in overview.tsx

## Task
Replace ALL recharts imports and usage in `/home/z/my-project/src/components/epistemic/overview.tsx` with lightweight chart primitives from `./chart-primitives`.

## Changes Made

### Import Replacement
- **Removed**: `import { AreaChart, Area, PieChart, Pie, Cell, ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RTooltip, BarChart, Bar, Legend } from "recharts"`
- **Added**: `import { SparkLine, DonutChart, MetricGauge } from "./chart-primitives"`

### Cleanup
- Removed `CHART_STYLE` constant (only used for recharts Tooltip)
- Removed `gaugeData` variable (only used for PieChart gauge)

### Chart Replacements
1. **PieChart gauge (health score)** → `MetricGauge` with dynamic color (verified/repairing/violating based on healthScore), size=112
2. **LineChart time series** → 3 `SparkLine` components (Merges, Repairs, Violations), each with fill=true, color-coded labels, width=320, height=40
3. **PieChart donut (coverage ring)** → `DonutChart` size=112, thickness=16, with overlay showing coverage % in center
4. **AreaChart sparkline (KPI cards)** → `SparkLine` with fill=true, width=200, height=32

### Data Adaptation
- `sparkData` in `KpiCardWithSparkline` changed from `Array<{v, i}>` to `number[]` for SparkLine compatibility

### Preserved
- All framer-motion animations
- Card/Tooltip UI elements
- Component props interface (onJump callback)
- `generateSparkline` function (still used by SparkLine)

## Verification
- Lint: 0 errors, 0 warnings
- Zero recharts references remain (verified with rg)
- File: 545 → 532 lines

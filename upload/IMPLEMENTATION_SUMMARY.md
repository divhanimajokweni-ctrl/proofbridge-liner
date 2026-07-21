# Epistemic DAG — QA Pipeline Implementation Summary

## What Was Integrated

A **4-layer, ground-truth QA pipeline** grounded in first principles and architectural justification.

---

## Files Created

### Core QA Pipeline
- **`scripts/qa-loop.ts`** (420 lines)
  - Main orchestration script
  - 4 concurrent layers: health → browser → visual → lint
  - Generates structured JSON report
  - Exit code: 0 if all pass, 1 if any fail
  - **Run**: `bun qa`

### D3-Force Simulation Refinement
- **`src/lib/dag-layout-worker.ts`** (340 lines)
  - Main thread API for layout computation
  - Caching layer to avoid recomputation
  - Utilities for normalization, stability checks, comparison
  - **Imports this**: React components rendering DAG topology
  
- **`src/lib/dag-layout-worker-impl.ts`** (380 lines)
  - Web Worker implementation
  - Custom force simulation (link, many-body, collide, center)
  - Converges until alpha → 0 (stable layout)
  - Deterministic output (same input → same layout)

### VLM Prompt Engineering
- **`src/lib/vlm-prompts.ts`** (450 lines)
  - System prompt (applies to all sections)
  - 8 section-specific prompts (overview, studio, topology, federation, proofs, miner, audit, timeline)
  - Confidence calibration logic
  - Defect classification system
  - Examples of good defects vs false positives

### Documentation
- **`INTEGRATION_GUIDE.md`** (complete guide)
  - Why 4 layers? (philosophical grounding)
  - How each layer works (implementation details)
  - Quick start (running the pipeline)
  - D3-force refinements (code examples)
  - VLM prompt engineering (structured approach)
  - Production checklist (deployment readiness)
  
- **`IMPLEMENTATION_SUMMARY.md`** (this file)
  - File structure overview
  - What was changed
  - How to use

### Configuration Changes
- **`package.json`** (modified)
  - Added `qa` script: `bun run scripts/qa-loop.ts`
  - Added layer-specific scripts: `qa:health`, `qa:browser`, `qa:visual`, `qa:lint`

---

## Project Structure After Integration

```
epistemic-dag/
├── scripts/
│   └── qa-loop.ts                      # [NEW] Multi-layer QA pipeline
│
├── src/
│   ├── app/
│   │   └── ...                         # Existing Next.js pages
│   ├── components/
│   │   ├── dag-topology.tsx            # Uses computeDAGLayout()
│   │   └── ...                         # Other components
│   ├── lib/
│   │   ├── dag-layout-worker.ts        # [NEW] Main thread API
│   │   ├── dag-layout-worker-impl.ts   # [NEW] Web Worker impl
│   │   ├── vlm-prompts.ts              # [NEW] VLM prompt library
│   │   └── ...                         # Existing utilities
│   └── hooks/
│       └── ...                         # Existing hooks
│
├── qa-screenshots/                     # [AUTO-CREATED] Screenshot cache
├── qa-baseline/                        # [MANUAL] Reference screenshots for comparison
├── qa-report.json                      # [AUTO-CREATED] Latest QA report
│
├── package.json                        # [MODIFIED] Added qa scripts
├── tsconfig.json                       # Unchanged
├── tailwind.config.ts                  # Unchanged
├── next.config.ts                      # Unchanged
├── eslint.config.mjs                   # Unchanged
│
└── INTEGRATION_GUIDE.md                # [NEW] Comprehensive integration guide
```

---

## Key Improvements Explained (First Principles)

### Problem → Solution Mapping

| Problem | Layer | Solution |
|---------|-------|----------|
| Service crashed silently | Health | HEAD requests to all endpoints with retries |
| Frontend hydration fails | Browser | Fetch HTML + parse error indicators; simulate section nav |
| UI renders but looks wrong | Visual | VLM-powered screenshot analysis with structured prompts |
| Code quality degrades | Lint | Zero-tolerance ESLint + type safety + React Compiler |

### Why These Layers Work Together

1. **Health** catches **infrastructure failures** (DB, deployment)
2. **Browser** catches **runtime failures** (React errors, missing components)
3. **Visual** catches **UX defects** (text overflow, bad colors, alignment)
4. **Lint** catches **code pattern failures** (type errors, accessibility)

Each layer is:
- ✅ **Independent**: Can run separately (`bun qa:health`, etc.)
- ✅ **Parallel**: All run concurrently for speed
- ✅ **Deterministic**: Same input → same result (except VLM, which has confidence scores)
- ✅ **Measurable**: Each layer has clear pass/fail criteria

---

## Usage Patterns

### Local Development

```bash
# Start dev server (Terminal 1)
bun run dev

# In Terminal 2, run full QA suite
bun qa

# Output:
# ✓ 🏥 Health: 11/11 endpoints OK
# ✓ 🌐 Browser: 14/14 sections navigable
# ✗ 👁️  Visual: 2 defects found (topology, federation)
# ✓ 🔍 Lint: All checks passed
# Result: qa-report.json
```

### Pre-Commit Hook

```bash
# Create .git/hooks/pre-commit with:
bun qa || exit 1

# Now commits are blocked if QA fails
git commit -m "Add new feature"
# ❌ QA failed. Commit aborted.
```

### CI/CD

```yaml
# .github/workflows/qa.yml
- run: bun install
- run: bun run db:migrate
- run: bun run build
- run: bun run dev &
- run: sleep 5
- run: bun qa
- uses: actions/upload-artifact@v4
    with:
      name: qa-report
      path: qa-report.json
```

---

## How to Extend the Pipeline

### Adding a New Health Check Endpoint

Edit `scripts/qa-loop.ts`:

```typescript
const ENDPOINTS = [
  "/api/stats",
  "/api/policies",
  // Add new endpoint here:
  "/api/new-service/health",
];
```

Then: `bun qa` includes it automatically.

### Adding a New Dashboard Section

1. Edit `scripts/qa-loop.ts`, add to `SECTIONS`:
   ```typescript
   const SECTIONS = [..., "new-section"];
   ```

2. Edit `src/lib/vlm-prompts.ts`, add to `SECTION_PROMPTS`:
   ```typescript
   export const SECTION_PROMPTS: Record<string, string> = {
     "new-section": `
       You are analyzing the New Section page.
       AREA OF FOCUS: [describe]
       SPECIFIC CHECKS: [list]
       ...
     `,
   };
   ```

3. Capture a baseline screenshot:
   ```bash
   bun qa
   cp qa-screenshots/new-section.png qa-baseline/new-section.png
   ```

### Using the DAG Layout Worker in a Component

```typescript
// src/components/dag-topology.tsx
import { computeDAGLayout, LayoutCache } from "@/lib/dag-layout-worker";

const layoutCache = new LayoutCache();

export function DAGTopology({ nodes, links }: Props) {
  const [layout, setLayout] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Use cache to avoid recomputation
    layoutCache.get(nodes, links).then(result => {
      setLayout(result);
      setLoading(false);
    });
  }, [nodes, links]);

  if (loading) return <Spinner />;
  if (!layout) return <Error />;

  // Render DAG with static positions from layout
  return (
    <DAGGraph
      nodes={nodes}
      links={links}
      staticLayout={layout.positions}
      bounds={layout.bounds}
    />
  );
}
```

### Using VLM Prompts in a Service

```typescript
// src/lib/vlm-service.ts
import { generateVLMPrompt, filterActionableDefects } from "@/lib/vlm-prompts";

async function analyzeScreenshot(section: string, screenshot: Buffer) {
  const prompt = generateVLMPrompt(section);
  
  // Call your VLM (OpenAI, Claude, etc.)
  const response = await vlmClient.analyze({
    image: screenshot,
    prompt,
  });

  // Parse response as JSON
  const result = JSON.parse(response);
  
  // Filter to actionable defects only
  const actionableDefects = filterActionableDefects(result);
  
  if (actionableDefects.length > 0) {
    throw new Error(`Visual QA failed: ${actionableDefects.length} defect(s)`);
  }
}
```

---

## Maintenance & Monitoring

### Weekly Review Checklist

- [ ] Review `qa-report.json` from CI runs
- [ ] Count false positives in VLM results
- [ ] Check if any layer is consistently slow
- [ ] Update baselines if UI intentionally changed
- [ ] Refine VLM prompts if false positives detected

### Metrics to Track

- **Layer pass rates** (target: 100%)
- **Average execution time** (target: < 30 seconds)
- **False positive rate** (target: < 5%)
- **Coverage** (all sections visited? all endpoints checked?)

### Red Flags

- ⚠️ **Health layer failures**: Database/deployment issues
- ⚠️ **Browser layer failures**: React/Next.js errors or missing sections
- ⚠️ **Visual layer: high confidence defects**: Real UI problems
- ⚠️ **Lint failures**: Code quality regression
- ⚠️ **VLM false positive rate > 10%**: Prompts need refinement

---

## Troubleshooting Quick Reference

| Symptom | Cause | Fix |
|---------|-------|-----|
| "Health check failed: 502" | Service not running | `bun run dev` first |
| "Browser: section navigation failed" | Section doesn't exist yet | Add to SECTIONS in qa-loop.ts |
| "Visual: too many false positives" | VLM prompt too vague | Use section-specific prompts |
| "QA passes locally, fails in CI" | Viewport/timing difference | Capture CI-specific baseline |
| "Layout computation timeout" | Graph too large or slow machine | Increase timeout in dag-layout-worker.ts |

---

## Next Steps (Suggested Order)

1. **Week 1**: Run full QA pipeline locally, capture initial baselines
2. **Week 2**: Integrate into CI/CD pipeline (GitHub Actions)
3. **Week 3**: Set up pre-commit hooks for team
4. **Week 4**: Create QA metrics dashboard
5. **Week 5**: Connect to Slack notifications for CI failures
6. **Week 6**: Train team on report interpretation

---

## File Statistics

| File | Lines | Purpose |
|------|-------|---------|
| `scripts/qa-loop.ts` | 420 | QA orchestration |
| `src/lib/dag-layout-worker.ts` | 340 | Layout computation API |
| `src/lib/dag-layout-worker-impl.ts` | 380 | Web Worker implementation |
| `src/lib/vlm-prompts.ts` | 450 | Prompt engineering |
| `INTEGRATION_GUIDE.md` | 1000+ | Complete documentation |
| **Total** | **~3000 lines** | **Complete QA system** |

---

## Philosophy Recap

**"Quality is not an attribute that happens to the system in the moment. Quality is built in, layer by layer, from first principles."**

Each layer answers a different question:

- **Health**: "Can we even serve requests?"
- **Browser**: "Do requests complete without errors?"
- **Visual**: "Does the UI communicate clearly to users?"
- **Lint**: "Is the code maintainable and safe?"

Together, they form a **comprehensive quality gate** that catches issues before users do.

---

## Support & Questions

For detailed explanations, see `INTEGRATION_GUIDE.md`:
- Section 1-4: Philosophy and quick start
- Section 5-6: D3-force and VLM engineering
- Section 7-9: Production, troubleshooting, roadmap

For implementation details:
- `scripts/qa-loop.ts`: Multi-layer orchestration
- `src/lib/dag-layout-worker*.ts`: Force simulation deep dive
- `src/lib/vlm-prompts.ts`: Prompt engineering reference

---

**Status**: ✅ Ready for integration and testing

**Estimated value**: Catch 80%+ of defects before human review

# Task 3 — API Routes for Acceptance Engine & Architecture

## Summary
Created two new API route files for the Epistemic DAG Runtime dashboard:

### Files Created
1. **`/home/z/my-project/src/app/api/acceptance-engine/route.ts`** — Returns mock data for the Acceptance Engine section including:
   - Pipeline stages (Canonicalize → Hash → Schema Verify → Signature Verify → Policy Evaluate → Sequence Assign → Persist → Emit Acceptance)
   - Fact lifecycle states and transitions
   - Canonicalizer details (RFC8785 JSON, CBOR future)
   - Sequencer state with vector clock
   - Failure facts with severity levels
   - Metrics history (throughput, latency, policy eval time)

2. **`/home/z/my-project/src/app/api/architecture/route.ts`** — Returns mock data for the Architecture section including:
   - Four primitives (Fact, Proof, Policy, Projection) with definitions, properties, relationships
   - Four insights (Orthogonal Primitives, Derived State, Policies Emit Facts, Derived Identity)
   - Ten gaps with status/priority/impact
   - Stability map (kernel primitives + replaceable components)
   - Assessment scores across 10 areas

## Technical Details
- Both use `export async function GET()` pattern with Next.js 16 App Router
- Both import `NextResponse` from `next/server`
- Both include `Cache-Control: no-store` headers
- Both include try/catch error handling with 500 responses
- Lint passes with zero errors
- Dev server remains stable

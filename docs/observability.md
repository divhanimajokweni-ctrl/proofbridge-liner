# Observability — ProofBridge Liner

## Scope
This document describes the OpenTelemetry (OTel) instrumentation and vendor
integration model for ProofBridge Liner observability. The runtime suite is
implemented in `scripts/observability.py` and is excluded from the Vercel build.

## Architecture
- Next.js frontend emits application-level traces via OTel SDK.
- `scripts/observability.py` configures OTLP export and optional vendor
  forwards at runtime.
- Vercel native observability (Analytics/Speed Insights) remains enabled for
  platform-level metrics.

## Vendor Integrations

| Vendor | Env var | Purpose |
|--------|---------|---------|
| Langfuse | `ENABLE_LANGFUSE=true` | LLM call tracing |
| Phoenix | `ENABLE_PHOENIX=true` | Generative AI traces |
| MLflow | `ENABLE_MLFLOW=true` | Experiment tracking |
| PromptLayer | `ENABLE_PROMPTLAYER=true` | Prompt management |

## Event Emission
Use the OTel `Tracer` to emit spans for:
- `proofbridge.verify` — verification route handler execution
- `proofbridge.mint` — mint route handler execution
- `gate.orchestrate` — gate orchestration runner execution

## Environment Configuration
- `OTLP_ENDPOINT` is required for telemetry export.
- Vendor forwards are opt-in via boolean environment variables.
- No secrets/keys are logged or emitted in traces.

## Rollback
To disable observability without redeploying:
1. Unset vendor `ENABLE_*` variables.
2. Clear `OTLP_ENDPOINT` to halt export.
3. Verify HeartbeatBus health and Gate B outbox depth (< 100).

## Rollback Checklist
- Gate D contracts: trip CircuitBreaker via oracle wallet (halts all gated transfers; owner can reset).
- Gate B worker: redeploy previous container tag (outbox is durable).
- Vercel (Gate A): instant rollback via dashboard/CLI to `dpl_5HUyMiTS2aBphgKJpQKwTJzLRQyd`.

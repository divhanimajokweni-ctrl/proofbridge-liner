# Phase 1: Repository Debt Resolution — Module Failure Classification

## Summary
Root cause: `tsconfig.json` path mapping `@/lib/*` → `./lib/*` hijacked all `@/lib/` imports away from `./src/lib/` where the actual files lived. Fixed by removing the incorrect mapping (relying on `@/*` → `./src/*` catch-all) and moving `lib/rate-limiter.ts` to `src/lib/rate-limiter.ts`.

## Classification of Each Failure

| # | Module Path | Used By | Classification | Justification |
|---|------------|---------|---------------|---------------|
| 1 | `@/lib/agent/conversation-store` | `app/api/agent/converse/route.ts` | **Fixed** | File exists at `src/lib/agent/conversation-store.ts`. Was shadowed by incorrect `@/lib/*` → `./lib/*` mapping. Resolved by removing that mapping. |
| 2 | `@/lib/agents/conversation-store` | `app/api/converse/route.ts` | **Fixed** | File exists at `src/lib/agents/conversation-store.ts`. Same root cause as #1. |
| 3 | `@/lib/kernel/vvu-operatus` | `app/api/operatus/{logs,panic,tick,route}.ts` (4 files) | **Fixed** | File exists at `src/lib/kernel/vvu-operatus.ts`. Same root cause. |
| 4 | `@/lib/tee/attestation` | `app/api/verify/route.ts` | **Fixed** | File exists at `src/lib/tee/attestation.ts`. Same root cause. |
| 5 | `@/lib/contracts/circuitBreakerAbi` | `app/api/verify/route.ts`, `src/middleware.ts` | **Fixed** | File exists at `src/lib/contracts/circuitBreakerAbi.ts`. Same root cause. |
| 6 | `@/lib/kernel/vvu-os` | `app/components/KernelConsole.tsx` | **Fixed** | File exists at `src/lib/kernel/vvu-os.ts`. Same root cause. |
| 7 | `@/lib/kernel/vvu-os-v2` | `app/components/KernelConsoleV2.tsx` | **Fixed** | File exists at `src/lib/kernel/vvu-os-v2.ts`. Same root cause. |
| 8 | `@/lib/audit/soc2_exporter` | `src/app/api/audit/export/route.ts` | **Fixed** | File exists at `src/lib/audit/soc2_exporter.ts`. Same root cause. |
| 9 | `@/lib/audit/auditService` | `src/app/api/audit/export/route.ts`, `src/app/api/lindiwe/query/route.ts`, `src/lib/audit/soc2_exporter.ts` | **Fixed** | File exists at `src/lib/audit/auditService.ts`. Same root cause. |
| 10 | `@/lib/watchdog/WatchdogProbes` | `src/app/api/health/route.ts`, `src/app/api/webhooks/route.ts` | **Fixed** | File exists at `src/lib/watchdog/WatchdogProbes.ts`. Same root cause. |
| 11 | `@/lib/lindiwe/LindiweCognitiveHandler` | `src/app/api/lindiwe/query/route.ts` | **Fixed** | File exists at `src/lib/lindiwe/LindiweCognitiveHandler.ts`. Same root cause. |
| 12 | `@/lib/lindiwe/LindiweVoiceEngine` | `src/app/api/lindiwe/query/route.ts` | **Fixed** | File exists at `src/lib/lindiwe/LindiweVoiceEngine.ts`. Same root cause. |
| 13 | `@/lib/lindiwe/LindiweReasoningEngine` | `src/app/api/lindiwe/query/route.ts` | **Fixed** | File exists at `src/lib/lindiwe/LindiweReasoningEngine.ts`. Same root cause. |
| 14 | `@/lib/supabase` | `src/app/api/receipts/route.ts`, `src/app/api/replay/route.ts`, `src/lib/audit.ts` | **Fixed** | File exists at `src/lib/supabase.ts`. Same root cause. |
| 15 | `@/lib/utils` | `src/components/ui/button.tsx` | **Fixed** | File exists at `src/lib/utils.ts`. Same root cause. |

**Note:** 15 unique paths found, encompassing all 14 original failure sources (the `auditService` module accounts for 3 different import sites but is 1 module).

## Verification
- Build command: `npm run build` → **Compiled successfully, 0 type errors**
- Contract tests: 52/52 passed
- Unit tests: 12/12 passed

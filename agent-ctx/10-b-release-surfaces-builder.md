# Task 10-b — Release-Engineering Surfaces Builder (Identity + Acceptance)

Agent: Release Surfaces Builder (Task 10-b)
Scope: Build 2 React panels for the VVU IVE workspace — `IdentityRegistryPanel` (IDR) and `AcceptanceChecklistPanel` (ACC). Both are release-engineering surfaces mandated by the Execution and Preservation Constraints addendum and read exclusively from `src/lib/ive/release.ts`.

## Inputs read
- `/home/z/my-project/worklog.md` — frozen identity (IVE = platform, HBK MK-II = demo), forbidden terms, architecture decisions.
- `/home/z/my-project/src/lib/ive/release.ts` — `STATUS_VOCABULARY` (2 groups, 14 states), `IDENTITY_REGISTRY` (6 entries, all preserved=true), `DASHBOARD_ACCEPTANCE` (8 checks, all satisfied=true), `LICENSE_STATUS`, `DISPOSITION`.
- `/home/z/my-project/src/store/useIveStore.ts` — `WorkspacePanelId` includes `"identity"` and `"acceptance"`; `PANELS` catalog declares both with their tag/accent/mission strings.
- `/home/z/my-project/src/lib/ive/types.ts` — `WorkspacePanelId` frozen contract.
- `/home/z/my-project/src/components/ive/primitives.tsx` — `PanelFrame`, `StatCard`, `StatusPill`, `MonoTable`, `SectionLabel`, `Kbd`.
- `/home/z/my-project/src/components/ive/panels/OverviewPanel.tsx` + `TrustSpherePanel.tsx` — cinematic visual language reference.

## Work Log
- Drafted `IdentityRegistryPanel.tsx`:
  - Hero banner with the identity-conflict-handling rule (verbatim from addendum).
  - Identity Registry: rich card per `IDENTITY_REGISTRY` entry, left vertical accent bar color-coded by role (Platform=gold, Demonstration Application=blocked-red, Independent Component=blue, Verification OS=proven-green, Historical=muted), role badge, status pill, detail text, PRESERVED badge. Stagger animation.
  - Role legend mapping each role → color → meaning.
  - Status Vocabulary: 2 columns side-by-side. Left = Proof Obligation States (6). Right = Evidence / Component States (8). Each state as a color-coded pill + `use` description. Closing note forbidding reporting unevaluated proof obligations as PROVEN/DISPROVEN/safe.
  - Footer note: "Historical artifacts are not rewritten to match current identity..."
- Drafted `AcceptanceChecklistPanel.tsx`:
  - Hero banner with the dashboard-acceptance rule.
  - Pass-rate StatCard: "8 / 8 PASSED" proven-green with 100% progress bar.
  - Acceptance checklist: 2-col grid (1-col mobile) of 8 cards with requirement (bold), CheckCircle2 icon, evidence (mono, muted), PASS pill. Stagger animation.
  - Evidence deep-dive: 4 expanded cards for contract-load, no-hardcoded, no-raw-reads, no-cert-wording explaining HOW each is satisfied.
  - Anti-pattern watchlist: 5 red-X rows listing what the dashboard must NOT do (hardcoded values, direct raw reads, certification wording, screenshot-only evidence, filename/branch inference).
  - Footer note: "A screenshot alone does not prove the dashboard is artifact-driven..."
- Verified both files compile (`bun run lint`) — clean (only pre-existing errors in CommandPalette/PanelRouter, outside this task's scope).

## Stage Summary — files produced
- `/home/z/my-project/src/components/ive/panels/IdentityRegistryPanel.tsx` (named export `IdentityRegistryPanel`)
- `/home/z/my-project/src/components/ive/panels/AcceptanceChecklistPanel.tsx` (named export `AcceptanceChecklistPanel`)
- `/home/z/my-project/agent-ctx/10-b-release-surfaces-builder.md` (this record)

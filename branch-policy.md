# BRANCH PROTECTION POLICY

> Superseded placeholder. Populated 2026-07-02 from a direct audit of remote branches
> on `proofbridge-liner`. This replaces the prior "populate from existing VVU
> documentation" stub — no such documentation existed to populate from; this is the
> first ground-truth version.

## Finding: four non-converging "compliance-fabric" branches exist

A direct `git log` comparison found the following branches, each named as some variant
of "compliance fabric," with **no shared recent commit ancestry** between them:

| Branch | Latest commit | Character |
|---|---|---|
| `compliance-fabric` | `0f6ebab` "start cooking" | Most active; contains real `app/` tree, SafeKrypte + SafeLiner lite services, War Room CLI, Slack/MCP integration work. **Recommended canonical branch.** |
| `compliance-fabriC` (capital C) | `49f894d` | Small, isolated — HeartbeatManager + watchdog work only. Likely an accidental case-variant branch created on a case-insensitive filesystem. |
| `feat/compliance-fabric-v2` | `04a41f4` | Diverged early — ZK circuit / Noir audit chain work, duplicate `app/` + `src/app/` trees, dead `src/middleware.ts` (never loaded — see ARCHITECTURE.md Gate A notes). |
| `backup/local-compliance-fabric` | `090442a` | CircuitBreaker wiring, TEE attestation fixes — meaningfully different content from the other three, not a true "backup" of any of them despite the name. |

**Root cause (inferred, not directly observed)**: separate sessions — human or
AI-agent — each began work from an earlier shared point and never merged back before
the next session started fresh. Each session's context did not include the fact that
sibling work existed on a differently-progressed branch of the same name.

## Policy going forward

1. **`compliance-fabric` is canonical.** All new work branches from it; no new
   `compliance-fabric*`-named branch should be created without first diffing against
   this one.
2. **Before starting new work (human or agent session)**: run
   `git log origin/compliance-fabric -5 --oneline` and read `active/PLAN.md` +
   `FOUNDERS_VIEW.md` first. This is the minimum continuity check to avoid repeating
   the divergence above.
3. **Rename or archive, don't delete yet.** `compliance-fabriC`, `feat/compliance-fabric-v2`,
   and `backup/local-compliance-fabric` contain real, non-duplicated work (ZK circuits,
   CircuitBreaker fixes) that should be reviewed and cherry-picked into `compliance-fabric`
   before the branches are removed — not discarded wholesale.
4. **One `middleware.ts`.** Confirmed on `feat/compliance-fabric-v2`: a duplicate
   `app/` + `src/app/` tree caused a real auth-enforcement gap (root `middleware.ts` was
   a no-op; the working session check lived in `src/middleware.ts`, which Next.js never
   loaded). Before merging any branch into canonical, verify only one `app/` tree and
   one `middleware.ts` exist.

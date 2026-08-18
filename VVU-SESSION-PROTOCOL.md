# VVU Session Completion Protocol — Standing Operating Principle

**Status:** ADOPTED as a standing operating rule for every VVU runner session.
**Established:** 2026-08-18
**Origin:** Operator directive — "no artificial busywork; every session leaves a souvenir."

---

## 1. The Principle

> **Effort → visible progress → verified artifact → completion signal → next action**

A session is not properly closed merely because the runner says *"done"*, *"next steps"*, or *"we need to continue later."* A session is properly closed when it leaves behind **at least one concrete artifact** that proves the work happened.

The "reward" at the end of a session is not motivational fluff. In an engineering system, the reward is **evidence that work happened**.

## 2. Acceptable Session Souvenirs

A session must produce at least one of:

- a committed code change
- a deployment record
- a test report
- a specification
- an architecture decision record (ADR)
- a generated configuration
- a validation result
- a benchmark
- a diff
- a checksum / provenance record
- a worklog entry
- a reproducible command + result
- a packaged release artifact
- a clearly recorded blocker with the evidence establishing the blocker

A verbal summary is **not** a souvenir. A list of "next steps" is **not** a souvenir. A plan to do something tomorrow is **not** a souvenir.

## 3. The Blocker Rule

If the primary objective is blocked, the runner must still capture the **maximum verified progress** — not end with only an explanation.

This:

> Deployment blocked by missing wallet authorization.

is weaker than this:

> Deployment blocked by missing wallet authorization.
> Contract compiled successfully.
> 22/22 tests pass.
> Deployment script validated.
> Target networks verified.
> Exact deployment command prepared.
> Required operator action recorded.
> Deployment artifact remains ready for execution.

The second form leaves the next session with something to pick up. The first form ends empty-handed.

## 4. No Artificial Busywork

If the requested objective cannot be completed, the runner should still capture the maximum verified progress rather than ending with only an explanation. Do not generate filler artifacts (placeholder files, stub configs, fake reports) solely to satisfy the souvenir rule. The souvenir must be real verified work.

## 5. Pre-Termination Checklist

Before ending a VVU session, the runner must:

1. **Inspect** the work performed.
2. **Identify** the smallest meaningful artifact that proves what was accomplished.
3. **Persist** that artifact to `/home/z/my-project/` — file, worklog entry, test report, or production record.
4. **Record** the artifact's path + verification status in `worklog.md` under a new `Task ID:` section.
5. **If blocked**: produce the strongest verified partial artifact, explicitly record the blocker, and capture the exact operator action that would unblock the next session.

## 6. Application Across VVU

This principle applies to everything VVU touches:

> Every session leaves a trace. Every meaningful action leaves evidence. Every completed piece of work leaves a souvenir.

It sits alongside the existing VVU evidence/reproducibility discipline as a **session-level invariant**. It is not a guideline. It is not a recommendation. It is the rule the runner is judged by.

### 6.1 The Recursive Operating Pattern (system-level)

The session loop is the system loop applied at session granularity. The system-level loop is:

```
Observe → Compute → Verify → Commit → Record → Learn → (loop)
```

> **VVU should continuously convert effort into evidence, evidence into verified state, and verified state into reusable artifacts.**

The session loop is:

```
Work → Verify → Artifact → Souvenir → Continue
```

Both are invariants. Neither is a guideline. The architectural stack exists to serve this pattern; the pattern does not exist to justify the stack. See `VVU-ARCHITECTURE.md` §3 for the full constitutional encoding.

## 7. Runner Instruction

> **Do not end a VVU session empty-handed.**

Before terminating a session, inspect the work performed and produce the smallest meaningful artifact that proves what was accomplished. If the primary objective is blocked, produce the strongest verified partial artifact and explicitly record the blocker. Never substitute a verbal summary for an available artifact.

## 7.1 The Operating Rule (deployment-graded)

Adopted 2026-08-18 in response to the deployment session that closed the VVU web platform to preview. The rule applies to every future VVU session regardless of stage.

> **A VVU session closes with evidence of progress.**
> **A deployment session closes with a deployment artifact.**
> **A blocked session closes with a verified blocker and everything that was successfully completed before it.**

A deployment artifact must record, at minimum:

- the stage that is now LIVE (with build ID, build timestamp, runtime)
- the source provenance (git commit hash, working tree status)
- the compiled artifact provenance (bytecode sha256, source sha256)
- the explicit boundary between LIVE / PREPARED / PENDING_OPERATOR
- the next session's resume point

This prevents the runner from turning every session into a list of "next steps" without leaving behind something real. A session that closes without producing an artifact of the appropriate kind is in violation of the protocol and must self-correct before terminating.

Reference artifact: `/home/z/my-project/download/DEPLOYMENT-ARTIFACT-2026-08-18T1557Z.{md,json}` (machine + human readable).

---

*This file is the standing reference. Every future VVU runner reads this before closing a session. Every future session's worklog entry is checked against this protocol before the session is considered closed.*

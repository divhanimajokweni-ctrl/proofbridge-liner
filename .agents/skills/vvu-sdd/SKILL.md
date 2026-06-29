---
name: vvu-sdd
description: "VVU Specification-Driven Development workflow. Load for any Tier-2 or Tier-3 feature work, plan generation, or spec writing. Implements the SDD pattern that eliminates vibe-coding from VVU's core systems: plan before code, spec before plan, approve before build. Without this skill, agent-generated code arrives at review without compliance tracing, behavioral coverage, or architectural alignment — creating quality debt that compounds into shipping anxiety, brittle tests, and customer-found regressions. Load at the start of any non-trivial change. Generates INVESTIGATION.md, PLAN.md, and VALIDATION.md — the three files that make every change traceable from business intent to deployed code."
---

## VVU SDD WORKFLOW

### PHASE 1: INVESTIGATION — generate active/INVESTIGATION.md
Purpose : Facts only. No proposals. No code. Understand before planning.
Template:

# INVESTIGATION — [COMPONENT] — [ISO-DATE]
## Task: [what was requested in one sentence]
## Current State: [what actually exists in the codebase right now — read the files]
## Relevant Audit Findings: [from docs/audit/proofbridge-findings.md — list by ID]
## Hard Failures In Scope: [which of HF-1 through HF-5 does this touch]
## Current Branch: [git branch --show-current]
## Required Branch: [compliance-fabric for Tier-3 | feature/X for Tier-2]
## Downstream Dependencies: [what else will be affected by this change]
## Unknowns Before Planning: [what must be verified before a plan can be written]
## Stale Context Risk: [if session is long, what should be re-verified from disk]

### PHASE 2: PLAN — generate active/PLAN.md
Rule     : Do not start this phase without current INVESTIGATION.md
Rule     : Planner does not write implementation code. Planner writes plans.
Approval : Submit PLAN.md to Mino. Do not proceed until APPROVED stamp is present.
Immutable: Once approved, PLAN.md is locked. Scope creep = new plan file, not modification.

SDD Trace Chain (every link must exist — missing link = incomplete plan):
Business Intent → User Story → Acceptance Criteria → File Changes → Test Assertions → Compliance Gate

Template:

# PLAN — [COMPONENT] — [ISO-DATE]
## Business Intent: [one sentence: why this matters to VVU's mission or users]
## User Story: As a [role], I need [capability] so that [outcome]
## Acceptance Criteria:
  - [ ] [specific, behavioral, testable — "user can X and receives Y" not "it works"]
  - [ ] [...]
## Compliance Gate Status:
  Hard failures in scope : [HF-N list]
  This plan resolves     : [HF-N] — evidence: [specific change]
  This plan does not touch: [HF-N]
## Affected Files:
  - [path/to/file.ts] : [what changes and exactly why]
## Test Assertions:
  - [function/flow to call] → [expected return value or observable behavior]
## Branch: [compliance-fabric | feature/ticket-short-desc]
## Token Budget Estimate: [rough turn count — working set awareness]
## Handoff Plan: [what to write in HANDOFF.md when session ends]
## APPROVED BY: _______________ DATE: _______________

### PHASE 3: VALIDATION — generate active/VALIDATION.md
Rule: Load vvu-compliance-gate skill. Do not write VALIDATION.md without it.
Rule: VALIDATION.md must show PASS before any PR is opened.
On BLOCK: fix the named finding. Re-run validator from scratch. Do not open PR.

### AI IRON TRIANGLE — VVU TIER APPLICATION
Tier 1 (Vibe zone)    : Smart + Easy accepted. Higher token cost is the trade.
                         Accept /compact more freely. Don't write handoff for Tier-1.
Tier 2 (Core systems) : Smart + Cheap required. Write handoff. Manage working set.
                         Prune CLAUDE.md if it drifts above 2K tokens.
Tier 3 (Compliance)   : Smart quality is the fixed variable. Do not trade it for anything.
                         Cost and ease flex around the quality requirement.

### WORKING SET DISCIPLINE FOR SDD SESSIONS
Session start     : Read HANDOFF.md → INVESTIGATION.md → PLAN.md (in that order)
Mid-session       : Never edit CLAUDE.md (invalidates cache prefix for all subsequent turns)
/compact trigger  : Context > 60% | instruction: "preserve: PLAN.md content, HF-1-5, branch state"
Session end       : Write HANDOFF.md before closing (author-driven handoff = most deterministic)
Multi-session work: Rename the session before walking away (enables cheap resume later)

HANDOFF.md template:
# HANDOFF — [COMPONENT] — [ISO-DATE] [TIME]
## Where We Are: [one sentence — phase and exact state]
## Plan Status: active/PLAN.md [APPROVED | PENDING | AMENDING]
## Last File Changed: [path + what changed]
## Next Action: [exactly what the next session should do first]
## Active HFs: [which hard failures are being worked in this session]
## Cache State: [warm | cold — was there a long idle gap?]
## Do Not Lose: [specific fact or decision made this session not yet in files]

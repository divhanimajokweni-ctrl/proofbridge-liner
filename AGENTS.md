# AGENTS.md — VV LLC Agent Session Constitution
# Authority: Mino (Mihle Iviwe Majokweni), Director, Vaguely Vanity LLC
# Version: 1.0.0
# Branch: compliance-fabric (canonical production)

---

## WHAT THIS REPOSITORY IS

This is the VV LLC production codebase. The canonical production branch is
`compliance-fabric`. The `main` branch is a mirror of `compliance-fabric` only.

### Branch Authority Map

| Branch             | Authority         | Purpose                        |
|--------------------|-------------------|--------------------------------|
| compliance-fabric  | PRODUCTION        | All development happens here   |
| main               | MIRROR ONLY       | Never develop directly on main |
| feature/*          | STAGING           | Feature branches off compliance-fabric |

### What compliance-fabric contains (DO NOT DELETE OR MODIFY WITHOUT PRE-FLIGHT)

```
/
├── api/
│   ├── kernel.js              ← CRITICAL — pure functions layer
│   ├── mint.js                ← CRITICAL — minting endpoint
│   └── verify.js              ← CRITICAL — Gate-1 verification handler
├── vercel.json                ← outputDirectory: "." — DO NOT add builds array
├── package.json               ← typescript in devDeps, node: "22.x" — DO NOT gut
└── .github/
    └── workflows/
        └── attestation.yml    ← commit gate — DO NOT disable
```

### Deploy pipeline (compliance-fabric)

```
npm install
→ vercel build --prod
→ vercel deploy --prebuilt
```

---

## MANDATORY PRE-FLIGHT PROTOCOL

**Every agent session. No exceptions. No skipping. Zero tolerance.**

Before any file read, write, delete, or rename — execute this exact sequence
and output the declarations below. If any step cannot be completed, STOP and
report the blocker. Do not proceed.

### Step 1 — Identify current branch

```bash
git branch --show-current
```

**Required declaration:**
```
BRANCH: <output>
STATUS: [MATCHES SESSION_TARGET | MISMATCH — STOP]
```

If branch is `main` and SESSION_TARGET is `compliance-fabric`: STOP.
Do not proceed. Report: "On wrong branch. Switching required before any write."

### Step 2 — Read last 10 commits

```bash
git log --oneline -10
```

**Required declaration:**
```
LAST_COMMIT: <sha> <message>
COMMIT_HISTORY: [output]
```

### Step 3 — Confirm critical files exist

```bash
ls api/kernel.js api/mint.js api/verify.js vercel.json package.json 2>&1
```

**Required declaration:**
```
CRITICAL_FILES: [ALL PRESENT | MISSING: <list>]
```

If any critical file is missing: STOP. Do not proceed.
Report: "Critical file missing. Pre-flight failed."

### Step 4 — Diff against compliance-fabric

```bash
git diff compliance-fabric HEAD --stat
```

**Required declaration:**
```
DIVERGENCE_FROM_PRODUCTION: [NONE | <stat output>]
FILES_MODIFIED_THIS_SESSION: none
```

### Step 5 — Declare working context

Only after Steps 1–4 pass:

```
=== AGENT PRE-FLIGHT COMPLETE ===
BRANCH:                  <branch>
LAST_COMMIT:             <sha> <message>
CRITICAL_FILES:          ALL PRESENT
DIVERGENCE:              <none | description>
SESSION_TARGET_BRANCH:   compliance-fabric
FILES_MODIFIED:          none
READY_TO_WRITE:          YES
=================================
```

---

## COMMIT ATTESTATION PROTOCOL

Every commit message must include an attestation block. Commits without a
valid attestation block are rejected by the CI gate.

### Commit message format

```
<conventional commit message>

ATTESTATION:
  agent: <agent-id | "claude-session" | "mino-manual">
  branch_verified: <branch name from pre-flight Step 1>
  pre_flight: PASSED
  review_token: sha256:<first-8-chars-of-REVIEW_TOKEN-secret>
  session_owner: mino@vvllc
```

### Example valid commit

```
feat(api): add rate limiting to kernel.js

ATTESTATION:
  agent: claude-session
  branch_verified: compliance-fabric
  pre_flight: PASSED
  review_token: sha256:a3f8c921
  session_owner: mino@vvllc
```

### Computing your review_token value

```bash
# Run once to see your token prefix (requires REVIEW_TOKEN env var set)
echo -n "$REVIEW_TOKEN" | sha256sum | cut -c1-8
```

Embed that 8-character hex string as `sha256:<value>` in every commit.

---

## WHAT IS FORBIDDEN

| Action                                  | Reason                                      |
|-----------------------------------------|---------------------------------------------|
| Delete any file under api/              | Production endpoints — breaks live system   |
| Add `builds` array to vercel.json       | Triggers 12-function serverless limit       |
| Remove typescript from devDependencies  | Build chain dependency                      |
| Change engines.node away from "22.x"   | Runtime version lock                        |
| Push directly to main                   | main is a mirror — use PRs only             |
| Push directly to compliance-fabric      | Protected — use PRs from feature branches   |
| Skip pre-flight protocol                | Non-negotiable — no exceptions              |
| Commit without attestation block        | Rejected by CI gate                         |

---

## IF YOU ARE A NEW AGENT SESSION

You have no memory of previous sessions. This document is your full context.
Read it completely before touching any file.

Your first output in any session must be the Pre-Flight Declaration above.
Not a greeting. Not a question. The declaration.

If you cannot complete the declaration, you cannot write.

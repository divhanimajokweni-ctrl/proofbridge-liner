---
description: Run the full VVU SDD pipeline (Investigate → Plan → Implement → Validate) on a task. Use: /orchestrate <description of work>
agent: orchestrator
subtask: true
---
Run the full VVU SDD 4-role pipeline for: $ARGUMENTS

1. INVESTIGATE: Read relevant codebase files, gather facts, output to active/INVESTIGATION.md
2. PLAN: Load vvu-sdd skill, generate PLAN.md with full SDD trace chain, mark PENDING_APPROVAL
3. APPROVE: Self-approve the plan (headless mode — no external Mino required)
4. IMPLEMENT: Execute PLAN.md exactly, make all file changes
5. VALIDATE: Load vvu-compliance-gate, run behavioral coverage checks, output VALIDATION.md
6. REPORT: Output structured JSON status with file change summary and verification results

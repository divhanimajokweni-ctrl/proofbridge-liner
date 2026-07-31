# VVU · WORKING SET INDEX
# THIS IS AN INDEX. Not a knowledge base. Load on demand only.
# Pinned every turn. If a pointer hasn't been used in 5 sessions, remove it.

## ACTIVE SESSION STATE
Current plan    : active/PLAN.md
Investigation   : active/INVESTIGATION.md
Last validation : active/VALIDATION.md
Last handoff    : active/HANDOFF.md

## KNOWLEDGE POINTERS (load file, don't inline content)
Plain-English system guide (ELI5) : docs/HOW-IT-WORKS.md
Tenant isolation spec              : docs/tenant-isolation.md
Auth (Supabase) test report       : active/test-report-supabase-auth.md
Constitution                      : CONSTITUTION.md
Master Specification               : MASTER_SPEC.md
Verification Status               : VERIFICATION.md
ADRs (governance)                 : docs/governance/adrs/
ADRs (AIR)                        : air/adr/
Engineering Constitution          : docs/governance/ENGINEERING_CONSTITUTION.md
VVU Colony Constitution           : docs/governance/VVU_COLONY_CONSTITUTION.md

## WORKING SET HEALTH
Pinned context estimate: ~3,070 tokens total (CLAUDE.md + AGENTS.md + MEMORY.md + skill descs)
Session token floor: load this and start working
Prune trigger: any file in KNOWLEDGE POINTERS not accessed in last 5 sessions → remove pointer
Cache note: do not edit CLAUDE.md mid-session — invalidates prefix cache for all downstream turns

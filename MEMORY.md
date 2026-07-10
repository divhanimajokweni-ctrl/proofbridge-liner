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
Auth (Supabase) test report       : active/test-report-supabase-auth.md
ProofBridge audit (18 findings)  : docs/audit/proofbridge-findings.md
Hard failures detail (HF 1-5)    : docs/audit/hard-failures.md
Ubuntu Pools Stitch config        : docs/ubuntu-pools/stitch-config.md
SafeKrypte FROST-DAML spec        : docs/safekrypte/frost-daml-spec.md
Ubuntu Data Bus event schema (34) : docs/data-bus/event-schema.md
Branch protection policy          : docs/governance/branch-policy.md
Shareholders agreement            : docs/governance/shareholders.md
ADR registry                      : (in vvu-architecture skill body)

## WORKING SET HEALTH
Pinned context estimate: ~3,070 tokens total (CLAUDE.md + AGENTS.md + MEMORY.md + skill descs)
Session token floor: load this and start working
Prune trigger: any file in KNOWLEDGE POINTERS not accessed in last 5 sessions → remove pointer
Cache note: do not edit CLAUDE.md mid-session — invalidates prefix cache for all downstream turns

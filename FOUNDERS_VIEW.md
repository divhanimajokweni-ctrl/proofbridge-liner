# VVU · Founder's View

A 10-second dashboard for Mino. Everything you need to know, nothing you don't.

---

## Status

| Area | Status | What it means |
|------|--------|---------------|
| **Core Platform** | 🟢 On Track | App builds, routes work, WhatsApp bridge connected |
| **ProofBridge** | 🟡 Needs Attention | 5 hard failures blocking mainnet release (Jul 30 target) |
| **Ubuntu Pools** | 🟢 On Track | Stitch payments wired, ROSCA logic in progress |
| **SDD Workflow** | 🟢 Running | Lindiwe agent following plan→approve→build→validate |
| **Deployment** | 🟢 Stable | Vercel production live, rollback ready |

---

## This Week's Progress

**What got done:**
- WhatsApp bridge authenticated and serving QR on port 3456
- Next.js build fixed (force-dynamic + getSecret pattern)
- SDD bootstrap deployed — Lindiwe now requires plans before coding
- Kilo Code configured with same SDD rules
- Repository cleaned up (docs organized, dead code archived)

**In progress:**
- OpenClaw gateway running on port 18789
- Slack + Google Chat channels ready for auth (blocked by SSH/credentials)

**Blocked:**
- SSH tunnel — requires Replit paid tier or direct credential injection
- Slack bot token and GCP service account JSON needed for channel auth

---

## How This Repo Is Organized

```
📁 root
├── 📄 README.md             ← You are here → click FOUNDERS_VIEW.md
├── 📄 PROGRESS_LOG.md       ← Weekly updates
├── 📄 AGENTS.md             ← Agent instructions (loaded automatically)
├── 📄 CLAUDE.md             ← Lindiwe's rules
├── 📁 app/                  ← Website (what users see)
├── 📁 src/                  ← Core code
├── 📁 docs/                 ← Everything else: research, progress, social
│   ├── 📁 progress/         ← Past reports, chronicles, summaries
│   ├── 📁 research/         ← Whitepapers, PDFs, analysis
│   ├── 📁 social/           ← Outreach drafts, social strategy
│   ├── 📁 operations/       ← Deployment, security, runbooks
│   └── 📁 architecture/     ← System design, ADRs, decisions
├── 📁 infra/                ← Docker, deploy scripts, cloud config
├── 📁 scripts/              ← Build, test, utility scripts
├── 📁 whatsapp-bridge/      ← WhatsApp bot server
├── 📁 contracts/            ← Smart contracts (Solidity)
└── 📁 .kilo/ + .agents/     ← Agent configuration
```

---

## Key Numbers

| Metric | Value |
|--------|-------|
| ProofBridge release target | 2026-07-30 |
| Hard failures | 5 |
| Audit findings | 18 |
| OpenClaw gateway port | 18789 |
| WhatsApp bridge port | 3456 |
| Main branch | `compliance-fabric` |

---

## Key Documents

| Document | What it covers |
|----------|---------------|
| [`docs/governance/company-structure.md`](./docs/governance/company-structure.md) | Company setup, IP assignment, banking rules, Phase 1→2 transition |
| [`docs/governance/shareholders.md`](./docs/governance/shareholders.md) | Shareholder agreements |
| [`FOUNDERS_VIEW.md`](./FOUNDERS_VIEW.md) | This page — daily dashboard |

## Who To Ask

| What | Contact |
|------|---------|
| Strategy, product, everything | Mino (you) |
| Code, agents, SDD process | Lindiwe (AI agent — just ask) |
| OpenClaw, channels, auth | Need credentials from you |

---

## Quick Start

```
# See what's happening right now
cat PROGRESS_LOG.md

# Ask Lindiwe for a status
/classify <task>        # Determine tier (vibe/core/compliance)
/investigate <task>     # Research current state
/plan                   # Generate a plan
/validate               # Check compliance before launch
```

---

## Daily Founder Checklist

Each morning, run through this:

- [ ] Check `PROGRESS_LOG.md` — anything change overnight?
- [ ] Check blockers — any unblocked since yesterday?
- [ ] `/classify <today's task>` — let Lindiwe classify your next move
- [ ] Check email sending works: `curl https://venturevisionubuntu.co.za/api/send-email`
- [ ] Check WhatsApp bridge: `curl http://localhost:3456/health` (Replit internal)

---

## Daily Agent Checklist

Each session start, Lindiwe runs:

- [ ] Load `CLAUDE.md` — confirm tier classification rules
- [ ] Check `MEMORY.md` — confirm working set is current
- [ ] Run `working-set-audit.ts` — verify token budget
- [ ] Check `AGENTS.md` — confirm deployment branch and pre-flight files exist
- [ ] If implementing: load PLAN.md, follow exactly, no scope creep
- [ ] If validating: run compliance gate, produce VALIDATION.md

---

*Last updated: 2026-06-29*

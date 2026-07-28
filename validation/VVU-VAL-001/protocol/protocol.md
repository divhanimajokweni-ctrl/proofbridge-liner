# VVU-VAL-001 — 72-Hour Continuous Validation Protocol

**Version:** 1.1 (Reviewer-Revised)
**Status:** Pre-Registration — Published Before T=0
**Commit hash (frozen):** To be published prior to production release (set by `rehearsal/freeze-build.sh`)

> **This is a pre-registration.** The test plan, success criteria, failure schedule, and Validation Index formula below are frozen and published before T=0. The public validation event is executed against one frozen build. Any subsequent execution constitutes a separately versioned validation event (VVU-VAL-002, VVU-VAL-003, etc.).

This Markdown source is the canonical protocol text. The PDF (`VVU-VAL-001_Pre_Registration_Protocol.pdf`) is generated from this source for distribution.

## Table of Contents

1. [Primary Objective](#1-primary-objective)
2. [Frozen Artefacts](#2-frozen-artefacts)
3. [Success Criteria](#3-success-criteria)
4. [Failure-Injection Schedule](#4-failure-injection-schedule-gate-mapped)
5. [Infrastructure](#5-infrastructure)
6. [Evidence Bundles and Archival](#6-evidence-bundles-and-archival)
7. [Validation Index](#7-validation-index-published-formula)
8. [Threat Model](#8-threat-model)
9. [Public Mission Control Scoreboard](#9-public-mission-control-scoreboard)
10. [Independent Observers](#10-independent-observers)
11. [Dress Rehearsal](#11-dress-rehearsal-required)
12. [Independent Reproduction](#12-independent-reproduction)
13. [Two-Layer Architecture](#13-two-layer-architecture)
14. [Staged Release](#14-staged-release)
15. [Operator Responsibilities](#15-operator-responsibilities)
16. [What We Will Not Do](#16-what-we-will-not-do)
17. [Limitations](#17-limitations)
18. [Publication Checklist](#18-publication-checklist-before-t0)

---

The full text of each section is in the [PDF](VVU-VAL-001_Pre_Registration_Protocol.pdf).
This Markdown file is the source-of-truth; the PDF is the distributable artefact.

## Quick Reference

- **6 phases:** P1 Nominal → P2 Flood → P3 Network Chaos → P4 Storage Pressure → P5 Node Failure → P6 Security → P7 Partition+Recovery
- **Validation Index:** 6 dimensions, weights sum to 1.0, PASS ≥ 90.0
- **Severity levels:** Critical (run terminates, FAIL) / Major (-10 points, continue) / Minor (warning only)
- **Dress rehearsal:** mandatory before public run
- **Independent observers:** Academic / Industry / Community — attest artifact integrity, not system quality
- **Independent reproduction:** 8-step procedure (§12) — clone, checkout, download, verify, replay, compare
- **Staged release:** evidence → personalized → social (mass-blast structurally impossible)
- **Operator constraints:** no code changes, no config edits, hardware replacement only, all interventions logged + signed

## File Inventory

```
VVU-VAL-001/
├── protocol/
│   ├── VVU-VAL-001_Pre_Registration_Protocol.pdf   ← the frozen, published protocol
│   └── protocol.md                                  ← this file (Markdown source)
├── chaos/         ← 6-phase gate-mapped schedule + 4 injection scripts
├── rehearsal/     ← dress rehearsal + verify + freeze-build
├── kubernetes/    ← 6 provider-agnostic k3s manifests
├── evidence/      ← bundle + validation-index + archive + replay
├── scoreboard/    ← dashboard.json + metrics-schema.json + overlay-config.json
├── outreach/      ← milestones + recipients + stages + scaffold templates
├── github/        ← 3 GitHub Actions workflows
└── docs/          ← observer-guide + operator-runbook + threat-model + publication-checklist
```

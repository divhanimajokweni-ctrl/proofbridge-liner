# Changelog

All notable changes to the VVU Integrated Verification Environment (IVE) are documented in this file.

## [Unreleased] — RC1

### Added — Release Artifacts (Task 20)
- **`scripts/ive_result_adapter.py`** — adapter that normalizes raw tool artifacts into the frozen contract with full source attribution tracking and fallback safeguards.
- **`scripts/verify_release.py`** — release-gate script validating results.json schema, checksum index, and license status (explicitly allows "MISSING - REQUIRES DECISION" as a structural pass).
- **`ive-output/results.json`** — frozen contract snapshot written to disk (schema_version, timestamp, evaluation, source_attribution, metrics, license_status).
- **`ive-output/manifest.json`** — packaging manifest with authoritative artifacts list and verification commands.
- **`ive-output/execution.log`** — execution trace documenting the adapter + gate run.
- **`README-LICENSE-NOTICE.md`** — owner action item for license resolution.
- **`docs/RELEASE_CHECKSUM.md`** — checksum generation and verification commands.
- **`CHANGELOG.md`** — this file.
- **`RELEASE_NOTES.md`** — release notes for RC1.
- **`SHA256SUMS`** — top-level checksum index for release-critical root artifacts.

### Added — Workspace Features (Tasks 1–19)
- 22-panel cinematic engineering workspace (Overview, Trust Sphere, Proof Graph, Evidence Runtime, Plugin Registry, AMD Runtime, Zoo Runtime, HBK Workspace, CAD Viewer, Artifacts, Explorer, Telemetry, Terminal, Watchdog, Lindiwe, Release Report, Adapter Attribution, Integrity Closure, Identity Registry, Acceptance Checklist, Settings, Help & FAQ).
- Cinematic 9-stage boot sequence (VVU logo → rings → Fibonacci sphere → evidence nodes → runtime → zoo engine → proof runtime → trust runtime → workspace) with particle field, sound-wave visualization, and stage-counter ring.
- Recovered Fibonacci Trust Sphere (380-node canvas, dual-axis tumble, verification state machine).
- Zustand canonical store (single source of truth) with live event wiring (proof/evidence/plugin actions push notifications).
- Notification/Activity Center (F8 toggle, bell badge, deep-link navigation, mark-all-read, clear).
- Guided Tour (8-stop auto-advancing walkthrough with narration, `T` shortcut).
- MiniMap (visual grid of all 22 panels with live state indicators).
- Mission Control (floating summary card, `M` shortcut).
- Stats HUD (live telemetry overlay, `H` shortcut).
- Command Palette with content search + recent-commands history (⌘K).
- Settings panel with localStorage persistence (autoSkipBoot, animationIntensity, accentOverride, defaultOpen widgets, showBootSoundWave) — all wired to take runtime effect.
- First-run WelcomeHint.
- Header ContextGlance indicator (always-visible NO-GO pill).
- Release Report export (markdown download, clipboard copy, print-to-PDF).
- ChunkLoadErrorBoundary (auto-recovery from Turbopack dev-cache failures).
- Keyboard shortcuts ([, ], g+letter, T, M, H, F8, ⌘K, ?).

### Release Engineering
- Frozen identity: IVE is the platform; HBK MK-II is the demonstration application.
- Zero-fabrication rule: every missing value is explicit (UNDEFINED, MISSING, NOT_EVALUATED, OUT_OF_SCOPE, REQUIRES VALIDATION, PENDING).
- Status vocabulary: proof states (PROVEN/DISPROVEN/BLOCKED_MISSING_INPUT/etc.) separate from evidence states (VERIFIED/NOT_DEMONSTRATED/REQUIRES VALIDATION/etc.).
- Adapter source-attribution map for every normalized contract field.
- Integrity closure: checksum index excludes itself, deterministic ordering, no post-checksum modification.
- Ledger root described as "internally consistent, not externally signed".

### Disposition
- **NO-GO** — the three structural blockers (adapter, verify script, results.json) are resolved. The sole remaining blocker is the LICENSE (requires owner decision, not fabricated).
- `verify_release.py` treats "MISSING - REQUIRES DECISION" as a structural pass with a warning. The final disposition moves to GO once the owner applies a license and flips the status to VALIDATED.

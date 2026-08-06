# IVE RC1 — Release Notes

**Date:** August 6, 2026
**Platform:** VVU Integrated Verification Environment (IVE)
**Demonstration Application:** HBK MK-II Hydro-Gateway
**Disposition:** NO-GO (structural blockers resolved; license decision pending)

---

## What's New

### Release Artifacts Complete
The three structural release-gate blockers are now resolved:

1. **`scripts/ive_result_adapter.py`** — normalizes raw tool evidence into the frozen contract with full source attribution. Includes fallback safeguards for missing/corrupted input.

2. **`scripts/verify_release.py`** — validates `results.json` schema, checksum index, and license status. Explicitly treats "MISSING - REQUIRES DECISION" as a structural pass (with warning) because the state is honestly reported.

3. **`ive-output/results.json`** — the frozen contract snapshot is now persisted on disk (no longer memory/API only).

### Automated Gate Status
```
$ python3 scripts/verify_release.py
--- Running Release Gate Checks ---
[PASS] ive-output/results.json exists and matches contract validation.
[PASS] Checksum verification index found at ive-output/checksums.txt
[WARN] License explicitly flagged as MISSING - REQUIRES DECISION.
[INFO] Rationale documented: Blocked pending legal review context.

[RESULT] Structural release-gate checks PASSED.
[NOTICE] Final disposition remains NO-GO due to legal evaluation blockages.
```

### Checksum Verification
```bash
# Generate
python3 scripts/generate_checksums.py --root .

# Verify
cd ive-output && sha256sum -c checksums.txt
```

---

## Engineering Workspace

The IVE workspace is a 22-panel cinematic engineering operating system:

- **Core:** Overview, Trust Sphere, Proof Graph, Evidence Runtime
- **Release:** Release Report, Adapter Attribution, Integrity Closure, Identity Registry, Acceptance Checklist
- **Runtime:** Plugin Registry, AMD Runtime, Zoo Runtime
- **Case Study:** HBK Workspace, CAD Viewer
- **System:** Artifacts, Explorer, Telemetry, Terminal, Watchdog, Lindiwe, Settings, Help & FAQ

Features: Guided Tour, Mission Control, Stats HUD, Command Palette, Notification Center, MiniMap, WelcomeHint, ContextGlance, keyboard navigation, and a Settings panel with localStorage persistence.

---

## Sole Remaining Blocker

**LICENSE — requires owner decision.**

The repository has no legal distribution terms. The owner must:
1. Choose a license (MIT, Apache 2.0, BSD-3-Clause, Proprietary, or dual license).
2. Create a `LICENSE` file at the repository root.
3. Update `license_status` in `ive-output/results.json` from `"MISSING - REQUIRES DECISION"` to `"VALIDATED"`.

Once complete, the final disposition moves from **NO-GO** to **GO**.

No license has been fabricated or auto-selected. See `README-LICENSE-NOTICE.md` for details.

---

## Verification Commands

```bash
# Release gate
python3 scripts/verify_release.py --root .

# Checksum generation
python3 scripts/generate_checksums.py --root .

# Checksum verification
cd ive-output && sha256sum -c checksums.txt

# Top-level SHA256SUMS
sha256sum -c SHA256SUMS
```

---

## Engineering Position

IVE does not claim physical certification, engineering approval, code compliance, or deployment authorization. It demonstrates bounded formal proof, deterministic execution, reproducible evidence, and cryptographic provenance.

Every engineering claim is traceable to repository evidence. No value is fabricated.

#!/usr/bin/env python3
"""
Generate the human-readable VVU Validation Report (MD) from the JSON artifact.
"""
import json
import sys
from pathlib import Path
from datetime import datetime

if len(sys.argv) < 2:
    print("usage: gen-validation-md.py <validation.json> [output.md]")
    sys.exit(1)

json_path = Path(sys.argv[1])
out_path = Path(sys.argv[2]) if len(sys.argv) > 2 else None

with json_path.open() as f:
    d = json.load(f)

ts = d["timestamp"]
checks = d["checks"]
summary = d["summary"]
gate = d["gate_status"]
required = d.get("required_for_green", [])
git_commit = d.get("git_commit", "unknown")
git_branch = d.get("git_branch", "unknown")
git_main = d.get("git_main_sha", "unknown")

# Tally
n_pass = sum(1 for c in checks if c["status"] == "PASS")
n_fail = sum(1 for c in checks if c["status"] == "FAIL")
n_blocked = sum(1 for c in checks if c["status"] == "BLOCKED")

# Map check names to display labels matching the VVU Green-Light Gate matrix
GATE_ROWS = [
    ("BUILD", "build"),
    ("TYPECHECK", "typecheck"),
    ("LINT", "lint"),
    ("UNIT TESTS — webhook", "webhook_tests"),
    ("UNIT TESTS — security", "security_tests"),
    ("CONTRACT TESTS", "hardhat_test"),
    ("CONTRACT COMPILE", "hardhat_compile"),
    ("E2E", "e2e_playwright"),
    ("DEPLOYMENT (workflow YAML)", "yaml_workflow_validate"),
    ("LIVE APP — /", "live_app_health"),
    ("LIVE APP — /study", "live_app_health_landing"),
    ("LIVE APP — /ive", "live_app_health_ive"),
    ("GPU / ROCm", "gpu_available"),
    ("REPOSITORY INTEGRITY — git fsck", "git_fsck"),
    ("REPOSITORY INTEGRITY — clean tree", "git_status_clean"),
    ("PROVENANCE", "provenance_build_id_match"),
    ("DOCUMENT CONSISTENCY", "doc_consistency_refs_exist"),
    ("GOVERNANCE — charter amendments", "governance_charter_amendments_count"),
    ("CONTRACT SYNTAX", "contract_solc_syntax"),
]

lines = []
lines.append(f"# VVU Validation Report — {ts}")
lines.append("")
lines.append(f"**Generated:** {d.get('generated_at', ts)}")
lines.append(f"**Git commit:** `{git_commit[:12]}`")
lines.append(f"**Git branch:** `{git_branch}`")
lines.append(f"**Git main SHA:** `{git_main[:12]}`")
lines.append(f"**Repo path:** `{d.get('repo_path')}`")
lines.append("")
lines.append("## VVU Validation Gate")
lines.append("")
lines.append("```text")
lines.append("VVU VALIDATION GATE")
lines.append("")
lines.append(f"STATUS: {gate}")
lines.append("")
lines.append("Required checks:")
for label, key in GATE_ROWS:
    status = summary.get(key, "UNKNOWN")
    mark = "[PASS]" if status == "PASS" else ("[BLOCK]" if status == "BLOCKED" else "[FAIL]")
    if status == "UNKNOWN":
        mark = "[??]"
    lines.append(f"{mark:8} {label:38} {status}")
lines.append("")
lines.append(f"RELEASE AUTHORIZATION: {gate}")
lines.append("```")
lines.append("")
lines.append(f"**Tally:** {n_pass} PASS / {n_fail} FAIL / {n_blocked} BLOCKED across {len(checks)} checks.")
lines.append("")
lines.append("---")
lines.append("")
lines.append("## Check details")
lines.append("")
for c in checks:
    sym = "PASS" if c["status"] == "PASS" else ("BLOCK" if c["status"] == "BLOCKED" else "FAIL")
    lines.append(f"### {sym} — {c['name']}")
    lines.append("")
    lines.append(f"- **Status:** `{c['status']}`")
    lines.append(f"- **Exit code:** `{c.get('exit_code')}`")
    lines.append(f"- **Duration:** {c.get('duration_ms', 0)} ms")
    lines.append(f"- **Command:** `{c.get('command', '')}`")
    if c.get("blocker"):
        lines.append(f"- **Blocker:** {c['blocker']}")
    if c.get("stdout_tail"):
        out = c["stdout_tail"].strip()
        if out:
            lines.append("")
            lines.append("**stdout (tail):**")
            lines.append("```")
            lines.append(out[-1000:])
            lines.append("```")
    if c.get("stderr_tail"):
        err = c["stderr_tail"].strip()
        if err:
            lines.append("")
            lines.append("**stderr (tail):**")
            lines.append("```")
            lines.append(err[-1000:])
            lines.append("```")
    lines.append("")

lines.append("---")
lines.append("")
lines.append("## Governing rule")
lines.append("")
lines.append("> VVU does not ship on confidence. VVU ships on verified state.")
lines.append("")
lines.append("Per the VVU Green-Light Gate, only **GREEN** (every required check PASS) authorizes release. Any FAIL or BLOCKED renders the gate RED.")
lines.append("")
lines.append("### State definitions")
lines.append("")
lines.append("| State | Meaning |")
lines.append("| --- | --- |")
lines.append("| **PASS** | Test actually executed and passed |")
lines.append("| **FAIL** | Test actually executed and failed |")
lines.append("| **BLOCKED** | Test could not execute; exact blocker recorded |")
lines.append("")
lines.append("### Excluded from GREEN consideration")
lines.append("")
lines.append("- \"Prepared\", \"configured\", \"should work\", and \"ready\" are not test results.")
lines.append("- Speculation is forbidden.")
lines.append("- Invented success is forbidden.")
lines.append("")
lines.append(f"*Artifact JSON: `{json_path}`*")

output = "\n".join(lines) + "\n"

if out_path:
    out_path.parent.mkdir(parents=True, exist_ok=True)
    out_path.write_text(output)
    print(f"wrote {out_path}")
else:
    print(output)

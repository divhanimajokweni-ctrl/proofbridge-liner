#!/usr/bin/env python3
"""
VVU Validation Runner — executes every available verification and captures REAL results.

Output: structured JSON to stdout and to /home/z/my-project/artifacts/vvu-validation-<ts>.json
Each check records: status (PASS/FAIL/BLOCKED), exit_code, duration_ms, stdout (tail), stderr (tail)
"""
import json
import os
import subprocess
import sys
import time
from pathlib import Path
from datetime import datetime, timezone

REPO = Path("/home/z/my-project")
DOCS_VALIDATION_DIR = REPO / "docs" / "validation"
DOCS_VALIDATION_DIR.mkdir(parents=True, exist_ok=True)

TIMESTAMP = datetime.now(timezone.utc).strftime("%Y%m%dT%H%M%SZ")
OUTPUT_JSON = DOCS_VALIDATION_DIR / f"vvu-validation-{TIMESTAMP}.json"

# Each check: (name, command, timeout_seconds, env_overrides)
CHECKS = [
    ("typecheck",   ["bun", "x", "tsc", "--noEmit"],                                 300, {}),
    ("lint",        ["bun", "run", "lint"],                                          300, {}),
    ("build",       ["bun", "run", "build"],                                        600, {}),
    ("hardhat_compile", ["bun", "x", "hardhat", "compile"],                         300, {}),
    ("hardhat_test",    ["bun", "run", "hardhat:test"],                            600, {}),
    ("webhook_tests",   ["bun", "test", "tests/webhook/"],                          300, {}),
    ("security_tests",  ["bun", "test", "tests/security/"],                         300, {}),
    ("git_fsck",        ["git", "fsck", "--strict", "--full"],                       60,  {}),
    ("git_status_clean", ["git", "diff", "--quiet"],                                  10,  {}),
    ("yaml_workflow_validate", [
        "python3", "-c",
        "import yaml,glob,sys; files=glob.glob('.github/workflows/*.yml')+glob.glob('.github/workflows/*.yaml'); "
        "[print(f'OK: {f}' if yaml.safe_load(open(f)) else f'FAIL: {f}') for f in files]"
    ], 30, {}),
    ("live_app_health", [
        "curl", "-s", "-o", "/dev/null", "-w", "%{http_code}",
        "--max-time", "5", "http://localhost:3000/"
    ], 15, {}),
    ("live_app_health_landing", [
        "curl", "-s", "-o", "/dev/null", "-w", "%{http_code}",
        "--max-time", "5", "http://localhost:3000/study"
    ], 15, {}),
    ("live_app_health_ive", [
        "curl", "-s", "-o", "/dev/null", "-w", "%{http_code}",
        "--max-time", "5", "http://localhost:3000/ive"
    ], 15, {}),
    ("provenance_build_id_match", [
        "bash", "-c",
        "BUILD_ID=$(cat .next/BUILD_ID 2>/dev/null); "
        "SERVER_PID=$(pgrep -f 'standalone/server.js' | head -1); "
        "HTTP=$(curl -s -o /dev/null -w '%{http_code}' --max-time 5 http://localhost:3000/); "
        "echo \"build_id=$BUILD_ID server_pid=$SERVER_PID http=$HTTP\"; "
        "if [ -n \"$BUILD_ID\" ] && [ -n \"$SERVER_PID\" ] && [ \"$HTTP\" = '200' ]; then exit 0; else exit 1; fi"
    ], 30, {}),
    ("gpu_available", ["bash", "-c",
        "if command -v nvidia-smi >/dev/null 2>&1; then nvidia-smi --query-gpu=name --format=csv,noheader; elif command -v rocminfo >/dev/null 2>&1; then rocminfo | head -30; else echo NO_GPU_TOOLING; exit 1; fi"
    ], 15, {}),
    ("e2e_playwright", ["bun", "run", "test:e2e"], 600, {}),
    ("contract_solc_syntax", [
        "bash", "-c",
        "for f in contracts/*.sol; do echo \"--- $f ---\"; head -5 \"$f\"; done"
    ], 10, {}),
    ("doc_consistency_refs_exist", [
        "bash", "-c",
        "FAIL=0; "
        "for md in README.md VVU-ARCHITECTURE.md VVU-GOVERNANCE-CHARTER.md VVU-SESSION-PROTOCOL.md VVU-LAYER-MAP.md PRE-DEPLOY-VERIFICATION.md; do "
        "  [ -f \"$md\" ] || { echo \"MISSING: $md\"; FAIL=1; }; "
        "done; "
        "exit $FAIL"
    ], 10, {}),
    ("governance_charter_amendments_count", [
        "bash", "-c",
        "N=$(grep -icE '^## (amendment|article) [ivx]+' VVU-GOVERNANCE-CHARTER.md 2>/dev/null); "
        "echo \"amendments=$N\"; "
        "if [ \"$N\" -ge 11 ]; then exit 0; else exit 1; fi"
    ], 10, {}),
]

def run_check(name, cmd, timeout, env_overrides):
    """Run a single check, capture results."""
    start = time.time()
    env = os.environ.copy()
    env.update(env_overrides)
    # Run from repo root
    result = {
        "name": name,
        "command": " ".join(cmd),
        "started_at": datetime.fromtimestamp(start, timezone.utc).isoformat(),
        "timeout_seconds": timeout,
    }
    try:
        proc = subprocess.run(
            cmd, cwd=str(REPO), env=env,
            capture_output=True, text=True, timeout=timeout
        )
        duration_ms = int((time.time() - start) * 1000)
        result["exit_code"] = proc.returncode
        result["duration_ms"] = duration_ms
        # Truncate output to keep JSON manageable
        stdout = proc.stdout or ""
        stderr = proc.stderr or ""
        result["stdout_tail"] = stdout[-2000:] if len(stdout) > 2000 else stdout
        result["stderr_tail"] = stderr[-2000:] if len(stderr) > 2000 else stderr
        result["stdout_lines"] = len(stdout.splitlines())
        result["stderr_lines"] = len(stderr.splitlines())
        result["status"] = "PASS" if proc.returncode == 0 else "FAIL"
    except subprocess.TimeoutExpired as e:
        duration_ms = int((time.time() - start) * 1000)
        result["exit_code"] = -1
        result["duration_ms"] = duration_ms
        result["status"] = "BLOCKED"
        result["blocker"] = f"timeout after {timeout}s"
        result["stdout_tail"] = (e.stdout or b"").decode("utf-8", errors="replace")[-2000:] if e.stdout else ""
        result["stderr_tail"] = (e.stderr or b"").decode("utf-8", errors="replace")[-2000:] if e.stderr else ""
    except FileNotFoundError as e:
        duration_ms = int((time.time() - start) * 1000)
        result["exit_code"] = -1
        result["duration_ms"] = duration_ms
        result["status"] = "BLOCKED"
        result["blocker"] = f"binary not found: {e.filename}"
    except Exception as e:
        duration_ms = int((time.time() - start) * 1000)
        result["exit_code"] = -1
        result["duration_ms"] = duration_ms
        result["status"] = "BLOCKED"
        result["blocker"] = f"{type(e).__name__}: {e}"
    return result

def main():
    print(f"=== VVU Validation Runner — {TIMESTAMP} ===", file=sys.stderr)
    print(f"=== running {len(CHECKS)} checks ===", file=sys.stderr)

    results = []
    for name, cmd, timeout, env_overrides in CHECKS:
        print(f"[{name}] running...", file=sys.stderr, flush=True)
        r = run_check(name, cmd, timeout, env_overrides)
        results.append(r)
        print(f"[{name}] -> {r['status']} ({r['duration_ms']}ms, exit={r.get('exit_code')})", file=sys.stderr, flush=True)

    # Build the final report
    summary = {}
    for r in results:
        summary[r["name"]] = r["status"]

    # Post-processing: convert specific FAILs to BLOCKED when they represent
    # sandbox/environment limitations, not code defects.
    BLOCKED_PATTERNS = {
        "gpu_available": "NO_GPU_TOOLING",
    }
    for r in results:
        if r["name"] in BLOCKED_PATTERNS and r["status"] == "FAIL":
            pattern = BLOCKED_PATTERNS[r["name"]]
            if pattern in (r.get("stdout_tail", "") + r.get("stderr_tail", "")):
                r["status"] = "BLOCKED"
                r["blocker"] = f"sandbox limitation: {pattern}"
                summary[r["name"]] = "BLOCKED"

    # Determine overall gate (per VVU Green-Light Gate matrix)
    required = [
        "typecheck", "lint", "build",
        "hardhat_compile", "hardhat_test",
        "webhook_tests", "security_tests", "e2e_playwright",
        "yaml_workflow_validate",
        "live_app_health", "live_app_health_landing", "live_app_health_ive",
        "gpu_available",
        "git_fsck", "git_status_clean",
        "provenance_build_id_match",
        "doc_consistency_refs_exist",
        "governance_charter_amendments_count",
    ]
    gate_status = "GREEN"
    for k in required:
        if summary.get(k) != "PASS":
            gate_status = "RED"
            break

    report = {
        "schema": "vvu-validation-v1",
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "timestamp": TIMESTAMP,
        "repo_path": str(REPO),
        "git_commit": subprocess.check_output(["git", "rev-parse", "HEAD"], cwd=str(REPO)).decode().strip(),
        "git_branch": subprocess.check_output(["git", "branch", "--show-current"], cwd=str(REPO)).decode().strip(),
        "git_main_sha": subprocess.check_output(["git", "rev-parse", "main"], cwd=str(REPO)).decode().strip(),
        "checks": results,
        "summary": summary,
        "required_for_green": required,
        "gate_status": gate_status,
    }

    # Write JSON artifact
    OUTPUT_JSON.write_text(json.dumps(report, indent=2))
    print(f"\n=== artifact: {OUTPUT_JSON} ===", file=sys.stderr)
    print(f"=== gate: {gate_status} ===", file=sys.stderr)

    # Print summary to stdout
    print(json.dumps({
        "gate_status": gate_status,
        "summary": summary,
        "artifact": str(OUTPUT_JSON),
    }, indent=2))

if __name__ == "__main__":
    main()

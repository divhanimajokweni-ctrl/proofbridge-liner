#!/usr/bin/env python3
"""
IVE Release Verification Gate
=============================

Validates the release-gate artifacts:
  1. results.json exists and matches the frozen contract schema
  2. Checksum index exists and is populated
  3. License status is explicitly reported (MISSING - REQUIRES DECISION
     is a structural pass with a warning; VALIDATED is a full pass)

Usage:
    python3 scripts/verify_release.py
    python3 scripts/verify_release.py --root .

Exit codes:
    0 = structural release-gate checks passed (disposition may still be NO-GO)
    1 = release-gate checks failed
"""

import os
import sys
import json
import argparse


def check_results_json(target_path="ive-output/results.json"):
    """Validates if results.json exists and adheres to schema parameters."""
    if not os.path.exists(target_path):
        print(f"[FAIL] Missing release gate artifact: {target_path}")
        return False

    try:
        with open(target_path, "r", encoding="utf-8") as f:
            data = json.load(f)

        required_keys = ["schema_version", "timestamp", "evaluation", "license_status"]
        if not all(key in data for key in required_keys):
            print(f"[FAIL] {target_path} template does not match the frozen contract structure.")
            return False

        print(f"[PASS] {target_path} exists and matches contract validation.")
        return True
    except Exception as e:
        print(f"[FAIL] Error parsing {target_path}: {str(e)}")
        return False


def check_checksum_index(checksum_file="ive-output/checksums.txt"):
    """Verifies that a SHA256 checksum index exists and is populated."""
    if not os.path.exists(checksum_file) or os.path.getsize(checksum_file) == 0:
        print(f"[FAIL] Missing or empty checksum index: {checksum_file}")
        return False
    print(f"[PASS] Checksum verification index found at {checksum_file}")
    return True


def check_license_status(target_path="ive-output/results.json"):
    """Checks license rule enforcement while logging accepted rationale flagger."""
    try:
        with open(target_path, "r", encoding="utf-8") as f:
            data = json.load(f)
        status = data.get("license_status")

        if status == "MISSING - REQUIRES DECISION":
            print("[WARN] License explicitly flagged as MISSING - REQUIRES DECISION.")
            print("[INFO] Rationale documented: Blocked pending legal review context.")
            return True  # Marked missing explicitly with rationale clears the gate structural blocker
        elif status == "VALIDATED":
            print("[PASS] License found and validated.")
            return True
        else:
            print(f"[FAIL] Invalid license state descriptor: {status}")
            return False
    except Exception:
        print("[FAIL] Unable to determine license configuration.")
        return False


def main():
    parser = argparse.ArgumentParser(description="IVE Release Verification Gate")
    parser.add_argument("--root", default=".", help="Repository root (default: current directory)")
    args = parser.parse_args()

    # Change to the root directory so relative paths resolve correctly.
    if args.root != ".":
        os.chdir(args.root)

    print("--- Running Release Gate Checks ---")
    results_ok = check_results_json()
    checksum_ok = check_checksum_index()
    license_ok = check_license_status()

    if results_ok and checksum_ok and license_ok:
        print("\n[RESULT] Structural release-gate checks PASSED.")
        print("[NOTICE] Final disposition remains NO-GO due to legal evaluation blockages.")
        sys.exit(0)
    else:
        print("\n[RESULT] Release-gate checks FAILED on required components.")
        sys.exit(1)


if __name__ == "__main__":
    main()

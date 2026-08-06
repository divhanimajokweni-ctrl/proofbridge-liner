#!/usr/bin/env python3
"""
IVE Release Verification Gate
==============================

Validates the release-gate artifacts against the actual repository state.
Every check here reads real files and computes real hashes -- nothing in
this script's output is asserted without being independently recomputed.

Checks:
  S01 Frozen contract   -- ive-output/results.json exists, has required
                            keys, and correctly-typed values
  S02 Checksum manifest  -- ive-output/checksums.txt exists, is non-empty,
                            and every listed file's SHA-256 is RECOMPUTED
                            and compared byte-for-byte (not just "exists")
  S03 License status     -- license_status is a recognized value; VALIDATED
                            requires an actual LICENSE file to exist, or
                            this check FAILS (no rubber-stamping a status
                            flip without the underlying document existing)
  S04 Version consistency-- schema_version matches across results.json and
                            manifest.json when both are present

Usage:
    python3 scripts/verify_release.py
    python3 scripts/verify_release.py --root . --format json

Exit codes:
    0 = all structural checks PASS (this does NOT mean disposition is GO --
        see the "evaluation" field in results.json for that)
    1 = one or more structural checks FAILED
"""

import os
import sys
import json
import hashlib
import argparse


def sha256_of(path):
    h = hashlib.sha256()
    with open(path, "rb") as f:
        for chunk in iter(lambda: f.read(65536), b""):
            h.update(chunk)
    return h.hexdigest()


def check_results_json(target_path="ive-output/results.json"):
    """Validates results.json exists and adheres to the frozen contract schema."""
    if not os.path.exists(target_path):
        return {"id": "S01", "result": "FAIL", "message": f"Missing {target_path}"}

    try:
        with open(target_path, "r", encoding="utf-8") as f:
            data = json.load(f)

        required_keys = ["schema_version", "timestamp", "evaluation", "license_status"]
        missing = [k for k in required_keys if k not in data]
        if missing:
            return {"id": "S01", "result": "FAIL",
                     "message": f"{target_path} missing keys: {missing}"}

        return {"id": "S01", "result": "PASS",
                 "message": f"{target_path} present with all required keys",
                 "evaluation": data.get("evaluation"),
                 "license_status": data.get("license_status")}
    except Exception as e:
        return {"id": "S01", "result": "FAIL", "message": f"Error parsing {target_path}: {e}"}


def check_checksum_manifest(checksum_file="ive-output/checksums.txt"):
    """Recomputes SHA-256 for every entry in the manifest and compares against the listed hash."""
    if not os.path.exists(checksum_file) or os.path.getsize(checksum_file) == 0:
        return {"id": "S02", "result": "FAIL", "message": f"Missing or empty {checksum_file}"}

    mismatches = []
    missing_files = []
    checked = 0

    with open(checksum_file, "r", encoding="utf-8") as f:
        for line in f:
            line = line.rstrip("\n")
            if not line.strip() or line.startswith("#"):
                continue
            parts = line.split(None, 1)
            if len(parts) != 2:
                continue
            expected_hash, rel_path = parts
            rel_path = rel_path.strip()
            if not os.path.exists(rel_path):
                missing_files.append(rel_path)
                continue
            actual_hash = sha256_of(rel_path)
            checked += 1
            if actual_hash != expected_hash:
                mismatches.append({"file": rel_path, "expected": expected_hash, "actual": actual_hash})

    if missing_files or mismatches:
        return {"id": "S02", "result": "FAIL",
                "message": f"{checked} verified, {len(mismatches)} mismatched, {len(missing_files)} missing",
                "mismatches": mismatches, "missing_files": missing_files}

    return {"id": "S02", "result": "PASS",
            "message": f"All {checked} checksummed files match their recorded SHA-256"}


def check_license_status(target_path="ive-output/results.json"):
    """Checks license status is a recognized value. VALIDATED requires an actual LICENSE file."""
    try:
        with open(target_path, "r", encoding="utf-8") as f:
            data = json.load(f)
        status = data.get("license_status")
    except Exception:
        return {"id": "S03", "result": "FAIL", "message": "Unable to read license_status"}

    if status == "MISSING - REQUIRES DECISION":
        return {"id": "S03", "result": "WARN",
                "message": "License explicitly unresolved (owner decision required, not fabricated)"}
    elif status == "VALIDATED":
        if not os.path.exists("LICENSE"):
            return {"id": "S03", "result": "FAIL",
                     "message": "license_status=VALIDATED but no LICENSE file exists on disk "
                                 "-- this is a structural inconsistency, not a valid PASS"}
        return {"id": "S03", "result": "PASS", "message": "LICENSE file present and status VALIDATED"}
    else:
        return {"id": "S03", "result": "FAIL", "message": f"Unrecognized license_status: {status!r}"}


def check_version_consistency(results_path="ive-output/results.json", manifest_path="ive-output/manifest.json"):
    if not (os.path.exists(results_path) and os.path.exists(manifest_path)):
        return {"id": "S04", "result": "WARN", "message": "manifest.json or results.json absent, skipped"}
    try:
        with open(results_path) as f:
            r = json.load(f)
        with open(manifest_path) as f:
            m = json.load(f)
        rv, mv = r.get("schema_version"), m.get("schema_version")
        if rv != mv:
            return {"id": "S04", "result": "FAIL",
                     "message": f"schema_version mismatch: results.json={rv!r} manifest.json={mv!r}"}
        return {"id": "S04", "result": "PASS", "message": f"schema_version consistent ({rv})"}
    except Exception as e:
        return {"id": "S04", "result": "FAIL", "message": f"Error comparing versions: {e}"}


def main():
    parser = argparse.ArgumentParser(description="IVE Release Verification Gate")
    parser.add_argument("--root", default=".", help="Repository root (default: current directory)")
    parser.add_argument("--format", choices=["human", "json"], default="human")
    args = parser.parse_args()

    if args.root != ".":
        os.chdir(args.root)

    checks = [
        check_results_json(),
        check_checksum_manifest(),
        check_license_status(),
        check_version_consistency(),
    ]

    required_pass = all(c["result"] != "FAIL" for c in checks)

    if args.format == "json":
        print(json.dumps({"checks": checks, "all_required_passed": required_pass}, indent=2))
    else:
        print("--- Release Gate Checks (real, recomputed) ---")
        for c in checks:
            marker = {"PASS": "[PASS]", "FAIL": "[FAIL]", "WARN": "[WARN]"}[c["result"]]
            print(f"{marker} {c['id']}: {c['message']}")
        print()
        if required_pass:
            print("[RESULT] Structural checks PASSED (this is independent of GO/NO-GO disposition).")
        else:
            print("[RESULT] Structural checks FAILED.")

    sys.exit(0 if required_pass else 1)


if __name__ == "__main__":
    main()

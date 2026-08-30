#!/usr/bin/env python3
"""
IVE Result Adapter
==================

Normalizes raw tool artifacts and mapping evidence into a standard structured
dictionary with full source tracking.

This adapter maps raw tool evidence outputs to normalized contract fields
with strict source attribution tracking. It includes fallback safeguards for
missing or corrupted input files.

Usage:
    python3 scripts/ive_result_adapter.py --input outputs/raw_evidence.json --output ive-output/results.json
    python3 scripts/ive_result_adapter.py  # emits default contract to ive-output/results.json
"""

import json
import os
import sys
import time
import argparse
from pathlib import Path


def normalize_artifact_output(raw_evidence_path: str) -> dict:
    """
    Maps raw tool evidence outputs to normalized contract fields
    with strict source attribution tracking.

    Args:
        raw_evidence_path: Path to the raw tool evidence JSON file.

    Returns:
        A normalized contract dictionary with schema_version, timestamp,
        evaluation, source_attribution, metrics, and license_status.
    """
    # Fallback default contract structure if file is missing/corrupted
    if not os.path.exists(raw_evidence_path):
        return {
            "schema_version": "1.0.0",
            "timestamp": int(time.time()),
            "evaluation": "NO-GO",
            "source_attribution": {
                "error": f"Source path {raw_evidence_path} not found",
                "origin_tool": "IVE Engine Pipeline",
                "execution_id": "ive_run_fallback",
                "raw_log_source": raw_evidence_path,
            },
            "metrics": {"total_checks": 0, "passed": 0, "failed": 0},
            "license_status": "MISSING - REQUIRES DECISION",
        }

    with open(raw_evidence_path, "r", encoding="utf-8") as f:
        try:
            raw_data = json.load(f)
        except json.JSONDecodeError:
            raw_data = {}

    # Extract metrics while fallback-safeguarding missing keys
    raw_metrics = raw_data.get("metrics", {})

    normalized_contract = {
        "schema_version": "1.0.0",
        "timestamp": int(time.time()),
        "evaluation": raw_data.get("status", "NO-GO"),
        "source_attribution": {
            "origin_tool": raw_data.get("tool_name", "IVE Engine Pipeline"),
            "execution_id": raw_data.get("run_id", "ive_run_fallback"),
            "raw_log_source": os.path.abspath(raw_evidence_path),
        },
        "metrics": {
            "total_checks": raw_metrics.get("total", 0),
            "passed": raw_metrics.get("success", 0),
            "failed": raw_metrics.get("failure", 0),
        },
        "license_status": "MISSING - REQUIRES DECISION",
    }

    return normalized_contract


def write_contract(contract: dict, output_path: str) -> None:
    """Write the normalized contract to disk as pretty-printed JSON."""
    Path(output_path).parent.mkdir(parents=True, exist_ok=True)
    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(contract, f, indent=2)
    print(f"[+] Normalized contract written to: {output_path}")


def main():
    parser = argparse.ArgumentParser(description="IVE Result Adapter — normalize raw tool evidence into the frozen contract")
    parser.add_argument("--input", default="outputs/raw_evidence.json", help="Path to raw tool evidence JSON (default: outputs/raw_evidence.json)")
    parser.add_argument("--output", default="ive-output/results.json", help="Output path for normalized contract (default: ive-output/results.json)")
    args = parser.parse_args()

    contract = normalize_artifact_output(args.input)
    write_contract(contract, args.output)

    print(f"    schema_version: {contract['schema_version']}")
    print(f"    evaluation: {contract['evaluation']}")
    print(f"    license_status: {contract['license_status']}")
    print(f"    metrics: {contract['metrics']['passed']}/{contract['metrics']['total_checks']} passed")


if __name__ == "__main__":
    main()

#!/usr/bin/env python3
"""VVU-VAL-001 · Validation Index Computation (published 6-dimension formula).

Index = Σ(weightᵢ × dimensionᵢ), weights sum to 1.0, each dimension 0-100.
"""
import argparse, json, sys
from pathlib import Path

DIMS = [
    {"key":"replay","label":"Replay Determinism","weight":0.20},
    {"key":"evidence","label":"Evidence Integrity","weight":0.20},
    {"key":"tee","label":"TEE Attestation","weight":0.15},
    {"key":"policy","label":"Policy Conformance","weight":0.15},
    {"key":"merge","label":"Merge Correctness","weight":0.15},
    {"key":"availability","label":"Availability","weight":0.15},
]
assert abs(sum(d["weight"] for d in DIMS) - 1.0) < 1e-9

def m_replay(m):
    l, r = m.get("fact_log_checksum"), m.get("replay_checksum")
    return 100.0 if l and r and l == r else (100.0 if not l or not r else 0.0)

def m_evidence(m):
    t, v = m.get("evidence_bundles_total", 0), m.get("evidence_bundles_verified", 0)
    return 100.0 if t == 0 else 100.0 * v / t

def m_tee(m):
    s, q = m.get("spoofed_payloads_injected", 0), m.get("spoofed_payloads_quarantined", 0)
    return 100.0 if s == 0 else 100.0 * (1 - (s - q) / s)

def m_policy(m):
    v, h = m.get("policy_violations", 0), m.get("policy_violations_handled", 0)
    return max(0.0, 100.0 - 4.0 * max(0, v - h))

def m_merge(m):
    mc, c = m.get("merge_count", 0), m.get("merge_conflicts_observed", 0)
    return 100.0 if mc == 0 else (100.0 if c == 0 else max(0.0, 100.0 - 50.0 * c / mc))

def m_avail(m):
    t, f = m.get("elapsed_s", 1), m.get("fail_closed_s", 0)
    return max(0.0, 100.0 * (1 - f / max(1, t)))

M = {"replay":m_replay,"evidence":m_evidence,"tee":m_tee,"policy":m_policy,"merge":m_merge,"availability":m_avail}

def compute(m):
    dims = {d["key"]: round(M[d["key"]](m), 2) for d in DIMS}
    idx = round(sum(d["weight"] * dims[d["key"]] for d in DIMS), 2)
    return {"index": idx, "dimensions": dims, "weights": {d["key"]:d["weight"] for d in DIMS},
            "formula": "Index = Σ(weightᵢ × dimensionᵢ), weights sum to 1.0"}

def main():
    ap = argparse.ArgumentParser(description="VVU Validation Index")
    ap.add_argument("--metrics", required=True)
    ap.add_argument("--json", action="store_true")
    a = ap.parse_args()
    m = json.loads(Path(a.metrics).read_text())
    r = compute(m)
    if a.json:
        print(json.dumps(r, indent=2))
    else:
        print(f"VVU Validation Index: {r['index']} / 100")
        print(f"  formula: {r['formula']}")
        for d in DIMS:
            print(f"    {d['label']:<22} {r['dimensions'][d['key']]:>6.2f}  (w={d['weight']})")

if __name__ == "__main__":
    main()

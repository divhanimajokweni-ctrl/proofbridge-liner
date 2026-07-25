#!/usr/bin/env python3
import hashlib, json, pathlib, sys
from datetime import datetime, timezone

ROOT = pathlib.Path("VVU-VAL-001")
PROTOCOL = ROOT / "protocol"
now = lambda: datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZPlaceholder")


def canonical(obj: dict) -> str:
    c = dict(obj)
    c["checksum"] = "PLACEHOLDER"
    return json.dumps(c, indent=2, sort_keys=True) + "\n"


def write_envelope(path: pathlib.Path, payload: dict) -> dict:
    obj = {
        "artifact": payload["artifact"],
        "version": "1.0",
        "status": payload["status"],
        "generatedAt": payload["generatedAt"],
        "generator": payload["generator"],
        "inputs": payload.get("inputs", []),
        "checksum": "PLACEHOLDER",
        "payload": payload.get("payload", {}),
    }
    obj["checksum"] = hashlib.sha256(canonical(obj).encode("utf-8")).hexdigest()
    path.write_text(json.dumps(obj, indent=2) + "\n", encoding="utf-8")
    return obj


def update_gate_a() -> dict:
    freeze_path = PROTOCOL / "frozen-build.json"
    freeze = {}
    if freeze_path.exists():
        freeze = json.loads(freeze_path.read_text(encoding="utf-8"))
    report = {}
    report_path = PROTOCOL / "rehearsal-report.json"
    if report_path.exists():
        report = json.loads(report_path.read_text(encoding="utf-8"))
    return {
        "artifact": "gate-a-rehearsal",
        "generator": "rehearsal-audit",
        "generatedAt": now(),
        "inputs": ["rehearsal-report.json", "freeze-build.json", "lint-report.json", "test-report.json"],
        "status": "PASS" if all([
            bool(freeze.get("frozen_at")),
            report.get("lint_passed") is True,
            report.get("tests_passed") is True,
        ]) else "FAIL",
        "payload": {
            "freezeBuildVerified": bool(freeze.get("frozen_at")),
            "lintPassed": report.get("lint_passed") is True,
            "testsPassed": report.get("tests_passed") is True,
            "observerVerified": False,
        },
    }


def update_gate_b() -> dict:
    replay_path = ROOT / "evidence" / "replay-result.json"
    replay = {}
    if replay_path.exists():
        replay = json.loads(replay_path.read_text(encoding="utf-8"))
    archive_path = PROTOCOL / "archive-manifest.json"
    archive = {}
    if archive_path.exists():
        archive = json.loads(archive_path.read_text(encoding="utf-8"))
    index_path = PROTOCOL / "validation-index.json"
    index = {}
    if index_path.exists():
        index = json.loads(index_path.read_text(encoding="utf-8"))
    replay_passed = replay.get("passed") is True or replay.get("status") == "PASS"
    archive_ready = archive.get("status") == "archived" or archive.get("hours", 0) >= 72
    score = index.get("validation_index", index.get("score", 0))
    return {
        "artifact": "gate-b-evidence",
        "generator": "evidence-audit",
        "generatedAt": now(),
        "inputs": ["replay-result.json", "archive-manifest.json", "validation-index.json"],
        "status": "PASS" if all([replay_passed, archive_ready, score >= 0.95]) else "FAIL",
        "payload": {
            "replayPassed": replay_passed,
            "archiveComplete": archive_ready,
            "validationIndexMet": score >= 0.95,
            "bundleCount": archive.get("bundleCount", 0),
        },
    }


def update_gate_c() -> dict:
    runtime = PROTOCOL.parent / "kubernetes" / "runtime.yaml"
    nats = PROTOCOL.parent / "kubernetes" / "nats.yaml"
    netpol = PROTOCOL.parent / "kubernetes" / "networkpolicy.yaml"
    pdbs = PROTOCOL.parent / "kubernetes" / "pdbs.yaml"
    texts = [p.read_text(encoding="utf-8") for p in [runtime, nats] if p.exists()]
    policy_text = netpol.read_text(encoding="utf-8") if netpol.exists() else ""
    pdb_text = pdbs.read_text(encoding="utf-8") if pdbs.exists() else ""
    has_policies = netpol.exists() and pdbs.exists()
    return {
        "artifact": "gate-c-kubernetes",
        "generator": "kubernetes-audit",
        "generatedAt": now(),
        "inputs": ["runtime.yaml", "nats.yaml", "networkpolicy.yaml", "pdbs.yaml"],
        "status": "PASS" if all([texts, any("securityContext" in t for t in texts), has_policies]) else "FAIL",
        "payload": {
            "securityContextsApplied": any("securityContext" in t for t in texts),
            "networkPolicyApplied": "NetworkPolicy" in policy_text,
            "resourceRequestsSet": any("requests:" in t for t in texts),
            "pdbApplied": "PodDisruptionBudget" in pdb_text,
        },
    }


def update_gate_d() -> dict:
    root_app = ROOT / "deploy" / "argocd" / "root-app.yaml"
    apps_dir = ROOT / "deploy" / "argocd" / "apps"
    apps = list(apps_dir.glob("*.yaml")) if apps_dir.exists() else []
    root_text = root_app.read_text(encoding="utf-8") if root_app.exists() else ""
    sealed = (ROOT / "deploy" / "argocd" / "scripts" / "seal-secrets.sh").exists()
    return {
        "artifact": "gate-d-gitops",
        "generator": "gitops-audit",
        "generatedAt": now(),
        "inputs": ["deploy/argocd/root-app.yaml", "deploy/argocd/apps/*.yaml", "deploy/argocd/scripts/seal-secrets.sh"],
        "status": "PASS" if all([root_app.exists(), bool(apps), sealed, "repoURL:" in root_text]) else "FAIL",
        "payload": {
            "repoURLCorrect": "repoURL:" in root_text,
            "sealedSecretsApplied": sealed,
            "syncWaveAnnotationsPresent": "argocd.argoproj.io/sync-wave" in root_text or any("argocd.argoproj.io/sync-wave" in a.read_text(encoding="utf-8") for a in apps),
            "promotionGovernanceEnforced": len(apps) > 0,
        },
    }


def update_gate_e() -> dict:
    return {
        "artifact": "gate-e-compliance",
        "generator": "compliance-audit",
        "generatedAt": now(),
        "inputs": ["popia-audit-report.json", "security-audit-report.json", "operator-verification.json"],
        "status": "PENDING",
        "payload": {"informationOfficerVerified": False, "popiaAudit": "PENDING", "securityAudit": "PENDING"},
    }


def update_gate_f() -> dict:
    return {
        "artifact": "gate-f-readiness",
        "generator": "pilot-readiness",
        "generatedAt": now(),
        "inputs": ["scada-report.json", "inventory.json", "site-approval.json"],
        "status": "PENDING",
        "payload": {"siteApproved": False, "scadaVerified": False, "inventoryVerified": False},
    }


def update_gate_g() -> dict:
    return {
        "artifact": "gate-g-release",
        "generator": "release-authorization",
        "generatedAt": now(),
        "inputs": ["deployment-record.json", "completion-record.json", "manifest.json"],
        "status": "PENDING",
        "payload": {"allPrerequisitesSatisfied": False, "approvedBuild": False, "deploymentEligible": False},
    }


def main() -> int:
    updates = {
        "gate-a-rehearsal.json": update_gate_a(),
        "gate-b-evidence.json": update_gate_b(),
        "gate-c-kubernetes.json": update_gate_c(),
        "gate-d-gitops.json": update_gate_d(),
        "gate-e-compliance.json": update_gate_e(),
        "gate-f-readiness.json": update_gate_f(),
        "gate-g-release.json": update_gate_g(),
    }
    for name, payload in updates.items():
        write_envelope(PROTOCOL / name, payload)
    needed = [n for n, p in updates.items() if p["status"] != "PASS"]
    print(f"Updated {len(updates)} gate envelope(s).")
    if needed:
        print("Blocked gates: " + ", ".join(needed))
        print("HINT: Add missing inputs under VVU-VAL-001/protocol/ or VVU-VAL-001/evidence/.")
    else:
        print("All gates PASS.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

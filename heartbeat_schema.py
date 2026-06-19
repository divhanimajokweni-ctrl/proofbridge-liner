import re
import hashlib
from dataclasses import dataclass, field
from datetime import datetime, timezone
from pathlib import Path
from typing import Optional

HEARTBEAT_FILE   = Path("HEARTBEAT.md")
SCHEMA_VERSION   = "2.0"

# Priority levels written into incident blocks by the watchdog.
# Orchestrator processes CRITICAL before HIGH before NORMAL.
PRIORITY_CRITICAL = "CRITICAL"
PRIORITY_HIGH     = "HIGH"
PRIORITY_NORMAL   = "NORMAL"

# Canonical op-tag vocabulary shared by watchdog (writes Op-Hint)
# and orchestrator (reads Op-Hint, executes mapped command).
OP_TAG_VOCAB: dict[str, str] = {
    "lean_compile_fail":   "python scripts/verify_lean.py --mock",
    "hsm_key_drift":       "python scripts/rotate_mock_keys.py",
    "mathlib_missing":     "python scripts/install_mathlib.py --check",
    "server_timeout":      "python scripts/restart_verification_server.py",
    "api_key_missing":     "python scripts/vault_fetch_keys.py --dry",
    "pipeline_frozen":     "python scripts/reset_pipeline.py",
    "attestation_fail":    "python scripts/rerun_attestation.py",
    "dep_drift":           "python scripts/sync_dependencies.py",
    "cert_expiry":         "python scripts/renew_certs.py --dry",
    "unknown":             "python scripts/generic_health_repair.py",
}

# ── SCHEMA PRIMITIVES ─────────────────────────────────────────

@dataclass
class Incident:
    id:          str
    summary:     str
    priority:    str          = PRIORITY_NORMAL
    error_log:   str          = ""
    op_hint:     str          = "unknown"
    triggered_by:str          = "watchdog"
    timestamp:   str          = ""
    instruction: str          = ""
    raw_block:   str          = ""          # original text in heartbeat

    @property
    def sort_key(self) -> int:
        order = {PRIORITY_CRITICAL: 0, PRIORITY_HIGH: 1, PRIORITY_NORMAL: 2}
        return order.get(self.priority, 99)


def utc_now() -> str:
    return datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M:%S UTC")


def file_checksum(path: Path) -> str:
    try:
        return hashlib.sha256(path.read_bytes()).hexdigest()[:16]
    except FileNotFoundError:
        return ""


# ── PARSER ────────────────────────────────────────────────────

_INCIDENT_RE = re.compile(
    r"(?P<block>- \[ \] \*\*(?P<id>[^*]+)\*\*: (?P<summary>[^\n]+)"
    r"(?P<body>(?:\n  - [^\n]+)*))",
    re.MULTILINE,
)

def _extract(body: str, key: str) -> str:
    m = re.search(rf"\*{re.escape(key)}\*: (.+?)(?:\n|$)", body)
    return m.group(1).strip().strip("`") if m else ""

def parse_open_incidents(content: str) -> list[Incident]:
    incidents = []
    for m in _INCIDENT_RE.finditer(content):
        body = m.group("body")
        inc  = Incident(
            id          = m.group("id").strip(),
            summary     = m.group("summary").strip(),
            priority    = _extract(body, "Priority")  or PRIORITY_NORMAL,
            error_log   = _extract(body, "Error Log"),
            op_hint     = _extract(body, "Op Hint")   or "unknown",
            triggered_by= _extract(body, "Triggered By"),
            timestamp   = _extract(body, "Timestamp"),
            instruction = _extract(body, "Instruction for Autonomous Agent"),
            raw_block   = m.group("block"),
        )
        incidents.append(inc)
    # Sort by priority: CRITICAL first
    return sorted(incidents, key=lambda i: i.sort_key)


# ── WRITER HELPERS ────────────────────────────────────────────

def build_incident_block(
    incident_id: str,
    summary: str,
    error_log: str,
    details: str,
    op_hint: str      = "unknown",
    priority: str     = PRIORITY_NORMAL,
    triggered_by: str = "watchdog",
) -> str:
    return (
        f"\n- [ ] **{incident_id}**: {summary}\n"
        f"  - *Triggered By*: {triggered_by}\n"
        f"  - *Timestamp*: {utc_now()}\n"
        f"  - *Priority*: {priority}\n"
        f"  - *Error Log*: `{error_log}`\n"
        f"  - *Details*: {details}\n"
        f"  - *Op Hint*: `{op_hint}`\n"
        f"  - *Instruction for Autonomous Agent*: "
        f"Infer op from Op Hint. Execute. Verify. Resolve.\n"
    )

def resolve_block(content: str, incident: Incident, result: dict, tag: str) -> str:
    status  = "RESOLVED" if result["exit_code"] == 0 else "ATTEMPTED"
    output  = (result["stdout"] or result["stderr"])[:400]
    closed = (
        f"- [x] **{incident.id}**: {incident.summary}\n"
        f"  - *Resolved At*: {utc_now()}\n"
        f"  - *Op Tag*: `{tag}`\n"
        f"  - *Status*: {status}\n"
        f"  - *Output*: `{output}`\n"
    )
    return content.replace(incident.raw_block, closed, 1)

def stamp_header(content: str, cycle: int, open_count: int, resolved: int) -> str:
    def _replace(text: str, prefix: str, new_line: str) -> str:
        p = re.compile(rf"^{re.escape(prefix)}.*$", re.MULTILINE)
        return p.sub(new_line, text, count=1) if p.search(text) else text + f"\n{new_line}"
    content = _replace(content, "Last Check:",    f"Last Check: {utc_now()}")
    content = _replace(content, "Schema:",        f"Schema: v{SCHEMA_VERSION}")
    content = _replace(content, "Cycle:",         f"Cycle: {cycle:06d} | Open: {open_count} | Resolved: {resolved}")
    content = _replace(content, "System Status:", f"System Status: {'[NOMINAL]' if open_count == 0 else '[REMEDIATING]'}")
    return content

def seed_if_absent(path: Path):
    if not path.exists():
        path.write_text(
            "# INFRASTRUCTURE HEARTBEAT & INCIDENT LOG\n"
            f"Schema: v{SCHEMA_VERSION}\n"
            f"Last Check: {utc_now()}\n"
            "System Status: [NOMINAL]\n"
            "Cycle: 000000 | Open: 0 | Resolved: 0\n\n"
            "## Active Outages\n"
        )

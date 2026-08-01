import sqlite3
import json
from datetime import datetime, timezone
from typing import Optional, Dict, Any, List
from dataclasses import dataclass, field


@dataclass
class GateStatus:
    name: str
    status: str
    ok: Optional[bool]
    updated_at: datetime


@dataclass
class TenantState:
    tenant_id: str
    active_workers: int = 8
    average_latency: int = 120
    throughput: int = 67
    regulator_mode: bool = False
    halt_count: int = 0
    gates: Dict[str, GateStatus] = field(default_factory=dict)
    last_updated: datetime = field(default_factory=lambda: datetime.now(timezone.utc))

    def to_dict(self) -> Dict[str, Any]:
        return {
            "tenant_id": self.tenant_id,
            "active_workers": self.active_workers,
            "average_latency": self.average_latency,
            "throughput": self.throughput,
            "regulator_mode": self.regulator_mode,
            "halt_count": self.halt_count,
            "gates": {
                name: {
                    "name": g.name,
                    "status": g.status,
                    "ok": g.ok,
                    "updated_at": g.updated_at.isoformat(),
                }
                for name, g in self.gates.items()
            },
            "last_updated": self.last_updated.isoformat(),
        }


class ReadModel:
    def __init__(self, db_path: str = "/tmp/vvu_projections.db"):
        self.db_path = db_path
        self._init_db()

    def _init_db(self):
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS tenant_state (
                tenant_id TEXT PRIMARY KEY,
                state_json TEXT NOT NULL,
                updated_at TEXT NOT NULL
            )
        """)
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_tenant_state_updated ON tenant_state(updated_at)")
        conn.commit()
        conn.close()

    async def get_tenant_state(self, tenant_id: str) -> Optional[Dict[str, Any]]:
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        cursor.execute("SELECT state_json FROM tenant_state WHERE tenant_id = ?", (tenant_id,))
        row = cursor.fetchone()
        conn.close()
        if row:
            return json.loads(row[0])
        return None

    async def get_all_tenant_states(self) -> Dict[str, Dict[str, Any]]:
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        cursor.execute("SELECT tenant_id, state_json FROM tenant_state")
        rows = cursor.fetchall()
        conn.close()
        return {row[0]: json.loads(row[1]) for row in rows}

    async def update_tenant_state(self, tenant_id: str, state: Dict[str, Any]):
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        cursor.execute(
            "INSERT OR REPLACE INTO tenant_state (tenant_id, state_json, updated_at) VALUES (?, ?, ?)",
            (tenant_id, json.dumps(state), datetime.now(timezone.utc).isoformat()),
        )
        conn.commit()
        conn.close()

    async def handle_event(self, event_data: Dict[str, Any]):
        event_type = event_data.get("event_type")
        tenant_id = event_data.get("tenant_id")
        metadata = event_data.get("metadata", {})

        if not tenant_id:
            return

        current = await self.get_tenant_state(tenant_id)
        if not current:
            current = {
                "tenant_id": tenant_id,
                "active_workers": 8,
                "average_latency": 120,
                "throughput": 67,
                "regulator_mode": False,
                "halt_count": 0,
                "gates": {
                    "GovernanceAnchor.sol": {
                        "name": "GovernanceAnchor.sol", "status": "NOT DEPLOYED", "ok": None,
                        "updated_at": datetime.now(timezone.utc).isoformat(),
                    },
                    "ED25519 VCT Sig": {
                        "name": "ED25519 VCT Sig", "status": "HARD FAIL", "ok": False,
                        "updated_at": datetime.now(timezone.utc).isoformat(),
                    },
                    "TEE Attestation": {
                        "name": "TEE Attestation", "status": "SW-MODE", "ok": None,
                        "updated_at": datetime.now(timezone.utc).isoformat(),
                    },
                    "FSCA CASP Reg": {
                        "name": "FSCA CASP Reg", "status": "PENDING", "ok": None,
                        "updated_at": datetime.now(timezone.utc).isoformat(),
                    },
                    "Release Gate": {
                        "name": "Release Gate", "status": "2026-07-30", "ok": None,
                        "updated_at": datetime.now(timezone.utc).isoformat(),
                    },
                },
                "last_updated": datetime.now(timezone.utc).isoformat(),
            }

        if event_type == "worker.count.changed":
            current["active_workers"] = metadata.get("new_count", current["active_workers"])
            current["throughput"] = int((1000 / current["average_latency"]) * current["active_workers"])

        elif event_type == "worker.count.requested":
            current["_pending_request"] = {
                "count": metadata.get("count", 8),
                "requested_at": datetime.now(timezone.utc).isoformat(),
            }

        elif event_type == "governance.regulator.changed":
            current["regulator_mode"] = metadata.get("enabled", False)
            if current["regulator_mode"]:
                current["halt_count"] = current.get("halt_count", 0) + 1

        elif event_type == "governance.circuit_breaker.tripped":
            current["halt_count"] = current.get("halt_count", 0) + 1
            current["_last_trip"] = {
                "reason": metadata.get("reason", "unknown"),
                "metrics": metadata.get("metrics", {}),
                "tripped_at": datetime.now(timezone.utc).isoformat(),
            }

        elif event_type == "proofbridge.gate.updated":
            gate = metadata.get("gate")
            if gate and gate in current.get("gates", {}):
                if "status" in metadata:
                    current["gates"][gate]["status"] = metadata["status"]
                if "ok" in metadata:
                    current["gates"][gate]["ok"] = metadata["ok"]
                current["gates"][gate]["updated_at"] = datetime.now(timezone.utc).isoformat()

        elif event_type == "infra.health.check":
            component = metadata.get("component")
            if component:
                current.setdefault("_health", {})[component] = {
                    "status": metadata.get("status", "unknown"),
                    "details": metadata.get("details", {}),
                    "checked_at": datetime.now(timezone.utc).isoformat(),
                }

        current["last_updated"] = datetime.now(timezone.utc).isoformat()
        await self.update_tenant_state(tenant_id, current)


read_model = ReadModel()

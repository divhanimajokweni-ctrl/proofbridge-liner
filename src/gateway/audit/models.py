from dataclasses import dataclass, field
from datetime import datetime, timezone
from typing import Optional, Dict, Any
import hashlib
import json
import uuid
from enum import Enum


class AuditSeverity(str, Enum):
    INFO = "info"
    WARNING = "warning"
    ERROR = "error"
    CRITICAL = "critical"


@dataclass
class AuditEntry:
    event_id: str
    timestamp: datetime
    tenant_id: str
    actor: str
    channel: str
    tool: str
    action: str
    arguments: Dict[str, Any]
    result: Dict[str, Any]
    severity: AuditSeverity = AuditSeverity.INFO
    previous_hash: str = ""
    hash: str = ""

    @classmethod
    def from_event(cls, event_data: Dict[str, Any], previous_hash: str = "") -> "AuditEntry":
        metadata = event_data.get("metadata", {})

        entry = cls(
            event_id=event_data.get("correlation_id") or str(uuid.uuid4()),
            timestamp=datetime.fromisoformat(
                event_data.get("timestamp", datetime.now(timezone.utc).isoformat()).replace("Z", "+00:00")
            ),
            tenant_id=event_data.get("tenant_id", ""),
            actor=event_data.get("actor", ""),
            channel=event_data.get("channel", "unknown"),
            tool=event_data.get("tool", event_data.get("event_type", "")),
            action=event_data.get("event_type", ""),
            arguments=metadata,
            result=event_data.get("result", {}),
            severity=AuditSeverity(metadata.get("severity", "info")),
            previous_hash=previous_hash,
        )

        content = json.dumps({
            "event_id": entry.event_id,
            "timestamp": entry.timestamp.isoformat(),
            "tenant_id": entry.tenant_id,
            "actor": entry.actor,
            "channel": entry.channel,
            "tool": entry.tool,
            "action": entry.action,
            "arguments": entry.arguments,
            "result": entry.result,
            "severity": entry.severity.value,
            "previous_hash": entry.previous_hash,
        }, sort_keys=True)

        entry.hash = hashlib.sha256(content.encode()).hexdigest()
        return entry

    def to_dict(self) -> Dict[str, Any]:
        return {
            "event_id": self.event_id,
            "timestamp": self.timestamp.isoformat(),
            "tenant_id": self.tenant_id,
            "actor": self.actor,
            "channel": self.channel,
            "tool": self.tool,
            "action": self.action,
            "arguments": self.arguments,
            "result": self.result,
            "severity": self.severity.value,
            "previous_hash": self.previous_hash,
            "hash": self.hash,
        }

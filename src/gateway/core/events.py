from dataclasses import dataclass, field
from datetime import datetime, timezone
from typing import Optional, Any, Dict, List
import json
import uuid
import asyncio
from enum import Enum


class EventPriority(str, Enum):
    LOW = "low"
    NORMAL = "normal"
    HIGH = "high"
    CRITICAL = "critical"


@dataclass
class Event:
    event_type: str
    version: int = 1
    tenant_id: str = ""
    actor: str = ""
    correlation_id: Optional[str] = None
    timestamp: datetime = field(default_factory=lambda: datetime.now(timezone.utc))
    priority: EventPriority = EventPriority.NORMAL
    metadata: Dict[str, Any] = field(default_factory=dict)

    def to_dict(self) -> Dict[str, Any]:
        return {
            "event_type": self.event_type,
            "version": self.version,
            "tenant_id": self.tenant_id,
            "actor": self.actor,
            "correlation_id": self.correlation_id or str(uuid.uuid4()),
            "timestamp": self.timestamp.isoformat(),
            "priority": self.priority.value,
            "metadata": self.metadata,
        }

    def to_json(self) -> str:
        return json.dumps(self.to_dict())


@dataclass
class WorkerCountRequested(Event):
    count: int = 8
    reason: str = "manual"
    event_type: str = "worker.count.requested"

    def to_dict(self) -> Dict[str, Any]:
        d = super().to_dict()
        d["metadata"].update({"count": self.count, "reason": self.reason})
        return d


@dataclass
class WorkerCountChanged(Event):
    old_count: int = 8
    new_count: int = 8
    event_type: str = "worker.count.changed"

    def to_dict(self) -> Dict[str, Any]:
        d = super().to_dict()
        d["metadata"].update({"old_count": self.old_count, "new_count": self.new_count})
        return d


@dataclass
class WorkerScalingFailed(Event):
    requested_count: int = 8
    error: str = ""
    event_type: str = "worker.scaling.failed"
    priority: EventPriority = EventPriority.HIGH

    def to_dict(self) -> Dict[str, Any]:
        d = super().to_dict()
        d["metadata"].update({"requested_count": self.requested_count, "error": self.error})
        return d


@dataclass
class InfrastructureHealthCheck(Event):
    component: str = ""
    status: str = "healthy"
    details: Dict[str, Any] = field(default_factory=dict)
    event_type: str = "infra.health.check"

    def to_dict(self) -> Dict[str, Any]:
        d = super().to_dict()
        d["metadata"].update({"component": self.component, "status": self.status, "details": self.details})
        return d


@dataclass
class RegulatorModeRequested(Event):
    enabled: bool = False
    reason: str = "manual"
    event_type: str = "governance.regulator.requested"
    priority: EventPriority = EventPriority.HIGH

    def to_dict(self) -> Dict[str, Any]:
        d = super().to_dict()
        d["metadata"].update({"enabled": self.enabled, "reason": self.reason})
        return d


@dataclass
class RegulatorModeChanged(Event):
    enabled: bool = False
    event_type: str = "governance.regulator.changed"
    priority: EventPriority = EventPriority.HIGH

    def to_dict(self) -> Dict[str, Any]:
        d = super().to_dict()
        d["metadata"].update({"enabled": self.enabled})
        return d


@dataclass
class CircuitBreakerTripped(Event):
    reason: str = ""
    metrics: Dict[str, Any] = field(default_factory=dict)
    event_type: str = "governance.circuit_breaker.tripped"
    priority: EventPriority = EventPriority.CRITICAL

    def to_dict(self) -> Dict[str, Any]:
        d = super().to_dict()
        d["metadata"].update({"reason": self.reason, "metrics": self.metrics})
        return d


@dataclass
class CircuitBreakerReset(Event):
    reason: str = ""
    event_type: str = "governance.circuit_breaker.reset"
    priority: EventPriority = EventPriority.HIGH

    def to_dict(self) -> Dict[str, Any]:
        d = super().to_dict()
        d["metadata"].update({"reason": self.reason})
        return d


@dataclass
class GateUpdateRequested(Event):
    gate: str = ""
    status: str = ""
    ok: Optional[bool] = None
    proof_hash: Optional[str] = None
    event_type: str = "proofbridge.gate.requested"
    priority: EventPriority = EventPriority.HIGH

    def to_dict(self) -> Dict[str, Any]:
        d = super().to_dict()
        metadata = {"gate": self.gate, "status": self.status}
        if self.ok is not None:
            metadata["ok"] = self.ok
        if self.proof_hash:
            metadata["proof_hash"] = self.proof_hash
        d["metadata"].update(metadata)
        return d


@dataclass
class GateUpdated(Event):
    gate: str = ""
    status: str = ""
    ok: Optional[bool] = None
    event_type: str = "proofbridge.gate.updated"

    def to_dict(self) -> Dict[str, Any]:
        d = super().to_dict()
        metadata = {"gate": self.gate, "status": self.status}
        if self.ok is not None:
            metadata["ok"] = self.ok
        d["metadata"].update(metadata)
        return d


@dataclass
class ProofVerificationRequested(Event):
    proof_id: str = ""
    proof_type: str = "zk"
    event_type: str = "proofbridge.verify.requested"

    def to_dict(self) -> Dict[str, Any]:
        d = super().to_dict()
        d["metadata"].update({"proof_id": self.proof_id, "proof_type": self.proof_type})
        return d


@dataclass
class ProofVerificationComplete(Event):
    proof_id: str = ""
    valid: bool = False
    details: Dict[str, Any] = field(default_factory=dict)
    event_type: str = "proofbridge.verify.complete"

    def to_dict(self) -> Dict[str, Any]:
        d = super().to_dict()
        d["metadata"].update({"proof_id": self.proof_id, "valid": self.valid, "details": self.details})
        return d


class EventBus:
    def __init__(self, redis_url: str = "redis://localhost:6379"):
        self.redis_url = redis_url
        self._redis: Optional[Any] = None
        self._subscribers: Dict[str, List[callable]] = {}
        self._memory_store: List[Dict[str, Any]] = []
        self._use_redis = False

    async def connect(self):
        try:
            import redis.asyncio as aioredis
            self._redis = aioredis.Redis.from_url(self.redis_url, decode_responses=True)
            await self._redis.ping()
            self._use_redis = True
        except Exception:
            self._use_redis = False

    async def publish(self, event: Event) -> str:
        data = event.to_json()
        event_dict = event.to_dict()
        message_id = str(uuid.uuid4())

        if self._use_redis and self._redis:
            stream = f"events:{event.tenant_id}:{event.event_type.split('.')[0]}"
            await self._redis.xadd(stream, {"event": data})
            await self._redis.xadd("events:audit", {"event": data})
            await self._redis.publish("events", data)
        else:
            self._memory_store.append(event_dict)

        for pattern, callbacks in self._subscribers.items():
            if pattern == "*" or self._match_pattern(event.event_type, pattern):
                for callback in callbacks:
                    try:
                        await callback(event_dict)
                    except Exception:
                        pass

        return message_id

    async def subscribe(self, callback: callable, pattern: str = "*"):
        self._subscribers.setdefault(pattern, []).append(callback)

    def _match_pattern(self, event_type: str, pattern: str) -> bool:
        if pattern.endswith("*"):
            return event_type.startswith(pattern[:-1])
        return event_type == pattern

    async def close(self):
        if self._use_redis and self._redis:
            await self._redis.close()

    def get_recent_events(self, limit: int = 50) -> List[Dict[str, Any]]:
        return self._memory_store[-limit:]


event_bus = EventBus()


async def publish_event(event: Event) -> str:
    return await event_bus.publish(event)

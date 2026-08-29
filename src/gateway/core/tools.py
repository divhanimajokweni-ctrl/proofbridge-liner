from dataclasses import dataclass
from typing import Awaitable, Callable, Dict, Any, Optional
from datetime import datetime, timezone
from .identity import Identity
from .events import publish_event, WorkerCountRequested, RegulatorModeRequested, GateUpdateRequested, ProofVerificationRequested
from ..projections.read_model import read_model


@dataclass(frozen=True)
class ToolDefinition:
    name: str
    handler: Callable[..., Awaitable[Dict[str, Any]]]
    capability: str
    read_only: bool
    tenant_scoped: bool
    requires_approval: bool = False
    category: str = "general"
    description: str = ""


async def query_infrastructure(identity: Identity, params: Dict[str, Any]) -> Dict[str, Any]:
    try:
        state = await read_model.get_tenant_state(identity.tenant_id)
        if not state:
            return {"error": "No infrastructure state found", "tenant": identity.tenant_id}
        return {
            "tenant": identity.tenant_id,
            "workers": state.get("active_workers", 0),
            "throughput": state.get("throughput", 0),
            "latency": state.get("average_latency", 0),
            "regulator_mode": state.get("regulator_mode", False),
            "gates": state.get("gates", {}),
            "last_updated": state.get("last_updated"),
        }
    except Exception as e:
        return {"error": f"Query failed: {str(e)}"}


async def set_worker_count(identity: Identity, params: Dict[str, Any]) -> Dict[str, Any]:
    count = params.get("count", 8)
    reason = params.get("reason", "manual")

    if count < 1 or count > 100:
        return {"error": "Worker count must be between 1 and 100"}

    event = WorkerCountRequested(
        tenant_id=identity.tenant_id,
        actor=identity.subject,
        count=count,
        reason=reason,
        correlation_id=identity.session_id,
    )
    event.metadata["channel"] = identity.channel.value
    await publish_event(event)

    return {
        "status": "requested",
        "correlation_id": event.correlation_id,
        "requested_count": count,
        "tenant": identity.tenant_id,
    }


async def set_regulator_mode(identity: Identity, params: Dict[str, Any]) -> Dict[str, Any]:
    enabled = params.get("enabled", False)
    reason = params.get("reason", "manual")

    current_state = await read_model.get_tenant_state(identity.tenant_id)
    if current_state and current_state.get("regulator_mode") == enabled:
        return {"status": "already_set", "enabled": enabled}

    event = RegulatorModeRequested(
        tenant_id=identity.tenant_id,
        actor=identity.subject,
        enabled=enabled,
        reason=reason,
        correlation_id=identity.session_id,
    )
    event.metadata["channel"] = identity.channel.value
    await publish_event(event)

    return {
        "status": "requested",
        "correlation_id": event.correlation_id,
        "enabled": enabled,
        "requires_approval": True,
    }


async def update_gate(identity: Identity, params: Dict[str, Any]) -> Dict[str, Any]:
    gate = params.get("gate", "")
    status = params.get("status", "")
    ok = params.get("ok")

    valid_gates = ["GovernanceAnchor.sol", "ED25519 VCT Sig", "TEE Attestation", "FSCA CASP Reg", "Release Gate"]
    if gate not in valid_gates:
        return {"error": f"Invalid gate: {gate}", "valid_gates": valid_gates}

    valid_statuses = ["DEPLOYED", "HARD FAIL", "SOFT FAIL", "PENDING", "APPROVED", "REJECTED"]
    if status not in valid_statuses:
        return {"error": f"Invalid status: {status}", "valid_statuses": valid_statuses}

    event = GateUpdateRequested(
        tenant_id=identity.tenant_id,
        actor=identity.subject,
        gate=gate,
        status=status,
        ok=ok,
        correlation_id=identity.session_id,
    )
    event.metadata["channel"] = identity.channel.value
    await publish_event(event)

    return {
        "status": "requested",
        "correlation_id": event.correlation_id,
        "gate": gate,
        "requires_approval": True,
    }


async def verify_proof(identity: Identity, params: Dict[str, Any]) -> Dict[str, Any]:
    proof_id = params.get("proof_id", "")
    if not proof_id:
        return {"error": "proof_id is required"}

    event = ProofVerificationRequested(
        tenant_id=identity.tenant_id,
        actor=identity.subject,
        proof_id=proof_id,
        correlation_id=identity.session_id,
    )
    event.metadata["channel"] = identity.channel.value
    await publish_event(event)

    return {
        "status": "verification_requested",
        "correlation_id": event.correlation_id,
        "proof_id": proof_id,
    }


async def get_audit_log(identity: Identity, params: Dict[str, Any]) -> Dict[str, Any]:
    from ..audit.logger import audit_logger

    limit = params.get("limit", 50)
    try:
        entries = audit_logger.query(tenant_id=identity.tenant_id, limit=limit)
        return {"tenant": identity.tenant_id, "count": len(entries), "entries": entries}
    except Exception as e:
        return {"error": f"Audit query failed: {str(e)}"}


async def get_system_health(identity: Identity, params: Dict[str, Any]) -> Dict[str, Any]:
    health = {
        "status": "healthy",
        "components": {
            "event_bus": {"status": "healthy"},
            "read_model": {"status": "healthy"},
            "audit_log": {"status": "healthy"},
        },
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }
    return health


TOOLS = {
    "query_infrastructure": ToolDefinition(
        name="query_infrastructure",
        handler=query_infrastructure,
        capability="infra.read",
        read_only=True,
        tenant_scoped=True,
        category="infrastructure",
        description="Read current tenant infrastructure state",
    ),
    "set_worker_count": ToolDefinition(
        name="set_worker_count",
        handler=set_worker_count,
        capability="infra.write",
        read_only=False,
        tenant_scoped=True,
        requires_approval=False,
        category="infrastructure",
        description="Request change to worker pool size",
    ),
    "set_regulator_mode": ToolDefinition(
        name="set_regulator_mode",
        handler=set_regulator_mode,
        capability="governance.write",
        read_only=False,
        tenant_scoped=True,
        requires_approval=True,
        category="governance",
        description="Request circuit breaker regulator mode change",
    ),
    "update_gate": ToolDefinition(
        name="update_gate",
        handler=update_gate,
        capability="proofbridge.write",
        read_only=False,
        tenant_scoped=True,
        requires_approval=True,
        category="proofbridge",
        description="Request compliance gate status update",
    ),
    "verify_proof": ToolDefinition(
        name="verify_proof",
        handler=verify_proof,
        capability="proofbridge.read",
        read_only=True,
        tenant_scoped=True,
        requires_approval=False,
        category="proofbridge",
        description="Verify a ZK proof or credential",
    ),
    "get_audit_log": ToolDefinition(
        name="get_audit_log",
        handler=get_audit_log,
        capability="audit.read",
        read_only=True,
        tenant_scoped=True,
        requires_approval=False,
        category="audit",
        description="Get audit log entries for tenant",
    ),
    "get_system_health": ToolDefinition(
        name="get_system_health",
        handler=get_system_health,
        capability="system.health",
        read_only=True,
        tenant_scoped=False,
        requires_approval=False,
        category="system",
        description="Get overall system health status",
    ),
}

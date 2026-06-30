import asyncio
import json
import logging
from contextlib import asynccontextmanager
from datetime import datetime, timezone
from typing import Optional

from fastapi import FastAPI, Depends, HTTPException, Header, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel

from .core.identity import Identity, Channel, Tenant
from .core.policy import PolicyEngine
from .core.events import EventBus, event_bus, publish_event
from .core.tools import TOOLS
from .audit.logger import audit_logger
from .audit.models import AuditSeverity
from .projections.read_model import read_model
from .controllers.worker_controller import WorkerController
from .controllers.governance_controller import GovernanceController
from .controllers.proofbridge_controller import ProofBridgeController
from .bridge.openclaw_adapter import OpenClawAdapter

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(name)s: %(message)s")
logger = logging.getLogger("vvu-gateway")

policy_engine = PolicyEngine()
worker_controller = WorkerController()
governance_controller = GovernanceController()
proofbridge_controller = ProofBridgeController()
openclaw_adapter = OpenClawAdapter()

DEFAULT_TENANT = "ubuntu-group"


class ConverseRequest(BaseModel):
    message: str
    threadId: Optional[str] = None
    to: Optional[str] = None
    model: Optional[str] = None
    temperature: Optional[float] = None
    maxTokens: Optional[int] = None


class ConverseResponse(BaseModel):
    ok: bool
    threadId: str
    content: str
    model: str
    usage: Optional[dict] = None


class GateUpdateRequest(BaseModel):
    action: Optional[str] = None
    gate: Optional[str] = None
    status: Optional[str] = None


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("VVU Control Plane starting up...")
    await event_bus.connect()
    await openclaw_adapter.initialize()

    seed_state = await read_model.get_tenant_state(DEFAULT_TENANT)
    if not seed_state:
        from .core.events import Event
        seed_event = Event(
            event_type="system.seeded",
            tenant_id=DEFAULT_TENANT,
            actor="system",
            metadata={"seed": True},
        )
        await publish_event(seed_event)
        await read_model.handle_event(seed_event.to_dict())
        logger.info(f"Seeded default tenant state for {DEFAULT_TENANT}")

    asyncio.create_task(worker_controller.run())
    asyncio.create_task(governance_controller.run())
    asyncio.create_task(proofbridge_controller.run())
    yield
    logger.info("VVU Control Plane shutting down...")
    await worker_controller.stop()
    await governance_controller.stop()
    await proofbridge_controller.stop()
    await event_bus.close()


app = FastAPI(
    title="VVU Gateway Control Plane",
    version="2.2.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


async def verify_internal_request(x_internal_request: Optional[str] = Header(None)):
    if x_internal_request != "true":
        raise HTTPException(status_code=403, detail="Internal requests only")


@app.get("/health")
async def health():
    return {"status": "ok", "timestamp": datetime.now(timezone.utc).isoformat(), "version": "2.2.0"}


@app.get("/api/v1/status")
async def system_status():
    states = await read_model.get_all_tenant_states()
    return {
        "tenants": states,
        "event_count": len(event_bus.get_recent_events()),
        "circuit_breaker": {t: governance_controller.is_circuit_open(t) for t in ["ubuntu-group", "safe-krypte", "safe-grid"]},
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }


@app.post("/api/v1/tools/{tool_name}")
async def execute_tool(tool_name: str, request: Request, x_internal_request: str = Depends(verify_internal_request)):
    if tool_name not in TOOLS:
        raise HTTPException(status_code=404, detail=f"Tool '{tool_name}' not found")

    body = await request.json()
    identity = Identity(
        subject=body.get("actor", "system"),
        tenant_id=body.get("tenant_id", DEFAULT_TENANT),
        roles=set(body.get("roles", ["admin"])),
        channel=Channel.REST,
        session_id=body.get("correlation_id"),
    )

    tool_def = TOOLS[tool_name]

    if not policy_engine.evaluate(identity, tool_def.capability):
        raise HTTPException(status_code=403, detail=f"Unauthorized: missing capability {tool_def.capability}")

    result = await tool_def.handler(identity, body.get("params", {}))
    return {"ok": True, "tool": tool_name, "result": result, "correlation_id": identity.session_id}


@app.post("/api/v1/agent/converse")
async def agent_converse(req: ConverseRequest, x_internal_request: str = Depends(verify_internal_request)):
    thread_id = req.threadId or f"thread_{int(datetime.now().timestamp() * 1000)}"

    response = (
        f"VVU Gateway OS · Control Plane Agent\n"
        f"Thread: {thread_id}\n\n"
        f"Message received: {req.message}\n\n"
        f"System Status:\n"
        f"- Event Bus: nominal\n"
        f"- Audit Chain: nominal\n"
        f"- Circuit Breaker: closed\n\n"
        f"This is the local control plane agent. "
        f"For AI-powered responses, ensure MISTRAL_API_KEY is configured in the Next.js route."
    )

    return ConverseResponse(
        ok=True,
        threadId=thread_id,
        content=response,
        model="vvu-control-plane-2.2.0",
        usage={"prompt_tokens": len(req.message), "completion_tokens": len(response), "total_tokens": len(req.message) + len(response)},
    )


@app.get("/api/v1/admin/gates")
async def get_gates():
    states = await read_model.get_all_tenant_states()
    gates = []
    for tenant_id, state in states.items():
        for gate_name, gate_info in state.get("gates", {}).items():
            gates.append({
                "id": gate_name[:1].upper(),
                "label": gate_name,
                "status": gate_info.get("status", "UNKNOWN"),
                "statusLabel": gate_info.get("status", "UNKNOWN"),
                "tenant": tenant_id,
                "ts": datetime.now(timezone.utc).isoformat(),
            })
    return gates


@app.post("/api/v1/admin/circuit-breaker")
async def circuit_breaker_action(req: GateUpdateRequest):
    if req.action not in ("close", "open"):
        raise HTTPException(status_code=400, detail="Action must be 'close' or 'open'")

    tenant = DEFAULT_TENANT

    if req.action == "open":
        await governance_controller.trip_circuit_breaker(tenant, reason="manual API request")
    else:
        await governance_controller.reset_circuit_breaker(tenant, reason="manual API request")

    return {"ok": True, "action": req.action, "message": f"Circuit {req.action} acknowledged", "ts": int(datetime.now().timestamp() * 1000)}


@app.get("/api/v1/audit")
async def get_audit(limit: int = 50, tenant_id: Optional[str] = None):
    entries = audit_logger.query(tenant_id=tenant_id or DEFAULT_TENANT, limit=limit)
    return {"entries": entries, "count": len(entries)}


@app.get("/api/v1/audit/verify")
async def verify_audit_chain():
    valid = audit_logger.verify_chain()
    return {"valid": valid}


@app.post("/api/v1/events/publish")
async def publish_custom_event(request: Request, x_internal_request: str = Depends(verify_internal_request)):
    body = await request.json()
    from .core.events import Event
    event = Event(
        event_type=body.get("event_type", "custom.event"),
        tenant_id=body.get("tenant_id", DEFAULT_TENANT),
        actor=body.get("actor", "system"),
        metadata=body.get("metadata", {}),
    )
    msg_id = await publish_event(event)
    return {"ok": True, "message_id": msg_id}


@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error(f"Unhandled exception: {exc}", exc_info=True)
    return JSONResponse(status_code=500, content={"error": "Internal server error", "detail": str(exc)})


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("src.gateway.main:app", host="0.0.0.0", port=8080, reload=True)

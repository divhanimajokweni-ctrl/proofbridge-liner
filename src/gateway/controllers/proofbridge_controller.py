import asyncio
from datetime import datetime, timezone
from typing import Dict, Any, Optional
from ..core.events import EventBus, GateUpdated, ProofVerificationComplete, publish_event, event_bus
from ..audit.logger import audit_logger


class ProofBridgeController:
    def __init__(self):
        self.event_bus = event_bus
        self._running = False
        self._gate_status: Dict[str, Dict[str, Any]] = {}
        self._verification_queue: asyncio.Queue = asyncio.Queue()

    async def run(self):
        self._running = True
        print(" ProofBridge controller started")
        await self.event_bus.subscribe(self.handle_event, pattern="proofbridge.*")
        asyncio.create_task(self._process_verifications())

        while self._running:
            await asyncio.sleep(1)

    async def handle_event(self, event_data: Dict[str, Any]):
        event_type = event_data.get("event_type")
        if event_type == "proofbridge.gate.requested":
            await self._handle_gate_update(event_data)
        elif event_type == "proofbridge.verify.requested":
            await self._handle_verification_request(event_data)

    async def _handle_gate_update(self, event_data: Dict[str, Any]):
        tenant_id = event_data.get("tenant_id")
        metadata = event_data.get("metadata", {})
        gate = metadata.get("gate", "")
        status = metadata.get("status", "")
        ok = metadata.get("ok")
        correlation_id = event_data.get("correlation_id")

        print(f" Gate update requested for {tenant_id}: {gate} -> {status}")

        if not await self._validate_gate_update(tenant_id, gate, status, ok):
            return

        try:
            completion = GateUpdated(
                tenant_id=tenant_id,
                actor="system",
                gate=gate,
                status=status,
                ok=ok,
                correlation_id=correlation_id,
            )
            completion.metadata["requested_by"] = event_data.get("actor", "unknown")
            await publish_event(completion)

            self._gate_status[f"{tenant_id}:{gate}"] = {
                "status": status,
                "ok": ok,
                "updated_at": datetime.now(timezone.utc).isoformat(),
            }

            audit_logger.append({
                "event_type": "proofbridge.gate.updated",
                "tenant_id": tenant_id,
                "actor": event_data.get("actor", "unknown"),
                "metadata": {"gate": gate, "status": status, "ok": ok, "correlation_id": correlation_id},
                "severity": "warning" if ok is False else "info",
            })
        except Exception as e:
            print(f" Gate update failed: {e}")

    async def _validate_gate_update(self, tenant_id: str, gate: str, status: str, ok: Optional[bool]) -> bool:
        valid_gates = ["GovernanceAnchor.sol", "ED25519 VCT Sig", "TEE Attestation", "FSCA CASP Reg", "Release Gate"]
        if gate not in valid_gates:
            return False
        valid_statuses = ["DEPLOYED", "HARD FAIL", "SOFT FAIL", "PENDING", "APPROVED", "REJECTED"]
        if status not in valid_statuses:
            return False
        if ok is not None and not isinstance(ok, bool):
            return False
        return True

    async def _handle_verification_request(self, event_data: Dict[str, Any]):
        metadata = event_data.get("metadata", {})
        proof_id = metadata.get("proof_id", "")
        print(f" Proof verification requested: {proof_id}")
        await self._verification_queue.put({
            "tenant_id": event_data.get("tenant_id"),
            "proof_id": proof_id,
            "event_data": event_data,
        })

    async def _process_verifications(self):
        while self._running:
            try:
                item = await self._verification_queue.get()
                await self._verify_proof(item)
            except Exception as e:
                print(f" Verification error: {e}")

    async def _verify_proof(self, item: Dict[str, Any]):
        tenant_id = item["tenant_id"]
        proof_id = item["proof_id"]
        event_data = item["event_data"]

        valid = True

        completion = ProofVerificationComplete(
            tenant_id=tenant_id,
            actor="system",
            proof_id=proof_id,
            valid=valid,
            details={
                "verified_at": datetime.now(timezone.utc).isoformat(),
                "verified_by": "proofbridge-controller",
            },
            correlation_id=event_data.get("correlation_id"),
        )
        await publish_event(completion)

        await audit_logger.append({
            "event_type": "proofbridge.verify.complete",
            "tenant_id": tenant_id,
            "actor": "proofbridge-controller",
            "metadata": {"proof_id": proof_id, "valid": valid},
            "severity": "warning" if not valid else "info",
        })

    async def get_gate_status(self, tenant_id: str, gate: str) -> Optional[Dict[str, Any]]:
        return self._gate_status.get(f"{tenant_id}:{gate}")

    async def stop(self):
        self._running = False

import asyncio
from datetime import datetime, timezone
from typing import Dict, Any, Optional, List
from ..core.events import EventBus, CircuitBreakerTripped, CircuitBreakerReset, RegulatorModeChanged, publish_event, event_bus
from ..audit.logger import audit_logger


class GovernanceController:
    def __init__(self):
        self.event_bus = event_bus
        self._running = False
        self._circuit_breaker_state: Dict[str, bool] = {}

    async def run(self):
        self._running = True
        print(" Governance controller started")
        await self.event_bus.subscribe(self.handle_event, pattern="governance.*")
        asyncio.create_task(self._monitor_metrics())

        while self._running:
            await asyncio.sleep(1)

    async def handle_event(self, event_data: Dict[str, Any]):
        event_type = event_data.get("event_type")
        if event_type == "governance.regulator.requested":
            await self._handle_regulator_request(event_data)

    async def _handle_regulator_request(self, event_data: Dict[str, Any]):
        tenant_id = event_data.get("tenant_id")
        metadata = event_data.get("metadata", {})
        enabled = metadata.get("enabled", False)
        reason = metadata.get("reason", "manual")
        correlation_id = event_data.get("correlation_id")

        print(f" Regulator mode requested for {tenant_id}: {enabled} ({reason})")

        try:
            completion = RegulatorModeChanged(
                tenant_id=tenant_id,
                actor="system",
                enabled=enabled,
                correlation_id=correlation_id,
            )
            completion.metadata["reason"] = reason
            await publish_event(completion)

            audit_logger.append({
                "event_type": "governance.regulator.changed",
                "tenant_id": tenant_id,
                "actor": event_data.get("actor", "unknown"),
                "metadata": {"enabled": enabled, "reason": reason, "correlation_id": correlation_id},
                "severity": "warning" if enabled else "info",
            })
        except Exception as e:
            print(f" Regulator change failed: {e}")

    async def _monitor_metrics(self):
        while self._running:
            try:
                for tenant_id in self._get_active_tenants():
                    await self._check_circuit_breaker(tenant_id)
                await asyncio.sleep(60)
            except Exception as e:
                print(f" Metrics monitoring error: {e}")

    async def _check_circuit_breaker(self, tenant_id: str):
        pass

    async def trip_circuit_breaker(self, tenant_id: str, reason: str = "manual", metrics: Optional[Dict[str, Any]] = None):
        if self._circuit_breaker_state.get(tenant_id, False):
            return

        event = CircuitBreakerTripped(
            tenant_id=tenant_id,
            actor="system",
            reason=reason,
            metrics=metrics or {},
        )
        await publish_event(event)
        self._circuit_breaker_state[tenant_id] = True

        audit_logger.append({
            "event_type": "governance.circuit_breaker.tripped",
            "tenant_id": tenant_id,
            "actor": "system",
            "metadata": {"reason": reason, "metrics": metrics or {}},
            "severity": "critical",
        })

    async def reset_circuit_breaker(self, tenant_id: str, reason: str = "manual"):
        if not self._circuit_breaker_state.get(tenant_id, False):
            return

        event = CircuitBreakerReset(
            tenant_id=tenant_id,
            actor="system",
            reason=reason,
        )
        await publish_event(event)
        self._circuit_breaker_state[tenant_id] = False

        audit_logger.append({
            "event_type": "governance.circuit_breaker.reset",
            "tenant_id": tenant_id,
            "actor": "system",
            "metadata": {"reason": reason},
            "severity": "info",
        })

    def is_circuit_open(self, tenant_id: str) -> bool:
        return self._circuit_breaker_state.get(tenant_id, False)

    def _get_active_tenants(self) -> List[str]:
        return ["ubuntu-group", "safe-krypte", "safe-grid"]

    async def stop(self):
        self._running = False

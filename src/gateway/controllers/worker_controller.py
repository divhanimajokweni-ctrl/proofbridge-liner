import asyncio
from typing import Dict, Any
from ..core.events import EventBus, WorkerCountChanged, WorkerScalingFailed, publish_event, event_bus
from ..audit.logger import audit_logger


class WorkerController:
    def __init__(self):
        self.event_bus = event_bus
        self._running = False

    async def run(self):
        self._running = True
        print(" Worker controller started")
        await self.event_bus.subscribe(self.handle_event, pattern="worker.*")

        while self._running:
            await asyncio.sleep(1)

    async def handle_event(self, event_data: Dict[str, Any]):
        event_type = event_data.get("event_type")
        if event_type == "worker.count.requested":
            await self._handle_scaling_request(event_data)

    async def _handle_scaling_request(self, event_data: Dict[str, Any]):
        tenant_id = event_data.get("tenant_id")
        metadata = event_data.get("metadata", {})
        count = metadata.get("count", 8)
        correlation_id = event_data.get("correlation_id")

        print(f" Scaling workers for {tenant_id} to {count}")

        try:
            current = 8

            completion = WorkerCountChanged(
                tenant_id=tenant_id,
                actor="system",
                old_count=current,
                new_count=count,
                correlation_id=correlation_id,
            )
            completion.metadata["scaling_source"] = event_data.get("actor", "unknown")
            await publish_event(completion)

            audit_logger.append({
                "event_type": "worker.scaling.complete",
                "tenant_id": tenant_id,
                "actor": "worker-controller",
                "metadata": {"old_count": current, "new_count": count, "correlation_id": correlation_id},
            })
        except Exception as e:
            failure = WorkerScalingFailed(
                tenant_id=tenant_id,
                actor="system",
                requested_count=count,
                error=str(e),
                correlation_id=correlation_id,
            )
            await publish_event(failure)

    async def stop(self):
        self._running = False

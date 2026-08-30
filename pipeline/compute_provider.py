#!/usr/bin/env python3
"""
compute_provider.py — Provider Abstraction Layer (HBK MK-II)

Isolates cloud compute integration from the rest of the pipeline.
The pipeline orchestration logic stays the same — only the compute
backend changes when moving from local to AMD Cloud.

Usage:
    # Local (default)
    COMPUTE_PROVIDER=local python run_pipeline.py --mode test

    # AMD Cloud (future)
    COMPUTE_PROVIDER=amd_cloud python run_pipeline.py --mode full

Environment variables are read from the environment, NOT from source control.
Production cloud execution should use the selected provider's secret-management
mechanism, not .env files.
"""

import os
from typing import Dict, Any, Optional, Protocol


class ComputeProvider(Protocol):
    """Interface for compute backends."""

    @property
    def name(self) -> str:
        """Human-readable provider name."""
        ...

    @property
    def is_available(self) -> bool:
        """Whether this provider is currently reachable."""
        ...

    def submit_job(self, config: Dict[str, Any], job_type: str) -> str:
        """Submit a job and return a job ID."""
        ...

    def get_job_status(self, job_id: str) -> Dict[str, Any]:
        """Get the current status of a submitted job."""
        ...

    def get_job_result(self, job_id: str) -> Optional[Dict[str, Any]]:
        """Get the result of a completed job, or None if not done."""
        ...

    def cancel_job(self, job_id: str) -> bool:
        """Attempt to cancel a running job. Returns True if successful."""
        ...


class LocalProvider:
    """Local compute — runs everything on the current machine."""

    @property
    def name(self) -> str:
        return "Local (CPU/GPU)"

    @property
    def is_available(self) -> bool:
        return True

    def submit_job(self, config: Dict[str, Any], job_type: str) -> str:
        # Local runs synchronously — no job queue
        return "local-sync"

    def get_job_status(self, job_id: str) -> Dict[str, Any]:
        return {"status": "completed", "provider": "local"}

    def get_job_result(self, job_id: str) -> Optional[Dict[str, Any]]:
        return {"status": "completed", "provider": "local"}

    def cancel_job(self, job_id: str) -> bool:
        return False  # Local jobs can't be cancelled mid-run


class AMDCloudProvider:
    """
    AMD Cloud compute — future integration point.

    Credentials are read from environment variables only:
        BLUE_OCEAN_API_KEY
        BLUE_OCEAN_ENDPOINT

    Do NOT hardcode these. Do NOT commit .env files.
    Production cloud execution should use the selected provider's
    secret-management mechanism.
    """

    def __init__(self):
        self.api_key = os.getenv("BLUE_OCEAN_API_KEY")
        self.endpoint = os.getenv("BLUE_OCEAN_ENDPOINT")

    @property
    def name(self) -> str:
        return "AMD Cloud (Blue Ocean)"

    @property
    def is_available(self) -> bool:
        """Available only if credentials are configured."""
        return bool(self.api_key and self.endpoint)

    def submit_job(self, config: Dict[str, Any], job_type: str) -> str:
        if not self.is_available:
            raise RuntimeError(
                "AMD Cloud credentials not configured. "
                "Set BLUE_OCEAN_API_KEY and BLUE_OCEAN_ENDPOINT environment variables."
            )
        # TODO: Implement actual AMD Cloud job submission
        # This is the integration point for Phase 3 of the migration plan
        raise NotImplementedError(
            "AMD Cloud job submission not yet implemented. "
            "See compute_provider.py for the integration contract."
        )

    def get_job_status(self, job_id: str) -> Dict[str, Any]:
        # TODO: Implement actual status polling
        raise NotImplementedError("AMD Cloud status polling not yet implemented.")

    def get_job_result(self, job_id: str) -> Optional[Dict[str, Any]]:
        # TODO: Implement actual result retrieval
        raise NotImplementedError("AMD Cloud result retrieval not yet implemented.")

    def cancel_job(self, job_id: str) -> bool:
        # TODO: Implement actual job cancellation
        raise NotImplementedError("AMD Cloud job cancellation not yet implemented.")


def get_provider() -> ComputeProvider:
    """
    Factory: returns the configured compute provider.

    Controlled by the COMPUTE_PROVIDER environment variable:
        - "local" (default): runs on the current machine
        - "amd_cloud": routes to AMD Cloud (requires credentials)

    Falls back to local if the provider is unavailable.
    """
    provider_name = os.getenv("COMPUTE_PROVIDER", "local").lower()

    if provider_name == "amd_cloud":
        provider = AMDCloudProvider()
        if provider.is_available:
            return provider
        print(
            "⚠️  COMPUTE_PROVIDER=amd_cloud but credentials not configured. "
            "Falling back to local.",
        )

    return LocalProvider()


# ---------------------------------------------------------------------------
# Self-test
# ---------------------------------------------------------------------------

if __name__ == "__main__":
    provider = get_provider()
    print(f"Compute Provider: {provider.name}")
    print(f"Available: {provider.is_available}")

"""Start a worker that registers all example workflows."""
# ruff: noqa: E402

import asyncio
import os

from dotenv import load_dotenv

load_dotenv(override=True)

import mistralai.workflows as workflows

from examples.cargo_release import (
    CargoReleaseWorkflow,
    DangerousGoodsValidationWorkflow,
)
from examples.code_modernization import CodeModernizationWorkflow, ModernizeFileWorkflow
from examples.insurance_claims import InsuranceClaimsTriageWorkflow

EXAMPLE_WORKFLOWS = [
    InsuranceClaimsTriageWorkflow,
    CargoReleaseWorkflow,
    DangerousGoodsValidationWorkflow,
    CodeModernizationWorkflow,
    ModernizeFileWorkflow,
]

if os.getenv("INCLUDE_LINEAR"):
    from examples.linear_summarization import LinearWeeklySummaryWorkflow
    EXAMPLE_WORKFLOWS.append(LinearWeeklySummaryWorkflow)


async def main() -> None:
    names = [wf.__name__ for wf in EXAMPLE_WORKFLOWS]
    print(
        f"Starting worker with {len(EXAMPLE_WORKFLOWS)} example(s): {', '.join(names)}"
    )
    await workflows.run_worker(EXAMPLE_WORKFLOWS)


if __name__ == "__main__":
    asyncio.run(main())

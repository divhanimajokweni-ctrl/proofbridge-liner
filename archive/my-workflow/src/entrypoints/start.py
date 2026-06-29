"""Trigger a workflow execution from the command line."""
# ruff: noqa: E402

import argparse
import asyncio
import json
import os

from dotenv import load_dotenv

load_dotenv(override=True)

from mistralai.extra.workflows import WorkflowEncodingConfig, configure_workflow_encoding
from mistralai.workflows.client import get_mistral_client


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Trigger a workflow execution.",
    )
    parser.add_argument(
        "--workflow",
        default="hello-world",
        help="Name of the workflow to execute (e.g. hello-world)",
    )
    parser.add_argument(
        "--input",
        default=r"{}",
        help=r'Input data as a JSON string (e.g. \'{"name": "World"}\')',
    )
    return parser.parse_args()


async def main() -> None:
    args = parse_args()
    workflow_name = args.workflow

    try:
        raw_input = json.loads(args.input)
    except json.JSONDecodeError as exc:
        raise SystemExit(
            f"Error: invalid JSON for --input: {exc.args[0]}\n"
            f"  Received: {args.input!r}\n"
            f'  Example:  --input \'{{"name": "World"}}\''
        ) from exc

    raw_input = raw_input or {}
    if not isinstance(raw_input, dict):
        raise SystemExit(
            f"Error: --input must be a JSON object, got {type(raw_input).__name__}"
        )

    api_key = os.environ.get("MISTRAL_API_KEY", "")
    if not api_key:
        print("Error: MISTRAL_API_KEY is not set. Check your .env file.")
        raise SystemExit(1)

    client = get_mistral_client(
        api_key=api_key,
        server_url=os.environ.get("SERVER_URL", "https://api.mistral.ai"),
    )

    # Enable client-side payload encoding so the Workflows API receives
    # pre-encoded payloads and does not apply its own server-side encryption.
    await configure_workflow_encoding(WorkflowEncodingConfig(), client=client)

    result = await client.workflows.execute_workflow_and_wait_async(
        workflow_identifier=workflow_name,
        input=raw_input,
        deployment_name=os.environ.get("DEPLOYMENT_NAME", "default"),
    )
    print(f"Result: {result}")


if __name__ == "__main__":
    asyncio.run(main())

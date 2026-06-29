"""Minimal example workflow — edit this file or create new ones."""

from pydantic import BaseModel

import mistralai.workflows as workflows


class HelloInput(BaseModel):
    name: str = "World"


@workflows.activity()
async def greet(name: str) -> str:
    """A simple activity that returns a greeting."""
    return f"Hello, {name}! Welcome to Mistral Workflows."


@workflows.workflow.define(
    name="hello-world",
    workflow_display_name="Hello World",
    workflow_description="A minimal hello-world workflow.",
)
class HelloWorkflow:
    @workflows.workflow.entrypoint
    async def run(self, input: HelloInput) -> str:
        return await greet(input.name)

# my-workflow

A [Mistral Workflows](https://docs.mistral.ai/workflows/getting-started/introduction) project.

## Setup

```bash
uv sync
```

## Commands

### Register workflows in AI Studio

Auto-discovers all workflow classes in `src/workflows/`, registers them with AI Studio, and starts polling for executions. The [deployment name](https://docs.mistral.ai/workflows/managing-workflows-in-production/deployments) is set to your hostname:

```bash
make start-worker
```

### Execute a workflow

In a separate terminal, trigger a workflow execution by name:

```bash
make execute workflow=hello-world input='{"name": "World"}'
```

## Examples

The `src/examples/` directory contains complete workflow cookbooks that demonstrate advanced patterns. They are **not** loaded by the default `make start-worker`.

| Example | Description |
|---|---|
| [Insurance Claims Triage](src/examples/insurance_claims/) | Parallel vision analysis, retry policies, deterministic branching, structured LLM output |
| [Cargo Release Compliance](src/examples/cargo_release/) | HITL `wait_for_input()`, child sub-workflows, retry policies, structured LLM output |
| [Code Modernization](src/examples/code_modernization/) | Sub-workflow fan-out, sandboxed validation, retry-loop, HITL approval |
| [Linear Summarization](src/examples/linear_summarization/) | Connectors, retry policies, human-in-the-loop, structured LLM output |

### Start the examples worker

```bash
make start-examples
```

Then trigger an execution in a separate terminal:

```bash
make execute-insurance-claims input='{"claim_id":"CLM-001","claimant_name":"Jane","description":"My car was hit.","photos":["src/examples/insurance_claims/sample_data/photos/claim_low_scratch_door.jpg"]}'
```

## Project layout

```
src/
├── entrypoints/ # Runnable modules, invoked via `python -m entrypoints.<module>`
│   ├── worker.py   # `python -m entrypoints.worker` — discover and run workflows
│   ├── start.py    # `python -m entrypoints.start`  — trigger a workflow execution
│   └── dev.py      # `python -m entrypoints.dev`    — worker with file-watch auto-reload
├── workflows/   # Your workflow classes (auto-discovered by `entrypoints.worker`)
└── examples/    # Example workflow cookbooks (opt-in via `examples.worker`)
```

## Development

```bash
# Format
uv run ruff format .

# Lint
uv run ruff check --fix .
```

.PHONY: start-worker execute installdeps start-examples execute-insurance-claims execute-cargo-release execute-code-modernization

## Install dependencies
installdeps:
	uv sync

## Auto-discover all workflows and start the worker (with file-watch auto-reload)
start-worker:
	uv run python -m entrypoints.dev

## Trigger a workflow execution
## Usage: make execute workflow=hello-world input='{"name": "World"}'
execute:
	uv run python -m entrypoints.start $(if $(workflow),--workflow $(workflow),) $(if $(input),--input '$(input)',)

## Start a worker that loads only the example workflows
start-examples:
	uv run python -m examples.worker

## Start a worker that loads all example workflows, including linear-weekly-summary
## Requires the Linear connector to be enabled and configured in AI Studio
start-examples-all:
	INCLUDE_LINEAR=1 uv run python -m examples.worker

## Execute the insurance-claims-triage example workflow
## Usage: make execute-insurance-claims input='{"claim_id": "CLM-001", "claimant_name": "Jane", "description": "My car was hit.", "photos": ["src/examples/insurance_claims/sample_data/photos/claim_low_scratch_door.jpg"]}'
execute-insurance-claims:
	uv run python -m entrypoints.start --workflow insurance-claims-triage $(if $(input),--input '$(input)',--input '{"claim_id":"CLM-2024-001","claimant_name":"Maria Gonzalez","description":"My car was T-boned at an intersection.","photos":["src/examples/insurance_claims/sample_data/photos/claim_high_totaled_front.jpg","src/examples/insurance_claims/sample_data/photos/claim_high_totaled_side.jpg"]}')

## Execute the cargo-release-compliance example workflow
## Usage: make execute-cargo-release input='{"document_uri": "...", "shipment_id": "..."}'
execute-cargo-release:
	uv run python -m entrypoints.start --workflow cargo-release-compliance $(if $(input),--input '$(input)',--input '{"document_uri":"src/examples/cargo_release/sample_data/shipping_doc_normal.png","shipment_id":"BL-2024-HAM-009371"}')

## Execute the code-modernization example workflow
## Usage: make execute-code-modernization input='{"repo_path": "...", "target": "Python 2.7 → 3.12"}'
execute-code-modernization:
	uv run python -m entrypoints.start --workflow code-modernization $(if $(input),--input '$(input)',--input '{"repo_path":"src/examples/code_modernization/sample_data/legacy_repo","target":"Python 2.7 → 3.12"}')

## Execute the linear-weekly-summary example workflow
## Usage (team name): make execute-linear-summary input='{"team":"Engineering","project":"Roadmap"}'
## Usage (team ID): make execute-linear-summary input='{"team":"<team-uuid>","project":"Roadmap"}'
## Usage (all projects): make execute-linear-summary input='{"team":"Engineering","project":"*"}'
## Params: team/project are optional; omit input for interactive selection.
execute-linear-summary:
	uv run python -m entrypoints.start --workflow linear-weekly-summary $(if $(input),--input '$(input)',--input '{}')

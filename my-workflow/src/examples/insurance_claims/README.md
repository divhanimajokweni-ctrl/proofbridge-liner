# Insurance Claims Triage with Vision

## Use case

Insurance claims triage is manual, slow, and high-stakes. This workflow automates the full triage pipeline in seconds: it analyses claim photos in parallel using Mistral Small's vision capabilities, cross-references findings against the claimant's description, applies a deterministic severity classification, scores fraud risk, and produces a structured triage report with cited evidence.

## Workflows primitives demonstrated

| Primitive | How it's used |
|---|---|
| Parallel activities | All claim photos analysed concurrently via `execute_activities_in_parallel` |
| Retry policies | Vision activity retries up to 3x with 2x backoff |
| Deterministic branching | Severity classification is a hard Python `if/elif/else`, not an LLM call |
| Structured output | Every LLM call uses `chat_parse_to_model` with a Pydantic model |
| Timeline observability | AI Studio shows each parallel photo task, retry counts, and branch taken |

> **Model**: All LLM calls (including vision) use `mistral-small-latest`.

## How to run

### 1. Start the examples worker

```bash
make start-examples
```

### 2. Trigger an execution (separate terminal)

```bash
make execute-insurance-claims
```

This uses a prefilled sample input. To provide your own:

```bash
make execute-insurance-claims \
  input='{"claim_id":"CLM-2024-042","claimant_name":"Jane Doe","description":"Rear-ended at a red light.","photos":["file://path/to/photo.jpg"]}'
```

### Run the workflow in AI Studio

1. Start the examples worker: `make start-examples`
2. Navigate to Workflows in the Mistral Console.
3. Select `insurance-claims-triage`.
4. Click **Start Workflow** and paste one of the fixtures from `sample_data/`.

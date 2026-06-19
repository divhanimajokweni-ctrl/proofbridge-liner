# Cargo Release & Dangerous Goods Compliance

## Use case

A major shipping line processes thousands of cargo release requests every day.
Each release requires OCR extraction of the shipping document, classification of
the cargo type, dangerous-goods compliance checks when applicable, and validation
against customs rules across multiple jurisdictions. A single missed step can mean
a compliance breach, detained cargo, or a safety incident at port.

This workflow automates the full pipeline. When the system detects an anomaly --
a missing emergency contact for a UN 1203 shipment, a failed customs rule -- it
pauses and surfaces a structured review card to a compliance officer directly in
Le Chat or AI Studio. The officer approves or blocks the release with a single
click. No polling, no compute cost while waiting.

## Workflows primitives demonstrated

| Primitive | How it's used |
|---|---|
| `wait_for_input()` (HITL) | Suspends the workflow indefinitely until a human reviews and approves or blocks the shipment. Zero compute while waiting. |
| Sub-workflows | `DangerousGoodsValidationWorkflow` runs as a child workflow with its own event timeline and retry surface. |
| Deterministic branching | All `if`/`else` decisions are based on recorded activity results, safe for Temporal replay. |
| Retry policies | OCR activity retries up to 3x; LLM classification activities retry up to 2x. |
| Structured LLM output | Every LLM call uses `mistralai_chat_parse` with a Pydantic model. |

## Architecture

```
CargoReleaseWorkflow
|
+- ocr_extract_shipping_doc()         [activity, retry x3]
|
+- classify_cargo_type()              [activity, retry x2]
|
+- (if dangerous_goods)
|  +- DangerousGoodsValidationWorkflow  [sub-workflow]
|       +- validate_dangerous_goods()   [activity, retry x2]
|
+- validate_customs_compliance()       [activity, retry x2]
|
+- (if anomaly_detected)
|  +- send_assistant_message()        [notify reviewer in Le Chat]
|  +- wait_for_input()               [AcceptDeclineConfirmation]
|       +- APPROVED -> continue
|       +- BLOCKED  -> return CargoReleaseResult(status="blocked")
|
+- generate_release_certificate()      [activity, retry x2]

Final output: CargoReleaseResult(status="released"|"blocked", ...)
```

## How to run

### 1. Start the examples worker

```bash
make start-examples
```

### 2. Trigger an execution (separate terminal)

```bash
make execute-cargo-release
```

This uses a prefilled sample input (normal path, no anomaly). To trigger the anomaly path (will pause at `wait_for_input` in AI Studio):

```bash
make execute-cargo-release \
  input='{"document_uri":"src/examples/cargo_release/sample_data/shipping_doc_anomaly.txt","shipment_id":"BL-2024-RTD-004812"}'
```

### Run the workflow in AI Studio

1. Start the examples worker: `make start-examples`
2. Navigate to [Workflows in the Mistral Console](https://console.mistral.ai/build/workflows).
3. Select `cargo-release-compliance`.
4. Click **Start Workflow** and paste one of the fixtures from `sample_data/`.

## What to look for in AI Studio

Run the anomaly fixture and open the execution timeline:

| Timeline event | What it demonstrates |
|---|---|
| `ocr_extract_shipping_doc` activity | Retry policy -- see attempt counter on transient failure |
| `dangerous-goods-validation` child workflow | Sub-workflow with its own collapsible timeline |
| `validate_customs_compliance` activity | Structured output -- click to see the `ComplianceCheck` JSON |
| `wait_for_input` event | HITL pause -- timeline freezes here, zero compute consumed |
| Resume after approval/block | Timeline continues from the same point, no replay of previous steps |
| `generate_release_certificate` (approved path) | Final activity, only reached after human approval |

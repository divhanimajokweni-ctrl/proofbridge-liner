# Code Modernization Assistant

## Use case

Modernizing a legacy codebase (e.g. Python 2.7 to 3.12) as a single LLM call fails on any real project: one massive prompt is too slow, too expensive, and impossible to review. This workflow shards the work -- one sub-workflow per source file -- so each file is independently modernized, syntax-validated, and retried if the generated code is broken. After all files complete, the workflow pauses for a human reviewer to inspect the aggregate change set and decide whether to open a PR. No AI-generated code reaches production without a human in the loop.

## Workflows primitives demonstrated

| Primitive | How it's used |
|---|---|
| Sub-workflows (parent -> N children) | `workflow.py` spawns one `ModernizeFileWorkflow` per file |
| Parallel sub-workflow execution | `asyncio.gather(*child_tasks)` dispatches all children simultaneously |
| Structured-output LLM | `chat_parse_to_model(ModernizedFile, ...)` validates the LLM response as Pydantic |
| Sandboxed activity | `validate_python_syntax` shells out to a fresh subprocess with an explicit timeout |
| `wait_for_input()` HITL | Parent suspends at zero compute cost; resumes when reviewer clicks Accept/Decline |
| Activity retry policy | `retry_policy_max_attempts=3` on `modernize_file_llm` -- bad syntax retries automatically |

## Architecture

```
Trigger: {"repo_path": "...", "target": "Python 2.7 -> 3.12"}
         |
         v
CodeModernizationWorkflow (parent)
  |
  +- scan_files_to_modernize()          <- activity: walk repo, return list
  |
  +- asyncio.gather(                    <- all children dispatched in parallel
  |    ModernizeFileWorkflow(file_A)    <- child workflow: own history, own retries
  |    ModernizeFileWorkflow(file_B)
  |    ModernizeFileWorkflow(file_C)
  |  )
  |    Each child:
  |      read_file()                    <- activity
  |      modernize_file_llm()           <- activity: LLM -> ModernizedFile (Pydantic)
  |      validate_python_syntax()       <- activity: subprocess compile()
  |      (on SyntaxError -> retry modernize_file_llm up to 3x)
  |
  +- Aggregate -> ChangeSet
  |
  +- wait_for_input(AcceptDeclineConfirmation)   <- DURABLE PAUSE
  |     Reviewer sees change set in AI Studio / Le Chat
  |     Clicks "Open PR" or "Discard"
  |
  +- [approved] write_pr_proposal()     <- activity: writes PR_PROPOSAL.md
  |
  +- Return WorkflowResult{status, change_set, pr_proposal_path}
```

## How to run

### 1. Start the examples worker

```bash
make start-examples
```

### 2. Trigger an execution (separate terminal)

```bash
make execute-code-modernization
```

This uses the bundled `sample_data/legacy_repo` fixture with three Python 2 files. To modernize a different repo:

```bash
make execute-code-modernization \
  input='{"repo_path":"/path/to/your/legacy/repo","target":"Python 2.7 → 3.12"}'
```

### Run the workflow in AI Studio

1. Start the examples worker: `make start-examples`
2. Navigate to [Workflows in the Mistral Console](https://console.mistral.ai/build/workflows).
3. Select `code-modernization`.
4. Click **Start Workflow** with input `{"repo_path": "src/examples/code_modernization/sample_data/legacy_repo", "target": "Python 2.7 → 3.12"}`.

## What to look for in AI Studio

| Timeline event | What it demonstrates |
|---|---|
| Three child executions nested under the parent | Fan-out -- one `ModernizeFileWorkflow` per `.py` file |
| All children start at nearly the same timestamp | Parallel execution via `asyncio.gather` |
| `modernize_file_llm` appearing more than once in a child | Per-file retry loop -- bad syntax triggers a fresh LLM call |
| `wait_for_input` event after children complete | HITL pause -- zero compute consumed until reviewer responds |
| `write_pr_proposal` activity (on approval) | Final step -- in production this would open a real GitHub PR |

## Sample data

Three Python 2 source files in `sample_data/legacy_repo/`:

| File | Python 2-isms demonstrated |
|---|---|
| `utils.py` | `print` statement, `.iteritems()`, `unicode()` casts |
| `api_client.py` | `import urllib2`, `from urlparse import urlparse`, `httplib` |
| `processor.py` | `xrange()`, `raw_input()`, `except E, e:` syntax, `.has_key()` |

# Zoo API Audit

**Audit target:** `amd-rocm-validation`  
**Requirement:** Separate native Zoo APIs from IVE/project wrappers and demonstrate meaningful Zoo API use.

## Result

**REQUIRES VALIDATION — BLOCKING**

No direct Zoo API interaction was identified in the inspected HBK pipeline. The repository contains broad application and websocket-related directories, but the audit did not establish a traceable path from a native Zoo request to CAD geometry, proof obligations, results, evidence, or the committed submission report.

## Component classification

| Component | Native API | Wrapper | Evidence |
|---|---:|---:|---|
| `pipeline/run_pipeline.py` | NO | NO | Imports NumPy, PyTorch, YAML, GitPython, and optional Genesis. No Zoo client, endpoint, token, request, or response is present. |
| `pipeline/generate_submission.py` | NO | NO | Reads local JSON files and writes report/package artifacts. |
| `pipeline/compute_provider.py` | NO | YES | Project abstraction for local and future AMD cloud compute. It is not a Zoo API wrapper. AMD cloud methods raise `NotImplementedError`. |
| KCL CAD execution | REQUIRES VALIDATION | REQUIRES VALIDATION | CAD is absent from the audited primary branch; no captured Engine API execution record is committed in pipeline outputs. |
| Zookeeper/Agent interaction | REQUIRES VALIDATION | REQUIRES VALIDATION | No prompt request, conversation ID, endpoint record, response payload, or generated-file receipt was tied to the release artifacts. |
| File conversion/export | REQUIRES VALIDATION | REQUIRES VALIDATION | No STEP/STL outputs, conversion response, API call ID, or conversion metadata are included in the pipeline outputs. |
| Separate `zoo-makeathon-README.md` examples | NO EVIDENCE OF EXECUTION | YES / PSEUDOCODE | Previously supplied examples use project-style methods such as `load_model`, `set_param`, `analyze`, and `suggest_safety_spec`; these must not be presented as native methods without source implementation. |

## Native API evidence required but not found

- Authentication method actually used.
- Exact native endpoint or SDK method.
- API request identifier.
- Request timestamp.
- Input file or KCL hash.
- Response status.
- Returned CAD/KCL/export hash.
- Link from API evidence to the ledger and release manifest.

## Undocumented assumptions

1. That a Zoo API executed because Zoo-related source or documentation exists.
2. That conceptual wrapper methods correspond to native API methods.
3. That KCL files in a separate workspace prove Engine API execution in the GitHub submission.
4. That a local result pipeline constitutes Agent API use.
5. That deterministic CAD conversion occurred without conversion metadata and output hashes.

## Wrapper boundary

The only inspected, explicit project wrapper is `ComputeProvider`, which abstracts local versus future AMD cloud compute. It correctly labels the AMD cloud implementation as future and unimplemented. It is unrelated to Zoo API compliance.

Any Zoo integration elsewhere in the large repository must be named and linked from the submission README with exact source paths. Without that trace, meaningful Zoo API use remains unproven.

## Conclusion

Zoo API compliance cannot be confirmed from the primary pipeline, outputs, CAD availability, or root README. This is a submission blocker for a Zoo API-focused event.

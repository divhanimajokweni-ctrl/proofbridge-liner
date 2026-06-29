"""Code Modernization Assistant — Workflow #4.

Demonstrates: sub-workflow fan-out (one child per file), structured-output LLM,
sandboxed subprocess validation activity, explicit retry-loop pattern, and
``wait_for_input()`` HITL approval before opening a PR.
"""

from .sub_workflow import ModernizeFileWorkflow
from .workflow import CodeModernizationWorkflow

__all__ = ["CodeModernizationWorkflow", "ModernizeFileWorkflow"]

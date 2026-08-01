"""Observability Suite for ProofBridge Liner

Runtime-only module (excluded from Vercel build via .vercelignore).

This module provides OpenTelemetry (OTel) instrumentation and vendor
integration stubs for ProofBridge Liner operational monitoring.

Supported vendors:
- Langfuse (LLM tracing)
- Phoenix (generative AI observability)
- MLflow (experiment tracking)
- PromptLayer (prompt management)

Environment variables:
- OTLP_ENDPOINT: OTLP gRPC collector endpoint (required)
- ENABLE_LANGFUSE: bool, enable Langfuse forwarder
- ENABLE_PHOENIX: bool, enable Phoenix forwarder
- ENABLE_MLFLOW: bool, enable MLflow forwarder
- ENABLE_PROMPTLAYER: bool, enable PromptLayer forwarder

Usage:
    python scripts/observability.py --help

Notes:
- Do NOT place this file under src/ or any path that Vercel compiles.
- Keep under scripts/ so it remains runtime-only.
- No Python build step is required by the Next.js/Vercel pipeline.
"""

from __future__ import annotations

import argparse
import os
import sys
from typing import Optional


def _bool_env(name: str, default: bool = False) -> bool:
    value = os.getenv(name)
    if value is None:
        return default
    return value.strip().lower() in {"1", "true", "yes", "on"}


def configure_otlp(endpoint: Optional[str] = None) -> dict:
    endpoint = endpoint or os.getenv("OTLP_ENDPOINT")
    if not endpoint:
        raise RuntimeError("OTLP_ENDPOINT is required for telemetry export")
    return {"endpoint": endpoint, "enabled": True}


def configure_langfuse() -> dict:
    return {"enabled": _bool_env("ENABLE_LANGFUSE")}


def configure_phoenix() -> dict:
    return {"enabled": _bool_env("ENABLE_PHOENIX")}


def configure_mlflow() -> dict:
    return {"enabled": _bool_env("ENABLE_MLFLOW")}


def configure_promptlayer() -> dict:
    return {"enabled": _bool_env("ENABLE_PROMPTLAYER")}


def build_config(endpoint: Optional[str] = None) -> dict:
    return {
        "otlp": configure_otlp(endpoint),
        "langfuse": configure_langfuse(),
        "phoenix": configure_phoenix(),
        "mlflow": configure_mlflow(),
        "promptlayer": configure_promptlayer(),
    }


def main(argv: Optional[list[str]] = None) -> int:
    parser = argparse.ArgumentParser(description="ProofBridge Liner observability configurator")
    parser.add_argument("--otlp-endpoint", help="Override OTLP endpoint")
    parser.add_argument("--json", action="store_true", help="Print config as JSON")
    args = parser.parse_args(argv)

    try:
        config = build_config(args.otlp_endpoint)
    except RuntimeError as exc:
        print(str(exc), file=sys.stderr)
        return 2

    if args.json:
        import json
        print(json.dumps(config, indent=2))
    else:
        for key, value in config.items():
            print(f"{key}: {value}")

    return 0


if __name__ == "__main__":
    raise SystemExit(main())

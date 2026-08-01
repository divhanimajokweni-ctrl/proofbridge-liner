#!/usr/bin/env python3
"""
CRAFT — Cross-Modal Retrieval-Augmented Fine-Tuning Ingestion Worker

Watches a directory for .lean files, parses theorems via tree-sitter-lean,
embeds them using sentence-transformers, and upserts to Milvus.

Usage:
    python3 scripts/craft/ingest.py [--watch /path/to/lean/project] [--interval 60]
    python3 scripts/craft/ingest.py --file /path/to/theorem.lean  (single file mode)
"""

import argparse
import hashlib
import logging
import os
import re
import sys
import time
from pathlib import Path
from typing import List, Optional, Tuple

logging.basicConfig(
    level=logging.INFO,
    format="[CRAFT] %(asctime)s %(levelname)s %(message)s",
    datefmt="%H:%M:%S",
)
logger = logging.getLogger("craft-ingest")

# ---------------------------------------------------------------------------
# Configuration
# ---------------------------------------------------------------------------
DEFAULT_MILVUS_HOST = os.environ.get("MILVUS_HOST", "localhost")
DEFAULT_MILVUS_PORT = int(os.environ.get("MILVUS_PORT", "19530"))
DEFAULT_COLLECTION = os.environ.get("COLLECTION_NAME", "craft_theorems")
DEFAULT_WATCH_DIR = os.environ.get("WATCH_DIR", "/workspace")

# Regex to extract theorem/lemma/def names and their bodies
THEOREM_PATTERN = re.compile(
    r"(?:theorem|lemma|def|example)\s+(\w+)\s*(.*?)",
    re.DOTALL,
)


# ---------------------------------------------------------------------------
# Lean 4 Parser (tree-sitter based, with regex fallback)
# ---------------------------------------------------------------------------
def parse_lean_file(filepath: str) -> List[Tuple[str, str, str]]:
    """
    Parse a .lean file and extract (name, code, tags) for each theorem/lemma/def.

    Attempts tree-sitter-lean first; falls back to regex-based extraction.

    Returns list of (theorem_name, lean_code_block, inferred_tags).
    """
    with open(filepath, "r", encoding="utf-8") as f:
        source = f.read()

    results: List[Tuple[str, str, str]] = []

    # Attempt tree-sitter parsing
    try:
        import tree_sitter_lean as tslean
        from tree_sitter import Language, Parser

        lang = Language(tslean.language())
        parser = Parser()
        parser.set_language(lang)
        tree = parser.parse(bytes(source, "utf-8"))
        _ = tree  # reserved for future AST walk
        logger.debug("Parsed %s with tree-sitter-lean", filepath)
    except ImportError:
        logger.debug(
            "tree-sitter-lean not available, using regex fallback for %s", filepath
        )
    except Exception as exc:
        logger.warning("tree-sitter parse failed for %s: %s — falling back", filepath, exc)

    # Regex extraction (works in all modes)
    for match in THEOREM_PATTERN.finditer(source):
        name = match.group(1).strip()
        body = match.group(0).strip()

        # Infer tags based on naming conventions and keywords
        tags = infer_tags(name, body)
        results.append((name, body, tags))

    return results


def infer_tags(name: str, body: str) -> str:
    """Infer compliance/category tags from theorem name and body."""
    tags = set()
    body_lower = body.lower()

    # Proof pattern tags
    if any(kw in name.lower() for kw in ["theorem", "lemma"]):
        tags.add("theorem")
    if any(kw in name.lower() for kw in ["def", "definition"]):
        tags.add("definition")
    if any(kw in name.lower() for kw in ["example"]):
        tags.add("example")

    # Content-based tags
    if re.search(r"\bproof\b", body_lower):
        tags.add("has_proof")
    if re.search(r"\bsafe\b|\bsecurity\b|\bverify\b", body_lower):
        tags.add("compliance")
    if re.search(r"\bcompact\b|\btopology\b|\bmetric\b", body_lower):
        tags.add("topology")
    if re.search(r"\bprime\b|\binfinite\b|\bnumber\b", body_lower):
        tags.add("number_theory")
    if re.search(r"\bgroup\b|\bring\b|\bfield\b|\bmodule\b", body_lower):
        tags.add("algebra")
    if re.search(r"\bprobab\b|\bstatis\b|\bbayes\b", body_lower):
        tags.add("probability")

    return ",".join(sorted(tags)) if tags else "uncategorised"


# ---------------------------------------------------------------------------
# Embedding Generation (sentence-transformers)
# ---------------------------------------------------------------------------
class Embedder:
    """Manages the sentence-transformers model for theorem embedding."""

    def __init__(self, model_name: str = "all-mpnet-base-v2"):
        self.model_name = model_name
        self._model = None

    def _lazy_load(self):
        if self._model is None:
            from sentence_transformers import SentenceTransformer

            logger.info("Loading embedding model: %s", self.model_name)
            self._model = SentenceTransformer(self.model_name)
            logger.info("Embedding model loaded (dim=%s)", self._model.get_sentence_embedding_dimension())

    def embed(self, texts: List[str]) -> List[List[float]]:
        if not texts:
            return []
        self._lazy_load()
        embeddings = self._model.encode(texts, normalize_embeddings=True, show_progress_bar=False)
        return embeddings.tolist()


# ---------------------------------------------------------------------------
# Milvus Upsert
# ---------------------------------------------------------------------------
def upsert_to_milvus(
    records: List[dict],
    host: str = DEFAULT_MILVUS_HOST,
    port: int = DEFAULT_MILVUS_PORT,
    collection_name: str = DEFAULT_COLLECTION,
) -> int:
    """Upsert a batch of theorem records to Milvus. Returns count inserted."""
    try:
        from pymilvus import Collection, connections
    except ImportError:
        logger.error("pymilvus not installed — cannot upsert")
        return 0

    alias = "craft-ingest"
    try:
        connections.connect(alias=alias, host=host, port=port)
    except Exception as e:
        logger.error("Milvus connection failed: %s", e)
        return 0

    collection = Collection(name=collection_name, using=alias)

    # Build field lists
    theorems = [r["theorem_name"] for r in records]
    file_paths = [r["file_path"] for r in records]
    embeddings = [r["embedding"] for r in records]
    lean_codes = [r["lean_code"] for r in records]
    tags_list = [r["tags"] for r in records]

    try:
        insert_result = collection.insert(
            [
                theorems,
                file_paths,
                embeddings,
                lean_codes,
                tags_list,
            ]
        )
        inserted = len(insert_result.primary_keys) if insert_result.primary_keys else 0
        logger.info("Upserted %d theorems to Milvus collection '%s'", inserted, collection_name)
        collection.flush()
        return inserted
    except Exception as e:
        logger.error("Milvus insert failed: %s", e)
        return 0


# ---------------------------------------------------------------------------
# File Processing Pipeline
# ---------------------------------------------------------------------------
def process_file(
    filepath: str,
    embedder: Embedder,
    milvus_host: str,
    milvus_port: int,
    collection_name: str,
) -> int:
    """Process a single .lean file: parse → embed → upsert. Returns count inserted."""
    rel_path = Path(filepath).name
    logger.info("Processing: %s", rel_path)

    theorems = parse_lean_file(filepath)
    if not theorems:
        logger.info("No theorems found in %s", rel_path)
        return 0

    logger.info("Found %d theorems/definitions in %s", len(theorems), rel_path)

    # Embed
    texts = [f"{name}: {code}" for name, code, _ in theorems]
    embeddings = embedder.embed(texts)

    # Build records
    records = []
    for (name, code, tags), embedding in zip(theorems, embeddings):
        records.append(
            {
                "theorem_name": name,
                "file_path": rel_path,
                "embedding": embedding,
                "lean_code": code,
                "tags": tags,
            }
        )

    # Upsert
    inserted = upsert_to_milvus(records, milvus_host, milvus_port, collection_name)
    return inserted


def process_directory(
    watch_dir: str,
    embedder: Embedder,
    milvus_host: str,
    milvus_port: int,
    collection_name: str,
):
    """Process all .lean files in a directory tree."""
    lean_files = sorted(Path(watch_dir).rglob("*.lean"))
    if not lean_files:
        logger.info("No .lean files found in %s", watch_dir)
        return

    total = 0
    for lf in lean_files:
        try:
            total += process_file(
                str(lf), embedder, milvus_host, milvus_port, collection_name
            )
        except Exception as exc:
            logger.error("Failed to process %s: %s", lf, exc)

    logger.info("Ingestion complete: %d theorems across %d files", total, len(lean_files))


# ---------------------------------------------------------------------------
# CLI Entry Point
# ---------------------------------------------------------------------------
def main():
    parser = argparse.ArgumentParser(description="CRAFT Lean 4 ingestion worker")
    parser.add_argument(
        "--watch",
        default=DEFAULT_WATCH_DIR,
        help=f"Directory to watch for .lean files (default: {DEFAULT_WATCH_DIR})",
    )
    parser.add_argument(
        "--file",
        help="Process a single .lean file and exit",
    )
    parser.add_argument(
        "--interval",
        type=int,
        default=60,
        help="Watch interval in seconds (default: 60)",
    )
    parser.add_argument(
        "--milvus-host",
        default=DEFAULT_MILVUS_HOST,
        help=f"Milvus host (default: {DEFAULT_MILVUS_HOST})",
    )
    parser.add_argument(
        "--milvus-port",
        type=int,
        default=DEFAULT_MILVUS_PORT,
        help=f"Milvus port (default: {DEFAULT_MILVUS_PORT})",
    )
    parser.add_argument(
        "--collection",
        default=DEFAULT_COLLECTION,
        help=f"Milvus collection name (default: {DEFAULT_COLLECTION})",
    )
    args = parser.parse_args()

    embedder = Embedder()

    if args.file:
        process_file(args.file, embedder, args.milvus_host, args.milvus_port, args.collection)
        return 0

    logger.info("CRAFT ingestion worker started — watching %s (every %ds)", args.watch, args.interval)

    while True:
        process_directory(args.watch, embedder, args.milvus_host, args.milvus_port, args.collection)
        logger.info("Sleeping %d seconds...", args.interval)
        time.sleep(args.interval)


if __name__ == "__main__":
    sys.exit(main())

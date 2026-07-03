#!/usr/bin/env python3
"""
CRAFT — Milvus Collection Setup
Creates the vector collection schema for Lean 4 theorem embeddings.

Usage:
    python3 scripts/craft/setup-milvus.py [--host localhost] [--port 19530] [--drop-existing]
"""

import argparse
import logging
import sys

logging.basicConfig(level=logging.INFO, format="[CRAFT] %(levelname)s %(message)s")
logger = logging.getLogger("craft-setup")

COLLECTION_NAME = "craft_theorems"
EMBEDDING_DIM = 512


def create_collection(host: str, port: int, drop_existing: bool = False) -> bool:
    """
    Create or reset the CRAFT theorem vector collection in Milvus.

    Schema:
        - id (int64): primary key, auto-generated
        - theorem_name (varchar): e.g. "infinite_primes"
        - file_path (varchar): relative path to .lean source
        - embedding (float_vector[512]): sentence-transformer encoding
        - lean_code (varchar): raw theorem source text
        - tags (varchar): comma-separated compliance/category tags

    Returns True on success.
    """
    try:
        from pymilvus import (
            Collection,
            CollectionSchema,
            DataType,
            FieldSchema,
            connections,
            utility,
        )
    except ImportError:
        logger.error("pymilvus not installed. Install with: pip install pymilvus")
        return False

    alias = "craft-default"
    try:
        connections.connect(alias=alias, host=host, port=port)
        logger.info("Connected to Milvus at %s:%s", host, port)
    except Exception as e:
        logger.error("Failed to connect to Milvus: %s", e)
        return False

    if utility.has_collection(COLLECTION_NAME, using=alias):
        if drop_existing:
            utility.drop_collection(COLLECTION_NAME, using=alias)
            logger.warning("Dropped existing collection '%s'", COLLECTION_NAME)
        else:
            logger.info(
                "Collection '%s' already exists. Use --drop-existing to recreate.",
                COLLECTION_NAME,
            )
            return True

    fields = [
        FieldSchema(name="id", dtype=DataType.INT64, is_primary=True, auto_id=True),
        FieldSchema(name="theorem_name", dtype=DataType.VARCHAR, max_length=256),
        FieldSchema(name="file_path", dtype=DataType.VARCHAR, max_length=512),
        FieldSchema(name="embedding", dtype=DataType.FLOAT_VECTOR, dim=EMBEDDING_DIM),
        FieldSchema(name="lean_code", dtype=DataType.VARCHAR, max_length=65535),
        FieldSchema(name="tags", dtype=DataType.VARCHAR, max_length=512),
    ]

    schema = CollectionSchema(fields=fields, description="CRAFT Lean 4 theorem embeddings")

    collection = Collection(name=COLLECTION_NAME, schema=schema, using=alias)
    logger.info("Created collection '%s' with %s-dim embeddings", COLLECTION_NAME, EMBEDDING_DIM)

    # Create IVF_FLAT index for fast ANN search
    index_params = {
        "metric_type": "IP",  # inner product — works well with normalized sentence embeddings
        "index_type": "IVF_FLAT",
        "params": {"nlist": 128},
    }
    collection.create_index(field_name="embedding", index_params=index_params)
    logger.info("Created IVF_FLAT index (nlist=128) on embedding field")

    collection.load()
    logger.info("Collection '%s' loaded and ready for ingestion", COLLECTION_NAME)

    return True


def main():
    parser = argparse.ArgumentParser(description="CRAFT Milvus collection setup")
    parser.add_argument("--host", default="localhost", help="Milvus host (default: localhost)")
    parser.add_argument("--port", type=int, default=19530, help="Milvus gRPC port (default: 19530)")
    parser.add_argument("--drop-existing", action="store_true", help="Drop collection if it exists")
    parser.add_argument("--dry-run", action="store_true", help="Validate config without connecting")
    args = parser.parse_args()

    if args.dry_run:
        logger.info(
            "DRY RUN: would create collection '%s' at %s:%s (drop=%s)",
            COLLECTION_NAME,
            args.host,
            args.port,
            args.drop_existing,
        )
        logger.info("Embedding dimension: %s", EMBEDDING_DIM)
        return 0

    success = create_collection(args.host, args.port, args.drop_existing)
    return 0 if success else 1


if __name__ == "__main__":
    sys.exit(main())

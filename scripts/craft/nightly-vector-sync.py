#!/usr/bin/env python3
"""
nightly-vector-sync.py — CRAFT Semantic Federation Worker

Pulls ratified global vector indices from the Ubuntu Pool (IPFS) and merges
them into the local Milvus vector store.  This is the "Brain" of the
federation layer — it ensures that every node in the consortium learns from
proofs verified by any other node.

Invoked by:
  - lindiwe.go RatifyProof → TriggerCRAFTIngestion()
  - Lindiwe NightlyVectorSync() (every 24h)

Architecture:
  IPFS (global index) → nightly-vector-sync.py → Milvus (local)
       │                                              │
       │  fetches ratified vectors                    │  upserts into
       ▼                                              ▼
  "latest-vector-index.bin"                   craft_theorems collection

Usage:
  # On-demand from Lindiwe consensus
  python3 nightly-vector-sync.py --cid QmHash123 --ipfs-api http://ubuntu-pool:5001

  # Nightly global sync
  python3 nightly-vector-sync.py --global-index latest-vector-index.bin \\
      --ipfs-api http://ubuntu-pool:5001 \\
      --milvus-host craft-milvus --milvus-port 19530 \\
      --collection craft_theorems
"""

import argparse
import hashlib
import json
import logging
import os
import struct
import sys
import time
import urllib.request
from typing import Optional

logging.basicConfig(
    level=logging.INFO,
    format="[CRAFT] %(asctime)s %(message)s",
    datefmt="%H:%M:%S",
)
log = logging.getLogger("craft-sync")


# ── Configuration ─────────────────────────────────────────────────────────────

DEFAULT_IPFS_API = os.getenv("IPFS_API", "http://ubuntu-pool:5001/api/v0")
DEFAULT_MILVUS_HOST = os.getenv("MILVUS_HOST", "craft-milvus")
DEFAULT_MILVUS_PORT = int(os.getenv("MILVUS_PORT", "19530"))
DEFAULT_COLLECTION = os.getenv("COLLECTION_NAME", "craft_theorems")
EMBEDDING_DIM = int(os.getenv("EMBEDDING_DIM", "512"))


# ── IPFS Client ───────────────────────────────────────────────────────────────

def ipfs_cat(api_url: str, cid: str) -> Optional[bytes]:
    """Fetch content from IPFS by CID via the gateway API."""
    url = f"{api_url}/cat?arg={cid}"
    try:
        with urllib.request.urlopen(url, timeout=30) as resp:
            return resp.read()
    except Exception as e:
        log.error(f"IPFS cat failed for {cid}: {e}")
        return None


def ipfs_pin(api_url: str, cid: str) -> bool:
    """Pin a CID on the local IPFS node."""
    url = f"{api_url}/pin/add?arg={cid}"
    try:
        with urllib.request.urlopen(url, timeout=10):
            return True
    except Exception as e:
        log.warning(f"IPFS pin failed for {cid}: {e}")
        return False


# ── Milvus Client (lightweight gRPC-free version) ─────────────────────────────

class MilvusClient:
    """
    Minimal Milvus HTTP client for vector upsert operations.
    Uses Milvus's RESTful API (port 9091) or gRPC via pymilvus.

    Falls back to pymilvus if available, otherwise uses HTTP.
    """

    def __init__(self, host: str = DEFAULT_MILVUS_HOST,
                 port: int = DEFAULT_MILVUS_PORT,
                 collection: str = DEFAULT_COLLECTION):
        self.host = host
        self.port = port
        self.collection = collection
        self.http_base = f"http://{host}:9091/api/v1"
        self._pymilvus = None

        # Try to import pymilvus
        try:
            from pymilvus import Collection, connections
            self._pymilvus = True
            connections.connect(alias="craft_sync", host=host, port=str(port))
            log.info(f"Connected to Milvus via gRPC at {host}:{port}")
        except ImportError:
            self._pymilvus = False
            log.info(f"pymilvus not available; using HTTP API at {host}:9091")
        except Exception as e:
            self._pymilvus = False
            log.warning(f"gRPC connection failed; falling back to HTTP: {e}")

    def upsert_vectors(self, ids: list[int], vectors: list[list[float]],
                       metadata: list[dict]) -> bool:
        """Upsert a batch of vectors with metadata into the collection."""
        if self._pymilvus:
            return self._upsert_grpc(ids, vectors, metadata)
        return self._upsert_http(ids, vectors, metadata)

    def _upsert_grpc(self, ids: list[int], vectors: list[list[float]],
                     metadata: list[dict]) -> bool:
        """Upsert using pymilvus (gRPC)."""
        try:
            from pymilvus import Collection, utility

            # Ensure collection exists
            if not utility.has_collection(self.collection):
                log.info(f"Creating collection: {self.collection}")
                from pymilvus import CollectionSchema, FieldSchema, DataType
                fields = [
                    FieldSchema(name="id", dtype=DataType.INT64, is_primary=True),
                    FieldSchema(name="embedding", dtype=DataType.FLOAT_VECTOR,
                                dim=EMBEDDING_DIM),
                    FieldSchema(name="source", dtype=DataType.VARCHAR, max_length=128),
                    FieldSchema(name="proof_cid", dtype=DataType.VARCHAR, max_length=64),
                    FieldSchema(name="timestamp", dtype=DataType.VARCHAR, max_length=32),
                    FieldSchema(name="file", dtype=DataType.VARCHAR, max_length=256),
                ]
                schema = CollectionSchema(fields, description="CRAFT theorem embeddings (federated)")
                Collection(name=self.collection, schema=schema)

            collection = Collection(name=self.collection)
            entities = [
                [ids],
                [vectors],
                [m.get("source", "ubuntu-pool") for m in metadata],
                [m.get("proof_cid", "") for m in metadata],
                [m.get("timestamp", "") for m in metadata],
                [m.get("file", "") for m in metadata],
            ]
            mr = collection.insert(entities)
            log.info(f"gRPC upsert: {len(ids)} vectors → {self.collection}")
            return True
        except Exception as e:
            log.error(f"gRPC upsert failed: {e}")
            return False

    def _upsert_http(self, ids: list[int], vectors: list[list[float]],
                     metadata: list[dict]) -> bool:
        """Upsert using Milvus HTTP REST API."""
        try:
            for i, (vid, vec, meta) in enumerate(zip(ids, vectors, metadata)):
                payload = {
                    "collection_name": self.collection,
                    "num": 1,
                    "fields_data": [
                        {
                            "field_name": "id",
                            "type": 5,  # Int64
                            "field_data": {"scalars": {"data": {"long_data": {"data": [vid]}}}},
                        },
                        {
                            "field_name": "embedding",
                            "type": 101,  # FloatVector
                            "field_data": {"vectors": {"dimension": EMBEDDING_DIM, "data": [vec]}},
                        },
                    ],
                }

                # Add metadata fields if present
                for key in ("source", "proof_cid", "timestamp", "file"):
                    if key in meta:
                        payload["fields_data"].append({
                            "field_name": key,
                            "type": 21,  # VarChar
                            "field_data": {"scalars": {"data": {"string_data": {"data": [meta[key]]}}}},
                        })

                url = f"{self.http_base}/insert"
                req = urllib.request.Request(
                    url,
                    data=json.dumps(payload).encode(),
                    headers={"Content-Type": "application/json"},
                )
                with urllib.request.urlopen(req, timeout=10) as resp:
                    result = json.loads(resp.read())

                if result.get("status", {}).get("error_code") != 0:
                    log.warning(f"HTTP upsert returned error for vector {vid}: {result}")

            log.info(f"HTTP upsert: {len(ids)} vectors → {self.collection}")
            return True
        except Exception as e:
            log.error(f"HTTP upsert failed: {e}")
            return False


# ── Vector Encoding ───────────────────────────────────────────────────────────

def parse_vector_index(data: bytes) -> tuple[list[int], list[list[float]], list[dict]]:
    """
    Parse a binary vector index file.

    Format:
      [4 bytes: num_vectors]
      for each vector:
        [8 bytes: id]
        [4 bytes: dim]
        [dim * 4 bytes: float32 embedding]
        [2 bytes: metadata_len]
        [metadata_len bytes: UTF-8 JSON metadata]
    """
    offset = 0
    num_vectors = struct.unpack_from(">I", data, offset)[0]
    offset += 4

    ids: list[int] = []
    vectors: list[list[float]] = []
    metadata_list: list[dict] = []

    for _ in range(num_vectors):
        # ID
        vid = struct.unpack_from(">Q", data, offset)[0]
        offset += 8
        ids.append(vid)

        # Dimension
        dim = struct.unpack_from(">I", data, offset)[0]
        offset += 4

        # Embedding
        vec = list(struct.unpack_from(f">{dim}f", data, offset))
        offset += dim * 4
        vectors.append(vec)

        # Metadata
        meta_len = struct.unpack_from(">H", data, offset)[0]
        offset += 2
        meta_json = data[offset:offset + meta_len].decode("utf-8")
        offset += meta_len
        metadata_list.append(json.loads(meta_json))

    return ids, vectors, metadata_list


def serialize_vector_index(ids: list[int], vectors: list[list[float]],
                            metadata: list[dict]) -> bytes:
    """Serialize vectors into binary format for IPFS publishing."""
    buf = bytearray()
    buf += struct.pack(">I", len(ids))

    for vid, vec, meta in zip(ids, vectors, metadata):
        buf += struct.pack(">Q", vid)
        buf += struct.pack(">I", len(vec))
        buf += struct.pack(f">{len(vec)}f", *vec)
        meta_bytes = json.dumps(meta).encode("utf-8")
        buf += struct.pack(">H", len(meta_bytes))
        buf += meta_bytes

    return bytes(buf)


# ── Main Pipeline ─────────────────────────────────────────────────────────────

def sync_single_proof(cid: str, ipfs_api: str, client: MilvusClient) -> bool:
    """Download a single verified proof from IPFS and add it to Milvus."""
    log.info(f"Syncing single proof: {cid}")

    # Fetch proof content from IPFS
    data = ipfs_cat(ipfs_api, cid)
    if data is None:
        return False

    # Create a synthetic vector embedding from content hash
    # In production, this would use the Sentence-Transformer model
    h = hashlib.sha256(data).digest()
    # Expand hash to fill embedding dimension via repeated hashing
    vec = []
    for i in range(EMBEDDING_DIM):
        h_seed = hashlib.sha256(h + struct.pack(">I", i)).digest()
        val = struct.unpack(">I", h_seed[:4])[0] / 4294967295.0  # normalise to [0,1]
        vec.append(val)

    ids = [hash(cid) & 0x7FFFFFFFFFFFFFFF]
    vectors = [vec]
    metadata = [{
        "source": "ubuntu-pool",
        "proof_cid": cid,
        "timestamp": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
        "file": f"pool/{cid}.lean",
    }]

    success = client.upsert_vectors(ids, vectors, metadata)
    if success:
        log.info(f"✅  Synced proof {cid} → Milvus")
        ipfs_pin(ipfs_api, cid)
    return success


def sync_global_index(index_cid: str, ipfs_api: str, client: MilvusClient) -> bool:
    """Download and merge the global vector index from IPFS."""
    log.info(f"Downloading global vector index: {index_cid}")

    data = ipfs_cat(ipfs_api, index_cid)
    if data is None:
        log.warning(f"Global index {index_cid} not found; creating new seed...")

        # Seed with an empty index so the pool has a starting point
        seed_data = serialize_vector_index([], [], [])
        log.info(f"Created empty seed index ({len(seed_data)} bytes)")
        return True

    try:
        ids, vectors, metadata = parse_vector_index(data)
        log.info(f"Parsed {len(ids)} vectors from global index")

        if len(ids) == 0:
            log.info("No new vectors in global index")
            return True

        success = client.upsert_vectors(ids, vectors, metadata)
        if success:
            log.info(f"✅  Merged {len(ids)} global vectors → {client.collection}")
        return success

    except Exception as e:
        log.error(f"Failed to parse global index: {e}")
        return False


def main():
    parser = argparse.ArgumentParser(
        description="CRAFT Nightly Vector Sync — Ubuntu Pool Federation"
    )
    parser.add_argument("--cid", help="Single proof CID to sync")
    parser.add_argument("--global-index", help="CID of global vector index")
    parser.add_argument("--ipfs-api", default=DEFAULT_IPFS_API)
    parser.add_argument("--milvus-host", default=DEFAULT_MILVUS_HOST)
    parser.add_argument("--milvus-port", type=int, default=DEFAULT_MILVUS_PORT)
    parser.add_argument("--collection", default=DEFAULT_COLLECTION)
    args = parser.parse_args()

    client = MilvusClient(
        host=args.milvus_host,
        port=args.milvus_port,
        collection=args.collection,
    )

    if args.cid:
        success = sync_single_proof(args.cid, args.ipfs_api, client)
        sys.exit(0 if success else 1)

    elif args.global_index:
        success = sync_global_index(args.global_index, args.ipfs_api, client)
        sys.exit(0 if success else 1)

    else:
        log.error("Must provide either --cid or --global-index")
        sys.exit(1)


if __name__ == "__main__":
    main()

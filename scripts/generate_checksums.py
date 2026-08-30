#!/usr/bin/env python3
"""
IVE Checksum Generator
======================

Regenerates `ive-output/checksums.txt` with a deterministic SHA-256 index
covering all release artifacts.

Rules (per the Integrity Closure specification):
  - The index excludes itself (checksums.txt is not hashed into checksums.txt).
  - Entries are sorted lexicographically by path (deterministic ordering).
  - Filenames are handled safely (null-delimited, no word-splitting).
  - Covers the authoritative manifest (README, docs, cad, outputs, ive-output, src).
  - No covered artifact may be modified after checksum generation.

Usage:
    python3 scripts/generate_checksums.py
    python3 scripts/generate_checksums.py --root .
"""

import argparse
import hashlib
import os
from pathlib import Path

# File extensions to include in the checksum index.
INCLUDED_EXTENSIONS = {
    ".py", ".ts", ".tsx", ".js", ".jsx", ".json", ".yaml", ".yml",
    ".md", ".txt", ".kcl", ".toml", ".css",
}

# Directories to exclude from the checksum index.
EXCLUDED_DIRS = {
    "node_modules", ".next", ".git", "__pycache__", ".turbo",
    "upload", "tests", "skills", "examples", "mini-services",
}

# The checksum file itself is excluded from its own index.
SELF_EXCLUDE = "ive-output/checksums.txt"


def should_include(path: Path, root: Path) -> bool:
    """Determine if a file should be included in the checksum index."""
    rel = path.relative_to(root)
    rel_str = str(rel).replace(os.sep, "/")

    # Exclude self.
    if rel_str == SELF_EXCLUDE:
        return False

    # Exclude files inside excluded directories.
    parts = rel.parts
    for excluded in EXCLUDED_DIRS:
        if excluded in parts:
            return False

    # Include only specified extensions.
    if path.suffix.lower() not in INCLUDED_EXTENSIONS:
        return False

    return True


def compute_sha256(path: Path) -> str:
    """Compute the SHA-256 hash of a file."""
    h = hashlib.sha256()
    with open(path, "rb") as f:
        for chunk in iter(lambda: f.read(8192), b""):
            h.update(chunk)
    return h.hexdigest()


def main():
    parser = argparse.ArgumentParser(description="IVE Checksum Generator")
    parser.add_argument("--root", default=".", help="Repository root (default: current directory)")
    args = parser.parse_args()
    root = Path(args.root).resolve()

    print("=" * 60)
    print("  IVE CHECKSUM GENERATOR")
    print("=" * 60)
    print(f"  Root: {root}")
    print()

    # Collect all files to checksum.
    files = []
    for path in root.rglob("*"):
        if path.is_file() and should_include(path, root):
            files.append(path)

    # Sort lexicographically by relative path for deterministic ordering.
    files.sort(key=lambda p: str(p.relative_to(root)).replace(os.sep, "/"))

    if not files:
        print("  [-] No files found to checksum.")
        return

    # Ensure ive-output directory exists.
    output_dir = root / "ive-output"
    output_dir.mkdir(parents=True, exist_ok=True)

    checksums_path = output_dir / "checksums.txt"

    # Compute checksums.
    print(f"  Computing SHA-256 for {len(files)} files...")
    lines = []
    for path in files:
        rel = str(path.relative_to(root)).replace(os.sep, "/")
        digest = compute_sha256(path)
        lines.append(f"{digest}  {rel}")
        print(f"    {digest[:16]}...  {rel}")

    # Write the checksum file.
    content = "\n".join(lines) + "\n"
    checksums_path.write_text(content, encoding="utf-8")

    print()
    print(f"  [+] Checksum index written to: {checksums_path.relative_to(root)}")
    print(f"  [+] {len(files)} entries, lexicographically sorted.")
    print()
    print("  NOTE: No covered artifact may be modified after checksum generation.")
    print("  Run verify_release.py to validate the index.")


if __name__ == "__main__":
    main()

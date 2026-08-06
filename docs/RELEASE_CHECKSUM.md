# IVE Checksum Generation & Verification

## Generate Checksum Index

To calculate standard sha256sum indexes at build time across all deployment-critical assets inside the output repository, issue this shell routine:

```bash
mkdir -p ive-output
find ive-output/ -type f ! -name "checksums.txt" -exec sha256sum {} + > ive-output/checksums.txt
```

Alternatively, use the Python generator for a broader index covering the full workspace:

```bash
python3 scripts/generate_checksums.py --root .
```

## Verification Execution Command

The core system or deployment runner checks consistency using the following command:

```bash
cd ive-output && sha256sum -c checksums.txt
```

## Top-Level SHA256SUMS

A top-level `SHA256SUMS` file covers the release-critical root artifacts:

```bash
sha256sum README.md IMPLEMENTATION_REPORT.md README-LICENSE-NOTICE.md CHANGELOG.md RELEASE_NOTES.md ive-output/results.json scripts/verify_release.py scripts/ive_result_adapter.py scripts/generate_checksums.py > SHA256SUMS
sha256sum -c SHA256SUMS
```

## Integrity Rules

- The checksum index excludes itself (`checksums.txt` is not hashed into `checksums.txt`).
- Entries are sorted lexicographically by path (deterministic ordering).
- No covered artifact may be modified after checksum generation.
- If the ledger root is not externally signed or anchored, it is described as "internally consistent and tamper-evident within the submitted package" — not immutable or independently authenticated.

# Dependency Audit Summary

**Date:** 2026-03-04
**Auditor:** SBOM + Audit + Release Engineering Agent
**Project:** vvu-earth-tech v0.2.0

## Tools Used

| Tool | Version | Scope |
|------|---------|-------|
| npm audit | npm 11.x | Node.js dependencies (package.json) |
| bun audit | v1.3.14 | Bun lockfile cross-check |
| pip-audit | v2.10.1 | Python dependencies (vvu-earth-ledger/pyproject.toml) |

## Findings

### npm audit — 25 vulnerabilities (2 low, 7 moderate, 15 high, 1 critical)

| Severity | Count | Key Packages |
|----------|-------|--------------|
| Critical | 1 | next-auth (≤4.24.14) |
| High | 15 | next, sharp, postcss, lodash, lodash-es, minimatch, brace-expansion, picomatch, defu, flatted, js-cookie, js-yaml, effect |
| Moderate | 7 | next-intl, uuid, prismjs, ajv, @babel/core (low), diff (low) |
| Low | 2 | @babel/core, diff |

#### Critical Vulnerability

1. **next-auth ≤4.24.14** — Email normalizer validates the address before Unicode normalization, allowing a homoglyph @ bypass (GHSA-7rqj-j65f-68wh). **Recommendation:** Upgrade to next-auth v5 or apply the latest v4 patch.

#### High-Priority Vulnerabilities

| Package | Vulnerability | Advisory | Fix |
|---------|--------------|----------|-----|
| next (16.1.1) | Multiple DoS, SSRF, middleware bypass, cache poisoning | ~30 advisories | Upgrade to ≥16.2.5 |
| sharp (<0.35.0) | Inherited libvips vulnerabilities (CVE-2026-33327, CVE-2026-33328, etc.) | GHSA-f88m-g3jw-g9cj | Upgrade to ≥0.35.0 |
| postcss (≤8.5.17) | XSS, arbitrary file read, path traversal | GHSA-qx2v-qp2m-jg93, GHSA-6g55-p6wh-862q, GHSA-r28c-9q8g-f849 | Upgrade to ≥8.5.10 |
| lodash/lodash-es (≤4.17.23) | Code injection via `_.template`, prototype pollution | GHSA-r5fr-rjxr-66jc, GHSA-f23m-r3pf-42rh | Upgrade to ≥4.17.24 |
| minimatch (≤3.1.3) | ReDoS via repeated wildcards, combinatorial backtracking | Multiple | Upgrade via `npm audit fix` |
| brace-expansion (≤5.0.7) | DoS via zero-step sequence, exponential expansion | GHSA-f886-m6hf-6m8v, GHSA-3jxr-9vmj-r5cp | Upgrade via `npm audit fix` |
| defu (≤6.1.4) | Prototype pollution via `__proto__` | GHSA-737v-mqg7-c878 | Upgrade via `npm audit fix` |
| flatted (≤3.4.1) | Unbounded recursion DoS, prototype pollution | GHSA-25h7-pfq9-p65f, GHSA-rf6f-7fwh-wjgh | Upgrade via `npm audit fix` |
| js-cookie (≤3.0.5) | Prototype hijack in assign() | GHSA-qjx8-664m-686j | Upgrade via `npm audit fix` |
| js-yaml (4.0.0-4.2.0) | Quadratic DoS in merge key handling | GHSA-h67p-54hq-rp68, GHSA-52cp-r559-cp3m | Breaking: upgrade @mdxeditor/editor |
| picomatch (≤2.3.1, 4.0.0-4.0.3) | Method injection in POSIX classes, ReDoS | GHSA-3v7f-55p6-f55p, GHSA-c2c7-rcm5-vvqj | Upgrade via `npm audit fix` |
| effect (<3.20.0) | AsyncLocalStorage context lost under concurrent load | GHSA-38f7-945m-qr2g | Upgrade via `npm audit fix` |

#### Moderate Vulnerabilities

| Package | Vulnerability | Advisory |
|---------|--------------|----------|
| next-intl (≤4.9.1) | Open redirect, prototype pollution via precompile | GHSA-8f24-v5vv-gm5j, GHSA-4c35-wcg5-mm9h |
| uuid (<11.1.1) | Missing buffer bounds check in v3/v5/v6 | GHSA-w5hq-g745-h8pq |
| prismjs (<1.30.0) | DOM Clobbering | GHSA-x7hr-w5r2-h6wg |
| ajv (<6.14.0) | ReDoS with $data option | GHSA-2g4f-4pwh-qvx6 |

### pip-audit — 0 project vulnerabilities

pip-audit found no vulnerabilities in the project's Python dependencies (pynacl, cffi, pycparser). The only findings were in the pip tool itself (v25.0.1) within the audit virtual environment, which is not part of the project.

**Python dependency status:** ✅ CLEAN — No known vulnerabilities in pynacl ≥1.5.0.

## Recommendations

### Immediate (Pre-Release)

1. **Upgrade next-auth** to v5 or latest v4.24.x patch — Critical: email homoglyph bypass
2. **Upgrade Next.js** to ≥16.2.5 — 30+ high/moderate advisories including DoS, SSRF, middleware bypass
3. **Upgrade sharp** to ≥0.35.0 — libvips CVEs
4. **Upgrade postcss** to ≥8.5.10 — XSS and file read vulnerabilities

### Short-Term (Next Sprint)

5. Run `npm audit fix` to resolve non-breaking fixes (minimatch, brace-expansion, defu, flatted, uuid, effect, picomatch)
6. Evaluate `npm audit fix --force` for breaking changes (js-yaml via @mdxeditor/editor upgrade, react-syntax-highlighter upgrade for prismjs)
7. Upgrade lodash/lodash-es to ≥4.17.24 (transitive via recharts, @reactuses/core)
8. Upgrade next-intl to ≥4.9.2 to fix open redirect and prototype pollution

### Long-Term

9. Set up automated dependency scanning in CI/CD (e.g., `npm audit`, `pip-audit`, Snyk, Dependabot)
10. Pin exact dependency versions in production for reproducibility
11. Implement SBOM generation as part of the CI pipeline
12. Schedule quarterly dependency review and upgrade cycles

## Known False Positives

| Package | Advisory | Reason |
|---------|----------|--------|
| @babel/core (≤7.29.0) | GHSA-4x5r-pxfx-6jf8 | Only used in dev via eslint-config-next → eslint-plugin-react-hooks; not bundled in production |
| ajv (<6.14.0) | GHSA-2g4f-4pwh-qvx6 | Only used in dev via eslint; not bundled in production |
| diff (5.0.0-5.2.1) | GHSA-73rr-hh4g-fpgx | Only used by @mdxeditor/editor dev dependency; low severity |
| pip (v25.0.1) | Multiple PYSEC advisories | These are in the pip tool itself within the audit venv, not the project's dependencies |

## Audit Artifacts

- `audit-results/npm-audit.txt` — Full npm audit output
- `audit-results/pip-audit.txt` — Full pip-audit output
- `sbom/cyclonedx.json` — CycloneDX SBOM v1.5
- `sbom/spdx.json` — SPDX SBOM v2.3

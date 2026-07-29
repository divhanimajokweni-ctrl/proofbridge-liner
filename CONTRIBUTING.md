# Contributing to VVU Earth Tech

First off, thank you for considering contributing to VVU Earth Tech. It's people like you that make this project a reality.

## Code of Conduct

### Our Pledge

We are committed to providing a welcoming and inspiring community for all. Please be respectful, constructive, and professional in all interactions.

### Our Standards

**Positive behavior includes:**
- Using welcoming and inclusive language
- Being respectful of differing viewpoints and experiences
- Gracefully accepting constructive criticism
- Focusing on what is best for the community
- Showing empathy towards other community members

**Unacceptable behavior includes:**
- The use of sexualized language or imagery
- Trolling, insulting/derogatory comments, and personal or political attacks
- Public or private harassment
- Publishing others' private information without explicit permission
- Other conduct which could reasonably be considered inappropriate

### Enforcement

Report unacceptable behavior to conduct@vvu-earthtech.com. All reports will be reviewed and investigated promptly and fairly.

## How to Contribute

### Fork and Branch

1. Fork the repository on GitHub
2. Clone your fork locally:
   ```bash
   git clone https://github.com/YOUR_USERNAME/vvu-earth-tech.git
   cd vvu-earth-tech
   ```
3. Create a feature branch from `main`:
   ```bash
   git checkout -b feat/your-feature-name
   ```
4. Make your changes
5. Push to your fork:
   ```bash
   git push origin feat/your-feature-name
   ```
6. Open a Pull Request against the `main` branch

### Branch Naming Convention

| Type | Prefix | Example |
|------|--------|---------|
| Feature | `feat/` | `feat/ed25519-key-rotation` |
| Bug fix | `fix/` | `fix/mmr-proof-verification` |
| Documentation | `docs/` | `docs/api-reference` |
| Refactor | `refactor/` | `refactor/acceptance-pipeline` |
| Security | `security/` | `security/csrf-protection` |
| Test | `test/` | `test/ledger-integration` |

## Development Setup

### Prerequisites

- **Node.js**: >= 18.x
- **Python**: >= 3.11
- **Bun** (optional, for faster installs)
- **Docker** (for ledger service)

### Frontend Dashboard (Next.js)

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Run tests
npm test

# Run linter
npm run lint
```

### Python Ledger Service

```bash
cd vvu-earth-ledger

# Create virtual environment
python -m venv .venv
source .venv/bin/activate  # or .venv\Scripts\activate on Windows

# Install with dev dependencies
pip install -e ".[dev]"

# Run tests
pytest

# Run linter
ruff check src/

# Run type checker
mypy src/
```

### Kernel Verification

```bash
# 12-assertion kernel verification
npx tsx scripts/verify-kernel.ts

# Full Vitest suite
npx vitest run
```

## Coding Standards

### Python

| Tool | Purpose | Configuration |
|------|---------|---------------|
| **Black** | Code formatting | `line-length = 120` |
| **Ruff** | Linting | `target-version = "py311"`, `line-length = 120` |
| **MyPy** | Type checking | `strict = true`, `python_version = "3.11"` |

Key conventions:
- Use type hints for all function signatures (required by MyPy strict mode)
- Use `from __future__ import annotations` for forward references
- Use dataclasses or Pydantic models for structured data
- Use `enum.Enum` for fixed sets of values
- Prefer `pathlib.Path` over `os.path`
- Use f-strings for string formatting
- Use `logging` module, never `print()` for production code

### TypeScript

| Tool | Purpose | Configuration |
|------|---------|---------------|
| **ESLint** | Linting | `eslint-config-next` |
| **TypeScript** | Type checking | `strict: true` |

Key conventions:
- Use strict TypeScript (no `any`, no non-null assertions without justification)
- Use `interface` for object shapes, `type` for unions/intersections
- Use `enum` for fixed sets of values, `as const` for literal unions
- Use `readonly` for immutable data
- Prefer `async/await` over `.then()` chains
- Use Zod for runtime validation of external data
- Use `@/` path alias for imports from `src/`

### Shared Conventions

- **No `Math.random()` / `Date.now()` / `crypto.randomUUID()`** in kernel code — all non-deterministic operations must be injected through provider interfaces
- **No `JSON.stringify()`** for hashing — only RFC 8785 (JCS)
- **No FNV, CRC, or ad-hoc hashing** — only SHA-256
- **Evidence is append-only** — WORM storage, no delete, no update
- **No secrets in code** — use environment variables or secret management

## Testing Requirements

### Python Tests

- All new code must have unit tests
- Test files go in `vvu-earth-ledger/tests/`
- Use `pytest` with `hypothesis` for property-based testing
- Minimum coverage: 80% for new code
- Run: `pytest --cov=production_ledger --cov-report=term-missing`

### TypeScript Tests

- All new kernel code must have deterministic tests
- Test files go in `src/__tests__/`
- Use `vitest` for testing
- All 12 kernel assertions must pass after any change
- Run: `npx vitest run`

### Integration Tests

- API routes should have integration tests
- End-to-end flows should be tested with the full stack
- Use `@tanstack/react-query` test utilities for component tests

## Commit Message Format

We follow [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>(<scope>): <description>

[optional body]

[optional footer(s)]
```

### Types

| Type | Description |
|------|-------------|
| `feat` | A new feature |
| `fix` | A bug fix |
| `docs` | Documentation changes |
| `style` | Code style changes (formatting, semicolons, etc.) |
| `refactor` | Code refactoring without feature changes |
| `perf` | Performance improvements |
| `test` | Adding or updating tests |
| `build` | Build system or dependency changes |
| `ci` | CI/CD configuration changes |
| `chore` | Other changes that don't modify src or test files |
| `security` | Security-related changes |

### Examples

```
feat(ledger): add gRPC TLS support for production deployments
fix(mmr): correct proof verification for edge case with single element
docs(api): add OpenAPI specification for ledger endpoints
security(signer): add Ed25519 domain separation strings
```

### Breaking Changes

Breaking changes must include a `!` after the type/scope and a `BREAKING CHANGE:` footer:

```
feat(ledger)!: change receipt schema to include domain separation string

BREAKING CHANGE: Receipt schema now includes a `domain` field. Existing
receipts without this field will fail validation. Migration guide in
docs/migrations/v0.12.md
```

## PR Review Process

1. **Automated checks** must pass (lint, type check, tests)
2. **At least one approval** from a code owner is required
3. **Crypto module changes** require approval from `@vvu-earth-tech/crypto`
4. **Infrastructure changes** require approval from `@vvu-earth-tech/infra`
5. **Security-sensitive changes** require additional review and may trigger a security audit

### Review Checklist

Reviewers will check:

- [ ] Code follows the project's coding standards
- [ ] Tests are adequate and passing
- [ ] No secrets or credentials in code
- [ ] No breaking changes without migration path
- [ ] Documentation is updated (if applicable)
- [ ] Constitutional rules are not violated
- [ ] Type safety is maintained (no `any` without justification)
- [ ] Error handling is appropriate
- [ ] Performance impact is acceptable

## Security Considerations

### Before Contributing

- **Never commit secrets**: API keys, passwords, tokens, private keys
- **Never weaken cryptographic guarantees**: No shortcuts, no "better ideas" that bypass the execution contract
- **Always validate inputs**: All external data must be validated before processing
- **Always use parameterized queries**: No string concatenation in SQL
- **Always use HTTPS**: No plaintext communication in production code
- **Report security issues**: Use security@vvu-earthtech.com, not public issues

### Cryptographic Contributions

If your contribution touches cryptographic code:

1. Reference the relevant ADR (Architecture Decision Record)
2. Ensure Ed25519 domain separation is maintained
3. Verify that RFC 8785 canonicalization is used for hashing
4. Do not introduce new hash algorithms without ADR approval
5. Include test vectors for new cryptographic operations

### Hard Failure Codes

The project uses Hard Failure (HF) codes for critical system constraints:

| Code | Constraint | Description |
|------|-----------|-------------|
| HF-001 | License verification | Unsigned or expired license blocks feature access |
| HF-002 | Cryptographic integrity | Hash/signature mismatch halts operation |
| HF-003 | Append-only violation | WORM storage write-after-delete rejected |
| HF-004 | Deterministic replay | Non-deterministic output detected |
| HF-005 | HBK hallucination | Brier Score > 0.02 triggers TRIP verdict |
| HF-006 | Schema validation | Invalid observation schema rejected |
| HF-007 | Policy evaluation | Non-deterministic policy result detected |
| HF-008 | Key rotation | Expired signing key rejected |
| HF-009 | mTLS authentication | Missing or invalid client certificate |
| HF-010 | Rate limiting | Request rate exceeds threshold |
| HF-011 | Audit trail | Missing audit log entry for critical operation |
| HF-012 | Feature gate | Feature access denied by license tier |

## Questions?

If you have questions about contributing, please:

1. Check existing [GitHub Issues](https://github.com/vvu-earth-tech/vvu-earth-tech/issues)
2. Check [GitHub Discussions](https://github.com/vvu-earth-tech/vvu-earth-tech/discussions)
3. Email dev@vvu-earthtech.com

Thank you for contributing to VVU Earth Tech!

# Coding Standards — VVU Earth Tech

## Overview

This document defines the coding standards for both the TypeScript (Next.js dashboard) and Python (ledger service) codebases. All contributors must follow these standards.

---

## Python Standards

### Style Guide

- **Formatter**: Black (line-length = 120)
- **Linter**: Ruff (target-version = "py311", line-length = 120)
- **Type Checker**: MyPy (strict mode, python_version = "3.11")
- **Python Version**: 3.11+

### Naming Conventions

| Element | Convention | Example |
|---------|-----------|---------|
| Modules | `snake_case` | `production_ledger.py` |
| Classes | `PascalCase` | `MerkleMountainRange` |
| Functions | `snake_case` | `compute_mmr_root()` |
| Constants | `UPPER_SNAKE_CASE` | `MAX_PROOF_DEPTH` |
| Private members | `_leading_underscore` | `_internal_hash()` |
| Type aliases | `PascalCase` | `FactId = str` |
| Enums | `PascalCase` | `class FactType(str, Enum)` |

### Type Safety

- All function signatures must have type hints (MyPy strict mode)
- Use `from __future__ import annotations` for forward references
- Use `typing.Optional[T]` or `T | None` for nullable values
- Use `typing.Protocol` for structural typing
- Use `@dataclass` or Pydantic models for structured data
- Never use `Any` without a comment explaining why
- Use `typing.cast()` only when the type system cannot infer the correct type

### Testing Requirements

- All new code must have unit tests
- Test files go in `vvu-earth-ledger/tests/`
- Use `pytest` with `hypothesis` for property-based testing
- Test naming: `test_<function>_<scenario>_<expected_result>`
- Minimum coverage: 80% for new code
- Adversarial tests for cryptographic code
- Benchmark tests for performance-critical paths

### Documentation

- All public functions must have docstrings (Google style)
- Module-level docstrings explaining the module's purpose
- Class docstrings with Attributes section
- Use `typing.Annotated` for field documentation where appropriate

### Error Handling

- Use custom exceptions from `exceptions.py`
- Never catch bare `Exception` — catch specific exceptions
- Use `raise ValueError(f"...")` for input validation errors
- Use `raise RuntimeError(f"...")` for internal consistency errors
- Use `logging` module for error reporting, never `print()`
- Use structured logging with `structlog` or standard `logging` with JSON formatter

### Logging

- Use the standard `logging` module
- Log levels: DEBUG, INFO, WARNING, ERROR, CRITICAL
- Use `logging.getLogger(__name__)` for module-level loggers
- Never log sensitive data (keys, passwords, PII)
- Use structured logging in production

---

## TypeScript Standards

### Style Guide

- **Linter**: ESLint (eslint-config-next)
- **Type Checker**: TypeScript (strict mode)
- **Formatter**: Prettier (via editor integration)
- **Runtime**: Node.js 18+, Bun (optional)

### Naming Conventions

| Element | Convention | Example |
|---------|-----------|---------|
| Files | `kebab-case.ts` | `acceptance-pipeline.ts` |
| Components | `PascalCase.tsx` | `TrustSphere.tsx` |
| Classes | `PascalCase` | `RuntimeKernel` |
| Functions | `camelCase` | `computeMmrRoot()` |
| Constants | `UPPER_SNAKE_CASE` | `MAX_PROOF_DEPTH` |
| Interfaces | `PascalCase` | `Fact` |
| Types | `PascalCase` | `FactId` |
| Enums | `PascalCase` | `FactType` |
| Hooks | `useCamelCase` | `useMobile()` |
| Private members | `_leading_underscore` | `_internalHash()` |

### Type Safety

- Use strict TypeScript (no `any` without justification)
- Use `interface` for object shapes, `type` for unions/intersections
- Use `enum` for fixed sets of values, `as const` for literal unions
- Use `readonly` for immutable data
- Use Zod for runtime validation of external data
- Use `@/` path alias for imports from `src/`
- Prefer `unknown` over `any` for truly unknown types
- Use discriminated unions for state machines

### Testing Requirements

- All kernel code must have deterministic tests
- Test files go in `src/__tests__/`
- Use `vitest` for testing
- All 12 kernel assertions must pass after any change
- Test naming: `describe('Unit') → it('should ...')`
- Use `@testing-library/react` for component tests
- Use `@tanstack/react-query` test utilities for data fetching tests

### Documentation

- Use JSDoc for exported functions and interfaces
- Use `@example` tags for complex usage patterns
- Document all public API endpoints
- Use inline comments for non-obvious logic
- Keep comments up-to-date with code changes

### Error Handling

- Use typed error classes (e.g., `KernelError`, `ProofError`)
- Never catch bare `unknown` — use type guards
- Use `Result<T, E>` pattern for fallible operations in kernel code
- Use `try/catch` for I/O operations (network, storage)
- Use React Error Boundaries for UI error handling
- Never silently swallow errors

### Logging

- Use `console.error()` for client-side errors in development
- Use structured logging for server-side code
- Use `sonner` (toast) for user-facing notifications
- Never log sensitive data (keys, passwords, PII)
- Use `next-auth` session for authentication context

---

## Shared Conventions

### Constitutional Rules (Inviolable)

1. **No simplification** — every rule in the Execution Contract is implemented
2. **No redesign** — no shortcuts, no "better ideas"
3. **No guessing** — if uncertain, re-read the contract
4. **No `Math.random()` / `Date.now()` / `crypto.randomUUID()`** in kernel code
5. **No `JSON.stringify()`** for hashing — only RFC 8785 (JCS)
6. **No FNV, CRC, or ad-hoc hashing** — only SHA-256
7. **Evidence is append-only** — WORM storage, no delete, no update

### Import Boundaries

- Open-source code (`/open-source/`) MUST NOT import from `/commercial/`
- Commercial code (`/commercial/`) MAY import from `/open-source/` and `/shared/`
- Shared code (`/shared/`) MUST NOT import from `/open-source/` or `/commercial/`
- Kernel code MUST NOT import from React or UI components
- API routes MUST NOT import from UI components directly

### File Organization

- One component per file (React components)
- One class per file (Python classes)
- Group related files in directories
- Use `index.ts` / `__init__.py` for public exports
- Keep files under 500 lines; split if larger

### Commit Messages

Follow [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>(<scope>): <description>

[optional body]

[optional footer(s)]
```

Types: `feat`, `fix`, `docs`, `style`, `refactor`, `perf`, `test`, `build`, `ci`, `chore`, `security`

### Security

- Never commit secrets, API keys, passwords, or private keys
- Always validate external inputs before processing
- Always use parameterized queries for database access
- Always use HTTPS in production code
- Use Ed25519 domain separation strings for all signature contexts
- Use RFC 8785 for canonicalization before hashing
- Report security issues to security@vvu-earthtech.com

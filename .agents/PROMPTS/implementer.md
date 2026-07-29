# Implementer Agent Prompt

You are an implementation agent for the VVU Earth Tech project. Your job is to write code that meets the project's standards and requirements.

## Coding Standards

### Python (vvu-earth-ledger/)
- **Formatter**: Black (line-length = 120)
- **Linter**: Ruff (target-version = "py311", line-length = 120)
- **Type Checker**: MyPy (strict mode, python_version = "3.11")
- **Naming**: snake_case for functions/variables, PascalCase for classes
- **Type hints**: Required on all function signatures
- **Docstrings**: Google style for all public functions
- **Imports**: `from __future__ import annotations` for forward references

### TypeScript (src/)
- **Linter**: ESLint (eslint-config-next)
- **Type Checker**: TypeScript (strict mode)
- **Naming**: camelCase for functions/variables, PascalCase for classes/components
- **Path aliases**: Use `@/` for imports from `src/`
- **Interfaces**: Use `interface` for object shapes, `type` for unions
- **Readonly**: Use `readonly` for immutable data

## Constitutional Rules (Inviolable)

1. **No simplification** — every rule in the Execution Contract is implemented
2. **No redesign** — no shortcuts, no "better ideas"
3. **No guessing** — if uncertain, re-read the contract
4. **No `Math.random()` / `Date.now()` / `crypto.randomUUID()`** in kernel code
5. **No `JSON.stringify()`** for hashing — only RFC 8785 (JCS)
6. **No FNV, CRC, or ad-hoc hashing** — only SHA-256
7. **Evidence is append-only** — WORM storage, no delete, no update

## Import Boundaries

- Open-source code (`/open-source/`) MUST NOT import from `/commercial/`
- Commercial code (`/commercial/`) MAY import from `/open-source/` and `/shared/`
- Shared code (`/shared/`) MUST NOT import from `/open-source/` or `/commercial/`
- Kernel code MUST NOT import from React or UI components
- API routes MUST NOT import from UI components directly

## Testing Requirements

### Before You Start
- Identify what needs to be tested
- Plan test cases for: happy path, edge cases, error conditions
- For cryptographic code: plan property-based tests

### While Implementing
- Write tests alongside code (TDD preferred)
- Use `vitest` for TypeScript, `pytest` for Python
- Use `hypothesis` for property-based testing (Python)
- Test naming: `describe('Unit') → it('should ...')` (TypeScript)
- Test naming: `test_<function>_<scenario>_<expected>` (Python)

### After Implementation
- Run all tests: `npm test` (TypeScript), `pytest` (Python)
- Run kernel verification: `npx tsx scripts/verify-kernel.ts`
- Run linter: `npm run lint` (TypeScript), `ruff check src/` (Python)
- Run type checker: `tsc --noEmit` (TypeScript), `mypy src/` (Python)

## Documentation Requirements

- All public functions must have docstrings (Python) or JSDoc (TypeScript)
- Module-level docstrings explaining the module's purpose
- Use `@example` tags for complex usage patterns
- Update README if adding new features or changing behavior
- Add ADR (Architecture Decision Record) for significant design decisions

## Error Handling

### Python
- Use custom exceptions from `exceptions.py`
- Never catch bare `Exception` — catch specific exceptions
- Use `raise ValueError(f"...")` for input validation errors
- Use `raise RuntimeError(f"...")` for internal consistency errors
- Always include context in error messages

### TypeScript
- Use typed error classes (e.g., `KernelError`, `ProofError`)
- Use `Result<T, E>` pattern for fallible operations in kernel code
- Use `try/catch` for I/O operations (network, storage)
- Use React Error Boundaries for UI error handling
- Never silently swallow errors

## Logging Requirements

### Python
- Use the standard `logging` module
- Use `logging.getLogger(__name__)` for module-level loggers
- Log levels: DEBUG, INFO, WARNING, ERROR, CRITICAL
- Never log sensitive data (keys, passwords, PII)
- Use structured logging in production

### TypeScript
- Use `console.error()` for client-side errors in development
- Use structured logging for server-side code
- Use `sonner` (toast) for user-facing notifications
- Never log sensitive data (keys, passwords, PII)
- Use `next-auth` session for authentication context

## Security Checklist

- [ ] No secrets in code
- [ ] Input validation on all external data
- [ ] Parameterized queries for database access
- [ ] Ed25519 domain separation strings for signatures
- [ ] RFC 8785 for canonicalization before hashing
- [ ] No XSS vectors
- [ ] No CSRF vulnerabilities
- [ ] Proper error handling (no information leakage)
- [ ] Secure defaults (fail closed, not open)

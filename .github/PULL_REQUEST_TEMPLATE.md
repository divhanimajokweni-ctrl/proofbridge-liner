## Description

Please include a summary of the changes and the related issue. Please also include relevant motivation and context.

Fixes # (issue)

## Type of Change

- [ ] 🐛 Bug fix (non-breaking change which fixes an issue)
- [ ] ✨ New feature (non-breaking change which adds functionality)
- [ ] 💥 Breaking change (fix or feature that would cause existing functionality to not work as expected)
- [ ] 📝 Documentation update
- [ ] 🔒 Security fix
- [ ] ⚡ Performance improvement
- [ ] ♻️ Refactoring (no functional changes)
- [ ] 🧪 Test addition or update
- [ ] 🔧 Build/CI/CD change

## Testing

Please describe the tests that you ran to verify your changes:

- [ ] Vitest tests pass (`npm test`)
- [ ] Python tests pass (`pytest`)
- [ ] Kernel assertions pass (`npx tsx scripts/verify-kernel.ts`)
- [ ] Lint passes (`npm run lint`)
- [ ] Type check passes (`tsc --noEmit` / `mypy src/`)
- [ ] Manual testing performed

### Test Details

[Describe any manual testing performed, including browser/OS/environment]

## Checklist

- [ ] My code follows the project's coding standards (see CONTRIBUTING.md)
- [ ] I have performed a self-review of my own code
- [ ] I have commented my code, particularly in hard-to-understand areas
- [ ] I have made corresponding changes to the documentation
- [ ] My changes generate no new lint warnings
- [ ] My changes generate no new type errors
- [ ] I have added tests that prove my fix is effective or that my feature works
- [ ] New and existing unit tests pass locally with my changes
- [ ] Any dependent changes have been merged and published in downstream modules
- [ ] I have checked my code and corrected any misspellings
- [ ] I have verified that no secrets are committed

### Breaking Changes

If this PR includes breaking changes:

- [ ] I have documented the breaking changes in the PR description
- [ ] I have provided a migration guide
- [ ] I have updated the CHANGELOG.md
- [ ] I have bumped the major or minor version as appropriate

## Security Considerations

- [ ] This change does not introduce any new secrets or credentials
- [ ] This change does not weaken cryptographic guarantees
- [ ] This change does not introduce any new attack vectors
- [ ] If this change touches cryptographic code, I have referenced the relevant ADR
- [ ] If this change modifies the acceptance pipeline, I have verified deterministic replay
- [ ] If this change modifies the MMR, I have verified proof generation and verification

### Constitutional Rules Check

- [ ] No simplification — all rules in the Execution Contract are implemented
- [ ] No redesign — no shortcuts, no "better ideas"
- [ ] No `Math.random()` / `Date.now()` / `crypto.randomUUID()` in kernel code
- [ ] No `JSON.stringify()` for hashing — only RFC 8785
- [ ] No FNV, CRC, or ad-hoc hashing — only SHA-256
- [ ] Evidence is append-only — WORM storage, no delete, no update

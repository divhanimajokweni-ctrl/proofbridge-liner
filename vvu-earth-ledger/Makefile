# ============================================================================
# Makefile — VVU Earth Tech Ledger
# ============================================================================

.PHONY: help install test lint typecheck build wheel sdist docker \
        checksums sign release clean run docker-build docker-run \
        benchmark docs

# Default target
help:
	@echo "VVU Earth Tech Ledger — Available targets:"
	@echo ""
	@echo "  install       Install the package in development mode"
	@echo "  test          Run all tests with coverage"
	@echo "  lint          Run ruff, mypy, and bandit"
	@echo "  typecheck     Run mypy type checking"
	@echo "  build         Build wheel and source distribution"
	@echo "  wheel         Build Python wheel"
	@echo "  sdist         Build source distribution"
	@echo "  docker        Build Docker image"
	@echo "  checksums     Generate SHA256SUMS for release artifacts"
	@echo "  sign          Sign artifacts with GPG"
	@echo "  release       Full release pipeline (wheel + sdist + checksums + sign)"
	@echo "  clean         Remove build artifacts and caches"
	@echo "  run           Run the ledger CLI"
	@echo "  docker-build  Build the Docker image"
	@echo "  docker-run    Run the ledger via Docker Compose"
	@echo "  benchmark     Run benchmarks"
	@echo "  docs          Build documentation"

# ---- Install ----
install:
	pip install -e ".[dev]"

# ---- Test ----
test:
	bash scripts/test.sh

# ---- Lint ----
lint:
	bash scripts/lint.sh

# ---- Typecheck ----
typecheck:
	python -m mypy src/production_ledger

# ---- Build (wheel + sdist) ----
build: wheel sdist

# ---- Wheel ----
wheel:
	python -m build --wheel

# ---- Source Distribution ----
sdist:
	python -m build --sdist

# ---- Docker ----
docker:
	docker build -t production-ledger:latest .

# ---- Checksums ----
checksums:
	bash ../scripts/checksums.sh

# ---- Sign ----
sign:
	@if [ ! -f dist/SHA256SUMS ]; then echo "Error: SHA256SUMS not found. Run 'make checksums' first."; exit 1; fi
	gpg --detach-sign --armor dist/SHA256SUMS
	@echo "Signed dist/SHA256SUMS.asc"

# ---- Release Pipeline ----
release: clean test lint build checksums sign
	@echo "Release pipeline complete. Artifacts in dist/"
	@ls -la dist/

# ---- Clean ----
clean:
	rm -rf build/ dist/ *.egg-info htmlcov/ .coverage .mypy_cache/ .ruff_cache/
	rm -rf data/ledger.db data/ledger.db-wal data/ledger.db-shm
	find . -type d -name __pycache__ -exec rm -rf {} + 2>/dev/null || true
	find . -type f -name "*.pyc" -delete 2>/dev/null || true

# ---- Run ----
run:
	ledger --help

# ---- Docker (legacy aliases) ----
docker-build:
	docker build -t production-ledger:latest .

docker-run:
	docker compose up -d

# ---- Benchmark ----
benchmark:
	python -m pytest tests/ -v --benchmark-only --benchmark-autosave 2>/dev/null || \
	python -m pytest tests/ -v -k "benchmark" || \
	echo "Install pytest-benchmark for benchmark support: pip install pytest-benchmark"

# ---- Documentation ----
docs:
	@if [ -d docs ]; then \
		cd docs && python -m sphinx -b html source _build/html 2>/dev/null || \
		echo "Install sphinx for documentation: pip install sphinx"; \
	else \
		echo "No docs directory found. Create docs/ with sphinx-quickstart."; \
	fi

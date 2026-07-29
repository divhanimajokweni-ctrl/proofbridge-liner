# ============================================================================
# Makefile — VVU Earth Tech Ledger
# ============================================================================

.PHONY: install test lint build clean run docker-build docker-run

# Default target
help:
	@echo "VVU Earth Tech Ledger — Available targets:"
	@echo ""
	@echo "  install       Install the package in development mode"
	@echo "  test          Run all tests with coverage"
	@echo "  lint          Run ruff, mypy, and bandit"
	@echo "  build         Build wheel and source distribution"
	@echo "  clean         Remove build artifacts and caches"
	@echo "  run           Run the ledger CLI"
	@echo "  docker-build  Build the Docker image"
	@echo "  docker-run    Run the ledger via Docker Compose"

# ---- Install ----
install:
	pip install -e ".[dev]"

# ---- Test ----
test:
	bash scripts/test.sh

# ---- Lint ----
lint:
	bash scripts/lint.sh

# ---- Build ----
build:
	bash scripts/build.sh

# ---- Clean ----
clean:
	rm -rf build/ dist/ *.egg-info htmlcov/ .coverage .mypy_cache/ .ruff_cache/
	rm -rf data/ledger.db data/ledger.db-wal data/ledger.db-shm
	find . -type d -name __pycache__ -exec rm -rf {} + 2>/dev/null || true
	find . -type f -name "*.pyc" -delete 2>/dev/null || true

# ---- Run ----
run:
	ledger --help

# ---- Docker ----
docker-build:
	docker build -t production-ledger:latest .

docker-run:
	docker compose up -d

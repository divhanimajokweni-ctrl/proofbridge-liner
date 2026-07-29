# ============================================================================
# Stage 1: Build with dev dependencies
# ============================================================================
FROM python:3.11-slim AS builder

WORKDIR /build

# Install build dependencies
RUN pip install --no-cache-dir --upgrade pip setuptools wheel build

# Copy project files
COPY pyproject.toml ./
COPY src/ ./src/

# Build the wheel
RUN python -m build

# ============================================================================
# Stage 2: Runtime with only production dependencies
# ============================================================================
FROM python:3.11-slim AS runtime

LABEL maintainer="VVU Earth Tech"
LABEL description="Production Ledger — Deterministic, cryptographically verifiable production ledger"
LABEL version="0.1.0"

# Install runtime system dependencies
RUN apt-get update && \
    apt-get install -y --no-install-recommends \
        ca-certificates \
        tini && \
    rm -rf /var/lib/apt/lists/*

# Create non-root user
RUN groupadd -r ledger && \
    useradd -r -g ledger -d /home/ledger -s /sbin/nologin ledger

# Create application directories
RUN mkdir -p /app/data /app/configs /app/logs && \
    chown -R ledger:ledger /app

WORKDIR /app

# Copy the built wheel from the builder stage
COPY --from=builder /build/dist/*.whl /tmp/

# Install the wheel (production dependencies only)
RUN pip install --no-cache-dir /tmp/*.whl && \
    rm -rf /tmp/*.whl

# Copy configuration files
COPY configs/ /app/configs/

# Switch to non-root user
USER ledger

# Environment variables
ENV LEDGER_CONFIG=/app/configs/production.toml
ENV LEDGER_DATA_DIR=/app/data
ENV LEDGER_LOG_DIR=/app/logs

# Expose the default API port
EXPOSE 50051

# Health check
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
    CMD python -c "import urllib.request; urllib.request.urlopen('http://localhost:50051/health')" || exit 1

# Entry point
ENTRYPOINT ["tini", "--"]
CMD ["ledger", "serve", "--config", "/app/configs/production.toml", "--host", "0.0.0.0", "--port", "50051"]

# Multi-stage build
FROM python:3.11-slim as builder
WORKDIR /app
# Install system dependencies
RUN apt-get update && apt-get install -y \
    gcc \
    && rm -rf /var/lib/apt/lists/*
# Copy pyproject.toml
COPY pyproject.toml .
# Install dependencies
RUN pip install --no-cache-dir -e .
# Final stage
FROM python:3.11-slim
WORKDIR /app
# Install runtime dependencies only
RUN apt-get update && apt-get install -y \
    postgresql-client \
    && rm -rf /var/lib/apt/lists/*
# Copy Python packages from builder
COPY --from=builder /usr/local/lib/python3.11/site-packages /usr/local/lib/python3.11/site-packages
COPY --from=builder /usr/local/bin /usr/local/bin
# Copy application code
COPY src/ src/
# ✅ Copy alembic config (was missing — caused "No script_location" error)
COPY alembic.ini .
# Expose port
EXPOSE 8000
# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD python -c "import requests; requests.get('http://localhost:8000/health')" || exit 1
# Run application
CMD ["python", "-m", "uvicorn", "src.main:app", "--host", "0.0.0.0", "--port", "8000"]
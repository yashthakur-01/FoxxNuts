# ----- Build stage --------------------------------------------------------
FROM python:3.12-slim AS builder
WORKDIR /app

# System deps for compiling wheels (PyMuPDF, etc.)
RUN apt-get update && apt-get install -y --no-install-recommends \
        build-essential gcc libmupdf-dev libfreetype6-dev \
        libharfbuzz-dev libjpeg-dev libopenjp2-7-dev && \
    rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt

COPY . .

# ----- Runtime stage ------------------------------------------------------
FROM python:3.12-slim AS runner
WORKDIR /app
ENV PYTHONUNBUFFERED=1
ENV PYTHONDONTWRITEBYTECODE=1

# Runtime libs needed by PyMuPDF (fitz)
RUN apt-get update && apt-get install -y --no-install-recommends \
        libmupdf-dev libfreetype6 libharfbuzz0b \
        libjpeg62-turbo libopenjp2-7 && \
    rm -rf /var/lib/apt/lists/*

# Copy installed packages + app source from builder
COPY --from=builder /usr/local/lib/python3.12/site-packages /usr/local/lib/python3.12/site-packages
COPY --from=builder /usr/local/bin /usr/local/bin
COPY --from=builder /app /app

EXPOSE 8000

# Default: run FastAPI via uvicorn (overridden for celery in docker-compose)
# CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
COPY start.sh .
RUN chmod +x start.sh
CMD ["./start.sh"]

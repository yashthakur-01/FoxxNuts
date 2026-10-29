# ----- Build stage --------------------------------------------------------
FROM python:3.12-slim AS builder
WORKDIR /app

COPY requirements.txt .
RUN pip install --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt && \
    python -m nltk.downloader -d /usr/local/share/nltk_data punkt punkt_tab stopwords

COPY . .

# ----- Runtime stage ------------------------------------------------------
FROM python:3.12-slim AS runner
WORKDIR /app
ENV PYTHONUNBUFFERED=1
ENV PYTHONDONTWRITEBYTECODE=1
ENV NLTK_DATA=/usr/local/share/nltk_data

# Copy installed packages + nltk data + app source from builder
COPY --from=builder /usr/local/lib/python3.12/site-packages /usr/local/lib/python3.12/site-packages
COPY --from=builder /usr/local/bin /usr/local/bin
COPY --from=builder /usr/local/share/nltk_data /usr/local/share/nltk_data
COPY --from=builder /app /app

EXPOSE 8000

# Default: run FastAPI via start.sh (celery worker runs in its own dedicated container in docker-compose)
COPY start.sh .
RUN chmod +x start.sh
CMD ["./start.sh"]



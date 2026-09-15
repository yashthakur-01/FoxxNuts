#!/bin/bash
celery -A app.celery_app.celery_app worker \
  --loglevel=info --concurrency=1 \
  --without-gossip --without-mingle &

uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8000}

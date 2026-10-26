#!/bin/bash
# Start Celery worker locally for FoxxNuts background document ingestion & deletion

# Resolve virtualenv Celery binary if present
if [ -f "../venv/bin/celery" ]; then
    CELERY_BIN="../venv/bin/celery"
elif [ -f "venv/bin/celery" ]; then
    CELERY_BIN="venv/bin/celery"
else
    CELERY_BIN="celery"
fi

echo "🚀 Starting Celery worker locally using $CELERY_BIN..."
exec $CELERY_BIN -A app.celery_app.celery_app worker \
    --loglevel=info \
    --concurrency=1 \
    --without-gossip \
    --without-mingle \
    --without-heartbeat

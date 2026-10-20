#!/bin/bash
# Start FastAPI backend via uvicorn
# (Celery worker runs in its own dedicated container in docker-compose)
exec uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8000}


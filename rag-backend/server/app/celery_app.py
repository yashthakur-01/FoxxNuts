import os
from celery import Celery
from celery.signals import worker_ready, worker_shutdown
from dotenv import load_dotenv

load_dotenv()

# Redis URL configuration (defaults to localhost:6379/0)
REDIS_URL = os.environ.get("REDIS_URL", "redis://localhost:6379/0")

celery_app = Celery(
    "rag_tasks",
    broker=REDIS_URL,
    backend=REDIS_URL,
    include=["app.tasks"]
)

celery_app.conf.update(
    task_serializer="json",
    result_serializer="json",
    accept_content=["json"],
    timezone="UTC",
    enable_utc=True,
    task_track_started=True,
    imports=["app.tasks"],
)

@worker_ready.connect
def on_worker_ready(**kwargs):
    print("=" * 65)
    print("🟢 [Celery Worker] Worker initialized and ready!")
    print(f"📦 [Celery Worker] Connected to Redis broker at: {REDIS_URL}")
    print("⚡ [Celery Worker] Listening for background document ingestion & deletion tasks...")
    print("=" * 65)

@worker_shutdown.connect
def on_worker_shutdown(**kwargs):
    print("🛑 [Celery Worker] Shutting down Celery worker...")

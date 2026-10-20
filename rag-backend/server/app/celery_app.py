import os
import ssl
from celery import Celery
from celery.signals import worker_ready, worker_shutdown
from dotenv import load_dotenv

load_dotenv()

def get_redis_url() -> str:
    """
    Resolves the Redis connection URI.
    Automatically constructs standard rediss:// TLS connection from Upstash REST variables if REDIS_URL is not set.
    Ensures ssl_cert_reqs parameter is appended for rediss:// schemes to satisfy Celery RedisBackend requirement.
    """
    url = os.environ.get("REDIS_URL")
    if not url:
        upstash_url = os.environ.get("UPSTASH_REDIS_REST_URL")
        upstash_token = os.environ.get("UPSTASH_REDIS_REST_TOKEN")
        if upstash_url and upstash_token:
            host = upstash_url.replace("https://", "").replace("http://", "").strip("/")
            url = f"rediss://default:{upstash_token}@{host}:6379"
        else:
            url = "redis://localhost:6379/0"

    # Celery RedisBackend requires ssl_cert_reqs query parameter when using rediss://
    if url.startswith("rediss://") and "ssl_cert_reqs" not in url:
        delimiter = "&" if "?" in url else "?"
        url = f"{url}{delimiter}ssl_cert_reqs=required"

    return url

REDIS_URL = get_redis_url()
is_ssl = REDIS_URL.startswith("rediss://")

celery_app = Celery(
    "rag_tasks",
    broker=REDIS_URL,
    backend=REDIS_URL,
    include=["app.tasks"]
)

celery_config = {
    "task_serializer": "json",
    "result_serializer": "json",
    "accept_content": ["json"],
    "timezone": "UTC",
    "enable_utc": True,
    "task_track_started": True,
    "imports": ["app.tasks"],
}

celery_config["broker_transport_options"] = {
    "polling_interval": 10,
    "visibility_timeout": 3600,
}

# Apply SSL configuration when connecting to Upstash / TLS-enabled Redis
if is_ssl:
    celery_config["broker_use_ssl"] = {"ssl_cert_reqs": ssl.CERT_REQUIRED}
    celery_config["redis_backend_use_ssl"] = {"ssl_cert_reqs": ssl.CERT_REQUIRED}

celery_app.conf.update(celery_config)

@worker_ready.connect
def on_worker_ready(**kwargs):
    # Sanitize logged URL to avoid printing credentials in logs
    sanitized_url = REDIS_URL.split("@")[-1] if "@" in REDIS_URL else REDIS_URL
    print("=" * 65)
    print("🟢 [Celery Worker] Worker initialized and ready!")
    print(f"📦 [Celery Worker] Connected to Redis broker at: ...@{sanitized_url}")
    print("⚡ [Celery Worker] Listening for background document ingestion & deletion tasks...")
    print("=" * 65)

@worker_shutdown.connect
def on_worker_shutdown(**kwargs):
    print("🛑 [Celery Worker] Shutting down Celery worker...")

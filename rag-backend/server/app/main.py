import os
import time
from contextlib import asynccontextmanager
from dotenv import load_dotenv
from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
import redis

# Import your routers
from app.routes.MessageRoute import router as message_router
from app.routes.FileProcessRoute import router as file_process_router

load_dotenv()

FASTAPI_SECRET_KEY = os.getenv("FASTAPI_SECRET_KEY")
REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379/0")

@asynccontextmanager
async def lifespan(app: FastAPI):
    print("=" * 65)
    print("🚀 [FoxxNuts Backend] Initializing Server & Infrastructure Services...")
    print("=" * 65)
    
    # 1. Test Redis Connection
    try:
        r = redis.Redis.from_url(REDIS_URL, socket_timeout=2)
        r.ping()
        print(f"🟢 [Redis Cache & Broker] Connected successfully at: {REDIS_URL}")
    except Exception as e:
        print(f"🟡 [Redis Warning] Could not connect to Redis at {REDIS_URL}: {e}")

    # 2. Celery Tasks Registration Information
    print("🟢 [Celery Worker Tasks] Registered background tasks:")
    print("   • process_document_task   (PDF Ingestion & Embeddings)")
    print("   • reprocess_document_task (Re-chunking & Re-embedding)")
    print("   • delete_document_task    (Vector purge & File cleanup)")
    print("   • delete_workspace_task   (Full Workspace & File Deletion)")


    # 3. FastAPI HTTP Server
    print("🟢 [FastAPI Server] Application started and listening for requests.")
    print("=" * 65)

    yield

    print("🛑 [FoxxNuts Backend] Server is shutting down...")

app = FastAPI(lifespan=lifespan)

@app.middleware("http")
async def verify_nextjs_authorization(request: Request, call_next):
    # Skip authorization for root endpoint or health checks
    if request.url.path == "/" or request.url.path.startswith("/docs") or request.url.path.startswith("/openapi.json"):
        return await call_next(request)
        
    # Get the authorization header that Next.js sends
    api_key = request.headers.get("X-API-Key")
    
    # Check if the header exists and matches our secret
    if not api_key or api_key != FASTAPI_SECRET_KEY:
        return JSONResponse(
            status_code=401,
            content={"message": "Unauthorized. Invalid or missing API key.", "success": False}
        )
        
    # If authorized, proceed to the actual route
    response = await call_next(request)
    return response

@app.middleware("http")
async def add_process_time_header(request: Request, call_next):
    start_time = time.time()
    
    # Process the request
    response = await call_next(request)
    
    process_time = time.time() - start_time
    response.headers["X-Process-Time"] = str(process_time)
    print(f"[{request.method}] {request.url.path} - Completed in {process_time:.3f}s")
    
    return response

# Include the routers
app.include_router(message_router)
app.include_router(file_process_router)

@app.get("/")
def home():
    return {
        "message": "API running",
        "status": "online"
    }
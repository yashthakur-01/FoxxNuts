# External Integrations

**Analysis Date:** 2026-10-19

## APIs & External Services

**LLM & Model Providers:**
- Groq Cloud API - Ultra-low-latency model inference (default: `openai/gpt-oss-120b`, `llama-3.3-70b-versatile`)
  - SDK/Client: `langchain-openai` (configured with `base_url="https://api.groq.com/openai/v1"`) in `rag-backend/server/app/controllers/agent_engine.py`
  - Auth: API key via `GROQ_API_KEY` env var
  - Usage: Primary generative model for grounded responses, generic replies, and judge evaluations
- OpenAI API - Alternative generative inference provider
  - SDK/Client: `langchain-openai` in `rag-backend/server/app/controllers/agent_engine.py`
  - Auth: API key via `OPENAI_API_KEY` env var
- Google Gemini API - Alternative generative model provider
  - SDK/Client: `langchain-google-genai` (`ChatGoogleGenerativeAI`) in `rag-backend/server/app/controllers/agent_engine.py`
  - Auth: API key via `GEMINI_API_KEY` env var
- Cohere API - Dense vector text embeddings
  - SDK/Client: `langchain-cohere` (`CohereEmbeddings`) in `rag-backend/server/app/controllers/1_embedding_pipeline.py`
  - Model: `embed-english-v3.0` (or configured via `COHERE_MODEL`)
  - Auth: API key via `COHERE_API_KEY` env var
- Jina AI - Cross-encoder neural document reranking (optional accelerator)
  - SDK/Client: `langchain_community.document_compressors.JinaRerank` with `jina-reranker-v2-base-multilingual` in `rag-backend/server/app/controllers/2_query_pipeline.py`
  - Auth: API key via `JINA_API_KEY` env var (automatically falls back to direct Pinecone search if absent)
- Tavily Search API - Real-time web search fallback for dynamic queries
  - SDK/Client: `langchain-tavily` in `rag-backend/server/app/controllers/agent_engine.py`
  - Auth: API key via `TAVILY_API_KEY` env var

## Data Storage

**Relational Database:**
- Supabase (PostgreSQL with Row-Level Security)
  - Connection & Client (Next.js): `@supabase/ssr` for browser/server session management, `@supabase/supabase-js` via service role proxy in `client/src/supabase/adminClient.ts`
  - Connection & Client (Python): `supabase` Python SDK in `rag-backend/server/supabase_client/client.py`
  - Core Tables: `public.users`, `public.workspace`, `public.messages`, `public.files`, `public.agent_traces`
  - Migrations / Schema: Defined in SQL files `client/src/supabase/schema.sql` and `rag-backend/server/supabase_client/schema.sql`

**Vector Database:**
- Pinecone Serverless Hybrid Index
  - Connection & Client: `pinecone` and `pinecone-text` in `rag-backend/server/app/controllers/1_embedding_pipeline.py`
  - Auth: `PINECONE_API_KEY` and index specified in `PINECONE_INDEX`
  - Index Type: Hybrid search combining dense Cohere 1024-dimension vectors with sparse BM25 token frequencies
  - Metadata Filters: Multi-tenant isolation enforced via `customerId` and `workspaceId` metadata fields

**File & Object Storage:**
- Cloudflare R2 (S3-Compatible Object Store)
  - SDK/Client (Next.js): `@aws-sdk/client-s3` and `@aws-sdk/s3-request-presigner` in `client/src/cloudflare/client.ts`
  - SDK/Client (Python): `boto3` S3 client in `rag-backend/server/app/tasks.py` and `rag-backend/server/app/controllers/1_embedding_pipeline.py`
  - Auth: `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_ENDPOINT_URL`, bucket name in `R2_BUCKET_NAME`
  - Pattern: Direct browser-to-R2 uploads using presigned PUT URLs with byte-length locks (`client/src/app/api/customer/uploadFile/route.ts`), keeping file transfers off the web server

**Caching & In-Memory Storage:**
- Redis 7.x
  - Client (Next.js): `ioredis` singleton in `client/src/lib/redisClient.ts`
  - Client (Python): `redis` Python SDK in `rag-backend/server/app/helpers/cache.py`
  - Connection: `REDIS_URL` (default: `redis://localhost:6379/0`)
  - Data structures used:
    - String keys: Workspace configs (`workspace_config:{workspace_id}`, TTL 300s), telemetry metrics (`observability_metrics:{workspace_id}`, TTL 600s), FAQ query cache (`embed_faq_cache:{workspace_id}:{hash}`, TTL 3600s)
    - List keys: Chat message histories (`chat_history:{session_id}`, TTL 3600s, max 20 items)
    - Set keys: Observability tracker sets (`workspace_trace_keys:{workspace_id}`) for $O(1)$ batch cache purge
    - Sorted Sets (ZSET): Sliding-window rate limit counters (`ratelimit:{tier_key}`)

## Authentication & Identity

**Auth Provider:**
- Supabase Auth (GoTrue)
  - Implementation: Cookie-based SSR authentication via `@supabase/ssr` (`client/src/supabase/serverClient.ts` and `client/src/supabase/proxyClient.ts`)
  - Session Management: JWT bearer tokens stored in HTTP-only cookies; token refresh handled automatically by Next.js edge proxy (`client/src/proxy.ts`)
  - In-Memory Auth Cache: 60-second TTL in-memory user session cache (`client/src/lib/authCache.ts`) to avoid repetitive Supabase Auth API calls on successive client requests
  - User Sync Trigger: PostgreSQL trigger `on_auth_user_created` automatically copies newly created `auth.users` records into `public.users`

## Internal Service Communication

**Next.js to FastAPI Boundary:**
- Protocol: HTTP REST & Server-Sent Events (SSE) streaming
- Endpoints:
  - `POST /api/chat` - Chatbot RAG query streaming (`rag-backend/server/app/routes/MessageRoute.py`)
  - `POST /api/process-document` - Background PDF ingestion trigger (`rag-backend/server/app/routes/FileProcessRoute.py`)
  - `POST /api/reprocess-document` - Background vector purge and re-embedding (`rag-backend/server/app/routes/FileProcessRoute.py`)
  - `DELETE /api/delete-document` - Background vector purge (`rag-backend/server/app/routes/FileProcessRoute.py`)
  - `POST /api/delete-workspace` - Full workspace purge (`rag-backend/server/app/routes/FileProcessRoute.py`)
  - `GET /api/task-status/{task_id}` - Polling Celery background task state (`rag-backend/server/app/routes/FileProcessRoute.py`)
  - `POST /api/invalidate-workspace-cache` - Cache invalidation sync (`rag-backend/server/app/routes/MessageRoute.py`)
- Auth: Shared secret header `X-API-Key: FASTAPI_SECRET_KEY` verified via FastAPI middleware (`rag-backend/server/app/main.py`)

**FastAPI to Celery Worker:**
- Protocol: Redis Message Broker (`celery[redis]`)
- Broker Connection: `REDIS_URL` via `rag-backend/server/app/celery_app.py`
- Queue Tasks: `process_document_task`, `reprocess_document_task`, `delete_document_task`, `delete_workspace_task` (`rag-backend/server/app/tasks.py`)

## Monitoring & Observability

**Built-In Observability Subsystem:**
- Telemetry Engine: Custom execution tracer in `rag-backend/server/app/helper/obseravable_node.py` logs millisecond timings, token consumptions, and node routing decisions
- Database Storage: Permanent trace logging into `public.agent_traces` table (query, final response, total duration, tokens, trajectory array, error messages, query-context pairs, query type)
- Rate Analytics: Computed dynamically over 60s and 24h sliding windows:
  - RPM (Requests Per Minute) & TPM (Tokens Per Minute)
  - RPD (Requests Per Day) & TPD (Tokens Per Day)
  - Context Found Rate & CSAT Score (derived from thumbs up/down in `public.messages`)
- Knowledge Gap Detection: Scans genuine queries where vector similarity returned no context or empty results (`client/src/app/api/customer/observability/gaps/route.ts`)

**Logs:**
- Standard output / container logs formatted with distinct emoji tags (`[Agent Trajectory]`, `[Celery Worker]`, `[FastAPI Server]`, `[Next.js Redis Warning]`)

## CI/CD & Deployment

**Hosting:**
- Docker Compose specification (`docker-compose.yml`) for multi-service local or VPS deployment
- Containers:
  - `foxnutts_client` (Port 3000)
  - `foxnutts_server` (Port 8000)
  - `foxnutts_celery` (Background task worker)
- Production readiness: Container restart policies (`restart: unless-stopped`) and Docker build arguments for Supabase public keys

**Environment Configuration:**
- Development: Local `.env` files in `client/` and `rag-backend/server/`
- Production: Injected via Docker environment or host deployment manager
- Secrets Management: Credentials isolated to server-side environments; only `NEXT_PUBLIC_` prefixed variables exposed to client browser

## Webhooks & Callbacks

**Incoming:**
- None external (no third-party webhooks such as Stripe or GitHub configured)

**Outgoing:**
- None

---

*Integration audit: 2026-10-19*
*Update when adding/removing external services*

# Architecture

**Analysis Date:** 2026-10-19

## Pattern Overview

**Overall:** Polyglot Distributed Microservices Architecture (Next.js 16 + FastAPI + Celery + Redis + Supabase + Pinecone + Cloudflare R2)

**Key Characteristics:**
- **Decoupled Frontend / Backend Separation:** Next.js 16 (React 19) serves as the presentation layer, customer dashboard, and security proxy, while Python FastAPI handles asynchronous AI pipelines and streaming.
- **Stateful Multi-Node LangGraph Orchestration:** Replaces rigid single-pass prompt chains with a cyclic state machine featuring dynamic intent classification, context retrieval, grounded generation, and autonomous response evaluation.
- **Asynchronous Ingestion Pipeline:** Document parsing and vectorization are offloaded to an asynchronous Celery worker running over Redis, ensuring sub-10ms HTTP response times when uploading files.
- **Multi-Tier In-Memory Caching & $O(1)$ Purge:** Leverages Redis for workspace configs (5m TTL), session message histories (1h TTL), embed FAQ answers (1h TTL), and Set tracking (`workspace_trace_keys:{workspace_id}`) for instant trace cache invalidation.
- **Strict Multi-Tenant Isolation:** Enforced via PostgreSQL Row-Level Security (RLS) policies in Supabase and tenant-specific metadata filters (`customerId`, `workspaceId`) in Pinecone vector search.

## Layers

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ 1. Frontend & Client Presentation Layer (Next.js 16 / React 19)              │
│    - Dashboard: Chatbot, Knowledge Base, Observability, Configuration, Embed │
│    - Embeddable Widget: widget.v1.js loader + /embed standalone view         │
│    - Context Providers: WorkspaceContext, ThemeContext, ToastContext         │
└──────────────────────────────────────┬──────────────────────────────────────┘
                                       │ HTTP / Cookies / SSE
┌──────────────────────────────────────▼──────────────────────────────────────┐
│ 2. Next.js API Gateway & Edge Security Layer (App Router)                   │
│    - Auth Edge Proxy: client/src/proxy.ts (Session validation & redirects)   │
│    - Rate Limiter: client/src/lib/rateLimit.ts (Sliding window ZSET in Redis)│
│    - In-Memory Auth Cache: client/src/lib/authCache.ts (60s TTL cache)       │
│    - API Routes: /api/chat/*, /api/customer/*, /api/embed/*                 │
└──────────────────────────────────────┬──────────────────────────────────────┘
                                       │ HTTP + X-API-Key (FASTAPI_SECRET_KEY)
┌──────────────────────────────────────▼──────────────────────────────────────┐
│ 3. FastAPI Service & Routing Layer (rag-backend/server)                      │
│    - App Entry: app/main.py (Lifespan checks, API-key authorization)         │
│    - Chat Router: app/routes/MessageRoute.py (/api/chat streaming SSE)       │
│    - File Router: app/routes/FileProcessRoute.py (Celery task dispatch)      │
└──────────────────────────────────────┬──────────────────────────────────────┘
                                       │
         ┌─────────────────────────────┴─────────────────────────────┐
         ▼                                                           ▼
┌─────────────────────────────────────────┐ ┌─────────────────────────────────┐
│ 4. LangGraph Multi-Node Agent Engine    │ │ 5. Asynchronous Task Worker     │
│    (app/controllers/agent_engine.py)    │ │    (Celery + Redis Broker)      │
│    - Router: genuine vs generic         │ │    - PDF download from R2       │
│    - Context Retriever (Pinecone)       │ │    - Text cleaning & chunking   │
│    - Chatbot Generation (LLM)           │ │    - Cohere vector embeddings   │
│    - Evaluator Judge (Quality check)    │ │    - Pinecone vector upsert     │
│    - Query Rephraser (Self-correction)  │ │    - Status update in Supabase  │
└─────────────────────────────────────────┘ └─────────────────────────────────┘
                                       │
┌──────────────────────────────────────▼──────────────────────────────────────┐
│ 6. Storage & Infrastructure Layer                                            │
│    - Supabase (PostgreSQL + RLS): Users, Workspaces, Messages, Traces, Files│
│    - Redis: Workspace config, Chat history, Rate limit ZSET, Set trackers   │
│    - Cloudflare R2: S3-compatible raw PDF and document storage               │
│    - Pinecone: Dense (Cohere) + Sparse (BM25) hybrid vector index           │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Detailed Layer Responsibilities

**1. Frontend & Client Presentation Layer (`client/src/`):**
- Purpose: Provides responsive customer portal and dashboard for managing chatbots, viewing analytics, configuring LLMs, and testing chat responses.
- Contains: React Server & Client Components (`components/`), UI primitives (`components/ui/`), dashboard pages (`app/dashboard/`), and embed widget (`public/widget.v1.js`).
- Depends on: Next.js API routes and Supabase browser client.

**2. Next.js API Gateway Layer (`client/src/app/api/`):**
- Purpose: Mediates between browser users and internal backend infrastructure, securing credentials and enforcing tenant boundaries.
- Contains: Route handlers for customer actions, file presigning, chat proxying, and observability calculation.
- Depends on: Supabase Admin client, Redis client, Cloudflare R2 client, and FastAPI HTTP service.

**3. FastAPI Service Layer (`rag-backend/server/app/main.py`):**
- Purpose: High-speed asynchronous Python server handling streaming chat responses and background task dispatches.
- Contains: Authentication middleware (`verify_nextjs_authorization`), timing middleware (`add_process_time_header`), and route controllers.
- Depends on: LangGraph agent engine, Celery task broker, and Redis cache.

**4. LangGraph Agent Engine Layer (`rag-backend/server/app/controllers/agent_engine.py`):**
- Purpose: Multi-node stateful workflow that grounds responses in retrieved documents and self-evaluates answer quality.
- Contains: Routing nodes, context retrieval nodes, chatbot completion nodes, evaluation nodes, and query rephrase cycles.
- Depends on: Pinecone hybrid retriever, Cohere embeddings, and configured LLM providers (Groq/OpenAI/Gemini).

**5. Asynchronous Task Worker (`rag-backend/server/app/tasks.py`):**
- Purpose: Non-blocking background worker for compute-heavy document ingestion and vector maintenance.
- Contains: Tasks for `process_document_task`, `reprocess_document_task`, `delete_document_task`, and `delete_workspace_task`.
- Depends on: PyMuPDF parsing, Cohere embeddings, Pinecone index, and Cloudflare R2.

## Data Flow

### 1. RAG Chat Stream Trajectory

```
User Message ──> Next.js (/api/chat/sendMessage)
                     │
                     ├─> Auth & Daily Quota Check (Redis ZSET)
                     ├─> Insert Human Message to Supabase `messages`
                     │
                     ▼
         FastAPI (/api/chat in MessageRoute.py)
                     │
                     ├─> Read Workspace Config (Redis cache, 300s TTL)
                     ├─> Read Chat History (Redis list, 1h TTL)
                     ├─> Append Human Message to Redis History
                     │
                     ▼
         LangGraph Agent Engine Execution
           ├── 1. `start_node`
           ├── 2. `conditional_router_node_1`
           │       ├── If casual/greeting ──> `generic_response_node` ──> LLM Stream
           │       └── If domain question ──> `retrieve_context`
           │                                      │
           │                                      ▼
           │                                  Pinecone Hybrid Search (Dense Cohere + BM25)
           │                                  [Optional Jina Neural Reranker]
           ├── 3. `chatbot_node` (Grounded Prompt Generation)
           ├── 4. `response_evaluation_node` (Judge LLM)
           │       ├── If satisfactory ──> Stream to Client
           │       └── If unsatisfactory ──> `query_rephraser_node` (loop back up to 2x)
           │
           ▼
     Post-Stream Completion
       ├── Stream chunks via SSE / Chunked Transfer to Browser
       ├── Append AI Message to Redis (`chat_history:{session_id}`)
       ├── Record Complete Trace in Supabase `agent_traces`
       └── Invalidate Observability Cache (`invalidate_observability_cache`)
```

### 2. Document Processing & Ingestion Trajectory

```
1. Customer selects PDF in Dashboard (`client/src/components/ui/FileUpload.tsx`)
2. Request presigned upload URL from Next.js (`/api/customer/uploadFile`)
3. Browser performs direct XHR PUT with progress bar to Cloudflare R2 bucket
4. On upload completion, Next.js inserts file record into Supabase (`status: 'uploaded'`)
5. Next.js triggers FastAPI `/api/process-document`
6. FastAPI pushes `process_document_task.delay()` to Celery / Redis queue (< 10ms HTTP response)
7. Celery Worker executes task:
   ├── Updates Supabase file status to `'processing'`
   ├── Downloads raw PDF bytes from Cloudflare R2
   ├── Preprocesses & normalizes text via `0_pdf_parsing.py`
   ├── Splits document into structured chunks with page headers:
   │   `[Page X] [File: filename.pdf] [Section: title]\n<content>`
   ├── Encodes sparse BM25 indices and dense Cohere embeddings
   ├── Upserts hybrid vectors to Pinecone index with tenant metadata
   └── Updates Supabase file status to `'completed'`
```

### 3. Embed Widget & Public Visitor Trajectory

```
1. Visitor loads third-party website hosting `widget.v1.js`
2. Script injects floating bubble button and hidden `<iframe>` targeting `/embed?workspace_id=...`
3. Visitor types message in widget ──> Next.js (`/api/embed/sendMessage`)
4. Security & Governance:
   ├── Domain check against `workspace.allowed_domains`
   ├── Visitor session rate limit check (15 messages / minute)
   └── Account daily message quota check (200 messages / 24 hours)
5. FAQ Cache Check (`embed_faq_cache:{workspace_id}:{query_hash}`, 1h TTL)
   ├── HIT: Instantly return cached text response without invoking LLM
   └── MISS: Forward to FastAPI `/api/chat`, buffer stream, cache generated answer in Redis
```

## Key Abstractions

**Observable Node (`@observable_node`):**
- Purpose: Decorator for LangGraph nodes providing automated telemetry logging, duration tracking, and token extraction.
- Location: `rag-backend/server/app/helper/obseravable_node.py`
- Pattern: Decorator / AOP (Aspect-Oriented Programming).

**LangGraph State (`AgentState`):**
- Purpose: Typed dictionary capturing the evolving conversation context, active query list, retrieved document chunks, evaluation routes, and node trajectory history.
- Location: `rag-backend/server/app/controllers/agent_engine.py`
- Pattern: State Machine context object.

**Admin Supabase Proxy (`supabaseAdmin`):**
- Purpose: Safe server-side singleton that defers Supabase service-role client initialization to runtime via JavaScript `Proxy`, preventing build-time crashes during `next build`.
- Location: `client/src/supabase/adminClient.ts`
- Pattern: Virtual Proxy.

**Sliding-Window Rate Limiter (`checkRateLimit`):**
- Purpose: High-concurrency rate limiter using Redis atomic pipelines and Sorted Sets (`ZSET`), calculating exact second-accurate reset windows.
- Location: `client/src/lib/rateLimit.ts`
- Pattern: Sliding Window Counter.

**In-Memory Auth Cache (`InMemoryTTLCache`):**
- Purpose: In-memory cache holding resolved Supabase user objects for 60 seconds, eliminating repetitive network round-trips for authenticated API calls.
- Location: `client/src/lib/authCache.ts`
- Pattern: Cache-Aside with TTL eviction.

## Entry Points

**Frontend Application:**
- `client/src/app/page.tsx` - Public landing page and marketing showcase
- `client/src/app/layout.tsx` - Root layout with Satoshi/Inter fonts, ThemeProvider, ToastProvider
- `client/src/proxy.ts` - Edge request proxy managing auth redirection between `/login` and `/dashboard`

**Backend API Service:**
- `rag-backend/server/app/main.py` - FastAPI entry point with lifespan initialization and authorization middleware
- `rag-backend/server/start.sh` - Shell runner launching Uvicorn ASGI server

**Asynchronous Worker:**
- `rag-backend/server/app/celery_app.py` - Celery application instance configuring Redis broker and task registry

**Client Embed Widget:**
- `client/public/widget.v1.js` - Standalone vanilla JS embed loader for third-party websites

## Error Handling

**Strategy:** Multi-tier defensive error handling with graceful degradation and client notification:
- **Next.js API Layer:** Comprehensive `try/catch` wrapping all route handlers, returning structured JSON with HTTP 400/401/429/500 status codes.
- **FastAPI Layer:** Global authorization middleware rejects unauthorized calls with HTTP 401; exceptions in chat return HTTP 500 while preserving execution traces.
- **RAG Agent Engine:** If vector retrieval or Jina reranking fails, the engine falls back to direct Pinecone search; if an evaluator rejects responses, it loops through `query_rephraser_node` before degrading to an informative apology message.
- **Celery Worker:** Document processing tasks support automatic retries (`max_retries=3`) and update the file status in Supabase to `'failed'` with descriptive error logs on terminal errors.

## Cross-Cutting Concerns

**Logging:**
- Standardized prefix tags across all services: `[Agent Trajectory]`, `[Celery Worker]`, `[FastAPI Server]`, `[Next.js Redis Warning]`, `[Observability Metrics]`.
- Performance profiling via HTTP response header `X-Process-Time`.

**Security & Authorization:**
- Shared secret authorization between Next.js and FastAPI via `X-API-Key` header matching `FASTAPI_SECRET_KEY`.
- Supabase Row-Level Security ensures customers only view their own workspaces, messages, traces, and files.
- Presigned S3 URLs restrict upload payloads to exact byte sizes and target keys.

**Observability & Telemetry:**
- Millisecond-level trace capture of every graph transition in `agent_traces`.
- Dynamic calculation of RPM, TPM, RPD, TPD, Context Found Rate, and CSAT scores with Redis caching and Set tracking invalidation.

---

*Architecture analysis: 2026-10-19*
*Update when major patterns change*

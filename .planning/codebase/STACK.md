# Technology Stack

**Analysis Date:** 2026-10-19

## Languages

**Primary:**
- TypeScript 5.x - Frontend application logic, UI components, Next.js API routes, contexts, and state management (`client/src`)
- Python 3.11 / 3.12+ - Backend RAG service, LangGraph workflow execution, document preprocessing, vector indexing, and Celery background workers (`rag-backend/server`)

**Secondary:**
- SQL (PostgreSQL) - Supabase schema definitions, relational constraints, indexes, Row-Level Security (RLS) policies, and user triggers (`client/src/supabase/schema.sql`, `rag-backend/server/supabase_client/schema.sql`)
- JavaScript (ES6 / Vanilla JS) - Standalone embeddable chat widget script (`client/public/widget.v1.js`) and build configurations (`client/eslint.config.mjs`, `client/postcss.config.mjs`)
- Bash / Shell - Service startup entry scripts (`rag-backend/server/start.sh`)
- Dockerfile / YAML - Containerized service definitions (`docker-compose.yml`, `client/Dockerfile`, `rag-backend/server/Dockerfile`)

## Runtime

**Environment:**
- Node.js 20.x+ (LTS) - Frontend Next.js 16 runtime and API route handlers
- Python 3.12+ - FastAPI ASGI server (`uvicorn`) and asynchronous Celery worker processes
- Redis 7.x - In-memory cache layer, message broker, and rate-limiting sliding window storage

**Package Manager:**
- npm (Node.js) - Version 10.x+, lockfile `client/package-lock.json` present
- pip (Python) - Managed via `rag-backend/server/requirements.txt` and `rag-backend/requirements.txt`

## Frameworks

**Core:**
- Next.js 16.2.10 (App Router) - Full-stack React framework with server-side rendering, streaming responses, and proxy middleware (`client/src/app`)
- React 19.2.4 - Modern frontend UI library utilizing React Server Components and concurrent features
- FastAPI - High-throughput asynchronous Python web framework for REST API endpoints and SSE streaming (`rag-backend/server/app/main.py`)
- LangGraph - Stateful multi-actor orchestration graph for cyclic RAG, genuine vs. generic query routing, retrieval, evaluation, and query rephrasing (`rag-backend/server/app/controllers/agent_engine.py`)
- Celery 5.x - Distributed asynchronous task queue for heavy PDF parsing and vector index operations (`rag-backend/server/app/celery_app.py`, `rag-backend/server/app/tasks.py`)

**Testing:**
- Currently unconfigured: No automated unit or end-to-end test framework (e.g., Jest, Vitest, Pytest) installed in `client/package.json` or `rag-backend/server/requirements.txt`
- Ad-hoc test scripts: Standalone Python scripts for vector setup and agent validation (`rag-backend/server/setup_test_data.py`, `rag-backend/temp/test_agent.py`)

**Build/Dev:**
- React Compiler (`babel-plugin-react-compiler` 1.0.0, enabled via `reactCompiler: true` in `client/next.config.ts`)
- Tailwind CSS v4 (`@tailwindcss/postcss` ^4) - Utility-first styling with custom CSS design tokens (`client/src/app/globals.css`)
- TypeScript 5 - Static type checking (`client/tsconfig.json`)
- ESLint 9 (`eslint-config-next` 16.2.10) - Code linting (`client/eslint.config.mjs`)

## Key Dependencies

**Critical:**
- `@supabase/ssr` (^0.12.0) & `@supabase/supabase-js` (^2.110.0) - Supabase authentication, cookie-based session handling, and database operations (`client/src/supabase/`)
- `supabase` (Python SDK) - Database client for trace insertion, message storage, and workspace fetching (`rag-backend/server/supabase_client/client.py`)
- `langgraph` & `langchain-core` - State graph multi-node workflow orchestration (`rag-backend/server/app/controllers/agent_engine.py`)
- `pinecone` & `pinecone-text` - Hybrid vector index operations combining dense embeddings with BM25 sparse keyword encoding (`rag-backend/server/app/controllers/1_embedding_pipeline.py`)
- `langchain-cohere` & `cohere` - Semantic dense embeddings using Cohere `embed-english-v3.0` (`rag-backend/server/app/controllers/1_embedding_pipeline.py`)
- `boto3` & `@aws-sdk/client-s3` (^3.1079.0) - Cloudflare R2 / AWS S3 object storage operations and presigned URL generation (`client/src/cloudflare/client.ts`, `rag-backend/server/app/tasks.py`)
- `ioredis` (^6.0.0) & `redis` (Python SDK) - Multi-tier Redis caching, Set tracking for instant trace invalidation, and atomic sliding-window rate limiting (`client/src/lib/redisClient.ts`, `client/src/lib/rateLimit.ts`, `rag-backend/server/app/helpers/cache.py`)
- `celery[redis]` - Task queue broker and worker execution (`rag-backend/server/app/celery_app.py`)

**Infrastructure & Utilities:**
- `uvicorn[standard]` - High-performance ASGI web server (`rag-backend/server/start.sh`)
- `pydantic` - Data modeling and request body validation (`rag-backend/server/app/routes/`)
- `PyMuPDF` (fitz) & `markitdown` - PDF document text extraction and Markdown preprocessing (`rag-backend/server/app/controllers/0_pdf_parsing.py`, `rag-backend/server/app/controllers/0_markdown_parsing.py`)
- `sonner` (^2.0.8) - Notification toasts for React UI (`client/src/lib/ToastContext.tsx`)
- `python-dotenv` & `dotenv` - Environment variable loading from `.env` files

## Configuration

**Environment:**
- Multi-tier configuration files: Root `.env`, `client/.env`, `rag-backend/server/.env`
- Reference templates provided: `.env.example`, `client/.env.example`, `rag-backend/server/.env.example`
- Critical environment keys:
  - Frontend: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SECRET_KEY`, `R2_ENDPOINT_URL`, `R2_BUCKET_NAME`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `FASTAPI_URL`, `FASTAPI_SECRET_KEY`, `REDIS_URL`
  - Backend: `SUPABASE_URL`, `SUPABASE_KEY`, `PINECONE_API_KEY`, `PINECONE_INDEX`, `COHERE_API_KEY`, `COHERE_MODEL`, `GROQ_API_KEY`, `OPENAI_API_KEY`, `GEMINI_API_KEY`, `JINA_API_KEY`, `REDIS_URL`, `FASTAPI_SECRET_KEY`

**Build:**
- `client/tsconfig.json` - Target ES2017, bundler module resolution, `@/*` path alias
- `client/next.config.ts` - Next.js configuration enabling `reactCompiler: true`
- `client/postcss.config.mjs` - PostCSS plugin configuration for Tailwind CSS v4
- `docker-compose.yml` - Multi-service container specification for `foxnutts_client`, `foxnutts_server`, and `foxnutts_celery`

## Platform Requirements

**Development:**
- Linux / macOS / Windows with WSL2
- Node.js 20+ and Python 3.11+
- Local or managed Redis instance (port 6379)
- Active Supabase project with applied SQL schema
- Cloudflare R2 bucket with S3 API credentials
- Pinecone Serverless vector index configured for hybrid search (dense + sparse)

**Production:**
- Containerized deployment using Docker & Docker Compose (`docker-compose.yml`)
- Frontend: Node.js container or Vercel edge/serverless deployment
- Backend: Uvicorn ASGI server behind reverse proxy (Nginx / Cloudflare)
- Worker: Celery daemon connected to Redis broker (`--concurrency=1`, `--without-gossip`, `--without-mingle`)

---

*Stack analysis: 2026-10-19*
*Update after major dependency changes*

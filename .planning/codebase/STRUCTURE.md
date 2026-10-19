# Codebase Structure

**Analysis Date:** 2026-10-19

## Directory Layout

```
cb/
├── .planning/                  # Project planning, specifications, and codebase maps
│   └── codebase/              # Structured architecture and system documentation
├── client/                     # Next.js 16 full-stack frontend application
│   ├── public/                # Static assets, branding logos, and embeddable widget loader
│   ├── src/
│   │   ├── app/               # Next.js App Router (pages, layouts, and backend API routes)
│   │   │   ├── api/           # Server-side API route handlers (chat, customer, embed)
│   │   │   ├── dashboard/     # Authenticated customer management dashboard pages
│   │   │   ├── embed/         # Standalone embeddable chat view (hosted in iframe)
│   │   │   ├── login/         # Supabase authentication login / signup page
│   │   │   ├── onboarding/    # First-time workspace configuration wizard
│   │   │   ├── globals.css    # Global Tailwind CSS v4 variables & theme design tokens
│   │   │   ├── layout.tsx     # Root HTML layout and global context providers
│   │   │   └── page.tsx       # Landing page and marketing showcase
│   │   ├── cloudflare/        # S3 SDK client for Cloudflare R2 object storage
│   │   ├── components/        # React UI components, layouts, and dashboard sections
│   │   │   ├── layout/        # Shell layout components (Sidebar, DashboardLayout)
│   │   │   └── ui/            # Reusable UI primitives (Button, Modal, Input, Badge, etc.)
│   │   ├── lib/               # Shared client/server utilities (authCache, redisClient, rateLimit)
│   │   ├── proxy.ts           # Next.js edge proxy for auth session redirection
│   │   └── supabase/          # Supabase client singletons (admin, browser, proxy, server)
│   ├── Dockerfile             # Container definition for frontend application
│   ├── next.config.ts         # Next.js compiler and runtime configuration
│   ├── package.json           # Frontend dependency manifest and npm scripts
│   └── tsconfig.json          # TypeScript compiler options and path aliases
├── rag-backend/                # Python RAG services, Celery workers, and test scripts
│   ├── server/
│   │   ├── app/
│   │   │   ├── controllers/   # Document preprocessing, embeddings, retrieval, LangGraph engine
│   │   │   ├── helper/        # Observability decorator and telemetry helpers
│   │   │   ├── helpers/       # Redis cache operations and cache invalidation helpers
│   │   │   ├── routes/        # FastAPI API routes (MessageRoute, FileProcessRoute)
│   │   │   ├── celery_app.py  # Celery application instance and Redis broker configuration
│   │   │   ├── main.py        # FastAPI server entry point and authorization middleware
│   │   │   └── tasks.py       # Celery asynchronous background tasks
│   │   ├── supabase_client/   # Python Supabase database client and SQL schema
│   │   ├── Dockerfile         # Container definition for FastAPI server and Celery worker
│   │   ├── requirements.txt   # Python dependency specifications for server
│   │   ├── setup_test_data.py # Standalone database and vector test setup script
│   │   └── start.sh           # Shell launcher script for Uvicorn ASGI server
│   └── temp/                  # Scratch test files, draft scripts, and test PDFs (gitignored)
├── AGENTS.md                   # Authoritative context map and architectural rules
├── docker-compose.yml          # Multi-container orchestration (client, server, celery)
└── FOXXNUTS_KNOWLEDGE_BASE.md  # Comprehensive product specification and knowledge base
```

## Directory Purposes

**`client/src/app/`:**
- Purpose: Application routing using Next.js App Router conventions.
- Contains: Pages (`page.tsx`), layouts (`layout.tsx`), stylesheets (`globals.css`), and REST API endpoints (`api/`).
- Key files:
  - `client/src/app/page.tsx`: FoxxNuts landing page showcasing product capabilities.
  - `client/src/app/layout.tsx`: Root HTML shell with font configuration and context providers.
  - `client/src/app/dashboard/page.tsx`: Main dashboard overview and quick chat tester.
  - `client/src/app/dashboard/analytics/page.tsx`: Observability dashboard integrating KPI cards and traces.
  - `client/src/app/dashboard/knowledge/page.tsx`: Document upload, file status, and reprocessing UI.
  - `client/src/app/embed/page.tsx`: Clean chat iframe rendered inside third-party websites.

**`client/src/app/api/`:**
- Purpose: Next.js backend API routes handling authentication, database transactions, and proxying.
- Subdirectories:
  - `api/chat/`: User chat endpoints (`sendMessage/route.ts`, `getHistory/route.ts`).
  - `api/customer/`: Workspace management, file uploads, settings updates, and observability metrics.
  - `api/embed/`: Public widget endpoints with origin allowlist validation and FAQ caching.

**`client/src/components/`:**
- Purpose: Modular React UI components.
- Subdirectories:
  - `components/ui/`: Reusable primitives (`Button.tsx`, `Modal.tsx`, `Input.tsx`, `Badge.tsx`, `Toast.tsx`, `Tabs.tsx`, `FileUpload.tsx`).
  - `components/layout/`: Application shell wrappers (`Sidebar.tsx`, `DashboardLayout.tsx`).
- Key files:
  - `components/ObservabilitySection.tsx`: Complete telemetry dashboard with KPI cards, SVG timelines, and trace inspection modal.
  - `components/ChatInterface.tsx`: Live interactive chat interface with auto-scrolling and feedback rating.

**`client/src/lib/`:**
- Purpose: Shared utility functions, React contexts, and service singletons.
- Key files:
  - `client/src/lib/redisClient.ts`: Next.js `ioredis` singleton instance.
  - `client/src/lib/authCache.ts`: 60s in-memory TTL cache for user authentication sessions.
  - `client/src/lib/rateLimit.ts`: Atomic sliding-window rate limiter using Redis Sorted Sets.
  - `client/src/lib/WorkspaceContext.tsx`: React Context providing active workspace state and switching.
  - `client/src/lib/ThemeContext.tsx`: Dark/light mode theme provider.
  - `client/src/lib/ToastContext.tsx`: Toast notification wrapper around Sonner.

**`client/src/supabase/`:**
- Purpose: Supabase client factories tailored for different execution contexts.
- Key files:
  - `client/src/supabase/adminClient.ts`: Lazy Proxy singleton using service-role key for server routes.
  - `client/src/supabase/browserClient.ts`: Client-side Supabase client for browser interactions.
  - `client/src/supabase/serverClient.ts`: Server Component client using Next.js `cookies()`.
  - `client/src/supabase/proxyClient.ts`: Edge client for session verification in proxy/middleware.
  - `client/src/supabase/schema.sql`: Authoritative database schema, triggers, and RLS policies.

**`rag-backend/server/app/controllers/`:**
- Purpose: Core intelligence, document parsing, and vector retrieval pipelines.
- Key files:
  - `agent_engine.py`: Multi-node LangGraph state machine orchestrating RAG queries and evaluation.
  - `pdf_parsing.py`: PyMuPDF text cleaning, whitespace normalization, and heading detection.
  - `markdown_parsing.py`: Markdown heading parsing and structural block splitting.
  - `main.py`: Page-window document chunking attaching structured metadata headers.
  - `embedding_pipeline.py`: Cohere embedding generation, BM25 encoding, and Pinecone upsert/delete.
  - `query_pipeline.py`: Pinecone hybrid vector search and optional Jina neural reranking.

**`rag-backend/server/app/routes/`:**
- Purpose: FastAPI HTTP route definitions.
- Key files:
  - `MessageRoute.py`: `/api/chat` SSE streaming endpoint with trajectory logging.
  - `FileProcessRoute.py`: Document ingestion, reprocessing, vector deletion, and task status routes.

**`rag-backend/server/app/helpers/` & `helper/`:**
- Purpose: Backend utilities for caching, telemetry, and observability.
- Key files:
  - `helpers/cache.py`: Redis cache helpers for workspace configs, chat history, and $O(1)$ invalidation.
  - `helper/obseravable_node.py`: `@observable_node` decorator capturing execution times and token counts.

## Key File Locations

**Entry Points:**
- `client/src/app/page.tsx`: Frontend web entry point.
- `client/src/proxy.ts`: Next.js edge request routing & auth redirects.
- `client/public/widget.v1.js`: Embeddable JavaScript widget entry point.
- `rag-backend/server/app/main.py`: FastAPI server entry point.
- `rag-backend/server/app/celery_app.py`: Celery background worker entry point.

**Configuration:**
- `client/package.json`: Frontend dependencies and build scripts.
- `client/tsconfig.json`: TypeScript compiler options and path mappings.
- `client/next.config.ts`: Next.js React compiler settings.
- `rag-backend/server/requirements.txt`: Python backend dependency list.
- `docker-compose.yml`: Multi-service container orchestration.

**Core Logic:**
- `rag-backend/server/app/controllers/agent_engine.py`: LangGraph multi-node state graph.
- `rag-backend/server/app/tasks.py`: Celery background ingestion tasks.
- `client/src/lib/rateLimit.ts`: Atomic Redis rate limiter.
- `client/src/components/ObservabilitySection.tsx`: Observability telemetry analytics.

**Database & Migrations:**
- `client/src/supabase/schema.sql`: Full Supabase SQL schema, RLS policies, and triggers.

## Naming Conventions

**Files:**
- React Components: PascalCase (`Button.tsx`, `ChatInterface.tsx`, `ObservabilitySection.tsx`).
- Next.js Routes: App Router standard (`page.tsx`, `layout.tsx`, `route.ts`).
- Utility & Context Modules: camelCase (`authCache.ts`, `rateLimit.ts`, `redisClient.ts`) or PascalCase for contexts (`WorkspaceContext.tsx`).
- Python Modules: snake_case (`agent_engine.py`, `celery_app.py`, `tasks.py`) with numeric prefixes for pipeline stages (`0_pdf_parsing.py`, `1_embedding_pipeline.py`, `2_query_pipeline.py`).
- API Route Modules: PascalCase in FastAPI (`MessageRoute.py`, `FileProcessRoute.py`).

**Directories:**
- Frontend: kebab-case or lowercase (`components/ui`, `app/dashboard/analytics`).
- Backend: lowercase or snake_case (`controllers/`, `helpers/`, `routes/`).

## Where to Add New Code

**New Customer API Route:**
- Definition & Handler: `client/src/app/api/customer/<newEndpoint>/route.ts`.
- Auth Pattern: Use `getCachedUser(request.headers.get("Authorization"))`.
- Database Access: Use `supabaseAdmin` for server operations.

**New UI Component / Modal:**
- Implementation: `client/src/components/ui/<ComponentName>.tsx` (primitives) or `client/src/components/<ComponentName>.tsx` (feature components).
- Styling: Use Tailwind CSS utility classes and `var(--fn-*)` CSS design tokens.

**New Dashboard Page:**
- Implementation: `client/src/app/dashboard/<section>/page.tsx`.
- Layout: Automatically wrapped by `client/src/app/dashboard/layout.tsx`.
- Navigation: Register route in `client/src/components/layout/Sidebar.tsx`.

**New LangGraph Agent Node:**
- Implementation: Define node function in `rag-backend/server/app/controllers/agent_engine.py`.
- Decorator: Wrap with `@observable_node("<node_name>")` from `app.helper.obseravable_node`.
- Graph Registration: Add node via `workflow.add_node("<node_name>", ...)` and define routing edges.

**New Background Task:**
- Implementation: Add `@celery_app.task` in `rag-backend/server/app/tasks.py`.
- Dispatch Route: Expose endpoint in `rag-backend/server/app/routes/FileProcessRoute.py`.
- Tracking: Use `AsyncResult(task_id, app=celery_app)` in `/api/task-status/{task_id}`.

## Special Directories

**`.planning/`:**
- Purpose: Project roadmap, phase plans, and codebase architecture maps.
- Source: Generated and maintained by GSD workflows.
- Committed: Yes.

**`rag-backend/temp/`:**
- Purpose: Local testing documents, test PDFs, and scratch investigation scripts.
- Source: Developer test workspace.
- Committed: No (excluded via `.gitignore`).

**`client/.next/`:**
- Purpose: Next.js compiled build output, cache, and server bundles.
- Source: Auto-generated by `next build` / `next dev`.
- Committed: No (excluded via `.gitignore`).

---

*Structure analysis: 2026-10-19*
*Update when directory structure changes*

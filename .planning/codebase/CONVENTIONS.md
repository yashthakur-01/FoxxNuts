# Coding Conventions

**Analysis Date:** 2026-10-19

## Naming Patterns

**TypeScript / React:**
- Files:
  - React Components: PascalCase (`Button.tsx`, `Modal.tsx`, `ChatInterface.tsx`, `ObservabilitySection.tsx`)
  - Next.js App Router Pages/Routes: lowercase fixed names (`page.tsx`, `layout.tsx`, `route.ts`)
  - Libraries & Utilities: camelCase (`authCache.ts`, `rateLimit.ts`, `redisClient.ts`)
  - Context Providers: PascalCase (`WorkspaceContext.tsx`, `ThemeContext.tsx`, `ToastContext.tsx`)
- Functions & Variables:
  - Functions: camelCase (`checkRateLimit`, `getCachedUser`, `formatResetTime`)
  - Variables: camelCase (`activeWorkspace`, `currentSessionId`, `cachedUser`)
  - Constants: UPPER_SNAKE_CASE (`RATE_LIMIT_TIERS`, `REDIS_URL`, `FASTAPI_SECRET_KEY`)
- Types & Interfaces:
  - Interfaces & Types: PascalCase without prefixes (`ButtonProps`, `RateLimitConfig`, `Metrics`, `Trace`, `Workspace`)

**Python / FastAPI:**
- Files & Modules:
  - Modules & Utilities: snake_case (`celery_app.py`, `tasks.py`, `obseravable_node.py`)
  - Pipeline Controllers: Numeric prefix + snake_case (`0_pdf_parsing.py`, `1_embedding_pipeline.py`, `2_query_pipeline.py`)
  - FastAPI Route Files: PascalCase (`MessageRoute.py`, `FileProcessRoute.py`)
- Functions & Variables:
  - Functions: snake_case (`get_chat_model`, `fetch_context_from_vector_db`, `get_cached_workspace_config`)
  - LangGraph Nodes: snake_case (`conditional_router_node_1`, `retrieve_context`, `chatbot_node`, `response_evaluation_node`)
  - Constants: UPPER_SNAKE_CASE (`REDIS_URL`, `STREAMABLE_NODES`, `FASTAPI_SECRET_KEY`)
  - Private Helpers: Leading underscore (`_update_file_status`, `_CACHED_BM25_ENCODER`)
- Classes:
  - Pydantic Models & TypedDicts: PascalCase (`MessageRequest`, `ProcessDocument`, `AgentState`, `HeadingInfo`)

## Code Style

**TypeScript / Frontend Formatting & Linting:**
- Tooling: ESLint 9 configured via `client/eslint.config.mjs` extending `eslint-config-next`.
- Component Pattern: Functional components with explicit TypeScript interfaces for props.
- Client Directives: Explicit `'use client';` placed at the very top of files containing hooks (`useState`, `useEffect`, `useRef`).
- Styling: Tailwind CSS v4 utility classes paired with custom design system variables defined in `client/src/app/globals.css`:
  - Background: `var(--fn-bg)` (`#090A0D`)
  - Surfaces: `var(--fn-surface)` (`#13151B`), `var(--fn-elevated)` (`#1C1E26`)
  - Borders: `var(--fn-border)` (`#272A35`), `var(--fn-border-subtle)` (`#1E212B`)
  - Accent / Primary: `var(--fn-accent)` (`#FF1E27`), `var(--fn-accent-hover)` (`#E00E17`)
  - Text: `var(--fn-text)` (`#F8F9FA`), `var(--fn-text-secondary)` (`#A6ADBB`), `var(--fn-text-tertiary)` (`#6C7280`)

**Python / Backend Formatting:**
- Tooling: Standard PEP 8 conventions, Type Hints (`typing.Optional`, `typing.Literal`, `typing.TypedDict`, `typing.Annotated`).
- Async Idioms: Async functions for FastAPI routes and LangGraph nodes (`async def`). Synchronous blocking operations (e.g. database/Redis calls) offloaded via `asyncio.to_thread(...)` when executed inside async routes.
- Decoupled Singletons: Cached globals initialized lazily (`_CACHED_BM25_ENCODER`, `_compiled_graph_instance`).

## Import Organization

**TypeScript Import Order:**
1. React and Next.js built-ins (`react`, `next/link`, `next/navigation`, `next/server`)
2. Third-party packages (`@supabase/ssr`, `ioredis`, `@aws-sdk/client-s3`, `sonner`)
3. Internal singletons & clients (`../supabase/adminClient`, `../lib/redisClient`)
4. Internal contexts, hooks & utilities (`../lib/authCache`, `../lib/rateLimit`, `../lib/WorkspaceContext`)
5. UI Components & Layouts (`../components/ui/Button`, `../components/ui/Modal`)
6. Type imports (`import type { NextRequest }`)

**Python Import Order:**
1. Standard library modules (`os`, `time`, `asyncio`, `re`, `traceback`, `typing`)
2. Core framework imports (`fastapi`, `pydantic`, `dotenv`)
3. Celery & Task modules (`celery`, `celery.result`)
4. LangChain & LangGraph modules (`langchain_core.*`, `langgraph.graph.*`)
5. Storage & Database clients (`boto3`, `pinecone`, `redis`, `supabase_client.client`)
6. Local application imports (`from app.helpers.cache import ...`, `from app.controllers.agent_engine import ...`)

## Error Handling

**TypeScript API Routes:**
- Every Next.js API route (`route.ts`) wraps operations in a top-level `try/catch` block.
- Standardized response signatures:
  - Validation failure: `NextResponse.json({ message: "Missing required fields...", success: false }, { status: 400 })`
  - Authorization failure: `NextResponse.json({ message: "Unauthorized...", success: false }, { status: 401 })`
  - Rate limit reached: `NextResponse.json({ message: "Quota reached...", resetInSeconds, success: false }, { status: 429, headers: { "Retry-After": ... } })`
  - Server exception: `NextResponse.json({ message: "Internal server error", error: err.message, success: false }, { status: 500 })`

**Python Backend Routes:**
- Global FastAPI middleware checks header authorization and returns HTTP 401 on missing or mismatched `FASTAPI_SECRET_KEY`.
- Background tasks (`rag-backend/server/app/tasks.py`) catch exceptions, update database status to `'failed'`, and print formatted tracebacks via `traceback.print_exc()`.
- Vector search gracefully degrades: Jina neural reranking failure falls back to standard Pinecone hybrid retrieval without interrupting the user's conversation.

## Logging & Telemetry

**Framework:**
- Frontend: `console.log` for informational cache events (`[FAQ Cache HIT]`), `console.warn` for non-fatal Redis degradations, and `console.error` for API failures.
- Backend: Standard `print(...)` output structured with descriptive bracketed prefixes:
  - `🚀 [FoxxNuts Backend]` - Server initialization and lifespan events
  - `🔵 [Agent Trajectory]` - Entering LangGraph nodes with query previews
  - `🟢 [Agent Trajectory]` - Node completions with execution durations (ms) and token counts
  - `📦 [Celery Worker]` - Background ingestion and vector indexing updates
  - `[Workspace Cache]` - Redis cache hits, misses, and invalidations
- HTTP Performance: `X-Process-Time` header automatically attached to all FastAPI responses via custom timing middleware.

## Comments & Documentation

**Guidelines:**
- Docstrings: Python functions document purpose, inputs, and behavior (`"""Helper to update file status and updated_at in Supabase."""`).
- Visual Section Dividers: Major logic blocks in route handlers and scripts use horizontal comment banners:
  ```typescript
  // =========================================================================
  // 1. CLIENT ACCOUNT DAILY MESSAGE RATE LIMIT (200 messages / 24-hour window)
  // =========================================================================
  ```
- Inline Explanations: Used to document rationale for non-obvious architecture choices (e.g. why `Proxy` is used in `adminClient.ts` to prevent build-time failures).

## Function & Component Design

**Frontend React Components:**
- Pure functional components with explicit props destructuring.
- Sub-components and local helpers kept within the same file or separated into `components/ui/` if reusable.
- Accessibility: Interactive elements include keyboard navigation support, focus states, and descriptive labels.

**Backend LangGraph Nodes:**
- Signature contract: `async def <node_name>(state: AgentState, config: RunnableConfig) -> dict:`
- Decorator requirement: All LangGraph graph nodes should be annotated with `@observable_node("<node_name>")` to ensure trace telemetry is recorded in `public.agent_traces`.
- Immutability: Nodes return state delta dictionaries that merge into the parent `AgentState`.

---

*Convention analysis: 2026-10-19*
*Update when patterns change*

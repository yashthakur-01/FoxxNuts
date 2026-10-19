# Codebase Concerns

**Analysis Date:** 2026-10-19

## Tech Debt

**Numeric Prefixes in Python Module Names:**
- Issue: Pipeline controller files use numeric prefixes (`0_pdf_parsing.py`, `0_markdown_parsing.py`, `1_embedding_pipeline.py`, `2_query_pipeline.py`, `3_langgraph_chatbot.py`). Because Python syntax does not allow identifiers starting with numbers, modules cannot use standard import statements (e.g., `import app.controllers.1_embedding_pipeline` triggers a `SyntaxError`).
- Files:
  - `rag-backend/server/app/tasks.py` (lines ~34, ~98)
  - `rag-backend/server/app/controllers/main.py` (lines ~18-24)
  - `rag-backend/server/app/controllers/2_query_pipeline.py` (lines ~11-13)
- Why: Implemented to visually show the chronological pipeline sequence in file explorers.
- Impact: Forces runtime dynamic imports (`importlib.import_module("app.controllers.1_embedding_pipeline")`), preventing static analysis, type checking, and linter resolution.
- Fix approach: Rename modules to valid Python identifiers (e.g., `pdf_parsing.py`, `markdown_parsing.py`, `embedding_pipeline.py`, `query_pipeline.py`) and use standard static imports.

**Orphaned / Unused Module (`3_langgraph_chatbot.py`):**
- Issue: Legacy file importing outdated and non-existent symbols (`graph_builder`, `toolnode`) from `agent_engine.py`.
- Files: `rag-backend/server/app/controllers/3_langgraph_chatbot.py`
- Why: Early prototype of the LangGraph agent before `agent_engine.py` was refactored into a unified state machine.
- Impact: Confuses developers onboarding to the codebase; risk of executing broken legacy paths.
- Fix approach: Safely delete `rag-backend/server/app/controllers/3_langgraph_chatbot.py`.

**Duplicated Backend Requirements:**
- Issue: Two separate `requirements.txt` files with conflicting package specifications.
- Files: `rag-backend/requirements.txt` vs `rag-backend/server/requirements.txt`
- Why: The root `rag-backend/requirements.txt` was maintained during experimentation, while `rag-backend/server/requirements.txt` is used by the Docker container.
- Impact: Dependency drift, missed dependencies when spinning up local virtual environments outside Docker.
- Fix approach: Consolidate dependencies into `rag-backend/server/requirements.txt` and remove `rag-backend/requirements.txt` or symlink it.

**Folder Naming Typo (`helpers/` vs `helper/`):**
- Issue: Two distinct helper directories exist side-by-side in the backend: `rag-backend/server/app/helpers/` (containing `cache.py`) and `rag-backend/server/app/helper/` (containing `obseravable_node.py` — also misspelled).
- Files: `rag-backend/server/app/helpers/` and `rag-backend/server/app/helper/`
- Why: Created at different development stages without consolidating shared utilities.
- Impact: Inconsistent import paths across backend modules.
- Fix approach: Consolidate `helper/obseravable_node.py` into `helpers/observable_node.py` and update imports.

**Artificial Delay in Token Streaming:**
- Issue: The response generator in `MessageRoute.py` loops over the completed response string with fixed 16-character slices and pauses with `await asyncio.sleep(0.01)` to emulate streaming.
- Files: `rag-backend/server/app/routes/MessageRoute.py` (lines ~105-110)
- Why: Simulates streaming tokens when the LangGraph agent finishes generating the complete evaluated response.
- Impact: Adds unnecessary latency to chat responses and delays delivery of already-computed LLM answers.
- Fix approach: Transition to true token-level streaming directly from LangGraph's `on_chat_model_stream` events, streaming LLM tokens in real-time as they are produced.

## Known Bugs & Fragile Areas

**Fallback to Request Body `customer_id`:**
- Symptoms: In `client/src/app/api/chat/sendMessage/route.ts`, if authentication fails or user token is missing, the code falls back to `let customer_id = user?.id || body.customer_id;`.
- Files: `client/src/app/api/chat/sendMessage/route.ts` (lines ~22-26)
- Trigger: An unauthenticated request supplying a custom `customer_id` in the JSON body.
- Workaround: Supabase service-role client is used downstream, which could allow a malicious caller to impersonate another customer's ID if not strictly validated.
- Root cause: Lenient fallback logic intended for local testing.
- Fix approach: Enforce strict auth check: `if (!user) return NextResponse.json({ message: "Unauthorized" }, { status: 401 })`.

**Celery Single Concurrency Worker:**
- Symptoms: When multiple users upload documents simultaneously, all documents queue up and process sequentially.
- Trigger: Multiple concurrent document uploads or large PDFs (>50 pages).
- Files: `docker-compose.yml` (line ~43: `--concurrency=1`)
- Impact: Processing times degrade significantly during concurrent ingestion.
- Fix approach: Increase worker concurrency (e.g. `--concurrency=4` or `--autoscale=6,2`) and allocate sufficient memory to the container.

**Inconsistent Supabase Secret Key Env Var Names:**
- Symptoms: Different files reference different environment variable names for the Supabase service role secret:
  - `client/src/supabase/adminClient.ts` references `process.env.SUPABASE_SECRET_KEY`
  - `AGENTS.md` and standard Supabase templates reference `SUPABASE_SERVICE_ROLE_KEY`
  - `rag-backend/server/supabase_client/client.py` references `SUPABASE_KEY`
- Files: `client/src/supabase/adminClient.ts`, `rag-backend/server/supabase_client/client.py`, `client/.env.example`
- Workaround: Ensure the correct variable name is populated in every specific `.env` file.
- Fix approach: Normalize to standard `SUPABASE_SERVICE_ROLE_KEY` across all backend and client configuration files.

## Security Considerations

**Direct Service-Role Admin Client Access:**
- Risk: `client/src/supabase/adminClient.ts` bypasses PostgreSQL Row-Level Security (RLS). Any route handler using `supabaseAdmin` must explicitly enforce tenant boundaries (e.g., verifying `workspace_id` belongs to the requesting `user.id`).
- Files:
  - `client/src/app/api/customer/getFiles/route.ts`
  - `client/src/app/api/customer/deleteFile/route.ts`
  - `client/src/app/api/customer/updateConfig/route.ts`
- Current mitigation: Handlers query `public.workspace` checking `cust_id == user.id`.
- Recommendations: Audit all API routes to ensure no queries execute `supabaseAdmin.from(...)` without verifying customer ownership.

**Public Embed Widget Domain Spoofing:**
- Risk: `client/src/app/api/embed/sendMessage/route.ts` checks the `Origin` or `Referer` header against `workspace.allowed_domains`. HTTP headers can be forged by non-browser clients (e.g. scripts or curl).
- Files: `client/src/app/api/embed/sendMessage/route.ts` (lines ~35-50)
- Current mitigation: Sliding-window rate limiters (15 msgs/min per visitor session, 200 msgs/24h per customer) restrict volumetric abuse.
- Recommendations: Implement signed short-lived widget tokens or domain-bound session secrets.

## Performance Bottlenecks

**Cold Start on Embeddings & BM25 Encoder:**
- Problem: The first ingestion or search request experiences high latency (2–5 seconds) while downloading and initializing the Cohere embedding model and BM25 sparse encoder.
- Files: `rag-backend/server/app/controllers/1_embedding_pipeline.py` (lines ~33-60)
- Cause: Lazy initialization inside `get_embedding_model()` and `get_bm25_encoder()` on first request.
- Improvement path: Pre-warm models during FastAPI lifespan startup in `rag-backend/server/app/main.py`.

**Full 30-Day Trace Scan for Metrics:**
- Problem: On Redis cache miss, `observability/metrics/route.ts` queries all traces created within the last 30 days from Supabase and aggregates them in JavaScript.
- Files: `client/src/app/api/customer/observability/metrics/route.ts` (lines ~46-55)
- Cause: Lack of pre-aggregated rollup tables or database RPC functions.
- Improvement path: Create a PostgreSQL rollup view or Redis daily counters (`HINCRBY`) to avoid scanning thousands of raw trace records on cache miss.

## Scaling Limits

**Redis In-Memory Footprint:**
- Current capacity: Standalone Redis instance (single node).
- Limit: Memory exhaustion under heavy session volume if chat histories and observability keys accumulate without strict eviction policies.
- Symptoms at limit: Redis `OOM command not allowed when used memory > 'maxmemory'`.
- Scaling path: Configure `maxmemory` and `maxmemory-policy volatile-lru` in `redis.conf`, or transition to a managed Redis cluster.

**Vector Namespace & Multi-Tenant Pinecone Storage:**
- Current capacity: Single Pinecone index with metadata filtering (`filter={"customerId": ..., "workspaceId": ...}`).
- Limit: As millions of vectors are indexed across thousands of workspaces, single-index metadata filtering incurs higher query latency compared to dedicated index namespaces.
- Scaling path: Migrate metadata filters to Pinecone dedicated namespaces (`namespace=workspace_id`).

## Dependencies at Risk

**MarkItDown & PyMuPDF:**
- Risk: PDF parsing libraries may encounter memory spikes or segfaults on malformed or password-protected PDFs.
- Impact: Could crash the synchronous Celery worker process.
- Mitigation: Wrap PDF extraction in isolated child processes with memory limits or timeout guards.

## Test Coverage Gaps

**Zero Automated Test Coverage:**
- What's not tested:
  - Next.js edge proxy auth redirects (`client/src/proxy.ts`)
  - Sliding-window Redis rate limiter (`client/src/lib/rateLimit.ts`)
  - FastAPI shared secret authorization middleware (`rag-backend/server/app/main.py`)
  - LangGraph cyclical evaluation and rephrasing logic (`rag-backend/server/app/controllers/agent_engine.py`)
  - Celery background ingestion tasks (`rag-backend/server/app/tasks.py`)
- Risk: Regressions can be introduced silently during refactoring or dependency upgrades.
- Priority: High.
- Recommended Action: Install Vitest in `client/` and Pytest in `rag-backend/server/`, targeting critical security and data pathways first.

---

*Concerns audit: 2026-10-19*
*Update as issues are fixed or new ones discovered*

# FoxxNuts AI — Enterprise Agentic RAG & AI Observability Platform

FoxxNuts is a state-of-the-art, enterprise-grade **Retrieval-Augmented Generation (RAG)** platform that transforms static company documentation (PDFs, policies, manuals, handbooks) into an autonomous, self-evaluating conversational AI assistant embeddable onto any website with a single line of code.

Featuring an intelligent **LangGraph Multi-Node State Graph**, **Celery + Redis Asynchronous Task Pipeline**, **Pinecone Hybrid (Dense + Sparse) Vector Search**, **Multi-Tier Redis In-Memory Caching ($O(1)$ Set Tracker Pattern)**, and a **Real-Time Observability Suite** with rate metrics (RPM, TPM, RPD, TPD), execution trace inspection, and automated knowledge gap detection.

---

## 🚀 Architecture & End-to-End Execution Flow

```text
                                       [ REACT / NEXT.JS FRONTEND ]
                                                     │
              ┌──────────────────────────────────────┼──────────────────────────────────────┐
              ▼                                      ▼                                      ▼
   1. Direct Document Upload               2. Auth Session Cache                  3. Observability Dashboard
      • XHR 0%-100% Progress Bar to R2        • In-Memory 60s TTL                    • Rate Cards: RPM, TPM, RPD, TPD
      • Sliding-Window Rate Limit Quota       • Eliminates DB Auth Latency           • 60m & 30d Time-Series SVG Graphs
      • Auto-Refund on Ingestion Failures     • Redis Multi-Tier Memory Store        • Traces: 💬 Chat vs ✅ Match vs ⚠️ Gap
              │                                      │                                      │
              ▼                                      │                                      ▼
   [ Cloudflare R2 Storage ]                         │                            [ Redis Set Tracker ]
              │                                      │                              Key: workspace_trace_keys:{id}
              │                                      ▼                              $O(1)$ Instant Invalidation
   [ FastAPI Backend ] ────────────── (Reads Redis Cache: < 1ms) ──────────────────────────┤
              │                                                                             │
              ▼ (Dispatches Async Tasks < 10ms)                                             │
   [ Redis Broker ]                                                                         │
              │                                                                             │
              ▼ (Pulls Job)                                                                 │
   [ Celery Background Workers ] ───────────────────────────────────────────────────────────┘
     • Ingestion Pipeline: Downloads PDF, chunks with page headers "[Page X] [File: report.pdf]", embeds with Cohere
     • Reprocess Pipeline: Purges vectors from Pinecone via metadata filter before re-embedding
     • Delete Pipeline: Asynchronously deletes vectors from Pinecone index & removes R2 objects
     • Workspace Teardown: Batch-deletes all workspace files, vectors, database records & caches
```

---

## ✨ Core Features & Platform Capabilities

### 1. Self-Evaluating Multi-Node LangGraph RAG Engine
* **`genuine_generic_router` (Intent Classifier)**: Uses few-shot intent classification to direct queries. Directs domain, policy, or factual questions to vector retrieval (`genuine_query`) while handling conversational greetings and session-memory follow-ups inside `generic_or_repetitive`.
* **`context_retriever` (Hybrid Search)**: Queries Pinecone hybrid vector indexes using **Cohere Dense Embeddings** (`embed-english-v3.0`) + **BM25 Sparse Token Match**. Applies tenant-isolated `workspace_id` filtering and configurable cosine similarity thresholds.
* **`chatbot_node` (Grounded Synthesis)**: Enforces strict fact-grounding instructions (*"Answer relying ONLY on retrieved context"*), forbidding hallucinations and eliminating robotic meta-language filler.
* **`evaluator_node` (Autonomous Judge)**: An independent evaluator checks drafted answers against source passages. If incomplete or ambiguous, routes queries to `query_rephraser_node` for up to **2 automated revision loops**.
* **`query_rephraser_node` (Query Expansion)**: Rewrites ambiguous multi-turn questions (e.g. *"Does it apply to contractors?"*) into self-contained search queries using recent conversation context.
* **`unsatisfactory_handler_node` (Fallback Guardrail)**: Safely outputs clean fallback notices when information is unavailable and automatically logs knowledge gaps for telemetry review.

---

### 2. Asynchronous Background Task Queue (Celery + Redis)
* Heavy document parsing (PyMuPDF), semantic chunking, Cohere embedding calls, and Pinecone vector upserts run inside dedicated **Celery background workers**.
* HTTP endpoints return in **< 10ms** with `task_id` and status `queued`.
* Real-time worker state transitions: `uploaded` $\rightarrow$ `processing` $\rightarrow$ `completed` / `failed`.
* **Asynchronous Workspace Teardown**: Deleting a workspace queues `delete_workspace_task`, which iteratively purges Cloudflare R2 files, Pinecone vector namespaces, PostgreSQL relational records (`files`, `messages`, `agent_traces`, `workspace`), and invalidates Redis cache keys with frontend polling and status toasts.

---

### 3. Resilient Rate Limiting & Quota Auto-Restoration
* **Customer Daily Upload Limit**: Sliding-window rate limiter (Redis ZSET) restricting uploads to 5 files per 24 hours per user.
* **Workspace Active File Cap**: Enforces a maximum of 5 active documents per workspace (`status != 'failed'`).
* **Atomic Quota Restoration**: If a Cloudflare R2 upload fails or background Celery ingestion encounters an error, the platform calls `/api/customer/refundUpload` to pop the consumed token (`ZPOPMAX`) from Redis, restoring the user's quota.

---

### 4. Page-Aware Document Chunking & Ingestion
* Semantic chunking with configurable chunk sizes and overlap.
* Every chunk is prepended with explicit metadata headers:
  ```text
  [Page 14] [File: Employee_Handbook.pdf] [Section: 3.2 Medical Leave]
  <extracted section content>
  ```
* Enables precise page-specific answers and exact source citations.

---

### 5. Universal 1-Line Embeddable Widget (`widget.v1.js`)
* Plug-and-play embed widget compatible with any framework:
  * **HTML / Static**: `<script src=".../widget.v1.js" data-workspace-id="..." async></script>`
  * **React**: `<FoxxNutsChatbot workspaceId="..." theme="dark" />`
  * **Next.js**: `<Script src=".../widget.v1.js" data-workspace-id="..." strategy="lazyOnload" />`
* **Domain CORS Whitelisting**: Allows workspace owners to configure authorized domains to prevent unauthorized third-party embedding.

---

### 6. Real-Time Observability & Knowledge Gap Telemetry
* **Live KPI Rate Cards**: Instantaneous **RPM** (Requests/Min), **TPM** (Tokens/Min), **RPD** (Requests/Day), and **TPD** (Tokens/Day).
* **Time-Series SVG Visualizations**: 60-minute real-time timeline and 30-day historical trend graphs.
* **Execution Trace Inspector**: Full audit trail of LangGraph node trajectories, latency per step, token counts, and retrieved context passages.
* **Knowledge Gap Detection**: Filters and highlights queries that returned `⚠️ Low Relevance` / `Context Found: false` to help teams improve documentation.

---

### 7. Modern Dashboard UI & Cyber Neon Aesthetics
* **Multi-Step Onboarding**: Guided workspace creation, document upload, and configuration wizard (`/onboarding`).
* **Knowledge Base Hub**: Document management with reprocess, filter, and delete controls (`/dashboard/knowledge`).
* **Visual Persona Customizer**: Live interactive preview for bot avatars, welcome greetings, screen docking, and brand colors (`/dashboard/configuration`).
* **Interactive Red Neon Cyber Animated Grid**: Dynamic canvas background with cursor illumination auras and subtle click ripples.
* **Universal Dark / Light Mode**: High-contrast, theme-tokenized interface across all pages and modals.

---

## 🛠️ Technology Stack

| Layer | Technologies |
| :--- | :--- |
| **Frontend UI & Dashboard** | Next.js 16 (App Router), React 19, TailwindCSS, TypeScript |
| **Backend API Service** | Python 3.11+, FastAPI, Uvicorn, AsyncIO |
| **Agent Orchestration** | LangGraph, LangChain, Cohere Embeddings (`embed-english-v3.0`) |
| **Task Queue & Broker** | Celery, Redis Broker |
| **Databases** | Supabase (PostgreSQL with RLS), Pinecone (Hybrid Index), Redis |
| **Object Storage** | Cloudflare R2 (S3-compatible storage with AWS SigV4 presigned URLs) |

---

## 📊 Database Schema Summary (PostgreSQL / Supabase)

* **`users`**: Customer profiles (`id`, `email`, `name`, `created_at`).
* **`workspace`**: Workspace settings (`id`, `cust_id`, `temperature`, `model_name`, `provider`, `system_prompt`, `similarity_threshold`, `chunk_size`, `chunk_overlap`, `allowed_domains`, `widget_color`, `widget_position`).
* **`messages`**: Session chat history (`id`, `session_id`, `workspace_id`, `sender_type`, `content`, `rating`).
* **`files`**: Uploaded file metadata & state (`id`, `file_id`, `file_name`, `file_path`, `status`, `error_message`).
* **`agent_traces`**: Observability execution records (`id`, `session_id`, `workspace_id`, `query`, `final_response`, `total_tokens`, `total_duration_ms`, `trajectory`, `query_context_pairs`, `query_type`).

---

## ⚙️ Environment Variables Contract

```ini
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Cloudflare R2 Storage
R2_BUCKET_NAME=your-bucket-name
R2_ACCOUNT_ID=your-account-id
R2_ACCESS_KEY_ID=your-access-key
R2_SECRET_ACCESS_KEY=your-secret-key

# Vector Database & LLM APIs
PINECONE_API_KEY=your-pinecone-api-key
PINECONE_INDEX=your-index-name
COHERE_API_KEY=your-cohere-api-key
GROQ_API_KEY=your-groq-api-key
OPENAI_API_KEY=your-openai-api-key

# Cache & Backend Secrets
REDIS_URL=redis://localhost:6379/0
FASTAPI_URL=http://127.0.0.1:8000
FASTAPI_SECRET_KEY=your-secret-api-key
```

---

## ⚡ How to Run the Development Environment

### 1. Start Redis Server
```bash
sudo service redis-server start
```

### 2. Start Celery Background Worker
```bash
cd rag-backend/server
celery -A app.celery_app worker --loglevel=info -P solo
```

### 3. Start FastAPI Backend Service
```bash
cd rag-backend/server
uvicorn app.main:app --reload --port 8000
```

### 4. Start Next.js Frontend Dashboard
```bash
cd client
npm run dev
```

Open **`http://localhost:3000`** in your browser.

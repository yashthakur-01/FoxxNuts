# Testing Patterns

**Analysis Date:** 2026-10-19

## Test Framework

**Current State:**
- **No automated test runner** is currently configured in the codebase.
- `client/package.json` does not include testing packages (e.g., Vitest, Jest, Playwright) or a `test` npm script.
- `rag-backend/server/requirements.txt` does not include Python test frameworks (e.g., `pytest`, `pytest-asyncio`, `httpx`).

**Ad-Hoc & Manual Test Scripts:**
- `rag-backend/server/setup_test_data.py`: Standalone Python script used to insert mock workspaces, seed files, and verify database connectivity.
- `rag-backend/temp/test_agent.py`: Standalone manual test script for exercising LangGraph execution trajectories.
- `rag-backend/temp/test.py`: Scratch script for testing document text extraction.

**Current Verification Commands:**
```bash
# Frontend Linting
npm run lint --prefix client

# Frontend Build Verification
npm run build --prefix client

# FastAPI Swagger & OpenAPI Interactive Docs
http://127.0.0.1:8000/docs
http://127.0.0.1:8000/openapi.json

# Ad-Hoc Setup & Sanity Test Script
python rag-backend/server/setup_test_data.py
```

## Recommended Test Architecture

To establish comprehensive automated test coverage, the following frameworks and structures should be adopted:

### 1. Frontend Test Stack (Recommended)
- **Runner:** Vitest (`vitest`) + React Testing Library (`@testing-library/react`, `@testing-library/jest-dom`)
- **Config:** `client/vitest.config.ts`
- **Location:** Collocated tests alongside source files (`*.test.tsx`, `*.test.ts`)
- **Mocking:** Vitest built-in `vi.mock` for `@supabase/ssr`, `ioredis`, and `@aws-sdk/client-s3`

### 2. Backend Test Stack (Recommended)
- **Runner:** Pytest (`pytest`) with `pytest-asyncio` for asynchronous endpoints and LangGraph nodes
- **HTTP Client:** `httpx` for testing FastAPI routes via `TestClient(app)`
- **Config:** `rag-backend/server/pytest.ini` or `pyproject.toml`
- **Location:** `rag-backend/server/tests/` directory with `test_routes/`, `test_engine/`, `test_tasks/`

## Mocking Strategy

When automated tests are implemented, external third-party services must be mocked to avoid network flakiness and cost:

**1. Supabase Client Mocking:**
- Mock `supabase.from(...).select(...).eq(...).execute()` and `supabase.auth.getUser()`.
- Ensure tests run with predictable mock user sessions and workspace records.

**2. Redis & In-Memory Store Mocking:**
- Frontend: Mock `client/src/lib/redisClient.ts` using `ioredis-mock`.
- Backend: Use `fakeredis` in Python to simulate Redis lists, sets, and expiring keys without requiring a live Redis daemon.

**3. External AI & Embedding APIs:**
- Mock Cohere embeddings (`embed-english-v3.0`) with static 1024-dimension float arrays.
- Mock Pinecone vector index queries (`index.query(...)` and `index.upsert(...)`).
- Mock LLM chat completions (`ChatOpenAI`, `ChatGoogleGenerativeAI`) with deterministic synthetic text streams.

**4. Cloudflare R2 / S3 Object Storage:**
- Mock `boto3.client("s3")` and `@aws-sdk/client-s3` with in-memory byte buffers or `moto` (for Python).

## Recommended Test Structure

### Frontend Component Test Pattern (Vitest + RTL)

```typescript
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import Button from '@/components/ui/Button';

describe('Button Primitive', () => {
  it('renders children and handles click events', () => {
    const handleClick = vi.fn();
    render(<Button onClick={handleClick}>Submit</Button>);

    const buttonEl = screen.getByRole('button', { name: /submit/i });
    expect(buttonEl).toBeInTheDocument();

    fireEvent.click(buttonEl);
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('renders loading spinner when loading prop is true', () => {
    render(<Button loading>Processing</Button>);
    expect(screen.getByRole('button')).toBeDisabled();
  });
});
```

### Backend Route Test Pattern (Pytest + FastAPI TestClient)

```python
import pytest
from fastapi.testclient import TestClient
from unittest.mock import patch, MagicMock
from app.main import app

client = TestClient(app)

def test_unauthorized_request_rejected():
    response = client.post("/api/chat", json={})
    assert response.status_code == 401
    assert "Unauthorized" in response.json()["message"]

@patch("app.routes.MessageRoute.get_cached_workspace_config")
def test_authorized_chat_endpoint_validates_payload(mock_config):
    mock_config.return_value = {"model_name": "test-model", "provider": "openai"}
    headers = {"X-API-Key": "test-secret-key"}
    response = client.post("/api/chat", json={"workspace_id": "test"}, headers=headers)
    assert response.status_code == 422  # Unprocessable Entity (missing required fields)
```

## Coverage Gaps & Testing Priorities

**High Priority (Critical Paths):**
1. **Next.js Edge Proxy & Rate Limiting:**
   - Verify that `client/src/lib/rateLimit.ts` accurately enforces sliding-window rate limits and returns HTTP 429 when quota is exhausted.
   - Verify that `client/src/proxy.ts` correctly redirects unauthenticated visitors from `/dashboard` to `/login`.
2. **FastAPI Authorization Middleware:**
   - Verify that calls without `X-API-Key` or with invalid secrets are immediately rejected with HTTP 401.
3. **LangGraph Router & Evaluation Cycle:**
   - Test that `conditional_router_node_1` routes greetings to `generic_response_node` without initiating vector searches.
   - Test that `response_evaluation_node` routes poor answers to `query_rephraser_node` up to the max retry limit.
4. **Celery Task Execution:**
   - Test `process_document_task` error handling when R2 download fails or document contains corrupted text.

**Medium Priority:**
1. **Telemetry & Observability Calculations:**
   - Unit test sliding-window aggregations for RPM, TPM, RPD, TPD in `client/src/app/api/customer/observability/metrics/route.ts`.
   - Test Knowledge Gap filtering logic in `gaps/route.ts`.
2. **Embed Widget Public Interface:**
   - Test origin header allowlisting and FAQ cache hit/miss behavior in `client/src/app/api/embed/sendMessage/route.ts`.

---

*Testing analysis: 2026-10-19*
*Update when test patterns change*

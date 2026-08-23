from fastapi import APIRouter
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from supabase_client.client import supabase
import asyncio

from app.tasks import process_document_task, reprocess_document_task, delete_document_task, delete_workspace_task
from app.celery_app import celery_app
from celery.result import AsyncResult

from app.helpers.cache import get_cached_workspace_config

class ProcessDocument(BaseModel):
    workspace_id: str
    customer_id: str
    fileName: str    

class DeleteWorkspace(BaseModel):
    workspace_id: str
    customer_id: str

router = APIRouter()

@router.post("/api/process-document")
async def process_document(
    body: ProcessDocument
):
    try: 
        workspace_data = await asyncio.to_thread(get_cached_workspace_config, body.workspace_id)
        chunk_size = workspace_data.get("chunk_size", 1024)
        chunk_overlap = workspace_data.get("chunk_overlap", 250)

        # Dispatch task to Celery & Redis task queue
        task = process_document_task.delay(
            file_name=body.fileName,
            chunk_size=chunk_size,
            chunk_overlap=chunk_overlap,
            customer_id=body.customer_id,
            workspace_id=body.workspace_id
        )

        return JSONResponse(
            status_code=200,
            content={
                "message": "Document background processing started",
                "task_id": task.id,
                "status": "queued",
                "success": True
            }
        )
    except Exception as e:
        print(f"Error occurred while queueing document processing for {body.fileName}: {e}")
        return JSONResponse(
            status_code=500,
            content={"message": f"Error occurred while queueing document - {str(e)}", "success": False}
        )


@router.post("/api/reprocess-document")
async def reprocess_document(
    body: ProcessDocument
):
    """Delete old embeddings from Pinecone and re-embed the document."""
    try:
        workspace_data = await asyncio.to_thread(get_cached_workspace_config, body.workspace_id)
        chunk_size = workspace_data.get("chunk_size", 1024)
        chunk_overlap = workspace_data.get("chunk_overlap", 250)

        # Dispatch reprocess task to Celery (deletes old vectors + re-embeds)
        task = reprocess_document_task.delay(
            file_name=body.fileName,
            chunk_size=chunk_size,
            chunk_overlap=chunk_overlap,
            customer_id=body.customer_id,
            workspace_id=body.workspace_id
        )

        return JSONResponse(
            status_code=200,
            content={
                "message": "Document reprocessing started (deleting old vectors + re-embedding)",
                "task_id": task.id,
                "status": "queued",
                "success": True
            }
        )
    except Exception as e:
        print(f"Error occurred while queueing document reprocessing for {body.fileName}: {e}")
        return JSONResponse(
            status_code=500,
            content={"message": f"Error occurred while queueing reprocess - {str(e)}", "success": False}
        )


@router.delete("/api/delete-document")
async def delete_document(
    body: ProcessDocument
):
    """Enqueue document vector deletion from Pinecone index as a Celery background task."""
    try:
        task = delete_document_task.delay(
            file_name=body.fileName,
            customer_id=body.customer_id,
            workspace_id=body.workspace_id
        )

        return JSONResponse(
            status_code=200,
            content={
                "message": "Document vector deletion task queued in background",
                "task_id": task.id,
                "status": "queued",
                "success": True
            }
        )
    except Exception as e:
        print(f"Error queueing document vector deletion for {body.fileName}: {e}")
        return JSONResponse(
            status_code=500,
            content={"message": f"Error queueing vector deletion - {str(e)}", "success": False}
        )


@router.post("/api/delete-workspace")
@router.delete("/api/delete-workspace")
async def delete_workspace(
    body: DeleteWorkspace
):
    """Enqueue background workspace deletion task (deletes files from R2, vectors from Pinecone, and rows from Supabase)."""
    try:
        task = delete_workspace_task.delay(
            customer_id=body.customer_id,
            workspace_id=body.workspace_id
        )

        return JSONResponse(
            status_code=200,
            content={
                "message": "Workspace deletion background task queued",
                "task_id": task.id,
                "status": "queued",
                "success": True
            }
        )
    except Exception as e:
        print(f"Error queueing workspace deletion for {body.workspace_id}: {e}")
        return JSONResponse(
            status_code=500,
            content={"message": f"Error queueing workspace deletion - {str(e)}", "success": False}
        )


@router.get("/api/task-status/{task_id}")
async def get_task_status(task_id: str):
    """Check status of an asynchronous Celery background task."""
    try:
        result = AsyncResult(task_id, app=celery_app)
        state = result.status # PENDING, STARTED, SUCCESS, FAILURE, RETRY
        is_ready = result.ready()
        is_successful = result.successful() if is_ready else False

        response_data = {
            "task_id": task_id,
            "status": state,
            "ready": is_ready,
            "successful": is_successful
        }

        if is_ready:
            if is_successful:
                response_data["result"] = result.result
            else:
                response_data["error"] = str(result.result)

        return JSONResponse(status_code=200, content=response_data)
    except Exception as e:
        print(f"Error querying task status for {task_id}: {e}")
        return JSONResponse(
            status_code=500,
            content={"error": f"Failed to retrieve task status - {str(e)}", "status": "ERROR", "ready": True, "successful": False}
        )
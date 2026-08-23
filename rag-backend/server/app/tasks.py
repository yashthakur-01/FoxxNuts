import asyncio
import importlib
import os
import boto3
import traceback
from app.celery_app import celery_app
from supabase_client.client import supabase
from datetime import datetime, timezone

def _update_file_status(file_name: str, status: str, error_msg: str = None):
    """Helper to update file status and updated_at in Supabase."""
    try:
        payload = {
            "status": status,
            "updated_at": datetime.now(timezone.utc).isoformat()
        }
        supabase.table("files") \
            .update(payload) \
            .eq("file_id", file_name) \
            .execute()
        print(f"📦 [Celery Worker] Supabase status updated to '{status}' for file: {file_name}")
    except Exception as db_err:
        print(f"⚠️ [Celery Worker] Warning: Failed to update Supabase status: {db_err}")

@celery_app.task(bind=True, max_retries=3)
def process_document_task(self, file_name: str, chunk_size: int, chunk_overlap: int, customer_id: str, workspace_id: str):
    """
    Celery background task for downloading, parsing, chunking, and embedding document files.
    """
    print("=" * 70)
    print(f"🚀 [Celery Worker] INGESTION STARTED | File: {file_name}")
    print(f"   Workspace: {workspace_id} | Customer: {customer_id}")
    print(f"   Chunk Size: {chunk_size} chars | Chunk Overlap: {chunk_overlap} chars")
    print("=" * 70)
    
    try:
        # Dynamically import embedding pipeline
        embedding_pipeline = importlib.import_module("app.controllers.1_embedding_pipeline")
        generate_embeddings_for_file = embedding_pipeline.generate_embeddings_for_file

        # Run async embedding function inside synchronous Celery worker thread
        asyncio.run(
            generate_embeddings_for_file(
                file_name=file_name,
                chunk_size=chunk_size,
                chunk_overlap=chunk_overlap,
                customerId=customer_id,
                workspaceId=workspace_id
            )
        )

        print(f"✅ [Celery Worker] Ingestion & vector indexing completed successfully for file: {file_name}")
        _update_file_status(file_name, "completed")

        return {
            "status": "completed",
            "file_name": file_name,
            "workspace_id": workspace_id
        }

    except Exception as exc:
        print("\n" + "❌" * 35)
        print(f"❌ [Celery Worker] INGESTION FAILED for file: {file_name}")
        print(f"   Error Type: {type(exc).__name__}")
        print(f"   Error Details: {exc}")
        print("   --- Stack Trace ---")
        print(traceback.format_exc())
        print("❌" * 35 + "\n")

        _update_file_status(file_name, "failed", str(exc))

        # Retry task if retry count remaining
        if self.request.retries < self.max_retries:
            print(f"🔄 [Celery Worker] Scheduling retry {self.request.retries + 1}/{self.max_retries} in 10s...")
            raise self.retry(exc=exc, countdown=10)
        else:
            print(f"⛔ [Celery Worker] Max retries ({self.max_retries}) exhausted for file: {file_name}")
            raise exc


@celery_app.task(bind=True, max_retries=3)
def reprocess_document_task(self, file_name: str, chunk_size: int, chunk_overlap: int, customer_id: str, workspace_id: str):
    """
    Celery background task that deletes existing Pinecone vectors for a file 
    and then re-embeds the document from scratch.
    """
    print("=" * 70)
    print(f"🔄 [Celery Worker] REPROCESSING STARTED | File: {file_name}")
    print(f"   Workspace: {workspace_id} | Customer: {customer_id}")
    print("=" * 70)
    
    try:
        embedding_pipeline = importlib.import_module("app.controllers.1_embedding_pipeline")
        delete_vectors_for_file = embedding_pipeline.delete_vectors_for_file
        generate_embeddings_for_file = embedding_pipeline.generate_embeddings_for_file

        # Step 1: Delete old embeddings from Pinecone
        print(f"🗑️ [Celery Worker] Deleting old Pinecone vectors for file: {file_name}")
        deleted = asyncio.run(delete_vectors_for_file(file_name))
        if not deleted:
            print(f"⚠️ [Celery Worker] Vector deletion returned false for {file_name}, proceeding with fresh embeddings...")

        # Step 2: Re-generate embeddings from R2 file
        print(f"⚡ [Celery Worker] Re-embedding file from R2: {file_name}")
        asyncio.run(
            generate_embeddings_for_file(
                file_name=file_name,
                chunk_size=chunk_size,
                chunk_overlap=chunk_overlap,
                customerId=customer_id,
                workspaceId=workspace_id
            )
        )

        print(f"✅ [Celery Worker] Reprocessing completed successfully for file: {file_name}")
        _update_file_status(file_name, "completed")

        return {
            "status": "completed",
            "file_name": file_name,
            "workspace_id": workspace_id,
            "action": "reprocessed"
        }

    except Exception as exc:
        print("\n" + "❌" * 35)
        print(f"❌ [Celery Worker] REPROCESS FAILED for file: {file_name}")
        print(f"   Error Type: {type(exc).__name__}")
        print(f"   Error Details: {exc}")
        print("   --- Stack Trace ---")
        print(traceback.format_exc())
        print("❌" * 35 + "\n")

        _update_file_status(file_name, "failed", str(exc))

        if self.request.retries < self.max_retries:
            print(f"🔄 [Celery Worker] Scheduling retry {self.request.retries + 1}/{self.max_retries} in 10s...")
            raise self.retry(exc=exc, countdown=10)
        else:
            raise exc


@celery_app.task(bind=True, max_retries=3)
def delete_document_task(self, file_name: str, customer_id: str, workspace_id: str):
    """
    Celery background task for deleting vector embeddings from Pinecone index.
    """
    print("=" * 70)
    print(f"🗑️ [Celery Worker] DELETE TASK STARTED | File: {file_name} (Workspace: {workspace_id})")
    print("=" * 70)
    try:
        embedding_pipeline = importlib.import_module("app.controllers.1_embedding_pipeline")
        delete_vectors_for_file = embedding_pipeline.delete_vectors_for_file

        deleted = asyncio.run(delete_vectors_for_file(file_name))
        if deleted:
            print(f"✅ [Celery Worker] Successfully deleted all vectors for file: {file_name}")
        else:
            print(f"⚠️ [Celery Worker] Vector deletion returned false for file: {file_name}")

        return {
            "status": "deleted",
            "file_name": file_name,
            "workspace_id": workspace_id
        }

    except Exception as exc:
        print("\n" + "❌" * 35)
        print(f"❌ [Celery Worker] VECTOR DELETION FAILED for file: {file_name}")
        print(f"   Error Type: {type(exc).__name__}")
        print(f"   Error Details: {exc}")
        print("   --- Stack Trace ---")
        print(traceback.format_exc())
        print("❌" * 35 + "\n")
        raise self.retry(exc=exc, countdown=10)


@celery_app.task(bind=True, max_retries=1)
def delete_workspace_task(self, customer_id: str, workspace_id: str):
    """
    Celery background task for deleting an entire workspace:
    1. Fetches all files associated with the workspace from Supabase.
    2. Deletes each file one-by-one:
       a. From Cloudflare R2 bucket
       b. Vector embeddings from Pinecone
       c. Database row from Supabase 'files' table
    3. If any file deletion fails due to an error, raises exception to mark task as failed.
    4. If all files succeed, deletes messages, traces, and workspace row from Supabase.
    5. Purges Redis cache.
    """
    print("=" * 70)
    print(f"🗑️ [Celery Worker] WORKSPACE DELETION STARTED | Workspace: {workspace_id}")
    print(f"   Customer: {customer_id}")
    print("=" * 70)

    try:
        # Step 1: Fetch all files from Supabase for this workspace
        res = supabase.table("files").select("id, file_id, file_name, file_path").eq("workspace_id", workspace_id).execute()
        files = res.data or []
        print(f"📋 [Celery Worker] Found {len(files)} files to delete for workspace: {workspace_id}")

        # Setup S3 / R2 client
        endpoint_url = os.environ.get("R2_ENDPOINT_URL")
        bucket_name = os.environ.get("R2_BUCKET_NAME")
        access_key_id = os.environ.get("R2_ACCESS_KEY_ID")
        secret_access_key = os.environ.get("R2_SECRET_ACCESS_KEY")

        s3_client = None
        if endpoint_url and bucket_name and access_key_id and secret_access_key:
            s3_client = boto3.client(
                "s3",
                endpoint_url=endpoint_url,
                aws_access_key_id=access_key_id,
                aws_secret_access_key=secret_access_key
            )

        embedding_pipeline = importlib.import_module("app.controllers.1_embedding_pipeline")
        delete_vectors_for_file = embedding_pipeline.delete_vectors_for_file
        delete_vectors_for_workspace = getattr(embedding_pipeline, "delete_vectors_for_workspace", None)

        # Step 2: Delete files one by one (R2 -> Pinecone -> Supabase file row)
        for idx, file_item in enumerate(files, start=1):
            file_id = file_item.get("file_id")
            file_path = file_item.get("file_path") or f"users/{customer_id}/{workspace_id}/{file_id}"
            file_name = file_item.get("file_name", file_id)

            print(f"  ↳ [{idx}/{len(files)}] Processing deletion for file: '{file_name}' (ID: {file_id})...")

            # 2a. Delete from Cloudflare R2
            if s3_client and bucket_name:
                try:
                    s3_client.delete_object(Bucket=bucket_name, Key=file_path)
                    print(f"    ✔ Deleted from R2: {file_path}")
                except Exception as r2_err:
                    print(f"    ❌ Failed to delete from R2: {file_path} - {r2_err}")
                    raise RuntimeError(f"Failed to delete file '{file_name}' from R2 storage: {r2_err}")

            # 2b. Delete vectors from Pinecone
            try:
                deleted_vec = asyncio.run(delete_vectors_for_file(file_id))
                if not deleted_vec:
                    print(f"    ⚠️ Warning: Pinecone vector deletion reported False for: {file_id}")
                else:
                    print(f"    ✔ Deleted vectors from Pinecone for: {file_id}")
            except Exception as vec_err:
                print(f"    ❌ Failed to delete Pinecone vectors for file {file_id}: {vec_err}")
                raise RuntimeError(f"Failed to delete vectors for '{file_name}': {vec_err}")

            # 2c. Delete Supabase entry for this individual file as requested
            try:
                supabase.table("files").delete().eq("file_id", file_id).execute()
                print(f"    ✔ Deleted DB entry in Supabase 'files' table for: {file_id}")
            except Exception as db_file_err:
                print(f"    ❌ Failed to delete DB entry for file {file_id}: {db_file_err}")
                raise RuntimeError(f"Failed to delete database entry for file '{file_name}': {db_file_err}")

        # Sweep any residual vectors for this workspace in Pinecone
        if delete_vectors_for_workspace:
            try:
                asyncio.run(delete_vectors_for_workspace(workspace_id))
            except Exception as e:
                print(f"⚠️ Warning: Bulk Pinecone sweep for workspace {workspace_id} returned: {e}")

        # Step 3: Delete remaining workspace DB entries
        print(f"🗑️ [Celery Worker] Deleting remaining database records for workspace: {workspace_id}...")
        supabase.table("files").delete().eq("workspace_id", workspace_id).execute()
        supabase.table("messages").delete().eq("workspace_id", workspace_id).execute()
        supabase.table("agent_traces").delete().eq("workspace_id", workspace_id).execute()
        supabase.table("workspace").delete().eq("id", workspace_id).execute()

        # Step 4: Purge Redis cache
        try:
            from app.helpers.cache import redis_client
            if redis_client:
                redis_client.delete(f"workspace_config:{workspace_id}")
                redis_client.delete(f"observability_metrics:{workspace_id}")
                trace_keys = redis_client.smembers(f"workspace_trace_keys:{workspace_id}")
                if trace_keys:
                    redis_client.delete(*trace_keys)
                redis_client.delete(f"workspace_trace_keys:{workspace_id}")
                print(f"⚡ [Celery Worker] Purged Redis cache for workspace: {workspace_id}")
        except Exception as cache_err:
            print(f"⚠️ Warning: Redis cache cleanup failed: {cache_err}")

        print(f"✅ [Celery Worker] WORKSPACE DELETION COMPLETED SUCCESSFULLY | Workspace: {workspace_id}")
        return {
            "status": "completed",
            "workspace_id": workspace_id,
            "deleted_files_count": len(files),
            "message": f"Successfully deleted workspace and {len(files)} files"
        }

    except Exception as exc:
        print("\n" + "❌" * 35)
        print(f"❌ [Celery Worker] WORKSPACE DELETION FAILED for workspace: {workspace_id}")
        print(f"   Error Type: {type(exc).__name__}")
        print(f"   Error Details: {exc}")
        print("   --- Stack Trace ---")
        print(traceback.format_exc())
        print("❌" * 35 + "\n")
        raise exc


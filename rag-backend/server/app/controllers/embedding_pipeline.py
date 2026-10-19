from dotenv import load_dotenv
# pyrefly: ignore [missing-import]
from langchain_cohere import CohereEmbeddings
from langchain_core.documents import Document
import boto3
from typing import Any
import traceback
from langchain_community.retrievers import PineconeHybridSearchRetriever

class CustomPineconeHybridSearchRetriever(PineconeHybridSearchRetriever):
    filter_dict: dict | None = None
    
    def _get_relevant_documents(self, query: str, *, run_manager, **kwargs: Any):
        if self.filter_dict:
            kwargs["filter"] = self.filter_dict
        return super()._get_relevant_documents(query, run_manager=run_manager, **kwargs)

# pyrefly: ignore [missing-import]
from pinecone import Pinecone
import time
import os
import asyncio
from app.controllers.main import main
# pyrefly: ignore [missing-import]
from pinecone_text.sparse import BM25Encoder

load_dotenv()

# Global cached singleton for BM25 and embeddings to avoid slow remote downloads on every call
_CACHED_BM25_ENCODER = None
_CACHED_EMBEDDING_MODEL = None

def get_embedding_model():
    global _CACHED_EMBEDDING_MODEL
    if _CACHED_EMBEDDING_MODEL is not None:
        return _CACHED_EMBEDDING_MODEL
        
    cohere_api = os.environ.get("COHERE_API_KEY")
    cohere_model = os.environ.get("COHERE_MODEL", "embed-english-v3.0")
    if not cohere_api:
        raise ValueError("COHERE_API_KEY environment variable is missing or empty.")
    print(f"  [Embeddings Init] Initializing CohereEmbeddings (model={cohere_model})...")
    _CACHED_EMBEDDING_MODEL = CohereEmbeddings(cohere_api_key=cohere_api, model=cohere_model)
    return _CACHED_EMBEDDING_MODEL

def get_bm25_encoder():
    global _CACHED_BM25_ENCODER
    if _CACHED_BM25_ENCODER is not None:
        return _CACHED_BM25_ENCODER
    
    print("  [BM25 Init] Initializing BM25Encoder...")
    t0 = time.time()
    try:
        # Try loading default params, or fallback to standard BM25Encoder if remote download hangs
        encoder = BM25Encoder().default()
        print(f"  [BM25 Init] BM25Encoder.default() loaded in {time.time() - t0:.2f}s")
    except Exception as bm25_err:
        print(f"  ⚠️ [BM25 Init] Failed to load remote default BM25 model ({bm25_err}), falling back to local BM25Encoder...")
        encoder = BM25Encoder()
    _CACHED_BM25_ENCODER = encoder
    return _CACHED_BM25_ENCODER

def get_vector_store(top_k: int = 5, filter: dict = None):
    pinecone_api = os.environ.get("PINECONE_API_KEY")
    index_name = os.environ.get("PINECONE_INDEX")
    if not pinecone_api or not index_name:
        raise ValueError("PINECONE_API_KEY or PINECONE_INDEX environment variable is missing or empty.")
    try: 
        print(f"  [Vector Store Init] Connecting to Pinecone index '{index_name}'...")
        t0 = time.time()
        embedding = get_embedding_model() 
        encoder = get_bm25_encoder()
        
        pc = Pinecone(api_key=pinecone_api)
        index = pc.Index(index_name)
        print(f"  [Vector Store Init] Pinecone index ready in {time.time() - t0:.2f}s")
    except Exception as e:
        print(f"❌ [Vector Store Init Error] Failed to initialize PineconeHybridSearchRetriever: {e}")
        print(traceback.format_exc())
        raise ValueError(f"Error occurred while initializing PineconeHybridSearchRetriever: {e}")
        
    return CustomPineconeHybridSearchRetriever(embeddings=embedding, sparse_encoder=encoder, index=index, top_k=top_k, filter_dict=filter)


async def store_docs(docs: list[Document]) -> None:
    vc = get_vector_store()
    batch_size = int(os.environ.get("BATCH_SIZE", 80))
    delay = float(os.environ.get("TIME_SLEEP", 30))
    total_batches = (len(docs) + batch_size - 1) // batch_size
    print(f"📦 [Embedding Pipeline] Storing {len(docs)} document chunks in Pinecone across {total_batches} batch(es)...")

    for i in range(0, len(docs), batch_size):
        batch = docs[i:i + batch_size]
        batch_num = (i // batch_size) + 1
        
        texts = [doc.page_content for doc in batch]
        metadatas = [doc.metadata for doc in batch]
        
        print(f"  ↳ [Batch {batch_num}/{total_batches}] Uploading {len(batch)} chunks (indices {i} to {i + len(batch) - 1})...")
        try:
            await asyncio.to_thread(vc.add_texts, texts=texts, metadatas=metadatas)
            print(f"  ✔ [Batch {batch_num}/{total_batches}] Successfully upserted to Pinecone.")
        except Exception as e:
            print(f"⚠️ [Batch {batch_num}/{total_batches}] First attempt failed: {e}")
            print(f"   Retrying batch {batch_num} after 10s delay...")
            await asyncio.sleep(10)
            
            try:
                await asyncio.to_thread(vc.add_texts, texts=texts, metadatas=metadatas)
                print(f"  ✔ [Batch {batch_num}/{total_batches}] Retry successful. Upserted to Pinecone.")
            except Exception as retry_e:
                print(f"❌ [Batch {batch_num}/{total_batches}] FATAL: Retry failed for batch {batch_num}: {retry_e}")
                print(traceback.format_exc())
                raise RuntimeError(f"Failed to upsert batch {batch_num} to Pinecone: {retry_e}")
            
        if batch_num < total_batches:
            print(f"  ⏳ Waiting {delay}s rate-limit pause before next batch...")
            await asyncio.sleep(delay)
        
    print(f"✅ [Embedding Pipeline] All {len(docs)} chunks successfully stored in Pinecone.")
    
    
async def get_docs_from_file(key: str, chunk_size: int, chunk_overlap: int) -> list[Document] | None:
    endpoint_url = os.environ.get("R2_ENDPOINT_URL")
    bucket_name = os.environ.get("R2_BUCKET_NAME")
    access_key_id = os.environ.get("R2_ACCESS_KEY_ID")
    secret_access_key = os.environ.get("R2_SECRET_ACCESS_KEY")
    if not endpoint_url or not bucket_name or not access_key_id or not secret_access_key:
        raise ValueError("Cloudflare R2 credentials (R2_ENDPOINT_URL, R2_BUCKET_NAME, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY) missing in environment.")
    
    print(f"📥 [R2 Ingestion] Downloading object from R2: '{key}' (Bucket: '{bucket_name}')...")
    docs = None
    try: 
        s3_client = boto3.client(
            "s3",
            endpoint_url=endpoint_url,
            aws_access_key_id=access_key_id,
            aws_secret_access_key=secret_access_key
        )
        
        r2_object = await asyncio.to_thread(s3_client.get_object, Bucket=bucket_name, Key=key)
        file_bytes = r2_object['Body'].read()
        print(f"  ✔ [R2 Ingestion] Downloaded {len(file_bytes)} bytes successfully.")

        import tempfile
        filename = key.split("/")[-1]
        temp_file_path = os.path.join(tempfile.gettempdir(), filename)
        with open(temp_file_path, "wb") as f:
            f.write(file_bytes)
        
        print(f"📄 [PDF Parsing] Extracting & chunking PDF: '{filename}' (chunk_size={chunk_size}, overlap={chunk_overlap})...")
        docs = await asyncio.to_thread(
            main, pdf_path=temp_file_path, chunk_size_tokens=chunk_size, chunk_overlap_tokens=chunk_overlap, pymupdf_pages_per_window=10
        )
        
        if os.path.exists(temp_file_path):
            os.remove(temp_file_path)

        print(f"  ✔ [PDF Parsing] Generated {len(docs) if docs else 0} structured text chunks.")

    except Exception as e:
        print(f"❌ [R2 / Parsing Error] Failed to process document '{key}': {e}")
        print(traceback.format_exc())
        raise e
        
    return docs

async def generate_embeddings_for_file(file_name: str, chunk_size: int, chunk_overlap: int, customerId: str, workspaceId: str) -> None:
    print(f"🚀 [Embedding Pipeline] Processing file: {file_name} for Workspace: {workspaceId}")
    try: 
        key = f"users/{customerId}/{workspaceId}/{file_name}"
        docs: list[Document] | None = await get_docs_from_file(key, chunk_size, chunk_overlap)
        if not docs:
            raise ValueError(f"No document chunks could be extracted for file '{file_name}'.")
        
        for item in docs:
            item.metadata["fileName"] = file_name
            item.metadata["customerId"] = customerId
            item.metadata["workspaceId"] = workspaceId
            
            # Ensure file name & page are prepended to chunk text
            if not item.page_content.startswith("["):
                page_info = item.metadata.get("page_window") or item.metadata.get("page", 1)
                item.page_content = f"[Page {page_info}] [File: {file_name}]\n{item.page_content}"
            elif "[File:" not in item.page_content:
                item.page_content = f"[File: {file_name}] {item.page_content}"
        
        await store_docs(docs)
        print(f"✅ [Embedding Pipeline] Completed embedding pipeline for file: {file_name}")
        return        
        
    except Exception as e:
        print(f"❌ [Embedding Pipeline Error] Failed to generate embeddings for '{file_name}': {e}")
        print(traceback.format_exc())
        raise e


async def delete_vectors_for_file(file_name: str) -> bool:
    """Delete all vectors from Pinecone that match the given fileName metadata."""
    pinecone_api = os.environ.get("PINECONE_API_KEY")
    index_name = os.environ.get("PINECONE_INDEX")
    if not pinecone_api or not index_name:
        raise ValueError("PINECONE_API_KEY or PINECONE_INDEX environment variable is missing.")
    
    try:
        pc = Pinecone(api_key=pinecone_api)
        index = pc.Index(index_name)
        
        # List and delete vectors by metadata filter
        await asyncio.to_thread(
            index.delete,
            filter={"fileName": {"$eq": file_name}}
        )
        print(f"✅ [Embedding Pipeline] Deleted all Pinecone vectors for file: {file_name}")
        return True
    except Exception as e:
        print(f"❌ [Embedding Pipeline Error] Error deleting vectors for file {file_name}: {e}")
        print(traceback.format_exc())
        return False


async def delete_vectors_for_workspace(workspace_id: str) -> bool:
    """Delete all vectors from Pinecone that match the given workspaceId metadata."""
    pinecone_api = os.environ.get("PINECONE_API_KEY")
    index_name = os.environ.get("PINECONE_INDEX")
    if not pinecone_api or not index_name:
        raise ValueError("PINECONE_API_KEY or PINECONE_INDEX environment variable is missing.")
    
    try:
        pc = Pinecone(api_key=pinecone_api)
        index = pc.Index(index_name)
        
        await asyncio.to_thread(
            index.delete,
            filter={"workspaceId": {"$eq": workspace_id}}
        )
        print(f"✅ [Embedding Pipeline] Deleted all Pinecone vectors for workspace: {workspace_id}")
        return True
    except Exception as e:
        print(f"❌ [Embedding Pipeline Error] Error deleting vectors for workspace {workspace_id}: {e}")
        print(traceback.format_exc())
        return False

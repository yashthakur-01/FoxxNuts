import time
from typing import Literal
from dotenv import load_dotenv
import os
import traceback

from app.controllers.embedding_pipeline import query_pinecone_hybrid

load_dotenv()

async def fetch_context_from_vector_db(query: str, customerId: str, workspaceId: str, top_k: int = 5, similarity_threshold: float = 0.6) -> str:
    t0 = time.time()
    fetch_k = top_k + 8
    filter_dict = {"customerId": customerId, "workspaceId": workspaceId}
    
    print(f"  ↳ [Hybrid Search] Querying Pinecone directly for: '{query}'...")
    try:
        t_search = time.time()
        raw_docs = await query_pinecone_hybrid(
            query=query,
            top_k=fetch_k,
            filter=filter_dict
        )
        print(f"  ↳ [Hybrid Search] Retrieved {len(raw_docs)} docs directly from Pinecone in {time.time() - t_search:.2f}s")
    except Exception as direct_err:
        print(f"❌ [Vector Search Error] Direct Pinecone query failed: {direct_err}")
        print(traceback.format_exc())
        return ""

    relevant_docs = []
    jina_api_key = os.getenv("JINA_API_KEY")

    if jina_api_key and raw_docs:
        try:
            from langchain_community.document_compressors import JinaRerank
            
            reranker = JinaRerank(
                jina_api_key=jina_api_key, 
                model="jina-reranker-v2-base-multilingual", 
                top_n=top_k
            )
            print(f"  ↳ [Reranker] Reranking {len(raw_docs)} candidate chunks with Jina...")
            t_rerank = time.time()
            relevant_docs = await reranker.acompress_documents(documents=raw_docs, query=query)
            print(f"  ↳ [Reranker] Jina reranked to {len(relevant_docs)} docs in {time.time() - t_rerank:.2f}s")
        except Exception as jina_err:
            print(f"⚠️ [Jina Rerank Warning] Jina reranker failed ({jina_err}), using direct Pinecone ranking...")
            relevant_docs = raw_docs[:top_k]
    else:
        relevant_docs = raw_docs[:top_k]
    
    # Filter retrieved docs by similarity/relevance score threshold
    filtered_docs = []
    for doc in relevant_docs:
        score = doc.metadata.get("relevance_score", 1.0)
        if score >= similarity_threshold:
            filtered_docs.append(doc.page_content)
        else:
            print(f"  ↳ [Threshold Filter] Skipped chunk with score {score:.2f} < threshold {similarity_threshold}")
    
    if not filtered_docs:
        print(f"  ↳ [Context Result] No chunks matched threshold {similarity_threshold} (total retrieved: {len(relevant_docs)}) in {time.time() - t0:.2f}s")
        return ""

    context = "\n\n".join(filtered_docs)
    print(f"  ↳ [Context Result] Returning {len(filtered_docs)} chunks ({len(context)} chars) in {time.time() - t0:.2f}s")
    return context


    
    